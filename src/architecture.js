import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export function buildingMaterial(dusk){
 const mat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.78,metalness:.08});
 mat.onBeforeCompile=s=>{
  s.uniforms.uDusk=dusk;
  s.vertexShader='attribute vec2 facadeStyle; varying vec2 vStyle; varying vec2 vFacadeUV; varying vec3 vWorld; varying vec3 vFace;\n'+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
   vWorld=(modelMatrix*vec4(transformed,1.)).xyz;vFace=normalize(mat3(modelMatrix)*normal);vStyle=facadeStyle;vFacadeUV=uv;
  `);
  s.fragmentShader=`varying vec2 vStyle;varying vec2 vFacadeUV;varying vec3 vWorld;varying vec3 vFace;uniform float uDusk;
   float rectMask(vec2 cell,vec2 low,vec2 high,vec2 aa){vec2 a=smoothstep(low-aa,low+aa,cell)*(1.-smoothstep(high-aa,high+aa,cell));return a.x*a.y;}
   float roomHash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
  `+s.fragmentShader;
  s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   float style=vStyle.x,seed=vStyle.y/255.;
   float wall=1.-step(.45,abs(vFace.y));
   float glass=1.-step(.4,abs(style-1.));
   float tile=1.-step(.4,abs(style-2.));
   float brick=1.-step(.4,abs(style-3.));
   float metal=1.-step(.4,abs(style-4.));
   float distanceFade=1.-smoothstep(650.,2900.,distance(vWorld,cameraPosition));
   vec2 baySize=vec2(mix(2.7,4.2,seed),mix(3.05,3.6,seed));
   vec2 grid=vFacadeUV,cell=fract(grid),aa=max(fwidth(grid),vec2(.006));
   float window=rectMask(cell,mix(vec2(.17,.23),vec2(.035,.045),glass),mix(vec2(.78,.78),vec2(.965,.96),glass),aa)*wall;
   float room=roomHash(floor(grid)+seed*193.);
   vec3 glazing=mix(vec3(.095,.17,.20),vec3(.20,.34,.36),glass);
   glazing=mix(glazing,vec3(.50,.43,.31),step(.81,room)*(1.-glass)*.6);
   float coverage=mix(.30,.85,glass);
   diffuseColor.rgb=mix(diffuseColor.rgb,glazing,(window*distanceFade+wall*coverage*(1.-distanceFade))*.78);
   // Fine ceramic joints, brick courses and ribbed metal are visible only up close.
   float nearDetail=1.-smoothstep(110.,480.,distance(vWorld,cameraPosition));
   vec2 tiles=fract((vFacadeUV*baySize)/vec2(.23,.12));float mortar=(step(.92,tiles.x)+step(.91,tiles.y))*.055*tile;
   vec2 brickUV=(vFacadeUV*baySize)/vec2(.34,.13);brickUV.x+=mod(floor(brickUV.y),2.)*.5;vec2 bricks=fract(brickUV);mortar+=(step(.90,bricks.x)+step(.85,bricks.y))*.17*brick;
   float ribs=sin(vFacadeUV.x*baySize.x*19.)*.04*metal;
   diffuseColor.rgb*=1.-(mortar+ribs)*nearDetail*wall;
   float floorBand=(1.-smoothstep(.03,.055,cell.y))*wall*(1.-glass)*distanceFade;
   diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*.65,floorBand*.5);
   // Apartment balcony recesses, sills, and individual blind positions.
   float balcony=rectMask(cell,vec2(.08,.09),vec2(.87,.16),aa)*wall*tile*distanceFade;
   diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.21,.23,.20),balcony*.6);
   float blind=window*step(.68,room)*step(.60,cell.y)*(1.-glass)*distanceFade;
   diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.65,.57,.43),blind*.6);
   float shop=wall*(1.-step(1.,vFacadeUV.y))*rectMask(cell,vec2(.08,.1),vec2(.93,.83),aa)*(1.-metal)*(1.-glass);
   diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.10,.19,.18),shop*.72);
  `);
  s.fragmentShader=s.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
   roughnessFactor=mix(roughnessFactor,.24,glass*wall);
  `);
  s.fragmentShader=s.fragmentShader.replace('#include <metalnessmap_fragment>',`#include <metalnessmap_fragment>
   metalnessFactor=mix(metalnessFactor,.38,glass*wall);
  `);
  s.fragmentShader=s.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
   vec3 roomLight=mix(vec3(1.,.50,.13),vec3(.75,.85,1.),step(.94,room));
   totalEmissiveRadiance+=roomLight*window*step(.75,room)*uDusk*.62*distanceFade;
   totalEmissiveRadiance+=vec3(1.,.50,.12)*shop*(.12+uDusk*.32)*distanceFade;
  `);
 };return mat;
}

function merged(parts){const g=mergeGeometries(parts);parts.forEach(p=>p.dispose());return g;}
function shopAtlas(){
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;const c=canvas.getContext('2d');
 const signs=[['茶 · TEA','#416856'],['咖啡 COFFEE','#a46239'],['小吃 · EAT','#a84737'],['麵 NOODLES','#ad693f'],['書 BOOKS','#3d747c'],['早餐 BREAKFAST','#ba913c'],['藥局 PHARMACY','#538472'],['花 FLOWERS','#9a6975']];
 signs.forEach(([label,color],i)=>{const x=i%4*256,y=Math.floor(i/4)*256;c.fillStyle=color;c.fillRect(x,y,256,256);c.strokeStyle='#f3d6a5';c.lineWidth=6;c.strokeRect(x+10,y+71,236,108);c.fillStyle='#fff0cf';c.font='bold 25px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(label,x+128,y+125,224);});
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;return texture;
}

export async function createArchitectureDetails(scene,dusk){
 const response=await fetch('/data/architecture.json',{cache:'no-cache'});if(!response.ok)throw Error('Architectural details could not be loaded');const data=await response.json();
 const grid=new Map(),cell=500;for(const b of data.buildings){const key=`${Math.floor(b[0]/cell)},${Math.floor(b[2]/cell)}`;if(!grid.has(key))grid.set(key,[]);grid.get(key).push(b);}
 const silver=new THREE.MeshStandardMaterial({color:'#b6c3c0',metalness:.65,roughness:.4});
 const concrete=new THREE.MeshStandardMaterial({color:'#c8b798',roughness:.92});
 const white=new THREE.MeshStandardMaterial({color:'#e0d7be',roughness:.72});
 const tankGeometry=merged([new THREE.CylinderGeometry(1,1,1.8,10).translate(0,1.15,0),new THREE.CylinderGeometry(.32,.45,.20,8).translate(0,2.15,0),new THREE.CylinderGeometry(1.08,1.08,.12,10).translate(0,.25,0)]);
 const unitGeometry=merged([new THREE.BoxGeometry(1.8,1.3,1.1).translate(0,.65,0),new THREE.CylinderGeometry(.44,.44,.08,10).translate(0,1.34,0)]);
 const balconyParts=[new THREE.BoxGeometry(2.5,.15,1.15),new THREE.BoxGeometry(2.5,.08,.07).translate(0,.9,.55),new THREE.BoxGeometry(2.5,.07,.07).translate(0,.35,.55)];
 for(let x=-1.2;x<=1.21;x+=.24)balconyParts.push(new THREE.BoxGeometry(.035,.88,.035).translate(x,.48,.55));
 for(const side of [-1,1])balconyParts.push(new THREE.BoxGeometry(.06,.9,1.1).translate(side*1.22,.48,0));
 const balconyGeometry=merged(balconyParts);
 const acParts=[new THREE.BoxGeometry(.85,.55,.38),new THREE.BoxGeometry(.035,.08,.55).translate(-.34,-.3,0),new THREE.BoxGeometry(.035,.08,.55).translate(.34,-.3,0)];
 for(let y=-.2;y<.25;y+=.08)acParts.push(new THREE.BoxGeometry(.76,.018,.035).translate(0,y,.21));
 const acGeometry=merged(acParts),awningGeometry=new THREE.BoxGeometry(2.55,.08,1.2).rotateX(.15);
 const rail=new THREE.MeshStandardMaterial({color:'#919e9b',metalness:.45,roughness:.58});
 const green=new THREE.MeshStandardMaterial({color:'#477d6d',roughness:.8});
 const shops=new THREE.MeshStandardMaterial({map:shopAtlas(),emissive:'#fff0cc',emissiveMap:null,emissiveIntensity:.15,roughness:.6});shops.emissiveMap=shops.map;
 shops.onBeforeCompile=s=>{s.vertexShader='attribute float signIndex;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <uv_vertex>',`#include <uv_vertex>
  vMapUv=(uv*vec2(.95,.44)+vec2(mod(signIndex,4.)+.025,floor(signIndex/4.)+.28))/vec2(4.,2.);
  vEmissiveMapUv=vMapUv;
 `);};
 const defs={tank:[tankGeometry,silver,850],stairwell:[new THREE.BoxGeometry(1,1,1),concrete,850],hvac:[unitGeometry,white,900],balcony:[balconyGeometry,rail,1200],ac:[acGeometry,white,900],awning:[awningGeometry,green,600],sign:[new THREE.PlaneGeometry(1,1),shops,180]};const meshes={};
 for(const [name,[geometry,material,cap]] of Object.entries(defs)){const m=new THREE.InstancedMesh(geometry,material,cap);m.name=`Architecture: ${name}`;m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);m.frustumCulled=false;m.count=0;scene.add(m);meshes[name]=m;}
 const signIndices=new THREE.InstancedBufferAttribute(new Float32Array(defs.sign[2]),1);meshes.sign.geometry.setAttribute('signIndex',signIndices);
 const dummy=new THREE.Object3D(),clip=new THREE.Vector3();let previous=-10,lastCamera=new THREE.Vector3(Infinity,0,Infinity);
 const stats={tanks:0,balconies:0,signs:0,drawCalls:0};
 function update(time,camera,quality){
  if(time-previous<.65&&lastCamera.distanceToSquared(camera.position)<100**2)return;previous=time;lastCamera.copy(camera.position);const low=quality==='low',radius=low?900:1700,n=Math.ceil(radius/cell),cx=Math.floor(camera.position.x/cell),cz=Math.floor(camera.position.z/cell),counts={tank:0,stairwell:0,hvac:0,balcony:0,ac:0,awning:0,sign:0};let candidates=[];
  for(let x=cx-n;x<=cx+n;x++)for(let z=cz-n;z<=cz+n;z++)candidates.push(...(grid.get(`${x},${z}`)||[]));candidates.sort((a,b)=>Math.hypot(a[0]-camera.position.x,a[2]-camera.position.z)-Math.hypot(b[0]-camera.position.x,b[2]-camera.position.z));
  function place(kind,x,y,z,sx=1,sy=1,sz=1,angle=0){const cap=Math.floor(defs[kind][2]*(low?.4:1));if(counts[kind]>=cap)return -1;dummy.position.set(x,y,z);dummy.scale.set(sx,sy,sz);dummy.rotation.set(0,angle,0);dummy.updateMatrix();const index=counts[kind]++;meshes[kind].setMatrixAt(index,dummy.matrix);return index;}
  for(const b of candidates){const [x,y,z,r,style,seed,wx,ground,wz,angle,length,height]=b;const distance=camera.position.distanceTo(clip.set(x,y,z));if(distance>radius)continue;clip.project(camera);if(clip.z<0||clip.z>1||Math.abs(clip.x)>1.15||Math.abs(clip.y)>1.15)continue;
   if(camera.position.y>y-8){const size=Math.min(1.5,r*.28);if(style!==1&&seed>.18)place('tank',x,y+.1,z,size,1+seed*.8,size);if(r>3)place('stairwell',x-r*.38,y+1.45,z+r*.22,Math.min(r*.7,7),2.8,Math.min(r*.65,5));if(r>4)place('hvac',x+r*.4,y+.1,z-r*.3,1.2,1.2,1.2);}
   if(distance<(low?190:430)&&height>8&&height<65&&(style===0||style===2)){
    for(const [fx,fz,rotation,wallLength,columns,floors] of b[12]||[[wx,wz,angle,length,Math.max(1,Math.round(length/3.5)),Math.round(height/3.3)]]){
     const nx=Math.sin(rotation),nz=Math.cos(rotation),tx=Math.cos(rotation),tz=-Math.sin(rotation);
     if((camera.position.x-fx)*nx+(camera.position.z-fz)*nz<=0)continue;
     const bay=wallLength/columns,floorHeight=height/floors;
     for(let f=1;f<floors;f++)for(let col=0;col<columns;col++){
      const shift=(col-(columns-1)/2)*bay,x=fx+tx*shift,z=fz+tz*shift,y=ground+f*floorHeight;
      if((col+Math.floor(seed*9))%3!==0){place('balcony',x+nx*.58,y,z+nz*.58,Math.min(1.3,bay*.8/2.5),1,1,rotation);if((f+col)%3===0)place('awning',x+nx*.6,y+2.4,z+nz*.6,Math.min(1.3,bay*.8/2.5),1,1,rotation);}
      if((f+col)%3!==1)place('ac',x+tx*bay*.35+nx*.25,y+1.5,z+tz*bay*.35+nz*.25,1,1,1,rotation);
     }
    }
    const nx=Math.sin(angle),nz=Math.cos(angle);
    if(length>6&&seed>.25){const i=place('sign',wx+nx*.3,ground+3.9,wz+nz*.3,Math.min(5,length*.55),1.25,1,angle);if(i>=0)signIndices.setX(i,Math.floor(seed*8));}

   }
  }
  for(const [kind,m] of Object.entries(meshes)){m.count=counts[kind];m.visible=counts[kind]>0;m.instanceMatrix.needsUpdate=true;}signIndices.needsUpdate=true;shops.emissiveIntensity=.12+dusk.value*.15;Object.assign(stats,{tanks:counts.tank,balconies:counts.balcony,airConditioners:counts.ac,awnings:counts.awning,signs:counts.sign,drawCalls:Object.values(counts).filter(n=>n>0).length});
 }
 return {update,stats,meshes};
}
