import * as THREE from 'three';
import { terrainHeight, makeFootways } from './world.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const CELL = 350;
const COLORS = ['#f0ca3c', '#f3eee2', '#c44d38', '#367d89', '#6f91a0', '#d7c6a2', '#263d4b'];
const hash = n => { const x=Math.sin(n*127.1+311.7)*43758.5453; return x-Math.floor(x); };

// Four small prototypes, shared by every instance. Vertex masks keep skin,
// windows, wheels and lamps independent of each vehicle/person's paint color.
function prototype(kind) {
  const pieces=[];
  function part(g,position,color,paint=0,light=0,gait=0){
    g.translate(...position);g.deleteAttribute('uv');const n=g.attributes.position.count;
    const c=new THREE.Color(color),colors=new Float32Array(n*3),masks=new Float32Array(n*3);
    for(let i=0;i<n;i++){c.toArray(colors,i*3);masks.set([paint,light,gait],i*3);}
    g.setAttribute('color',new THREE.BufferAttribute(colors,3));g.setAttribute('detail',new THREE.BufferAttribute(masks,3));pieces.push(g);
  }
  const box=(scale,pos,color,paint=0,light=0,gait=0)=>part(new THREE.BoxGeometry(...scale),pos,color,paint,light,gait);
  if(kind==='person'){
    box([.42,.62,.24],[0,1.13,0],'#ffffff',1);
    part(new THREE.SphereGeometry(.145,7,5),[0,1.63,0],'#c99573');
    for(const side of [-1,1]){box([.15,.67,.17],[side*.115,.48,0],'#283e50',0,0,side);box([.15,.12,.28],[side*.115,.10,.045],'#242929',0,0,side);box([.11,.53,.13],[side*.285,1.12,0],'#c99573',0,0,-side*.6);}
  }else if(kind==='scooter'){
    box([.52,.40,1.5],[0,.53,0],'#ffffff',1);box([.48,.14,.66],[0,.80,-.18],'#26302f');
    for(const z of [-.54,.56])part(new THREE.CylinderGeometry(.25,.25,.16,8).rotateZ(Math.PI/2),[0,.25,z],'#202727');
    box([.50,.07,.10],[0,1.02,.5],'#626f72');box([.35,.43,.27],[0,1.12,-.08],'#eeeeee',1);
    part(new THREE.SphereGeometry(.18,7,5),[0,1.52,-.03],'#f1e9da');box([.16,.12,.06],[0,.76,.77],'#ffe6ad',0,1);box([.18,.1,.06],[0,.63,-.77],'#f23e22',0,2);
  }else{
    const bus=kind==='bus',length=bus?10:4.3,width=bus?2.5:1.8;
    box([width,bus?2.25:.7,length],[0,bus?1.7:.78,0],'#ffffff',1);
    box([width*.88,bus?1.10:.65,bus?9:2.25],[0,bus?2.22:1.4,-.18],'#234452');
    box([width*.94,.13,bus?9.5:2.5],[0,bus?2.84:1.76,-.18],'#ffffff',1);
    for(const x of [-width*.5,width*.5])for(const z of [-length*.31,length*.31])part(new THREE.CylinderGeometry(bus?.42:.32,bus?.42:.32,.22,8).rotateZ(Math.PI/2),[x,bus?.45:.34,z],'#202929');
    for(const x of [-width*.33,width*.33]){box([.30,.17,.07],[x,.86,length*.505],'#ffe7b6',0,1);box([.24,.17,.07],[x,.86,-length*.505],'#ff3e26',0,2);}
    if(bus)for(let i=-3;i<=3;i++)box([width*.91,1.15,.10],[0,2.24,i*1.05],'#c4dccb',1);
  }
  const geometry=mergeGeometries(pieces);pieces.forEach(g=>g.dispose());return geometry;
}

function material(time,dusk){
  const m=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.6,metalness:.12});
  m.onBeforeCompile=s=>{
    s.uniforms.uLifeTime=time;s.uniforms.uLifeDusk=dusk;
    s.vertexShader='attribute vec3 detail; varying vec3 vDetail; varying vec3 vPaint; varying vec3 vBase; uniform float uLifeTime;\n'+s.vertexShader;
    s.vertexShader=s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      vDetail=detail;vPaint=instanceColor;vBase=color;
      float phase=instanceMatrix[3].x*.14+instanceMatrix[3].z*.09;
      transformed.z+=sin(uLifeTime*6.0+phase)*detail.z*.22;
      transformed.y+=abs(sin(uLifeTime*6.0+phase))*.018*abs(detail.z);
    `);
    s.fragmentShader='varying vec3 vDetail;varying vec3 vPaint;varying vec3 vBase;uniform float uLifeDusk;\n'+s.fragmentShader;
    s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      diffuseColor.rgb=vBase*mix(vec3(1.),vPaint,vDetail.x);
    `);
    s.fragmentShader=s.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
      totalEmissiveRadiance+=vBase*step(.5,vDetail.y)*(1.4+uLifeDusk*1.8);
    `);
  };return m;
}

function routeData(raw){
  const distance=[0];for(let i=1;i<raw.p.length;i++)distance.push(distance[i-1]+Math.hypot(raw.p[i][0]-raw.p[i-1][0],raw.p[i][1]-raw.p[i-1][1]));
  return {...raw,distance,length:distance.at(-1),x:(raw.p[0][0]+raw.p.at(-1)[0])/2,z:(raw.p[0][1]+raw.p.at(-1)[1])/2};
}
// Piecewise-linear interpolation respects mapped corners instead of cutting
// through buildings with an unconstrained smooth curve.
function sample(route,distance,out){
  distance=THREE.MathUtils.clamp(distance,0,route.length-.0001);let lo=0,hi=route.distance.length-1;
  while(hi-lo>1){const m=(lo+hi)>>1;if(route.distance[m]<=distance)lo=m;else hi=m;}
  const a=route.p[lo],b=route.p[hi],span=route.distance[hi]-route.distance[lo]||1,t=(distance-route.distance[lo])/span;
  out.x=THREE.MathUtils.lerp(a[0],b[0],t);out.z=THREE.MathUtils.lerp(a[1],b[1],t);out.y=THREE.MathUtils.lerp(a[2],b[2],t)+(route.profile?.32:route.k==='walk'?1.4:.9);
  out.lift=route.profile?THREE.MathUtils.lerp(a[2]-a[3],b[2]-b[3],t):0;
  out.dx=(b[0]-a[0])/span;out.dz=(b[1]-a[1])/span;return out;
}

export async function createCityLife(scene,dusk,{reducedMotion=false,terrain}={}){
  const response=await fetch('/data/activity.json',{cache:'no-cache'});if(!response.ok)throw Error('Street activity data could not be loaded');
  const data=await response.json(),marketBounds=data.marketBounds,routes=data.routes.map(routeData).filter(r=>r.length>18),grid=new Map();
  makeFootways(scene,routes,terrain);
  for(const r of routes){const visited=new Set();for(let d=0;d<=r.length;d+=CELL*.6){const p=sample(r,Math.min(d,r.length-.001),{}),key=`${Math.floor(p.x/CELL)},${Math.floor(p.z/CELL)}`;if(!visited.has(key)){visited.add(key);if(!grid.has(key))grid.set(key,[]);grid.get(key).push(r);}}}
  const clock={value:0},mat=material(clock,dusk),kinds=['car','bus','scooter','person'],caps={car:750,bus:70,scooter:320,person:1400},meshes={};
  for(const kind of kinds){const mesh=new THREE.InstancedMesh(prototype(kind),mat,caps[kind]);mesh.name=`City life: ${kind}`;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.frustumCulled=false;mesh.count=0;mesh.setColorAt(0,new THREE.Color());scene.add(mesh);meshes[kind]=mesh;}
  let active=[],lastRefresh=-10,lastTick=-10,lastFocus=new THREE.Vector3(Infinity,0,Infinity),enabled=true;
  const dummy=new THREE.Object3D(),point={},clip=new THREE.Vector3(),counts={car:0,bus:0,scooter:0,person:0},color=new THREE.Color();
  const stats={visibleCars:0,visibleBuses:0,visibleScooters:0,visiblePeople:0,visibleMarketPeople:0,visibleParkPeople:0,candidateRoutes:0,drawCalls:0,updateHz:0,enabled:true};
  function refresh(camera,target,time,low){
    const candidates=new Set(),radius=low?1600:2400;
    for(const focus of [camera.position,target]){const cx=Math.floor(focus.x/CELL),cz=Math.floor(focus.z/CELL),n=Math.ceil(radius/CELL);for(let i=cx-n;i<=cx+n;i++)for(let j=cz-n;j<=cz+n;j++)for(const r of grid.get(`${i},${j}`)||[])candidates.add(r);}
    active=[...candidates].sort((a,b)=>Math.hypot(a.x-camera.position.x,a.z-camera.position.z)-Math.hypot(b.x-camera.position.x,b.z-camera.position.z));
    stats.candidateRoutes=active.length;lastRefresh=time;lastFocus.copy(camera.position);
  }
  function update(time,camera,target,quality='balanced'){
    clock.value=reducedMotion?0:time;if(!enabled||document.hidden)return;
    const low=quality==='low',interval=1/(low?15:30);if(time-lastTick<interval)return;lastTick=time;stats.updateHz=low?15:30;
    if(time-lastRefresh>.8||lastFocus.distanceToSquared(camera.position)>180**2)refresh(camera,target,time,low);
    kinds.forEach(k=>counts[k]=0);stats.visibleMarketPeople=0;stats.visibleParkPeople=0;const movementTime=reducedMotion?0:time;
    const vehicleDistance=low?1800:3000,personDistance=low?300:700;
    for(const r of active){
      const walking=r.k==='walk',highway=r.k==='motorway'||r.k==='trunk';
      const density=walking?(r.market?2.0:r.place?4:r.park?8:15):highway?130:65,amount=Math.min(walking?(r.market?160:70):24,Math.max(1,Math.floor(r.length/density)));
      for(let i=0;i<amount;i++){
        const seed=hash(r.id+i*17.3),kind=walking?'person':seed<.065&&!highway?'bus':seed<.32&&!highway?'scooter':'car';
        const cap=Math.floor(caps[kind]*(low?.45:1));if(counts[kind]>=cap)continue;
        const direction=walking||!r.oneway?(hash(r.id+i+14)>.5?1:-1):r.oneway;
        const speed=walking?.9+seed*.65:kind==='bus'?6.5:highway?20:7+seed*6;
        const travel=(seed*r.length+movementTime*speed)%r.length,d=direction>0?travel:r.length-travel;
        sample(r,d,point);
        // Taiwan drives on the right. Each direction gets its own lane;
        // pedestrian routes remain on actual mapped footways.
        const lane=walking?(seed-.5)*(r.market?3.2:1.5):r.oneway?(seed-.5)*Math.max(1,r.w-5):direction*Math.min(r.w*.22,4.5);
        point.x+=point.dz*lane;point.z-=point.dx*lane;point.y=terrainHeight(terrain,point.x,point.z)+(r.profile?point.lift:0)+.32;
        if(r.marketStreet&&marketBounds&&point.x>marketBounds[0]&&point.x<marketBounds[2]&&point.z>marketBounds[1]&&point.z<marketBounds[3])continue;
        const distance=Math.hypot(point.x-camera.position.x,point.y-camera.position.y,point.z-camera.position.z);
        if(distance>(walking?personDistance:vehicleDistance))continue;
        clip.set(point.x,point.y+1,point.z).project(camera);if(clip.z<0||clip.z>1||Math.abs(clip.x)>1.08||Math.abs(clip.y)>1.1)continue;
        const edge=Math.min(travel,r.length-travel),scale=THREE.MathUtils.smoothstep(edge,0,walking?1.5:6);
        dummy.position.set(point.x,point.y,point.z);dummy.rotation.set(0,Math.atan2(point.dx*direction,point.dz*direction),0);const size=walking?.9+seed*.22:1;dummy.scale.setScalar(size*scale);dummy.updateMatrix();
        if(r.market)stats.visibleMarketPeople++;if(r.park)stats.visibleParkPeople++;
        const index=counts[kind]++;meshes[kind].setMatrixAt(index,dummy.matrix);color.set(COLORS[Math.floor(hash(r.id+i*47)*COLORS.length)]);meshes[kind].setColorAt(index,color);
      }
    }
    for(const kind of kinds){const m=meshes[kind];m.count=counts[kind];m.visible=counts[kind]>0;m.instanceMatrix.needsUpdate=true;m.instanceColor.needsUpdate=true;}
    Object.assign(stats,{visibleCars:counts.car,visibleBuses:counts.bus,visibleScooters:counts.scooter,visiblePeople:counts.person,drawCalls:kinds.filter(k=>counts[k]>0).length});
  }
  function streetView(target){
    let best=null,bestScore=Infinity;const p={};
    for(const r of routes){if(r.k==='walk'||r.bridge||r.length<100||r.k==='motorway'||r.k==='trunk')continue;sample(r,r.length*.45,p);const score=Math.hypot(p.x-target.x,p.z-target.z);if(score<bestScore){bestScore=score;best={...p,r};}}
    if(!best)return null;
    const look=sample(best.r,Math.min(best.r.length-4,best.r.length*.45+65),{});
    return{pos:new THREE.Vector3(best.x,best.y+18,best.z),target:new THREE.Vector3(look.x,look.y+3,look.z)};
  }
  function setEnabled(value){enabled=value;stats.enabled=value;for(const m of Object.values(meshes))m.visible=value&&m.count>0;lastTick=-10;}
  return {update,streetView,setEnabled,stats,meshes,walkways:routes.filter(r=>r.k==='walk').map(r=>r.p)};
}
