import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
export const project=(lon,lat)=>new THREE.Vector3((lon-121.54)*100800,0,(25.05-lat)*111320);
export function terrainHeight(data,x,z){const {bounds:b,n,heights:h}=data;const lon=x/100800+121.54,lat=25.05-z/111320;const fx=THREE.MathUtils.clamp((lon-b[0])/(b[2]-b[0])*n,0,n-.001),fz=THREE.MathUtils.clamp((b[3]-lat)/(b[3]-b[1])*n,0,n-.001),i=Math.floor(fx),j=Math.floor(fz),u=fx-i,v=fz-j;const a=h[j*(n+1)+i],c=h[(j+1)*(n+1)+i];return Math.max(1,THREE.MathUtils.lerp(THREE.MathUtils.lerp(a,h[j*(n+1)+i+1],u),THREE.MathUtils.lerp(c,h[(j+1)*(n+1)+i+1],u),v)-12);}
export function makeTerrain(scene,data){
 const {n,bounds:b}=data;const a=project(b[0],b[3]),d=project(b[2],b[1]);const g=new THREE.PlaneGeometry(d.x-a.x,d.z-a.z,n,n);g.rotateX(-Math.PI/2);g.translate((a.x+d.x)/2,0,(a.z+d.z)/2);
 const pos=g.attributes.position,col=[];const low=new THREE.Color('#706e5c'),high=new THREE.Color('#314e38');
 for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i),h=terrainHeight(data,x,z);pos.setY(i,h);const f=THREE.MathUtils.smoothstep(h,15,100),c=low.clone().lerp(high,f);c.multiplyScalar(.9+.1*Math.sin(x*.037)*Math.sin(z*.027));col.push(c.r,c.g,c.b);}
 g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.computeVertexNormals();const mesh=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1}));mesh.receiveShadow=true;scene.add(mesh);
}
export async function loadBuildings(scene,manifest,material,progress){
 let done=0;const queue=[...manifest].sort((a,b)=>Math.hypot(a.center[0]-2400,a.center[1]-1800)-Math.hypot(b.center[0]-2400,b.center[1]-1800));
 await Promise.all(Array.from({length:6},async()=>{while(queue.length){const m=queue.shift();const r=await fetch(`/data/buildings/${m.file||m.key+".city"}`);if(!r.ok)throw Error('Building tile unavailable');const b=await new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer(),v=m.vertices;
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(b,0,v*3),3));g.setAttribute('normal',new THREE.BufferAttribute(new Int8Array(b,v*12,v*3),3,true));g.setAttribute('color',new THREE.BufferAttribute(new Uint8Array(b,v*15,v*3),3,true));g.setAttribute('facadeStyle',new THREE.BufferAttribute(new Uint8Array(b,m.styleOffset,v*2),2));g.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(b,m.uvOffset,v*2),2));g.setIndex(new THREE.BufferAttribute(new Uint32Array(b,m.indexOffset,m.indices),1));g.computeBoundingSphere();
 const mesh=new THREE.Mesh(g,material);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);progress(++done/manifest.length);await new Promise(resolve=>setTimeout(resolve,0));}}));
}
const widths={motorway:22,trunk:20,primary:21,secondary:16,tertiary:12,residential:7,unclassified:6,living_street:5};
function ribbon(points,width,yOffset=0,terrain=null,bridge=false){
 const samples=[];let length=0;
 for(let i=0;i<points.length-1;i++){const a=points[i],b=points[i+1],distance=Math.hypot(b[0]-a[0],b[1]-a[1]),steps=terrain?Math.max(1,Math.ceil(distance/10)):1;for(let j=0;j<steps;j++){const f=j/steps;samples.push([THREE.MathUtils.lerp(a[0],b[0],f),THREE.MathUtils.lerp(a[1],b[1],f),THREE.MathUtils.lerp(a[2],b[2],f),length+distance*f]);}length+=distance;}
 samples.push([...points.at(-1),length]);const p=[],uv=[],idx=[];
 for(let i=0;i<samples.length;i++){const a=samples[Math.max(0,i-1)],b=samples[Math.min(samples.length-1,i+1)],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz)||1,c=samples[i],nx=-dz/len*width/2,nz=dx/len*width/2;
 for(const side of [1,-1]){const x=c[0]+nx*side,z=c[1]+nz*side,y=terrain&&!bridge?terrainHeight(terrain,x,z):c[2];p.push(x,y+yOffset,z);}uv.push(0,c[3]/9,1,c[3]/9);if(i)idx.push(i*2-2,i*2,i*2-1,i*2-1,i*2,i*2+1);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
}
function polygon(points,yOffset=0){let contour=points.map(p=>new THREE.Vector2(p[0],p[1]));if(contour.length<3)return null;let triangles=THREE.ShapeUtils.triangulateShape(contour,[]);const pos=points.flatMap(p=>[p[0],p[2]+yOffset,p[1]]),g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(triangles.flatMap(t=>[t[2],t[1],t[0]]));g.computeVertexNormals();return g;}
function addMerged(scene,geos,mat){if(!geos.length)return;if(geos.some(g=>!g.attributes.uv))geos.forEach(g=>g.deleteAttribute('uv'));const g=mergeGeometries(geos);geos.forEach(g=>g.dispose());const mesh=new THREE.Mesh(g,mat);mesh.receiveShadow=true;scene.add(mesh);return mesh;}
export function makeStreets(scene,data,terrain){
 const roads=[],lines=[],bridges=[],sidewalks=[],parkGeo=[],waters=[],traffic=[];
 for(const road of data.roads){if(road.p.length<2)continue;const w=widths[road.k]||8;const offset=road.bridge?10:.24;const g=ribbon(road.p,w,offset,terrain,road.bridge);if(!road.bridge)sidewalks.push(ribbon(road.p,w+4,.13,terrain));(road.bridge?bridges:roads).push(g);
 if(w>=12){lines.push(ribbon(road.p,.25,offset+.06,terrain,road.bridge));if(road.p.length>2)traffic.push(road);}}
 addMerged(scene,sidewalks,new THREE.MeshStandardMaterial({color:'#b8ad92',roughness:1,side:THREE.DoubleSide}));
 const asphalt=new THREE.MeshStandardMaterial({color:'#454c49',roughness:.96,side:THREE.DoubleSide});addMerged(scene,roads,asphalt);addMerged(scene,bridges,asphalt);
 const stripe=new Uint8Array(4*64);for(let i=0;i<64;i++)stripe.set([255,255,255,i<32?255:0],i*4);const texture=new THREE.DataTexture(stripe,1,64);texture.wrapT=THREE.RepeatWrapping;texture.needsUpdate=true;addMerged(scene,lines,new THREE.MeshStandardMaterial({color:'#e1c787',map:texture,alphaTest:.5,roughness:1,side:THREE.DoubleSide}));
 for(const p of data.parks){const g=polygon(p,1.1);if(g)parkGeo.push(g);}addMerged(scene,parkGeo,new THREE.MeshStandardMaterial({color:'#354b32',roughness:1,side:THREE.DoubleSide}));
 for(const water of data.water){let p=water.p.map(p=>[p[0],p[1],2]);if(water.river)waters.push(ribbon(p,water.name?.includes('基隆')?140:230,.2));else {let g=polygon(p,.2);if(g)waters.push(g);}}
 const waterMat=new THREE.MeshStandardMaterial({color:'#537c77',metalness:.62,roughness:.22,side:THREE.DoubleSide});
 waterMat.onBeforeCompile=s=>{s.uniforms.uTime={value:0};waterMat.userData.shader=s;s.vertexShader='varying vec3 vWater;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvWater=(modelMatrix*vec4(transformed,1.0)).xyz;');s.fragmentShader='varying vec3 vWater;uniform float uTime;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\nnormal=normalize(normal+vec3(sin(vWater.x*.12+uTime)*.045,0.0,cos(vWater.z*.15+uTime*.7)*.045));');};
 addMerged(scene,waters,waterMat);
 return {waterMat,traffic};
}
function inside(x,z,poly){let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
export function makeTrees(scene,parks,terrain){
 let seed=817;const rand=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};let trees=[];
 for(const park of parks){const xs=park.map(p=>p[0]),zs=park.map(p=>p[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minZ=Math.min(...zs),maxZ=Math.max(...zs),amount=Math.min(1400,Math.floor((maxX-minX)*(maxZ-minZ)/160));
 for(let i=0;i<amount;i++){let x=minX+rand()*(maxX-minX),z=minZ+rand()*(maxZ-minZ);if(inside(x,z,park))trees.push([x,terrainHeight(terrain,x,z),z,5+rand()*8]);}}
 // Wooded foothills follow the terrain, with no trees on mapped flat streets.
 for(let i=0;i<18000;i++){let x=-6500+rand()*18000,z=-11000+rand()*20000,h=terrainHeight(terrain,x,z);if(h>65&&h<850)trees.push([x,h,z,6+rand()*7]);}
 const geo=new THREE.IcosahedronGeometry(1,1),mat=new THREE.MeshStandardMaterial({color:'#385536',roughness:1});const mesh=new THREE.InstancedMesh(geo,mat,trees.length);const o=new THREE.Object3D(),c=new THREE.Color();trees.forEach(([x,y,z,h],i)=>{o.position.set(x,y+h*.7,z);o.scale.set(h*.48,h*.65,h*.48);o.rotation.y=rand()*6.28;o.updateMatrix();mesh.setMatrixAt(i,o.matrix);c.setHSL(.23+rand()*.08,.17+rand()*.15,.15+rand()*.07);mesh.setColorAt(i,c);});mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);return mesh;
}
export async function addTaipei101(scene,terrain){
 const gltf=await new GLTFLoader().loadAsync('/models/taipei-101.glb');const groups=new Map();gltf.scene.updateMatrixWorld(true);gltf.scene.traverse(o=>{if(o.isMesh){const key=o.material.uuid;if(!groups.has(key))groups.set(key,{mat:o.material,geos:[]});groups.get(key).geos.push(o.geometry.clone().applyMatrix4(o.matrixWorld));}});
 const landmark=new THREE.Group(),p=project(121.5645,25.0339);p.y=terrainHeight(terrain,p.x,p.z);landmark.position.copy(p);
 for(const {mat,geos} of groups.values()){geos.forEach(g=>{for(const key of Object.keys(g.attributes))if(key!=='position'&&key!=='normal')g.deleteAttribute(key);});const g=mergeGeometries(geos);geos.forEach(g=>g.dispose());const mesh=new THREE.Mesh(g,mat);mesh.castShadow=true;mesh.receiveShadow=true;landmark.add(mesh);}scene.add(landmark);return landmark;
}
export function addMemorial(scene,terrain){
 const center=project(121.5219,25.0347);center.y=terrainHeight(terrain,center.x,center.z);
 const white=new THREE.MeshStandardMaterial({color:'#c9c4ab',roughness:.85}),blue=new THREE.MeshStandardMaterial({color:'#264459',roughness:.45}),stone=new THREE.MeshStandardMaterial({color:'#aaa392',roughness:1});const group=new THREE.Group();group.position.copy(center);
 const box=(w,h,d,y,mat)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.y=y;m.castShadow=true;m.receiveShadow=true;group.add(m);return m;};
 box(100,3,100,1.5,stone);box(82,5,82,5.5,white);box(60,30,60,23,white);
 const roof=new THREE.Mesh(new THREE.ConeGeometry(49,22,8),blue);roof.position.y=49;roof.rotation.y=Math.PI/8;roof.castShadow=true;group.add(roof);
 const cap=new THREE.Mesh(new THREE.ConeGeometry(24,13,8),blue);cap.position.y=64;cap.rotation.y=Math.PI/8;group.add(cap);
 for(const dz of [-145,145]){const hall=new THREE.Group();hall.position.set(-220,0,dz);let base=new THREE.Mesh(new THREE.BoxGeometry(110,20,65),new THREE.MeshStandardMaterial({color:'#a26143'}));base.position.y=10;hall.add(base);const roof=new THREE.Mesh(new THREE.ConeGeometry(76,22,4),new THREE.MeshStandardMaterial({color:'#ab8650'}));roof.scale.z=.65;roof.rotation.y=Math.PI/4;roof.position.y=30;hall.add(roof);group.add(hall);}scene.add(group);
}

export function makeFootways(scene,routes,terrain){
 const geos=routes.filter(r=>r.k==='walk').map(r=>ribbon(r.p,2.1,.28,terrain));
 addMerged(scene,geos,new THREE.MeshStandardMaterial({color:'#bcad8c',roughness:1,side:THREE.DoubleSide}));
}

export async function addCityLandmarks(scene,terrain){
 const entries=[['sun-yat-sen',121.56029,25.04001],['taipei-main-station',121.51712,25.04772],['taipei-dome',121.55958,25.04239]];
 const loader=new GLTFLoader();await Promise.all(entries.map(async([name,lon,lat])=>{const gltf=await loader.loadAsync(`/models/${name}.glb`),groups=new Map();gltf.scene.updateMatrixWorld(true);gltf.scene.traverse(o=>{if(!o.isMesh)return;const key=o.material.uuid;if(!groups.has(key))groups.set(key,{material:o.material,geometries:[]});const g=o.geometry.clone().applyMatrix4(o.matrixWorld);for(const attr of Object.keys(g.attributes))if(attr!=='position'&&attr!=='normal')g.deleteAttribute(attr);groups.get(key).geometries.push(g);});const group=new THREE.Group();group.name=name;const p=project(lon,lat);p.y=terrainHeight(terrain,p.x,p.z);group.position.copy(p);for(const {material,geometries} of groups.values()){const mesh=new THREE.Mesh(mergeGeometries(geometries),material);geometries.forEach(g=>g.dispose());mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);}scene.add(group);}));
}
