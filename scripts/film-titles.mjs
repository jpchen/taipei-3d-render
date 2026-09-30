// Typography and palette match the simulation's location cards.
export async function installFilmTitles(page,scale=1){
 await page.evaluate(scale=>{
  const style=document.createElement('style');style.textContent=`
   #film-titles{position:fixed;inset:0;z-index:100;pointer-events:none;color:#f8f3e8}
   #film-shade{position:absolute;inset:35% 0 0;background:linear-gradient(0deg,rgba(13,28,28,.88),rgba(13,28,28,.28) 42%,transparent 80%)}
   #film-card{position:absolute;left:76px;bottom:76px;width:1500px;transform-origin:bottom left;transform:scale(${scale})}
   #film-rule{height:2px;width:80px;background:#e7c59b;margin-bottom:22px}
   #film-kicker{font:500 19px Manrope,'DM Sans',sans-serif;letter-spacing:5px;color:#e7c59b;margin-bottom:18px}
   #film-en{font:400 64px/1.15 Georgia,'Times New Roman',serif;letter-spacing:-1px;text-shadow:0 2px 20px #16252466}
   #film-zh{font:400 38px/1.4 'PingFang TC','Songti TC','Heiti TC',sans-serif;letter-spacing:4px;color:#efc9a1;margin-top:16px}
   #film-end{position:absolute;right:76px;bottom:78px;text-align:right;transform-origin:bottom right;transform:scale(${scale});font:400 27px/1.6 'DM Sans',sans-serif;color:#e7c59b}
   #film-end strong{display:block;font:400 36px Georgia,serif;color:#f8f3e8}
   #film-credit{position:absolute;right:36px;bottom:20px;font:14px 'DM Sans',sans-serif;color:#d5d8ce}
  `;document.head.appendChild(style);
  const el=document.createElement('div');el.id='film-titles';el.innerHTML='<div id="film-shade"></div><div id="film-card"><div id="film-rule"></div><div id="film-kicker"></div><div id="film-en"></div><div id="film-zh" lang="zh-Hant"></div></div><div id="film-end"><strong>A city to explore.</strong>taipei.jonathanpchen.com</div><div id="film-credit">Map data © OpenStreetMap contributors</div>';document.body.appendChild(el);
 },scale);
 await page.evaluate(()=>document.fonts.ready);
}
export async function updateFilmTitles(page,shot,time){
 await page.evaluate(({shot,time})=>{
  const opacity=Math.max(0,Math.min(1,time/.4,(shot.duration-time)/.4));
  document.querySelector('#film-titles').style.opacity=opacity;
  document.querySelector('#film-en').textContent=shot.label;
  document.querySelector('#film-en').style.fontSize=shot.label.length>32?'54px':'64px';
  document.querySelector('#film-zh').textContent=shot.zh;
  document.querySelector('#film-kicker').textContent=shot.id==='taipei-101'?'TAIPEI AT DUSK':'EXPLORE TAIPEI';
  document.querySelector('#film-end').style.display=shot.id==='shilin'?'block':'none';
 },{shot,time});
}
