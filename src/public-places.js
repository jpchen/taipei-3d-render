import * as THREE from 'three';import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

function prototype(kind){
 const parts=[];function part(g,x,y,z,color){g.translate(x,y,z);g.deleteAttribute('uv');const c=new THREE.Color(color),v=new Float32Array(g.attributes.position.count*3);for(let i=0;i<v.length;i+=3)c.toArray(v,i);g.setAttribute('color',new THREE.BufferAttribute(v,3));parts.push(g);}
 const box=(w,h,d,x,y,z,c)=>part(new THREE.BoxGeometry(w,h,d),x,y,z,c),sphere=(r,x,y,z,c)=>part(new THREE.SphereGeometry(r,8,6),x,y,z,c);
 const wood='#936247',metal='#344d50',cream='#e6d5b3',red='#b74c3e';
 if(kind==='table'||kind==='umbrella'){
  part(new THREE.CylinderGeometry(.75,.75,.12,12),0,.9,0,wood);box(.14,.9,.14,0,.45,0,metal);
  for(const side of [-1,1]){box(.6,.12,.6,side*1.2,.52,0,cream);box(.12,.5,.12,side*1.2,.25,0,metal);box(.6,.65,.1,side*1.2,.8,-.27,cream);}
  if(kind==='umbrella'){box(.07,3.1,.07,0,1.55,0,metal);part(new THREE.ConeGeometry(2,.65,8),0,3.05,0,red);}
 }else if(kind==='bench'){
  box(2.4,.15,.65,0,.55,0,wood);box(2.4,.6,.12,0,.95,-.28,wood);for(const x of [-.9,.9])box(.14,.55,.5,x,.28,0,metal);
 }else if(kind==='stall'||kind==='container'){
  const container=kind==='container',w=container?6:3,d=container?2.5:2;
  box(w,container?2.8:1,d,0,container?1.4:.5,0,container?'#527f79':wood);box(w+.3,.15,d+.5,0,2.9,0,red);
  if(container){box(w-.8,1.2,.08,0,1.7,d/2+.05,'#213d43');for(let x=-2.8;x<=2.8;x+=.4)box(.04,2.65,.05,x,1.4,-1.28,'#6a9790');}
  else for(const x of [-1.35,1.35])box(.07,2.8,.07,x,1.4,-.8,metal);
  box(w+.2,.12,.7,0,1.15,d/2+.3,cream);for(const x of [-.6,0,.6])sphere(.13,x,1.34,d/2+.3,'#e0b459');
 }else if(kind==='sculpture'){
  box(2.7,.3,2.7,0,.15,0,cream);part(new THREE.TorusKnotGeometry(1,.28,40,6),0,1.7,0,'#e8aa45');
 }else if(kind==='bicycle'){
  for(const z of [-.7,.7])part(new THREE.TorusGeometry(.39,.045,5,14).rotateY(Math.PI/2),0,.43,z,metal);
  box(.08,.65,1.1,0,.68,0,'#d99035');box(.5,.06,.08,0,1.15,.55,metal);box(.2,.08,.32,0,1.13,-.3,wood);
 }else if(kind==='performer'){
  part(new THREE.CylinderGeometry(2.2,2.2,.3,20),0,.15,0,wood);box(.4,.65,.25,0,1.25,0,'#eabc53');sphere(.17,0,1.75,0,cream);for(const x of [-.13,.13])box(.14,.7,.17,x,.6,0,metal);sphere(.24,.24,1.07,.22,red);box(.09,.65,.09,.3,1.45,.23,wood);box(.8,1.1,.6,1.6,.7,0,metal);
 }else if(kind==='light'){
  for(const x of [-4,4])box(.06,4,.06,x,2,0,metal);box(8,.025,.025,0,3.9,0,metal);for(let x=-3.5;x<4;x++)sphere(.12,x,3.8-.3*(1-x*x/16),0,'#ffd48c');
 }
 const g=mergeGeometries(parts);parts.forEach(p=>p.dispose());return g;
}
function signMaterial(place){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;const c=canvas.getContext('2d');c.fillStyle=place.id==='ximen'?'#842a48':'#275f58';c.fillRect(0,0,512,256);c.strokeStyle='#e7b865';c.lineWidth=8;c.strokeRect(9,9,494,238);c.textAlign='center';c.fillStyle='#fff0ce';c.font='bold 44px sans-serif';c.fillText(place.zh,256,108);c.font='26px sans-serif';c.fillText(place.name,256,164);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return new THREE.MeshStandardMaterial({map:texture,emissiveMap:texture,emissive:'#fff0cd',emissiveIntensity:.55,side:THREE.DoubleSide,roughness:.8});}
export async function createPublicPlaces(scene,dusk){
 const response=await fetch('/data/places.json',{cache:'no-cache'});if(!response.ok)throw Error('Destination details unavailable');const {places}=await response.json(),dummy=new THREE.Object3D(),geometry=new Map(),material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.8});
 const groups=places.map(place=>{const group=new THREE.Group();group.name=`Public space: ${place.id}`;const byKind=new Map();for(const p of place.props){if(!byKind.has(p.kind))byKind.set(p.kind,[]);byKind.get(p.kind).push(p);}for(const [kind,props] of byKind){if(!geometry.has(kind))geometry.set(kind,kind==='sign'?new THREE.PlaneGeometry(2.5,1.3).translate(0,3.4,0):prototype(kind));const mesh=new THREE.InstancedMesh(geometry.get(kind),kind==='sign'?signMaterial(place):material,props.length);mesh.name=`${place.id}: ${kind}`;props.forEach((p,i)=>{dummy.position.set(p.x,p.y,p.z);dummy.rotation.set(0,p.angle,0);dummy.scale.setScalar(1);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);});mesh.computeBoundingSphere();mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);}scene.add(group);return {place,group};});
 const stats={places:places.length,visiblePlaces:[],visibleProps:0,drawCalls:0};let previous=-1;
 function update(time,camera,quality){if(time-previous<.25||document.hidden)return;previous=time;stats.visiblePlaces=[];stats.visibleProps=0;stats.drawCalls=0;for(const {place,group} of groups){group.visible=Math.hypot(camera.position.x-place.x,camera.position.z-place.z)<(quality==='low'?650:1300)&&camera.position.y<(place.y||0)+900;if(group.visible){stats.visiblePlaces.push(place.id);stats.visibleProps+=place.props.length;stats.drawCalls+=group.children.length;for(const m of group.children)if(m.material.emissiveMap)m.material.emissiveIntensity=.35+dusk.value*.6;}}}
 return {update,stats,groups};
}
