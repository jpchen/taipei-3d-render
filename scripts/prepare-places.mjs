import {readFile,writeFile} from 'node:fs/promises';import {terrainHeight} from '../src/terrain.js';import {insidePolygon} from '../src/landmark-layout.js';
const shore=JSON.parse(await readFile('assets/places/dadaocheng-shore.json'));
const isWater=p=>shore.outer.some(poly=>insidePolygon(p,poly))&&!shore.holes.some(poly=>insidePolygon(p,poly));
const places=JSON.parse(await readFile('src/social-places.json')),terrain=JSON.parse(await readFile('public/data/terrain.json')),base=JSON.parse(await readFile('assets/map-source.json')),walks=JSON.parse(await readFile('assets/walkways-source.json'));
const project=([lon,lat])=>[(lon-121.54)*100800,(25.05-lat)*111320],output=[];
for(const place of places){
 let extract;try{extract=JSON.parse(await readFile(`assets/places/${place.id}.json`));}catch{extract={elements:[]};}
 const features=new Map(base.elements.map(e=>[e.id,e]));for(const e of [...walks.elements,...extract.elements])if(e.geometry?.length>1)features.set(e.id,{id:e.id,t:e.tags||{},p:e.geometry.map(p=>[p.lon,p.lat])});
 const within=([x,y])=>x>place.bounds[0]&&x<place.bounds[2]&&y>place.bounds[1]&&y<place.bounds[3];
 const buildings=[...features.values()].filter(e=>e.t.building&&e.id!==655884914&&e.p.some(within)).map(e=>e.p.map(project));
 const routes=[];for(const e of features.values())if(/^(pedestrian|footway|path)$/.test(e.t.highway)&&e.t.access!=='private'&&e.t.tunnel!=='yes'&&e.t.bridge!=='yes'&&e.p.some(within)){
  let part=[];function flush(){if(part.length>1)routes.push({id:e.id+routes.length*.0001,k:'walk',place:place.id,w:3,p:part});part=[];}
  for(const coord of e.p){if(!within(coord)){flush();continue;}const [x,z]=project(coord);part.push([x,z,terrainHeight(terrain,x,z)]);}flush();
 }
 const piers=[];
 if(place.id==='dadaocheng')for(const r of routes)for(let i=1;i<r.p.length;i++){const a=r.p[i-1],b=r.p[i],mid=[(a[0]+b[0])/2/100800+121.54,25.05-(a[1]+b[1])/2/111320];if(!isWater(mid))continue;const dx=b[0]-a[0],dz=b[1]-a[1],d=Math.hypot(dx,dz),nx=-dz/d*2.5,nz=dx/d*2.5;piers.push({a,b,height:3.2,p:[[a[0]+nx,a[1]+nz],[b[0]+nx,b[1]+nz],[b[0]-nx,b[1]-nz],[a[0]-nx,a[1]-nz]]});}
 const props=[];let counter=0;
 for(const route of routes)for(let i=1;i<route.p.length;i++){
  const a=route.p[i-1],b=route.p[i],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);if(length<8)continue;
  for(let d=5;d<length;d+=place.id==='dadaocheng'?17:22){const t=d/length,side=counter++%2?1:-1,x=a[0]+dx*t+dz/length*side*4,z=a[1]+dz*t-dx/length*side*4;if(buildings.some(p=>insidePolygon([x,z],p))||props.some(p=>Math.hypot(p.x-x,p.z-z)<7))continue;
   const kinds=place.id==='ximen'?['table','umbrella','sign','bench','stall']:place.id==='dadaocheng'?['container','table','umbrella','bicycle','bench']:place.id==='huashan'?['stall','table','sculpture','bench','umbrella']:['bench','sign'];
   props.push({kind:kinds[props.length%kinds.length],x,z,y:terrainHeight(terrain,x,z)+.3,angle:Math.atan2(-dz/length*side,dx/length*side),variant:props.length%6});if(props.length>=100)break;
  }if(props.length>=100)break;
 }
 if(place.id==='dadaocheng'){
  const foodCourt=features.get(655884914),poly=foodCourt.p.map(project),a=poly[0],b=poly[1],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz),nx=-dz/length,nz=dx/length,angle=Math.atan2(-dz,dx),courtProps=[],path=[];
  for(let d=7;d<length-6;d+=8){for(const [offset,kind] of [[5,'container'],[12,'table'],[8,'light']]){const x=a[0]+dx/length*d+nx*offset,z=a[1]+dz/length*d+nz*offset;if(insidePolygon([x,z],poly))courtProps.push({kind,x,z,y:terrainHeight(terrain,x,z)+.3,angle,variant:0});}const x=a[0]+dx/length*d+nx*9,z=a[1]+dz/length*d+nz*9;if(insidePolygon([x,z],poly))path.push([x,z,terrainHeight(terrain,x,z)]);}
  props.unshift(...courtProps);if(path.length>1)routes.push({id:655884914,k:'walk',place:place.id,w:3,p:path});
 }
 if(place.id==='dadaocheng')for(let i=props.length-1;i>=0;i--)if(isWater([props[i].x/100800+121.54,25.05-props[i].z/111320]))props.splice(i,1);
 props.splice(100);
 const obstacles=place.id==='dadaocheng'?[...buildings,...props.filter(p=>p.kind==='container'||p.kind==='stall').map(p=>{const w=p.kind==='container'?6.5:3.5,d=p.kind==='container'?3:2.5,c=Math.cos(p.angle),s=Math.sin(p.angle);return [[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]].map(([x,z])=>[p.x+c*x+s*z,p.z-s*x+c*z]);})]:[];

 if(place.id==='ximen'&&props.length){const p=props.find(p=>p.kind==='table');if(p)p.kind='performer';}
 const [x,z]=project([place.lon,place.lat]);output.push({...place,x,z,routes,props,obstacles,piers});console.log(place.id,{routes:routes.length,props:props.length});
}
await writeFile('public/data/places.json',JSON.stringify({source:'© OpenStreetMap contributors; illustrative public-space furnishings',places:output}));
