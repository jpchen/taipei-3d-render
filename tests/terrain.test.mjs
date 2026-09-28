import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {terrainHeight,drapeGeometry} from '../src/terrain.js';
const data={bounds:[121.54,25.049,121.541,25.05],n:1,heights:[12,12,12,112]};
test('road triangles follow the rendered terrain even across its diagonal',()=>{
 const g=new THREE.PlaneGeometry(90,100).rotateX(-Math.PI/2).translate(50,0,55),draped=drapeGeometry(g,data,.24),p=draped.attributes.position;
 assert.ok(p.count>6);for(let i=0;i<p.count;i+=3){for(const weights of [[1/3,1/3,1/3],[.1,.2,.7]]){const v=new THREE.Vector3();for(let k=0;k<3;k++)v.addScaledVector(new THREE.Vector3().fromBufferAttribute(p,i+k),weights[k]);assert.ok(Math.abs(v.y-terrainHeight(data,v.x,v.z)-.24)<.001);}}
 assert.ok(Math.abs(terrainHeight(data,25,25)-1)<.001);
});
