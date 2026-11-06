/* Color selection is independent of camera, story and light/dark mode. */
function createDeckPalettes(D,H,CFG,Q,ID,sync){
  'use strict';
  const data=JSON.parse((D.querySelector('#deck-palettes')||{}).textContent||'{}');
  const palettes=data.palettes||{base:{label:'Base',defaultMode:'dark',treatment:'heritage'}};
  const has=id=>Object.prototype.hasOwnProperty.call(palettes,id);
  let savedTheme=null,savedPalette=null;
  try{savedTheme=localStorage.getItem('cdeck:'+ID+':theme');savedPalette=localStorage.getItem('cdeck:'+ID+':palette')}catch(e){}
  let active=[Q.get('palette'),savedPalette,CFG.palette,'base'].find(has)||'base';
  H.dataset.palette=active;H.dataset.paletteTreatment=palettes[active].treatment;
  H.classList.toggle('light',(Q.get('theme')||savedTheme||CFG.mode||palettes[active].defaultMode||'dark')==='light');
  D.querySelectorAll('.a-title > .in,.frame > .in:has(.p-title > .p-gov)').forEach(cover=>{
    if(!cover.closest('[data-color-fixed]')&&!cover.querySelector('.p-logo')){
      cover.insertAdjacentHTML('afterbegin','<div class="p-logo fx" style="--d:500ms" role="img" aria-label="EPAM" hidden><i class="p-logo-l"></i><i class="p-logo-b"></i></div>');
    }
  });
  const titleMarks=Array.from(D.querySelectorAll('.p-logo[aria-label="EPAM"]:has(> .p-logo-l)'))
    .filter(mark=>!mark.closest('[data-color-fixed]')&&
      !Array.from(mark.querySelectorAll('.p-logo-l,.p-logo-b')).some(part=>getComputedStyle(part).getPropertyValue('--m').trim()));
  titleMarks.forEach(mark=>mark.setAttribute('data-design-title-mark',''));
  const marks=new Map(Array.from(D.querySelectorAll('style[data-design-artifacts]'),style=>[style.dataset.designArtifacts,style.dataset.titleMark]));
  const edits=[],seenElements=new WeakMap();
  function color(value,property,element){
    if(property==='--lit'&&element.classList.contains('frame')&&!element.hasAttribute('data-status-accent')&&/^var\(--(?:ember|red|amber)\)$/.test(value.trim()))return 'var(--quaternary)';
    const frame=element.closest('.frame');
    const aura=element.classList.contains('cd-aura');
    const auraFrame=aura?D.querySelectorAll('.frame')[Array.from(D.querySelectorAll('.cd-aura')).indexOf(element)]:null;
    const graphicRole=role=>{
      if(aura&&auraFrame&&!auraFrame.hasAttribute('data-status-accent')&&['ember','red','amber'].includes(role))return 'quaternary';
      return role==='amber'&&(element.closest('.a-blueprint')||frame&&frame.querySelector('svg.hld'))?'quaternary':role;
    };
    const isText=property==='color'||(property==='fill'&&['text','tspan','textpath'].includes(element.tagName.toLowerCase()));
    const roleValue=role=>isText?'var(--'+role+'-ink,var(--'+role+'))':'var(--'+role+')';
    const variable=value.trim().match(/^var\(--([a-z][a-z0-9-]*)\)$/);
    if(isText&&variable&&Object.prototype.hasOwnProperty.call((palettes[active].modes||{}).light||{},variable[1]))return roleValue(graphicRole(variable[1]));
    return value.replace(/url\((?:[^)"']|"[^"]*"|'[^']*')*\)|var\(--palette-[^)]*\)|var\(--[a-z][a-z0-9-]*\)|#[0-9a-fA-F]{3,8}\b|rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*[.\d]+)?\s*\)/g,c=>{
      if(c[0]==='#'){
        let hex=c.slice(1).toLowerCase();if(hex.length===3)hex=hex.split('').map(x=>x+x).join('');
        const role=graphicRole((data.hexRoles||{})[hex.slice(0,6)]);
        if(role){if(hex.length===8)return 'color-mix(in srgb,'+roleValue(role)+' '+(parseInt(hex.slice(6),16)/255*100)+'%,transparent)';return roleValue(role)}
        if(hex==='ffffff'){
          const sibling=element.previousElementSibling;
          if(element.tagName.toLowerCase()==='text'&&sibling&&/^#2e6fe0$/i.test(sibling.getAttribute('fill')||''))return 'var(--on-blue,var(--on-accent))';
          return 'var(--'+(/background/.test(property)?'panel':'txt')+')';
        }
        if(hex==='000000')return 'var(--'+(/color|stroke/.test(property)||element.tagName.toLowerCase()==='text'?'txt':'panel')+')';
      }else if(/^var\(--[a-z][a-z0-9-]*\)$/.test(c)){
        const role=c.slice(6,-1),mapped=graphicRole(role);if(mapped!==role)return roleValue(mapped);
      }else if(/^rgba?\(/.test(c)){
        const parts=c.slice(c.indexOf('(')+1,-1).split(',').map(x=>x.trim()),rgb=parts.slice(0,3).join(',');
        const role=(data.rgbRoles||{})[rgb];
        if(role&&(isText||graphicRole(role)!==role))return 'color-mix(in srgb,'+roleValue(graphicRole(role))+' '+(parts.length===4?Number(parts[3])*100:100)+'%,transparent)';
        if(role)return c.slice(0,c.indexOf('('))+'(var(--palette-rgb-'+rgb.replace(/,/g,'-')+','+rgb+')'+(parts.length===4?','+parts[3]:'')+')';
      }return c;
    });
  }
  function artwork(){
    if(active!=='base')D.querySelectorAll('#stage [style],#stage [fill],#stage [stroke],#stage [stop-color]').forEach(e=>{
      if(e.closest('[data-color-fixed],.p-logo'))return;
      let seen=seenElements.get(e);if(!seen){seen=new Set();seenElements.set(e,seen)}
      const remember=(kind,key,value,priority)=>{
        const id=kind+key;if(seen.has(id))return;seen.add(id);
        const mapped=color(value,key,e);if(mapped!==value)edits.push({e,kind,key,value,mapped,priority});
      };
      ['fill','stroke','stop-color'].forEach(k=>{if(e.hasAttribute(k))remember('attr',k,e.getAttribute(k),'')});
      Array.from(e.style).forEach(k=>remember('style',k,e.style.getPropertyValue(k),e.style.getPropertyPriority(k)));
      // Resolve per-frame/per-component text accents where --lit/--c is set.
      // Helpers are recorded too, so switching back to base removes them.
      ['--lit','--c'].forEach(k=>{
        const value=e.style.getPropertyValue(k),mapped=color(value,k,e),role=mapped.trim().match(/^var\(--([a-z][a-z0-9-]*)\)$/),key='--palette-ink-'+k.slice(2);
        if(!value||!role||seen.has('style'+key))return;seen.add('style'+key);
        edits.push({e,kind:'style',key,value:e.style.getPropertyValue(key),mapped:'var(--'+role[1]+'-ink,var(--'+role[1]+'))',priority:e.style.getPropertyPriority(key)});
      });
    });
    edits.forEach(x=>{const value=active==='base'?x.value:x.mapped;if(x.kind==='attr')x.e.setAttribute(x.key,value);else x.e.style.setProperty(x.key,value,x.priority)});
  }
  function label(){
    const b=D.querySelector('[data-a="palette"]');if(b){const value='Color palette: '+palettes[active].label+' (C)';b.setAttribute('aria-label',value);b.title=value}
    const markName=marks.get(active);
    titleMarks.forEach(mark=>{
      mark.hidden=!markName;
      if(markName)mark.setAttribute('aria-label',markName);
    });
    if(CFG.brand?.name==='EPAM'&&!CFG.brand.logo){
      const hudBrand=D.querySelector('.cd-hud .brand > b');
      if(hudBrand){
        hudBrand.textContent=markName||(active==='ah-one-ai'?palettes[active].label:CFG.brand.name);
        hudBrand.setAttribute('data-design-hud','');
      }
    }
    const dark=(palettes[active].modes||{}).dark;
    ['accent','ember','green','amber'].forEach(role=>{
      const token=role==='accent'?'primary':role;
      if(dark)D.body.style.setProperty('--pv-'+role,(active==='ah-one-ai'&&dark[token+'-ink'])||dark[token]);
      else D.body.style.removeProperty('--pv-'+role);
    });
  }
  function set(id,persist=true){
    if(!has(id))throw new RangeError('Unknown palette: '+id);
    active=id;H.dataset.palette=id;H.dataset.paletteTreatment=palettes[id].treatment;artwork();label();
    if(persist){
      try{localStorage.setItem('cdeck:'+ID+':palette',id)}catch(e){}sync();
      const notice=D.querySelector('.cd-goto');if(notice){notice.textContent='Palette: '+palettes[id].label;notice.classList.add('on');clearTimeout(notice._paletteTimer);notice._paletteTimer=setTimeout(()=>notice.classList.remove('on'),2200)}
      const live=D.querySelector('#cd-live');if(live)live.textContent='Palette: '+palettes[id].label;
    }
    D.dispatchEvent(new CustomEvent('deckpalettechange',{detail:{palette:id}}));return id;
  }
  function cycle(){const ids=Object.keys(palettes);return set(ids[(ids.indexOf(active)+1)%ids.length])}
  return {set,cycle,get:()=>active,ids:Object.keys(palettes),has,refresh:()=>{artwork();label()}};
}
