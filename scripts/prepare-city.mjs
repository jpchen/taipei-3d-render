import {extendZoo} from './map-data.mjs';
import { readFile, writeFile, mkdir, rename, readdir, unlink } from 'node:fs/promises';
import { ShapeUtils, Vector2, Color } from 'three';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import {buildRoadNetwork} from '../src/roads.js';
import {replacedByLandmark,stationAncillaryHeight,insidePolygon} from '../src/landmark-layout.js';
import {terrainHeight} from '../src/terrain.js';

const raw=JSON.parse(await readFile('public/data/taipei.json','utf8').catch(()=>readFile('assets/map-source.json','utf8')));
await extendZoo(raw);
const terrain=JSON.parse(await readFile('public/data/terrain.json','utf8'));
const project=([lon,lat])=>[(lon-121.54)*100800,(25.05-lat)*111320];
const elev=point=>{const [x,z]=project(point);return terrainHeight(terrain,x,z);};
const random=n=>{const x=Math.sin(n*12.9898+78.233)*43758.5453;return x-Math.floor(x);};
const palettes=[
 ['#d6c6a4','#c5a89d','#aec2ae','#e0cbae','#bea58a','#b8c8c2','#d9bb98','#c9ceca','#9eaaa5'], // plaster and painted concrete
 ['#60979c','#7297b1','#528d91','#8daba8','#497b8a','#819db2'], // glass curtain walls
 ['#d6c2ac','#c99f8d','#c0c9bb','#e3d5bb','#b9afa3','#c4b298','#bbc5c7','#9fa9a1'], // ceramic-tile apartments
 ['#a86049','#ae7159','#bd8062','#916952'], // brick / heritage
 ['#97a9a2','#a8b3bc','#bbbdad','#839fa4'], // industrial
 ['#decaa0','#c19a77','#e1c8a4','#d3b992'], // traditional / civic
];
const roofPalette=['#89998d','#9ea696','#9d8f83','#638981','#647f8b','#b39983'];
function styleFor(t,height,seed){
 const material=t['building:material']||'';
 if(/temple|shrine|church/.test(t.building)||t.religion)return 5;
 if(material==='brick'||(t.historic&&height<45))return 3;
 if(/warehouse|industrial|hangar|shed/.test(t.building))return 4;
 if(material==='glass'||(height>65&&seed>.15)||(/office|commercial/.test(t.building)&&height>30&&seed>.3))return 1;
 return /apartments|residential/.test(t.building)||seed>.43?2:0;
}
function colorValue(value,fallback){return /^#[0-9a-f]{3,6}$/i.test(value||'')||Object.hasOwn(Color.NAMES,value||'')?value:fallback;}
function encodedColor(value){const c=new Color(value);return [c.r,c.g,c.b].map(x=>Math.round(x*255));}
function pointInside(x,y,poly){let result=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)result=!result;}return result;}
function edgeDistance(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);}
let chunks=new Map(),roads=buildRoadNetwork(raw.elements,terrain),parks=[],water=[],architecture=[],count=0,known=0,styleCounts=Array(6).fill(0);
for(const {t,p,id} of raw.elements){
 if(p.length<2)continue;
 if(!t.building){const points=p.map(c=>{const [x,z]=project(c);return [+x.toFixed(1),+z.toFixed(1),+elev(c).toFixed(1)];});
  if(t.highway)continue;
  else if(t.leisure==='park')parks.push(points);
  else if(t.waterway==='river')water.push({p:points,river:true,name:t.name});
  else if(t.natural==='water')water.push({p:points});continue;
 }
 if(t.location==='underground'||(Number(t.layer)<0&&!t.height)||[189788192,442195153,533223270,222080307,655884914].includes(id)||replacedByLandmark(id,p))continue;
 const center=p.reduce((s,a)=>[s[0]+a[0]/p.length,s[1]+a[1]/p.length],[0,0]),[cx,cz]=project(center);
 if(Math.hypot(cx-(121.5645-121.54)*100800,cz-(25.05-25.0339)*111320)<85)continue;
 let poly=p.slice(0,-1).map(c=>new Vector2(...project(c)));if(poly.length<3)continue;if(ShapeUtils.isClockWise(poly))poly.reverse();
 const area=Math.abs(ShapeUtils.area(poly));if(area<9)continue;
 const seed=random(id),heightSeed=((id*16807)%2147483647)/2147483647;
 let height=parseFloat(t.height)||parseFloat(t['building:levels'])*3.3;
 if(height)known++;else height=t['render:height']??({197752239:27,197752243:7,197752247:7,197752249:9,198342346:6}[id]??stationAncillaryHeight(t,center))??(t.building==='house'?10:t.building==='garage'?4:12+heightSeed*22+(area>600?heightSeed*28:0));
 height=Math.min(300,Math.max(3,height));
 const style=styleFor(t,height,seed),palette=palettes[style];styleCounts[style]++;
 const wallColor=encodedColor(colorValue(t['building:colour'],palette[Math.floor(random(id+9)*palette.length)]));
 const roofColor=encodedColor(colorValue(t['roof:colour'],style===3||style===5?'#ad6145':roofPalette[Math.floor(random(id+8)*roofPalette.length)]));
 const canopy=t.building==='roof'&&stationAncillaryHeight(t,center)!==null;
 const ground=elev(center)+(canopy?height-.3:0);if(canopy)height=.3;
 const key=`${Math.floor(cx/1200)}_${Math.floor(cz/1200)}`;
 if(!chunks.has(key))chunks.set(key,{pos:[],nor:[],col:[],style:[],uv:[],idx:[],center:[cx,cz]});const g=chunks.get(key);
 const pitched=poly.length===4&&(/gabled|hipped|pyramidal/.test(t['roof:shape']||'')||style===5&&height<40);
 const roofRise=pitched?Math.min(height*.25,parseFloat(t['roof:height'])||4):0,wallHeight=height-roofRise;
 function v(x,y,z,nx,ny,nz,u,vv,roof=false){g.pos.push(x,y,z);g.nor.push(nx*127,ny*127,nz*127);g.col.push(...(roof?roofColor:wallColor));g.style.push(style,Math.floor(seed*255));g.uv.push(u,vv);return g.pos.length/3-1;}
 if(pitched){
  const apex=poly.reduce((s,p)=>s.addScaledVector(p,1/poly.length),new Vector2());
  for(let j=0;j<poly.length;j++){
   const a=poly[j],b=poly[(j+1)%poly.length],dx=b.x-a.x,dz=b.y-a.y;const nx=roofRise*dz,ny=(b.y-a.y)*(apex.x-a.x)-(b.x-a.x)*(apex.y-a.y),nz=-roofRise*dx,len=Math.hypot(nx,ny,nz)||1;
   // Each triangular face gets its own normal for a sharp roof ridge.
   const k=v(a.x,ground+wallHeight,a.y,nx/len,Math.abs(ny)/len,nz/len,0,0,true);v(apex.x,ground+height,apex.y,nx/len,Math.abs(ny)/len,nz/len,.5,1,true);v(b.x,ground+wallHeight,b.y,nx/len,Math.abs(ny)/len,nz/len,1,0,true);g.idx.push(k,k+1,k+2);
  }
 }else{
  const start=g.pos.length/3;for(const a of poly)v(a.x,ground+height,a.y,0,1,0,a.x,a.y,true);
  for(const tri of ShapeUtils.triangulateShape(poly,[]))g.idx.push(start+tri[2],start+tri[1],start+tri[0]);
 }
 let longest={length:0};const walls=[];
 for(let j=0;j<poly.length;j++){
  const a=poly[j],b=poly[(j+1)%poly.length],dx=b.x-a.x,dz=b.y-a.y,len=Math.hypot(dx,dz);if(len<.01)continue;
  const columns=Math.max(1,Math.round(len/(2.7+seed*1.5))),floors=Math.max(1,Math.round(wallHeight/(3.05+seed*.55)));
  const k=v(a.x,ground,a.y,dz/len,0,-dx/len,0,0);v(b.x,ground,b.y,dz/len,0,-dx/len,columns,0);v(b.x,ground+wallHeight,b.y,dz/len,0,-dx/len,columns,floors);v(a.x,ground+wallHeight,a.y,dz/len,0,-dx/len,0,floors);g.idx.push(k,k+2,k+1,k,k+3,k+2);
  if(len>4)walls.push([(a.x+b.x)/2,(a.y+b.y)/2,Math.atan2(dz/len,-dx/len),len,columns,floors]);
  if(len>longest.length)longest={length:len,x:(a.x+b.x)/2,z:(a.y+b.y)/2,angle:Math.atan2(dz/len,-dx/len)};
 }
 if(!pitched&&area>45&&height>6){
  let point=new Vector2(cx,cz);
  if(!pointInside(cx,cz,poly)){const tri=ShapeUtils.triangulateShape(poly,[])[0];if(tri)point=tri.reduce((s,i)=>s.addScaledVector(poly[i],1/3),new Vector2());}
  const radius=Math.min(...poly.map((a,i)=>edgeDistance(point,a,poly[(i+1)%poly.length])));
  if(radius>1.6)architecture.push([point.x,ground+height,point.y,Math.min(radius,25),style,seed,longest.x,ground,longest.z,longest.angle,Math.min(longest.length,80),height].map(n=>+n.toFixed(2)).concat([walls.map(w=>w.map(n=>+n.toFixed(3)))]));
 }
 count++;
}
const shore=JSON.parse(await readFile('assets/places/dadaocheng-shore.json','utf8'));for(const outer of shore.outer)water.push({p:outer.map(c=>[...project(c),2]),holes:shore.holes.filter(h=>insidePolygon(h[0],outer)).map(h=>h.map(c=>[...project(c),2]))});
await mkdir('public/data/buildings',{recursive:true});const manifest=[],newFiles=new Set();
for(const [key,g] of chunks){
 const pos=new Float32Array(g.pos),nor=new Int8Array(g.nor),col=new Uint8Array(g.col),style=new Uint8Array(g.style),uv=new Float32Array(g.uv),idx=new Uint32Array(g.idx);
 const vertices=pos.length/3,styleOffset=vertices*18,uvOffset=vertices*20,indexOffset=vertices*28,buf=Buffer.alloc(indexOffset+idx.byteLength);
 Buffer.from(pos.buffer).copy(buf);Buffer.from(nor.buffer).copy(buf,pos.byteLength);Buffer.from(col.buffer).copy(buf,vertices*15);Buffer.from(style.buffer).copy(buf,styleOffset);Buffer.from(uv.buffer).copy(buf,uvOffset);Buffer.from(idx.buffer).copy(buf,indexOffset);
 const version=createHash('sha256').update(buf).digest('hex').slice(0,8),file=`${key}.${version}.city`;
 await writeFile(`public/data/buildings/${file}`,gzipSync(buf,{level:9}));newFiles.add(file);manifest.push({key,file,vertices,indices:idx.length,indexOffset,styleOffset,uvOffset,center:g.center,bytes:buf.length});
}
// Content-addressed tiles prevent old cached geometry from being decoded with a new layout.
for(const file of await readdir('public/data/buildings'))if(file.endsWith('.city')&&!newFiles.has(file))await unlink(`public/data/buildings/${file}`);
await writeFile('public/data/city.json',JSON.stringify({format:2,buildings:manifest,roads,parks,water,count,known,styleCounts,date:raw.date}));
await writeFile('public/data/architecture.json',JSON.stringify({source:'OSM footprints; procedural architectural detail',buildings:architecture}));
await rename('public/data/taipei.json','assets/map-source.json').catch(()=>{});
console.log({buildings:count,knownHeights:known,styleCounts,roofDetails:architecture.length,chunks:manifest.length,megabytes:manifest.reduce((n,m)=>n+m.bytes,0)/1e6});
