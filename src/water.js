import * as THREE from 'three';
import {Water} from 'three/addons/objects/Water.js';

function rippleNormals(){
 const n=256,bytes=new Uint8Array(n*n*4),waves=Array.from({length:14},(_,i)=>({x:((i*7+3)%19)-9,y:((i*11+5)%17)-8,phase:i*2.399,amplitude:.023}));
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){let dx=0,dy=0;for(const w of waves){const c=Math.cos((w.x*x+w.y*y)/n*Math.PI*2+w.phase)*w.amplitude;dx+=c*w.x/9;dy+=c*w.y/9;}const v=new THREE.Vector3(dx,dy,1).normalize(),i=(y*n+x)*4;bytes.set([Math.round((v.x*.5+.5)*255),Math.round((v.y*.5+.5)*255),Math.round((v.z*.5+.5)*255),255],i);}
 const texture=new THREE.DataTexture(bytes,n,n);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.generateMipmaps=true;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter;texture.needsUpdate=true;return texture;
}
export function createRiverWater(geometry){
 // Water's reflection plane is local XY. Preserve geographic world XZ geometry.
 geometry.translate(0,-2.2,0).rotateX(Math.PI/2);
 const mesh=new Water(geometry,{textureWidth:512,textureHeight:512,waterNormals:rippleNormals(),waterColor:'#254f4e',sunColor:'#ffd29c',distortionScale:2.5,fog:true});
 mesh.name='Reflective rivers';mesh.rotation.x=-Math.PI/2;mesh.position.y=2.2;mesh.receiveShadow=true;
 const material=mesh.material,u=material.uniforms;
 Object.assign(u,{planarStrength:{value:1},skyTint:{value:new THREE.Color('#b5cde0')},horizonTint:{value:new THREE.Color('#e8b98c')}});
 const start=material.fragmentShader.indexOf('vec4 getNoise('),end=material.fragmentShader.indexOf('void sunLight',start);
 material.fragmentShader=material.fragmentShader.slice(0,start)+`uniform float planarStrength;uniform vec3 skyTint;uniform vec3 horizonTint;
 vec4 getNoise(vec2 uv){
  vec2 flow=uv.x>-1800.?vec2(-.9,.12):vec2(-.25,-.85);
  vec2 p=uv-flow*time*1.15;
  vec3 a=texture2D(normalSampler,p/43.).xyz*2.-1.;
  vec3 b=texture2D(normalSampler,(p+vec2(time*.25,0.))/137.).xyz*2.-1.;
  vec3 c=texture2D(normalSampler,(p.yx-vec2(time*.12,0.))/79.).xyz*2.-1.;
  return vec4((a.xy+b.xy*.7+c.xy*.35)*.6,1.,1.);
 }
 `+material.fragmentShader.slice(end);
 material.fragmentShader=material.fragmentShader.replace('vec3 outgoingLight = albedo;',`vec3 reflectedDirection=reflect(-eyeDirection,surfaceNormal);
 vec3 sky=mix(horizonTint,skyTint,smoothstep(0.,.65,max(0.,reflectedDirection.y)));
 vec3 reflected=mix(sky,reflectionSample,planarStrength);
 float fresnel=.06+.94*pow(1.-theta,4.);
 vec3 outgoingLight=mix(waterColor*.65+sky*.10,reflected,fresnel)+specularLight*.4;`);
 const reflect=mesh.onBeforeRender;let lastReflection=-Infinity,quality='balanced',time=0;
 const stats={reflectionFrames:0,reflectionSize:512,reflectionHz:8,mode:'planar',flowTime:0};
 mesh.onBeforeRender=(renderer,scene,camera)=>{
  u.eye.value.copy(camera.position);
  if(quality==='low'||document.hidden||time-lastReflection<1/stats.reflectionHz)return;
  lastReflection=time;const hidden=[];
  // Reflections retain terrain, architecture and landmark silhouettes. Tiny
  // agents/roof accessories are not worth drawing twice at 512 pixels.
  for(const object of scene.children)if(object.visible&&(object.isInstancedMesh||object.name.startsWith('Shilin:'))){hidden.push(object);object.visible=false;}
  try{reflect.call(mesh,renderer,scene,camera);stats.reflectionFrames++;}finally{for(const object of hidden)object.visible=true;}
 };
 function update(elapsed,camera,lighting,nextQuality,reducedMotion){
  time=elapsed;quality=nextQuality;u.time.value=reducedMotion?0:elapsed;stats.flowTime=u.time.value;
  stats.reflectionHz=quality==='high'?12:8;stats.mode=quality==='low'?'sky':'planar';u.planarStrength.value=quality==='low'?0:1;
  u.eye.value.copy(camera.position);u.sunDirection.value.copy(lighting.sun.position).sub(lighting.sun.target.position).normalize();
  u.sunColor.value.copy(lighting.sun.color).multiplyScalar(lighting.sun.intensity*.35);u.skyTint.value.copy(lighting.state.sky);u.horizonTint.value.copy(lighting.state.fog);
 }
 return {mesh,material,update,stats};
}
