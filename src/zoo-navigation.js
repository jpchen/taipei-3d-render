import * as T from 'three';import {terrainHeight} from './terrain.js';
export function createZooNavigation(zoo,terrain,{visit,reducedMotion}){
 const panel=document.createElement('div');panel.id='zoo-navigation';panel.hidden=true;panel.innerHTML='<label for="zoo-stop">Explore Taipei Zoo</label><select id="zoo-stop" aria-label="Zoo destination"></select><button id="zoo-trail" aria-pressed="false">Follow visitor trail ↗</button>';
 document.querySelector('#app').appendChild(panel);const select=panel.querySelector('select'),button=panel.querySelector('button');
 const stops=[...zoo.data.stops,{...zoo.data.gondola[0],name:'Gondola — Taipei Zoo Station'}];for(const stop of stops){const o=document.createElement('option');o.value=stop.id;o.textContent=stop.name;select.appendChild(o);}
 let walking=false,distance=0;const points=zoo.data.trail.flatMap(l=>l.p),segments=[];let length=0;for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],d=Math.hypot(b[0]-a[0],b[1]-a[1]);if(d>.01){segments.push({a,b,d,start:length});length+=d;}}
 const at=d=>{const s=segments.find(s=>d<s.start+s.d)||segments.at(-1),t=Math.min(1,Math.max(0,(d-s.start)/s.d));return [s.a[0]+(s.b[0]-s.a[0])*t,s.a[1]+(s.b[1]-s.a[1])*t];};
 function stop(){walking=false;button.textContent='Follow visitor trail ↗';button.setAttribute('aria-pressed','false');}
 select.onchange=()=>{stop();const s=stops.find(s=>String(s.id)===select.value),[x,z]=s.p,y=terrainHeight(terrain,x,z),target=new T.Vector3(x,y+2,z),isGondola=zoo.data.gondola.some(g=>g.id===s.id);if(isGondola)target.y+=18;visit({pos:target.clone().add(new T.Vector3(24,22,32)),target,name:s.name,zh:s.zh});};
 button.onclick=()=>{if(walking){stop();return;}distance=0;const p=at(0),q=at(40);visit({pos:new T.Vector3(p[0],terrainHeight(terrain,...p)+24,p[1]),target:new T.Vector3(q[0],terrainHeight(terrain,...q)+2,q[1]),name:'Zoo visitor trail',zh:'From the entrance to Zoo South gondola'});walking=true;button.textContent='Stop following trail';button.setAttribute('aria-pressed','true');};
 if(reducedMotion){button.disabled=true;button.title='Choose a stop above while reduced motion is enabled.';}
 function update(dt,camera,controls,inFlight,isZoo){panel.hidden=!isZoo;if(!isZoo){stop();return;}if(!walking||inFlight)return;distance+=dt*12;if(distance>=length-40){stop();return;}const p=at(distance),q=at(distance+40);camera.position.set(p[0],terrainHeight(terrain,...p)+24,p[1]);controls.target.set(q[0],terrainHeight(terrain,...q)+2,q[1]);}
 return {update,stop,get walking(){return walking;},length};
}
