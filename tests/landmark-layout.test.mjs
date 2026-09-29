import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {sites,replacedByLandmark,stationAncillaryHeight} from '../src/landmark-layout.js';
import {createCivicHalls,createHotelStaircase,hotelStairProfile} from '../src/civic-landmarks.js';
import {terrainHeight} from '../src/terrain.js';
const raw=JSON.parse(readFileSync('assets/map-source.json')).elements,terrain=JSON.parse(readFileSync('public/data/terrain.json'));
test('mapped landmarks replace their generic footprint, without removing neighboring buildings',()=>{
 for(const s of sites){assert.ok(replacedByLandmark(s.id,s.footprint));assert.ok(Math.abs(s.angle)>.15);}
 const neighbor=raw.find(e=>e.id===204711206);assert.equal(replacedByLandmark(neighbor.id,neighbor.p),false);
 assert.equal(stationAncillaryHeight({building:'roof'},[121.5171,25.047]),3.5);
 assert.equal(stationAncillaryHeight({building:'service',height:'12'},[121.5171,25.047]),null);
});
test('Liberty Square halls face each other and fit their mapped sites',()=>{
 const scene=new THREE.Scene();createCivicHalls(scene,terrain);const [a,b]=scene.children;
 const delta=b.position.clone().sub(a.position).setY(0).normalize();
 assert.ok(new THREE.Vector3(0,0,1).applyEuler(a.rotation).dot(delta)>.999);
 assert.ok(new THREE.Vector3(0,0,1).applyEuler(b.rotation).dot(delta)<-.999);
 for(const hall of scene.children){
  const site=sites.find(s=>s.name===hall.name);assert.equal(hall.children.length,3);
  const clone=hall.clone();clone.rotation.set(0,0,0);clone.position.set(0,0,0);const size=new THREE.Box3().setFromObject(clone).getSize(new THREE.Vector3());assert.ok(size.x<=site.width);assert.ok(size.z<=site.depth);
  for(const mesh of hall.children){assert.ok(mesh.geometry.attributes.position.count>0);assert.ok(Array.from(mesh.geometry.attributes.position.array).every(Number.isFinite));}
 }
});
test('hotel staircase has six descending flights, landings, and a terrain-height lower connection',()=>{
 const scene=new THREE.Scene(),stairs=createHotelStaircase(scene,terrain),p=hotelStairProfile(terrain);assert.equal(stairs.children.length,1);assert.equal(stairs.userData.steps,84);assert.equal(stairs.userData.landings,6);assert.ok(p.top-p.bottom>10);
 const bottom=terrainHeight(terrain,p.x+Math.sin(p.site.angle)*p.end,p.z+Math.cos(p.site.angle)*p.end);assert.ok(p.ground+p.bottom>=bottom+.35-1e-6);
 // Every tread surface must stay above the coarse terrain at its center.
 const run=(p.end-p.start)/p.flights,drop=(p.top-p.bottom)/p.flights;
 for(let flight=0;flight<p.flights;flight++)for(let step=0;step<p.stepsPerFlight;step++){
  const d=p.start+flight*run+(step+.5)*(run-3)/p.stepsPerFlight,height=p.ground+p.top-flight*drop-(step+1)*drop/p.stepsPerFlight;
  for(const u of [-16,0,16])assert.ok(height>=terrainHeight(terrain,p.x+Math.cos(p.site.angle)*u+Math.sin(p.site.angle)*d,p.z-Math.sin(p.site.angle)*u+Math.cos(p.site.angle)*d),`buried step ${flight}/${step}/${u}`);
 }
});
