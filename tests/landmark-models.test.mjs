import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import * as THREE from 'three';
import {addCityLandmarks,addMemorial} from '../src/world.js';
const terrain=JSON.parse(readFileSync('public/data/terrain.json'));
test('all landmark models load locally and the station stays within its footprint envelope',async()=>{
 const fetchBefore=globalThis.fetch,RequestBefore=globalThis.Request,ProgressBefore=globalThis.ProgressEvent;
 globalThis.Request=class extends RequestBefore{constructor(url,init){super(new URL(url,'http://local.test'),init);}};
 globalThis.ProgressEvent=class{constructor(type,values){Object.assign(this,{type},values);}};
 globalThis.fetch=async request=>new Response(readFileSync('public'+new URL(request.url||request).pathname));
 try{
  const scene=new THREE.Scene();addMemorial(scene,terrain);await addCityLandmarks(scene,terrain);
  for(const name of ['taipei-main-station','grand-hotel','grand-hotel-staircase','grand-hotel-entrance-gate','national-theater','national-concert-hall','cks-memorial'])assert.ok(scene.getObjectByName(name),name);
  const station=scene.getObjectByName('taipei-main-station');assert.equal(station.rotation.y,-.19);station.rotation.y=0;station.position.set(0,0,0);const size=new THREE.Box3().setFromObject(station).getSize(new THREE.Vector3());assert.ok(Math.abs(size.x-156)<.01);assert.ok(Math.abs(size.z-127)<.01);
  scene.traverse(o=>{if(o.isMesh)assert.ok(o.geometry?.attributes.position?.count>0);});
 }finally{globalThis.fetch=fetchBefore;globalThis.Request=RequestBefore;globalThis.ProgressEvent=ProgressBefore;}
});
