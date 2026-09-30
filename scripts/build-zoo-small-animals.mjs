// Headless GLB fallback for environments where Blender cannot start.
import * as T from 'three';import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';import {writeFile} from 'node:fs/promises';
globalThis.FileReader=class {readAsArrayBuffer(blob){blob.arrayBuffer().then(b=>{this.result=b;this.onloadend?.();});}readAsDataURL(blob){blob.arrayBuffer().then(b=>{this.result=`data:${blob.type};base64,${Buffer.from(b).toString('base64')}`;this.onloadend?.();});}};
const black='#242420',white='#e9e4d5',brown='#76644e',pink='#bd9077';let root;
function ell(name,p,s,c){const m=new T.Mesh(new T.IcosahedronGeometry(1,2),new T.MeshStandardMaterial({color:c,roughness:.85}));m.name=name;m.position.set(...p);m.scale.set(...s);root.add(m);return m;}
function rod(name,a,b,r,c){const av=new T.Vector3(...a),bv=new T.Vector3(...b),d=bv.clone().sub(av),m=new T.Mesh(new T.CylinderGeometry(r*.8,r,d.length(),8),new T.MeshStandardMaterial({color:c,roughness:.9}));m.name=name;m.position.copy(av.add(bv).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());root.add(m);}
for(const species of ['panda','red-panda','monkey','penguin']){
 root=new T.Group();root.name=species;
 if(species==='panda'){
  ell('Round white body',[0,.76,0],[.48,.57,.62],white);ell('Black shoulder band',[0,.8,.32],[.49,.48,.22],black);
  for(const x of [-.3,.3])for(const z of [-.35,.35])ell('Paw',[x,.28,z],[.18,.29,.23],black);
  ell('Face',[0,1.1,.6],[.39,.35,.35],white);
  for(const x of [-.26,.26]){ell('Ear',[x,1.38,.55],[.14,.15,.1],black);ell('Eye patch',[x*.65,1.14,.903],[.105,.13,.042],black);ell('Eye glint',[x*.65,1.16,.94],[.022,.025,.013],white);}
  ell('Muzzle',[0,1,.935],[.17,.1,.11],white);ell('Nose',[0,1.05,1.025],[.07,.04,.035],black);
 }else if(species==='red-panda'){
  const rust='#b55a2c',cream='#e6cfab',dark='#39281f';ell('Rust coat',[0,.5,0],[.22,.23,.45],rust);
  for(const x of [-.16,.16])for(const z of [-.27,.27])rod('Leg',[x,.08,z],[x,.46,z],.065,dark);
  ell('Face',[0,.65,.43],[.23,.2,.22],rust);
  for(const x of [-.16,.16]){ell('Cream cheek',[x,.61,.585],[.095,.1,.06],cream);ell('Ear',[x,.85,.4],[.09,.12,.065],cream);ell('Eye',[x*.72,.7,.617],[.024,.025,.025],black);}
  ell('Muzzle',[0,.6,.65],[.08,.045,.05],cream);ell('Nose',[0,.62,.695],[.027,.023,.024],black);
  for(let j=0;j<9;j++)ell('Ringed fluffy tail',[0,.48-j*.024,-.37-j*.075],[.115,.11,.08],j%2?rust:cream);
 }else if(species==='monkey'){
  ell('Torso',[0,.57,0],[.2,.33,.28],brown);
  for(const x of [-.16,.16]){rod('Arm',[x,.65,.14],[x*1.2,.12,.26],.055,brown);rod('Leg',[x,.5,-.14],[x,.08,-.23],.07,brown);ell('Hand',[x*1.2,.1,.28],[.055,.04,.075],pink);}
  ell('Head',[0,.97,.22],[.2,.22,.19],brown);ell('Face',[0,.97,.37],[.145,.14,.07],pink);
  for(const x of [-.2,.2]){ell('Ear',[x,.98,.22],[.065,.08,.045],pink);ell('Eye',[x*.38,1.02,.44],[.021,.021,.013],black);}
  for(let j=0;j<6;j++)rod('Tail',[0,.55+j*.025,-.23-j*.065],[0,.575+j*.025,-.295-j*.065],.025,brown);
 }else{
  ell('Dark back',[0,.62,0],[.24,.48,.23],black);ell('White belly',[0,.6,.16],[.19,.37,.1],white);ell('Head',[0,1.06,.04],[.18,.19,.17],black);
  for(const x of [-.12,.12]){ell('Orange foot',[x,.06,.1],[.1,.05,.18],'#dc9634');ell('Flipper',[x*2,.6,0],[.055,.31,.12],black);ell('Eye',[x,1.1,.18],[.021,.021,.017],white);}
  rod('Bill',[0,1.03,.18],[0,1.02,.36],.05,'#d59c2e');ell('Golden neck',[0,.86,.19],[.12,.07,.025],'#edc159');
 }
 const glb=await new GLTFExporter().parseAsync(root,{binary:true});await writeFile(`public/models/zoo-${species}.glb`,Buffer.from(glb));console.log(species,glb.byteLength);
}
