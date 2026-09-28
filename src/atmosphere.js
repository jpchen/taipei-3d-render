import * as THREE from 'three';

// Linear-light colors deliberately retain amber, rose and blue separation
// through filmic tone mapping, rather than blending into a neutral gray sky.
export function createAtmosphere(){
 const material=new THREE.ShaderMaterial({
  side:THREE.BackSide,depthWrite:false,
  uniforms:{sunDirection:{value:new THREE.Vector3(-1,.08,0)},evening:{value:.38}},
  vertexShader:`varying vec3 vRay;void main(){vRay=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`
   varying vec3 vRay;uniform vec3 sunDirection;uniform float evening;
   float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
   float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
   float fbm(vec2 p){float a=.5,v=0.;for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.03+17.1;a*=.5;}return v;}
   void main(){
    vec3 ray=normalize(vRay);float y=max(ray.y,0.),night=smoothstep(.68,1.,evening),gold=smoothstep(.08,.32,evening);
    vec3 zenith=mix(vec3(.09,.27,.53),vec3(.035,.14,.32),gold);
    zenith=mix(zenith,vec3(.013,.025,.085),night);
    vec3 horizon=mix(vec3(.95,.59,.26),vec3(1.15,.34,.085),gold);
    horizon=mix(horizon,vec3(.27,.095,.19),night);
    vec2 horizontal=ray.xz/max(length(ray.xz),.001);
    float sunFacing=pow(max(dot(horizontal,normalize(sunDirection.xz)),0.),3.);
    horizon=mix(horizon,mix(vec3(1.8,.72,.16),vec3(.42,.13,.19),night),sunFacing*.68);
    vec3 color=mix(horizon,zenith,pow(smoothstep(-.01,.58,y),.62));
    float rose=exp(-pow((y-.12)/.11,2.));
    color+=vec3(.12,.018,.035)*rose*(1.-night)*gold;
    float alignment=max(dot(ray,normalize(sunDirection)),0.);
    color+=vec3(1.,.38,.065)*pow(alignment,45.)*.24*(1.-night);
    float disc=smoothstep(.999959,.999973,alignment);
    color+=vec3(5.,2.5,.70)*disc*(1.-night);
    vec2 uv=ray.xz/max(ray.y+.20,.08);uv=uv*vec2(1.4,6.2)+vec2(9.,-3.);
    float field=fbm(uv),cloud=smoothstep(.51,.73,field)*smoothstep(.025,.16,y)*(1.-smoothstep(.5,.85,y));
    vec3 cloudColor=mix(vec3(.60,.32,.26),vec3(.12,.13,.24),night);
    cloudColor+=vec3(.50,.16,.025)*sunFacing*(1.-night);
    color=mix(color,cloudColor,cloud*.44);
    gl_FragColor=vec4(color,1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }
  `,
 });
 const mesh=new THREE.Mesh(new THREE.SphereGeometry(45000,48,24),material);mesh.frustumCulled=false;mesh.renderOrder=-10;return mesh;
}
