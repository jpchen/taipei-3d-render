import {readFile,writeFile} from 'node:fs/promises';
import {ROAD_WIDTHS} from '../src/roads.js';
import {terrainHeight} from '../src/terrain.js';
const {elements}=JSON.parse(await readFile('assets/map-source.json')),terrain=JSON.parse(await readFile('public/data/terrain.json'));
const nodes=new Map(),major=new Set(['primary','secondary','tertiary']);
for(const e of elements){const t=e.t;if(!['primary','secondary','tertiary','residential','unclassified','living_street'].includes(t.highway)||t.bridge&&t.bridge!=='no'||Number(t.layer)||t.tunnel==='yes'||t.access==='private')continue;
 for(let i=0;i<e.p.length;i++){const p=e.p[i],key=p.join(',');if(!nodes.has(key))nodes.set(key,{p,branches:[],major:false});const node=nodes.get(key);node.major||=major.has(t.highway);
  for(const j of [i-1,i+1]){if(!e.p[j])continue;const q=e.p[j],dx=(q[0]-p[0])*100800,dz=(p[1]-q[1])*111320,length=Math.hypot(dx,dz);if(length<.5)continue;const ux=dx/length,uz=dz/length;if(node.branches.some(b=>b.ux*ux+b.uz*uz>.94))continue;node.branches.push({ux,uz,w:ROAD_WIDTHS[t.highway]||8,id:e.id});}
 }
}
const signals=[],junctions=[];
for(const node of nodes.values()){if(!node.major||node.branches.length<3)continue;const [lon,lat]=node.p,x=(lon-121.54)*100800,z=(25.05-lat)*111320;
 // The pedestrianized market lanes do not get vehicle signals.
 if(lon>121.5237&&lon<121.526&&lat>25.0874&&lat<25.0896)continue;
 const junction=junctions.length,seed=((Math.floor(x/100)*31+Math.floor(z/100)*17)%72+72)%72;const width=Math.max(...node.branches.map(b=>b.w));junctions.push({x,z});
 for(const b of node.branches){const rightX=-b.uz,rightZ=b.ux,side=b.w/2+1.2,back=width/2+3,px=x+b.ux*back+rightX*side,pz=z+b.uz*back+rightZ*side;signals.push({x:px,z:pz,y:terrainHeight(terrain,px,pz)+.2,angle:Math.atan2(b.ux,b.uz),arm:Math.min(7,b.w*.4),axis:Math.abs(b.uz)>Math.abs(b.ux)?0:1,phase:seed,junction});}
}
await writeFile('public/data/signals.json',JSON.stringify({source:'Illustrative signal placement inferred from OSM surface-road junctions, not an inventory of real signal hardware or timings',junctions,signals}));console.log({junctions:junctions.length,signalApproaches:signals.length});
