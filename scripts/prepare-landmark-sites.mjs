import {readFile,writeFile} from 'node:fs/promises';
const raw=JSON.parse(await readFile('assets/map-source.json','utf8')).elements;
// Angles measured from the mapped long facade edges; X east, Z south.
const definitions=[['taipei-main-station',23641610,-.19],['national-concert-hall',1052759775,-.495],['national-theater',1052759776,-.495],['cks-memorial',1052759757,-.495],['grand-hotel',25202548,-.397]];
const sites=definitions.map(([name,id,angle])=>{
 const footprint=raw.find(e=>e.id===id).p,c=Math.cos(angle),s=Math.sin(angle);
 const points=footprint.map(([lon,lat])=>{const x=(lon-121.54)*100800,z=(25.05-lat)*111320;return [c*x-s*z,s*x+c*z];});
 const bounds=[0,1].map(i=>[Math.min(...points.map(p=>p[i])),Math.max(...points.map(p=>p[i]))]);
 const u=(bounds[0][0]+bounds[0][1])/2,v=(bounds[1][0]+bounds[1][1])/2;
 return {name,id,angle,lon:121.54+(c*u+s*v)/100800,lat:25.05-(-s*u+c*v)/111320,width:bounds[0][1]-bounds[0][0],depth:bounds[1][1]-bounds[1][0],footprint};
});
await writeFile('src/landmark-sites.json',JSON.stringify(sites,null,2)+'\n');
