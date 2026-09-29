import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {sites,replacedByLandmark,stationAncillaryHeight} from '../src/landmark-layout.js';
import {createCivicHalls} from '../src/civic-landmarks.js';
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
