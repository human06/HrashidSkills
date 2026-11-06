"""Portable palette registry validation and legacy CSS color bridge."""
import json
from pathlib import Path
import re

REQUIRED = set('void panel panel2 txt txt2 txt3 primary secondary tertiary quaternary blue teal teal-d violet indigo cyan green red ember amber brand on-accent line line2 line3 dot shade blank paper paper2 ink ink2 pink orchid lime tint-blue tint-teal tint-violet tint-indigo brand-blue brand-teal brand-violet brand-indigo brand-cyan'.split())

# Only known heritage literals are bridged. Brand artwork in URLs stays intact.
LITERALS = {
    'teal': ['38e5ce', '08907f', '078474'],
    'ember': ['ff7a45', 'dc5019', 'cc4a17'], 'red': ['ff4868', 'd01e3e'],
    'amber': ['ffb547', 'b06900', 'a86400'], 'violet': ['a98dff', '6747d6'],
    'blue': ['62a0ff', '1c5bd3', '2e6fe0'], 'green': ['40e391', '0e8c4c', '0d8548'],
    'pink': ['ff5fa2', 'c92c74'], 'orchid': ['d08cff', '9238c8'],
    'lime': ['b6e35a', '5a8a00', '538000'], 'indigo': ['8c8cff', '4747d1'],
    'cyan': ['4fd1e8', '0a88a8', '097e9c'],
    'txt': ['e9edf3', '0d1322'], 'txt2': ['98a1b3', '8a93a6', '434c61', '566074'],
    'txt3': ['5b6477', '6c7589', '7a8396'],
    'panel': ['060a12'], 'panel2': ['0a0f1a', '0c1220', '141a24', 'f2f4f8'],
    'void': ['02040a', 'e8ecf1'],
    'teal-d': ['13a393', 'affff3', '8ff3e5'],
}
HEX_ROLE = {color: role for role, colors in LITERALS.items() for color in colors}
RGB_ROLE = {','.join(str(int(c[i:i+2], 16)) for i in (0, 2, 4)): role for c, role in HEX_ROLE.items()}
# Legacy translucent white is foreground/linework in both appearances.
RGB_ROLE.update({'255,255,255': 'txt', '12,20,36': 'txt', '8,144,127': 'teal', '255,90,50': 'ember'})
INK_ROLES = set(HEX_ROLE.values()) | set('primary secondary tertiary quaternary brand accent ok bad warn lit c'.split())


def load_registry(path: Path, extra=None):
    registry = json.loads(path.read_text(encoding='utf-8'))
    if extra is not None:
        if not isinstance(extra, dict):
            raise ValueError('palettes must be an object keyed by palette id')
        if 'base' in extra:
            raise ValueError('The base palette is reserved')
        registry.update(extra)
    for key, palette in registry.items():
        if not re.fullmatch(r'[a-z][a-z0-9-]{0,63}', key) or not isinstance(palette, dict):
            raise ValueError('Invalid palette id or definition')
        if not isinstance(palette.get('label'), str) or not palette['label'].strip():
            raise ValueError(f'{key}: palette label is required')
        if palette.get('defaultMode') not in ('dark', 'light'):
            raise ValueError(f'{key}: defaultMode must be dark or light')
        if palette.get('treatment') not in ('heritage', 'gradient', 'solid'):
            raise ValueError(f'{key}: invalid treatment')
        modes = palette.get('modes')
        if key == 'base':
            if modes != {}:
                raise ValueError('The base palette must preserve heritage styles')
            continue
        if not isinstance(modes, dict) or set(modes) != {'dark', 'light'}:
            raise ValueError(f'{key}: provide dark and light modes')
        for mode, tokens in modes.items():
            if not isinstance(tokens, dict) or REQUIRED - tokens.keys():
                raise ValueError(f'{key}/{mode}: missing palette tokens')
            for token, value in tokens.items():
                if not re.fullmatch(r'[a-z][a-z0-9-]*', token) or not isinstance(value, str) or not re.fullmatch(r'#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?', value):
                    raise ValueError(f'{key}/{mode}: tokens must be hex colors')
    return registry


def palette_css(registry):
    rules = []
    for key, palette in registry.items():
        for mode, tokens in palette['modes'].items():
            selector = f'html[data-palette="{key}"]' + ('.light' if mode == 'light' else ':not(.light)')
            declarations = [f'--{k}:{v}' for k, v in tokens.items()]
            declarations += ['--accent:var(--primary)', '--ok:var(--green)', '--bad:var(--red)', '--warn:var(--amber)']
            for role in sorted(INK_ROLES - {'lit', 'c'}):
                target = {'accent': 'primary', 'ok': 'green', 'bad': 'red', 'warn': 'amber'}.get(role, role)
                declarations.append(f'--palette-ink-{role}:var(--{target}-ink,var(--{target}))')
            declarations += [f'--palette-{color}:var(--{role})' for color, role in HEX_ROLE.items()]
            for rgb, role in RGB_ROLE.items():
                color = tokens[role].lstrip('#')
                channels = ','.join(str(int(color[i:i+2], 16)) for i in (0, 2, 4))
                declarations.append(f'--palette-rgb-{rgb.replace(",", "-")}:{channels}')
            declarations += ['--brand-gradient:linear-gradient(120deg,var(--brand-blue) 0%,var(--brand-indigo) 70%,var(--brand-violet) 100%)']
            rules.append(selector + '{' + ';'.join(declarations) + '}')
            color = tokens['quaternary'].lstrip('#')
            rgb = ','.join(str(int(color[i:i+2], 16)) for i in (0, 2, 4))
            rules.append(selector + ' .frame:has(svg.hld){--amber:var(--quaternary);--palette-rgb-255-181-71:' + rgb + '}')
    scope = 'html[data-palette]:not([data-palette="base"]) '
    # Built-in color utility classes override --c locally; keep their text helper
    # in the same scope rather than inheriting an ancestor's contrast role.
    for role in 'teal ember red amber violet blue green pink orchid lime indigo cyan'.split():
        rules.append(scope + f'.c-{role}' + '{--palette-ink-c:var(--' + role + '-ink,var(--' + role + '))}')
    rules.append(scope + '.c-accent{--palette-ink-c:var(--primary-ink,var(--primary))}')
    rules.append(scope + '.c-lit{--palette-ink-c:var(--palette-ink-lit,var(--lit))}')
    return '\n'.join(rules)


# Protect quoted attribute selectors, artwork, and already bridged fallbacks.
COLOR = re.compile(r'url\((?:[^)"\']|"[^"]*"|\'[^\']*\')*\)|"[^"\n]*"|\'[^\'\n]*\'|var\(--palette-[^)]*\)|#[0-9a-fA-F]{3,8}\b|rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*[.\d]+)?\s*\)')


def bridge_css(css):
    """Use conditional fallbacks so base renders its original literal values."""
    def replace(match):
        color = match.group()
        if color.startswith('#'):
            value = color[1:].lower()
            if value in HEX_ROLE:
                return f'var(--palette-{value},{color})'
        elif color.startswith(('rgb(', 'rgba(')):
            channels = [c.strip() for c in color[color.index('(')+1:-1].split(',')]
            rgb = ','.join(channels[:3])
            if rgb in RGB_ROLE:
                alpha = ',' + channels[3] if len(channels) == 4 else ''
                return color[:color.index('(')] + f'(var(--palette-rgb-{rgb.replace(",", "-")},{rgb}){alpha})'
        return color
    result = COLOR.sub(replace, css)
    # Only CSS text color uses contrast variants. Fills, strokes, backgrounds,
    # RGB tints and gradients keep the exact palette values in both appearances.
    def text_color(match):
        def ink(token):
            value = token.group()
            if value.startswith('var(--palette-ink-'):
                return value
            role = HEX_ROLE.get(token.group('hex')) if token.group('hex') else token.group('role')
            return f'var(--palette-ink-{role},{value})' if role in INK_ROLES else value
        return match[1] + INK_VAR.sub(ink, match[2])
    return re.sub(r'((?<![\w-])color\s*:\s*)([^;{}]+)', text_color, result)


INK_VAR = re.compile(r'var\(--palette-ink-[^)]*\)|var\(--palette-(?P<hex>[0-9a-f]{6}),#[0-9a-fA-F]{6}\)|var\(--(?P<role>[a-z][a-z0-9-]*)\)')
