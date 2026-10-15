"""Print full schema for a specific Stitch tool."""
import json
import http.client
import ssl

API_KEY = "STITCH_API_KEY_PLACEHOLDER"
ctx = ssl.create_default_context()
conn = http.client.HTTPSConnection("stitch.googleapis.com", context=ctx, timeout=30)
headers = {
    "Content-Type": "application/json",
    "Accept": "application/json, text/event-stream",
    "X-Goog-Api-Key": API_KEY,
}

def call(method, params=None, id_=1):
    payload = {"jsonrpc": "2.0", "id": id_, "method": method}
    if params is not None:
        payload["params"] = params
    conn.request("POST", "/mcp", body=json.dumps(payload), headers=headers)
    resp = conn.getresponse()
    return resp.read()

call("initialize", {
    "protocolVersion": "2024-11-05",
    "capabilities": {},
    "clientInfo": {"name": "probe", "version": "0.0.1"},
}, id_=1)
conn.request("POST", "/mcp",
             body=json.dumps({"jsonrpc": "2.0", "method": "notifications/initialized"}),
             headers=headers)
conn.getresponse().read()

data = call("tools/list", {}, id_=2)
parsed = json.loads(data)
tools = parsed["result"]["tools"]
for t in tools:
    if t["name"] in ("generate_screen_from_text", "list_screens", "get_screen"):
        print(f"=== {t['name']} ===")
        print(json.dumps(t, indent=2)[:6000])
        print()
