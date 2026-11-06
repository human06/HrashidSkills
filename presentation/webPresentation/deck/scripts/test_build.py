"""Portable build regressions; run with python3 scripts/test_build.py."""
import json
from base64 import b64decode, b64encode
from pathlib import Path
import re
import tempfile
import unittest
from build_deck import ASSETS, build
from palettes import bridge_css, load_registry
from apply_design import apply_design, write_design
from compare_deck import build_comparison


class BuildTests(unittest.TestCase):
    def test_comparison_embeds_one_story_with_the_requested_designs(self):
        source = (ASSETS / 'sources/starter.html').read_text()
        registry = load_registry(ASSETS / 'palettes.json')
        custom = dict(registry['epam-ai'], label='Custom')
        config = {'title': 'Design & story </script>', 'palettes': {'custom': custom}}
        viewer = build_comparison(source, config, ['custom', 'ah-one-ai'])
        data = json.loads(re.search(r'id="comparison-data">(.*?)</script>', viewer)[1])
        self.assertEqual(data['designs'], ['custom', 'ah-one-ai'])
        deck = b64decode(data['deck']).decode()
        self.assertEqual(deck, build(source, config, comparison_designs=()))
        self.assertNotIn('data-design-artifacts="ah-one-ai"', deck)
        blank = json.loads(re.search(r'id="comparison-data">(.*?)</script>', build_comparison())[1])
        self.assertIsNone(blank['deck'])
        self.assertIn('data-design-artifacts="ah-one-ai"', b64decode(blank['artwork']).decode())

    def test_comparison_checks_design_subset_and_source_motion(self):
        source = build((ASSETS / 'sources/starter.html').read_text())
        with self.assertRaisesRegex(ValueError, 'Unknown design'):
            build_comparison(source, designs=['base', 'typo'])
        with self.assertRaisesRegex(ValueError, 'different designs'):
            build_comparison(source, designs=['base', 'base'])
        modified = source.replace('dur=dur||(travel?2300:1150)', 'dur=dur||(travel?2900:1150)')
        with self.assertRaisesRegex(ValueError, 'Custom motion'):
            build_comparison(modified)

    def test_theme_artifacts_follow_the_selected_design_on_build_and_restyle(self):
        source = (ASSETS / 'sources/starter.html').read_text(encoding='utf-8')
        artifacts = ASSETS / 'design-artifacts'
        masks = {'epam/logos/legacy-letters.png', 'epam/logos/legacy-brackets.png'}
        expected = {'base': set(), 'epam-official': masks, 'epam-ai': masks,
                    'epam-github': masks, 'ah-one-ai': set()}

        def payload(asset):
            return b64encode(asset.read_bytes()).decode('ascii')

        known = {str(asset.relative_to(artifacts)): payload(asset)
                 for asset in artifacts.rglob('*') if asset.suffix in {'.png', '.svg', '.ttf', '.otf'}}
        # A legacy deck can also carry a stock EPAM mask in its source CSS.
        old = known['epam/logos/legacy-letters.png']
        source = f'<style>.p-logo-l{{--m:url(data:image/png;base64,{old});background:var(--txt)}}</style>' + source
        previous = build(source, {'palette': 'ah-one-ai'})
        for design, files in expected.items():
            with self.subTest(design=design):
                rebuilt, _ = apply_design(previous, design)
                for output in (build(source, {'palette': design}), rebuilt):
                    self.assertEqual({name for name, data in known.items() if data in output}, files)
                previous = rebuilt

    def test_design_application_preserves_content_cameras_and_world(self):
        world = {'finale': {'x': 4200, 'y': 2676, 's': .138},
                 'auras': [{'size': 1500, 'alpha': .07, 'color': '#FF4868'}]}
        source = build((ASSETS / 'sources/starter.html').read_text(), {'world': world})
        before = re.findall(r'<section\b.*?</section>', source, re.S)
        ids = set()
        designs = load_registry(ASSETS / 'palettes.json')
        for design in designs:
            output, details = apply_design(source, design)
            config = json.loads(output.split('id="deck-config">')[1].split('</script>')[0])
            self.assertEqual(re.findall(r'<section\b.*?</section>', output, re.S), before)
            self.assertEqual(config['world'], world)
            self.assertEqual(config['palette'], design)
            self.assertEqual(len(details['checkedMotionFunctions']), 11)
            ids.add(config['id'])
        self.assertEqual(len(ids), len(designs))

    def test_design_and_appearance_are_independent(self):
        source = build((ASSETS / 'sources/starter.html').read_text(), {'mode': 'dark'})
        _, keep = apply_design(source, 'epam-ai')
        output, recommended = apply_design(source, 'epam-ai', 'palette')
        again, explicit = apply_design(output, 'epam-official', 'light')
        self.assertEqual(keep['mode'], 'dark')
        self.assertEqual(recommended['mode'], 'light')
        self.assertEqual(explicit['mode'], 'light')
        back, _ = apply_design(again, 'epam-ai')
        config = lambda html: json.loads(html.split('id="deck-config">')[1].split('</script>')[0])
        self.assertEqual(config(back)['id'], config(output)['id'])

    def test_in_place_design_application_has_an_exact_backup(self):
        source = build((ASSETS / 'sources/starter.html').read_text())
        with tempfile.TemporaryDirectory() as temp:
            p = Path(temp) / 'my deck.html'
            p.write_bytes(source.encode())
            details = write_design(p, p, 'epam-official')
            self.assertEqual(Path(details['backup']).read_bytes(), source.encode())
            self.assertNotEqual(p.read_bytes(), source.encode())
            self.assertIn('data-palette="epam-official"', p.read_text())

    def test_custom_motion_or_scripts_are_not_silently_replaced(self):
        source = build((ASSETS / 'sources/starter.html').read_text())
        custom = source.replace('dur=dur||(travel?2300:1150)', 'dur=dur||(travel?2900:1150)')
        self.assertNotEqual(custom, source)
        for text in [custom, source.replace('</body>', '<script>window.customStory=true;</script></body>')]:
            with tempfile.TemporaryDirectory() as temp:
                p = Path(temp) / 'custom.html'
                p.write_text(text)
                with self.assertRaisesRegex(ValueError, 'Custom motion|Extra inline'):
                    write_design(p, p, 'epam-ai')
                self.assertEqual(p.read_text(), text)
                self.assertEqual(len(list(Path(temp).iterdir())), 1)

    def test_epam_graphic_colors_preserve_source_hexes_in_both_appearances(self):
        # Evidence: Presales theme1 accent2..6 and explicit AI-deck shape colors.
        expected = {'blue': '#418DFF', 'teal': '#107E8D', 'violet': '#8353D2',
                    'indigo': '#3055DA', 'cyan': '#009CBE'}
        registry = load_registry(ASSETS / 'palettes.json')
        for name in ['epam-official', 'epam-ai']:
            for mode, tokens in registry[name]['modes'].items():
                with self.subTest(palette=name, mode=mode):
                    for role, color in expected.items():
                        self.assertEqual(tokens[role], color)
                        self.assertEqual(tokens['brand-' + role], color)
                    self.assertTrue(all(tokens[role] in expected.values() for role in ['primary', 'secondary', 'tertiary', 'quaternary']))

    def test_text_contrast_variants_do_not_replace_graphics(self):
        source = '.example{color:var(--blue);background:var(--blue);fill:#62A0FF;stroke:#38E5CE}.caption{color:#62A0FF}'
        result = bridge_css(source)
        self.assertIn('color:var(--palette-ink-blue,var(--blue))', result)
        self.assertIn('background:var(--blue)', result)
        self.assertIn('fill:var(--palette-62a0ff,#62A0FF)', result)
        self.assertIn('stroke:var(--palette-38e5ce,#38E5CE)', result)
        self.assertIn('color:var(--palette-ink-blue,var(--palette-62a0ff,#62A0FF))', result)
        self.assertEqual(result, bridge_css(result))

    def test_palettes_rebuild_without_losing_selection_or_custom_definitions(self):
        source = (ASSETS / 'sources/starter.html').read_text(encoding='utf-8')
        registry = load_registry(ASSETS / 'palettes.json')
        custom = dict(registry['epam-ai'], label='Customer')
        for palette in [*registry, 'customer']:
            with self.subTest(palette=palette):
                first = build(source, {'palette': palette, 'palettes': {'customer': custom}})
                self.assertEqual(first, build(first))
                self.assertIn(f'data-palette="{palette}"', first)
                self.assertEqual(first.count('<section class="frame'), 3)

    def test_invalid_palette_does_not_silently_build_the_wrong_brand(self):
        source = (ASSETS / 'sources/starter.html').read_text(encoding='utf-8')
        for config in [{'palette': 'epma'}, {'mode': 'grey'}, {'palettes': {'base': {}}},
                       {'palettes': {'customer': {'label': 'Customer', 'defaultMode': 'dark', 'treatment': 'solid', 'modes': {'dark': {}, 'light': {}}}}}]:
            with self.subTest(config=config), self.assertRaises(ValueError):
                build(source, config)

    def test_color_bridge_preserves_artwork_selectors_and_fallbacks(self):
        source = '[fill="#38E5CE"]{color:#38E5CE;background:rgba(56,229,206,.4);mask:url("data:image/svg+xml,#38E5CE")}'
        result = bridge_css(source)
        self.assertIn('[fill="#38E5CE"]', result)
        self.assertIn('url("data:image/svg+xml,#38E5CE")', result)
        self.assertIn('var(--palette-38e5ce,#38E5CE)', result)
        self.assertEqual(result, bridge_css(result))

    def test_rebuild_is_stable_and_preserves_legacy_frames(self):
        source = '<style>\n.custom { color: red; }\n</style>' + (ASSETS / 'sources/starter.html').read_text(encoding='utf-8')
        first = build(source, {'id': 'regression', 'finale': {'text': 'Closing'}})
        self.assertEqual(first, build(first))
        self.assertEqual(first.count('<section class="frame'), 3)
        self.assertIn('data-cams=\'[[0, 0, 1], "world"]\'', first)
        self.assertIn('class="frame a-title"', first)

    def test_json_survives_html_delimiters(self):
        source = (ASSETS / 'sources/starter.html').read_text(encoding='utf-8')
        title = 'Demo </script><script> & quoted "title"'
        output = build(source, {'title': title})
        payload = output.split('<script type="application/json" id="deck-config">', 1)[1].split('</script>', 1)[0]
        self.assertEqual(json.loads(payload)['title'], title)

    def test_invalid_waffle_cannot_misrepresent_the_total(self):
        source = '''<div id="stage" data-acts='[{"k":"Act I"}]'></div>
        <section class="frame"><div class="cd-waffle" data-parts='[{"v":80},{"v":40}]'></div></section>'''
        with self.assertRaisesRegex(ValueError, 'Waffle values'):
            build(source)

    def test_all_archetypes_build_with_the_same_assets(self):
        archetypes = sorted((ASSETS.parent / 'archetypes').glob('*.html'))
        source = '<div id="stage"></div>' + '\n'.join(p.read_text(encoding='utf-8') for p in archetypes)
        output = build(source, {'acts': [{'k': str(i)} for i in range(6)]})
        self.assertEqual(output.count('<section class="frame'), len(archetypes))

    def test_roadmap_rejects_an_item_outside_the_displayed_period(self):
        source = (ASSETS.parent / "archetypes/roadmap.html").read_text(encoding="utf-8")
        source = source.replace('"t":"2027-06-08"', '"t":"2027-07-08"')
        with self.assertRaisesRegex(ValueError, "must fit the date range"):
            build(source, {"acts": [{"k": "Plan"}]})

    def test_bridge_rejects_a_change_without_a_numeric_value(self):
        source = (ASSETS.parent / "archetypes/bridge.html").read_text(encoding="utf-8")
        source = source.replace('"v":-32', '"v":"unknown"')
        with self.assertRaisesRegex(ValueError, "needs a finite number"):
            build(source, {"acts": [{"k": "Results"}]})

    def test_backup_links_and_questions_survive_design_application(self):
        source = '<section class="frame"><button data-goto="method">Show</button></section>'
        source += '<section class="frame" id="method" data-backup><h2>Method</h2></section>'
        config = {"acts": [{"k": "Story"}], "talk": {"qa": [{"question": "How?", "goto": "method"}]}}
        output, _ = apply_design(build(source, config), "epam-ai")
        self.assertIn(source.split("</section>")[0] + "</section>", output)
        self.assertIn('id="method" data-backup', output)
        self.assertIn('"goto": "method"', output)

    def test_backup_targets_cannot_point_to_a_main_frame(self):
        source = '<section class="frame" id="story"></section>'
        config = {"acts": [{"k": "Story"}], "talk": {"qa": [{"question": "How?", "goto": "story"}]}}
        with self.assertRaisesRegex(ValueError, "does not match a backup frame id"):
            build(source, config)

    def test_world_metadata_survives_rebuild(self):
        source = (ASSETS / 'sources/starter.html').read_text(encoding='utf-8')
        world = {'finale': {'x': 4200, 'y': 2676, 's': .138},
                 'thread': 'M800,450 L8480,450', 'showActsOnZoom': True,
                 'minimap': {'viewBox': [-200, -300, 8900, 4400], 'radius': 60},
                 'auras': [{'size': 1500, 'alpha': .07, 'color': 'teal'}]}
        output = build(source, {'world': world})
        payload = output.split('<script type="application/json" id="deck-config">', 1)[1].split('</script>', 1)[0]
        self.assertEqual(json.loads(payload)['world'], world)
        self.assertEqual(output, build(output))

    def test_invalid_world_geometry_is_rejected(self):
        source = (ASSETS / 'sources/starter.html').read_text(encoding='utf-8')
        for world in [{'finale': {'x': 0, 'y': 0, 's': 0}},
                      {'minimap': {'viewBox': [0, 0, -1, 900]}},
                      {'auras': [{'size': 1500, 'alpha': 2, 'color': 'teal'}]}]:
            with self.subTest(world=world), self.assertRaises(ValueError):
                build(source, {'world': world})


if __name__ == '__main__':
    unittest.main()
