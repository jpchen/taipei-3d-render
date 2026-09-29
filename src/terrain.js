import * as THREE from 'three';

// Match PlaneGeometry's two triangles per grid cell, including its diagonal.
export function terrainHeight(data,x,z){
 const {bounds:b,n,heights:h}=data;
 const u=THREE.MathUtils.clamp((x/100800+121.54-b[0])/(b[2]-b[0])*n,0,n-1e-7),v=THREE.MathUtils.clamp((b[3]-(25.05-z/111320))/(b[3]-b[1])*n,0,n-1e-7);
 const i=Math.floor(u),j=Math.floor(v),fx=u-i,fz=v-j,k=j*(n+1)+i;
 const a=Math.max(1,h[k]-12),right=Math.max(1,h[k+1]-12),bottom=Math.max(1,h[k+n+1]-12),d=Math.max(1,h[k+n+2]-12);
 return fx+fz<=1?a+(right-a)*fx+(bottom-a)*fz:d+(bottom-d)*(1-fx)+(right-d)*(1-fz);
}

// Split surface triangles at every terrain edge. Merely sampling road vertices
// can leave the road's interior below a coarse terrain triangle.
export function drapeGeometry(geometry,data,offset,preserveLift=false){
 const {bounds:b,n}=data,originX=(b[0]-121.54)*100800,originZ=(25.05-b[3])*111320,dx=(b[2]-b[0])*100800/n,dz=(b[3]-b[1])*111320/n;
 const position=geometry.attributes.position,uv=geometry.attributes.uv,indices=geometry.index,vertices=[],tex=[];
 function clip(poly,value){const out=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],va=value(a),vb=value(b);if(va>=-1e-7)out.push(a);if((va<0)!==(vb<0)){const t=va/(va-vb);out.push(a.map((x,j)=>x+(b[j]-x)*t));}}return out;}
 for(let k=0;k<(indices?.count||position.count);k+=3){const tri=[];for(let l=0;l<3;l++){const i=indices?indices.getX(k+l):k+l;tri.push([position.getX(i),position.getZ(i),uv?.getX(i)||0,uv?.getY(i)||0,preserveLift?position.getY(i)-terrainHeight(data,position.getX(i),position.getZ(i)):0]);}
  const minI=Math.max(0,Math.floor((Math.min(...tri.map(p=>p[0]))-originX)/dx)),maxI=Math.min(n-1,Math.floor((Math.max(...tri.map(p=>p[0]))-originX)/dx));
  const minJ=Math.max(0,Math.floor((Math.min(...tri.map(p=>p[1]))-originZ)/dz)),maxJ=Math.min(n-1,Math.floor((Math.max(...tri.map(p=>p[1]))-originZ)/dz));
  for(let j=minJ;j<=maxJ;j++)for(let i=minI;i<=maxI;i++){const x=originX+i*dx,z=originZ+j*dz;let cell=tri;for(const test of [p=>p[0]-x,p=>x+dx-p[0],p=>p[1]-z,p=>z+dz-p[1]]){cell=clip(cell,test);if(cell.length<3)break;}if(cell.length<3)continue;
   for(const sign of [1,-1]){const poly=clip(cell,p=>sign*(1-(p[0]-x)/dx-(p[1]-z)/dz));for(let l=1;l<poly.length-1;l++){const points=[poly[0],poly[l],poly[l+1]];const [a,c,d]=points;if(Math.abs((c[0]-a[0])*(d[1]-a[1])-(c[1]-a[1])*(d[0]-a[0]))<1e-7)continue;for(const p of points){vertices.push(p[0],terrainHeight(data,p[0],p[1])+offset+p[4],p[1]);tex.push(p[2],p[3]);}}}
  }
 }
 const result=new THREE.BufferGeometry();result.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));result.setAttribute('uv',new THREE.Float32BufferAttribute(tex,2));result.setIndex(Array.from({length:vertices.length/3},(_,i)=>i));result.computeVertexNormals();geometry.dispose();return result;
}
