import * as THREE from 'three';import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';import {terrainHeight} from './terrain.js';
export function createRedHouse(scene,terrain){
 // OSM way 222080307: retain the cruciform market wing and octagonal entrance.
 const footprint=[[121.506374,25.042335],[121.506324,25.042168],[121.506534,25.042114],[121.506731,25.042067],[121.506814,25.042122],[121.506923,25.042095],[121.506953,25.042018],[121.506934,25.041939],[121.506867,25.041898],[121.506749,25.041923],[121.506707,25.041997],[121.50632,25.04209],[121.506268,25.041915],[121.506168,25.041939],[121.50622,25.042113],[121.506056,25.042154],[121.506077,25.042222],[121.506242,25.042182],[121.506293,25.042355]];
 const x=(121.50683-121.54)*100800,z=(25.05-25.04201)*111320,y=terrainHeight(terrain,x,z),group=new THREE.Group();group.name='ximen-red-house';group.position.set(x,y,z);
 const points=footprint.map(([lon,lat])=>new THREE.Vector2((lon-121.54)*100800-x,-((25.05-lat)*111320-z))),shape=new THREE.Shape(points),body=new THREE.ExtrudeGeometry(shape,{depth:7,bevelEnabled:false}).rotateX(-Math.PI/2);
 const brick=new THREE.MeshStandardMaterial({color:'#9b4735',roughness:.9}),roofMat=new THREE.MeshStandardMaterial({color:'#554a48',roughness:.85}),trim=new THREE.MeshStandardMaterial({color:'#d6b78b',roughness:.8});
 const shell=new THREE.Mesh(body,brick);group.add(shell);const flat=new THREE.Mesh(new THREE.ShapeGeometry(shape).rotateX(-Math.PI/2).translate(0,7.05,0),roofMat);group.add(flat);
 const roof=new THREE.Mesh(new THREE.ConeGeometry(12.5,4,8),roofMat);roof.position.y=10;roof.rotation.y=.25;group.add(roof);
 const details=[];for(let i=0;i<footprint.length;i++){const a=points[i],b=points[(i+1)%points.length],length=a.distanceTo(b);for(let d=3;d<length-2;d+=4){const f=d/length,px=a.x+(b.x-a.x)*f,pz=-a.y-(b.y-a.y)*f,angle=Math.atan2(-(b.y-a.y),b.x-a.x);details.push(new THREE.BoxGeometry(1.4,2.2,.15).rotateY(-angle).translate(px,4,pz));}}
 const windows=new THREE.Mesh(mergeGeometries(details),trim);details.forEach(g=>g.dispose());group.add(windows);group.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});scene.add(group);return group;
}
