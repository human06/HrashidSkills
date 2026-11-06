(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const metadataTag = id => new RegExp('(<script type="application/json" id="' + id + '">)([\\s\\S]*?)(</script>)');
  const artifactTag = /<style data-deck-style="design-artifacts" data-design-artifacts="([a-z][a-z0-9-]*)"[^>]*>[\s\S]*?<\/style>\n?/g;
  const json = value => JSON.stringify(value).replaceAll('<', '\\u003c');
  const decode = encoded => new TextDecoder().decode(Uint8Array.from(atob(encoded), byte => byte.charCodeAt(0)));
  const embedded = JSON.parse($('comparison-data').textContent);
  const bundledArtwork = Array.from(decode(embedded.artwork).matchAll(artifactTag), match => [match[1], match[0]]);
  const previewPolicy = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; media-src data: blob:; base-uri 'none'";
  let story, frames = [], panes = [], pair = [], position = [0, 0], loadId = 0, fileRead = 0;

  function readDeck(source, shortlist) {
    if (!source.includes('<script data-deck-preview="1">') || !source.includes('<head>')) {
      throw new Error('Choose a standalone HTML deck built with deck 2.3 or later. For an older deck, generate a viewer from its source with compare_deck.py.');
    }
    const config = JSON.parse(source.match(metadataTag('deck-config'))?.[2] || 'null');
    const paletteData = JSON.parse(source.match(metadataTag('deck-palettes'))?.[2] || 'null');
    const registry = paletteData?.palettes;
    if (!config || typeof config.title !== 'string' || !registry) {
      throw new Error('This file is missing its story or design metadata.');
    }
    const designs = new Map(Object.entries(registry));
    const ids = shortlist || [config.palette, ...[...designs.keys()].filter(id => id !== config.palette)];
    if (ids.length < 2 || ids.some(id => !/^[a-z][a-z0-9-]{0,63}$/.test(id) ||
        !designs.has(id) || typeof designs.get(id)?.label !== 'string' ||
        !['light', 'dark'].includes(designs.get(id).defaultMode))) {
      throw new Error('This deck needs at least two valid designs to compare.');
    }
    const artwork = new Map(bundledArtwork);
    for (const match of source.matchAll(artifactTag)) artwork.set(match[1], match[0]);
    return {source: source.replace(artifactTag, ''), config, designs, ids, artwork,
      scoped: paletteData.artifactScope === 'design'};
  }

  function notice(message, error = false) {
    $('notice').hidden = !message;
    $('notice').setAttribute('role', error ? 'alert' : 'status');
    $('notice').textContent = message;
  }

  function mode(pane) {
    return $('theme').value === 'default' ? story.designs.get(pane.design).defaultMode : $('theme').value;
  }

  function updatePane(pane) {
    const label = story.designs.get(pane.design).label;
    pane.appearance.textContent = mode(pane) === 'light' ? 'Light' : 'Dark';
    pane.iframe.title = label + ' deck preview' + (pane.side ? ' (' + pane.side + ')' : '');
    pane.download.setAttribute('aria-label', 'Download ' + label + ' HTML');
    if (pane.ready) send(pane, 'design', {palette: pane.design, mode: mode(pane)});
  }

  function send(pane, type, data) {
    pane.iframe.contentWindow.postMessage({deckPreview: pane.id, type, ...data}, '*');
  }

  function loadPane(pane) {
    clearTimeout(pane.timer);
    pane.ready = false;
    pane.id = ++loadId;
    const query = new URLSearchParams({palette: pane.design, theme: mode(pane)});
    if ($('motion').value === 'static') query.set('static', '1');
    const [slide, step] = position;
    const launch = {id: pane.id, query: query.toString(),
      position: slide || step ? 'slide=' + (slide + 1) + '&step=' + step : ''};
    const insert = '<head><meta http-equiv="Content-Security-Policy" content="' + previewPolicy + '">' +
      '<style>.cd-nav,.cd-help,.cd-goto{display:none!important}</style>' +
      '<script type="application/json" id="deck-preview">' + json(launch) + '</script>';
    const artwork = story.ids.map(id => story.artwork.get(id) || '').join('\n');
    updatePane(pane);
    pane.iframe.srcdoc = story.source.replace('<head>', () => insert).replace('</head>', () => artwork + '</head>');
    pane.timer = setTimeout(() => notice('A preview could not start. Try replaying the frame or opening a different deck.', true), 10000);
  }

  function downloadDeck(pane) {
    if (!story.scoped) {
      notice('Rebuild this deck with compare_deck.py before exporting a design with its own artwork.', true);
      return;
    }
    const palette = pane.design;
    const appearance = mode(pane);
    const origin = String(story.config.designSourceId || story.config.id || 'deck');
    const config = {...story.config, designSourceId: origin, id: origin + '-' + palette, palette, mode: appearance};
    const root = '<html lang="en" data-palette="' + palette + '" data-palette-treatment="' +
      (['heritage', 'solid', 'gradient'].includes(story.designs.get(palette).treatment) ? story.designs.get(palette).treatment : 'solid') +
      '"' + (appearance === 'light' ? ' class="light"' : '') + '>';
    const output = story.source
      .replace(/<html\b[^>]*>/i, () => root)
      .replace('</head>', () => (story.artwork.get(palette) || '') + '</head>')
      .replace(metadataTag('deck-config'), (_, start, body, end) => start + '\n' + json(config) + '\n' + end);
    const url = URL.createObjectURL(new Blob([output], {type: 'text/html;charset=utf-8'}));
    const link = document.createElement('a');
    link.href = url;
    link.download = (origin.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '') || 'deck') + '-' + palette + '.html';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function makePane(design, side) {
    const article = $('pane').content.firstElementChild.cloneNode(true);
    const select = article.querySelector('select');
    const heading = article.querySelector('h2');
    const pane = {design, side, article, select, iframe: article.querySelector('iframe'),
      appearance: article.querySelector('.appearance'), download: article.querySelector('button')};
    if (side) {
      article.querySelector('label span').textContent = side === 'left' ? 'Left design' : 'Right design';
      select.replaceChildren(...story.ids.map(id => new Option(story.designs.get(id).label, id)));
      select.value = design;
      select.onchange = () => {
        pane.design = select.value;
        pair[side === 'left' ? 0 : 1] = pane.design;
        updatePane(pane);
        if (!pane.ready) loadPane(pane);
      };
    } else {
      article.querySelector('label').hidden = true;
      heading.textContent = story.designs.get(design).label;
      heading.hidden = false;
    }
    pane.download.onclick = () => downloadDeck(pane);
    $('views').append(article);
    loadPane(pane);
    return pane;
  }

  function showViews(reset = false) {
    const layout = $('layout').value;
    const gallery = layout === 'all';
    if (reset || !panes.length || gallery !== !panes[0].side) {
      panes.forEach(pane => clearTimeout(pane.timer));
      $('views').replaceChildren();
      panes = gallery ? story.ids.map(id => makePane(id)) : [makePane(pair[0], 'left'), makePane(pair[1], 'right')];
    }
    $('views').classList.toggle('detail', layout === 'left' || layout === 'right');
    panes.forEach(pane => {
      pane.article.hidden = !!pane.side && layout !== 'pair' && layout !== pane.side;
    });
    navigation();
  }

  function navigation() {
    const [slide, step] = position;
    const ready = frames.length > 0 && panes.filter(pane => !pane.article.hidden).every(pane => pane.ready);
    $('frame').disabled = !ready;
    $('step').disabled = !ready || frames[slide].steps === 0;
    $('prev').disabled = !ready || (!slide && !step);
    $('next').disabled = !ready || (slide === frames.length - 1 && step === frames[slide]?.steps);
    $('replay').disabled = !story;
    const builds = frames[slide]?.steps;
    $('position').textContent = frames.length ? 'Frame ' + (slide + 1) + ' of ' + frames.length +
      (builds ? ' · Build ' + step + ' of ' + builds : ' · No builds') : 'Loading previews…';
  }

  function setPosition(slide, step) {
    if (!frames[slide] || step < 0 || step > frames[slide].steps) return;
    position = [slide, step];
    $('frame').value = slide;
    if ($('step').length !== frames[slide].steps + 1) {
      $('step').replaceChildren(...Array.from({length: frames[slide].steps + 1}, (_, i) => new Option(String(i), i)));
    }
    $('step').value = step;
    panes.filter(pane => pane.ready).forEach(pane => send(pane, 'go', {slide, step}));
    navigation();
  }

  function openStory(source, shortlist) {
    story = readDeck(source, shortlist);
    frames = [];
    position = [0, 0];
    pair = story.ids.slice(0, 2);
    $('story-title').textContent = story.config.title;
    $('loaded-deck').hidden = false;
    $('open').textContent = 'Open another deck';
    $('summary').textContent = story.ids.length + ' designs available · Synchronized frames and builds';
    $('layout').value = 'pair';
    $('frame').replaceChildren(new Option('Loading…', 0));
    $('step').replaceChildren(new Option('0', 0));
    $('workspace').hidden = false;
    $('empty').hidden = true;
    notice('');
    showViews(true);
  }

  function move(direction) {
    if ($(direction < 0 ? 'prev' : 'next').disabled) return;
    const [slide, step] = position;
    const next = step + direction;
    if (next >= 0 && next <= frames[slide].steps) setPosition(slide, next);
    else setPosition(slide + direction, direction > 0 ? 0 : frames[slide - 1].steps);
  }

  function keyAction(key, pane) {
    if (['ArrowRight', ' ', 'PageDown'].includes(key)) move(1);
    else if (['ArrowLeft', 'PageUp'].includes(key)) move(-1);
    else if (key === 'Home' && !$('frame').disabled) setPosition(0, 0);
    else if (key === 'End' && !$('frame').disabled) setPosition(frames.length - 1, frames.at(-1).steps);
    else if (key.toLowerCase() === 't' && panes.length) {
      $('theme').value = mode(pane || panes.find(view => !view.article.hidden)) === 'dark' ? 'light' : 'dark';
      $('theme').onchange();
    } else if (key.toLowerCase() === 'c' && pane?.side) {
      pane.select.value = story.ids[(story.ids.indexOf(pane.design) + 1) % story.ids.length];
      pane.select.onchange();
    } else return false;
    return true;
  }

  addEventListener('message', e => {
    const data = e.data;
    const pane = panes.find(view => view.id === data?.deckPreview && view.iframe.contentWindow === e.source);
    if (!pane) return;
    if (data.type === 'ready' && !pane.ready && Array.isArray(data.frames) && data.frames.length &&
        data.frames.every(frame => typeof frame?.title === 'string' && Number.isSafeInteger(frame.steps) && frame.steps >= 0 && frame.steps <= 10000)) {
      clearTimeout(pane.timer);
      pane.ready = true;
      updatePane(pane);
      if (!frames.length) {
        frames = data.frames;
        $('frame').replaceChildren(...frames.map((frame, i) => new Option(String(i + 1).padStart(2, '0') + ' · ' + frame.title, i)));
      }
      setPosition(...position);
    } else if (data.type === 'key' && pane.ready && !pane.article.hidden && typeof data.key === 'string') {
      keyAction(data.key, pane);
    }
  });
  addEventListener('keydown', e => {
    if (!story || e.ctrlKey || e.altKey || e.metaKey || e.target.closest?.('button,select,input,textarea,a,[contenteditable]')) return;
    if (keyAction(e.key)) e.preventDefault();
  });
  $('open').onclick = () => $('file').click();
  $('file').onchange = async () => {
    const file = $('file').files[0];
    if (!file) return;
    const ticket = ++fileRead;
    try {
      const source = await file.text();
      if (ticket === fileRead) openStory(source);
    } catch (error) {
      if (ticket === fileRead) notice(error.message, true);
    } finally {
      if (ticket === fileRead) $('file').value = '';
    }
  };
  $('prev').onclick = () => move(-1);
  $('next').onclick = () => move(1);
  $('frame').onchange = () => setPosition(Number($('frame').value), 0);
  $('step').onchange = () => setPosition(position[0], Number($('step').value));
  $('theme').onchange = () => panes.forEach(updatePane);
  $('motion').onchange = $('replay').onclick = () => {
    notice('');
    panes.forEach(loadPane);
    navigation();
  };
  $('layout').onchange = () => showViews();
  if (embedded.deck) {
    try {
      openStory(decode(embedded.deck), embedded.designs);
    } catch (error) {
      notice(error.message, true);
    }
  }
})();
