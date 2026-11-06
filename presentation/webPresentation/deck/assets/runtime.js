/* ════════════════════════════════════════════════════════════════
   deck-heritage · runtime engine (derived from cinematic-deck 1.2)
   World canvas + flying camera, acts, step builds, components,
   presenter view, overview, print. Inlined by scripts/build_deck.py.
   Public API: window.deck  ·  event: 'deckchange' {slide, step}
   ════════════════════════════════════════════════════════════════ */
(function(){
'use strict';
const D=document,H=D.documentElement,FW=1600,FH=900,SVGNS='http://www.w3.org/2000/svg';
const $=(s,r)=>(r||D).querySelector(s), $$=(s,r)=>Array.from((r||D).querySelectorAll(s));
const J=(s,d)=>{if(s==null||s==='')return d;try{return JSON.parse(s)}catch(e){console.warn('[deck] invalid JSON:',String(s).slice(0,120));return d}};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pad2=n=>String(n).padStart(2,'0');
const cvar=c=>!c?'':(/^(#|rgb|hsl|var\(|color-mix|currentColor)/.test(c)?c:'var(--'+c+')');
const hasVar=(e,v)=>e.style.getPropertyValue(v)!=='';
const CFG=J(($('#deck-config')||{}).textContent,{})||{};
const stageMeta=$('#stage');
if(!Array.isArray(CFG.acts))CFG.acts=J(stageMeta&&stageMeta.dataset.acts,[]);
CFG.transition=CFG.transition||(stageMeta&&stageMeta.dataset.transition)||'glide';
const WORLD=CFG.world||{};
const PREVIEW=parent!==window?J($('#deck-preview')?.textContent,null):null;
const Q=new URLSearchParams(PREVIEW?PREVIEW.query:location.search);
const MODE=PREVIEW?'compare':Q.has('presenter')?'presenter':Q.has('print')?'print':Q.has('embed')?'embed':'show';
const ID=String(CFG.id||'deck');
const colors=createDeckPalettes(D,H,CFG,Q,ID,sync);
if(CFG.brand&&CFG.brand.color)H.style.setProperty('--brand',CFG.brand.color);
// CSSOM may insert spaces in inline styles; semantic tokens keep legacy accents
// theme-aware without depending on the original attribute serialization.
const legacyTokens={'#38e5ce':'teal','#13a393':'teal-d','#ff7a45':'ember','#ff4868':'red','#ffb547':'amber','#a98dff':'violet','#62a0ff':'blue','#40e391':'green','#ff5fa2':'pink','#d08cff':'orchid','#b6e35a':'lime','#8c8cff':'indigo','#4fd1e8':'cyan'};
$$('[style]').forEach(e=>['--lit','--c'].forEach(p=>{const token=legacyTokens[e.style.getPropertyValue(p).trim().toLowerCase()];if(token)e.style.setProperty(p,'var(--'+token+')')}));
const REDUCE=Q.get('motion')==='0'||(!Q.has('motion')&&matchMedia('(prefers-reduced-motion: reduce)').matches);
const STATIC=MODE==='embed'||MODE==='print'||Q.get('static')==='1';
if(REDUCE)H.classList.add('reduce');
if(STATIC)H.classList.add('static');
if(MODE==='embed')H.classList.add('embed');
const PALETTE=['blue','ember','teal','violet','pink','green','amber','cyan','indigo','red','lime','orchid'];
function rng(seed){let a=seed>>>0||7;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
/* step specs: "2" exact · "1,3" list · "2-4" range · "2+" from 2 on */
function stepSet(spec){
  const tests=[];let max=0;
  String(spec).split(/[\s,]+/).filter(Boolean).forEach(p=>{let m;
    if((m=p.match(/^(\d+)\+$/))){const a=+m[1];tests.push(s=>s>=a);max=Math.max(max,a)}
    else if((m=p.match(/^(\d+)-(\d+)$/))){const a=+m[1],b=+m[2];tests.push(s=>s>=a&&s<=b);max=Math.max(max,b)}
    else if(/^\d+$/.test(p)){const a=+p;tests.push(s=>s===a);max=Math.max(max,a)}});
  return {test:s=>tests.some(t=>t(s)),max};
}
function lineList(spec){const out=[];String(spec).split(/[\s,]+/).filter(Boolean).forEach(p=>{const m=p.match(/^(\d+)-(\d+)$/);
  if(m){for(let k=+m[1];k<=+m[2];k++)out.push(k)}else if(/^\d+$/.test(p))out.push(+p)});return out}

/* ── icons for diagram nodes (24×24 strokes) ───────────────── */
const ICONS={
  model:'M12 2 21 7.5v9L12 22l-9-5.5v-9Z M3 7.5l9 5.5 9-5.5 M12 13v9',
  agent:'M5 7h14v13H5Z M12 3v4 M2 12h3 M19 12h3 M9 12h.1 M15 12h.1 M9 16h6',
  shield:'M12 3 20 6v6c0 5-8 9-8 9s-8-4-8-9V6Z',
  doc:'M6 3h9l3 3v15H6Z M15 3v3h3 M9 10h6 M9 14h6 M9 18h4',
  rules:'M5 3h14v18H5Z M8 7h8 M8 11h5 M8 16l2 2 5-5',
  db:'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3v12c0 1.7-3.6 3-8 3s-8-1.3-8-3Z M4 6c0 1.7 3.6 3 8 3s8-1.3 8-3 M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
  api:'M8 6 3 12l5 6 M16 6l5 6-5 6 M13.5 4l-3 16',
  user:'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M4 21c0-4 3.6-7 8-7s8 3 8 7',
  users:'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z M2 20c0-3.6 3.1-6 7-6s7 2.4 7 6 M16 4.5a3.5 3.5 0 0 1 0 6.5 M18 14c2.4.6 4 2.8 4 6',
  cloud:'M7 19h10.5a4.5 4.5 0 0 0 .6-9 6.5 6.5 0 0 0-12.6 1.8A3.6 3.6 0 0 0 7 19Z',
  lock:'M6 11h12v10H6Z M8 11V7a4 4 0 0 1 8 0v4 M12 15v2',
  gear:'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M12 2v3 M12 19v3 M2 12h3 M19 12h3 M4.9 4.9 7 7 M17 17l2.1 2.1 M4.9 19.1 7 17 M17 7l2.1-2.1',
  chart:'M4 20V11 M10 20V4 M16 20v-6 M22 20H2',
  layers:'M12 3 2 8l10 5 10-5Z M2 13l10 5 10-5 M2 18l10 5 10-5',
  bolt:'M13 2 4 14h7l-1 8 9-12h-7Z',
  eye:'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  check:'M4 12.5 9 17.5 20 6.5',
  search:'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z M21 21l-5.2-5.2',
  gateway:'M4 21V9l8-6 8 6v12 M9 21v-6h6v6',
  code:'M8 7 3 12l5 5 M16 7l5 5-5 5',
  chat:'M3 5h18v12H9l-5 4V17H3Z',
  globe:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M3 12h18 M12 3c3 3.5 3 14.5 0 18 M12 3c-3 3.5-3 14.5 0 18',
  queue:'M4 5h16v4H4Z M4 10h16v4H4Z M4 15h16v4H4Z',
  flag:'M5 21V4 M5 4h12l-2 4 2 4H5'
};

/* ════ components: data attributes in, standard step primitives out ════ */
const C={};
/* svg.cd-network — ecosystem sprawl: nodes → satellites (step) → chaos links (step) */
C.network=svg=>{
  const nodes=J(svg.dataset.nodes,[]),sats=J(svg.dataset.sats,[]),n=nodes.length;if(!n)return;
  const rnd=rng(+svg.dataset.seed||7),satStep=svg.dataset.satStep!=null?+svg.dataset.satStep:1,chaosStep=svg.dataset.chaosStep!=null?+svg.dataset.chaosStep:2;
  const rows=n<=6?1:n<=12?2:3,per=Math.ceil(n/rows),x0=+(svg.dataset.x0||190),x1=+(svg.dataset.x1||1410);
  const top=+(svg.dataset.top||(rows===1?430:rows===2?318:290)),gap=+(svg.dataset.gap||(rows===3?175:210)),colW=(x1-x0)/Math.max(per-1,1);
  svg.setAttribute('viewBox','0 0 1600 900');
  const P=nodes.map((label,k)=>{const r=Math.floor(k/per),c=k%per,cnt=Math.min(per,n-r*per),off=(per-cnt)*colW/2;
    return {label,x:(per===1?800:x0+off+c*colW)+(rnd()-.5)*40,y:top+r*gap+(rnd()-.5)*34}});
  const S=sats.slice(0,n).map((s,k)=>{const o=typeof s==='string'?{label:s}:s;return {label:o.label,c:cvar(o.c||PALETTE[k%PALETTE.length]),x:P[k].x+(rnd()-.5)*50,y:P[k].y+64}});
  const ends=S.length?S:P,L=+(svg.dataset.links||Math.round(ends.length*1.6)),uid='h'+Math.floor(rnd()*1e9);
  let h=`<defs><radialGradient id="${uid}"><stop offset="0" stop-color="var(--ember)" stop-opacity=".20"/><stop offset="1" stop-color="var(--ember)" stop-opacity="0"/></radialGradient></defs>`;
  h+=`<ellipse class="heat" data-step="${chaosStep}" cx="800" cy="${top+gap*(rows-1)/2+40}" rx="700" ry="330" fill="url(#${uid})"/>`;
  if(ends.length>1){h+=`<g class="chaos" data-step="${chaosStep}">`;
    for(let k=0;k<L;k++){const a=ends[Math.floor(rnd()*ends.length)];let b=ends[Math.floor(rnd()*ends.length)];if(a===b)b=ends[(ends.indexOf(a)+1)%ends.length];
      const mx1=a.x+(b.x-a.x)*.3,mx2=a.x+(b.x-a.x)*.7,c1=a.y+(rnd()-.5)*190,c2=b.y+(rnd()-.5)*190,col=['red','amber','ember'][k%3];
      h+=`<path class="draw" pathLength="1" d="M${a.x.toFixed(0)},${a.y.toFixed(0)} C${mx1.toFixed(0)},${c1.toFixed(0)} ${mx2.toFixed(0)},${c2.toFixed(0)} ${b.x.toFixed(0)},${b.y.toFixed(0)}" stroke="var(--${col})" stroke-width="${(1+rnd()*.7).toFixed(1)}" fill="none" style="--d:${k*30}ms;--f:${(1.6+rnd()*1.8).toFixed(1)}s;opacity:${(.45+rnd()*.4).toFixed(2)}"/>`}
    h+='</g>'}
  h+='<g class="nodes">'+P.map((p,k)=>`<g class="pnode" style="--d:${k*70}ms"><circle cx="${p.x.toFixed(0)}" cy="${p.y.toFixed(0)}" r="15" class="pring"/><circle cx="${p.x.toFixed(0)}" cy="${p.y.toFixed(0)}" r="4.5" class="pcore"/><text x="${p.x.toFixed(0)}" y="${(p.y-24).toFixed(0)}" text-anchor="middle" class="pname">${esc(p.label)}</text></g>`).join('')+'</g>';
  if(S.length)h+=`<g class="sats" data-step="${satStep}">`+S.map((s,k)=>`<g class="sat" style="--d:${k*65}ms;--c:${s.c}"><path d="M${P[k].x.toFixed(0)},${(P[k].y+5).toFixed(0)} L${s.x.toFixed(0)},${(s.y-6).toFixed(0)}" stroke="${s.c}" stroke-width="1" stroke-opacity=".6"/><circle cx="${s.x.toFixed(0)}" cy="${s.y.toFixed(0)}" r="5" fill="${s.c}" class="sdot"/><text x="${s.x.toFixed(0)}" y="${(s.y+22).toFixed(0)}" text-anchor="middle" fill="${s.c}" class="sname">${esc(s.label)}</text></g>`).join('')+'</g>';
  svg.innerHTML=h;
  if(!svg.hasAttribute('data-hl'))svg.setAttribute('data-hl',chaosStep+'+');
};
/* svg.cd-gauge — semicircle gauge with pass mark; animates when its step host is .on */
C.gauge=svg=>{
  const min=+(svg.dataset.min||0),max=+(svg.dataset.max||1),v=+(svg.dataset.value||0),f=clamp((v-min)/((max-min)||1),0,1),mark=svg.dataset.mark;
  const fmt=x=>svg.dataset.fmt==='pct'?Math.round(x*100)+'%':String(x);
  svg.setAttribute('viewBox','0 0 300 172');svg.style.setProperty('--off',(1-f).toFixed(4));svg.style.setProperty('--rot',(f*180).toFixed(1)+'deg');
  let h='<path class="gtrack" d="M30,150 A120,120 0 0 1 270,150"/><path class="garc" pathLength="1" d="M30,150 A120,120 0 0 1 270,150"/>';
  if(mark!=null){const a=Math.PI*(1-clamp((+mark-min)/((max-min)||1),0,1));
    h+=`<line class="gmark" x1="${(150+104*Math.cos(a)).toFixed(1)}" y1="${(150-104*Math.sin(a)).toFixed(1)}" x2="${(150+134*Math.cos(a)).toFixed(1)}" y2="${(150-134*Math.sin(a)).toFixed(1)}"/>`}
  h+='<g class="needle"><line x1="150" y1="150" x2="58" y2="150"/><circle cx="150" cy="150" r="6"/></g>';
  if(svg.dataset.labels!=='0')h+=`<text class="gt" x="30" y="170" text-anchor="middle">${esc(fmt(min))}</text><text class="gt" x="270" y="170" text-anchor="middle">${esc(fmt(max))}</text>`;
  svg.innerHTML=h;
  if(!svg.closest('[data-step]'))svg.setAttribute('data-step','0');
};
/* thousands grouping for counters and chart labels: data-sep="," (or " ", ".", "’") */
const grp=(t,sep)=>{if(sep==null||sep==='')return t;const m=String(t).match(/^(-?)(\d+)(\.\d+)?$/);return m?m[1]+m[2].replace(/\B(?=(\d{3})+(?!\d))/g,sep)+(m[3]||''):t};
const cfmt=(el,v)=>{const d=el.dataset;return (d.pre||'')+grp((+v).toFixed(+d.dec||0).padStart(+d.pad||0,'0'),d.sep)+(d.suf||'')};
const sepAttr=host=>host.dataset.sep!=null?` data-sep="${esc(host.dataset.sep)}"`:'';
/* div.cd-bars — bar chart with counters; data-bars='[{"l":"label","v":42,"c":"ember","step":1,"hl":"2"}]' */
C.bars=box=>{
  const data=J(box.dataset.bars,[]),max=+(box.dataset.max||Math.max(1,...data.map(d=>+d.v||0)));
  const unit=box.dataset.unit||'',dec=+(box.dataset.dec||0),pre=box.dataset.pre||'',mark=box.dataset.mark;
  box.innerHTML=data.map((d,k)=>{const v=+d.v||0,c=cvar(d.c),u=d.unit!=null?d.unit:unit,p=d.pre!=null?d.pre:pre;
    return `<div class="bar${d.dim?' dim':''}"${d.step!=null?` data-step="${d.step}"`:''}${d.hl!=null?` data-hl="${d.hl}"`:''} style="--v:${clamp(v/max,0,1).toFixed(4)};--d:${k*120}ms${c?';--c:'+c:''}"><span class="bl">${esc(d.l||'')}</span><span class="bt"><i class="bf"></i>${mark!=null?`<i class="bm" style="--m:${clamp(+mark/max,0,1)}"></i>`:''}</span><b class="bv" data-count="${v}" data-dec="${d.dec!=null?d.dec:dec}" data-pre="${esc(p)}" data-suf="${esc(u)}"${sepAttr(box)} data-delay="${k*120+200}">${esc(p)}0${esc(u)}</b></div>`}).join('');
};
/* svg.cd-track — journey line with milestones and lock badges that engage per step */
C.track=svg=>{
  const pts=J(svg.dataset.points,[]),locks=J(svg.dataset.locks,[]),pk=svg.dataset.packet,w=+(svg.dataset.w||1408),x0=60,x1=w-60,y=56,X=f=>+(x0+(x1-x0)*f).toFixed(1);
  svg.setAttribute('viewBox',`0 0 ${w} 170`);
  const at=locks.map(l=>+l.at);
  let h=`<path class="base draw en" pathLength="1" d="M${x0},${y} H${x1}" style="--d:900ms"/>`;
  locks.forEach((l,k)=>{const a=l.from!=null?+l.from:(k===0?0:(at[k-1]+at[k])/2),b=l.to!=null?+l.to:(k===locks.length-1?1:(at[k]+at[k+1])/2);
    h+=`<g data-step="${l.step!=null?l.step:k+1}"><path class="seg draw" pathLength="1" d="M${X(a)},${y} H${X(b)}" style="--c:${cvar(l.c)||'var(--lit)'};--d:150ms"/></g>`});
  pts.forEach((p,k)=>{const x=X(+p.at||0),M=!!p.major;
    h+=`<g class="pt${M?' major':''} svs en" style="--d:${1000+k*100}ms"><circle cx="${x}" cy="${y}" r="${M?18:6}"/><text x="${x}" y="${M?y-32:y-26}">${esc(p.label)}</text></g>`});
  locks.forEach((l,k)=>{const x=X(+l.at||0);
    h+=`<g transform="translate(${x},${y})"><circle class="slot" r="36"/><g class="lock" data-step="${l.step!=null?l.step:k+1}" style="--c:${cvar(l.c)||'var(--lit)'}"><circle class="ring" r="36"/><path class="shield" d="M0,-27 L22,-18 V0 C22,14 12,23 0,29 C-12,23 -22,14 -22,0 V-18 Z"/><path class="tick" d="M-9,1 L-3,7 L10,-6"/><text class="ll" y="74">${esc(l.label||'')}</text>${l.sub?`<text class="ls" y="96">${esc(l.sub)}</text>`:''}</g></g>`});
  if(pk!=null)h+=`<g class="pkg" data-step="${pk}"><circle class="packet" cx="${x0}" cy="${y}" r="5" style="--run:${x1-x0}px"/></g>`;
  svg.innerHTML=h;
};
/* svg.cd-pipeline — stations and blocking gates; a pass run and a fail run on given steps */
C.pipeline=svg=>{
  const st=J(svg.dataset.stations,[]),n=st.length;if(n<2)return;
  const w=+(svg.dataset.w||1440),y=70,x0=40,xs=80,xe=w-140,pass=svg.dataset.pass,fail=svg.dataset.fail,failAt=+(svg.dataset.failAt||0);
  svg.setAttribute('viewBox',`0 0 ${w} 172`);
  const X=k=>Math.round(xs+k*(xe-xs)/(n-1));
  const items=st.map((s,k)=>{const o=typeof s==='string'?{label:s}:Object.assign({},s);if(o.x==null)o.x=X(k);return o});
  const gates=items.filter(o=>o.gate!=null),end=items[n-1];
  let h=`<path class="base" d="M${x0},${y} H${end.x}"/>`;
  const runs={pass:'',fail:''};
  if(pass!=null)runs.pass=`<g class="pass" data-step="${pass}"${fail!=null&&+fail>+pass?` data-until="${+fail-1}"`:''}><path class="lbeam" pathLength="1" d="M${x0},${y} H${end.x}"/></g>`;
  const g=gates[clamp(failAt,0,gates.length-1)];
  if(fail!=null&&g){const gl=g.x-70,len=gl-x0;
    runs.fail=`<g class="fail" data-step="${fail}"><path class="rbeam" d="M${x0},${y} H${gl}" style="--len:${len}"/></g>`}
  h+=runs.pass+runs.fail+'<g class="gates">';
  items.forEach((o,k)=>{
    if(o.gate!=null)h+=`<g class="gate svs en" style="--d:${260+k*80}ms"><rect class="frm" x="${o.x-70}" y="18" width="140" height="104" rx="8"/><text class="gn" x="${o.x}" y="8">${esc(String(o.gate).toUpperCase())}</text>${o.tag?`<text class="gt" x="${o.x}" y="140">${esc(String(o.tag).toUpperCase())}</text>`:''}</g>`;
    else if(k===n-1)h+=`<g class="end svs en" style="--d:${260+k*80}ms"><circle cx="${o.x}" cy="${y}" r="24"/><text x="${o.x}" y="124">${esc(String(o.end||o.label||'').toUpperCase())}</text></g>`;
    else h+=`<g class="st svs en" style="--d:${100+k*80}ms"><circle cx="${o.x}" cy="${y}" r="6"/><text x="${o.x}" y="44">${esc(o.label||'')}</text></g>`});
  h+='</g>';
  const pkt=(cls,style)=>`<g class="gpk" style="${style}"><circle class="halo" cx="${x0}" cy="${y}" r="18"/><circle class="core" cx="${x0}" cy="${y}" r="7"/></g>`;
  if(pass!=null)h+=`<g class="pass" data-step="${pass}"${fail!=null&&+fail>+pass?` data-until="${+fail-1}"`:''}>${pkt('pass',`--run:${end.x-x0}px`)}<circle class="flare" cx="${end.x}" cy="${y}" r="24"/></g>`;
  if(fail!=null&&g){const gl=g.x-70;
    h+=`<g class="fail" data-step="${fail}"><rect class="dark" x="${g.x+80}" y="0" width="${w-g.x-80}" height="160"/>${pkt('fail',`--hit:${gl-x0-2}px`)}<rect class="door top" x="${gl+1}" y="19" width="138" height="51"/><rect class="door bot" x="${gl+1}" y="70" width="138" height="51"/><rect class="hit" x="${gl}" y="18" width="140" height="104" rx="8"/><text class="stop" x="${g.x}" y="162">${esc(String(svg.dataset.stopLabel||'Stopped here').toUpperCase())}</text></g>`;
    if(!svg.hasAttribute('data-hl'))svg.setAttribute('data-hl',fail+'+')}
  svg.innerHTML=h;
};
/* svg.cd-diagram — boxes (.nd), groups (.grp) and routed edges (.ed) from data attributes */
C.diagram=svg=>{
  const N={};
  $$('.grp',svg).forEach(g=>{const x=+g.dataset.x||0,y=+g.dataset.y||0,w=+g.dataset.w||200,h=+g.dataset.h||100;
    g.insertAdjacentHTML('afterbegin',`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12"/>${g.dataset.label?`<text x="${x+18}" y="${y+26}">${esc(g.dataset.label.toUpperCase())}</text>`:''}`)});
  $$('.nd',svg).forEach(g=>{
    const x=+g.dataset.x||0,y=+g.dataset.y||0,w=+g.dataset.w||240,h=+g.dataset.h||110;if(g.id)N[g.id]={x,y,w,h};
    const tag=g.dataset.tag,ttl=g.dataset.title||'',sub=(g.dataset.sub||'').split('|').filter(Boolean),ic=ICONS[g.dataset.icon],center=g.dataset.align==='center';
    const bh=(tag?22:0)+(ttl?30:0)+sub.length*21;let cy=y+(h-bh)/2;const tx=center?x+w/2:x+18,anc=center?' text-anchor="middle"':'';
    let s=`<rect class="box" x="${x}" y="${y}" width="${w}" height="${h}" rx="10"/>`;
    if(tag){s+=`<text class="tag" x="${tx}" y="${(cy+14).toFixed(1)}"${anc}>${esc(tag.toUpperCase())}</text>`;cy+=22}
    if(ttl){const ix=ic&&!center?34:0;if(ic)s+=`<path class="ico" d="${ic}" transform="translate(${center?x+w/2-12:x+18},${(cy+3).toFixed(1)})"/>`;
      s+=`<text class="ttl" x="${tx+ix}" y="${(cy+22).toFixed(1)}"${anc}>${esc(ttl)}</text>`;cy+=30}
    sub.forEach(t=>{s+=`<text class="sub" x="${tx}" y="${(cy+15).toFixed(1)}"${anc}>${esc(t)}</text>`;cy+=21});
    g.insertAdjacentHTML('afterbegin',s)});
  const side=(b,sd,off)=>{off=+off||0;return sd==='r'?[b.x+b.w,b.y+b.h/2+off]:sd==='l'?[b.x,b.y+b.h/2+off]:sd==='t'?[b.x+b.w/2+off,b.y]:[b.x+b.w/2+off,b.y+b.h]};
  $$('.ed',svg).forEach(g=>{
    const a=N[g.dataset.from],b=N[g.dataset.to];if(!a||!b){console.warn('[deck] edge with unknown node',g.dataset.from,'→',g.dataset.to);return}
    let fs=g.dataset.fromSide,ts=g.dataset.toSide;
    if(!fs||!ts){let f2,t2;
      if(b.x>=a.x+a.w){f2='r';t2='l'}else if(b.x+b.w<=a.x){f2='l';t2='r'}else if(b.y>=a.y+a.h){f2='b';t2='t'}else if(b.y+b.h<=a.y){f2='t';t2='b'}
      else{const dx=(b.x+b.w/2)-(a.x+a.w/2),dy=(b.y+b.h/2)-(a.y+a.h/2);if(Math.abs(dx)>Math.abs(dy)){f2=dx>0?'r':'l';t2=dx>0?'l':'r'}else{f2=dy>0?'b':'t';t2=dy>0?'t':'b'}}
      fs=fs||f2;ts=ts||t2}
    const p1=side(a,fs,g.dataset.fromOff),p2=side(b,ts,g.dataset.toOff),H1=fs==='r'||fs==='l',H2=ts==='r'||ts==='l';let pts;
    if(g.dataset.via)pts=[p1,...g.dataset.via.trim().split(/\s+/).map(v=>v.split(',').map(Number)),p2];
    else if(g.dataset.route==='straight'||(H1&&H2&&Math.abs(p1[1]-p2[1])<1)||(!H1&&!H2&&Math.abs(p1[0]-p2[0])<1))pts=[p1,p2];
    else if(H1&&H2){const mx=g.dataset.mid!=null?+g.dataset.mid:(p1[0]+p2[0])/2;pts=[p1,[mx,p1[1]],[mx,p2[1]],p2]}
    else if(!H1&&!H2){const my=g.dataset.mid!=null?+g.dataset.mid:(p1[1]+p2[1])/2;pts=[p1,[p1[0],my],[p2[0],my],p2]}
    else if(H1)pts=[p1,[p2[0],p1[1]],p2];else pts=[p1,[p1[0],p2[1]],p2];
    const d='M'+pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' L');
    const dashed=g.classList.contains('dashed'),pl=dashed?'':' pathLength="1"';
    const head=(p,q)=>{const ang=Math.atan2(p[1]-q[1],p[0]-q[0])*180/Math.PI;return `<path class="ah" d="M-8,-5 L0,0 L-8,5" transform="translate(${p[0].toFixed(1)},${p[1].toFixed(1)}) rotate(${ang.toFixed(1)})"/>`};
    let s=`<path class="eu" d="${d}"${pl}/><path class="ep" d="${d}"${pl}/><path class="ef" d="${d}"/>`;
    if(g.dataset.arrow!=='none')s+=head(pts[pts.length-1],pts[pts.length-2]);
    if(g.hasAttribute('data-both'))s+=head(pts[0],pts[1]);
    if(g.dataset.label){let tot=0;const seg=[];for(let k=1;k<pts.length;k++){const l=Math.hypot(pts[k][0]-pts[k-1][0],pts[k][1]-pts[k-1][1]);seg.push(l);tot+=l}
      let t=tot*(g.dataset.labelAt!=null?+g.dataset.labelAt:.5),k=0;while(k<seg.length-1&&t>seg[k]){t-=seg[k];k++}
      const r=seg[k]?t/seg[k]:0,lx=pts[k][0]+(pts[k+1][0]-pts[k][0])*r,ly=pts[k][1]+(pts[k+1][1]-pts[k][1])*r,lw=g.dataset.label.length*7.6+20;
      s+=`<g class="el"><rect x="${(lx-lw/2).toFixed(1)}" y="${(ly-11.5).toFixed(1)}" width="${lw.toFixed(1)}" height="23" rx="11.5"/><text x="${lx.toFixed(1)}" y="${(ly+4.5).toFixed(1)}">${esc(g.dataset.label)}</text></g>`}
    if(g.hasAttribute('data-packet'))s+=`<circle class="pk" r="4.5"><animateMotion dur="${g.dataset.packet||2.4}s" repeatCount="indefinite" path="${d}"/></circle>`;
    g.innerHTML=s});
};

/* svg.cd-line — trend lines over time with end labels, optional area fill and annotated marks */
const niceMax=v=>{if(!(v>0))return 1;const p=Math.pow(10,Math.floor(Math.log10(v))),m=v/p;return [1,1.2,1.5,2,2.5,3,4,5,6,8,10].find(x=>x>=m-1e-9)*p};
const decOf=v=>Math.min(2,(String(v).split('.')[1]||'').length);
C.line=svg=>{
  const S=J(svg.dataset.series,[]),xs=J(svg.dataset.xLabels,[]),marks=J(svg.dataset.marks,[]);if(!S.length)return;
  const n=Math.max(xs.length,...S.map(s=>(s.v||[]).length));if(n<2)return;
  const W=+(svg.dataset.w||1100),Hh=+(svg.dataset.h||420),unit=svg.dataset.unit||'',pre=svg.dataset.pre||'';
  const all=S.flatMap(s=>(s.v||[]).filter(v=>v!=null&&v!=='').map(Number).filter(Number.isFinite));if(!all.length)return;
  const lo=svg.dataset.min!=null?+svg.dataset.min:Math.min(0,...all);
  let hi=svg.dataset.max!=null?+svg.dataset.max:niceMax(Math.max(...all)*1.04);if(!(hi>lo))hi=lo+1;
  const dec=svg.dataset.dec!=null?+svg.dataset.dec:(hi-lo<=10?1:0),ticks=Math.max(1,+(svg.dataset.ticks||4));
  const L=+(svg.dataset.left||64),R=+(svg.dataset.right||200),T=marks.length?46:16,B=36,pw=W-L-R,ph=Hh-T-B;
  const X=i=>L+pw*i/(n-1),Y=v=>T+ph*(1-(v-lo)/(hi-lo));
  const num=(v,d)=>{const t=(+v).toFixed(d);return d>0?t.replace(/\.?0+$/,''):t},fmt=v=>pre+grp(num(v,dec),svg.dataset.sep)+unit;
  const en=svg.closest('[data-step]')?'':' en';
  let h='<g class="ax">';
  for(let t=0;t<=ticks;t++){const v=lo+(hi-lo)*t/ticks,y=Y(v);
    h+=`<line x1="${L}" x2="${W-R+12}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}"/><text class="yt" x="${L-12}" y="${(y+4).toFixed(1)}">${esc(fmt(v))}</text>`}
  const every=Math.max(1,Math.ceil(n/12));
  for(let i=0;i<n;i++)if(xs[i]!=null&&(i%every===0||i===n-1))h+=`<text class="xt" x="${X(i).toFixed(1)}" y="${Hh-10}">${esc(xs[i])}</text>`;
  h+='</g>';
  marks.forEach((m,j)=>{const x=X(clamp(+m.at||0,0,n-1)).toFixed(1),st=m.step!=null;
    h+=`<g class="mk"${st?` data-step="${m.step}"`:''} style="--c:${cvar(m.c)||'var(--txt2)'}"><g class="svs${st?'':en}" style="--d:${st?0:1200+j*150}ms"><line x1="${x}" x2="${x}" y1="${T-6}" y2="${T+ph}"/><text x="${x}" y="${T-14}">${esc(m.label||'')}</text></g></g>`});
  /* null values break the line: each run of values becomes its own subpath; an isolated value is drawn as a dot */
  const ser=S.map((s,k)=>{const v=(s.v||[]).map(x=>x==null||x===''||!Number.isFinite(+x)?null:+x),pts=[],segs=[[]];
    v.forEach((y,i)=>{if(y==null){if(segs[segs.length-1].length)segs.push([]);return}const p=[X(i),Y(y)];pts.push(p);segs[segs.length-1].push(p)});
    return {s,k,c:cvar(s.c||PALETTE[k%PALETTE.length]),pts,segs:segs.filter(g=>g.length),last:v.filter(x=>x!=null).pop()}}).filter(o=>o.pts.length);
  const P=p=>p[0].toFixed(1)+','+p[1].toFixed(1);
  /* end labels: keep them at least 44px apart and inside the plot */
  const ends=ser.map(o=>({o,y:o.pts[o.pts.length-1][1]})).sort((a,b)=>a.y-b.y);
  ends.forEach((e,i)=>{if(i&&e.y-ends[i-1].y<44)e.y=ends[i-1].y+44});
  const over=ends.length?ends[ends.length-1].y-(T+ph-14):0;if(over>0)ends.forEach(e=>e.y-=over);
  ends.forEach(e=>{e.o.ly=e.y});
  ser.forEach(o=>{const {s,k,c,pts,segs}=o,st=s.step!=null,cls=st?'':en,lp=pts[pts.length-1],base=(T+ph).toFixed(1),dl=st?0:k*250;
    const runs=segs.filter(g=>g.length>1),dots=segs.filter(g=>g.length===1&&g[0]!==lp),ld=s.dec!=null?s.dec:decOf(o.last);
    const d=runs.map(g=>'M'+g.map(P).join(' L')).join(' ');
    const area=runs.map(g=>'M'+g.map(P).join(' L')+` L${g[g.length-1][0].toFixed(1)},${base} L${g[0][0].toFixed(1)},${base} Z`).join(' ');
    h+=`<g class="ser"${st?` data-step="${s.step}"`:''}${s.hl!=null?` data-hl="${s.hl}"`:''} style="--c:${c}">`+
      (s.area&&area?`<path class="la svs${cls}" style="--d:${dl+500}ms" d="${area}"/>`:'')+
      (!d?'':s.dash?`<path class="lp dash svs${cls}" style="--d:${dl}ms" d="${d}"/>`:`<path class="lp draw${cls}" pathLength="1" style="--d:${dl}ms" d="${d}"/>`)+
      dots.map(g=>`<circle class="lpt svs${cls}" style="--d:${dl+300}ms" cx="${g[0][0].toFixed(1)}" cy="${g[0][1].toFixed(1)}" r="4.5"/>`).join('')+
      `<g class="le svs${cls}" style="--d:${dl+1100}ms">`+
      (Math.abs(o.ly-lp[1])>2?`<path class="ld" d="M${(lp[0]+6).toFixed(1)},${lp[1].toFixed(1)} L${(lp[0]+14).toFixed(1)},${o.ly.toFixed(1)}"/>`:'')+
      `<circle cx="${lp[0].toFixed(1)}" cy="${lp[1].toFixed(1)}" r="5.5"/><text class="lv" x="${(lp[0]+20).toFixed(1)}" y="${(o.ly-4).toFixed(1)}">${esc(s.l||'')}</text>`+
      `<text class="lval" x="${(lp[0]+20).toFixed(1)}" y="${(o.ly+20).toFixed(1)}" data-count="${o.last}" data-dec="${ld}" data-pre="${esc(pre)}" data-suf="${esc(s.unit!=null?s.unit:unit)}"${sepAttr(svg)} data-delay="${dl+1100}">${esc(pre+num(0,ld)+(s.unit!=null?s.unit:unit))}</text></g></g>`});
  svg.setAttribute('viewBox',`0 0 ${W} ${Hh}`);
  if(!svg.hasAttribute('aria-label')){svg.setAttribute('role','img');svg.setAttribute('aria-label',ser.map(o=>`${o.s.l||'series'}: ${pre}${o.last}${o.s.unit!=null?o.s.unit:unit}`).join('; '))}
  svg.innerHTML=h;
};
/* div.cd-waffle — a share of a whole as unit cells (10×10 by default) with a counting legend */
C.waffle=box=>{
  const parts=J(box.dataset.parts,[]);if(!parts.length)return;
  const total=+(box.dataset.total||100),cols=+(box.dataset.cols||10);   /* parts beyond the total are cut; the build warns */
  const unit=box.dataset.unit!=null?box.dataset.unit:(total===100?'%':'');
  if(!box.closest('[data-step]'))box.classList.add('arrive');
  if(!hasVar(box,'--cols'))box.style.setProperty('--cols',cols);
  let cells='',k=0;
  parts.forEach((p,j)=>{const c=cvar(p.c||PALETTE[j%PALETTE.length]),cnt=Math.round(+p.v)||0;
    for(let i=0;i<cnt&&k<total;i++,k++)cells+=`<i class="pt" style="--c:${c};--k:${k}"${p.step!=null?` data-step="${p.step}"`:''}${p.hl!=null?` data-hl="${p.hl}"`:''}></i>`});
  for(;k<total;k++)cells+='<i></i>';
  const leg=parts.map((p,j)=>{const c=cvar(p.c||PALETTE[j%PALETTE.length]),u=p.unit!=null?p.unit:unit;
    return `<div class="wl"${p.step!=null?` data-step="${p.step}"`:''}${p.hl!=null?` data-hl="${p.hl}"`:''} style="--c:${c}"><i></i><b data-count="${+p.v||0}" data-dec="${p.dec||0}" data-suf="${esc(u)}"${sepAttr(box)} data-delay="${400+j*150}">0${esc(u)}</b><span>${esc(p.l||'')}</span></div>`}).join('');
  box.innerHTML=`<div class="wf-grid" role="img" aria-label="${esc(parts.map(p=>(p.l||'')+' '+p.v+(p.unit!=null?p.unit:unit)).join(', '))}">${cells}</div><div class="wf-legend">${leg}</div>`;
};

/* Roadmap and waterfall render the supplied values without entering animations. */
function calendarTime(value, end = false) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}(-\d{2})?$/.test(value)) return NaN;
  const dateOnly = value.length === 7 ? value + '-01' : value;
  const date = new Date(dateOnly + 'T00:00:00Z');
  if (!Number.isFinite(+date) || date.toISOString().slice(0, 10) !== dateOnly) return NaN;
  if (end && value.length === 7) date.setUTCMonth(date.getUTCMonth() + 1);
  else if (end) date.setUTCDate(date.getUTCDate() + 1);
  return +date;
}

function chartMarkup(svg, width, height, markup, label) {
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('role', 'img');
  if (!svg.hasAttribute('aria-label')) svg.setAttribute('aria-label', label);
  svg.innerHTML = markup;
}

C.timeline = svg => {
  const lanes = J(svg.dataset.lanes, []);
  const items = J(svg.dataset.items, []);
  const start = calendarTime(svg.dataset.from);
  const end = calendarTime(svg.dataset.to, true);
  if (!Array.isArray(lanes) || !lanes.length || !Array.isArray(items) || !(end > start)) return;

  const width = 1408, left = 200, right = 18, axis = 52, row = 88;
  const height = axis + row * lanes.length + 14;
  const x = date => (left + (date - start) / (end - start) * (width - left - right)).toFixed(1);
  const tick = new Date(start);
  tick.setUTCDate(1);
  const last = new Date(end - 1);
  const months = (last.getUTCFullYear() - tick.getUTCFullYear()) * 12 + last.getUTCMonth() - tick.getUTCMonth() + 1;
  const tickInterval = Math.max(1, Math.ceil(months / 12));
  const format = new Intl.DateTimeFormat(document.documentElement.lang || undefined, {month:'short', year:'numeric', timeZone:'UTC'});
  const grid = [];
  for (; +tick < end; tick.setUTCMonth(tick.getUTCMonth() + tickInterval)) {
    const tickX = x(Math.max(start, +tick));
    grid.push(`<line class="chart-grid" x1="${tickX}" y1="${axis}" x2="${tickX}" y2="${height - 14}"/>`);
    const anchor = Number(tickX) > width - 110 ? 'end' : 'start';
    grid.push(`<text class="chart-tick" x="${tickX}" y="${axis - 14}" text-anchor="${anchor}">${esc(format.format(tick))}</text>`);
  }

  const rows = lanes.map((lane, i) => {
    const top = axis + i * row;
    return `<line class="chart-grid" x1="0" y1="${top}" x2="${width - right}" y2="${top}"/>
      <text class="roadmap-lane" x="12" y="${top + 49}">${esc(lane)}</text>`;
  });
  const labels = [];
  const marks = items.map(item => {
    if (!item || typeof item !== 'object') return '';
    const lane = lanes.indexOf(item.lane);
    const from = calendarTime(item.t || item.from);
    const to = item.t ? from : calendarTime(item.to, true);
    if (lane < 0 || !(start <= from && from < end && from <= to && to <= end)) return '';
    const color = esc(cvar(item.c || PALETTE[lane % PALETTE.length]));
    const y = axis + row * lane + 52;
    const firstX = Number(x(from)), lastX = Number(x(to));
    const label = esc(item.l);
    const labelX = clamp((firstX + lastX) / 2, left + 76, width - right - 76);
    const hl = item.hl == null ? '' : ` data-hl="${esc(item.hl)}"`;
    const mark = item.t
      ? `<path d="M${firstX},${y-11}l11,11 -11,11 -11,-11Z"/>`
      : `<rect x="${firstX}" y="${y-8}" width="${Math.max(1, lastX-firstX)}" height="16" rx="6"/>`;
    const dates = item.t || `${item.from} to ${item.to}`;
    labels.push(`${item.lane}, ${item.l}: ${dates}`);
    return `<g class="roadmap-mark" style="--c:${color}"${hl}><title>${esc(dates)}</title>
      ${mark}<text x="${labelX}" y="${y-19}">${label}</text></g>`;
  });
  chartMarkup(svg, width, height, [...grid, ...rows, ...marks].join(''), labels.join('; '));
};

C.waterfall = svg => {
  const items = J(svg.dataset.items, []);
  if (!Array.isArray(items) || items.length < 2 || items[0]?.total !== true) return;
  let running = 0;
  const values = [];
  for (const [index, item] of items.entries()) {
    if (!item || typeof item !== 'object') return;
    const before = running;
    const total = item.total === true;
    const value = index && total && item.v == null ? running : item.v;
    if (!Number.isFinite(value)) return;
    running = total ? value : running + value;
    if (!Number.isFinite(running)) return;
    values.push({item, value, total, start: total ? 0 : before, end: running});
  }

  const width = 1140, height = 372, top = 38, bottom = height - 46;
  const min = Math.min(0, ...values.flatMap(bar => [bar.start, bar.end]));
  const max = Math.max(0, ...values.flatMap(bar => [bar.start, bar.end]));
  const scale = max - min || 1;
  if (!Number.isFinite(scale)) return;
  const y = value => top + (max - value) / scale * (bottom - top);
  const slot = width / values.length;
  const barWidth = Math.min(134, slot * .62);
  const number = new Intl.NumberFormat(document.documentElement.lang || undefined, {maximumFractionDigits: 6});
  const label = ({total, value}) => {
    const sign = value < 0 ? '−' : value > 0 && !total ? '+' : '';
    return sign + (svg.dataset.pre || '') + number.format(Math.abs(value)) + (svg.dataset.unit || '');
  };
  const axis = `<line class="chart-grid" x1="0" x2="${width}" y1="${y(0)}" y2="${y(0)}"/>`;
  const bars = values.map((bar, i) => {
    const {item, value, total, start, end} = bar;
    const center = slot * (i + .5);
    const x = center - barWidth / 2;
    const upper = y(Math.max(start, end));
    const barHeight = Math.max(2, y(Math.min(start, end)) - upper);
    const role = item.c || (total ? 'txt2' : value < 0 ? 'red' : 'green');
    const hl = item.hl == null ? '' : ` data-hl="${esc(item.hl)}"`;
    const linkY = i ? y(values[i-1].end) : 0;
    const link = i ? `<line class="bridge-link" x1="${x-slot+barWidth}" y1="${linkY}" x2="${x}" y2="${linkY}"/>` : '';
    return `<g class="bridge-bar" style="--c:${esc(cvar(role))}"${hl}>${link}
      <rect x="${x}" y="${upper}" width="${barWidth}" height="${barHeight}" rx="4"/>
      <text class="bridge-value" x="${center}" y="${upper-12}">${esc(label(bar))}</text>
      <text class="chart-tick" x="${center}" y="${height-13}">${esc(item.l)}</text></g>`;
  });
  chartMarkup(svg, width, height, axis + bars.join(''), values.map(bar => `${bar.item.l}: ${label(bar)}`).join('; '));
};

/* ── layout helpers for CSS patterns ───────────────────────── */
function helpers(root){
  /* agenda from config.acts */
  $$('.agenda[data-auto]',root).forEach(ol=>{const cur=ol.dataset.current;
    ol.innerHTML=(CFG.acts||[]).map((a,k)=>a.agenda===false?'':`<li${String(k)===cur?' class="hl"':''}><span class="an">${esc(a.k||'')}</span><span class="at">${esc(a.t||'')}</span>${a.desc?`<span class="ad">${esc(a.desc)}</span>`:''}</li>`).join('')});
  /* --n item counts and --k indexes for grid patterns */
  $$('.papers,.trio,.instruments,.hudstats,.pillars,.process,.foundation .uses,.foundation .chips',root).forEach(g=>{
    const kids=Array.from(g.children).filter(c=>!c.classList.contains('floor')&&!c.classList.contains('rail'));
    if(!hasVar(g,'--n'))g.style.setProperty('--n',kids.length);kids.forEach((c,k)=>{if(!hasVar(c,'--k'))c.style.setProperty('--k',k)})});
  $$('.optgrid',root).forEach(g=>{if(!hasVar(g,'--cols'))g.style.setProperty('--cols',$$('.oh',g).length||3)});
  $$('.process',root).forEach(p=>{if(!$('.rail',p))p.insertAdjacentHTML('afterbegin','<div class="rail"><i></i></div>')});
  /* data-stagger="120" (+ data-stagger-base) → --d on children */
  $$('[data-stagger]',root).forEach(g=>{const st=+g.dataset.stagger||100,b=+(g.dataset.staggerBase||0);
    Array.from(g.children).forEach((c,k)=>{if(!hasVar(c,'--d'))c.style.setProperty('--d',(b+k*st)+'ms')})});
  /* horizon suns: spread evenly, stagger, mirror into the reflection */
  $$('.pt-horizon',root).forEach(f=>{const sky=$('.sky',f);if(!sky)return;const suns=$$('.sun',sky),n=suns.length,gap=n>3?300:370;
    suns.forEach((s,k)=>{if(!hasVar(s,'--x'))s.style.setProperty('--x',(800+(k-(n-1)/2)*gap)+'px');if(!hasVar(s,'--d'))s.style.setProperty('--d',(400+k*260)+'ms')});
    if(!$('.reflect',f)){const r=sky.cloneNode(true);r.className='reflect';sky.after(r)}});
  /* provisioning console: spread line timings across the clock */
  $$('.console',root).forEach(c=>{const lines=$$('.lg',c),clk=$('.clock',c),dur=+(clk&&clk.dataset.dur||2300),dl=+(clk&&clk.dataset.delay||450);
    lines.forEach((l,k)=>{if(!hasVar(l,'--a'))l.style.setProperty('--a',Math.round(dl+k*dur/lines.length)+'ms');if(!hasVar(l,'--b'))l.style.setProperty('--b',Math.round(dl+(k+1)*dur/lines.length)+'ms')})});
  /* code blocks: one span per line; data-lines='{"1":"3-5","2":"8"}' highlights lines per step */
  $$('pre.code',root).forEach(pre=>{if(pre._done)return;pre._done=1;const map=J(pre.dataset.lines,{});
    const lines=pre.innerHTML.replace(/^\n/,'').replace(/\s+$/,'').split('\n'),hl=lines.map(()=>[]);
    for(const st in map)lineList(map[st]).forEach(n=>{if(hl[n-1])hl[n-1].push(st)});
    pre.innerHTML=lines.map((l,k)=>`<span class="ln"${hl[k].length?` data-hl="${hl[k].join(',')}"`:''}>${l||' '}</span>`).join('')});
}
/* emitter waves: delay each chip by its distance to the emitter (needs layout) */
function fieldWaves(root){
  $$('.field',root).forEach(fd=>{const host=fd.parentElement,em=host&&$('.emit',host);if(!em)return;
    const ex=em.offsetLeft+em.offsetWidth/2,ey=em.offsetTop+em.offsetHeight/2;
    $$('i',fd).forEach(c=>{if(c.dataset.w0==='1'||!hasVar(c,'--w')){c.dataset.w0='1';
      const cx=fd.offsetLeft+c.offsetLeft+c.offsetWidth/2,cy=fd.offsetTop+c.offsetTop+c.offsetHeight/2;
      c.style.setProperty('--w',Math.round(380+Math.hypot(cx-ex,cy-ey)*.95)+'ms')}})});
}
function components(root){
  $$('.cd-network',root).forEach(C.network);$$('.cd-gauge',root).forEach(C.gauge);$$('.cd-bars',root).forEach(C.bars);
  $$('.cd-track',root).forEach(C.track);$$('.cd-pipeline',root).forEach(C.pipeline);$$('.cd-diagram',root).forEach(C.diagram);
  $$('.cd-line',root).forEach(C.line);$$('.cd-waffle',root).forEach(C.waffle);
  $$('svg.cd-timeline',root).forEach(C.timeline);
  $$('svg.cd-waterfall',root).forEach(C.waterfall);
  helpers(root);
}

/* ════ frames, notes, headlines ════ */
function parseNotes(fr){
  const a=$('aside.notes',fr),res={beats:[],transition:''};if(!a)return res;let k=0;
  Array.from(a.children).forEach(n=>{
    if(n.classList.contains('transition')){res.transition=n.innerHTML.trim();return}
    const st=n.dataset.beat!=null?+n.dataset.beat:k;k=st+1;res.beats.push({step:st,cue:n.dataset.cue||'',html:n.innerHTML.trim()})});
  if(!res.beats.length&&a.textContent.trim())res.beats.push({step:0,cue:'',html:a.innerHTML.trim()});
  a.remove();return res;
}
function splitWords(el){let n=0;
  const walk=node=>Array.from(node.childNodes).forEach(ch=>{
    if(ch.nodeType===3){const fr=D.createDocumentFragment();
      ch.textContent.split(/(\s+)/).forEach(p=>{if(!p)return;if(/^\s+$/.test(p)){fr.appendChild(D.createTextNode(' '));return}
        const w=D.createElement('span');w.className='w';w.style.setProperty('--i',n++);w.textContent=p;fr.appendChild(w)});
      ch.replaceWith(fr)}
    else if(ch.nodeType===1&&ch.tagName!=='BR'&&!ch.classList.contains('w'))walk(ch)});
  walk(el);
}
function model(){
  return $$('.frame').map((el,i)=>{
    const notes=parseNotes(el);
    let max=0;$$('[data-step]',el).forEach(e=>{max=Math.max(max,+e.dataset.step||0)});
    const hls=$$('[data-hl]',el).map(e=>{const s=stepSet(e.dataset.hl);max=Math.max(max,s.max);return [e,s]});
    const raw=J(el.dataset.cams,null),cams={};
    if(Array.isArray(raw))raw.forEach((c,k)=>{if(c!=null)cams[k]=c});else if(raw&&typeof raw==='object')for(const k in raw)cams[+k]=raw[k];
    Object.keys(cams).forEach(k=>{if(cams[k]!=null&&!(Array.isArray(cams[k])&&cams[k][0]===0&&cams[k][1]===0&&cams[k][2]===1))max=Math.max(max,+k)});
    let steps=el.dataset.steps!=null?+el.dataset.steps:max;
    if(el.hasAttribute('data-finale')){steps+=1;cams[steps]='world'}
    const focus={};$$('[data-focus]',el).forEach(e=>{const h=e.closest('[data-step]');focus[h?+h.dataset.step:0]=e});
    const hd=$('h1,h2,.h,.mega,.bigquote',el),title=el.dataset.title||(hd?hd.textContent.replace(/\s+/g,' ').trim().slice(0,70):'Slide '+(i+1));
    const fx=el.dataset.x!=null&&el.dataset.y!=null;
    return {el,i,act:+el.dataset.act||0,steps,cams,focus,hls,notes,title,minutes:+el.dataset.minutes||0,fixed:fx,x:fx?+el.dataset.x:0,y:fx?+el.dataset.y:0,
      backup:el.hasAttribute('data-backup')};
  });
}

/* ════ world layout ════ */
let F=[],MAIN=[],BACKUPS=[],ACTS=[],WB=null;
function frameNumber(frame){
  return frame.backup ? 'B'+(BACKUPS.indexOf(frame)+1) : pad2(MAIN.indexOf(frame)+1);
}
function backupIndex(id){
  return id ? BACKUPS.find(frame=>frame.el.id===id)?.i ?? -1 : -1;
}
function layout(){
  const L=Object.assign({type:'snake',cols:4,gapX:600,gapY:600},CFG.layout||{}),px=FW+(+L.gapX),py=FH+(+L.gapY);
  const auto=MAIN.filter(f=>!f.fixed),rows=[];
  if(L.type!=='free'||auto.length){
    if(L.type==='line')rows.push(auto);else if(L.type==='column')auto.forEach(f=>rows.push([f]));
    else{let cur=[],prev=null;auto.forEach(f=>{const brk=(L.type==='acts'&&prev!==null&&f.act!==prev)||f.el.hasAttribute('data-break')||cur.length>=(+L.cols||4);
      if(brk&&cur.length){rows.push(cur);cur=[]}cur.push(f);prev=f.act});if(cur.length)rows.push(cur)}
    let x=0,dir=1;rows.forEach((row,r)=>{row.forEach((f,k)=>{f.x=x+dir*k*px;f.y=r*py});x+=dir*(row.length-1)*px;dir=-dir});
  }
  const mx=Math.min(...MAIN.map(f=>f.x)),my=Math.min(...MAIN.map(f=>f.y));
  MAIN.forEach(f=>{f.x-=mx;f.y-=my});
  const maxX=Math.max(...MAIN.map(f=>f.x))+FW,maxY=Math.max(...MAIN.map(f=>f.y))+FH,top=-220,w=maxX,h=maxY-top;
  BACKUPS.forEach((f,i)=>{f.x=(i%4)*px;f.y=maxY+600+Math.floor(i/4)*py});
  F.forEach(f=>{f.el.style.left=f.x+'px';f.el.style.top=f.y+'px'});
  const sF=Math.min(1500/(w+400),640/(h+300)),sO=Math.min(1500/(w+400),820/(h+300));
  WB={finale:WORLD.finale?Object.assign({},WORLD.finale):{x:w/2,y:top+h/2+120/sF,s:sF},over:{x:w/2,y:top+h/2,s:sO},w:maxX,h:maxY};
}
function centers(){return MAIN.map(f=>[f.x+FW/2,f.y+FH/2])}
function threadPath(){if(WORLD.thread)return WORLD.thread;const c=centers();if(!c.length)return '';let d=`M${c[0][0]},${c[0][1]}`;
  for(let k=1;k<c.length;k++){const [x0,y0]=c[k-1],[x1,y1]=c[k];if(x0!==x1&&y0!==y1)d+=` L${x1},${y0}`;d+=` L${x1},${y1}`}return d}
function buildWorld(){
  const world=$('#world'),frag=D.createDocumentFragment(),{w,h}=WB;
  const dots=D.createElement('div');dots.className='cd-dots';dots.style.cssText=`left:-2400px;top:-2400px;width:${w+4800}px;height:${h+4800}px`;frag.appendChild(dots);
  MAIN.forEach((f,i)=>{const a=D.createElement('div'),spec=(WORLD.auras||[])[i],size=spec?spec.size:1700;a.className='cd-aura';
    const lit=spec?cvar(spec.color):f.el.style.getPropertyValue('--lit').trim();if(lit)a.style.setProperty('--c',lit);
    if(spec){a.style.width=a.style.height=size+'px';a.style.background=`radial-gradient(closest-side,color-mix(in srgb,${lit} ${spec.alpha*100}%,transparent),transparent)`}
    a.style.left=(f.x+FW/2-size/2)+'px';a.style.top=(f.y+FH/2-size/2)+'px';frag.appendChild(a)});
  const t=D.createElementNS(SVGNS,'svg');t.setAttribute('class','cd-thread');t.setAttribute('width',w+400);t.setAttribute('height',h+400);
  const d=esc(threadPath());t.innerHTML=`<path d="${d}"/><path class="glow" d="${d}"/>`;frag.appendChild(t);
  /* act labels above the first frame of each act; fit them to the room before the next label on the same row */
  const firsts=[],seen=new Set();MAIN.forEach(f=>{if(!seen.has(f.act)){seen.add(f.act);firsts.push(f)}});
  firsts.forEach(f=>{const a=ACTS[f.act]||{},l=D.createElement('div');l.className='cd-actlabel';
    const nx=firsts.filter(g=>g!==f&&g.y===f.y&&g.x>f.x).reduce((m,g)=>Math.min(m,g.x),Infinity),room=nx-f.x-120,cw=n=>n*92*.84;
    const k=String(a.k||''),t=a.t&&a.k!==a.t&&!a.hideLabelTitle?String(a.t):'';let full=k.length+(t?t.length+3:0);
    let html=`<em>${esc(k)}</em>${t?' — '+esc(t):''}`;if(t&&cw(full)>room){html=`<em>${esc(k)}</em>`;full=k.length}
    if(cw(full)>room&&room>0)l.style.fontSize=Math.max(40,Math.floor(92*room/cw(full)))+'px';
    l.innerHTML=html;if(WORLD.labelLineHeight)l.style.lineHeight=String(WORLD.labelLineHeight);l.style.left=(f.x+6)+'px';l.style.top=(f.y-150)+'px';frag.appendChild(l)});
  world.prepend(frag);
  F.forEach(f=>{const number=frameNumber(f);if($('.ghost,.cd-ghost',f.el)){const b=$('.ghost b,.cd-ghost b',f.el);if(b)b.textContent=number;return}const g=D.createElement('div');g.className='cd-ghost';g.setAttribute('aria-hidden','true');
    g.innerHTML=`<b>${number}</b><span>${esc(f.el.dataset.title||f.title)}</span>`;f.el.prepend(g)});
}
function actShort(a){if(a.short||a.s)return a.short||a.s;const m=String(a.k||'').match(/^act\s+(.+)$/i);return m?m[1]+' · '+String(a.t||'').replace(/^the\s+/i,'').replace(/^\w/,c=>c.toUpperCase()):(a.k||'')}
function buildChrome(){
  const stage=$('#stage'),B=CFG.brand||{},Fn=CFG.finale||{};
  const brand=(B.logo?(B.logoMode==='image'?`<img src="${B.logo}" alt="${esc(B.name||'')}">`:`<span class="logo" role="img" aria-label="${esc(B.name||'')}" style="--m:url('${B.logo}');--lw:${B.logoWidth||62}px"></span>`):(B.name?`<b>${esc(B.name)}</b>`:''))+(B.label?`${B.name||B.logo?'<i></i>':''}<span>${esc(B.label)}</span>`:'');
  const used=[...new Set(MAIN.map(f=>f.act))].sort((a,b)=>a-b),clicks=k=>MAIN.filter(f=>f.act===k).reduce((q,f)=>q+f.steps+1,0),tot=MAIN.reduce((q,f)=>q+f.steps+1,0)||1;
  const acts=used.map(k=>{const a=ACTS[k]||{},lab=actShort(a),wd=a.width||Math.round(Math.max(lab.length*8.4+12,46+620*clicks(k)/tot));
    return `<div data-act="${k}" style="width:${wd}px"><s><i></i></s><span>${esc(lab)}</span></div>`}).join('');
  const r=Math.max(WB.w,WB.h)/150,M=WORLD.minimap||{},vb=M.viewBox?M.viewBox.join(' '):`${-r*6} ${-r*6} ${WB.w+r*12} ${WB.h+r*12}`;
  const mm=`<svg class="cd-minimap" viewBox="${esc(vb)}" preserveAspectRatio="${esc(M.preserveAspectRatio||'xMaxYMax meet')}" aria-hidden="true"><path d="${esc(threadPath())}" stroke-width="${M.pathStroke||+(r*1.4).toFixed(0)}"/>`+
    MAIN.map(f=>`<rect class="f" x="${f.x}" y="${f.y}" width="${FW}" height="${FH}" rx="${M.radius==null?r*6:M.radius}" stroke-width="${M.frameStroke||+(r*1.6).toFixed(0)}"/>`).join('')+`<rect class="v" stroke-width="${M.viewStroke||+(r*2.4).toFixed(0)}"/></svg>`;
  stage.insertAdjacentHTML('beforeend',`<div class="cd-vignette"></div><div class="cd-grain"></div><div class="cd-finale-shade"></div>
<div class="cd-finale">${Fn.kicker?`<div class="k">${esc(Fn.kicker)}</div>`:''}${Fn.text?`<p>${Fn.text}</p>`:''}${Fn.credits?`<div class="cr">${Fn.credits}</div>`:''}</div>
<div class="cd-letterbox"></div><div class="cd-actcard" aria-hidden="true"><div class="k"></div><div class="t"></div></div>
<div class="cd-hud" aria-hidden="true"><div class="brand">${brand}</div><div class="where"></div><div class="acts">${acts}</div>${mm}</div>`);
  D.body.insertAdjacentHTML('beforeend',`<div class="cd-nav" role="toolbar" aria-label="Presentation controls">
<button type="button" data-a="prev" aria-label="Previous (←)">&#8249;</button><button type="button" data-a="next" aria-label="Next (→)">&#8250;</button>
<button type="button" data-a="overview" aria-label="Overview (O)" title="Overview (O)">&#9638;</button><button type="button" data-a="theme" aria-label="Light or dark (T)" title="Light / dark (T)">&#9681;</button>
<button type="button" data-a="palette" aria-label="Color palette (C)" title="Color palette (C)">&#9672;</button>
<button type="button" data-a="notes" aria-label="Presenter view (P)" title="Presenter view (P)">P</button><button type="button" data-a="help" aria-label="Keyboard shortcuts (?)" title="Shortcuts (?)">?</button></div>
${MODE==='show'&&BACKUPS.length?'<button type="button" class="cd-return" aria-keyshortcuts="R" hidden>Return to talk (R)</button>':''}
<div id="cd-blank"></div><div class="cd-goto" aria-hidden="true"></div><div class="cd-sr" aria-live="polite" id="cd-live"></div>
<div class="cd-help" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts"><div><h2>Keyboard</h2><dl>
<dt>→ ↓ Space PgDn Enter · click</dt><dd>next build / slide</dd><dt>← ↑ PgUp Backspace · right-click</dt><dd>previous</dd>
<dt>Shift + → / ←</dt><dd>next / previous slide (skip builds)</dd><dt>Home · End</dt><dd>first · last</dd><dt>12 Enter</dt><dd>go to slide 12</dd>
<dt>O · Esc</dt><dd>overview of the whole world (click a slide to jump)</dd><dt>P</dt><dd>presenter view: notes, timer, next slide</dd>
${BACKUPS.length?'<dt>R</dt><dd>return to the saved build after Q&A</dd>':''}
<dt>T</dt><dd>light / dark</dd><dt>C</dt><dd>next color palette</dd><dt>B or .</dt><dd>blank the screen</dd><dt>F</dt><dd>fullscreen</dd><dt>?</dt><dd>this help</dd></dl>
<p>URL: #slide=N&amp;step=S · ?theme=light · ?palette=epam-ai · ?motion=0 · ?print · ?print=steps · ?presenter</p></div></div>`);
}

/* ════ camera ════ */
let stage,world,cam={x:FW/2,y:FH/2,s:1},raf=0,camT=0,mini=null;
function apply(c){cam=c;world.style.transform=`translate(${(FW/2-c.x*c.s).toFixed(2)}px,${(FH/2-c.y*c.s).toFixed(2)}px) scale(${c.s.toFixed(5)})`;
  if(mini){const w=FW/c.s,h=FH/c.s;mini.setAttribute('x',c.x-w/2);mini.setAttribute('y',c.y-h/2);mini.setAttribute('width',w);mini.setAttribute('height',h)}}
const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
function focusCam(f,e){
  const fr=f.el.getBoundingClientRect(),r=e.getBoundingClientRect(),k=fr.width/FW||1;
  const w=r.width/k,h=r.height/k,cx=(r.left-fr.left)/k+w/2,cy=(r.top-fr.top)/k+h/2,want=parseFloat(e.dataset.focus);
  const s=want>0?want:clamp(Math.min(FW*.8/Math.max(w,1),FH*.74/Math.max(h,1)),1,+(e.dataset.focusMax||1.45));
  const hold=e.dataset.focusHold?{ms:+e.dataset.focusHold,x:f.x+FW/2,y:f.y+FH/2,s:1}:null;
  /* keep the zoomed view inside the frame so no void shows at the edges */
  const hw=FW/2/s,hh=FH/2/s,x=s>=1?clamp(cx,hw,FW-hw):FW/2,y=s>=1?clamp(cy,hh,FH-hh):FH/2;
  return {x:f.x+x,y:f.y+y,s,hold};
}
function camFor(k,st){
  const f=F[k],c=f.cams[st];
  if(c==='world')return Object.assign({},WB.finale);
  if(Array.isArray(c))return {x:f.x+FW/2+(+c[0]||0),y:f.y+FH/2+(+c[1]||0),s:+c[2]||1,hold:c.length>=7?{ms:+c[3],x:f.x+FW/2+(+c[4]),y:f.y+FH/2+(+c[5]),s:+c[6]}:null};
  if(f.focus[st])return focusCam(f,f.focus[st]);
  return {x:f.x+FW/2,y:f.y+FH/2,s:1};
}
function fly(to,dur,noDip){
  cancelAnimationFrame(raf);
  const from=Object.assign({},cam),dx=to.x-from.x,dy=to.y-from.y,dist=Math.hypot(dx,dy);
  if(STATIC||(dist<1&&Math.abs(to.s-from.s)<.001)){apply({x:to.x,y:to.y,s:to.s});settle();return 0}
  if(REDUCE){apply({x:to.x,y:to.y,s:to.s});stage.classList.remove('cut');void stage.offsetWidth;stage.classList.add('cut');settle();return 260}
  const travel=dist>700&&!noDip;dur=dur||(travel?2300:1150);
  const lf=Math.log(from.s),lt=Math.log(to.s),ms=travel?Math.max(.15,Math.min(.58,1500/(dist+1800))):0,ldip=travel?Math.min(0,Math.log(ms)-(lf+lt)/2):0;
  stage.classList.add('flying');stage.classList.remove('rest');const t0=performance.now();
  const tick=now=>{const t=Math.min(1,(now-t0)/dur),e=ease(t);
    apply({x:from.x+dx*e,y:from.y+dy*e,s:Math.exp(lf+(lt-lf)*e+ldip*Math.sin(Math.PI*t))});
    if(t<1)raf=requestAnimationFrame(tick);else settle()};
  raf=requestAnimationFrame(tick);return dur;
}
function settle(){stage.classList.remove('flying');if(!stage.classList.contains('lightsout')&&!stage.classList.contains('overview'))stage.classList.add('rest')}
function shot(k,st,dur,noDip){
  clearTimeout(camT);const to=camFor(k,st);stage.classList.toggle('zoom',to.s>1.02&&!WBis(to));
  const d=fly(to,dur,noDip);
  if(to.hold&&!STATIC)camT=setTimeout(()=>{fly(to.hold,1500);camT=setTimeout(()=>stage.classList.toggle('zoom',to.hold.s>1.02),1100)},d+to.hold.ms);
  return d;
}
const WBis=c=>c.s===WB.finale.s&&c.x===WB.finale.x;

function cutShot(k,st,position){
  cancelAnimationFrame(raf);
  clearTimeout(camT);
  clearTimeout(actT);
  clearTimeout(introT);
  stage.classList.remove('act','cut');
  const target=position||camFor(k,st);
  stage.classList.toggle('zoom',target.s>1.02&&!WBis(target));
  apply({x:target.x,y:target.y,s:target.s});
  settle();
}

/* ════ steps, counters, typed text, media ════ */
function setSteps(k,st){
  const f=F[k],el=f.el;el.setAttribute('data-at',st);
  $$('[data-step]',el).forEach(e=>{const a=+e.dataset.step,u=e.dataset.until==null?Infinity:+e.dataset.until;e.classList.toggle('on',st>=a&&st<=u)});
  f.hls.forEach(([e,s])=>e.classList.toggle('hl',s.test(st)));
  $$('.process',el).forEach(p=>{const all=$$('.ps',p),on=all.filter(x=>x.classList.contains('on')).length;p.style.setProperty('--p',all.length>1?clamp((on-1)/(all.length-1),0,1):(on?1:0))});
}
const shown=(e,n)=>{if(n!==cur)return false;for(let h=e;h&&h!==F[n].el;h=h.parentElement)if(h.hasAttribute('data-step')&&!h.classList.contains('on'))return false;return true};
function counters(arrive,instant=STATIC){
  F.forEach((f,n)=>$$('[data-count]',f.el).forEach(el=>{
    const fmt=v=>cfmt(el,v);
    if(!shown(el,n)){el._done=false;cancelAnimationFrame(el._raf);el.textContent=f.el.classList.contains('seen')&&n!==cur?fmt(+el.dataset.count):fmt(0);return}
    const to=+el.dataset.count;
    if(instant){cancelAnimationFrame(el._raf);el._done=true;el.textContent=fmt(to);return}
    if(el._done)return;el._done=true;
    const dur=+el.dataset.dur||1400,t0=performance.now()+(+(el.dataset.delay||200))+arrive,lin=el.dataset.ease==='linear',scr=el.hasAttribute('data-scramble');
    const tick=t=>{const p=Math.min(1,Math.max(0,(t-t0)/dur)),e=lin?p:1-Math.pow(1-p,3);
      el.textContent=(scr&&p>0&&p<.72)?fmt(Math.floor(Math.random()*Math.max(10,to*1.6))):fmt(to*e);if(p<1)el._raf=requestAnimationFrame(tick)};
    el.textContent=fmt(0);el._raf=requestAnimationFrame(tick)}));
}
function typed(arrive,instant=STATIC){
  F.forEach((f,n)=>$$('.typed',f.el).forEach(el=>{
    if(el._full==null)el._full=el.textContent;
    if(!shown(el,n)||instant){
      clearTimeout(el._typeDelay);clearInterval(el._iv);el.classList.remove('typing');
      el._on=shown(el,n);el.textContent=el._on||f.el.classList.contains('seen')&&n!==cur?el._full:'';return
    }
    if(el._on)return;el._on=true;
    let k=0;el.textContent='';el.classList.add('typing');const sp=+el.dataset.speed||28;
    el._typeDelay=setTimeout(()=>{clearInterval(el._iv);el._iv=setInterval(()=>{k++;el.textContent=el._full.slice(0,k);if(k>=el._full.length){clearInterval(el._iv);el.classList.remove('typing')}},sp)},(+el.dataset.delay||250)+arrive)}));
}
function media(){F.forEach((f,n)=>$$('video',f.el).forEach(v=>{if(!v.hasAttribute('data-autoplay'))return;v.muted=true;v.playsInline=true;
  if(shown(v,n))v.play().catch(()=>{});else v.pause()}))}

/* ════ HUD ════ */
let whereEl,segs,card,live;
function hud(){
  const frame=F[cur],a=ACTS[frame.act]||{};
  stage.classList.toggle('t0',cur===0&&CFG.hudOnTitle!==true);
  stage.classList.toggle('qa-backup',frame.backup);
  whereEl.innerHTML=frame.backup ? `Q&amp;A &nbsp;·&nbsp; ${frameNumber(frame)}`
    : `${esc(a.k||'')}${a.t?' — <em>'+esc(a.t)+'</em>':''} &nbsp;·&nbsp; ${frameNumber(frame)}/${pad2(MAIN.length)}`;
  segs.forEach(s=>{const k=+s.dataset.act,inAct=MAIN.filter(f=>f.act===k),tot=inAct.reduce((q,f)=>q+f.steps+1,0);
    const done=inAct.reduce((q,f)=>q+(f.i<cur?f.steps+1:f.i===cur?step+1:0),0);
    s.querySelector('i').style.transform=`scaleX(${tot?done/tot:0})`;s.classList.toggle('cur',k===frame.act)});
  $$('.cd-minimap rect.f').forEach((r,n)=>{r.classList.toggle('cur',MAIN[n]===frame);r.classList.toggle('seen',MAIN[n].el.classList.contains('seen'))});
  const back=$('.cd-return');
  if(back) back.hidden=!frame.backup||!returnPoint;
}
let actT;
function showAct(k){if(STATIC)return;clearTimeout(actT);const a=ACTS[k]||{};card.querySelector('.k').textContent=a.k||'';card.querySelector('.t').textContent=a.t||'';
  stage.classList.remove('act');void card.offsetWidth;stage.classList.add('act');actT=setTimeout(()=>stage.classList.remove('act'),2250)}

/* ════ navigation ════ */
let cur=0,step=0,arrT,introT,overview=false,returnPoint=null;
function go(ni,nst,opt={}){
  ni=clamp(ni|0,0,F.length-1);nst=clamp(nst|0,0,F[ni].steps);
  const previous=F[cur],target=F[ni];
  const instant=Boolean(previous?.backup||target.backup);
  if(MODE==='show'&&target.backup&&previous&&!previous.backup){
    const settled=stage.classList.contains('rest')&&!stage.classList.contains('flying')&&!overview;
    returnPoint={slide:cur,step,camera:settled?{...cam}:null};
  }else if(!target.backup){
    returnPoint=null;
  }
  if(overview)setOverview(false,true);
  const fwd=ni>cur||(ni===cur&&nst>step),change=ni!==cur||opt.force;
  cur=ni;step=nst;const last=F[cur].cams[step]==='world';
  stage.classList.toggle('lightsout',last);
  stage.classList.toggle('qa-cut',instant);
  let arrive=0;
  if(change){const tgt=F[cur].el;
    F.forEach((f,n)=>{if(n!==cur&&f.el.classList.contains('is-active')){f.el.classList.remove('is-active');f.el.classList.add('seen');setSteps(n,f.steps)}});
    if(fwd&&step===0)tgt.classList.remove('seen');
    let dur=0;
    if(instant){
      cutShot(cur,step,opt.camera);
    }else{
      const actChange=fwd&&previous.act!==target.act&&!opt.quiet;
      if(actChange)showAct(target.act);
      dur=CFG.transition==='swoop'?shot(cur,step,actChange?3100:0):shot(cur,step,actChange?3100:1400,!actChange);
      arrive=STATIC?0:Math.round(dur*(actChange?.72:.6));
    }
    stage.style.setProperty('--arrive',arrive+'ms');void tgt.offsetWidth;tgt.classList.add('is-active');
    clearTimeout(arrT);arrT=setTimeout(()=>stage.style.setProperty('--arrive','0ms'),dur+60);
    shield();
    if(live)live.textContent=target.backup ? `Q&A ${frameNumber(target)}: ${target.title}`
      : `Slide ${frameNumber(target)} of ${MAIN.length}: ${target.title}`;
  }else if(instant){
    cutShot(cur,step,opt.camera);
  }else{
    shot(cur,step,last?3600:0,true);
  }
  if(last)MAIN.forEach(f=>{if(f.i!==cur){f.el.classList.add('seen');setSteps(f.i,f.steps)}});
  setSteps(cur,step);hud();counters(arrive,STATIC||instant);typed(arrive,STATIC||instant);media();
  try{history.replaceState(null,'','#slide='+(cur+1)+'&step='+step)}catch(e){}
  window.dispatchEvent(new CustomEvent('deckchange',{detail:{slide:cur,step,title:F[cur].title}}));
  sync();
}
function adjacentPosition(index,build,direction){
  const frame=F[index],nextBuild=build+direction;
  if(nextBuild>=0&&nextBuild<=frame.steps) return [index,nextBuild];
  const nextFrame=F[index+direction];
  if(frame.backup||!nextFrame||nextFrame.backup) return [index,build];
  return [nextFrame.i,direction>0?0:nextFrame.steps];
}
function navigate(direction){
  const [index,build]=adjacentPosition(cur,step,direction);
  if(index!==cur||build!==step) go(index,build);
}
const next=()=>navigate(1);
const prev=()=>navigate(-1);
function jumpToBackup(id){
  const index=backupIndex(id);
  if(index<0) return false;
  go(index,0);
  return true;
}
function returnToStory(){
  if(!returnPoint) return false;
  const saved=returnPoint;
  go(saved.slide,saved.step,{camera:saved.camera});
  return true;
}
/* inactive frames are inert: Tab cannot focus (and scroll to) content on another frame */
function shield(){F.forEach((f,n)=>{const off=n!==cur&&(!overview||f.backup);f.el.toggleAttribute('inert',off);f.el.setAttribute('aria-hidden',off?'true':'false')})}
function guardScroll(){[$('#viewport'),stage].forEach(el=>el&&el.addEventListener('scroll',()=>{if(el.scrollLeft||el.scrollTop){el.scrollLeft=0;el.scrollTop=0}},{passive:true}));
  addEventListener('scroll',()=>{if(scrollX||scrollY)scrollTo(0,0)},{passive:true})}
function setOverview(on,silent){
  if(on&&F[cur].backup)return;
  overview=on;stage.classList.toggle('overview',on);shield();
  if(on){stage.classList.remove('rest','lightsout');fly(Object.assign({},WB.over),1500,true)}
  else{stage.classList.toggle('lightsout',F[cur].cams[step]==='world');if(!silent)shot(cur,step,1300,true)}
}
function toggleTheme(){const on=H.classList.toggle('light');try{localStorage.setItem('cdeck:'+ID+':theme',on?'light':'dark')}catch(e){}sync()}
function fit(){stage.style.transform='scale('+Math.min(innerWidth/FW,innerHeight/FH)+')'}
function parseHash(){const p=new URLSearchParams(PREVIEW?PREVIEW.position:location.hash.slice(1)),s=+p.get('slide')-1;return Number.isInteger(s)&&s>=0&&s<F.length?[s,clamp(+p.get('step')||0,0,F[s].steps)]:null}

function bindPreview(){
  const send=(type,data)=>parent.postMessage({deckPreview:PREVIEW.id,type,...data},'*');
  const interactive='a,button,input,textarea,select,label,summary,[contenteditable],[data-interactive]';
  addEventListener('resize',fit);
  addEventListener('message',e=>{
    const m=e.data;
    if(e.source!==parent||m?.deckPreview!==PREVIEW.id)return;
    if(m.type==='go'&&(cur!==m.slide||step!==m.step))go(m.slide,m.step);
    if(m.type==='design'&&colors.has(m.palette)){
      H.classList.toggle('light',m.mode==='light');
      colors.set(m.palette,false);
    }
  });
  D.addEventListener('click',e=>{
    if(e.target.closest('a[href]'))e.preventDefault();
    if(!e.target.closest(interactive)&&!String(getSelection()))send('key',{key:'ArrowRight'});
  });
  addEventListener('keydown',e=>{
    if(e.metaKey||e.ctrlKey||e.altKey||e.target.closest?.(interactive))return;
    if(['arrowleft','arrowright',' ','pageup','pagedown','home','end','t','c'].includes(e.key.toLowerCase())){
      e.preventDefault();
      send('key',{key:e.key});
    }
  });
  queueMicrotask(()=>send('ready',{frames:MAIN.map(({title,steps})=>({title,steps}))}));
}

/* ════ input ════ */
function bind(){
  const blank=$('#cd-blank'),help=$('.cd-help'),gotoEl=$('.cd-goto'),nav=$('.cd-nav');let buf='',bufT,nt;
  const unblank=()=>{if(blank.classList.contains('on')){blank.classList.remove('on');return true}return false};
  const act={prev,next,overview:()=>setOverview(!overview),theme:toggleTheme,palette:colors.cycle,notes:openPresenter,help:()=>help.classList.toggle('on')};
  nav.addEventListener('click',e=>{const b=e.target.closest('button[data-a]');if(b){e.stopPropagation();act[b.dataset.a]()}});
  $('.cd-return')?.addEventListener('click',returnToStory);
  D.addEventListener('click',e=>{
    if(help.classList.contains('on')){help.classList.remove('on');return}
    const link=e.target.closest('button[data-goto],a[data-goto]');
    if(MODE==='show'&&link){e.preventDefault();jumpToBackup(link.dataset.goto);return}
    if(e.target.closest('.cd-nav,a,button,input,textarea,select,label,summary,[data-interactive]'))return;
    if(unblank())return;
    if(overview){const fr=e.target.closest('.frame');if(fr){const k=F.findIndex(f=>f.el===fr);if(k>=0)go(k,0,{force:true,quiet:true})}return}
    if(String(getSelection()).length)return;next()});
  D.addEventListener('contextmenu',e=>{if(e.target.closest('a,input,textarea,[data-interactive]'))return;e.preventDefault();if(unblank())return;prev()});
  addEventListener('keydown',e=>{
    if(e.metaKey||e.ctrlKey||e.altKey)return;const k=e.key;
    if(e.target.closest?.('input,textarea,select,[contenteditable]'))return;
    if(k.toLowerCase()==='r'&&returnToStory()){e.preventDefault();return}
    if(e.target.closest?.('button,a,summary,[role=button]'))return;
    if(/^[0-9]$/.test(k)){buf+=k;gotoEl.textContent='→ '+buf;gotoEl.classList.add('on');clearTimeout(bufT);bufT=setTimeout(()=>{buf='';gotoEl.classList.remove('on')},1800);return}
    if(k==='Enter'&&buf){e.preventDefault();const n=+buf;buf='';gotoEl.classList.remove('on');if(n>=1&&n<=MAIN.length)go(n-1,0);return}
    if(e.shiftKey&&(k==='ArrowRight'||k==='ArrowLeft')){e.preventDefault();if(!F[cur].backup)go(clamp(cur+(k==='ArrowRight'?1:-1),0,MAIN.length-1),0);return}
    if(['ArrowRight','ArrowDown',' ','PageDown','Enter'].includes(k)){e.preventDefault();if(!unblank())next();return}
    if(['ArrowLeft','ArrowUp','PageUp','Backspace'].includes(k)){e.preventDefault();if(!unblank())prev();return}
    if(k==='Home'){go(0,0);return}if(k==='End'){const last=MAIN[MAIN.length-1];go(last.i,last.steps);return}
    if(k==='b'||k==='B'||k==='.'){blank.classList.toggle('on');return}
    if(k==='f'||k==='F'){D.fullscreenElement?D.exitFullscreen():H.requestFullscreen&&H.requestFullscreen();return}
    if(k==='t'||k==='T'){toggleTheme();return}
    if(k==='c'||k==='C'){colors.cycle();return}
    if(k==='o'||k==='O'){setOverview(!overview);return}
    if(k==='Escape'){if(help.classList.contains('on'))help.classList.remove('on');else if(overview)setOverview(false);else unblank();return}
    if(k==='p'||k==='P'){e.preventDefault();openPresenter();return}
    if(k==='?'||k==='h'||k==='H'){help.classList.toggle('on');return}});
  addEventListener('mousemove',()=>{nav.classList.add('show');clearTimeout(nt);nt=setTimeout(()=>nav.classList.remove('show'),1800)});
  let tx=0,ty=0;addEventListener('touchstart',e=>{tx=e.touches[0].clientX;ty=e.touches[0].clientY},{passive:true});
  addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-tx,dy=e.changedTouches[0].clientY-ty;if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy))(dx<0?next:prev)()},{passive:true});
  addEventListener('resize',fit);
  addEventListener('hashchange',()=>{const h=parseHash();if(h&&(h[0]!==cur||h[1]!==step))go(h[0],h[1])});
}

/* ════ presenter link (main window side) ════ */
let pwin=null,bc=null;const seenMsg=new Set();
function send(msg){msg.cdeck=1;msg.id=ID;msg.uid=Math.random().toString(36).slice(2);
  try{if(pwin&&!pwin.closed)pwin.postMessage(msg,'*')}catch(e){}try{bc&&bc.postMessage(msg)}catch(e){}}
function sync(){
  if(MODE==='show')send({type:'pos',from:'deck',slide:cur,step,light:H.classList.contains('light'),palette:colors.get(),
    returnTo:returnPoint?[returnPoint.slide,returnPoint.step]:null});
}
function openPresenter(){
  const url=location.href.split('#')[0].split('?')[0]+'?presenter&palette='+encodeURIComponent(colors.get())+'&theme='+(H.classList.contains('light')?'light':'dark')+'#slide='+(cur+1)+'&step='+step;
  pwin=window.open(url,'cdeck-presenter-'+ID,'width=1360,height=860');setTimeout(sync,600);
}
function onMsg(m,src){
  if(!m||!m.cdeck||m.id!==ID||seenMsg.has(m.uid))return;seenMsg.add(m.uid);if(seenMsg.size>2048)seenMsg.delete(seenMsg.values().next().value);
  if(MODE==='show'&&m.from==='presenter'){if(src)pwin=src;
    if(m.type==='hello')sync();else if(m.type==='nav')(m.dir==='prev'?prev:next)();else if(m.type==='go')go(m.slide,m.step||0);
    else if(m.type==='back')returnToStory();
    else if(m.type==='blank')$('#cd-blank').classList.toggle('on')}
  if(MODE==='embed'&&m.type==='goto'){if(colors.has(m.palette))colors.set(m.palette,false);if(typeof m.light==='boolean')H.classList.toggle('light',m.light);go(m.slide,m.step||0,{quiet:true})}
  if(MODE==='presenter'&&m.from==='deck'&&m.type==='pos')PV&&PV.pos(m.slide,m.step,m.light,m.palette,m.returnTo);
}
addEventListener('message',e=>onMsg(e.data,e.source));
if(MODE==='show'||MODE==='presenter'){try{bc=new BroadcastChannel('cdeck-'+ID);bc.onmessage=e=>onMsg(e.data,null)}catch(e){}}

/* ════ print: one page per frame, or per build with ?print=steps ════ */
function printMode(){
  H.classList.add('print');const all=Q.get('print')==='steps',pages=D.createElement('div');pages.id='world';
  F.forEach(f=>{const lastStep=f.cams[f.steps]==='world'?f.steps-1:f.steps,list=all?Array.from({length:lastStep+1},(_,k)=>k):[lastStep];
    list.forEach((st,k)=>{const el=k===list.length-1?f.el:f.el.cloneNode(true);el.classList.add('is-active');
      const tmp={el,hls:$$('[data-hl]',el).map(e=>[e,stepSet(e.dataset.hl)])};
      el.setAttribute('data-at',st);$$('[data-step]',el).forEach(e=>{const a=+e.dataset.step,u=e.dataset.until==null?Infinity:+e.dataset.until;e.classList.toggle('on',st>=a&&st<=u)});
      tmp.hls.forEach(([e,s])=>e.classList.toggle('hl',s.test(st)));
      $$('[data-count]',el).forEach(c=>{c.textContent=cfmt(c,+c.dataset.count)});
      $$('.process',el).forEach(p=>{const a2=$$('.ps',p),on=a2.filter(x=>x.classList.contains('on')).length;p.style.setProperty('--p',a2.length>1?clamp((on-1)/(a2.length-1),0,1):1)});
      pages.appendChild(el)})});
  const st=$('#stage');st.innerHTML='';st.appendChild(pages);
  if(Q.get('autoprint')==='1')setTimeout(()=>print(),600);
}

/* ════ presenter console (?presenter) ════ */
let PV=null;
function presenter(){
  D.body.classList.add('deck-presenter');
  D.title='Presenter · '+D.title;const T=CFG.talk||{},base=location.href.split('#')[0].split('?')[0];
  const total=MAIN.reduce((q,f)=>q+f.minutes,0)||+T.minutes||0;
  const css=`body{overflow:auto;background:#05070C;color:#E9EDF3;font-family:var(--disp)}#viewport{display:none}
.pv{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(0,1fr);grid-template-rows:auto auto 1fr;gap:14px;padding:16px 18px;height:100vh;box-sizing:border-box}
.pv-top{grid-column:1/-1;display:flex;align-items:center;gap:18px;font-family:var(--mono);font-size:13px;color:#98A1B3}
.pv-top b{font-family:var(--disp);font-size:15px;color:#E9EDF3;font-weight:700;margin-right:auto;letter-spacing:.02em}
.pv-top .clk{font-size:22px;color:#E9EDF3}.pv-top .el{font-size:22px;color:var(--pv-accent,#38E5CE)}.pv-top .pace{min-width:150px;text-align:right}
.pv-top .pace.behind{color:var(--pv-ember,#FF7A45)}.pv-top .pace.ahead{color:var(--pv-green,#40E391)}
.pv button{background:#0E1422;border:1px solid rgba(255,255,255,.16);color:#E9EDF3;border-radius:8px;padding:7px 12px;font:500 13px var(--disp);cursor:pointer}
.pv button:hover{border-color:var(--pv-accent,#38E5CE)}
.pv-cur,.pv-nxt{position:relative;background:#000;border-radius:10px;overflow:hidden;aspect-ratio:16/9;border:1px solid rgba(255,255,255,.12)}
.pv-cur iframe,.pv-nxt iframe{position:absolute;inset:0;width:100%;height:100%;border:0;pointer-events:none}
.pv-side{display:flex;flex-direction:column;gap:10px;min-height:0}
.pv-meta{font-family:var(--mono);font-size:12.5px;letter-spacing:.06em;color:#98A1B3;line-height:1.6}.pv-meta b{color:#E9EDF3;font-weight:500}
.pv-notes{grid-column:1/-1;display:grid;grid-template-columns:minmax(0,1.35fr) minmax(0,1fr);gap:18px;min-height:0}
.pv-speech{overflow:auto;padding:4px 6px 30px 0}.pv-speech .cue{font-family:var(--mono);font-size:13px;letter-spacing:.06em;color:var(--pv-amber,#FFB547);margin-bottom:10px}
.pv-speech .now{font-size:25px;line-height:1.45;color:#F3F5F8}.pv-speech .nextb{margin-top:18px;font-size:17px;line-height:1.45;color:#5B6477}
.pv-speech .tr{margin-top:18px;font-size:18px;color:var(--pv-accent,#38E5CE)}.pv-speech .tr::before{content:'→ ';opacity:.7}
.pv-tabs{display:flex;gap:6px;flex-wrap:wrap}.pv-tabs button.on{border-color:var(--pv-accent,#38E5CE);color:var(--pv-accent,#38E5CE)}
.pv-pane{overflow:auto;font-size:15px;line-height:1.5;color:#B8C0CE;padding-right:6px}
.pv-pane ol{list-style:none}.pv-pane li{padding:7px 8px;border-bottom:1px solid rgba(255,255,255,.06);cursor:pointer;display:grid;grid-template-columns:34px 1fr auto;gap:8px}
.pv-pane li.cur{background:color-mix(in srgb,var(--pv-accent,#38E5CE) 10%,transparent);color:#fff}.pv-pane li span{font-family:var(--mono);font-size:12px;color:#5B6477}
.pv-pane dt{color:#E9EDF3;font-weight:600;margin-top:12px}.pv-pane dd{margin:4px 0 0}.pv-pane h4{margin:14px 0 4px;color:#E9EDF3}
.pv-pane [data-jump]{margin-top:7px}
.pv-beats p{padding:8px 10px;border-left:2px solid transparent;color:#7D8699}.pv-beats p.cur{border-color:var(--pv-accent,#38E5CE);color:#E9EDF3;background:color-mix(in srgb,var(--pv-accent,#38E5CE) 6%,transparent)}`;
  const st=D.createElement('style');st.textContent=css;D.head.appendChild(st);
  const tabs=[['beats','Beats'],['outline','Outline']].concat([['qa','Q&A'],['fallbacks','Fallbacks'],['demo','Demo'],['prep','Prep'],['facts','Facts'],['sources','Sources']].filter(([k])=>T[k]&&T[k].length));
  D.body.insertAdjacentHTML('beforeend',`<div class="pv"><div class="pv-top"><b>${esc(CFG.title||D.title.replace(/^Presenter · /,''))}</b>
<span class="pos"></span><span class="pace"></span><span class="el">00:00</span><button data-t="start">Start</button><button data-t="reset">Reset</button><span class="clk"></span>
<button data-t="prev">‹ Prev</button><button data-t="next">Next ›</button><button data-t="blank">Blank</button>
${BACKUPS.length?'<button type="button" data-t="back" aria-keyshortcuts="R" hidden>Return to talk (R)</button>':''}</div>
<div class="pv-cur"><iframe title="Current" src="${base}?embed&palette=${encodeURIComponent(colors.get())}&theme=${H.classList.contains('light')?'light':'dark'}#slide=1&step=0"></iframe></div>
<div class="pv-side"><div class="pv-nxt"><iframe title="Next" src="${base}?embed&palette=${encodeURIComponent(colors.get())}&theme=${H.classList.contains('light')?'light':'dark'}#slide=1&step=0"></iframe></div><div class="pv-meta"></div></div>
<div class="pv-notes"><div class="pv-speech"></div><div style="display:flex;flex-direction:column;gap:10px;min-height:0"><div class="pv-tabs">${tabs.map(([k,l],n)=>`<button data-tab="${k}"${n?'':' class="on"'}>${l}</button>`).join('')}</div><div class="pv-pane"></div></div></div></div>`);
  const [fc,fn]=$$('iframe'),posEl=$('.pv-top .pos'),paceEl=$('.pv-top .pace'),elEl=$('.pv-top .el'),clk=$('.pv-top .clk'),meta=$('.pv-meta'),speech=$('.pv-speech'),pane=$('.pv-pane');
  const returnButton=$('[data-t="back"]');
  let s=0,t=0,tab='beats',t0=0,acc=0,running=false,linked=false,saved=null;
  const fmtT=ms=>{const v=Math.max(0,Math.round(ms/1000));return pad2(Math.floor(v/60))+':'+pad2(v%60)};
  const elapsed=()=>acc+(running?Date.now()-t0:0);
  const nextPos=()=>adjacentPosition(s,t,1);
  const tell=(fr,a,b)=>{try{fr.contentWindow.postMessage({cdeck:1,id:ID,uid:Math.random().toString(36).slice(2),type:'goto',slide:a,step:b,light:H.classList.contains('light'),palette:colors.get()},'*')}catch(e){}};
  const beatAt=(f,k)=>{let b=null;f.notes.beats.forEach(x=>{if(x.step<=k&&(!b||x.step>=b.step))b=x});return b};
  function render(){
    const f=F[s],a=ACTS[f.act]||{},b=beatAt(f,t),nb=f.notes.beats.filter(x=>x.step>t).sort((p,q)=>p.step-q.step)[0],[ns,nt]=nextPos();
    const position=f.backup?`Q&A · ${frameNumber(f)}`:`${frameNumber(f)}/${pad2(MAIN.length)}`;
    const act=f.backup?'Backup slide':esc(a.k||'')+(a.t?' — '+esc(a.t):'')+(f.minutes?' · plan '+f.minutes+' min':'');
    const upcoming=ns!==s?esc(F[ns].title):nt!==t?'build '+nt:f.backup&&saved?'return with R':'—';
    posEl.textContent=`${position} · build ${t}/${f.steps}`;
    meta.innerHTML=`<b>${esc(f.title)}</b><br>${act}<br>next: ${upcoming}`;
    if(returnButton) returnButton.hidden=!f.backup||!saved;
    speech.innerHTML=(b&&b.cue?`<div class="cue">${b.cue}</div>`:'')+`<div class="now">${b?b.html:'<span style="color:#5B6477">No notes for this build.</span>'}</div>`+(nb?`<div class="nextb">${nb.html}</div>`:'')+(t===f.steps&&f.notes.transition?`<div class="tr">${f.notes.transition}</div>`:'');
    tell(fc,s,t);tell(fn,ns,nt);paneRender();
  }
  function paneRender(){
    if(tab==='beats'){const f=F[s];pane.innerHTML='<div class="pv-beats">'+(f.notes.beats.map(x=>`<p class="${beatAt(f,t)===x?'cur':''}"><b>${x.step}</b> · ${x.html}</p>`).join('')||'<p>No beats.</p>')+'</div>';return}
    if(tab==='outline'){let acc2=0;pane.innerHTML='<ol>'+F.map((f,n)=>{const at=acc2;if(!f.backup)acc2+=f.minutes;return `<li data-go="${n}" class="${n===s?'cur':''}"><span>${frameNumber(f)}</span>${esc(f.title)}<span>${f.backup?'Q&A':f.minutes?fmtT(at*60000):''}</span></li>`}).join('')+'</ol>';return}
    const L=T[tab]||[];
    if(tab==='qa')pane.innerHTML='<dl>'+L.map(x=>{
      const index=backupIndex(x?.goto);
      const show=index<0?'':`<br><button type="button" data-jump="${index}">Show ${frameNumber(F[index])}</button>`;
      return `<dt>${esc(x?.question||x?.q||'')}</dt><dd>${esc(x?.answer||x?.a||'')}${show}</dd>`;
    }).join('')+'</dl>';
    else if(tab==='facts')pane.innerHTML='<dl>'+L.map(x=>{const v=[].concat(x.value==null?[]:x.value).join(' · ');
      return `<dt>${esc(x.claim||v)}</dt><dd>${esc([x.claim?v:'',x.source,x.date].filter(Boolean).join(' — '))}${x.quote?`<br><i>“${esc(x.quote)}”</i>`:''}</dd>`}).join('')+'</dl>';
    else pane.innerHTML=L.map(x=>typeof x==='string'?`<p style="margin-bottom:10px">${esc(x)}</p>`:'<div>'+Object.keys(x).map(k=>`<h4>${esc(k)}</h4><div>${esc(x[k])}</div>`).join('')+'</div><hr style="border:0;border-top:1px solid rgba(255,255,255,.08);margin:10px 0">').join('');
  }
  function pace(){
    const e=elapsed();elEl.textContent=fmtT(e);clk.textContent=new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
    if(F[s].backup){paceEl.textContent='Q&A';paceEl.className='pace';return}
    if(!total||!e){paceEl.textContent=total?'plan '+Math.round(total)+' min':'';paceEl.className='pace';return}
    const before=F.slice(0,s).reduce((q,f)=>q+f.minutes,0),plan=(before+F[s].minutes*(t/(F[s].steps+1)))*60000,d=e-plan;
    paceEl.textContent=Math.abs(d)<30000?'on pace':(d>0?'+'+fmtT(d)+' behind':'-'+fmtT(-d)+' ahead');paceEl.className='pace '+(Math.abs(d)<30000?'':d>0?'behind':'ahead');
  }
  setInterval(pace,500);
  const move=(dir)=>{if(linked)send({type:'nav',from:'presenter',dir});else{[s,t]=adjacentPosition(s,t,dir==='next'?1:-1);render()}
    if(!running&&dir==='next'){running=true;t0=Date.now()}};
  function openFrame(index){
    if(linked){send({type:'go',from:'presenter',slide:index,step:0});return}
    if(F[index].backup&&!F[s].backup) saved=[s,t];
    if(!F[index].backup) saved=null;
    s=index;t=0;render();
  }
  function back(){
    if(!saved) return false;
    if(linked) send({type:'back',from:'presenter'});
    else{[s,t]=saved;saved=null;render()}
    return true;
  }
  D.addEventListener('click',e=>{const b=e.target.closest('button'),li=e.target.closest('li[data-go]');
    if(li){openFrame(+li.dataset.go);return}
    if(b?.dataset.jump!=null){openFrame(+b.dataset.jump);return}
    if(!b)return;if(b.dataset.tab){tab=b.dataset.tab;$$('.pv-tabs button').forEach(x=>x.classList.toggle('on',x===b));paneRender();return}
    const a=b.dataset.t;if(a==='next'||a==='prev')move(a);
    else if(a==='back')back();
    else if(a==='start'){if(running){acc=elapsed();running=false;b.textContent='Start'}else{t0=Date.now();running=true;b.textContent='Pause'}}
    else if(a==='reset'){acc=0;t0=Date.now()}else if(a==='blank')send({type:'blank',from:'presenter'})});
  addEventListener('keydown',e=>{
    if(e.target.closest?.('input,textarea,select,[contenteditable]'))return;
    const k=e.key;
    if(!e.metaKey&&!e.ctrlKey&&!e.altKey&&k.toLowerCase()==='r'&&back()){e.preventDefault();return}
    if(e.target.closest?.('button,a,summary,[role=button]'))return;
    if(['ArrowRight','ArrowDown',' ','PageDown','Enter'].includes(k)){e.preventDefault();move('next')}
    else if(['ArrowLeft','ArrowUp','PageUp','Backspace'].includes(k)){e.preventDefault();move('prev')}});
  PV={pos(a,b,light,palette,returnTo){
    linked=true;saved=returnTo||null;
    if(colors.has(palette))colors.set(palette,false);
    H.classList.toggle('light',!!light);
    s=clamp(a,0,F.length-1);t=clamp(b,0,F[s].steps);render();
  }};
  const h=parseHash();if(h){s=h[0];t=h[1]}
  fc.addEventListener('load',render);fn.addEventListener('load',render);
  try{if(opener)pwin=opener}catch(e){}
  const hello=()=>{const m={type:'hello',from:'presenter',cdeck:1,id:ID,uid:Math.random().toString(36).slice(2)};try{opener&&opener.postMessage(m,'*')}catch(e){}try{bc&&bc.postMessage(m)}catch(e){}};
  hello();setTimeout(hello,700);render();
}

/* ════ boot ════ */
function boot(){
  ACTS=Array.isArray(CFG.acts)?CFG.acts:[];
  components(D);
  F=model();
  MAIN=F.filter(f=>!f.backup);
  BACKUPS=F.filter(f=>f.backup);
  if(!MAIN.length){console.warn('[deck] no main .frame elements');return}
  colors.refresh();
  if(MODE==='presenter')return presenter();
  $$('.split').forEach(splitWords);
  if(MODE==='print'){printMode();return}
  stage=$('#stage');world=$('#world');stage.classList.toggle('show-acts-on-zoom',WORLD.showActsOnZoom===true);
  layout();buildWorld();buildChrome();colors.refresh();
  mini=$('.cd-minimap rect.v');whereEl=$('.cd-hud .where');segs=$$('.cd-hud .acts>div');card=$('.cd-actcard');live=$('#cd-live');
  F.forEach(f=>{f.el.setAttribute('role','group');f.el.setAttribute('aria-roledescription','slide');
    f.el.setAttribute('aria-label',f.backup?`Q&A ${frameNumber(f)}: ${f.title}`:`${frameNumber(f)} of ${MAIN.length}: ${f.title}`)});
  fit();if(PREVIEW)bindPreview();else bind();guardScroll();fieldWaves(D);if(D.fonts&&D.fonts.ready)D.fonts.ready.then(()=>fieldWaves(D));
  window.deck={go:(s,t)=>go(s,t||0,{quiet:true}),next,prev,jump:jumpToBackup,back:returnToStory,get:()=>[cur,step],count:F.length,mainCount:MAIN.length,steps:F.map(f=>f.steps),
    frames:F.map(f=>({title:f.title,id:f.el.id,backup:f.backup,act:f.act,steps:f.steps,minutes:f.minutes,x:f.x,y:f.y})),notes:()=>F.map(f=>f.notes),
    setPalette:colors.set,palette:colors.get,palettes:colors.ids,cyclePalette:colors.cycle,
    overview:on=>setOverview(on==null?!overview:!!on),toggleTheme,presenter:openPresenter,cam:()=>Object.assign({},cam),config:CFG,version:'2.4.0',upstreamVersion:'1.2'};
  window.__deck=window.deck;
  const h=parseHash();
  if(h||STATIC){const [s,t]=h||[0,0];cur=-1;apply(camFor(s,t));cur=s;step=t;go(s,t,{force:true,quiet:true});return}
  /* opening shot: pulled back in the dark, push in to the title */
  cur=0;step=0;apply({x:F[0].x+FW/2,y:F[0].y+FH/2,s:REDUCE?1:.62});
  stage.style.setProperty('--arrive',REDUCE?'0ms':'900ms');F[0].el.classList.add('is-active');setSteps(0,0);hud();counters(900);typed(900);
  shield();
  if(!REDUCE)introT=setTimeout(()=>{
    if(PREVIEW&&(cur!==0||step!==0))return;
    fly({x:F[0].x+FW/2,y:F[0].y+FH/2,s:1},2600,true);introT=setTimeout(()=>stage.style.setProperty('--arrive','0ms'),2700)
  },150);
  else settle();
  sync();
}
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',boot);else boot();
})();
