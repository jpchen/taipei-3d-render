import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Both axes get an all-red interval. Timing is illustrative, not live data.
export function signalPhase(time,offset,axis){const t=((time+offset)%72+72)%72,start=axis?36:0,local=(t-start+72)%72;return local<29?'green':local<33?'amber':'red';}
export async function createSignals(scene,{reducedMotion=false}={}){
 const response=await fetch('/data/signals.json',{cache:'no-cache'});if(!response.ok)throw Error('Intersection data unavailable');const data=await response.json(),cap=320;
 const poleGeometry=mergeGeometries([new THREE.CylinderGeometry(.11,.15,5.6,7).translate(0,2.8,0),new THREE.BoxGeometry(.55,.15,.55).translate(0,.08,0)]);
 const material=new THREE.MeshStandardMaterial({color:'#677470',roughness:.65,metalness:.45}),black=new THREE.MeshStandardMaterial({color:'#1b2928',roughness:.7});
 const defs={pole:[poleGeometry,material],arm:[new THREE.BoxGeometry(1,.13,.13),material],head:[new THREE.BoxGeometry(1.42,.62,.36),black]};const meshes={};
 for(const [kind,[g,m]] of Object.entries(defs)){const mesh=new THREE.InstancedMesh(g,m,cap);mesh.name=`Intersection ${kind}`;mesh.count=0;mesh.frustumCulled=false;scene.add(mesh);meshes[kind]=mesh;}
 const lamps=new THREE.InstancedMesh(new THREE.SphereGeometry(.16,8,5),new THREE.MeshBasicMaterial({toneMapped:false}),cap*3);lamps.name='Intersection lamps';lamps.frustumCulled=false;lamps.count=0;scene.add(lamps);meshes.lamps=lamps;
 const grid=new Map(),cell=400;for(const s of data.signals){const key=`${Math.floor(s.x/cell)},${Math.floor(s.z/cell)}`;if(!grid.has(key))grid.set(key,[]);grid.get(key).push(s);}
 const dummy=new THREE.Object3D(),p=new THREE.Vector3(),color=new THREE.Color(),lastCamera=new THREE.Vector3(Infinity,0,Infinity);let previous=-10,lastPhase=-1,visible=[];
 const stats={junctions:data.junctions.length,totalSignals:data.signals.length,visibleSignals:0,drawCalls:0,lit:{red:0,amber:0,green:0}};
 function place(mesh,i,x,y,z,angle,sx=1){dummy.position.set(x,y,z);dummy.rotation.set(0,angle,0);dummy.scale.set(sx,1,1);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);}
 function update(time,camera,quality){if(document.hidden)return;const low=quality==='low',radius=low?350:850;
  if(time-previous>.5||lastCamera.distanceToSquared(camera.position)>50**2){previous=time;lastCamera.copy(camera.position);visible=[];const cx=Math.floor(camera.position.x/cell),cz=Math.floor(camera.position.z/cell),n=Math.ceil(radius/cell),candidates=[];
   for(let x=cx-n;x<=cx+n;x++)for(let z=cz-n;z<=cz+n;z++)candidates.push(...(grid.get(`${x},${z}`)||[]));candidates.sort((a,b)=>Math.hypot(a.x-camera.position.x,a.z-camera.position.z)-Math.hypot(b.x-camera.position.x,b.z-camera.position.z));
   for(const s of candidates){if(visible.length>=(low?120:cap))break;p.set(s.x,s.y+4,s.z);if(p.distanceTo(camera.position)>radius)continue;p.project(camera);if(p.z<0||p.z>1||Math.abs(p.x)>1.08||Math.abs(p.y)>1.08)continue;const i=visible.length;visible.push(s);const tx=Math.cos(s.angle),tz=-Math.sin(s.angle);place(meshes.pole,i,s.x,s.y,s.z,s.angle);place(meshes.arm,i,s.x+tx*s.arm/2,s.y+5.25,s.z+tz*s.arm/2,s.angle,s.arm);place(meshes.head,i,s.x+tx*s.arm,s.y+5.1,s.z+tz*s.arm,s.angle);
    for(let j=0;j<3;j++){const shift=(j-1)*.44;place(lamps,i*3+j,s.x+tx*(s.arm+shift)+Math.sin(s.angle)*.2,s.y+5.1,s.z+tz*(s.arm+shift)+Math.cos(s.angle)*.2,s.angle);}
   }
   for(const [name,mesh] of Object.entries(meshes)){mesh.count=visible.length*(name==='lamps'?3:1);mesh.visible=mesh.count>0;mesh.instanceMatrix.needsUpdate=true;}stats.visibleSignals=visible.length;stats.drawCalls=visible.length?4:0;lastPhase=-1;
  }
  const second=Math.floor(reducedMotion?0:time);if(second!==lastPhase){lastPhase=second;stats.lit={red:0,amber:0,green:0};visible.forEach((s,i)=>{const phase=signalPhase(second,s.phase,s.axis);stats.lit[phase]++;['red','amber','green'].forEach((kind,j)=>{color.set(kind==='red'?'#ff3b24':kind==='amber'?'#ffbe35':'#38f895');color.multiplyScalar(kind===phase?1.6:.035);lamps.setColorAt(i*3+j,color);});});if(lamps.instanceColor)lamps.instanceColor.needsUpdate=true;}
 }
 return {update,stats,meshes};
}
