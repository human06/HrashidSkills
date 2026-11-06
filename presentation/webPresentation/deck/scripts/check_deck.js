// node shoot.js <deck.html|http-url> <outdir> [--theme dark|light|both]
//               [--palette id|all] [--only 3:0,3:2] [--static] [--modes]
const fs=require('fs'),path=require('path');
const {pathToFileURL}=require('url'),{createRequire}=require('module');
const args=process.argv.slice(2);
const flag=(k,d)=>{const i=args.indexOf(k);return i<0?d:args.splice(i,2)[1]};
const bool=k=>{const i=args.indexOf(k);if(i<0)return false;args.splice(i,1);return true};
const theme=flag('--theme','both'),palette=flag('--palette',null),only=flag('--only',''),staticMode=bool('--static'),modes=bool('--modes');
const [deck,outdir]=args;
if(!deck||!outdir||!['dark','light','both'].includes(theme)){
  console.error('usage: node shoot.js <deck.html|http-url> <outdir> [--theme dark|light|both] [--only 3:0,3:2] [--static] [--modes]');process.exit(1);
}
let chromium;
for(const req of [createRequire(path.join(process.cwd(),'deck-check.js')),require]){
  for(const name of ['playwright-core','playwright']){try{chromium=req(name).chromium;break}catch{}}
  if(chromium)break;
}
if(!chromium)throw new Error('Install playwright-core in a check directory, then run this script from there.');
fs.mkdirSync(outdir,{recursive:true});
const base=/^https?:\/\//.test(deck)?new URL(deck):pathToFileURL(path.resolve(deck));
const url=(t,mode,pal)=>{const u=new URL(base);u.hash='';['print','presenter','embed'].forEach(k=>u.searchParams.delete(k));u.searchParams.set('theme',t);if(pal)u.searchParams.set('palette',pal);if(staticMode)u.searchParams.set('static','1');if(mode)u.searchParams.set(mode,'');return u.href};
async function launch(){for(const channel of ['msedge','chrome',undefined]){try{return await chromium.launch(channel?{channel}:{})}catch{}}throw new Error('No Chrome, Edge or installed Chromium found.')}
(async()=>{
  const browser=await launch(),report={deck,static:staticMode,captures:[],errors:[],warnings:[],modes:[]};
  try{
    let palettes=[palette];
    if(palette){const probe=await browser.newPage();await probe.goto(url('dark'));await probe.waitForFunction(()=>!!(window.deck||window.__deck));
      const ids=await probe.evaluate(()=>(window.deck||window.__deck).palettes||['base']);await probe.close();
      if(palette==='all')palettes=ids;else if(!ids.includes(palette))throw new Error('Unknown palette: '+palette);}
    for(const pal of palettes){
    for(const t of theme==='both'?['dark','light']:[theme]){
      const p=await browser.newPage({viewport:{width:1600,height:900}});
      p.on('pageerror',e=>report.errors.push(`[${t}] ${e.message}`));
      p.on('console',m=>{if(m.type()==='error')report.errors.push(`[${t}] ${m.text()}`)});
      await p.goto(url(t,null,pal));await p.waitForFunction(()=>!!(window.deck||window.__deck));await p.evaluate(()=>document.fonts.ready);
      const steps=await p.evaluate(()=>(window.deck||window.__deck).steps);
      const list=only?only.split(',').map(x=>x.split(':').map(Number)).map(([f,s])=>[f-1,s]):steps.flatMap((n,f)=>Array.from({length:n+1},(_,s)=>[f,s]));
      for(const [f,s] of list){
        if(!Number.isInteger(f)||!Number.isInteger(s)||f<0||f>=steps.length||s<0||s>steps[f])throw new Error(`Invalid capture ${f+1}:${s}`);
        const name=`${pal?pal+'-':''}${t}-${String(f+1).padStart(2,'0')}-${s}`;
        await p.evaluate(([f,s])=>(window.deck||window.__deck).go(f,s),[f,s]);
        const finale=await p.locator('#stage').evaluate(e=>e.classList.contains('lightsout'));
        await p.waitForTimeout(staticMode?100:finale?6500:4400);
        await p.screenshot({path:path.join(outdir,name+'.png')});
        const warnings=await p.evaluate(()=>{
          const api=window.deck||window.__deck;if(document.querySelector('#stage.lightsout')||Math.abs(api.cam().s-1)>.01)return [];
          const st=document.querySelector('#stage').getBoundingClientRect(),k=st.width/1600,out=[];
          const visible=e=>{for(let a=e;a&&a!==document.body;a=a.parentElement){const c=getComputedStyle(a);if(c.display==='none'||c.visibility==='hidden'||+c.opacity===0)return false}return true};
          document.querySelectorAll('.frame.is-active .in :is(h1,h2,h3,p,li,b,span,text)').forEach(e=>{
            if(!visible(e)||!e.textContent.trim())return;const range=document.createRange();range.selectNodeContents(e);
            const r=e instanceof SVGElement?e.getBoundingClientRect():range.getBoundingClientRect();if(!r.width)return;
            const x=(r.left-st.left)/k,y=(r.top-st.top)/k,w=r.width/k,h=r.height/k;
            if(x<20||y<16||x+w>1580||y+h>884)out.push(`${e.textContent.trim().slice(0,55)} at ${Math.round(x)},${Math.round(y)} ${Math.round(w)}×${Math.round(h)}`);
          });return [...new Set(out)];
        });
        report.captures.push({name,frame:f+1,step:s,theme:t,palette:pal,finale});report.warnings.push(...warnings.map(w=>`[${name}] ${w}`));
      }
      if(modes){
        await p.goto(url(t,null,pal));await p.waitForFunction(()=>!!(window.deck||window.__deck));
        const hasOverview=await p.evaluate(()=>typeof (window.deck||window.__deck).overview==='function');
        if(hasOverview){
          for(const exit of ['o','Escape']){
            await p.keyboard.press('End');
            const wasFinale=await p.locator('#stage').evaluate(e=>e.classList.contains('lightsout'));
            await p.keyboard.press('o');
            const entered=await p.locator('#stage').evaluate(e=>e.classList.contains('overview'));
            await p.keyboard.press(exit);
            const restored=await p.locator('#stage').evaluate(e=>!e.classList.contains('overview')&&e.classList.contains('lightsout'));
            if(!entered||(wasFinale&&!restored))report.errors.push(`[${t}] overview did not restore finale via ${exit}`);
            report.modes.push({theme:t,mode:'overview-return',exit,wasFinale,entered,restored});
          }
          const before=await p.evaluate(()=>({pos:(window.deck||window.__deck).get(),light:document.documentElement.classList.contains('light')}));
          await p.getByRole('button',{name:'Light or dark (T)',exact:true}).press('Enter');
          const after=await p.evaluate(()=>({pos:(window.deck||window.__deck).get(),light:document.documentElement.classList.contains('light')}));
          const ok=before.light!==after.light&&JSON.stringify(before.pos)===JSON.stringify(after.pos);
          if(!ok)report.errors.push(`[${t}] keyboard theme button changed slide or failed to toggle theme`);
          report.modes.push({theme:t,mode:'keyboard-theme',ok});
        }
        await p.goto(url(t,'print',pal));const frames=await p.locator('.frame').count();
        if(frames!==steps.length)report.errors.push(`[${t}] print: expected ${steps.length} frames, found ${frames}`);
        report.modes.push({theme:t,mode:'print',palette:pal,frames});await p.goto(url(t,'presenter',pal));
        await p.getByRole('button',{name:'Start',exact:true}).waitFor();
        const pos=await p.locator('.pv-top .pos').textContent();
        await p.getByRole('button',{name:'Start',exact:true}).press('Enter');
        const started=await p.getByRole('button',{name:'Pause',exact:true}).count()===1&&pos===await p.locator('.pv-top .pos').textContent();
        if(!started)report.errors.push(`[${t}] presenter Start key activation navigated or failed`);
        await p.screenshot({path:path.join(outdir,`${pal?pal+'-':''}${t}-presenter.png`)});
        report.modes.push({theme:t,mode:'presenter',iframes:await p.locator('iframe').count()});
      }
      await p.close();
    }
    }
  }finally{await browser.close();fs.writeFileSync(path.join(outdir,'report.json'),JSON.stringify(report,null,2)+'\n')}
  console.log(`${report.captures.length} captures, ${report.errors.length} errors, ${report.warnings.length} layout warnings; ${path.join(outdir,'report.json')}`);
  if(report.errors.length)process.exitCode=1;
})().catch(e=>{console.error(e.stack);process.exitCode=1});
