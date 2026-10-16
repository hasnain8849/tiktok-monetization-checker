"""Probe the Stitch MCP server and extract tool names + short descriptions."""
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
    payload = {"jsonrpc": "2.0", "id": id_, "method": method}
    if params is not None:
        payload["params"] = params
    conn.request("POST", "/mcp", body=json.dumps(payload), headers=headers)
    resp = conn.getresponse()
    return resp.read()

# initialize
call("initialize", {
    "protocolVersion": "2024-11-05",
    "capabilities": {},
    "clientInfo": {"name": "probe", "version": "0.0.1"},
}, id_=1)
conn.request("POST", "/mcp",
             body=json.dumps({"jsonrpc": "2.0", "method": "notifications/initialized"}),
             headers=headers)
conn.getresponse().read()

# tools/list
data = call("tools/list", {}, id_=2)
parsed = json.loads(data)
tools = parsed["result"]["tools"]
print(f"Total tools: {len(tools)}\n")
for t in tools:
    name = t["name"]
    desc = (t.get("description") or "").strip().split("\n")[0]
    print(f"- {name}: {desc}")
    schema = t.get("inputSchema", {})
    props = schema.get("properties", {})
    if props:
        for pname, pinfo in list(props.items())[:5]:
            ptype = pinfo.get("type", "?")
            pdesc = (pinfo.get("description") or "").strip()[:80]
            print(f"    * {pname} ({ptype}): {pdesc}")
    print()
