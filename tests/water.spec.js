import {test,expect} from '@playwright/test';
test('rivers animate and reflect the scene with a cheaper battery-saver fallback',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('/');await page.waitForFunction(()=>window.__taipei?.ready,null,{timeout:90000});await expect(page.locator('#loading')).toHaveCount(0);
 await page.locator('[data-place="4"]').click();await page.waitForTimeout(4000);
 const before=await page.evaluate(()=>({...__taipei.water.stats}));await expect.poll(()=>page.evaluate(()=>__taipei.water.stats.reflectionFrames)).toBeGreaterThan(before.reflectionFrames);expect(await page.evaluate(()=>__taipei.water.stats.flowTime)).toBeGreaterThan(before.flowTime);
 expect(await page.evaluate(()=>__taipei.water.material.uniforms.mirrorSampler.value.image.width)).toBe(512);await page.screenshot({path:'test-results/river.png'});
 await page.locator('#settings-toggle').click();await page.locator('#quality').selectOption('low');await expect.poll(()=>page.evaluate(()=>__taipei.water.stats.mode)).toBe('sky');const frames=await page.evaluate(()=>__taipei.water.stats.reflectionFrames);await page.waitForTimeout(500);expect(await page.evaluate(()=>__taipei.water.stats.reflectionFrames)).toBe(frames);await page.locator('#quality').selectOption('balanced');await expect.poll(()=>page.evaluate(()=>__taipei.water.stats.reflectionFrames)).toBeGreaterThan(frames);expect(errors).toEqual([]);
});
