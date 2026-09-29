import {writeFile,mkdir} from 'node:fs/promises';
const areas={ximen:'25.040,121.505,25.046,121.510',dadaocheng:'25.052,121.506,25.060,121.512',huashan:'25.042,121.526,25.047,121.532',zoo:'24.988,121.575,25.003,121.595'};
await mkdir('assets/places',{recursive:true});
for(const [name,bbox] of Object.entries(areas)){
 let saved=false;
 const query=`[out:json][timeout:70];(way[building](${bbox});way[highway](${bbox});way[leisure](${bbox});way[natural](${bbox});way[tourism](${bbox});way[zoo](${bbox});node[tourism](${bbox});node[animal](${bbox});node[name](${bbox}););out geom;`;
 for(const host of ['overpass.kumi.systems','overpass.private.coffee','overpass-api.de'])try{const r=await fetch(`https://${host}/api/interpreter?data=${encodeURIComponent(query)}`,{headers:{'User-Agent':'Taipei3DRender/1.0 (map visualization)'},signal:AbortSignal.timeout(90000)});if(!r.ok)throw Error(r.status);const data=await r.json();if(!data.elements?.length||data.remark)throw Error(data.remark||'Empty');await writeFile(`assets/places/${name}.json`,JSON.stringify(data));console.log(name,data.elements.length);saved=true;break;}catch(e){console.log(name,host,e.message);}
 if(!saved)throw Error(`Could not refresh ${name}; previous snapshot retained`);
}

const zooMap=await fetch('https://api.openstreetmap.org/api/0.6/map.json?bbox=121.577,24.99,121.592,25.003');if(!zooMap.ok)throw Error(`Zoo map: ${zooMap.status}`);await writeFile('assets/places/zoo-osm.json',JSON.stringify(await zooMap.json()));
