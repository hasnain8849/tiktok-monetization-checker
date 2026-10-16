"""Generate screens in a Stitch project via the MCP HTTP API.

Usage: python stitch_generate_screen.py <prompt-file-or-inline> <device-type>
Writes the screen generation result to stdout as JSON.

The `generate_screen_from_text` tool returns either a quick ack or a long-running
operation. We poll list_screens / get_screen to find the newest screen.
"""
import json
import http.client
import ssl
import sys
import time

API_KEY = "STITCH_API_KEY_PLACEHOLDER"
PROJECT_ID = "8827963556755951549"
ctx = ssl.create_default_context()

def call(method, params=None, id_=1, timeout=120):
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

# initialize + initialized notification
call("initialize", {
    "protocolVersion": "2024-11-05",
    "capabilities": {},
    "clientInfo": {"name": "stitch-client", "version": "0.0.1"},
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

prompt_text = sys.argv[1] if len(sys.argv) > 1 else "A personal finance dashboard"
device_type = sys.argv[2] if len(sys.argv) > 2 else "desktop"

print(f"Generating screen: device={device_type}", file=sys.stderr)
print(f"Prompt: {prompt_text[:200]}", file=sys.stderr)

result = call("tools/call", {
    "name": "generate_screen_from_text",
    "arguments": {
        "projectId": PROJECT_ID,
        "prompt": prompt_text,
        "deviceType": device_type,
    }
}, id_=2, timeout=600)
print(json.dumps(result, indent=2)[:5000])
