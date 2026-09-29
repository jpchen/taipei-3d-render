import test from 'node:test';import assert from 'node:assert/strict';
import {buildRoadNetwork} from '../src/roads.js';
const terrain={n:1,bounds:[121.53,25.04,121.55,25.06],heights:[15,15,15,15]};
test('viaducts, deck levels and connecting approaches share heights; tunnels stay hidden',()=>{
 const network=buildRoadNetwork([{id:1,t:{highway:'primary',bridge:'viaduct',layer:'2'},p:[[121.54,25.05],[121.543,25.05]]},{id:2,t:{highway:'primary'},p:[[121.537,25.05],[121.54,25.05]]},{id:3,t:{highway:'primary',tunnel:'yes'},p:[[121.54,25.05],[121.543,25.05]]}],terrain);
 assert.equal(network.length,2);const [bridge,ramp]=network;assert.ok(bridge.bridge);assert.ok(ramp.ramp);assert.equal(bridge.p[0][2],ramp.p.at(-1)[2]);assert.equal(ramp.p[0][2],3);assert.equal(bridge.p[0][2],19);for(const r of network)for(const p of r.p)assert.ok(p.every(Number.isFinite));
});
