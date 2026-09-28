import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
const json=async name=>JSON.parse(await readFile(new URL(`../public/data/${name}.json`,import.meta.url),'utf8'));

test('all building tiles match their content hashes and vertex layouts',async()=>{
 const city=await json('city');assert.ok(city.count>60000);assert.equal(city.format,2);assert.equal(city.styleCounts.reduce((a,b)=>a+b),city.count);
 const palette=new Set();
 for(const tile of city.buildings){
  const compressed=await readFile(new URL(`../public/data/buildings/${tile.file}`,import.meta.url));const data=gunzipSync(compressed),hash=createHash('sha256').update(data).digest('hex').slice(0,8);
  assert.ok(tile.file.includes(hash));assert.equal(data.byteLength,tile.bytes);assert.equal(tile.indexOffset+tile.indices*4,data.byteLength);assert.equal(tile.styleOffset,tile.vertices*18);assert.equal(tile.uvOffset,tile.vertices*20);
  for(let i=0;i<tile.indices;i++)assert.ok(data.readUInt32LE(tile.indexOffset+i*4)<tile.vertices);
  for(let i=0;i<tile.vertices;i+=7){assert.ok(data[tile.styleOffset+i*2]<=5);for(let j=0;j<3;j++)assert.ok(Number.isFinite(data.readFloatLE(i*12+j*4)));if(data.readInt8(tile.vertices*12+i*3+1)===0){for(let axis=0;axis<2;axis++){const bays=data.readFloatLE(tile.uvOffset+i*8+axis*4);assert.equal(bays,Math.round(bays),'facade edges must end on complete window bays');}}const offset=tile.vertices*15+i*3;palette.add(data.subarray(offset,offset+3).toString('hex'));}
 }
 assert.ok(palette.size>40,'architectural surfaces must have substantial color variety');
});

test('labels retain bilingual major places and thousands of named streets',async()=>{
 const data=await json('labels');assert.ok(data.landmarks.length>=100);assert.ok(data.streets.length>1000);
 for(const name of ['Taipei 101','Taipei Dome','Taipei Main Station','Sun Yat-sen Memorial Hall','Daan Forest Park']){const place=data.landmarks.find(l=>l.name===name);assert.ok(place,name);assert.ok(place.zh);assert.ok(Number.isFinite(place.x)&&Number.isFinite(place.z));}
 for(const s of data.streets){assert.ok(s.name&&s.zh);assert.ok(Math.abs(Math.hypot(s.dx,s.dz)-1)<.001);}
});
