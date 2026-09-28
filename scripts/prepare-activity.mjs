import {readFile,writeFile} from 'node:fs/promises';
const raw=JSON.parse(await readFile('assets/map-source.json','utf8'));
const terrain=JSON.parse(await readFile('public/data/terrain.json','utf8'));
const project=([lon,lat])=>[(lon-121.54)*100800,(25.05-lat)*111320];
function elevation(lon,lat){const {n,bounds:b,heights:h}=terrain;const u=Math.max(0,Math.min(n-.001,(lon-b[0])/(b[2]-b[0])*n)),v=Math.max(0,Math.min(n-.001,(b[3]-lat)/(b[3]-b[1])*n)),i=Math.floor(u),j=Math.floor(v),fx=u-i,fz=v-j;return Math.max(1,(h[j*(n+1)+i]*(1-fx)+h[j*(n+1)+i+1]*fx)*(1-fz)+(h[(j+1)*(n+1)+i]*(1-fx)+h[(j+1)*(n+1)+i+1]*fx)*fz-12);}
let walkways;
try{walkways=JSON.parse(await readFile('assets/walkways-source.json','utf8'));}catch{
 const query='[out:json][timeout:120];way[highway~"^(footway|pedestrian|path)$"][access!="private"][tunnel!="yes"](25.015,121.49,25.075,121.595);out geom;';
 const r=await fetch('https://overpass.private.coffee/api/interpreter',{method:'POST',body:new URLSearchParams({data:query}),signal:AbortSignal.timeout(150000)});if(!r.ok)throw Error(`Walkway download: ${r.status}`);walkways=await r.json();if(walkways.remark||!walkways.elements?.length)throw Error(walkways.remark||'No walkways');await writeFile('assets/walkways-source.json',JSON.stringify(walkways));
}
const widths={motorway:22,trunk:20,primary:21,secondary:16,tertiary:12,residential:7,unclassified:6,living_street:5};
const roads=raw.elements.filter(e=>e.t.highway&&e.t.tunnel!=='yes'&&e.t.access!=='private').map(e=>({id:e.id,k:e.t.highway,oneway:e.t.oneway==='yes'?1:e.t.oneway==='-1'?-1:0,w:widths[e.t.highway]||7,bridge:e.t.bridge==='yes',p:e.p}));
const walks=walkways.elements.filter(e=>e.geometry?.length>1&&e.tags?.bridge!=='yes'&&e.tags?.access!=='private'&&e.tags?.tunnel!=='yes').map(e=>({id:e.id,k:'walk',w:2,p:e.geometry.map(p=>[p.lon,p.lat])}));
const routes=[...roads,...walks].map(r=>({...r,p:r.p.map(([lon,lat])=>{const [x,z]=project([lon,lat]);return [+x.toFixed(2),+z.toFixed(2),+elevation(lon,lat).toFixed(2)];})})).filter(r=>r.p.length>1);
await writeFile('public/data/activity.json',JSON.stringify({source:'© OpenStreetMap contributors, ODbL 1.0',routes}));console.log('Prepared activity paths:',roads.length,'roads;',walks.length,'walkways');
