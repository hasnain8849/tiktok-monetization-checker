"""Poll Stitch list_screens until at least N screens exist, then dump them all."""
import json
import http.client
import ssl
import sys
import time

API_KEY = "STITCH_API_KEY_PLACEHOLDER"
PROJECT_ID = "8827963556755951549"
ctx = ssl.create_default_context()

def call(method, params=None, id_=1, timeout=60):
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
    "clientInfo": {"name": "poll", "version": "0.0.1"},
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

target = int(sys.argv[1]) if len(sys.argv) > 1 else 1
max_attempts = int(sys.argv[2]) if len(sys.argv) > 2 else 30
delay = int(sys.argv[3]) if len(sys.argv) > 3 else 15

for attempt in range(1, max_attempts + 1):
    print(f"[{attempt}/{max_attempts}] listing screens...")
    try:
        result = call("tools/call", {
            "name": "list_screens",
            "arguments": {"projectId": PROJECT_ID}
        }, id_=attempt + 100, timeout=30)
        sc = result.get("result", {}).get("structuredContent", {})
        screens = sc.get("screens", [])
        print(f"  screens so far: {len(screens)}")
        if len(screens) >= target:
            print(json.dumps(screens, indent=2)[:3000])
            sys.exit(0)
    except Exception as e:
        print(f"  error: {e}")
    time.sleep(delay)

print("Timed out waiting for screens")
sys.exit(1)
