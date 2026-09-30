import {installFilmTitles,updateFilmTitles} from './film-titles.mjs';
import {chromium} from 'playwright';import {mkdir,writeFile,access} from 'node:fs/promises';import {shots,frameFor,filmRoot,filmFrames} from './film-shots.mjs';
const preview=process.argv.includes('--preview'),root=filmRoot,width=preview?1280:1920,height=preview?720:1080,fps=30;
await mkdir(`${root}/frames`,{recursive:true});await mkdir(`${root}/previews`,{recursive:true});
const browser=await chromium.launch({channel:'chrome',args:['--autoplay-policy=no-user-gesture-required']});
try{const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});await page.addInitScript(()=>{let seed=73429;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};});page.on('pageerror',e=>console.error('PAGE ERROR',e.message));await page.goto('http://127.0.0.1:5188/?film=1');await page.waitForFunction(()=>window.__taipei?.ready,null,{timeout:120000});await page.locator('#loading').waitFor({state:'detached'});await page.evaluate(()=>__taipei.cinema.begin());await installFilmTitles(page,width/1920);
 const context=await page.evaluate(async shots=>{const {terrainHeight}=await import('/src/terrain.js'),a=__taipei,heights={};for(const s of shots){let x,z;if(s.habitat){const h=a.zoo.data.habitats.find(h=>h.species===s.habitat);x=h.x;z=h.z;}else if(s.center){x=(s.center[0]-121.54)*100800;z=(25.05-s.center[1])*111320;}else continue;heights[s.id]=terrainHeight(a.terrain,x,z);}const m=a.market.destination();return {habitats:a.zoo.data.habitats,gondola:a.zoo.gondola.route.points,heights,market:{pos:m.pos.toArray(),target:m.target.toArray()}};},shots);
 await writeFile(`${root}/shot-context.json`,JSON.stringify(context,null,2));await writeFile(`${root}/shots.json`,JSON.stringify(shots,null,2));let frame=0,time=1000;
 for(const shot of shots){const count=Math.round(shot.duration*fps);console.log('SHOT',shot.id,'frames',count);for(let i=0;i<(preview?1:count);i++){const u=preview?.5:i/(count-1),pose=frameFor(shot,u,context);time+=i===0?2:1/fps;const stats=await page.evaluate(args=>__taipei.cinema.frame(args),{...pose,time,cut:i===0});if(i===0){await page.waitForTimeout(250);await page.evaluate(args=>__taipei.cinema.frame(args),{...pose,time:time+.001,cut:false});console.log('DETAIL',JSON.stringify(stats));}
  await updateFilmTitles(page,shot,preview?shot.duration/2:i/fps);
  const path=preview?`${root}/previews/${shot.id}.png`:`${root}/frames/${String(frame).padStart(5,'0')}.png`;await page.screenshot({path,animations:'allow'});frame++;if(!preview&&i%30===0)console.log('FRAME',frame,`/${filmFrames}`);}
 }
 console.log('COMPLETE',frame,'frames');
}finally{await browser.close();}
