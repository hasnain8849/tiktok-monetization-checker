"""Generate a Stitch screen and write the result to a JSON file.

Designed to run as a long-running background process. The result is written to
{output_path} as JSON. If the request fails or times out, an error object is written.
The generation may still succeed server-side even if this client request fails.
"""
import json
import http.client
import ssl
import sys
import time

API_KEY = "STITCH_API_KEY_PLACEHOLDER"
PROJECT_ID = "8827963556755951549"
ctx = ssl.create_default_context()

def call(method, params=None, id_=1, timeout=600):
    conn = http.client.HTTPSConnection("stitch.googleapis.com", context=ctx, timeout=timeout)
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
        "X-Goog-Api-Key": API_KEY,
    }
    payload = {"jsonrpc": "2.0", "id": id_, "method": method}
    if params is not None:
        payload["params"] = params
    conn.request("POST", "/mcp", body=json.dumps(payload), headers=headers)
    resp = conn.getresponse()
    data = resp.read()
    conn.close()
    return json.loads(data)

prompt = sys.argv[1]
device = sys.argv[2] if len(sys.argv) > 2 else "DESKTOP"
output_path = sys.argv[3] if len(sys.argv) > 3 else "/tmp/stitch_result.json"

# init
call("initialize", {
    "protocolVersion": "2024-11-05",
    "capabilities": {},
    "clientInfo": {"name": "stitch-bg", "version": "0.0.1"},
}, id_=1)
conn = http.client.HTTPSConnection("stitch.googleapis.com", context=ctx, timeout=30)
conn.request("POST", "/mcp",
             body=json.dumps({"jsonrpc": "2.0", "method": "notifications/initialized"}),
             headers={
                 "Content-Type": "application/json",
                 "Accept": "application/json, text/event-stream",
                 "X-Goog-Api-Key": API_KEY,
             })
conn.getresponse().read()
conn.close()

result = {"started_at": time.time(), "device": device, "prompt_preview": prompt[:200]}
try:
    out = call("tools/call", {
        "name": "generate_screen_from_text",
        "arguments": {
            "projectId": PROJECT_ID,
            "prompt": prompt,
            "deviceType": device,
        }
    }, id_=2, timeout=900)
    result["response"] = out
    result["status"] = "ok" if not out.get("result", {}).get("isError") else "error"
except Exception as e:
    result["status"] = "exception"
    result["exception"] = str(e)
result["ended_at"] = time.time()

with open(output_path, "w") as f:
    json.dump(result, f, indent=2)
print(f"[done] status={result['status']} written to {output_path}", flush=True)
