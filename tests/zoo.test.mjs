import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {animalPosition} from '../src/zoo.js';import {insidePolygon} from '../src/landmark-layout.js';
const data=JSON.parse(readFileSync('public/data/zoo.json'));
test('zoo animals stay inside bounded habitats at mapped animal POIs',()=>{
 assert.equal(data.habitats.length,4);for(const h of data.habitats){assert.ok(insidePolygon([h.x,h.z],data.boundary));for(let t=0;t<300;t+=5)for(let i=0;i<h.count;i++){const p=animalPosition(h,i,t);assert.ok(Math.hypot(p.x-h.x,p.z-h.z)<h.radius-2);assert.ok([p.x,p.z,p.angle].every(Number.isFinite));}}
});
test('animal models have valid GLB headers and zoo walking paths are kept out of vehicle routes',()=>{
 for(const h of data.habitats){const b=readFileSync(`public/models/zoo-${h.species}.glb`);assert.equal(b.readUInt32LE(0),0x46546c67);assert.equal(b.readUInt32LE(8),b.length);}
 const {routes}=JSON.parse(readFileSync('public/data/activity.json'));for(const r of routes)assert.ok(!['footway','pedestrian','path','steps'].includes(r.k),`walkway treated as traffic ${r.id}`);assert.ok(routes.some(r=>r.place==='zoo'&&r.k==='walk'));
});
