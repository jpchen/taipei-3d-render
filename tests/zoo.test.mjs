import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {animalPosition} from '../src/zoo.js';import {insidePolygon} from '../src/landmark-layout.js';
const data=JSON.parse(readFileSync('public/data/zoo.json'));
test('zoo animals stay inside bounded habitats at mapped animal POIs',()=>{
 assert.equal(data.habitats.length,8);for(const h of data.habitats){assert.ok(insidePolygon([h.x,h.z],data.boundary));for(let t=0;t<300;t+=5)for(let i=0;i<h.count;i++){const p=animalPosition(h,i,t);assert.ok(Math.hypot(p.x-h.x,p.z-h.z)<h.radius-2);assert.ok(insidePolygon([p.x,p.z],h.footprint));assert.ok([p.x,p.z,p.angle].every(Number.isFinite));}}
});
test('animal models have valid GLB headers and zoo walking paths are kept out of vehicle routes',()=>{
 for(const h of data.habitats){const b=readFileSync(`public/models/zoo-${h.species}.glb`);assert.equal(b.readUInt32LE(0),0x46546c67);assert.equal(b.readUInt32LE(8),b.length);}
 const {routes}=JSON.parse(readFileSync('public/data/activity.json'));for(const r of routes)assert.ok(!['footway','pedestrian','path','steps'].includes(r.k),`walkway treated as traffic ${r.id}`);assert.ok(routes.some(r=>r.place==='zoo'&&r.k==='walk'));
});

import {cableRoute,gondolaPose} from '../src/zoo-gondola.js';import {terrainHeight} from '../src/terrain.js';
test('visitor trail connects the mapped entrance, every animal stop and Zoo South',()=>{
 assert.equal(data.entrance.id,4360375170);assert.equal(data.trail.length,data.stops.length-1);
 for(const leg of data.trail){assert.ok(leg.p.length>1);for(let i=1;i<leg.p.length;i++){const a=leg.p[i-1],b=leg.p[i];assert.ok(data.paths.some(w=>w.p.some((p,j)=>j&&((Math.hypot(p[0]-a[0],p[1]-a[1])<1.6&&Math.hypot(w.p[j-1][0]-b[0],w.p[j-1][1]-b[1])<1.6)||(Math.hypot(p[0]-b[0],p[1]-b[1])<1.6&&Math.hypot(w.p[j-1][0]-a[0],w.p[j-1][1]-a[1])<1.6)))),'trail must follow mapped path edges');}}
});
test('gondola follows mapped stations and cabins clear the terrain on both sides',()=>{
 const terrain=JSON.parse(readFileSync('public/data/terrain.json')),r=cableRoute(data.gondola,terrain);assert.equal(r.points[0].id,281229842);assert.equal(r.points.at(-1).id,848228319);assert.ok(r.length>1000);
 for(let d=0;d<r.length*2;d+=3){const p=gondolaPose(r,d);assert.ok([p.x,p.y,p.z,p.angle].every(Number.isFinite));assert.ok(p.y-3.5>terrainHeight(terrain,p.x,p.z)+5,'cabin terrain clearance');}
});

test('outdoor habitat footprints leave the mapped visitor paths clear',()=>{
 for(const h of data.habitats.filter(h=>!h.indoor))for(const w of data.paths)for(let i=1;i<w.p.length;i++)for(let j=0;j<=10;j++){const a=w.p[i-1],b=w.p[i],p=a.map((v,k)=>v+(b[k]-v)*j/10);assert.ok(!insidePolygon(p,h.footprint),`${h.species} blocks mapped path ${w.id}`);}
});

import * as THREE from 'three';import {createZooGrounds} from '../src/zoo-grounds.js';import {createZooGondola} from '../src/zoo-gondola.js';import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
test('zoo grounds and gondola build finite geometry, reveal indoor exhibits and animate pooled cabins',()=>{
 const previous=globalThis.document;globalThis.document={hidden:false,createElement:()=>({width:0,height:0,getContext:()=>({fillRect(){},fillText(){}})})};
 try{
  const terrain=JSON.parse(readFileSync('public/data/terrain.json')),group=new THREE.Group(),grounds=createZooGrounds(group,data,terrain),scene=new THREE.Scene(),gondola=createZooGondola(scene,data,terrain),camera=new THREE.PerspectiveCamera(50,1,.1,40000),p=data.gondola.at(-1).p;camera.position.set(p[0],terrainHeight(terrain,...p)+50,p[1]+50);
  gondola.update(1,camera,'balanced');assert.ok(gondola.stats.visibleCabins>0);const first=Array.from(gondola.cabins.instanceMatrix.array);gondola.update(2,camera,'balanced');assert.notDeepEqual(Array.from(gondola.cabins.instanceMatrix.array),first);gondola.update(3,camera,'balanced',false);assert.equal(gondola.stats.visibleCabins,0);
  for(const {h,mesh} of grounds.roofs){camera.position.set(h.x,terrainHeight(terrain,h.x,h.z)+40,h.z);grounds.update(camera);assert.equal(mesh.visible,false);camera.position.y+=500;grounds.update(camera);assert.equal(mesh.visible,true);}
  for(const root of [group,scene])root.traverse(o=>{if(o.geometry){assert.ok(o.geometry.attributes.position.count>0);assert.ok(Array.from(o.geometry.attributes.position.array).every(Number.isFinite),o.name);}});
 }finally{globalThis.document=previous;}
});
test('all eight animal GLBs parse with visible, correctly sized geometry',async()=>{
 for(const h of data.habitats){const b=readFileSync(`public/models/zoo-${h.species}.glb`),gltf=await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),''),size=new THREE.Box3().setFromObject(gltf.scene).getSize(new THREE.Vector3());assert.ok(size.y>.5&&size.y<6,h.species);assert.ok(size.x>0&&size.z>0);}
});
