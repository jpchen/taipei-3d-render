export const shots=[
 {id:'taipei-101',label:'TAIPEI 101',subtitle:'A city worth getting lost in.',duration:5,light:50,center:[121.5645,25.0339],height:210,orbit:[1100,.65,.96,620]},
 {id:'memorial-dome',label:'SUN YAT-SEN MEMORIAL · TAIPEI DOME',duration:3.5,light:48,center:[121.56025,25.0411],height:25,from:[430,335,530],to:[340,310,555]},
 {id:'stadium',label:'TAIPEI STADIUM · TAIPEI ARENA',duration:2.5,light:50,center:[121.55125,25.0501],height:20,from:[370,290,430],to:[325,280,445]},
 {id:'giraffes',label:'TAIPEI ZOO',subtitle:'A closer kind of discovery.',duration:3,light:47,habitat:'giraffe',height:2,from:[33,22,49],to:[24,20,44]},
 {id:'pandas',label:'GIANT PANDA HOUSE',duration:2.5,light:49,habitat:'panda',height:1,from:[-21,15,27],to:[-16,14,25]},
 {id:'gondola',label:'MAOKONG GONDOLA',duration:3,light:53,gondola:7,height:8,from:[60,28,68],to:[45,25,78]},
 {id:'river',label:'TAMSUI RIVER',subtitle:'Follow the light.',duration:3.5,light:62,center:[121.5083,25.0633],height:6,from:[-120,95,600],to:[-40,88,590]},
 {id:'wharf',label:'DADAOCHENG WHARF',duration:3,light:68,center:[121.50743,25.0563],height:4,from:[35,18,32],to:[24,17,35]},
 {id:'shilin',label:'SHILIN NIGHT MARKET',subtitle:'Stay a little longer.',duration:4,light:86,market:true,height:3,from:[0,0,0],to:[0,0,0]}
];
export function frameFor(shot,u,context){const mix=(a,b,t)=>a+(b-a)*t;let target;
 if(shot.habitat){const h=context.habitats.find(h=>h.species===shot.habitat);target=[h.x,context.heights[shot.id]+shot.height,h.z];}
 else if(shot.gondola!==undefined){const p=context.gondola[shot.gondola];target=[p.p[0],p.y+shot.height,p.p[1]];}
 else if(shot.market){const a=context.market;target=[a.target[0],2.6,a.target[2]];const p=a.pos;return {target,position:[mix(p[0]+.3,p[0]-.3,u),5.2,p[2]+mix(6,-6,u)],light:shot.light,fov:58};}
 else target=[(shot.center[0]-121.54)*100800,context.heights[shot.id]+shot.height,(25.05-shot.center[1])*111320];
 let position;if(shot.orbit){const [r,a,b,y]=shot.orbit,angle=mix(a,b,u);position=[target[0]+Math.sin(angle)*r,context.heights[shot.id]+y,target[2]+Math.cos(angle)*r];}else position=target.map((v,i)=>v+mix(shot.from[i],shot.to[i],u));
 return {position,target,light:shot.light,fov:42};
}
