"""Probe the Stitch MCP server to discover its tools."""
import json
import http.client
import ssl

ctx = ssl.create_default_context()
conn = http.client.HTTPSConnection("stitch.googleapis.com", context=ctx, timeout=25)

API_KEY = "STITCH_API_KEY_PLACEHOLDER"
headers = {
    "Content-Type": "application/json",
    "Accept": "application/json, text/event-stream",
    "X-Goog-Api-Key": API_KEY,
}

def call(method, params=None, id_=1):
    payload = {
        "jsonrpc": "2.0",
        "id": id_,
        "method": method,
    }
    if params is not None:
        payload["params"] = params
    body = json.dumps(payload)
    print(f"\n>>> {method} ({body[:200]})")
    conn.request("POST", "/mcp", body=body, headers=headers)
    resp = conn.getresponse()
    print(f"<<< status={resp.status} reason={resp.reason}")
    print(f"<<< headers: {dict(resp.headers)}")
    data = resp.read()
    print(f"<<< body length={len(data)}")
    print(f"<<< body: {data[:3000].decode('utf-8', errors='replace')}")
    return resp, data

# 1) initialize
call("initialize", {
    "protocolVersion": "2024-11-05",
    "capabilities": {},
    "clientInfo": {"name": "probe", "version": "0.0.1"},
}, id_=1)

# 2) initialized notification (no id)
print("\n>>> notifications/initialized")
conn.request("POST", "/mcp",
             body=json.dumps({"jsonrpc": "2.0", "method": "notifications/initialized"}),
             headers=headers)
resp = conn.getresponse()
print(f"<<< status={resp.status} body={resp.read()[:500]}")

# 3) list tools
call("tools/list", {}, id_=2)
