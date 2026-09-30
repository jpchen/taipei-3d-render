import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {terrainHeight} from './terrain.js';
export function cableRoute(stations,terrain){
 const points=stations.map(s=>({ ...s,y:terrainHeight(terrain,...s.p)+(s.station?19:29)}));
 for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i];let lift=0;for(let j=0;j<=40;j++){const t=j/40,x=a.p[0]+(b.p[0]-a.p[0])*t,z=a.p[1]+(b.p[1]-a.p[1])*t;lift=Math.max(lift,terrainHeight(terrain,x,z)+13-(a.y+(b.y-a.y)*t-4*4*t*(1-t)));}a.y+=lift;b.y+=lift;}
 let length=0;const segments=points.slice(1).map((b,i)=>{const a=points[i],d=Math.hypot(b.p[0]-a.p[0],b.p[1]-a.p[1]),s={a,b,d,start:length};length+=d;return s;});return {points,segments,length};
}
export function gondolaPose(route,distance){const lap=((distance%(route.length*2))+route.length*2)%(route.length*2),back=lap>route.length,d=back?route.length*2-lap:lap,s=route.segments.find(s=>d<=s.start+s.d)||route.segments.at(-1),t=Math.max(0,Math.min(1,(d-s.start)/s.d)),dx=(s.b.p[0]-s.a.p[0])/s.d,dz=(s.b.p[1]-s.a.p[1])/s.d,side=back?-1:1;return {x:s.a.p[0]+dx*s.d*t-dz*2.6*side,z:s.a.p[1]+dz*s.d*t+dx*2.6*side,y:s.a.y+(s.b.y-s.a.y)*t-16*t*(1-t),angle:Math.atan2(dx*side,dz*side)};}
export function createZooGondola(scene,data,terrain,{reducedMotion=false}={}){
 const group=new T.Group();group.name='Maokong Gondola: Zoo to Zoo South';scene.add(group);const route=cableRoute(data.gondola,terrain),parts=[];
 function color(g,c){if(!g.index)g.setIndex(Array.from({length:g.attributes.position.count},(_,i)=>i));const a=new Float32Array(g.attributes.position.count*3),v=new T.Color(c);for(let i=0;i<a.length;i+=3)v.toArray(a,i);g.setAttribute('color',new T.BufferAttribute(a,3));return g;}
 function box(x,y,z,w,h,d,c){parts.push(color(new T.BoxGeometry(w,h,d).translate(x,y,z),c));}
 function rod(a,b,r,c){const av=new T.Vector3(...a),bv=new T.Vector3(...b),v=bv.clone().sub(av),g=new T.CylinderGeometry(r,r,v.length(),6);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),v.normalize()));g.translate(...av.add(bv).multiplyScalar(.5).toArray());parts.push(color(g,c));}
 for(const p of route.points){const [x,z]=p.p,y=terrainHeight(terrain,x,z),height=p.y-y;box(x,y+height/2,z,1.3,height,1.3,'#a7aaa1');box(x,p.y-.3,z,9,.65,1.3,'#758681');box(x,y+.5,z,4,1,4,'#8c9187');for(const side of [-1,1])rod([x,y+height*.5,z],[x+side*3.5,p.y-.5,z],.22,'#81948d');
  if(p.station){
   const footprint=p.footprint||[[x-10,z-12],[x+10,z-12],[x+10,z+12],[x-10,z+12]],shape=new T.Shape(footprint.map(p=>new T.Vector2(p[0],-p[1])));
   for(const [offset,c] of [[-3.5,'#bfbaa2'],[2,p.public?'#648d76':'#8b9890']])parts.push(color(new T.ExtrudeGeometry(shape,{depth:.6,bevelEnabled:false}).rotateX(-Math.PI/2).translate(0,p.y+offset,0),c));
   for(let i=0;i<footprint.length;i+=2){const [px,pz]=footprint[i];box(px,p.y-1,pz,.4,6,.4,'#d5d4bb');const ground=terrainHeight(terrain,px,pz),height=Math.max(1,p.y-3.5-ground);box(px,ground+height/2,pz,.9,height,.9,'#9fa496');}
  }
 }
 const cablePositions=[];for(const s of route.segments)for(const back of [false,true])for(let j=0;j<24;j++){const distance=s.start+s.d*j/24,distance2=s.start+s.d*(j+1)/24,a=gondolaPose(route,back?2*route.length-distance:distance),b=gondolaPose(route,back?2*route.length-distance2:distance2);cablePositions.push(a.x,a.y,a.z,b.x,b.y,b.z);}
 const lineGeo=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(cablePositions,3));group.add(new T.LineSegments(lineGeo,new T.LineBasicMaterial({color:'#bac4bb'})));
 const geometry=mergeGeometries(parts);parts.forEach(g=>g.dispose());group.add(new T.Mesh(geometry,new T.MeshStandardMaterial({vertexColors:true,roughness:.85,side:T.DoubleSide})));
 const cabinParts=[color(new T.BoxGeometry(2.3,1.25,2.6).translate(0,-2.8,0),'#dae4d7'),color(new T.BoxGeometry(2.2,.85,2.5).translate(0,-1.78,0),'#294b55'),color(new T.BoxGeometry(2.5,.16,2.8).translate(0,-1.26,0),'#dae4d7'),color(new T.BoxGeometry(.12,1.2,.12).translate(0,-.6,0),'#aebbb2')],cabinGeometry=mergeGeometries(cabinParts);cabinParts.forEach(g=>g.dispose());
 const cabins=new T.InstancedMesh(cabinGeometry,new T.MeshStandardMaterial({vertexColors:true,roughness:.45}),36);cabins.name='Moving Maokong gondola cabins';cabins.frustumCulled=false;cabins.instanceMatrix.setUsage(T.DynamicDrawUsage);group.add(cabins);const dummy=new T.Object3D(),c=new T.Color(),stats={visibleCabins:0,totalCabins:36};let last=-1;
 function update(time,camera,quality,enabled=true){const near=route.points.some(p=>Math.hypot(camera.position.x-p.p[0],camera.position.z-p.p[1])<2800);group.visible=near&&camera.position.y<1700;if(!group.visible){stats.visibleCabins=0;return;}if(document.hidden||time-last<(quality==='low'?.1:.05))return;last=time;let count=0;
  for(let i=0;i<36;i++){const p=gondolaPose(route,i*route.length*2/36+(reducedMotion?0:time*4));if(Math.hypot(camera.position.x-p.x,camera.position.y-p.y,camera.position.z-p.z)>(quality==='low'?650:1600)||!enabled)continue;dummy.position.set(p.x,p.y,p.z);dummy.rotation.set(0,p.angle,0);dummy.updateMatrix();cabins.setMatrixAt(count,dummy.matrix);cabins.setColorAt(count++,c.set(['#79d3dc','#f5c979','#bddeae','#ebac9d'][i%4]));}
  cabins.count=count;cabins.instanceMatrix.needsUpdate=true;if(cabins.instanceColor)cabins.instanceColor.needsUpdate=true;stats.visibleCabins=count;
 }
 return {update,route,stats,cabins,group};
}
