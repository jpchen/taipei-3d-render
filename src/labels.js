import socialPlaces from './social-places.json';
import * as THREE from 'three';
import { terrainHeight } from './world.js';

export async function createLabels(terrain,onSelect){
 const response=await fetch('/data/labels.json',{cache:'no-cache'});if(!response.ok)throw Error('Place labels could not be loaded');const data=await response.json(),container=document.querySelector('#landmark-labels');
 for(const p of socialPlaces)data.landmarks.push({name:p.name,zh:p.zh,x:(p.lon-121.54)*100800,z:(25.05-p.lat)*111320,height:4,rank:1});
 const zooResponse=await fetch('/data/zoo.json',{cache:'no-cache'});if(zooResponse.ok){const zoo=await zooResponse.json();for(const h of zoo.habitats)data.landmarks.push({name:h.name,zh:h.zh||'臺北動物園',x:h.x,z:h.z,height:3,rank:1,animal:true});for(const stop of [zoo.entrance,...zoo.gondola.filter(s=>s.public)])data.landmarks.push({name:stop.name,zh:stop.zh,x:stop.p[0],z:stop.p[1],height:8,rank:1,animal:true});}
 const landmarks=data.landmarks.map(l=>({...l,position:new THREE.Vector3(l.x,terrainHeight(terrain,l.x,l.z)+l.height+8,l.z)}));
 const streets=data.streets.map(l=>({...l,position:new THREE.Vector3(l.x,terrainHeight(terrain,l.x,l.z)+1.8,l.z)}));
 const pool=[],streetPool=[];
 for(let i=0;i<24;i++){const el=document.createElement('button');el.className='landmark-label expanded-label';el.innerHTML='<span class="label-dot"></span><span class="label-text"><b></b><small></small></span>';el.addEventListener('click',()=>{if(el.place)onSelect(el.place);});container.appendChild(el);pool.push(el);}
 for(let i=0;i<18;i++){const el=document.createElement('div');el.className='street-label';el.innerHTML='<span></span><small></small>';container.appendChild(el);streetPool.push(el);}
 const grid=new Map(),cell=800;for(const s of streets){const key=`${Math.floor(s.x/cell)},${Math.floor(s.z/cell)}`;if(!grid.has(key))grid.set(key,[]);grid.get(key).push(s);}
 let previous=-10,streetsEnabled=true;const v=new THREE.Vector3(),p2=new THREE.Vector3(),direction=new THREE.Vector3();
 const stats={landmarks:data.landmarks.length,streets:data.streets.length,visibleLandmarks:0,visibleStreets:0};
 function update(camera,width,height,time){
  if(container.hidden||time-previous<.12)return;previous=time;
  const boxes=[],candidates=[];camera.getWorldDirection(direction);const lowAngle=Math.abs(direction.y)<.30;
  const minY=height<700?80:95,maxY=height-(width<650?310:200);
  function screen(position){v.copy(position).project(camera);if(v.z<0||v.z>1||Math.abs(v.x)>.93||Math.abs(v.y)>.86)return null;const x=(v.x*.5+.5)*width,y=(-v.y*.5+.5)*height;if(y<minY||y>maxY)return null;return{x,y};}
  function space(x,y,w,h){const b={x:x-w/2-6,y:y-h-5,w:w+12,h:h+10};if(b.x<15||b.x+b.w>width-15||boxes.some(a=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y))return false;boxes.push(b);return true;}
  function terrainBlocks(point){const distance=camera.position.distanceTo(point),steps=Math.min(24,Math.ceil(distance/250));for(let i=1;i<steps;i++){const f=i/steps,x=THREE.MathUtils.lerp(camera.position.x,point.x,f),z=THREE.MathUtils.lerp(camera.position.z,point.z,f),y=THREE.MathUtils.lerp(camera.position.y,point.y,f);if(terrainHeight(terrain,x,z)>y+10)return true;}return false;}
  for(const l of landmarks){const distance=camera.position.distanceTo(l.position),range=l.rank===0?10500:l.rank===1?3300:1600;if(distance>range)continue;const pos=screen(l.position);if(!pos)continue;candidates.push({l,pos,distance,score:l.rank*1800+distance});}
  candidates.sort((a,b)=>a.score-b.score);let used=0;const maxLabels=width<650?8:19;
  for(const {l,pos} of candidates){if(used>=maxLabels)break;const w=Math.max(l.name.length*6.4,l.zh?.length*9||0)+20;if(!space(pos.x,pos.y,w,33)||terrainBlocks(l.position))continue;const el=pool[used++];el.style.display='flex';el.style.transform=`translate(${pos.x}px,${pos.y}px) translate(-50%,-100%)`;el.querySelector('b').textContent=l.name;el.querySelector('small').textContent=l.zh||'';el.setAttribute('aria-label',`Explore ${l.name}`);el.place=l;el.classList.toggle('major',l.rank===0);}
  for(let i=used;i<pool.length;i++)pool[i].style.display='none';stats.visibleLandmarks=used;
  const near=[],seenNames=new Set(),cx=Math.floor(camera.position.x/cell),cz=Math.floor(camera.position.z/cell),radius=width<650?700:1400,n=Math.ceil(radius/cell);
  if(streetsEnabled&&camera.position.y<1600){for(let x=cx-n;x<=cx+n;x++)for(let z=cz-n;z<=cz+n;z++)for(const s of grid.get(`${x},${z}`)||[]){const distance=camera.position.distanceTo(s.position);if(distance>radius||lowAngle&&distance>180)continue;const pos=screen(s.position);if(pos)near.push({s,pos,distance,score:distance+s.rank*100});}}
  near.sort((a,b)=>a.score-b.score);let streetUsed=0;
  for(const {s,pos,distance} of near){if(streetUsed>=(width<650?5:14))break;if(seenNames.has(s.name))continue;const w=Math.max(s.name.length*5.2,s.zh.length*8.3)+12;if(!space(pos.x,pos.y,w,26))continue;
   p2.copy(s.position);p2.x+=s.dx*25;p2.z+=s.dz*25;p2.project(camera);let angle=Math.atan2((-p2.y*.5+.5)*height-pos.y,(p2.x*.5+.5)*width-pos.x)*180/Math.PI;if(angle>90)angle-=180;if(angle< -90)angle+=180;angle=THREE.MathUtils.clamp(angle,-32,32);
   const el=streetPool[streetUsed++];el.style.display='block';el.style.transform=`translate(${pos.x}px,${pos.y}px) translate(-50%,-100%) rotate(${angle}deg)`;el.style.opacity=String(THREE.MathUtils.clamp(1-distance/radius*.35,.5,1));el.querySelector('span').textContent=s.name;el.querySelector('small').textContent=s.zh===s.name?'':s.zh;seenNames.add(s.name);
  }
  for(let i=streetUsed;i<streetPool.length;i++)streetPool[i].style.display='none';stats.visibleStreets=streetUsed;
 }
 return {update,stats,setStreetsEnabled(value){streetsEnabled=value;previous=-10;}};
}
