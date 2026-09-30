export const filmRoot='renders/taipei-overview-60s';
export const shots=[
 {id:'taipei-101',label:'Taipei 101',zh:'台北101',duration:6,light:50,center:[121.5645,25.0339],height:210,orbit:[1100,.65,.96,620]},
 {id:'city-pan',label:'Above Taipei',zh:'俯瞰臺北',duration:5,light:49,center:[121.5435,25.0395],height:100,orbit:[2300,.6,.82,1500]},
 {id:'memorial-dome',label:'Sun Yat-sen Memorial & Taipei Dome',zh:'國立國父紀念館・臺北大巨蛋',duration:4,light:48,center:[121.56025,25.0411],height:25,from:[430,335,530],to:[340,310,555]},
 {id:'stadium',label:'Taipei Stadium & Arena',zh:'臺北田徑場・臺北小巨蛋',duration:3,light:50,center:[121.55125,25.0501],height:20,from:[370,290,430],to:[325,280,445]},
 {id:'liberty',label:'Liberty Square',zh:'自由廣場・中正紀念堂',duration:4,light:50,center:[121.5205,25.0352],height:30,from:[490,440,640],to:[400,420,670]},
 {id:'station',label:'Taipei Main Station',zh:'臺北車站',duration:3,light:51,center:[121.517,25.0478],height:25,from:[220,180,290],to:[175,175,315]},
 {id:'grand-hotel',label:'The Grand Hotel',zh:'圓山大飯店',duration:4,light:52,center:[121.5263,25.0786],height:38,from:[-160,100,260],to:[-110,95,280]},
 {id:'daan',label:'Daan Forest Park',zh:'大安森林公園',duration:3,light:51,center:[121.5357,25.0295],height:30,from:[750,870,960],to:[600,830,1040]},
 {id:'huashan',label:'Huashan 1914 Creative Park',zh:'華山1914文化創意產業園區',duration:3,light:52,center:[121.5293,25.0446],height:4,from:[-120,105,150],to:[-90,100,170]},
 {id:'ximen',label:'Ximending & The Red House',zh:'西門町・西門紅樓',duration:3,light:57,center:[121.50683,25.0422],height:5,from:[110,100,135],to:[75,95,150]},
 {id:'giraffes',label:'Taipei Zoo',zh:'臺北市立動物園',duration:3,light:47,habitat:'giraffe',height:2,from:[33,22,49],to:[24,20,44]},
 {id:'pandas',label:'Giant Panda House',zh:'大貓熊館',duration:3,light:49,habitat:'panda',height:1,from:[-21,15,27],to:[-16,14,25]},
 {id:'gondola',label:'Maokong Gondola',zh:'貓空纜車',duration:4,light:53,gondola:7,height:8,from:[60,28,68],to:[45,25,78]},
 {id:'river',label:'Tamsui River',zh:'淡水河',duration:5,light:62,center:[121.5083,25.0633],height:6,from:[-120,180,680],to:[20,150,640]},
 {id:'wharf',label:'Dadaocheng Wharf',zh:'大稻埕碼頭',duration:3,light:68,center:[121.50743,25.0563],height:4,from:[35,18,32],to:[24,17,35]},
 {id:'shilin',label:'Shilin Night Market',zh:'士林夜市',duration:4,light:86,market:true,height:3,from:[0,0,0],to:[0,0,0]}
];
export const filmDuration=shots.reduce((sum,shot)=>sum+shot.duration,0);
export const filmFrames=filmDuration*30;
export function frameFor(shot,u,context){const mix=(a,b,t)=>a+(b-a)*t;let target;
 if(shot.habitat){const h=context.habitats.find(h=>h.species===shot.habitat);target=[h.x,context.heights[shot.id]+shot.height,h.z];}
 else if(shot.gondola!==undefined){const p=context.gondola[shot.gondola];target=[p.p[0],p.y+shot.height,p.p[1]];}
 else if(shot.market){const a=context.market;target=[a.target[0],2.6,a.target[2]];const p=a.pos;return {target,position:[mix(p[0]+.3,p[0]-.3,u),5.2,p[2]+mix(6,-6,u)],light:shot.light,fov:58};}
 else target=[(shot.center[0]-121.54)*100800,context.heights[shot.id]+shot.height,(25.05-shot.center[1])*111320];
 let position;if(shot.orbit){const [r,a,b,y]=shot.orbit,angle=mix(a,b,u);position=[target[0]+Math.sin(angle)*r,context.heights[shot.id]+y,target[2]+Math.cos(angle)*r];}else position=target.map((v,i)=>v+mix(shot.from[i],shot.to[i],u));
 return {position,target,light:shot.light,fov:42};
}
