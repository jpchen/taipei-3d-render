import {readFile,writeFile} from 'node:fs/promises';
import {terrainHeight} from '../src/terrain.js';
const raw=JSON.parse(await readFile('assets/map-source.json')),terrain=JSON.parse(await readFile('public/data/terrain.json'));
const project=([lon,lat])=>[(lon-121.54)*100800,(25.05-lat)*111320];
const bounds=[121.5237,25.0874,121.5260,25.0896],within=(lon,lat)=>lon>bounds[0]&&lon<bounds[2]&&lat>bounds[1]&&lat<bounds[3];
const roads=raw.elements.filter(e=>e.t.highway&&/大東路|大南路/.test(e.t.name||''));
const routes=[],stalls=[],buildings=raw.elements.filter(e=>e.t.building&&e.p.some(p=>within(...p))).map(e=>e.p.map(project));
function inside(x,z,p){let yes=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
for(const e of roads){let points=[];function flush(){if(points.length>2)routes.push({id:e.id+routes.length*.01,k:'walk',market:true,w:3.5,p:points});points=[];}
 for(let i=1;i<e.p.length;i++){const a=e.p[i-1],b=e.p[i],pa=project(a),pb=project(b),distance=Math.hypot(pb[0]-pa[0],pb[1]-pa[1]),n=Math.ceil(distance/3);for(let j=0;j<n;j++){const f=j/n,lon=a[0]+(b[0]-a[0])*f,lat=a[1]+(b[1]-a[1])*f;if(!within(lon,lat)){flush();continue;}const [x,z]=project([lon,lat]);points.push([x,z,terrainHeight(terrain,x,z)]);}}flush();
}
for(const r of routes)for(let i=2;i<r.p.length-2;i+=4){const a=r.p[i],b=r.p[i+1],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);if(!length)continue;
 for(const side of [-1,1]){const nx=dz/length*side,nz=-dx/length*side,x=a[0]+nx*3.8,z=a[1]+nz*3.8;if(buildings.some(p=>inside(x,z,p)||inside(x+nx,z+nz,p)))continue;stalls.push({x,z,y:terrainHeight(terrain,x,z)+.32,angle:Math.atan2(-nx,-nz),variant:stalls.length%6});}
}
const [x0,z1]=project([bounds[0],bounds[1]]),[x1,z0]=project([bounds[2],bounds[3]]);
await writeFile('public/data/market.json',JSON.stringify({name:'Shilin Night Market',source:'OSM Dadong and Danan road geometry; illustrative stalls, not a vendor inventory',bounds:[x0,z0,x1,z1],roadIds:roads.filter(e=>e.p.some(p=>within(...p))).map(e=>e.id),routes,stalls}));console.log({marketRoutes:routes.length,stalls:stalls.length});
