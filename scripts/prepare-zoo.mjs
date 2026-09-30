import {readFile,writeFile} from 'node:fs/promises';
import {insidePolygon} from '../src/landmark-layout.js';
const raw=JSON.parse(await readFile('assets/places/zoo-osm.json')),nodes=new Map(raw.elements.filter(e=>e.type==='node').map(e=>[e.id,e]));
const project=n=>[(n.lon-121.54)*100800,(25.05-n.lat)*111320];
const ways=raw.elements.filter(e=>e.type==='way'&&e.tags).map(e=>({...e,p:e.nodes.map(id=>project(nodes.get(id)))}));
const boundary=ways.find(e=>e.id===135913533).p;
const paths=ways.filter(e=>/^(footway|pedestrian|path|steps|service)$/.test(e.tags.highway)&&!['private','no'].includes(e.tags.access)&&e.tags.foot!=='no'&&e.p.some(p=>insidePolygon(p,boundary)));
const buildings=ways.filter(e=>e.tags.building),zones=ways.filter(e=>e.tags.attraction==='animal'&&!e.tags.building);
function closest(p,a,b){const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dz)/(dx*dx+dz*dz||1)));return [a[0]+dx*t,a[1]+dz*t];}
const distance=(p,a,b)=>{const q=closest(p,a,b);return Math.hypot(q[0]-p[0],q[1]-p[1]);};
function clip(poly,value){const out=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],va=value(a),vb=value(b);if(va>=0)out.push(a);if((va<0)!==(vb<0)){const t=va/(va-vb);out.push(a.map((x,j)=>x+(b[j]-x)*t));}}return out;}
function interior(poly){const xs=poly.map(p=>p[0]),zs=poly.map(p=>p[1]);let best=null,clearance=-1;for(let x=Math.min(...xs)+1;x<Math.max(...xs);x+=2)for(let z=Math.min(...zs)+1;z<Math.max(...zs);z+=2){const p=[x,z];if(!insidePolygon(p,poly))continue;const d=Math.min(...poly.map((a,i)=>distance(p,a,poly[(i+1)%poly.length])));if(d>clearance){best=p;clearance=d;}}if(!best)throw Error('Habitat has no interior');return {p:best,clearance};}
const specs=[
 [4371227973,'giraffe',4,'Giraffes','長頸鹿'],[11841265146,'zebra',7,'Zebras','斑馬'],[11841263743,'elephant',4,'African elephants','非洲象'],[4378252423,'flamingo',12,'Flamingos','紅鶴'],
 [202941526,'panda',3,'Giant Panda House','大貓熊館',true],[11857253386,'red-panda',5,'Red pandas','小貓熊'],[4360375171,'monkey',9,'Formosan rock macaques','臺灣獼猴'],[439499689,'penguin',16,'Penguin House','企鵝館',true]
];
const habitats=[];
for(const [id,species,count,name,zh,indoor=false] of specs){
 const building=indoor?buildings.find(w=>w.id===id):null,origin=indoor?interior(building.p).p:project(nodes.get(id));
 let poly;
 if(indoor)poly=building.p.slice(0,-1);
 else {
  const r=species==='elephant'?65:species==='giraffe'?45:30;poly=[[-r,-r],[r,-r],[r,r],[-r,r]].map(p=>[p[0]+origin[0],p[1]+origin[1]]);
  // Bound an illustrative exhibit by mapped path/building clearances. Never claim these as surveyed fences.
  for(const w of [...paths,...buildings])for(let i=1;i<w.p.length;i++){const q=closest(origin,w.p[i-1],w.p[i]),dx=q[0]-origin[0],dz=q[1]-origin[1],d=Math.hypot(dx,dz);if(d<1||d>r*3)continue;const margin=w.tags.highway==='service'?5:3;poly=clip(poly,p=>(d-Math.min(margin,d*.3))*d-(p[0]-origin[0])*dx-(p[1]-origin[1])*dz);}
 }
 const {p,clearance}=interior(poly);habitats.push({id,species,count,name,zh,indoor,footprint:poly,x:p[0],z:p[1],radius:clearance,source:indoor?'mapped building footprint; cutaway interior':'illustrative habitat bounded by mapped paths and buildings'});
}
// Route through actual OSM junctions, with a small snap only for coincident survey nodes.
const graph=new Map();for(const w of paths)for(let i=1;i<w.nodes.length;i++){const a=w.nodes[i-1],b=w.nodes[i],d=Math.hypot(...project(nodes.get(a)).map((x,j)=>x-project(nodes.get(b))[j]));for(const [u,v] of [[a,b],[b,a]]){if(!graph.has(u))graph.set(u,[]);graph.get(u).push([v,d]);}}
const ids=[...graph.keys()];for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){const a=project(nodes.get(ids[i])),b=project(nodes.get(ids[j])),d=Math.hypot(a[0]-b[0],a[1]-b[1]);if(d<1.5){graph.get(ids[i]).push([ids[j],d]);graph.get(ids[j]).push([ids[i],d]);}}
function nearest(p){return ids.reduce((a,b)=>{const pa=project(nodes.get(a)),pb=project(nodes.get(b));return Math.hypot(pa[0]-p[0],pa[1]-p[1])<Math.hypot(pb[0]-p[0],pb[1]-p[1])?a:b;});}
function route(a,b){const dist=new Map([[a,0]]),prev=new Map(),open=new Set([a]);while(open.size){let u=[...open].reduce((a,b)=>dist.get(a)<dist.get(b)?a:b);open.delete(u);if(u===b){const out=[b];while(out[0]!==a)out.unshift(prev.get(out[0]));return out.map(i=>project(nodes.get(i)));}for(const [v,d] of graph.get(u)){const alt=dist.get(u)+d;if(alt<(dist.get(v)??Infinity)){dist.set(v,alt);prev.set(v,u);open.add(v);}}}return null;}
const entranceNode=nodes.get(4360375170),entrance={id:entranceNode.id,p:project(entranceNode),name:'Taipei Zoo Entrance',zh:'動物園大門'};
const gondolaWay=ways.find(w=>w.id===71266575),end=gondolaWay.nodes.indexOf(848228319);
const gondola=gondolaWay.nodes.slice(0,end+1).map(id=>{const n=nodes.get(id);const footprint=buildings.find(w=>insidePolygon(project(n),w.p));return {id,p:project(n),buildingId:footprint?.id,footprint:footprint?.p,kind:n.tags?.aerialway||'support',name:n.tags?.['name:en']||n.tags?.ref||'',zh:n.tags?.name||'',station:n.tags?.aerialway==='station',public:n.tags?.['aerialway:access']==='both'};});
const order=['monkey','flamingo','panda','giraffe','zebra','elephant','penguin','red-panda'];const stops=[entrance,...order.map(s=>{const h=habitats.find(h=>h.species===s);return {id:h.id,p:[h.x,h.z],name:h.name,zh:h.zh,species:s};}),{id:848228319,p:gondola.at(-1).p,name:'Zoo South Gondola',zh:'動物園南站'}];
const trail=[];for(let i=1;i<stops.length;i++){const p=route(nearest(stops[i-1].p),nearest(stops[i].p));if(!p)throw Error(`Disconnected visitor route to ${stops[i].name}`);trail.push({from:stops[i-1].id,to:stops[i].id,p});}
let seed=7;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};const xs=boundary.map(p=>p[0]),zs=boundary.map(p=>p[1]),trees=[];
for(let i=0;i<16000&&trees.length<1000;i++){const p=[Math.min(...xs)+rand()*(Math.max(...xs)-Math.min(...xs)),Math.min(...zs)+rand()*(Math.max(...zs)-Math.min(...zs))];if(!insidePolygon(p,boundary)||buildings.some(b=>insidePolygon(p,b.p))||habitats.some(h=>insidePolygon(p,h.footprint)||Math.hypot(h.x-p[0],h.z-p[1])<h.radius+6))continue;if(paths.some(w=>w.p.some((a,i)=>i&&distance(p,w.p[i-1],a)<6)))continue;trees.push([...p,4+rand()*6]);}
await writeFile('public/data/zoo.json',JSON.stringify({source:'OSM paths, entrance, buildings, animal POIs and Maokong gondola alignment; outdoor habitat shapes, animal counts, tower heights and interiors are interpretations',boundary,habitats,trees,entrance,gondola,stops,trail,paths:paths.map(w=>({id:w.id,p:w.p,width:w.tags.highway==='service'?5:3})),zones:zones.map(e=>({id:e.id,name:e.tags.name,p:e.p}))}));
console.log(habitats.map(h=>({species:h.species,radius:h.radius})),trees.length,'trees',trail.length,'connected trail legs',gondola.length,'gondola supports');
