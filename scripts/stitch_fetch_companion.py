"""Fetch all 7 screens of the Stitch project 'Companion Web Page' (ID 14916947932805577916).

For each screen:
  - Call get_screen to retrieve metadata + htmlCode + screenshot
  - Save the HTML code to /home/z/my-project/download/companion-web-page/screenN.html
  - Download the screenshot PNG via curl -L to screenN.png
"""
import json
import http.client
import ssl
import subprocess
import sys
import time
import os
import base64

API_KEY = "STITCH_API_KEY_PLACEHOLDER"
PROJECT_ID = "14916947932805577916"
OUT_DIR = "/home/z/my-project/download/companion-web-page"
os.makedirs(OUT_DIR, exist_ok=True)
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

# init + initialized notification
call("initialize", {
    "protocolVersion": "2024-11-05",
    "capabilities": {},
    "clientInfo": {"name": "fetch-screens", "version": "0.0.1"},
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

SCREEN_IDS = [
    "11312796588497380443",
    "2cb1f8ce93e740acbad95892242efee7",
    "0d6a85613e4a456da1a07a20e9e96d9b",
    "b4507622710c473c80e17c752de5f81a",
    "a1ef1d8ff5994531975d2b96f970a76b",
    "398de1a621e94179b038869d7b78110f",
    "494c4245104840f2b814918364af6791",
]

def safe_filename(s, fallback):
    if not s:
        return fallback
    keep = "-_."
    out = "".join(c if c.isalnum() or c in keep else "_" for c in s)
    return out[:60] or fallback

manifest = []
for i, sid in enumerate(SCREEN_IDS, 1):
    name = f"projects/{PROJECT_ID}/screens/{sid}"
    print(f"\n=== [{i}/{len(SCREEN_IDS)}] {name} ===", flush=True)
    try:
        result = call("tools/call", {
            "name": "get_screen",
            "arguments": {"name": name}
        }, id_=i + 10, timeout=180)
    except Exception as e:
        print(f"  error: {e}")
        manifest.append({"id": sid, "error": str(e)})
        continue

    sc = result.get("result", {}).get("structuredContent", {})
    title = sc.get("title", "")
    device = sc.get("deviceType", "")
    width = sc.get("width", "")
    height = sc.get("height", "")
    html_file = sc.get("htmlCode", {}) or {}
    screenshot_file = sc.get("screenshot", {}) or {}
    print(f"  title={title!r} device={device} {width}x{height}")
    print(f"  htmlCode keys: {list(html_file.keys())}")
    print(f"  screenshot keys: {list(screenshot_file.keys())}")

    base = safe_filename(title, f"screen_{i:02d}")
    # Save HTML
    if html_file.get("fileContentBase64"):
        try:
            html_text = base64.b64decode(html_file["fileContentBase64"]).decode("utf-8", errors="replace")
            html_path = os.path.join(OUT_DIR, f"{base}.html")
            with open(html_path, "w", encoding="utf-8") as f:
                f.write(html_text)
            print(f"  saved HTML -> {html_path} ({len(html_text)} bytes)")
        except Exception as e:
            print(f"  HTML b64 decode failed: {e}")
    if html_file.get("downloadUrl"):
        url = html_file["downloadUrl"]
        html_path = os.path.join(OUT_DIR, f"{base}.html")
        r = subprocess.run(["curl", "-sSL", "--max-time", "60", "-o", html_path, url],
                           capture_output=True, text=True)
        if r.returncode == 0:
            print(f"  downloaded HTML -> {html_path}")
        else:
            print(f"  curl HTML failed: {r.stderr[:200]}")
    # Save screenshot
    if screenshot_file.get("downloadUrl"):
        url = screenshot_file["downloadUrl"]
        mime = screenshot_file.get("mimeType", "image/png")
        ext = "png" if "png" in mime else ("jpg" if "jpeg" in mime else "img")
        img_path = os.path.join(OUT_DIR, f"{base}.{ext}")
        r = subprocess.run(["curl", "-sSL", "--max-time", "60", "-o", img_path, url],
                           capture_output=True, text=True)
        if r.returncode == 0:
            size = os.path.getsize(img_path)
            print(f"  downloaded screenshot -> {img_path} ({size} bytes)")
        else:
            print(f"  curl screenshot failed: {r.stderr[:200]}")
    elif screenshot_file.get("fileContentBase64"):
        try:
            img_data = base64.b64decode(screenshot_file["fileContentBase64"])
            img_path = os.path.join(OUT_DIR, f"{base}.png")
            with open(img_path, "wb") as f:
                f.write(img_data)
            print(f"  saved screenshot b64 -> {img_path} ({len(img_data)} bytes)")
        except Exception as e:
            print(f"  screenshot b64 decode failed: {e}")
    else:
        print("  no screenshot download URL or b64")

    manifest.append({
        "index": i,
        "id": sid,
        "title": title,
        "device": device,
        "width": width,
        "height": height,
        "html_file": base + ".html" if (html_file.get("downloadUrl") or html_file.get("fileContentBase64")) else None,
        "screenshot_file": base + ".png" if screenshot_file.get("downloadUrl") or screenshot_file.get("fileContentBase64") else None,
    })

with open(os.path.join(OUT_DIR, "manifest.json"), "w") as f:
    json.dump(manifest, f, indent=2)
print(f"\nManifest written to {OUT_DIR}/manifest.json")
