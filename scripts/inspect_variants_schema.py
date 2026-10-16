"""Inspect generate_variants schema, then call it on a screen.

The dashboard screen (id 494c4245104840f2b814918364af6791) is the most
interesting to vary since the landing page is already strong.
"""
import json
import http.client
import ssl
import sys

API_KEY = "STITCH_API_KEY_PLACEHOLDER"
PROJECT_ID = "14916947932805577916"
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

call("initialize", {
    "protocolVersion": "2024-11-05",
    "capabilities": {},
    "clientInfo": {"name": "variants", "version": "0.0.1"},
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

# Inspect schema
data = call("tools/list", {}, id_=2)
tools = data["result"]["tools"]
for t in tools:
    if t["name"] == "generate_variants":
        print(json.dumps(t["inputSchema"], indent=2)[:2000])
