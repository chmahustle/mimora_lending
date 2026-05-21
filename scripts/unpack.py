#!/usr/bin/env python3
"""Unpack mimora-standalone bundle into a clean project structure."""

import base64
import gzip
import json
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
STANDALONE = ROOT / "mimora-standalone (1).html"

MIME_EXT = {
    "font/woff2": ".woff2",
    "application/javascript": ".js",
    "text/javascript": ".js",
    "text/css": ".css",
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/webp": ".webp",
    "image/svg+xml": ".svg",
}

JS_NAMES = {
    "3bbe55f4-4fc2-43e4-8d3f-c53927edc905": "lenis.min.js",
    "8fa0f9b2-ed27-41a3-b064-6407602dce75": "gsap.min.js",
    "c9361384-fc99-46a5-8618-39e06b0b84d7": "ScrollTrigger.min.js",
}

IMAGE_NAMES = [
    "audience-map.jpg",
    "agent-reactions.jpg",
    "regenerated-creative.jpg",
]


def slug(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")


def decompress_entry(entry: dict) -> bytes:
    data = base64.b64decode(entry["data"])
    if entry.get("compressed"):
        data = gzip.decompress(data)
    return data


def parse_bundle():
    content = STANDALONE.read_text(encoding="utf-8")

    manifest_m = re.search(
        r'<script type="__bundler/manifest">\s*([\s\S]*?)\s*</script>', content
    )
    template_m = re.search(
        r'<script type="__bundler/template">\s*([\s\S]*?)\s*</script>', content
    )
    ext_m = re.search(
        r'<script type="__bundler/ext_resources">\s*([\s\S]*?)\s*</script>', content
    )
    loader_m = re.search(
        r"<script>\s*(document\.addEventListener\('DOMContentLoaded'[\s\S]*?)\s*</script>",
        content,
    )
    shell_style_m = re.search(r"<style>\s*([\s\S]*?)\s*</style>", content)
    thumbnail_m = re.search(
        r'<div id="__bundler_thumbnail">([\s\S]*?)</div>\s*<div id="__bundler_loading">',
        content,
    )

    if not manifest_m or not template_m:
        raise SystemExit("Could not find bundle data in standalone HTML")

    manifest = json.loads(manifest_m.group(1))
    template = json.loads(template_m.group(1))
    ext_resources = json.loads(ext_m.group(1)) if ext_m and ext_m.group(1).strip() else {}

    return {
        "manifest": manifest,
        "template": template,
        "ext_resources": ext_resources,
        "loader_script": loader_m.group(1) if loader_m else "",
        "shell_styles": shell_style_m.group(1) if shell_style_m else "",
        "thumbnail_svg": thumbnail_m.group(1).strip() if thumbnail_m else "",
    }


def build_font_filename(block: str) -> str:
    """Build a unique filename from @font-face block and its preceding comment."""
    comment = ""
    comments = re.findall(r"/\*\s*([^*]+?)\s*\*/", block)
    if comments:
        comment = slug(comments[-1])

    fam = re.search(r"font-family:\s*['\"]?([^'\";\n]+)", block)
    weight = re.search(r"font-weight:\s*(\d+)", block)
    style = re.search(r"font-style:\s*(\w+)", block)

    parts = [slug(fam.group(1)) if fam else "font"]
    if weight:
        parts.append(weight.group(1))
    if style and style.group(1) != "normal":
        parts.append(style.group(1))
    if comment:
        parts.append(comment)
    else:
        range_m = re.search(r"unicode-range:\s*([^;]+)", block)
        if range_m:
            parts.append(slug(range_m.group(1)[:24]))

    return "-".join(parts) + ".woff2"


def main():
    bundle = parse_bundle()
    manifest = bundle["manifest"]
    template = bundle["template"]

    dirs = [
        ROOT / "css",
        ROOT / "js",
        ROOT / "assets" / "fonts",
        ROOT / "assets" / "images",
        ROOT / "bundle",
        ROOT / "original",
    ]
    for d in dirs:
        d.mkdir(parents=True, exist_ok=True)

    fonts_dir = ROOT / "assets" / "fonts"
    if fonts_dir.exists():
        for f in fonts_dir.glob("*.woff2"):
            f.unlink()

    # Archive bundle metadata (nothing deleted)
    (ROOT / "bundle" / "manifest.json").write_text(
        json.dumps(manifest, indent=2), encoding="utf-8"
    )
    (ROOT / "bundle" / "template.html").write_text(template, encoding="utf-8")
    if bundle["ext_resources"]:
        (ROOT / "bundle" / "ext_resources.json").write_text(
            json.dumps(bundle["ext_resources"], indent=2), encoding="utf-8"
        )
    if bundle["loader_script"]:
        (ROOT / "bundle" / "loader.js").write_text(bundle["loader_script"], encoding="utf-8")
    if bundle["shell_styles"]:
        (ROOT / "bundle" / "shell.css").write_text(bundle["shell_styles"], encoding="utf-8")
    if bundle["thumbnail_svg"]:
        (ROOT / "bundle" / "thumbnail.svg").write_bytes(
            bundle["thumbnail_svg"].encode("utf-8")
        )

    # Copy standalone to original/ for safekeeping
    dest_original = ROOT / "original" / STANDALONE.name
    if not dest_original.exists():
        shutil.copy2(STANDALONE, dest_original)

    uuid_to_font_path: dict[str, str] = {}

    # Parse CSS blocks from template
    styles = re.findall(r"<style[^>]*>([\s\S]*?)</style>", template)
    if len(styles) < 2:
        raise SystemExit(f"Expected 2 style blocks, found {len(styles)}")

    fonts_css = styles[0]
    main_css = styles[1]

    # One woff2 file per UUID; include subset comment in filename
    seen_uuid: set[str] = set()
    for m in re.finditer(r"(?:/\*[^*]*\*/\s*)?@font-face\s*\{[^}]+\}", fonts_css):
        block = m.group(0)
        url_m = re.search(r'url\(["\']?([^"\')\s]+)["\']?\)', block)
        if not url_m:
            continue
        uuid = url_m.group(1)
        if uuid in seen_uuid or uuid not in manifest:
            continue
        seen_uuid.add(uuid)
        filename = build_font_filename(block)
        font_path = ROOT / "assets" / "fonts" / filename
        font_path.write_bytes(decompress_entry(manifest[uuid]))
        uuid_to_font_path[uuid] = f"../assets/fonts/{filename}"

    # Extract non-font manifest assets (JS libs)
    for uuid, entry in manifest.items():
        if entry["mime"] == "font/woff2":
            continue
        data = decompress_entry(entry)
        if uuid in JS_NAMES:
            out = ROOT / "js" / JS_NAMES[uuid]
        else:
            ext = MIME_EXT.get(entry["mime"], ".bin")
            out = ROOT / "assets" / f"{uuid}{ext}"
        out.write_bytes(data)

    def replace_uuid_urls(css: str) -> str:
        def repl(match):
            uuid = match.group(1)
            if uuid in uuid_to_font_path:
                return f'url("{uuid_to_font_path[uuid]}")'
            return match.group(0)

        return re.sub(r'url\(["\']?([a-f0-9-]{36})["\']?\)', repl, css)

    fonts_css_out = replace_uuid_urls(fonts_css)
    main_css_out = replace_uuid_urls(main_css)

    (ROOT / "css" / "fonts.css").write_text(fonts_css_out, encoding="utf-8")
    (ROOT / "css" / "main.css").write_text(main_css_out, encoding="utf-8")

    # Inline script -> main.js
    inline_scripts = re.findall(r"<script(?![^>]*src)[^>]*>([\s\S]*?)</script>", template)
    if inline_scripts:
        (ROOT / "js" / "main.js").write_text(inline_scripts[0].strip(), encoding="utf-8")

    html = template
    img_counter = [0]

    def img_replacer(match):
        before, fmt, b64, after = match.groups()
        if img_counter[0] < len(IMAGE_NAMES):
            name = IMAGE_NAMES[img_counter[0]]
        else:
            ext = "jpg" if "jpeg" in fmt else fmt.split("/")[-1]
            name = f"image-{img_counter[0]}.{ext}"
        out = ROOT / "assets" / "images" / name
        out.write_bytes(base64.b64decode(b64))
        img_counter[0] += 1
        return f"<img{before}src=\"assets/images/{name}\"{after}>"

    html = re.sub(
        r'<img([^>]*?)src="data:image/([^;]+);base64,([A-Za-z0-9+/=]+)"([^>]*)>',
        img_replacer,
        html,
    )

    # Remove inline style/script blocks; replace external script src
    html = re.sub(r"<style[^>]*>[\s\S]*?</style>\s*", "", html, count=2)
    html = re.sub(r'<script[^>]*src="[a-f0-9-]+"[^>]*></script>\s*', "", html)
    html = re.sub(r"<script(?![^>]*src)[^>]*>[\s\S]*?</script>\s*", "", html)

    # Build index.html
    body_match = re.search(r"<body[^>]*>([\s\S]*)</body>", html)
    body = body_match.group(1).strip() if body_match else html

    index = f"""<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>mimora — Synthetic Audience Intelligence</title>
  <link rel="stylesheet" href="css/fonts.css">
  <link rel="stylesheet" href="css/main.css">
</head>
<body>
{body}
  <script src="js/lenis.min.js"></script>
  <script src="js/gsap.min.js"></script>
  <script src="js/ScrollTrigger.min.js"></script>
  <script src="js/main.js"></script>
</body>
</html>
"""
    (ROOT / "index.html").write_text(index, encoding="utf-8")

    print("Unpack complete:")
    print(f"  fonts: {len(uuid_to_font_path)}")
    print(f"  images: {img_counter[0]}")
    print(f"  index.html: {ROOT / 'index.html'}")


if __name__ == "__main__":
    main()
