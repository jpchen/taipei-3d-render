import {extendZoo} from './map-data.mjs';
import {readFile,writeFile} from 'node:fs/promises';
import {buildRoadNetwork} from '../src/roads.js';
import {terrainHeight} from '../src/terrain.js';
const raw=JSON.parse(await readFile('assets/map-source.json','utf8'));
await extendZoo(raw);
const terrain=JSON.parse(await readFile('public/data/terrain.json','utf8'));
const project=([lon,lat])=>[(lon-121.54)*100800,(25.05-lat)*111320];
function elevation(lon,lat){const [x,z]=project([lon,lat]);return terrainHeight(terrain,x,z);}
let walkways;
try{walkways=JSON.parse(await readFile('assets/walkways-source.json','utf8'));}catch{
 const query='[out:json][timeout:120];way[highway~"^(footway|pedestrian|path)$"][access!="private"][tunnel!="yes"](25.015,121.49,25.075,121.595);out geom;';
 const r=await fetch('https://overpass.private.coffee/api/interpreter',{method:'POST',body:new URLSearchParams({data:query}),signal:AbortSignal.timeout(150000)});if(!r.ok)throw Error(`Walkway download: ${r.status}`);walkways=await r.json();if(walkways.remark||!walkways.elements?.length)throw Error(walkways.remark||'No walkways');await writeFile('assets/walkways-source.json',JSON.stringify(walkways));
}
const roads=buildRoadNetwork(raw.elements,terrain).filter(r=>!r.private);
const walks=walkways.elements.filter(e=>e.geometry?.length>1&&e.tags?.bridge!=='yes'&&e.tags?.access!=='private'&&e.tags?.tunnel!=='yes').map(e=>({id:e.id,k:'walk',w:2,p:e.geometry.map(p=>[p.lon,p.lat])}));
const routes=[...roads,...walks.map(r=>({...r,p:r.p.map(([lon,lat])=>{const [x,z]=project([lon,lat]);return [+x.toFixed(2),+z.toFixed(2),+elevation(lon,lat).toFixed(2)];})}))].filter(r=>r.p.length>1);
const pedestrianObstacles=[],pedestrianDecks=[];
const market=JSON.parse(await readFile('public/data/market.json','utf8'));
const parks=raw.elements.filter(e=>e.t.leisure==='park').map(e=>e.p);
function inside(x,z,p){let yes=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
for(const route of routes){if(route.k==='walk'){const p=route.p[Math.floor(route.p.length/2)];route.park=parks.some(poly=>inside(p[0]/100800+121.54,25.05-p[1]/111320,poly));}if(market.roadIds.includes(route.id))route.marketStreet=true;}
routes.push(...market.routes);
try{const {places}=JSON.parse(await readFile('public/data/places.json'));for(const place of places){pedestrianObstacles.push(...(place.obstacles||[]));pedestrianDecks.push(...(place.piers||[]));}for(const place of places)for(const path of place.routes){const existing=routes.find(r=>r.k==='walk'&&Math.floor(r.id)===Math.floor(path.id));if(existing){existing.place=place.id;}else routes.push(path);}}catch(e){if(e.code!=='ENOENT')throw e;}
// Split wharf walking paths at kiosks and buildings; people turn at safe segment ends.
const blocked=p=>pedestrianObstacles.some(poly=>inside(p[0],p[1],poly));
for(let index=routes.length-1;index>=0;index--){const r=routes[index];if(r.k!=='walk'||r.place!=='dadaocheng')continue;const pieces=[];let current=[];const flush=()=>{if(current.length>1)pieces.push({...r,id:r.id+pieces.length*.000001,p:current});current=[];};for(let i=1;i<r.p.length;i++){const a=r.p[i-1],b=r.p[i],steps=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.75);for(let j=0;j<steps;j++){const p=a.map((v,k)=>v+(b[k]-v)*j/steps);if(blocked(p))flush();else current.push(p);}}if(!blocked(r.p.at(-1)))current.push(r.p.at(-1));flush();routes.splice(index,1,...pieces);}
await writeFile('public/data/activity.json' ,JSON.stringify({source:'© OpenStreetMap contributors, ODbL 1.0',marketBounds:market.bounds,routes,pedestrianObstacles,pedestrianDecks}));console.log('Prepared activity paths:',roads.length,'roads;',walks.length,'walkways');
