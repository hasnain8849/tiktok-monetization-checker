"""Kick off generate_variants on the dashboard screen and save result to JSON."""
import json
import http.client
import ssl
import sys
import time

API_KEY = "STITCH_API_KEY_PLACEHOLDER"
PROJECT_ID = "14916947932805577916"
ctx = ssl.create_default_context()

def call(method, params=None, id_=1, timeout=900):
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

call("initialize", {
    "protocolVersion": "2024-11-05",
    "capabilities": {},
    "clientInfo": {"name": "variants-bg", "version": "0.0.1"},
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

# Generate 2 REIMAGINE variants on the landing page (the most impactful screen)
result = {"started_at": time.time()}
try:
    out = call("tools/call", {
        "name": "generate_variants",
        "arguments": {
            "projectId": PROJECT_ID,
            "prompt": "Generate two REIMAGINE variants of this landing page with a fundamentally different layout — e.g. a centered hero with a 3D tilted phone, or a split-screen with the input on the left and a live results demo on the right. Keep the TikTok brand colors (cyan #00f2fe and magenta #fe2c55) but explore new typography hierarchy and visual rhythm.",
            "selectedScreenIds": ["2cb1f8ce93e740acbad95892242efee7"],
            "variantOptions": {
                "creativeRange": "REIMAGINE",
                "variantCount": 2,
                "aspects": ["LAYOUT", "COLOR_SCHEME"]
            }
        }
    }, id_=2, timeout=900)
    result["response"] = out
    result["status"] = "ok" if not out.get("result", {}).get("isError") else "error"
except Exception as e:
    result["status"] = "exception"
    result["exception"] = str(e)
result["ended_at"] = time.time()

with open("/home/z/my-project/scripts/stitch_results/variants.json", "w") as f:
    json.dump(result, f, indent=2)
print(f"[done] status={result['status']}", flush=True)
