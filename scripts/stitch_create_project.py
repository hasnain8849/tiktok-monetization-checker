"""Create a Stitch project via the MCP HTTP API."""
import json
import http.client
import ssl
import sys

API_KEY = "STITCH_API_KEY_PLACEHOLDER"
ctx = ssl.create_default_context()

def call(method, params=None, id_=1):
    conn = http.client.HTTPSConnection("stitch.googleapis.com", context=ctx, timeout=60)
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

# initialize
call("initialize", {
    "protocolVersion": "2024-11-05",
    "capabilities": {},
    "clientInfo": {"name": "stitch-client", "version": "0.0.1"},
}, id_=1)

# send initialized notification
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

# create_project
result = call("tools/call", {
    "name": "create_project",
    "arguments": {"title": "Personal Finance Dashboard"}
}, id_=2)
print(json.dumps(result, indent=2)[:3000])
