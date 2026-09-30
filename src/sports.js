import * as T from 'three';import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';import sites from './sports-sites.json';import {terrainHeight} from './terrain.js';
export function createSports(scene,terrain){const parts=[],project=p=>[(p[0]-121.54)*100800,(25.05-p[1])*111320];
 function colored(g,c){g.deleteAttribute('uv');if(!g.index)g.setIndex(Array.from({length:g.attributes.position.count},(_,i)=>i));const color=new T.Color(c),a=new Float32Array(g.attributes.position.count*3);for(let i=0;i<a.length;i+=3)color.toArray(a,i);g.setAttribute('color',new T.BufferAttribute(a,3));parts.push(g);return g;}
 const pitch=sites.pitch.p.slice(0,-1).map(project),x=pitch.reduce((s,p)=>s+p[0],0)/pitch.length,z=pitch.reduce((s,p)=>s+p[1],0)/pitch.length,y=Math.max(...sites.stadium.p.map(project).map(p=>terrainHeight(terrain,...p)))+1,group=new T.Group();group.name='Taipei Municipal Stadium';group.position.set(x,y,z);
 function box(w,h,d,x,y,z,c){colored(new T.BoxGeometry(w,h,d).translate(x,y,z),c);}
 function oval(rx,rz,ry,height,c,start=0,end=Math.PI*2){const pos=[],idx=[],n=128;for(let i=0;i<=n;i++){const a=start+(end-start)*i/n;for(const inset of [0,ry])pos.push(Math.cos(a)*(rx-inset),height,Math.sin(a)*(rz-inset));if(i)idx.push(i*2-2,i*2,i*2-1,i*2-1,i*2,i*2+1);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();colored(g,c);}
 colored(new T.CircleGeometry(1,128).scale(44,79,1).rotateX(-Math.PI/2).translate(0,.32,0),'#4c7b48');
 for(let i=0;i<10;i++)box(66,.2,10.5,0,.4,-47.25+i*10.5,i%2?'#4f824c':'#588e50');
 oval(52,87,9,.5,'#3d92a8');for(let i=0;i<=8;i++)oval(44+i,79+i,.10,.52,'#d8e7df');
 for(const side of [-1,1]){box(.12,.04,105,side*33,.54,0,'#e0e8d7');box(66,.04,.12,0,.54,side*52.5,'#e0e8d7');box(40,.04,.12,0,.54,side*36,'#e0e8d7');for(const sx of [-20,20])box(.12,.04,16.5,sx,.54,side*44.25,'#e0e8d7');}
 box(66,.04,.12,0,.54,0,'#e0e8d7');oval(9.15,9.15,.12,.55,'#e0e8d7');
 for(let i=0;i<15;i++)oval(55+i*1.55,90+i,1.5,1+i*.8,i%4===0?'#d5ddcf':i%3?'#6694a1':'#b4c5b9');
 for(const center of [0,Math.PI]){oval(79,106,18,19,'#d5dbd4',center-.78,center+.78);for(let i=-3;i<=3;i++){const a=center+i*.22,px=Math.cos(a)*78,pz=Math.sin(a)*105;box(.65,19,.65,px,9.5,pz,'#b5c0b8');}}
 for(const sx of [-1,1])for(const sz of [-1,1]){box(.6,32,.6,sx*68,16,sz*83,'#a9b8b0');box(8,2.3,.5,sx*68,32,sz*83,'#e3e5cf');}
 let g=mergeGeometries(parts);parts.forEach(g=>g.dispose());parts.length=0;const mesh=new T.Mesh(g,new T.MeshStandardMaterial({vertexColors:true,roughness:.8,side:T.DoubleSide}));mesh.receiveShadow=true;mesh.castShadow=true;group.add(mesh);scene.add(group);
 const p=sites.arena.p.map(project),xs=p.map(p=>p[0]),zs=p.map(p=>p[1]),ax=(Math.min(...xs)+Math.max(...xs))/2,az=(Math.min(...zs)+Math.max(...zs))/2,ay=terrainHeight(terrain,ax,az),rx=(Math.max(...xs)-Math.min(...xs))/2,rz=(Math.max(...zs)-Math.min(...zs))/2;
 const arena=new T.Group();arena.name='Taipei Arena';arena.position.set(ax,ay,az);const shape=new T.Shape(p.map(p=>new T.Vector2(p[0]-ax,-p[1]+az))),base=new T.Mesh(new T.ExtrudeGeometry(shape,{depth:13,bevelEnabled:false}).rotateX(-Math.PI/2),new T.MeshStandardMaterial({color:'#668d8c',metalness:.25,roughness:.4}));arena.add(base);
 const roof=new T.Mesh(new T.SphereGeometry(1,80,32,0,Math.PI*2,0,Math.PI/2).scale(rx*.98,36,rz*.98).translate(0,13,0),new T.MeshStandardMaterial({color:'#bdc4bc',metalness:.58,roughness:.34}));roof.castShadow=true;arena.add(roof);scene.add(arena);return {stadium:group,arena};
}
