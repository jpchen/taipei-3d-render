import {test,expect} from '@playwright/test';
test('corrected landmark sites render with facing halls and a descending hotel staircase',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await page.waitForFunction(()=>window.__taipei?.ready,null,{timeout:90000});await expect(page.locator('#loading')).toHaveCount(0);
 const result=await page.evaluate(()=>{const s=__taipei.scene,a=s.getObjectByName('national-concert-hall'),b=s.getObjectByName('national-theater'),stairs=s.getObjectByName('grand-hotel-staircase');return {rotationDifference:b.rotation.y-a.rotation.y,steps:stairs.userData.steps,stairMeshes:stairs.children.length,stationRotation:s.getObjectByName('taipei-main-station').rotation.y};});
 expect(result.rotationDifference).toBeCloseTo(Math.PI);expect(result.steps).toBe(84);expect(result.stairMeshes).toBe(1);expect(result.stationRotation).toBeCloseTo(-.19);
 for(const [name,lon,lat,dx,dy,dz] of [['liberty-corrected',121.5198,25.0358,-200,650,450],['station-corrected',121.51712,25.04772,200,300,300],['hotel-corrected',121.5261,25.0782,-130,140,250]]){
  await page.evaluate(({lon,lat,dx,dy,dz})=>{const x=(lon-121.54)*100800,z=(25.05-lat)*111320;__taipei.camera.position.set(x+dx,dy,z+dz);__taipei.controls.target.set(x,20,z);__taipei.controls.update();},{lon,lat,dx,dy,dz});await page.waitForTimeout(1000);await page.screenshot({path:`test-results/${name}.png`});
 }expect(errors).toEqual([]);
});
