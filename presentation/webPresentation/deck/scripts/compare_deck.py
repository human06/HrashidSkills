#!/usr/bin/env python3
"""Build an offline design comparison for a deck, or an empty reusable viewer."""
import argparse
from base64 import b64encode
import json
import os
from pathlib import Path
import re
import tempfile

from apply_design import check_motion
from build_deck import ASSETS, SourceInfo, build, design_artifact_styles, read_config
from palettes import load_registry


def build_comparison(source=None, override=None, designs=None):
    data = {'deck': None, 'designs': designs}
    if source is not None:
        check_motion(source)
        config = read_config(source, SourceInfo(source), override)
        registry = load_registry(ASSETS / 'palettes.json', config.get('palettes'))
        if designs is not None and (len(set(designs)) != len(designs) or len(designs) < 2):
            raise ValueError('Choose at least two different designs, or omit --design to use the whole registry')
        unknown = [design for design in designs or [] if design not in registry]
        if unknown:
            raise ValueError('Unknown design: ' + ', '.join(unknown) + '. Available: ' + ', '.join(registry))
        deck = build(source, config, comparison_designs=())
        frames = re.compile(r'<section\b.*?</section>', re.S)
        if frames.findall(deck) != frames.findall(source):
            raise ValueError('The comparison build changed frame markup')
        data['deck'] = b64encode(deck.encode('utf-8')).decode('ascii')
    elif override is not None or designs is not None:
        raise ValueError('--config and --design require a source deck')
    else:
        registry = load_registry(ASSETS / 'palettes.json')

    artwork = '\n'.join(design_artifact_styles(registry))
    data['artwork'] = b64encode(artwork.encode('utf-8')).decode('ascii')
    template = (ASSETS / 'comparison.html').read_text(encoding='utf-8')
    javascript = (ASSETS / 'comparison.js').read_text(encoding='utf-8').replace('</script', r'<\/script')
    return (template.replace('<!-- comparison-data -->',
                             '<script type="application/json" id="comparison-data">' + json.dumps(data) + '</script>')
                    .replace('<!-- comparison-script -->', '<script>\n' + javascript + '\n</script>'))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path, nargs='?', help='Source or compatible built deck')
    parser.add_argument('output', type=Path, help='Output HTML. Supply only this path for an empty viewer.')
    parser.add_argument('--config', type=Path, help='JSON configuration merged over source metadata')
    parser.add_argument('--design', action='append', help='Repeat to select and order designs. Defaults to all registered designs.')
    args = parser.parse_args()
    output = args.output.resolve()
    temporary = None
    try:
        if any(path and path.resolve() == output for path in (args.source, args.config)):
            raise ValueError('Choose an output path different from the inputs')
        override = json.loads(args.config.read_text(encoding='utf-8')) if args.config else None
        if args.config and not isinstance(override, dict):
            raise ValueError('--config must contain a JSON object')
        source = args.source.read_bytes().decode('utf-8') if args.source else None
        result = build_comparison(source, override, args.design)
        output.parent.mkdir(parents=True, exist_ok=True)
        with tempfile.NamedTemporaryFile(mode='w', encoding='utf-8', newline='', dir=output.parent, delete=False) as stream:
            temporary = Path(stream.name)
            stream.write(result)
        os.replace(temporary, output)
    except (ValueError, OSError) as exc:
        parser.exit(1, f'compare_deck: {exc}\n')
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)
    print(f'Built {output} ({len(result.encode("utf-8")):,} bytes)')


if __name__ == '__main__':
    main()
