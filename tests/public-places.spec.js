import {test,expect} from '@playwright/test';
import places from '../src/social-places.json' with {type:'json'};
test('new gathering places have working destinations, nearby detail and walking visitors',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});await page.goto('/');await page.waitForFunction(()=>window.__taipei?.ready,null,{timeout:90000});await expect(page.locator('#loading')).toHaveCount(0);
 for(const [i,p] of places.entries()){await page.locator(`[data-place="${8+i}"]`).click();await expect(page.locator('#place-title')).toHaveText(p.name);await page.waitForTimeout(4000);await expect.poll(()=>page.evaluate(()=>__taipei.publicPlaces.stats.visibleProps)).toBeGreaterThan(0);await expect.poll(()=>page.evaluate(()=>__taipei.activity.stats.visiblePeople)).toBeGreaterThan(0);await page.screenshot({path:`test-results/place-${p.id}.png`});}
 await page.evaluate(()=>{__taipei.camera.position.set(0,10000,0);__taipei.controls.target.set(0,0,0);__taipei.controls.update();});await expect.poll(()=>page.evaluate(()=>__taipei.publicPlaces.stats.visibleProps)).toBe(0);expect(errors).toEqual([]);
});
