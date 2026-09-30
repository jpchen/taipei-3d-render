import {createSports} from './sports.js';
import {createZooNavigation} from './zoo-navigation.js';
import {createZoo} from './zoo.js';
import {createRedHouse} from './red-house.js';
import socialPlaces from './social-places.json';
import {createPublicPlaces} from './public-places.js';
import './style.css';
import {enableDestinationScroll} from './destination-scroll.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { TaipeiAudio } from './audio.js';
import { createLighting } from './lighting.js';
import {createSignals} from './signals.js';
import { createCityLife } from './activity.js';
import {createMarket} from './market.js';
import { createLabels } from './labels.js';
import { buildingMaterial, createArchitectureDetails } from './architecture.js';
import { project,terrainHeight,makeTerrain,loadBuildings,makeStreets,makeTrees,addTaipei101,addMemorial,addCityLandmarks } from './world.js';

const $=s=>document.querySelector(s), reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const audio=new TaipeiAudio(),dusk={value:.45};
let renderer,terrain,controls,scene,camera,composer,lighting,water,infrastructure,signals,cityLife=null,architecture=null,labelLayer=null,market=null,publicPlaces=null,zoo=null,zooNavigation=null,ready=false,activePlace=0,flight=null,touring=false,tourElapsed=0,interactionTimer,frame=0;
const keys=new Set();
let previousTime=performance.now(),elapsedTime=0;
const locations=[
 {name:'Taipei 101',description:'Above Xinyi, where the city meets the sky.',lon:121.5645,lat:25.0339,target:175,offset:[1500,710,1320]},
 {name:'Elephant Mountain',description:'A hillside pause above the lights of Xinyi.',lon:121.5763,lat:25.0273,target:185,offset:[520,230,450],look:[121.559,25.037]},
 {name:'Daan Forest Park',description:'A green breathing space in the heart of Taipei.',lon:121.5357,lat:25.0295,target:20,offset:[850,620,1000]},
 {name:'Liberty Square',description:'Blue-tiled roofs and a city’s shared history.',lon:121.5205,lat:25.0352,target:35,offset:[650,450,770]},
 {name:'Tamsui River',description:'Following the river toward the evening sun.',lon:121.5060,lat:25.0602,target:10,offset:[750,600,1000]},
 {name:'Songshan',description:'A quieter bend in the city, beside the Keelung River.',lon:121.5722,lat:25.0500,target:65,offset:[1000,620,800]},
 {name:'Shilin Night Market',description:'Food stalls and evening crowds along Dadong and Danan roads.',lon:121.52530,lat:25.08770,target:4,offset:[0,18,0],look:[121.52532,25.08870],market:true},
 {name:'Grand Hotel',description:'Red columns and golden roofs above the Keelung River.',lon:121.52630,lat:25.07860,target:45,offset:[-135,110,260],groundRelative:true}
];
for(const place of socialPlaces){const index=locations.length;locations.push(place);const button=document.createElement('button');button.className='place';button.dataset.place=index;button.innerHTML=`<span class="place-number">${String(index+1).padStart(2,'0')}</span><span>${place.name}<small>${place.zh}</small></span><span class="place-arrow">↗</span>`;$('.places').appendChild(button);}
const toast=message=>{const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(el.timer);el.timer=setTimeout(()=>el.classList.remove('show'),3000);};
function progress(value,message){$('#progress-bar').style.width=`${Math.round(value*100)}%`;if(message)$('#loading-message').textContent=message;}
function destination(index){const place=locations[index];if(place.market&&market)return market.destination();const origin=project(place.lon,place.lat),target=place.look?project(...place.look):origin.clone();target.y=place.target;const pos=origin.clone().add(new THREE.Vector3(...place.offset));if(place.groundRelative){const h=terrainHeight(terrain,origin.x,origin.z);pos.y+=h;target.y+=h;}pos.y=Math.max(pos.y,terrainHeight(terrain,pos.x,pos.z)+(place.minAltitude??80));return{pos,target};}
function selectPlace(index,instant=false){if(!ready)return;zooNavigation?.stop();activePlace=index;const p=locations[index],d=destination(index);$('#place-title').textContent=p.name;$('#place-description').textContent=p.description;$('#view-index').textContent=`${String(index+1).padStart(2,'0')} / ${String(locations.length).padStart(2,'0')}`;
 document.querySelectorAll('[data-place]').forEach((b,i)=>{b.classList.toggle('active',i===index);b.setAttribute('aria-current',i===index?'location':'false');});
 document.querySelector(`[data-place="${index}"]`)?.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});
 if(instant||reducedMotion){camera.position.copy(d.pos);controls.target.copy(d.target);controls.update();flight=null;}
 else{flight={start:performance.now(),duration:3600,from:camera.position.clone(),fromTarget:controls.target.clone(),...d};}
}
function setTour(on){touring=on;tourElapsed=0;controls.autoRotate=on&&!reducedMotion;$('#tour-label').textContent=on?'Pause the scenic route':'Take the scenic route';$('#tour-icon').textContent=on?'Ⅱ':'↗';$('#tour').setAttribute('aria-pressed',String(on));if(on){document.body.classList.remove('exploring');toast('A slow drift through Taipei · drag to take over');}}
function interacted(){if(!ready)return;zooNavigation?.stop();flight=null;if(touring)setTour(false);document.body.classList.add('exploring');clearTimeout(interactionTimer);interactionTimer=setTimeout(()=>document.body.classList.remove('exploring'),16000);}
function setLight(value){if(!lighting)return;const name=lighting.setTime(value);$('#time-label').textContent=name;$('#light-state').textContent=name.toUpperCase();}
function resize(){if(!renderer)return;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);}
function setQuality(q){renderer.setPixelRatio(Math.min(devicePixelRatio,q==='high'?2:q==='low'?1:1.5));renderer.shadowMap.enabled=q!=='low';renderer.shadowMap.needsUpdate=true;composer.setPixelRatio(renderer.getPixelRatio());composer.passes[1].enabled=q!=='low';resize();}
async function init(){
 try{
  renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;$('#scene').appendChild(renderer.domElement);renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','Explore Taipei with the mouse, touch, or WASD keys');
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();toast('Graphics paused. Reload the page to restore the scene.');});
  scene=new THREE.Scene();scene.fog=new THREE.FogExp2('#a7a294',.00005);camera=new THREE.PerspectiveCamera(48,innerWidth/innerHeight,3,70000);camera.position.set(4200,850,3500);
  controls=new OrbitControls(camera,renderer.domElement);controls.mouseButtons={LEFT:THREE.MOUSE.ROTATE,MIDDLE:THREE.MOUSE.PAN,RIGHT:THREE.MOUSE.PAN};renderer.domElement.addEventListener("mousedown",e=>{if(e.button===1)e.preventDefault();});renderer.domElement.addEventListener("auxclick",e=>{if(e.button===1)e.preventDefault();});controls.enableDamping=true;controls.dampingFactor=.065;controls.minDistance=30;controls.maxDistance=16000;controls.maxPolarAngle=Math.PI*.492;controls.screenSpacePanning=false;controls.autoRotateSpeed=.28;controls.zoomSpeed=.7;controls.panSpeed=.65;controls.addEventListener('start',interacted);
  lighting=createLighting(scene,renderer,dusk);setLight(38);lighting.refreshEnvironment();
  composer=new EffectComposer(renderer,new THREE.WebGLRenderTarget(innerWidth,innerHeight,{type:THREE.HalfFloatType,samples:4}));composer.addPass(new RenderPass(scene,camera));const bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.10,.5,2.5);composer.addPass(bloom);composer.addPass(new OutputPass());
  if(innerWidth<700){setQuality('low');$('#quality').value='low';}
  progress(.08,'Reading streets, parks & mountain contours');
  const [mapResponse,terrainResponse]=await Promise.all([fetch('/data/city.json',{cache:'no-cache'}),fetch('/data/terrain.json',{cache:'no-cache'})]);if(!mapResponse.ok||!terrainResponse.ok)throw Error('Map files could not be loaded.');const data=await mapResponse.json();terrain=await terrainResponse.json();
  makeTerrain(scene,terrain);progress(.16,'Following the rivers through the city');await new Promise(r=>setTimeout(r,20));
  const streets=makeStreets(scene,data,terrain);water=streets.river;infrastructure=streets.infrastructure;signals=await createSignals(scene,{reducedMotion});progress(.22,'Planting the parks and wooded hills');await new Promise(r=>setTimeout(r,20));
  createSports(scene,terrain);createRedHouse(scene,terrain);addMemorial(scene,terrain);await Promise.all([addTaipei101(scene,terrain),addCityLandmarks(scene,terrain)]);progress(.3,'Building Taipei’s skyline');
  await loadBuildings(scene,data.buildings,buildingMaterial(dusk),v=>progress(.3+v*.65,`Building Taipei’s skyline · ${Math.round(v*100)}%`));
  cityLife=await createCityLife(scene,dusk,{reducedMotion,terrain});makeTrees(scene,data.parks,terrain,cityLife.walkways);architecture=await createArchitectureDetails(scene,dusk);market=await createMarket(scene,dusk);publicPlaces=await createPublicPlaces(scene,dusk);zoo=await createZoo(scene,terrain,{reducedMotion});zooNavigation=createZooNavigation(zoo,terrain,{reducedMotion,visit:view=>{interacted();flight={start:performance.now(),duration:reducedMotion?1:2000,from:camera.position.clone(),fromTarget:controls.target.clone(),...view};$('#place-title').textContent=view.name;$('#place-description').textContent=view.zh||'';}});labelLayer=await createLabels(terrain,l=>{interacted();const target=new THREE.Vector3(l.x,terrainHeight(terrain,l.x,l.z)+l.height*.45,l.z),pos=target.clone().add(l.animal?new THREE.Vector3(30,25,40):new THREE.Vector3(420,Math.max(220,l.height),470));flight={start:performance.now(),duration:2800,from:camera.position.clone(),fromTarget:controls.target.clone(),pos,target};$('#place-title').textContent=l.name;$('#place-description').textContent=l.zh||'Explore the neighborhood.';$('#view-index').textContent='EXPLORE';document.querySelectorAll('[data-place]').forEach(b=>{b.classList.remove('active');b.setAttribute('aria-current','false');});});$('#data-stats').textContent=`${data.count.toLocaleString()} buildings · ${data.known.toLocaleString()} mapped heights · ${data.roads.length.toLocaleString()} street segments. Map snapshot: ${data.date.slice(0,10)}.`;
  renderer.shadowMap.needsUpdate=true;ready=true;selectPlace(0,true);progress(1,'Welcome to Taipei.');animate();await new Promise(r=>setTimeout(r,350));$('#loading').classList.add('done');setTimeout(()=>$('#loading').remove(),1200);window.__taipei={get ready(){return ready},renderer,scene,camera,controls,get place(){return activePlace},get touring(){return touring},audio,activity:cityLife,architecture,market,publicPlaces,zoo,zooNavigation,water,infrastructure,signals,labels:labelLayer,lighting,stats:{buildings:data.count,known:data.known}};
 }catch(e){console.error(e);$('#loading-message').textContent=`${e.message} Please reload to try again.`;$('#loading p').textContent='The city couldn’t load.';const retry=document.createElement('button');retry.className='primary';retry.textContent='Try again';retry.style.marginTop='24px';retry.onclick=()=>location.reload();$('#loading').appendChild(retry);}
}
function animate(){requestAnimationFrame(animate);const now=performance.now(),dt=Math.min((now-previousTime)/1000,.05);previousTime=now;elapsedTime+=dt;const time=elapsedTime;frame++;
 if(flight){let t=Math.min(1,(performance.now()-flight.start)/flight.duration),s=t*t*(3-2*t);camera.position.lerpVectors(flight.from,flight.pos,s);camera.position.y+=Math.sin(Math.PI*t)*Math.min(350,flight.from.distanceTo(flight.pos)*.12);controls.target.lerpVectors(flight.fromTarget,flight.target,s);if(t===1)flight=null;}
 if(keys.size&&!flight){const forward=new THREE.Vector3();camera.getWorldDirection(forward);forward.y=0;forward.normalize();const right=new THREE.Vector3().crossVectors(forward,camera.up),delta=new THREE.Vector3();let speed=dt*(keys.has('shift')?650:190);if(keys.has('w')||keys.has('arrowup'))delta.add(forward);if(keys.has('s')||keys.has('arrowdown'))delta.sub(forward);if(keys.has('d')||keys.has('arrowright'))delta.add(right);if(keys.has('a')||keys.has('arrowleft'))delta.sub(right);if(keys.has('e'))delta.y+=1;if(keys.has('q'))delta.y-=1;delta.multiplyScalar(speed);camera.position.add(delta);controls.target.add(delta);}
 zooNavigation?.update(dt,camera,controls,!!flight,locations[activePlace]?.id==='zoo');
 camera.position.x=THREE.MathUtils.clamp(camera.position.x,-10500,14000);camera.position.z=THREE.MathUtils.clamp(camera.position.z,-16000,11500);camera.position.y=THREE.MathUtils.clamp(camera.position.y,terrainHeight(terrain,camera.position.x,camera.position.z)+14,13000);controls.target.y=Math.max(0,controls.target.y);controls.update();
 if(touring){tourElapsed+=dt;if(tourElapsed>19){tourElapsed=0;selectPlace((activePlace+1)%locations.length);}}
 water?.update(time,camera,lighting,$('#quality').value,reducedMotion);signals?.update(time,camera,$('#quality').value);cityLife?.update(time,camera,controls.target,$('#quality').value);architecture?.update(time,camera,$('#quality').value);market?.update(time,camera,$('#quality').value);publicPlaces?.update(time,camera,$('#quality').value);zoo?.update(time,camera,$('#quality').value,$('#life-toggle').checked);
 if(frame%8===0){labelLayer?.update(camera,innerWidth,innerHeight,time);audio.update(camera.position.y);$('#altitude').textContent=`${Math.round(camera.position.y).toLocaleString()} M`;const dir=new THREE.Vector3();camera.getWorldDirection(dir);let degrees=(THREE.MathUtils.radToDeg(Math.atan2(dir.x,-dir.z))+360)%360;$('#heading').textContent=['N','NE','E','SE','S','SW','W','NW'][Math.round(degrees/45)%8];}
 lighting.update(camera);composer.render();
}
$('#audio-toggle').addEventListener('click',async()=>{try{const enabled=await audio.toggle();$('#audio-toggle').setAttribute('aria-pressed',String(enabled));$('#audio-toggle').setAttribute('aria-label',enabled?'Mute ambient sound':'Enable ambient sound');$('#audio-label').textContent=enabled?'Sound on':'Sound off';toast(enabled?'Wind, distant traffic & birds · an original soundscape':'Soundscape paused');}catch(e){toast('Audio is unavailable in this browser.');console.error(e);}});
$('#life-toggle').addEventListener('change',e=>cityLife?.setEnabled(e.target.checked));
$('#street-view').onclick=()=>{if(!cityLife)return;const view=locations[activePlace]?.id==='zoo'?zoo.streetView(controls.target):cityLife.streetView(controls.target);if(!view)return;interacted();flight={start:performance.now(),duration:3000,from:camera.position.clone(),fromTarget:controls.target.clone(),...view};toast('Street view · middle-drag to move, scroll to get closer');};
$('#volume').addEventListener('input',e=>{audio.setVolume(+e.target.value/100);$('#volume-label').textContent=`${e.target.value}%`;});
$('#time').addEventListener('input',e=>setLight(+e.target.value));$('#quality').addEventListener('change',e=>setQuality(e.target.value));$('#street-labels-toggle').addEventListener('change',e=>labelLayer?.setStreetsEnabled(e.target.checked));$('#labels-toggle').addEventListener('change',e=>$('#landmark-labels').hidden=!e.target.checked);
function panel(id){const open=$(`#${id}`).hidden;$('#settings').hidden=true;$('#help').hidden=true;$(`#${id}`).hidden=!open;$('#settings-toggle').setAttribute('aria-expanded',String(!$('#settings').hidden));}
$('#settings-toggle').onclick=()=>panel('settings');$('#help-toggle').onclick=()=>panel('help');document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>{$(`#${b.dataset.close}`).hidden=true;$('#settings-toggle').setAttribute('aria-expanded','false');});
$('#tour').onclick=()=>{if(ready)setTour(!touring);};document.querySelectorAll('[data-place]').forEach(b=>b.onclick=()=>{if(touring)setTour(false);selectPlace(+b.dataset.place);document.body.classList.add('exploring');clearTimeout(interactionTimer);interactionTimer=setTimeout(()=>document.body.classList.remove('exploring'),16000);});
$('#credits-toggle').onclick=()=>$('#credits').showModal();$('#credits-close').onclick=()=>$('#credits').close();$('#credits').addEventListener('click',e=>{if(e.target===$('#credits')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
window.addEventListener('resize',resize);window.addEventListener('keydown',e=>{if(e.key==='Escape'){zooNavigation?.stop();if(touring)setTour(false);$('#settings').hidden=true;$('#help').hidden=true;$('#settings-toggle').setAttribute('aria-expanded','false');return;}if(['INPUT','SELECT','TEXTAREA','BUTTON'].includes(e.target.tagName)||$('#credits').open)return;const key=e.key.toLowerCase();if(['w','a','s','d','q','e','shift','arrowup','arrowdown','arrowleft','arrowright'].includes(key)){e.preventDefault();keys.add(key);interacted();}if(key==='r'){if(touring)setTour(false);selectPlace(0);document.body.classList.remove('exploring');}if(key==='escape'){if(touring)setTour(false);$('#settings').hidden=true;$('#help').hidden=true;}});window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>keys.clear());
enableDestinationScroll($('.places'));
init();
