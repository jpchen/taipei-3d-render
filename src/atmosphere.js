import * as THREE from 'three';
// A restrained atmospheric sky with high, wind-stretched cloud layers.
export function createAtmosphere(){
 const mat=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{sunDirection:{value:new THREE.Vector3(-1,.08,0)},evening:{value:.38}},vertexShader:`varying vec3 vRay;void main(){vRay=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,fragmentShader:`
 varying vec3 vRay;uniform vec3 sunDirection;uniform float evening;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
 float fbm(vec2 p){float a=.5,v=0.;for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.03+17.1;a*=.5;}return v;}
 void main(){vec3 ray=normalize(vRay);float y=max(ray.y,0.);float dusk=smoothstep(.55,1.,evening);
 vec3 zenith=mix(vec3(.21,.36,.45),vec3(.035,.055,.14),dusk);
 vec3 horizon=mix(vec3(.86,.54,.32),vec3(.29,.20,.33),dusk);
 float sunFacing=pow(max(dot(normalize(ray.xz),normalize(sunDirection.xz)),0.),4.);
 horizon=mix(horizon,mix(vec3(1.0,.73,.43),vec3(.50,.28,.32),dusk),sunFacing*.75);
 vec3 color=mix(horizon,zenith,pow(smoothstep(-.04,.8,y),.43));
 float alignment=max(dot(ray,normalize(sunDirection)),0.);
 color+=vec3(1.,.62,.30)*pow(alignment,38.)*.18*(1.-dusk);
 float disc=smoothstep(.999977,.99999,alignment);color+=vec3(3.,2.2,1.3)*disc*(1.-dusk);
 vec2 uv=ray.xz/max(ray.y+.22,.08);uv=uv*vec2(1.3,5.0)+vec2(9.,-3.);
 float cloud=smoothstep(.53,.75,fbm(uv))*smoothstep(.025,.17,y)*(1.-smoothstep(.5,.85,y));
 vec3 cloudColor=mix(vec3(.70,.59,.54),vec3(.18,.16,.25),dusk);cloudColor+=vec3(.22,.075,.015)*sunFacing*(1.-dusk);
 color=mix(color,cloudColor,cloud*.45);
 gl_FragColor=vec4(color,1.);#include <tonemapping_fragment>\n#include <colorspace_fragment>
 }`.replace(';#include',';\n#include')});
 const mesh=new THREE.Mesh(new THREE.SphereGeometry(45000,48,24),mat);mesh.frustumCulled=false;mesh.renderOrder=-10;return mesh;
}
