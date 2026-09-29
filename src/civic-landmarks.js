import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {terrainHeight} from './terrain.js';
import {sites} from './landmark-layout.js';

const materials={stone:new THREE.MeshStandardMaterial({color:'#c7bda7',roughness:.87}),red:new THREE.MeshStandardMaterial({color:'#963e29',roughness:.74}),gold:new THREE.MeshStandardMaterial({color:'#c68a36',roughness:.5,metalness:.1})};
function builder(){
 const parts=new Map();
 function add(kind,g){if(!parts.has(kind))parts.set(kind,[]);parts.get(kind).push(g);}
 function box(kind,x,y,z,w,h,d){add(kind,new THREE.BoxGeometry(w,h,d).translate(x,y,z));}
 function roof(w,d,eave,rise){
  const pos=[],n=24;
  function vertex(i,j){const x=i/n*2-1,z=j/n*2-1,q=Math.max(Math.abs(x),Math.abs(z));return [x*w/2,eave+rise*(1-q)+2.2*q**8,z*d/2];}
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){const a=vertex(i,j),b=vertex(i+1,j),c=vertex(i+1,j+1),d=vertex(i,j+1);pos.push(...a,...c,...b,...a,...d,...c);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.computeVertexNormals();g.setIndex(Array.from({length:pos.length/3},(_,i)=>i));add('gold',g);
 }
 function finish(name){const group=new THREE.Group();group.name=name;for(const [kind,geos] of parts){for(const g of geos)g.deleteAttribute('uv');const mesh=new THREE.Mesh(mergeGeometries(geos),materials[kind]);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);geos.forEach(g=>g.dispose());}return group;}
 return {box,roof,finish};
}
export function createCivicHalls(scene,terrain){
 for(const site of sites.filter(s=>s.name.startsWith('national-'))){
  const {box,roof,finish}=builder();
  box('stone',0,2.5,0,98,5,98);box('red',0,14,0,77,18,74);
  for(let x=-36;x<=36;x+=9)for(const z of [-39,39])box('red',x,14,z,1.7,18,1.7);
  for(const x of [-40,40])for(let z=-30;z<=30;z+=10)box('red',x,14,z,1.7,18,1.7);
  roof(94,88,22,8);
  if(site.name==='national-theater'){box('red',0,28,0,64,6,52);roof(77,65,30,7);}else roof(80,70,24,13);
  for(let i=0;i<18;i++){const h=(18-i)*5/18;box('stone',0,h/2,39+i*.55,50,h,.6);}
  // Front stairs and open colonnades face the other hall across the central plaza.
  const group=finish(site.name);group.rotation.y=site.angle+(site.name==='national-theater'?Math.PI:0);
  const x=(site.lon-121.54)*100800,z=(25.05-site.lat)*111320;group.position.set(x,terrainHeight(terrain,x,z),z);group.userData.footprintId=site.id;scene.add(group);
 }
}
