import {readFile,writeFile} from 'node:fs/promises';import {terrainHeight} from '../src/terrain.js';import {insidePolygon} from '../src/landmark-layout.js';
const places=JSON.parse(await readFile('src/social-places.json')),terrain=JSON.parse(await readFile('public/data/terrain.json')),base=JSON.parse(await readFile('assets/map-source.json')),walks=JSON.parse(await readFile('assets/walkways-source.json'));
const project=([lon,lat])=>[(lon-121.54)*100800,(25.05-lat)*111320],output=[];
for(const place of places){
 let extract;try{extract=JSON.parse(await readFile(`assets/places/${place.id}.json`));}catch{extract={elements:[]};}
 const features=new Map(base.elements.map(e=>[e.id,e]));for(const e of [...walks.elements,...extract.elements])if(e.geometry?.length>1)features.set(e.id,{id:e.id,t:e.tags||{},p:e.geometry.map(p=>[p.lon,p.lat])});
 const within=([x,y])=>x>place.bounds[0]&&x<place.bounds[2]&&y>place.bounds[1]&&y<place.bounds[3];
 const buildings=[...features.values()].filter(e=>e.t.building&&e.p.some(within)).map(e=>e.p.map(project));
 const routes=[];for(const e of features.values())if(/^(pedestrian|footway|path)$/.test(e.t.highway)&&e.t.access!=='private'&&e.t.tunnel!=='yes'&&e.t.bridge!=='yes'&&e.p.some(within)){
  let part=[];function flush(){if(part.length>1)routes.push({id:e.id+routes.length*.0001,k:'walk',place:place.id,w:3,p:part});part=[];}
  for(const coord of e.p){if(!within(coord)){flush();continue;}const [x,z]=project(coord);part.push([x,z,terrainHeight(terrain,x,z)]);}flush();
 }
 const props=[];let counter=0;
 for(const route of routes)for(let i=1;i<route.p.length;i++){
  const a=route.p[i-1],b=route.p[i],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);if(length<8)continue;
  for(let d=5;d<length;d+=place.id==='dadaocheng'?17:22){const t=d/length,side=counter++%2?1:-1,x=a[0]+dx*t+dz/length*side*4,z=a[1]+dz*t-dx/length*side*4;if(buildings.some(p=>insidePolygon([x,z],p))||props.some(p=>Math.hypot(p.x-x,p.z-z)<7))continue;
   const kinds=place.id==='ximen'?['table','umbrella','sign','bench','stall']:place.id==='dadaocheng'?['container','table','umbrella','bicycle','bench']:place.id==='huashan'?['stall','table','sculpture','bench','umbrella']:['bench','sign'];
   props.push({kind:kinds[props.length%kinds.length],x,z,y:terrainHeight(terrain,x,z)+.3,angle:Math.atan2(-dz/length*side,dx/length*side),variant:props.length%6});if(props.length>=100)break;
  }if(props.length>=100)break;
 }
 props.splice(100);
 if(place.id==='ximen'&&props.length){const p=props.find(p=>p.kind==='table');if(p)p.kind='performer';}
 const [x,z]=project([place.lon,place.lat]);output.push({...place,x,z,routes,props});console.log(place.id,{routes:routes.length,props:props.length});
}
await writeFile('public/data/places.json',JSON.stringify({source:'© OpenStreetMap contributors; illustrative public-space furnishings',places:output}));
