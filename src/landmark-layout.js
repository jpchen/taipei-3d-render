import sites from './landmark-sites.json' with {type:'json'};
export {sites};
export function insidePolygon(point,polygon){let inside=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];if((a[1]>point[1])!==(b[1]>point[1])&&point[0]<(b[0]-a[0])*(point[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
export function replacedByLandmark(id,points){return sites.some(site=>site.id===id||points.every(p=>insidePolygon(p,site.footprint)));}
export function stationAncillaryHeight(tags,center){
 const station=sites.find(s=>s.name==='taipei-main-station');
 if(Math.hypot((center[0]-station.lon)*100800,(center[1]-station.lat)*111320)>220)return null;
 if(tags.height||tags['building:levels'])return null;
 return tags.building==='roof'?3.5:tags.building==='service'?4:null;
}
