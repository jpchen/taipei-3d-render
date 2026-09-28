import { test, expect } from '@playwright/test';

test('desktop city loads and navigation, audio, light and tour work',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('/');await page.waitForFunction(()=>window.__taipei?.ready,null,{timeout:90000});await expect(page.locator('#loading')).toHaveCount(0);
 expect(await page.evaluate(()=>__taipei.stats.buildings)).toBeGreaterThan(60000);
 await expect(page.locator('canvas')).toBeVisible();
 const start=await page.evaluate(()=>__taipei.camera.position.toArray());
 await page.locator('[data-place="2"]').click();await expect(page.locator('#place-title')).toHaveText('Daan Forest Park');await page.waitForTimeout(4000);
 const moved=await page.evaluate(()=>__taipei.camera.position.toArray());expect(Math.abs(start[0]-moved[0])).toBeGreaterThan(500);
 await page.keyboard.press('Tab');await page.locator('#scene canvas').click({position:{x:700,y:300}});await page.keyboard.down('w');await page.waitForTimeout(500);await page.keyboard.up('w');
 const walked=await page.evaluate(()=>__taipei.camera.position.toArray());expect(Math.hypot(...walked.map((x,i)=>x-moved[i]))).toBeGreaterThan(10);
 const orbitBefore=await page.evaluate(()=>__taipei.camera.position.toArray());await page.mouse.move(800,350);await page.mouse.down();await page.mouse.move(980,390,{steps:15});await page.mouse.up();await page.waitForTimeout(400);const orbitAfter=await page.evaluate(()=>__taipei.camera.position.toArray());expect(Math.hypot(...orbitAfter.map((x,i)=>x-orbitBefore[i]))).toBeGreaterThan(30);

 const panBefore=await page.evaluate(()=>({position:__taipei.camera.position.toArray(),target:__taipei.controls.target.toArray()}));await page.mouse.move(740,340);await page.mouse.down({button:'middle'});await page.mouse.move(910,430,{steps:12});await page.mouse.up({button:'middle'});await page.waitForTimeout(500);const panAfter=await page.evaluate(()=>({position:__taipei.camera.position.toArray(),target:__taipei.controls.target.toArray()}));expect(Math.hypot(...panAfter.target.map((x,i)=>x-panBefore.target[i]))).toBeGreaterThan(50);expect(Math.abs(Math.hypot(...panBefore.position.map((x,i)=>x-panBefore.target[i]))-Math.hypot(...panAfter.position.map((x,i)=>x-panAfter.target[i])))).toBeLessThan(5);
 await page.locator('#audio-toggle').click();await expect(page.locator('#audio-toggle')).toHaveAttribute('aria-pressed','true');expect(await page.evaluate(()=>__taipei.audio.ctx.state)).toBe('running');await page.locator('#audio-toggle').click();await expect(page.locator('#audio-toggle')).toHaveAttribute('aria-pressed','false');
 await page.locator('#settings-toggle').click();await page.locator('#time').fill('95');await expect(page.locator('#time-label')).toHaveText('Blue hour');await page.locator('#labels-toggle').uncheck();await expect(page.locator('#landmark-labels')).toBeHidden();await page.locator('#labels-toggle').check();await page.locator('#time').fill('38');await page.locator('#quality').selectOption('low');expect(await page.evaluate(()=>__taipei.renderer.shadowMap.enabled)).toBe(false);await page.locator('#quality').selectOption('balanced');await page.locator('[data-close="settings"]').click();
 await page.locator('#scene canvas').click({position:{x:700,y:300}});await page.keyboard.press('r');await page.waitForTimeout(4000);await page.locator('#tour').click();expect(await page.evaluate(()=>__taipei.touring)).toBe(true);await page.keyboard.press('Escape');expect(await page.evaluate(()=>__taipei.touring)).toBe(false);
 await page.locator('#credits-toggle').click();await expect(page.locator('#credits')).toBeVisible();await expect(page.locator('#data-stats')).toContainText('mapped heights');await page.locator('#credits-close').click();
 await page.screenshot({path:'test-results/desktop.png'});expect(errors).toEqual([]);
});

test('mobile layout and viewpoint controls work',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});const page=await context.newPage();await page.goto(process.env.TEST_URL||'http://127.0.0.1:5188');await page.waitForFunction(()=>window.__taipei?.ready,null,{timeout:90000});await expect(page.locator('#loading')).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390);await expect(page.locator('#audio-toggle')).toBeInViewport();await expect(page.locator('#quality')).toHaveValue('low');
 await page.locator('[data-place="1"]').tap();await expect(page.locator('#place-title')).toHaveText('Elephant Mountain');await page.waitForTimeout(4000);await page.screenshot({path:'test-results/mobile.png'});
 await page.locator('#help-toggle').tap();await expect(page.locator('#help')).toBeVisible();await page.locator('[data-close="help"]').tap();await context.close();
});
