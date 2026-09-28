import test from 'node:test';
import assert from 'node:assert/strict';
import { lightingAt } from '../src/lighting.js';

test('golden-hour illumination is warm and daytime windows stay restrained',()=>{
 const golden=lightingAt(38),afternoon=lightingAt(0),night=lightingAt(100);
 assert.ok(golden.sun.r>golden.sun.g*1.6&&golden.sun.g>golden.sun.b*2);
 assert.ok(golden.sun.r/golden.sun.b>afternoon.sun.r/afternoon.sun.b);
 assert.ok(golden.sunPower>3&&golden.ambient>1,'buildings remain illuminated');
 assert.ok(golden.glow<.2&&night.glow>1,'lit windows emerge after sunset');
 assert.equal(night.sunPower,0);
});

test('light transitions remain finite, continuous, and cover the entire slider',()=>{
 let previous=lightingAt(0);
 for(let value=1;value<=1000;value++){
  const next=lightingAt(value/10);
  for(const field of ['sunPower','ambient','bouncePower','haze','exposure','glow','elevation']){
   assert.ok(Number.isFinite(next[field]),field);
   assert.ok(Math.abs(next[field]-previous[field])<.1,`discontinuous ${field}`);
  }
  for(const field of ['sun','sky','ground','bounce','fog']){
   for(const component of ['r','g','b'])assert.ok(Number.isFinite(next[field][component])&&next[field][component]>=0);
  }
  previous=next;
 }
 assert.equal(lightingAt(-10).name,'Late afternoon');assert.equal(lightingAt(120).name,'Blue hour');
});
