import {readFile} from 'node:fs/promises';
export async function extendZoo(raw){
 const places=JSON.parse(await readFile('src/social-places.json'));if(!places.some(p=>p.id==='zoo'))return raw;
 const zoo=JSON.parse(await readFile('assets/places/zoo.json')),ids=new Set(raw.elements.map(e=>e.id));
 for(const e of zoo.elements){if(ids.has(e.id)||!e.geometry?.length||e.geometry.length<2)continue;const t={...e.tags};if(t.highway&&!/^(motorway|trunk|primary|secondary|tertiary|residential|unclassified|living_street|service)$/.test(t.highway))continue;if(t.building&&!t.height&&!t['building:levels'])t['render:height']=t.building==='roof'?3:6;raw.elements.push({id:e.id,t,p:e.geometry.map(p=>[p.lon,p.lat])});}
 return raw;
}
