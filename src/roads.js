import {terrainHeight} from './terrain.js';
export const ROAD_WIDTHS={motorway:22,trunk:20,primary:21,secondary:16,tertiary:12,residential:7,unclassified:6,living_street:5};
const key=p=>`${p[0].toFixed(6)},${p[1].toFixed(6)}`;
export function buildRoadNetwork(elements,terrain){
 const source=elements.filter(e=>e.t.highway&&!['yes','culvert'].includes(e.t.tunnel)&&!(Number(e.t.layer)<0));
 const roads=source.map(e=>{const layer=Math.max(0,Number(e.t.layer)||0),bridge=!!e.t.bridge&&e.t.bridge!=='no'||layer>0;
 return {id:e.id,k:e.t.highway,name:e.t['name:en']||e.t.name||'',bridge,layer,oneway:e.t.oneway==='yes'?1:e.t.oneway==='-1'?-1:0,w:ROAD_WIDTHS[e.t.highway]||8,private:e.t.access==='private',keys:e.p.map(key),p:e.p.map(([lon,lat])=>{const x=(lon-121.54)*100800,z=(25.05-lat)*111320;return[x,z,terrainHeight(terrain,x,z)];})};});
 const connections=new Map();for(const r of roads)if(r.bridge){const d=[0];for(let i=1;i<r.p.length;i++)d.push(d.at(-1)+Math.hypot(r.p[i][0]-r.p[i-1][0],r.p[i][1]-r.p[i-1][1]));for(let i=0;i<r.p.length;i++){const grade=r.p[0][2]+(r.p.at(-1)[2]-r.p[0][2])*d[i]/(d.at(-1)||1),height=Math.max(grade+8+Math.max(1,r.layer)*4,r.p[i][2]+6);connections.set(r.keys[i],Math.max(connections.get(r.keys[i])||0,height));}}
 for(const r of roads){
  const distances=[0];for(let i=1;i<r.p.length;i++)distances.push(distances.at(-1)+Math.hypot(r.p[i][0]-r.p[i-1][0],r.p[i][1]-r.p[i-1][1]));
  const joins=r.keys.map((k,i)=>({d:distances[i],lift:connections.has(k)?Math.max(0,connections.get(k)-r.p[i][2]):0})).filter(j=>j.lift>0);
  r.profile=r.bridge||joins.length>0;r.ramp=!r.bridge&&r.profile;
  if(r.profile){const sampled=[];for(let i=1;i<r.p.length;i++){const a=r.p[i-1],b=r.p[i],length=distances[i]-distances[i-1],steps=Math.max(1,Math.ceil(length/12));for(let j=0;j<steps;j++){
    const t=j/steps,d=distances[i-1]+length*t,x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t;
    let lift=r.bridge?connections.get(r.keys[i-1])+(connections.get(r.keys[i])-connections.get(r.keys[i-1]))*t-terrainHeight(terrain,x,z):0;
    if(!r.bridge)for(const join of joins){const fraction=Math.max(0,1-Math.abs(d-join.d)/Math.max(80,join.lift*12));lift=Math.max(lift,join.lift*fraction*fraction*(3-2*fraction));}
    sampled.push([x,z,terrainHeight(terrain,x,z)+lift]);
   }}const last=r.p.at(-1),lastLift=r.bridge?connections.get(r.keys.at(-1))-last[2]:Math.max(0,...joins.map(join=>{const f=Math.max(0,1-Math.abs(distances.at(-1)-join.d)/Math.max(80,join.lift*12));return join.lift*f*f*(3-2*f);}));sampled.push([last[0],last[1],last[2]+lastLift]);r.p=sampled;}
  delete r.keys;r.p=r.p.map(p=>[...p,terrainHeight(terrain,p[0],p[1])].map(n=>+n.toFixed(3)));
 }
 return roads;
}
