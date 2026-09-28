import {test,expect} from '@playwright/test';
test('Shilin has visible stalls and moving crowds, with nearby apartment details and park walkers',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('/');await page.waitForFunction(()=>window.__taipei?.ready,null,{timeout:90000});await expect(page.locator('#loading')).toHaveCount(0);
 await page.locator('[data-place="6"]').click();await expect(page.locator('#place-title')).toHaveText('Shilin Night Market');await page.waitForTimeout(4000);
 await expect.poll(()=>page.evaluate(()=>__taipei.market.stats.visibleStalls)).toBeGreaterThan(5);
 await expect.poll(()=>page.evaluate(()=>__taipei.activity.stats.visibleMarketPeople)).toBeGreaterThan(20);
 expect(await page.evaluate(()=>__taipei.market.stats.drawCalls)).toBeLessThanOrEqual(4);await page.screenshot({path:'test-results/shilin.png'});
 const apartment=await page.evaluate(async()=>{const data=await (await fetch('/data/architecture.json')).json();return data.buildings.find(b=>b[4]===2&&b[11]>12&&b[11]<40&&b[12]?.some(w=>w[3]>12)&&Math.abs(b[0]+1500)<400&&Math.abs(b[2]+4300)<400);});expect(apartment).toBeTruthy();
 await page.evaluate(b=>{const w=b[12].find(w=>w[3]>12),nx=Math.sin(w[2]),nz=Math.cos(w[2]);__taipei.camera.position.set(w[0]+nx*28,b[7]+10,w[1]+nz*28);__taipei.controls.target.set(w[0],b[7]+8,w[1]);__taipei.controls.update();},apartment);
 await expect.poll(()=>page.evaluate(()=>__taipei.architecture.stats.airConditioners)).toBeGreaterThan(0);await expect.poll(()=>page.evaluate(()=>__taipei.architecture.stats.balconies)).toBeGreaterThan(0);await page.screenshot({path:'test-results/apartments.png'});
 await page.evaluate(async()=>{const {routes}=await (await fetch('/data/activity.json')).json(),r=routes.find(r=>r.park&&r.p.length>3&&Math.abs(r.p[0][0]+430)<450&&Math.abs(r.p[0][1]-2250)<600),p=r.p[1];__taipei.camera.position.set(p[0]+50,p[2]+50,p[1]+80);__taipei.controls.target.set(p[0],p[2],p[1]);__taipei.controls.update();});
 await expect.poll(()=>page.evaluate(()=>__taipei.activity.stats.visibleParkPeople)).toBeGreaterThan(0);await page.screenshot({path:'test-results/park.png'});
 await page.evaluate(()=>{__taipei.camera.position.set(4000,10000,3500);__taipei.controls.target.set(2000,0,1800);__taipei.controls.update();});await expect.poll(()=>page.evaluate(()=>__taipei.market.stats.visibleStalls)).toBe(0);expect(errors).toEqual([]);
});
