import { createServer } from "http";
import { Server } from "socket.io";

const httpServer = createServer();
const io = new Server(httpServer, {
  // DO NOT change the path — Caddy uses it to forward to this port.
  path: "/",
  cors: { origin: "*", methods: ["GET", "POST"] },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Each socket joins a room keyed by the handle they're waiting on (e.g.
// "wait:prankzlife"). When the broadcast-payment event arrives from the
// Next.js app's /api/payments/webhook (or any other admin route), we emit
// to that room and the waiting client immediately transitions.

io.on("connection", (socket) => {
  console.log(`[socket] connected: ${socket.id}`);

  // Client subscribes for updates on a specific handle.
  socket.on("subscribe", (data: { handle?: string }) => {
    const handle = (data?.handle ?? "").trim().toLowerCase().replace(/^@/, "");
    if (!handle) return;
    socket.join(`wait:${handle}`);
    console.log(`[socket] ${socket.id} subscribed to wait:${handle}`);
  });

  socket.on("unsubscribe", (data: { handle?: string }) => {
    const handle = (data?.handle ?? "").trim().toLowerCase().replace(/^@/, "");
    if (!handle) return;
    socket.leave(`wait:${handle}`);
    console.log(`[socket] ${socket.id} unsubscribed from wait:${handle}`);
  });

  // HTTP webhook callers POST to /broadcast with { handle, status, attemptId }
  // to fan out to all subscribers waiting on that handle.
  socket.on("disconnect", () => {
    console.log(`[socket] disconnected: ${socket.id}`);
  });
});

// Simple HTTP endpoint on the same port: POST / with { handle, status, attemptId }
// will emit a "payment-update" event to all sockets in room "wait:<handle>".
// Used by the Next.js app's /api/payments/route.ts after verifyPaymentInternal
// and by the /api/admin/payments/[id] route after manual verify/reject.
httpServer.on("request", (req, res) => {
  if (req.method !== "POST") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("payment-notifier ws service");
    return;
  }
  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", () => {
    try {
      const data = JSON.parse(body || "{}");
      const handle = (data.handle ?? "").trim().toLowerCase().replace(/^@/, "");
      const status = data.status ?? "verified";
      const attemptId = data.attemptId ?? null;
      if (!handle) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "handle required" }));
        return;
      }
      io.to(`wait:${handle}`).emit("payment-update", {
        handle: `@${handle}`,
        status,
        attemptId,
        at: new Date().toISOString(),
      });
      console.log(
        `[broadcast] payment-update to wait:${handle} status=${status} attemptId=${attemptId}`
      );
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, broadcast: true }));
    } catch (e) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "invalid JSON" }));
    }
  });
});

// Mini-service must use a fixed port. 3003 chosen to match the websocket example.
const PORT = 3003;
httpServer.listen(PORT, () => {
  console.log(`[payment-notifier] WebSocket + HTTP service running on port ${PORT}`);
});

process.on("SIGTERM", () => {
  console.log("[payment-notifier] SIGTERM, shutting down...");
  httpServer.close(() => process.exit(0));
});
process.on("SIGINT", () => {
  console.log("[payment-notifier] SIGINT, shutting down...");
  httpServer.close(() => process.exit(0));
});
