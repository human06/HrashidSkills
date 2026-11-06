#!/usr/bin/env python3
"""Choose a design for a deck while retaining its story and motion contracts."""
from datetime import datetime, timezone
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import tempfile

from build_deck import ASSETS, SourceInfo, build, read_config
from palettes import load_registry

MOTION_FUNCTIONS = ('model', 'layout', 'buildWorld', 'camFor', 'fly', 'shot',
                    'setSteps', 'counters', 'typed', 'go', 'setOverview')
# The shipped pre-Q&A motion functions remain safe to restyle with the current engine.
PRE_QA_MOTION = '1093f4b403e4e3ce4645274429cb4d25f2668b8130dda174f4a4f3a333da67c4'


def function_block(script, name):
    match = re.search(r'^function ' + re.escape(name) + r'\b.*?(?=^function |\Z)', script, re.M | re.S)
    return match[0].replace('\r\n', '\n').strip() if match else None


def check_motion(source):
    scripts = [text for attrs, text in re.findall(r'<script\b([^>]*)>(.*?)</script>', source, re.S)
               if 'application/json' not in attrs]
    runtimes = [text for text in scripts if 'function fly(' in text and 'window.deck' in text]
    if not runtimes:
        if scripts:
            raise ValueError('Unrecognized custom/legacy engine: adapt its colors manually following EDIT.md; automatic engine replacement is not performed')
        return []  # Editable frame sources use the bundled engine for their first build.
    if len(scripts) != 1:
        raise ValueError('Extra inline scripts require a manual edit to preserve their behavior; see EDIT.md')
    current = (ASSETS / 'runtime.js').read_text(encoding='utf-8')
    different = [name for name in MOTION_FUNCTIONS
                 if function_block(runtimes[0], name) != function_block(current, name)]
    if different:
        signature = hashlib.sha256(json.dumps([function_block(runtimes[0], name) for name in MOTION_FUNCTIONS]).encode()).hexdigest()
        if signature != PRE_QA_MOTION:
            raise ValueError('Custom motion functions require a manual color edit: ' + ', '.join(different))
    return list(MOTION_FUNCTIONS)


def apply_design(source, design, mode='keep'):
    """Return one offline HTML and concise verification details. No file writes."""
    if mode not in ('keep', 'palette', 'dark', 'light'):
        raise ValueError('mode must be keep, palette, dark or light')
    info = SourceInfo(source)
    config = read_config(source, info)
    registry = load_registry(ASSETS / 'palettes.json', config.get('palettes'))
    if design not in registry:
        raise ValueError('Unknown design; choose ' + ', '.join(registry))
    checked = check_motion(source)
    old_design = config.get('palette', 'base')
    previous_mode = config.get('mode', registry.get(old_design, registry['base'])['defaultMode'])
    config['mode'] = previous_mode if mode == 'keep' else registry[design]['defaultMode'] if mode == 'palette' else mode
    # Separate presenter channels and saved choices for exported design variants.
    origin = str(config.get('designSourceId', config['id']))
    config.update({'designSourceId': origin, 'id': origin + '-' + design, 'palette': design})
    output = build(source, config)
    before = re.findall(r'<section\b.*?</section>', source, re.S)
    if re.findall(r'<section\b.*?</section>', output, re.S) != before:
        raise ValueError('The design application changed frame markup')
    explicit_steps = all(re.fullmatch(r'\d+', f.get('data-steps', '')) for f in info.frames)
    details = {'design': design, 'mode': config['mode'], 'frames': len(info.frames),
               'states': sum(int(f['data-steps']) + 1 for f in info.frames) if explicit_steps else None,
               'framesByteIdentical': True, 'checkedMotionFunctions': checked,
               'sourceSha256': hashlib.sha256(source.encode('utf-8')).hexdigest()}
    return output, details


def write_design(source_path, output_path, design, mode='keep'):
    source_path, output_path = source_path.resolve(), output_path.resolve()
    result, details = apply_design(source_path.read_bytes().decode('utf-8'), design, mode)
    backup = None
    if source_path == output_path:
        stamp = datetime.now(timezone.utc).strftime('%Y-%m-%d-%H%M%S-%fZ')
        backup = source_path.with_name(source_path.stem + ' - backup ' + stamp + source_path.suffix)
        shutil.copy2(source_path, backup)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    fd, temporary = tempfile.mkstemp(prefix='.' + output_path.name + '.', dir=output_path.parent)
    try:
        with os.fdopen(fd, 'w', encoding='utf-8', newline='') as stream:
            stream.write(result)
        os.replace(temporary, output_path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)
    details.update({'output': str(output_path), 'backup': str(backup) if backup else None})
    return details


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path, nargs='?')
    parser.add_argument('output', type=Path, nargs='?')
    parser.add_argument('--design', help='A bundled design id (see --list-designs) or a registered custom id')
    parser.add_argument('--mode', choices=['keep', 'palette', 'dark', 'light'], default='keep',
                        help='Keep source appearance (default), use the palette default, or choose an explicit appearance')
    parser.add_argument('--list-designs', action='store_true')
    args = parser.parse_args()
    if args.list_designs:
        registry = load_registry(ASSETS / 'palettes.json')
        print(json.dumps([{'id': k, 'label': v['label'], 'defaultMode': v['defaultMode']} for k, v in registry.items()], ensure_ascii=False, indent=2))
        return
    if not args.source or not args.output or not args.design:
        parser.error('source, output and --design are required (or use --list-designs)')
    try:
        print(json.dumps(write_design(args.source, args.output, args.design, args.mode), ensure_ascii=False))
    except (ValueError, OSError) as exc:
        parser.exit(1, f'apply_design: {exc}\n')


if __name__ == '__main__':
    main()
