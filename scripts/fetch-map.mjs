import { writeFile, mkdir } from 'node:fs/promises';
const bbox = '25.005,121.475,25.105,121.615';
const query = `[out:json][timeout:180];(way[building](${bbox});way[highway~"^(motorway|trunk|primary|secondary|tertiary|residential|unclassified|living_street)$"](${bbox});way[waterway=river](${bbox});way[natural=water](${bbox});way[leisure=park](${bbox}););out geom;`;
for (const endpoint of ['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter']) {
 try {
  console.log('Fetching Taipei from', endpoint);
  const res = await fetch(endpoint,{method:'POST',body:new URLSearchParams({data:query}),signal:AbortSignal.timeout(240000)});
  if (!res.ok) throw Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!data.elements?.length || data.remark) throw Error(data.remark || 'Empty map');
  const items = data.elements.filter(e=>e.geometry?.length>1).map(e=>({id:e.id,t:e.tags,p:e.geometry.filter(p=>p.lon!==undefined).map(p=>[+p.lon.toFixed(6),+p.lat.toFixed(6)])}));
  await mkdir('public/data',{recursive:true});
  await writeFile('public/data/taipei.json',JSON.stringify({source:'© OpenStreetMap contributors, ODbL 1.0',date:data.osm3s.timestamp_osm_base,bbox,elements:items}));
  console.log('Saved',items.length,'features'); process.exit(0);
 } catch(e) { console.error(e.message); }
}
process.exit(1);
