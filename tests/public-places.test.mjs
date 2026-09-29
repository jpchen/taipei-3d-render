import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const {places}=JSON.parse(readFileSync('public/data/places.json'));
test('every gathering destination has mapped walkways, bounded props, and finite coordinates',()=>{
 for(const p of places){assert.ok(p.routes.length>0,p.id);assert.ok(p.props.length>0&&p.props.length<=100,p.id);assert.ok(p.routes.every(r=>r.k==='walk'&&r.p.length>1));for(const prop of p.props)assert.ok([prop.x,prop.y,prop.z,prop.angle].every(Number.isFinite));const unique=new Set(p.props.map(p=>`${p.x},${p.z}`));assert.equal(unique.size,p.props.length);}
});
