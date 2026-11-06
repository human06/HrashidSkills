#!/usr/bin/env python3
"""Build one offline HTML deck from frame markup and the shared runtime."""
from __future__ import annotations

import argparse
from calendar import monthrange
from datetime import date
from base64 import b64encode
from hashlib import sha256
import html
from html.parser import HTMLParser
import json
import math
from mimetypes import guess_type
from pathlib import Path
import re
from palettes import bridge_css, load_registry, palette_css

ASSETS = Path(__file__).resolve().parents[1] / "assets"

# Older decks stored these two stock masks in their shared stylesheet. Match
# the payloads so that a custom logo using the same CSS classes is preserved.
LEGACY_MARKS = {
    '2969f9b3934cc9c0b3893147a07e32e10ad5d4d207dd7da208000a4db93ae197',
    'ea3c502b3a4a7158b90c1195eb76ced7d4a1693296bfae1d2bcddde937428978',
}
LEGACY_MARK_RULE = re.compile(r'\.p-logo-[lb]\s*\{\s*--m:\s*url\(data:image/png;base64,([A-Za-z0-9+/=]+)\);[^}]*\}')


def design_asset_url(directory, filename, media_prefix):
    asset = (directory / filename).resolve()
    if not asset.is_relative_to(directory):
        raise ValueError(f'Design asset must be inside {directory.name}: {filename}')
    media_type = guess_type(asset.name)[0]
    if not media_type or not media_type.startswith(media_prefix):
        raise ValueError(f'Unsupported design asset type for {filename}; expected {media_prefix}')
    payload = b64encode(asset.read_bytes()).decode('ascii')
    return f'url(data:{media_type};base64,{payload})'


def design_font_name(family):
    if not isinstance(family, str) or not re.fullmatch(r'[\w-]+(?: [\w-]+)*', family):
        raise ValueError(f'Invalid design font family: {family!r}')
    return f'"{family}"'


def design_artifact_styles(designs):
    directory = (ASSETS / 'design-artifacts').resolve()
    manifest = json.loads((directory / 'manifest.json').read_text(encoding='utf-8'))
    styles = []
    for design in designs:
        entry = manifest.get(design)
        if entry is None:
            continue
        properties, rules = [], []
        files = entry.get('files', {})
        for name, filename in files.items():
            if not re.fullmatch(r'[a-z][a-z0-9-]*', name):
                raise ValueError(f'Invalid design asset role: {name!r}')
            properties.append(f'--design-{name}:{design_asset_url(directory, filename, "image/")}')
        for font in entry.get('fonts', []):
            family = design_font_name(font['family'])
            weight, style = font['weight'], font['style']
            if type(weight) is not int or not 1 <= weight <= 1000 or style not in ('normal', 'italic'):
                raise ValueError(f'Invalid font weight or style for {font["file"]}')
            url = design_asset_url(directory, font['file'], 'font/')
            rules.append(f'@font-face{{font-family:{family};src:{url};font-weight:{weight};'
                         f'font-style:{style};font-display:swap}}')
        selector = f'html[data-palette="{design}"]'
        stack = entry.get('fontStack', [])
        if stack:
            family_list = ','.join(map(design_font_name, stack))
            properties.append(f"--disp:{family_list},'Archivo',system-ui,sans-serif")
            rules.append(f'{selector} svg[font-family="Archivo,sans-serif"]{{font-family:var(--disp)}}')
        if 'hud-mark' in files:
            properties.extend(('--design-hud-width:22px', '--design-hud-gap:8px'))
        if properties:
            rules.append(f'{selector}{{{";".join(properties)}}}')
        image_slots = {
            'cover': '.frame:is(.a-title,:has(> .in .p-title > .p-gov)):not([data-color-fixed])',
            'act': '.cd-actcard',
        }
        for slot, target in image_slots.items():
            for mode, appearance in [('light', '.light'), ('dark', ':not(.light)')]:
                role = f'{slot}-{mode}'
                if role in files:
                    rules.append(f'{selector}{appearance} {target}{{background-image:var(--design-{role});'
                                 'background-position:center;background-size:cover}')
        label = html.escape(entry.get('titleMark', ''), quote=True)
        styles.append(f'<style data-deck-style="design-artifacts" data-design-artifacts="{design}" '
                      f'data-title-mark="{label}">\n' + '\n'.join(rules) + '\n</style>')
    return styles


def chart_date(value, end=False):
    if not isinstance(value, str) or not re.fullmatch(r"\d{4}-\d{2}(-\d{2})?", value):
        raise ValueError("Roadmap dates must use YYYY-MM or YYYY-MM-DD")
    if len(value) == 10:
        return date.fromisoformat(value)
    first = date.fromisoformat(value + "-01")
    return first.replace(day=monthrange(first.year, first.month)[1]) if end else first


def chart_items(attrs, name):
    items = json.loads(attrs.get("data-items", "[]"))
    if not isinstance(items, list) or not items or not all(
        isinstance(item, dict) and isinstance(item.get("l"), str) and item["l"].strip()
        for item in items
    ):
        raise ValueError(f"{name} data-items must list objects with a label (l)")
    return items


def validate_roadmap(attrs):
    lanes = json.loads(attrs.get("data-lanes", "[]"))
    if not isinstance(lanes, list) or not lanes or not all(isinstance(lane, str) and lane.strip() for lane in lanes):
        raise ValueError("Roadmap data-lanes must list workstream names")
    if len(set(lanes)) != len(lanes):
        raise ValueError("Roadmap workstream names must be unique")
    start = chart_date(attrs.get("data-from"))
    end = chart_date(attrs.get("data-to"), end=True)
    if start > end:
        raise ValueError("Roadmap dates must run forward")
    for item in chart_items(attrs, "Roadmap"):
        if item.get("lane") not in lanes:
            raise ValueError(f"Roadmap item {item['l']!r} must use a named workstream")
        if "t" in item:
            first = last = chart_date(item["t"])
        else:
            first = chart_date(item.get("from"))
            last = chart_date(item.get("to"), end=True)
        if not start <= first <= last <= end:
            raise ValueError(f"Roadmap item {item['l']!r} must fit the date range")


def validate_waterfall(attrs):
    items = chart_items(attrs, "Waterfall")
    if len(items) < 2 or items[0].get("total") is not True or items[-1].get("total") is not True:
        raise ValueError("Waterfall needs opening and closing totals")
    running = 0
    for index, item in enumerate(items):
        total = item.get("total") is True
        value = item.get("v")
        if index and total and value is None:
            continue
        if type(value) not in (int, float) or not math.isfinite(value):
            raise ValueError(f"Waterfall item {item['l']!r} needs a finite number (v)")
        running = value if total else running + value
        if not math.isfinite(running):
            raise ValueError("Waterfall running total must be finite")


class SourceInfo(HTMLParser):
    def __init__(self, source: str):
        super().__init__()
        self.stage = {}
        self.frames = []
        self.ids = []
        self.backup_links = []
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get("id") == "stage":
            self.stage = attrs
        if tag == "section" and "frame" in attrs.get("class", "").split():
            self.frames.append(attrs)
        if attrs.get("id"):
            self.ids.append(attrs["id"])
        if tag in ("button", "a") and "data-goto" in attrs:
            self.backup_links.append(attrs["data-goto"])
        classes = attrs.get("class", "").split()
        if tag == "svg" and "cd-timeline" in classes:
            validate_roadmap(attrs)
        if tag == "svg" and "cd-waterfall" in classes:
            validate_waterfall(attrs)
        if "cd-waffle" in classes:
            parts = json.loads(attrs.get("data-parts", "[]"))
            total = float(attrs.get("data-total", 100))
            values = [float(part["v"]) for part in parts]
            if not math.isfinite(total) or total <= 0 or any(not math.isfinite(v) or v < 0 for v in values) or sum(values) > total + 1e-9:
                raise ValueError("Waffle values must be finite, nonnegative, and sum to at most data-total")


def read_config(source: str, info: SourceInfo, override: dict | None = None) -> dict:
    match = re.search(r'<script\b[^>]*\bid=[\'\"]deck-config[\'\"][^>]*>(.*?)</script>', source, re.S)
    config = json.loads(match[1]) if match else {}
    if override:
        config.update(override)
    title = re.search(r"<title[^>]*>(.*?)</title>", source, re.S)
    config.setdefault("title", html.unescape(title[1]) if title else "Presentation")
    config.setdefault("id", re.sub(r"[^a-z0-9]+", "-", config["title"].lower()).strip("-") or "deck")
    config.setdefault("acts", json.loads(info.stage.get("data-acts", "[]")))
    config.setdefault("transition", info.stage.get("data-transition", "glide"))
    config.setdefault("brand", {"name": "EPAM", "label": config["title"]})
    config.setdefault("finale", {"text": "The closing line.", "credits": ""})
    config.setdefault("palette", "base")
    return config


def validate_backups(info: SourceInfo, config: dict) -> None:
    targets = set()
    for index, frame in enumerate(info.frames):
        if "data-backup" not in frame:
            if targets:
                raise ValueError("Put all Q&A backup frames after the main story")
            continue
        if index == 0:
            raise ValueError("Q&A backups need at least one main frame before them")
        target = frame.get("id") or ""
        if not target or re.search(r"\s", target) or info.ids.count(target) != 1:
            raise ValueError("Each Q&A backup frame needs a unique, nonempty id without spaces")
        cams = json.loads(frame["data-cams"]) if "data-cams" in frame else []
        shots = cams.values() if isinstance(cams, dict) else cams if isinstance(cams, list) else [cams]
        if "data-finale" in frame or "world" in shots:
            raise ValueError(f"Q&A backup {target!r} cannot contain the finale")
        targets.add(target)
    talk = config.get("talk")
    qa = talk.get("qa") if isinstance(talk, dict) else None
    requested = info.backup_links + [
        item["goto"] for item in (qa if isinstance(qa, list) else [])
        if isinstance(item, dict) and "goto" in item
    ]
    for target in requested:
        if not isinstance(target, str) or target not in targets:
            raise ValueError(f"Q&A target {target!r} does not match a backup frame id")


def validate_world(config: dict, frame_count: int) -> None:
    def finite(value):
        return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)

    for act in config["acts"]:
        if "width" in act and (not finite(act["width"]) or act["width"] <= 0):
            raise ValueError("Act width must be a finite positive number")
    world = config.get("world", {})
    if not isinstance(world, dict):
        raise ValueError("world must be an object")
    if "finale" in world:
        camera = world["finale"]
        if not isinstance(camera, dict) or not all(finite(camera.get(k)) for k in ["x", "y", "s"]) or camera["s"] <= 0:
            raise ValueError("world.finale needs finite x/y and a positive scale s")
    if "thread" in world and not isinstance(world["thread"], str):
        raise ValueError("world.thread must be an SVG path string")
    if "showActsOnZoom" in world and not isinstance(world["showActsOnZoom"], bool):
        raise ValueError("world.showActsOnZoom must be boolean")
    height = world.get("labelLineHeight", "normal")
    if height != "normal" and (not finite(height) or height <= 0):
        raise ValueError("world.labelLineHeight must be normal or a positive number")
    minimap = world.get("minimap", {})
    if not isinstance(minimap, dict):
        raise ValueError("world.minimap must be an object")
    if "viewBox" in minimap:
        box = minimap["viewBox"]
        if not isinstance(box, list) or len(box) != 4 or not all(finite(v) for v in box) or min(box[2:]) <= 0:
            raise ValueError("Minimap viewBox needs four finite numbers and a positive width/height")
    for key in ["frameStroke", "viewStroke", "pathStroke", "radius"]:
        if key in minimap and (not finite(minimap[key]) or minimap[key] < 0 or (key != "radius" and minimap[key] == 0)):
            raise ValueError(f"Invalid minimap {key}")
    if "preserveAspectRatio" in minimap and not re.fullmatch(r"none|x(Min|Mid|Max)Y(Min|Mid|Max)( (meet|slice))?", str(minimap["preserveAspectRatio"])):
        raise ValueError("Invalid minimap preserveAspectRatio")
    auras = world.get("auras", [])
    if not isinstance(auras, list) or len(auras) > frame_count:
        raise ValueError("world.auras must have at most one entry per frame")
    for aura in auras:
        if not isinstance(aura, dict) or not finite(aura.get("size")) or aura["size"] <= 0 or not finite(aura.get("alpha")) or not 0 <= aura["alpha"] <= 1 or not isinstance(aura.get("color"), str) or not aura["color"].strip():
            raise ValueError("Each aura needs a color, positive size, and alpha between 0 and 1")


def build(source: str, override: dict | None = None, *, comparison_designs=None) -> str:
    info = SourceInfo(source)
    frames = re.findall(r"<section\b.*?</section>", source, re.S)
    if not frames or len(frames) != len(info.frames):
        raise ValueError("Expected non-nested <section class=\"frame\"> elements")
    if any("frame" not in frame.get("class", "").split() for frame in info.frames):
        raise ValueError("Every top-level section must be a frame")
    config = read_config(source, info, override)
    palettes = load_registry(ASSETS / 'palettes.json', config.get('palettes'))
    if not isinstance(config['palette'], str) or config['palette'] not in palettes:
        raise ValueError('Unknown palette; choose ' + ', '.join(palettes))
    if 'mode' in config and config['mode'] not in ('dark', 'light'):
        raise ValueError('mode must be dark or light')
    if config["transition"] not in ["glide", "swoop"]:
        raise ValueError("transition must be glide or swoop")
    if not config["acts"]:
        raise ValueError("Define acts in deck-config or #stage[data-acts]")
    validate_backups(info, config)
    validate_world(config, len(info.frames))
    for frame in info.frames:
        act = int(frame.get("data-act", 0))
        if not 0 <= act < len(config["acts"]):
            raise ValueError(f"Frame act {act} is not defined")
        if "data-cams" in frame:
            json.loads(frame["data-cams"])
    # Keep source-specific CSS, but use the bundled fonts consistently.
    source_css = "\n".join(text for attrs, text in re.findall(r"<style\b([^>]*)>(.*?)</style>", source, re.S)
                           if "data-deck-style" not in attrs or re.search(r'data-deck-style=[\'\"]source[\'\"]', attrs))
    source_css = LEGACY_MARK_RULE.sub(
        lambda rule: '' if sha256(rule[1].encode('ascii')).hexdigest() in LEGACY_MARKS else rule[0],
        source_css,
    )
    source_css = re.sub(r"@font-face\s*\{[^}]*\}\s*", "", source_css).strip()
    styles = [
        ("components", (ASSETS / "components.css").read_text(encoding="utf-8")),
        ("source", source_css),
        ("heritage", (ASSETS / "heritage.css").read_text(encoding="utf-8")),
        ("compatibility", (ASSETS / "compatibility.css").read_text(encoding="utf-8")),
        ("palettes", (ASSETS / "palettes.css").read_text(encoding="utf-8")),
    ]
    if any(not text.strip() for name, text in styles if name != "source"):
        raise ValueError("Shared style assets must not be empty")
    title = html.escape(config["title"])
    # JSON is embedded as raw text, so escape HTML delimiters as JSON escapes.
    config_text = json.dumps(config, ensure_ascii=False, indent=2).replace("<", "\\u003c").replace(">", "\\u003e").replace("&", "\\u0026")
    css = "\n".join(f'<style data-deck-style="{name}">\n{bridge_css(text) if name != "palettes" else text}\n</style>' for name, text in styles if text.strip())
    css += '\n<style data-deck-style="palette-tokens">\n' + palette_css(palettes) + '\n</style>'
    artifact_designs = [config['palette']] if comparison_designs is None else comparison_designs
    css = '\n'.join([css, *design_artifact_styles(artifact_designs)])
    from palettes import HEX_ROLE, RGB_ROLE
    palette_data = json.dumps({'palettes': palettes, 'hexRoles': HEX_ROLE, 'rgbRoles': RGB_ROLE,
                               'artifactScope': 'design'}, ensure_ascii=False).replace('<', '\\u003c').replace('>', '\\u003e').replace('&', '\\u0026')
    selected = palettes[config['palette']]
    palette_attrs = f'data-palette="{config["palette"]}" data-palette-treatment="{selected["treatment"]}"'
    mode_class = ' class="light"' if config.get('mode', selected['defaultMode']) == 'light' else ''
    transition = html.escape(config["transition"], quote=True)
    runtime = (ASSETS / "palette-runtime.js").read_text(encoding="utf-8") + '\n' + (ASSETS / "runtime.js").read_text(encoding="utf-8")
    frames_html = "\n".join(frames)
    return f'''<!doctype html>
<html lang="en" {palette_attrs}{mode_class}><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title><meta name="generator" content="deck-heritage 2.4.0 (cinematic-deck 1.2 + HrashidSkills)">
{css}
</head><body><div id="viewport"><div id="stage" data-transition="{transition}"><div id="world">
{frames_html}
</div></div></div>
<script type="application/json" id="deck-config">{config_text}</script>
<script type="application/json" id="deck-palettes">{palette_data}</script>
<script data-deck-preview="1">{runtime}</script>
</body></html>
'''


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--config", type=Path, help="JSON configuration merged over source metadata")
    parser.add_argument("--palette", "--design", dest="palette", help="Design id (see apply_design.py --list-designs for bundled choices)")
    args = parser.parse_args()
    try:
        config = json.loads(args.config.read_text(encoding="utf-8")) if args.config else {}
        if args.palette:
            config['palette'] = args.palette
        result = build(args.source.read_text(encoding="utf-8"), config)
    except (ValueError, OSError) as exc:
        parser.exit(1, f"build_deck: {exc}\n")
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(result, encoding="utf-8")
    print(f"Built {args.output} ({len(result.encode()):,} bytes)")


if __name__ == "__main__":
    main()
