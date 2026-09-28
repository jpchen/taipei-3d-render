import * as THREE from 'three';
import { createAtmosphere } from './atmosphere.js';

export const LIGHT_STOPS = [
  {time:0, elevation:16, sun:'#ffe0ae', sunPower:4.5, sky:'#b5d5ff', ground:'#d9b37d', ambient:2.05, bounce:'#ffe3ad', bouncePower:.70, fog:'#d7c4ab', haze:.000028, exposure:.98, glow:.025},
  {time:.38, elevation:5.7, sun:'#ffb65a', sunPower:4.2, sky:'#a1c7f0', ground:'#e8aa66', ambient:2.15, bounce:'#ffc887', bouncePower:1.05, fog:'#e8b98c', haze:.000032, exposure:1.03, glow:.12},
  {time:.68, elevation:.9, sun:'#ff8746', sunPower:2.1, sky:'#9bacdf', ground:'#bc7e68', ambient:1.55, bounce:'#eda385', bouncePower:.68, fog:'#bb8f92', haze:.000037, exposure:1.0, glow:.60},
  {time:1, elevation:-4, sun:'#ed876e', sunPower:0, sky:'#7692d2', ground:'#48577b', ambient:.72, bounce:'#859cdb', bouncePower:.24, fog:'#495879', haze:.000046, exposure:.95, glow:1.4},
];

export function lightingAt(value){
  const t=THREE.MathUtils.clamp(value/100,0,1);
  const end=LIGHT_STOPS.findIndex(stop=>stop.time>=t),a=LIGHT_STOPS[Math.max(0,end-1)],b=LIGHT_STOPS[end<0?LIGHT_STOPS.length-1:end];
  const fraction=a===b?0:(t-a.time)/(b.time-a.time),state={t};
  for(const key of Object.keys(a)){
    if(typeof a[key]==='number')state[key]=THREE.MathUtils.lerp(a[key],b[key],fraction);
    else state[key]=new THREE.Color(a[key]).lerp(new THREE.Color(b[key]),fraction);
  }
  state.name=t<.22?'Late afternoon':t<.66?'Golden hour':t<.87?'Afterglow':'Blue hour';
  return state;
}

export function createLighting(scene,renderer,glow){
  const atmosphere=createAtmosphere();scene.add(atmosphere);
  const hemisphere=new THREE.HemisphereLight();scene.add(hemisphere);
  const sun=new THREE.DirectionalLight();sun.name='Low golden sun';sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
  Object.assign(sun.shadow.camera,{left:-2300,right:2300,top:2300,bottom:-2300,near:10,far:15000});
  sun.shadow.bias=-.00015;sun.shadow.normalBias=1.1;sun.target.position.set(2200,0,1800);scene.add(sun,sun.target);
  const bounce=new THREE.DirectionalLight();bounce.name='Warm reflected city light';bounce.position.set(7000,3500,6500);bounce.target.position.copy(sun.target.position);scene.add(bounce,bounce.target);
  const generator=new THREE.PMREMGenerator(renderer),environmentScene=new THREE.Scene();
  // The environment uses the same atmosphere as the visible sky. Its 45 km
  // radius requires a far plane larger than PMREM's default 100 meters.
  const environmentSky=new THREE.Mesh(atmosphere.geometry,atmosphere.material);environmentScene.add(environmentSky);
  let environment=null,state=lightingAt(38),timer=null;
  const direction=new THREE.Vector3();
  function refreshEnvironment(){
    const next=generator.fromScene(environmentScene,.045,1,70000,{size:128});
    const old=environment;environment=next;scene.environment=next.texture;old?.dispose();
  }
  function setTime(value){
    state=lightingAt(value);direction.setFromSphericalCoords(1,THREE.MathUtils.degToRad(90-state.elevation),THREE.MathUtils.degToRad(266));
    atmosphere.material.uniforms.sunDirection.value.copy(direction);atmosphere.material.uniforms.evening.value=state.t;
    sun.position.copy(direction).multiplyScalar(7000).add(sun.target.position);sun.intensity=state.sunPower;sun.color.copy(state.sun);
    hemisphere.color.copy(state.sky);hemisphere.groundColor.copy(state.ground);hemisphere.intensity=state.ambient;
    bounce.color.copy(state.bounce);bounce.intensity=state.bouncePower;
    scene.fog.color.copy(state.fog);scene.fog.density=state.haze;scene.environmentIntensity=THREE.MathUtils.lerp(.62,.26,state.t);
    renderer.toneMappingExposure=state.exposure;renderer.shadowMap.needsUpdate=true;glow.value=state.glow;
    clearTimeout(timer);timer=setTimeout(refreshEnvironment,180);
    return state.name;
  }
  function update(camera){
    // Keep the sky centered as the viewer crosses the basin, without affecting
    // the origin-centered copy used for reflections.
    atmosphere.position.copy(camera.position);
  }
  return {setTime,update,refreshEnvironment,get state(){return state;},sun,hemisphere};
}
