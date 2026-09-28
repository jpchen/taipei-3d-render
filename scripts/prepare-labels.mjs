import {readFile,writeFile} from 'node:fs/promises';
const {elements,date}=JSON.parse(await readFile('assets/map-source.json','utf8'));
const project=([lon,lat])=>[+( (lon-121.54)*100800).toFixed(1),+((25.05-lat)*111320).toFixed(1)];
const important=[
 [/Taipei 101|台北101|臺北101/,'Taipei 101','台北 101',508],
 [/Sun Yat.sen Memorial|國父紀念館$/,'Sun Yat-sen Memorial Hall','國父紀念館',31],
 [/^Taipei Dome$|^臺北大巨蛋$/,'Taipei Dome','臺北大巨蛋',64],
 [/^Taipei Arena$|^臺北小巨蛋$/,'Taipei Arena','臺北小巨蛋',35],
 [/^Taipei main station$|^臺北車站$/i,'Taipei Main Station','臺北車站',45],
 [/Shin Kong Life Tower/,'Shin Kong Life Tower','新光摩天大樓',244],
 [/Nan Shan Plaza/,'Nan Shan Plaza','南山廣場',273],
 [/^Taipei City Government$/,'Taipei City Hall','臺北市政府',40],
 [/Chiang Kai.shek Memorial Hall|^中正紀念堂$/,'Chiang Kai-shek Memorial Hall','中正紀念堂',76],
 [/^National Theater$|^國家戲劇院$/,'National Theater','國家戲劇院',35],
 [/^National Concert Hall$|^國家音樂廳$/,'National Concert Hall','國家音樂廳',35],
 [/Presidential Office Building|^總統府$/,'Presidential Office','總統府',60],
 [/Longshan Temple|^艋舺龍山寺$/,'Longshan Temple','艋舺龍山寺',22],
 [/Songshan Ciyou Temple/,'Ciyou Temple','松山慈祐宮',24],
 [/^The Grand Hotel$|^圓山大飯店$/,'Grand Hotel','圓山大飯店',87],
 [/^Taipei Fine Arts Museum$|^臺北市立美術館$/,'Taipei Fine Arts Museum','臺北市立美術館',25],
 [/Taipei Performing Arts Center/,'Taipei Performing Arts Center','臺北表演藝術中心',45],
 [/Huashan 1914|^華山1914文化創意產業園區$/,'Huashan 1914','華山 1914',16],
 [/^National Taiwan Museum$|^國立臺灣博物館$/,'National Taiwan Museum','國立臺灣博物館',24],
 [/^Taipei Music Center$|^臺北流行音樂中心$/,'Taipei Music Center','臺北流行音樂中心',45],
];
const landmarks=[],streets=[],seen=new Set(),roadCells=new Set();
for(const e of elements){const {t,p,id}=e;if(!p?.length||t.location==='underground'||Number(t.layer)<0)continue;const english=t['name:en']||'',chinese=t['name:zh']||t.name||'',both=english+'|'+chinese;
 if(t.building||t.leisure==='park'){
  const match=important.find(([pattern])=>pattern.test(english)||pattern.test(chinese));const qualifies=match||t.leisure==='park'&&english||t.tourism==='museum'||t.historic&&english||t.amenity==='place_of_worship'&&english||parseFloat(t.height)>110;
  if(qualifies&&(english||chinese)){
   const name=match?.[1]||english||chinese;if(!seen.has(name)){seen.add(name);const center=p.reduce((s,a)=>[s[0]+a[0]/p.length,s[1]+a[1]/p.length],[0,0]),[x,z]=project(center),height=match?.[3]||parseFloat(t.height)||parseFloat(t['building:levels'])*3.3||15;landmarks.push({id,name,zh:match?.[2]||chinese,x,z,height,rank:match?0:t.leisure==='park'?2:1});}
  }
 }
 if(t.highway&&t.name&&!['motorway','trunk'].includes(t.highway)){
  let last=-1000,distance=0;for(let i=1;i<p.length;i++){const a=project(p[i-1]),b=project(p[i]),len=Math.hypot(b[0]-a[0],b[1]-a[1]);distance+=len;if(len<12||distance-last<150)continue;const x=(a[0]+b[0])/2,z=(a[1]+b[1])/2,key=`${chinese}:${Math.floor(x/220)}:${Math.floor(z/220)}`;if(roadCells.has(key))continue;roadCells.add(key);last=distance;streets.push({name:(english||chinese).replace(/Section (\d+)/g,'Sec. $1').replace(/Road/g,'Rd.').replace(/Boulevard/g,'Blvd.'),zh:chinese,x:+x.toFixed(1),z:+z.toFixed(1),dx:+((b[0]-a[0])/len).toFixed(4),dz:+((b[1]-a[1])/len).toFixed(4),rank:['primary','secondary'].includes(t.highway)?0:t.highway==='tertiary'?1:2});}
 }
}
// Geographic places that are not individual building ways in the source extract.
for(const [name,zh,lon,lat,height] of [['Shilin Night Market','士林夜市',121.52525,25.08865,8],['Elephant Mountain','象山',121.5763,25.0273,45],['Tamsui River','淡水河',121.506,25.0602,5],['Keelung River','基隆河',121.571,25.059,5],['Songshan Cultural Park','松山文創園區',121.5601,25.0442,18],['Daan Forest Park','大安森林公園',121.5357,25.0295,15],['Liberty Square','自由廣場',121.5199,25.0352,15]]){if(!seen.has(name)){const [x,z]=project([lon,lat]);landmarks.push({id:name,name,zh,x,z,height,rank:0});seen.add(name);}}
if(!seen.has('Taipei 101')){const [x,z]=project([121.5645,25.0339]);landmarks.push({id:'101',name:'Taipei 101',zh:'台北 101',x,z,height:508,rank:0});}
landmarks.sort((a,b)=>a.rank-b.rank);
await writeFile('public/data/labels.json',JSON.stringify({source:'© OpenStreetMap contributors, ODbL 1.0',date,landmarks:landmarks.slice(0,350),streets}));console.log('Labels:',Math.min(350,landmarks.length),'landmarks,',streets.length,'street anchors');
