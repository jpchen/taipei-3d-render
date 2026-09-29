// CPU geometry preview for environments where a WebGL browser cannot start.
import * as THREE from 'three';import {PNG} from 'pngjs';import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {addCityLandmarks,addMemorial,project} from '../src/world.js';import {terrainHeight} from '../src/terrain.js';
const terrain=JSON.parse(readFileSync('public/data/terrain.json')),raw=JSON.parse(readFileSync('assets/map-source.json')).elements;
const NativeRequest=globalThis.Request;globalThis.Request=class extends NativeRequest{constructor(url,init){super(new URL(url,'http://local.test'),init);}};globalThis.ProgressEvent=class{constructor(type,p){Object.assign(this,p);}};globalThis.fetch=async r=>new Response(readFileSync('public'+new URL(r.url||r).pathname));
const scene=new THREE.Scene();addMemorial(scene,terrain);await addCityLandmarks(scene,terrain);scene.updateMatrixWorld(true);
mkdirSync('test-results',{recursive:true});
for(const [name,lon,lat,span,offset] of [['liberty-layout',121.5198,25.0358,650,[0,900,1]],['station-layout',121.51712,25.04772,400,[0,800,1]],['hotel-stairs',121.5261,25.0782,260,[-180,180,320]]]){
 const w=1100,h=900,png=new PNG({width:w,height:h}),depth=new Float64Array(w*h).fill(Infinity),target=project(lon,lat);target.y=terrainHeight(terrain,target.x,target.z);const camera=new THREE.OrthographicCamera(-span/2,span/2,span*h/w/2,-span*h/w/2,.1,3000);camera.position.copy(target).add(new THREE.Vector3(...offset));camera.lookAt(target);camera.updateMatrixWorld();
 for(let i=0;i<w*h;i++){png.data.set([50,59,56,255],i*4);}
 const screen=v=>{const p=v.clone().project(camera);return [(p.x+1)*w/2,(1-p.y)*h/2,p.z];};
 function tri(points,color){const [a,b,c]=points,area=(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);if(Math.abs(area)<.001)return;const minX=Math.max(0,Math.floor(Math.min(a[0],b[0],c[0]))),maxX=Math.min(w-1,Math.ceil(Math.max(a[0],b[0],c[0]))),minY=Math.max(0,Math.floor(Math.min(a[1],b[1],c[1]))),maxY=Math.min(h-1,Math.ceil(Math.max(a[1],b[1],c[1])));
  for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){const u=((b[0]-x)*(c[1]-y)-(b[1]-y)*(c[0]-x))/area,v=((c[0]-x)*(a[1]-y)-(c[1]-y)*(a[0]-x))/area,t=1-u-v;if(Math.min(u,v,t)<0)continue;const z=u*a[2]+v*b[2]+t*c[2],i=y*w+x;if(z<depth[i]){depth[i]=z;png.data.set([...color,255],i*4);}}
 }
 function line(a,b,color,width=1){const n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1]));for(let i=0;i<=n;i++){const x=Math.round(a[0]+(b[0]-a[0])*i/(n||1)),y=Math.round(a[1]+(b[1]-a[1])*i/(n||1));for(let j=-width;j<=width;j++)if(x>=0&&x<w&&y+j>=0&&y+j<h)png.data.set([...color,255],((y+j)*w+x)*4);}}
 // Outlines are the original OSM data, kept visible as a placement reference.
 for(const e of raw){if(!e.t.building&&!e.t.highway)continue;const center=e.p[0];if(Math.abs(center[0]-lon)*100800>span||Math.abs(center[1]-lat)*111320>span)continue;const p=e.p.map(([lon,lat])=>{const v=project(lon,lat);v.y=terrainHeight(terrain,v.x,v.z);return screen(v);});for(let i=1;i<p.length;i++)line(p[i-1],p[i],e.t.highway?[110,120,112]:[90,140,130]);}
 scene.traverse(o=>{if(!o.isMesh)return;const g=o.geometry,p=g.attributes.position,index=g.index,base=o.material.color||new THREE.Color('#ccc');for(let i=0;i<(index?index.count:p.count);i+=3){const vertices=[0,1,2].map(j=>new THREE.Vector3().fromBufferAttribute(p,index?index.getX(i+j):i+j).applyMatrix4(o.matrixWorld));if(vertices.every(v=>Math.abs(v.x-target.x)>span||Math.abs(v.z-target.z)>span))continue;const normal=new THREE.Vector3().crossVectors(vertices[1].clone().sub(vertices[0]),vertices[2].clone().sub(vertices[0])).normalize(),light=.58+.42*Math.max(0,normal.dot(new THREE.Vector3(-.3,1,.5).normalize())),color=base.clone().multiplyScalar(light).convertLinearToSRGB();tri(vertices.map(screen),[color.r,color.g,color.b].map(v=>Math.round(v*255)));}});
 writeFileSync(`test-results/${name}.png`,PNG.sync.write(png));console.log(`test-results/${name}.png`);
}
