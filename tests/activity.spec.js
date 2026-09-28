import { test, expect } from '@playwright/test';

test('street life uses pooled instances, animates nearby and disappears at altitude',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('/');await page.waitForFunction(()=>window.__taipei?.ready,null,{timeout:90000});await expect(page.locator('#loading')).toHaveCount(0);
 await expect.poll(()=>page.evaluate(()=>__taipei.activity.stats.visibleCars)).toBeGreaterThan(0);
 await page.locator('#street-view').click();await page.waitForTimeout(3500);
 await expect.poll(()=>page.evaluate(()=>__taipei.activity.stats.visiblePeople)).toBeGreaterThan(0);
 const stats=await page.evaluate(()=>__taipei.activity.stats);expect(stats.drawCalls).toBeLessThanOrEqual(4);expect(stats.visiblePeople).toBeLessThanOrEqual(1400);
 const before=await page.evaluate(()=>Array.from(__taipei.activity.meshes.car.instanceMatrix.array.slice(0,16)));await page.waitForTimeout(600);const after=await page.evaluate(()=>Array.from(__taipei.activity.meshes.car.instanceMatrix.array.slice(0,16)));expect(after).not.toEqual(before);
 await page.screenshot({path:'test-results/street-life.png'});
 await page.evaluate(()=>{__taipei.camera.position.set(4000,10000,3500);__taipei.controls.target.set(2000,0,1800);__taipei.controls.update();});await page.waitForTimeout(1000);
 expect(await page.evaluate(()=>__taipei.activity.stats.visiblePeople)).toBe(0);expect(await page.evaluate(()=>__taipei.activity.stats.visibleCars)).toBe(0);
 await page.locator('#settings-toggle').click();await page.locator('#life-toggle').uncheck();expect(await page.evaluate(()=>Object.values(__taipei.activity.meshes).every(m=>!m.visible))).toBe(true);
 expect(errors).toEqual([]);
});
