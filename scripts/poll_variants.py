"""Poll list_screens for the Companion Web Page Stitch project
to discover any newly-generated variant screens.
"""
import json, http.client, ssl, time, sys
API_KEY = "STITCH_API_KEY_PLACEHOLDER"
PROJECT_ID = "14916947932805577916"
ctx = ssl.create_default_context()

def call(method, params=None, id_=1, timeout=30):
    conn = http.client.HTTPSConnection("stitch.googleapis.com", context=ctx, timeout=timeout)
    headers = {"Content-Type": "application/json", "Accept": "application/json, text/event-stream", "X-Goog-Api-Key": API_KEY}
    payload = {"jsonrpc": "2.0", "id": id_, "method": method}
    if params: payload["params"] = params
    conn.request("POST", "/mcp", body=json.dumps(payload), headers=headers)
    data = conn.getresponse().read()
    conn.close()
    return json.loads(data)

call("initialize", {"protocolVersion": "2024-11-05", "capabilities": {}, "clientInfo": {"name": "poll-v", "version": "0.0.1"}}, id_=1)
conn = http.client.HTTPSConnection("stitch.googleapis.com", context=ctx, timeout=30)
conn.request("POST", "/mcp", body=json.dumps({"jsonrpc": "2.0", "method": "notifications/initialized"}), headers={"Content-Type": "application/json", "Accept": "application/json, text/event-stream", "X-Goog-Api-Key": API_KEY})
conn.getresponse().read()
conn.close()

print("Polling for screens (was 7, looking for new variant screens)...")
for attempt in range(1, 12):
    try:
        r = call("tools/call", {"name": "list_screens", "arguments": {"projectId": PROJECT_ID}}, id_=attempt+10, timeout=30)
        screens = r.get("result", {}).get("structuredContent", {}).get("screens", [])
        print(f"[{attempt}/11] screens: {len(screens)}")
        if len(screens) > 7:
            print("New screen(s) detected!")
            for s in screens:
                print(f"  - {s.get('name')} | {s.get('title')!r} | {s.get('deviceType')}")
            with open("/home/z/my-project/scripts/stitch_results/screens_after_variants.json", "w") as f:
                json.dump(screens, f, indent=2)
            sys.exit(0)
    except Exception as e:
        print(f"  error: {e}")
    time.sleep(10)
print("No new screens detected in polling window")
