import {test,expect} from '@playwright/test';
test('landmarks and street names appear by distance and can be controlled independently',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await page.waitForFunction(()=>window.__taipei?.ready,null,{timeout:90000});await expect(page.locator('#loading')).toHaveCount(0);
 const counts=await page.evaluate(()=>__taipei.labels.stats);expect(counts.landmarks).toBeGreaterThan(100);expect(counts.streets).toBeGreaterThan(1000);expect(counts.visibleLandmarks).toBeGreaterThan(3);expect(counts.visibleLandmarks).toBeLessThanOrEqual(19);
 await page.evaluate(()=>{__taipei.camera.position.set(2480,260,2360);__taipei.controls.target.set(2380,0,1650);__taipei.controls.update();});await expect.poll(()=>page.evaluate(()=>__taipei.labels.stats.visibleStreets)).toBeGreaterThan(0);
 const streetText=await page.locator('.street-label:visible').first().textContent();expect(streetText.length).toBeGreaterThan(3);await page.screenshot({path:'test-results/labels.png'});
 await page.locator('#settings-toggle').click();await page.locator('#street-labels-toggle').uncheck();await expect.poll(()=>page.evaluate(()=>__taipei.labels.stats.visibleStreets)).toBe(0);expect(await page.evaluate(()=>__taipei.labels.stats.visibleLandmarks)).toBeGreaterThan(0);await page.locator('#street-labels-toggle').check();await page.locator('[data-close="settings"]').click();
 const label=page.locator('.expanded-label:visible').first(),name=await label.locator('b').textContent();await label.click();await expect(page.locator('#place-title')).toHaveText(name);expect(errors).toEqual([]);
});
