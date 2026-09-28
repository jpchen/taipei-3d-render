import {test,expect} from '@playwright/test';
test('Grand Hotel has a detailed model and its own reachable destination',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('/');await page.waitForFunction(()=>window.__taipei?.ready,null,{timeout:90000});await expect(page.locator('#loading')).toHaveCount(0);
 await page.locator('[data-place="7"]').click();await expect(page.locator('#place-title')).toHaveText('Grand Hotel');await page.waitForTimeout(4000);await expect(page.locator('[data-place="7"]')).toBeInViewport();
 const model=await page.evaluate(()=>{const hotel=__taipei.scene.getObjectByName('grand-hotel');return {meshes:hotel.children.length,rotation:hotel.rotation.y,vertices:hotel.children.reduce((n,m)=>n+m.geometry.attributes.position.count,0)};});
 expect(model.meshes).toBe(6);expect(model.vertices).toBeGreaterThan(10000);expect(model.rotation).toBeCloseTo(-.397);await page.screenshot({path:'test-results/grand-hotel.png'});expect(errors).toEqual([]);
});
