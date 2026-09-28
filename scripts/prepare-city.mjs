import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { ShapeUtils, Vector2 } from 'three';
import { gzipSync } from 'node:zlib';
const raw=JSON.parse(await readFile('public/data/taipei.json','utf8').catch(()=>readFile('assets/map-source.json','utf8')));
const terrain=JSON.parse(await readFile('public/data/terrain.json','utf8'));
const project=([lon,lat])=>[(lon-121.54)*100800,(25.05-lat)*111320];
const elev=([lon,lat])=>{const {bounds:b,n,heights:h}=terrain;let i=Math.round((lon-b[0])/(b[2]-b[0])*n),j=Math.round((b[3]-lat)/(b[3]-b[1])*n);return Math.max(1,h[Math.min(n,Math.max(0,j))*(n+1)+Math.min(n,Math.max(0,i))]-12);};
let chunks=new Map(),roads=[],parks=[],water=[],count=0,known=0;
for(const e of raw.elements){
 const {t,p,id}=e;if(p.length<2)continue;
 if(!t.building){ const points=p.map(c=>{const [x,z]=project(c);return [+x.toFixed(1),+z.toFixed(1),+elev(c).toFixed(1)]});
 if(t.highway)roads.push({p:points,k:t.highway,bridge:t.bridge==='yes'});
 else if(t.leisure==='park')parks.push(points);
 else if(t.waterway==='river')water.push({p:points,river:true,name:t.name});
 else if(t.natural==='water')water.push({p:points});continue;}
 const center=p.reduce((s,a)=>[s[0]+a[0]/p.length,s[1]+a[1]/p.length],[0,0]);const [cx,cz]=project(center);
 if(Math.hypot(cx-(121.5645-121.54)*100800,cz-(25.05-25.0339)*111320)<85)continue;
 let poly=p.slice(0,-1).map(c=>new Vector2(...project(c)));if(poly.length<3)continue;
 if(ShapeUtils.isClockWise(poly))poly.reverse();
 let area=Math.abs(ShapeUtils.area(poly));if(area<9)continue;
 let rand=((id*16807)%2147483647)/2147483647;
 let height=parseFloat(t.height)||parseFloat(t['building:levels'])*3.3;
 if(height)known++;else height= t.building==='house'?10: t.building==='garage'?4:12+rand*22+(area>600?rand*28:0);
 height=Math.min(300,Math.max(3,height));
 const ground=elev(center),key=`${Math.floor(cx/1200)}_${Math.floor(cz/1200)}`;
 if(!chunks.has(key))chunks.set(key,{pos:[],nor:[],col:[],idx:[],center:[cx,cz]});const g=chunks.get(key);
 const shade=.38+rand*.3;const col=[Math.round(shade*255),Math.round((shade*.94)*255),Math.round((shade*.85)*255)];
 if(height>65){col[0]*=.65;col[1]*=.83;col[2]*=.94;}
 function v(x,y,z,nx,ny,nz){g.pos.push(x,y,z);g.nor.push(nx*127,ny*127,nz*127);g.col.push(...col);return g.pos.length/3-1;}
 const roofStart=g.pos.length/3;for(let a of poly)v(a.x,ground+height,a.y,0,1,0);
 for(let tri of ShapeUtils.triangulateShape(poly,[]))g.idx.push(roofStart+tri[2],roofStart+tri[1],roofStart+tri[0]);
 for(let j=0;j<poly.length;j++){
  const a=poly[j],b=poly[(j+1)%poly.length],dx=b.x-a.x,dz=b.y-a.y,len=Math.hypot(dx,dz);if(len<.01)continue;
  const k=v(a.x,ground,a.y,dz/len,0,-dx/len);v(b.x,ground,b.y,dz/len,0,-dx/len);v(b.x,ground+height,b.y,dz/len,0,-dx/len);v(a.x,ground+height,a.y,dz/len,0,-dx/len);
  g.idx.push(k,k+2,k+1,k,k+3,k+2);
 }
 count++;
}
await mkdir('public/data/buildings',{recursive:true});let manifest=[];
for(const [key,g] of chunks){
 const pos=new Float32Array(g.pos),nor=new Int8Array(g.nor),col=new Uint8Array(g.col),idx=new Uint32Array(g.idx);
 const offset=Math.ceil((pos.byteLength+nor.byteLength+col.byteLength)/4)*4;
 const buf=Buffer.alloc(offset+idx.byteLength);Buffer.from(pos.buffer).copy(buf);Buffer.from(nor.buffer).copy(buf,pos.byteLength);Buffer.from(col.buffer).copy(buf,pos.byteLength+nor.byteLength);Buffer.from(idx.buffer).copy(buf,offset);
 await writeFile(`public/data/buildings/${key}.city`,gzipSync(buf,{level:9}));manifest.push({key,vertices:pos.length/3,indices:idx.length,indexOffset:offset,center:g.center,bytes:buf.length});
}
await writeFile('public/data/city.json',JSON.stringify({buildings:manifest,roads,parks,water,count,known,date:raw.date}));
await rename('public/data/taipei.json','assets/map-source.json').catch(()=>{});
console.log({buildings:count,knownHeights:known,chunks:manifest.length,megabytes:manifest.reduce((n,m)=>n+m.bytes,0)/1e6,roads:roads.length});
