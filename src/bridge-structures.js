import * as THREE from 'three';
import {terrainHeight} from './terrain.js';

export function createBridgeStructures(scene,roads,terrain){
 const cells=new Map(),dummy=new THREE.Object3D();
 const stats={bridges:0,piers:0,parts:0,batches:0};
 function box(kind,x,y,z,w,h,d,angle=0,pitch=0){const key=`${Math.floor(x/1200)},${Math.floor(z/1200)}`;if(!cells.has(key))cells.set(key,{concrete:[],steel:[]});dummy.position.set(x,y,z);dummy.rotation.set(0,angle,0);dummy.rotateX(pitch);dummy.scale.set(w,h,d);dummy.updateMatrix();cells.get(key)[kind].push(dummy.matrix.clone());stats.parts++;}
 for(const road of roads){if(!road.bridge&&!road.ramp)continue;if(road.bridge)stats.bridges++;const width=road.w||8;let distance=0,nextPier=8;
  for(let i=1;i<road.p.length;i++){const a=road.p[i-1],b=road.p[i],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);if(length<.05)continue;const angle=Math.atan2(dx,dz),pitch=-Math.atan2(b[2]-a[2],length),cx=(a[0]+b[0])/2,cz=(a[1]+b[1])/2,deck=(a[2]+b[2])/2+.24,clearance=deck-terrainHeight(terrain,cx,cz),nx=dz/length,nz=-dx/length;
   if(clearance>1.1){box('concrete',cx,deck-1.15,cz,width+1,1.4,Math.hypot(length,b[2]-a[2])+.12,angle,pitch);
    for(const side of [-1,1]){box('steel',cx+nx*width*.31*side,deck-1.6,cz+nz*width*.31*side,.48,1.25,length+.14,angle,pitch);box('concrete',cx+nx*(width/2+.1)*side,deck+.35,cz+nz*(width/2+.1)*side,.42,.7,length+.14,angle,pitch);box('steel',cx+nx*(width/2+.1)*side,deck+.95,cz+nz*(width/2+.1)*side,.14,.14,length+.14,angle,pitch);}
   }
   while(nextPier<distance+length){const t=(nextPier-distance)/length,x=a[0]+dx*t,z=a[1]+dz*t,top=a[2]+(b[2]-a[2])*t-1.2,base=terrainHeight(terrain,x,z)-1.2;
    if(top-base>2.5){box('concrete',x,top-.45,z,width*.82,.9,2.6,angle);for(const side of width>12?[-1,1]:[0]){const px=x+nx*width*.25*side,pz=z+nz*width*.25*side,bottom=terrainHeight(terrain,px,pz)-1.2,h=top-.9-bottom;box('concrete',px,bottom+h/2,pz,1.6,h,2.1,angle);box('concrete',px,bottom+.35,pz,3.1,.7,3.6,angle);stats.piers++;}}
    nextPier+=road.k==='motorway'||road.k==='trunk'?32:38;
   }distance+=length;
  }
 }
 const geometry=new THREE.BoxGeometry(1,1,1),materials={concrete:new THREE.MeshStandardMaterial({color:'#a4aaa5',roughness:.88}),steel:new THREE.MeshStandardMaterial({color:'#5d706e',roughness:.57,metalness:.45})};
 for(const [cell,kinds] of cells)for(const [kind,matrices] of Object.entries(kinds)){if(!matrices.length)continue;const mesh=new THREE.InstancedMesh(geometry,materials[kind],matrices.length);mesh.name=`Bridge ${kind}: ${cell}`;matrices.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.castShadow=true;mesh.receiveShadow=true;mesh.computeBoundingSphere();scene.add(mesh);stats.batches++;}
 return {stats};
}
