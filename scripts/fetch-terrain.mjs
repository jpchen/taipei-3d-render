import { PNG } from 'pngjs';
import { writeFile } from 'node:fs/promises';
const n=384,bounds=[121.34,24.93,121.74,25.25],zoom=11,tiles=new Map();
const tile=(lon,lat)=>[(lon+180)/360*2**zoom,(1-Math.asinh(Math.tan(lat*Math.PI/180))/Math.PI)/2*2**zoom];
let [x0,y1]=tile(bounds[0],bounds[1]),[x1,y0]=tile(bounds[2],bounds[3]);
for(let x=Math.floor(x0);x<=Math.floor(x1);x++)for(let y=Math.floor(y0);y<=Math.floor(y1);y++){
 const r=await fetch(`https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${zoom}/${x}/${y}.png`);if(!r.ok)throw Error(r.status);tiles.set(`${x},${y}`,PNG.sync.read(Buffer.from(await r.arrayBuffer())));
}
const heights=[];
for(let j=0;j<=n;j++)for(let i=0;i<=n;i++){
 const lon=bounds[0]+i/n*(bounds[2]-bounds[0]),lat=bounds[3]-j/n*(bounds[3]-bounds[1]);
 const [x,y]=tile(lon,lat),p=tiles.get(`${Math.floor(x)},${Math.floor(y)}`);const idx=(Math.floor(y%1*256)*256+Math.floor(x%1*256))*4;
 heights.push(Math.max(0,Math.round(p.data[idx]*256+p.data[idx+1]+p.data[idx+2]/256-32768)));
}
await writeFile('public/data/terrain.json',JSON.stringify({n,bounds,heights,source:'Mapzen Terrain Tiles / AWS Open Data, SRTM'}));
console.log('Saved terrain',heights.length,'samples');
