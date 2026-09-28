import {test,expect} from '@playwright/test';
test('dragging the destination bar scrolls without selecting a destination',async({page})=>{
 await page.setViewportSize({width:900,height:850});await page.goto('/');await page.waitForFunction(()=>window.__taipei?.ready,null,{timeout:90000});await expect(page.locator('#loading')).toHaveCount(0);
 const bar=page.locator('.places'),box=await bar.boundingBox();
 for(const button of ['left','middle']){await bar.evaluate(el=>el.scrollLeft=0);await page.mouse.move(box.x+350,box.y+40);await page.mouse.down({button});await page.mouse.move(box.x+80,box.y+40,{steps:12});await page.mouse.up({button});expect(await bar.evaluate(el=>el.scrollLeft)).toBeGreaterThan(150);expect(await page.evaluate(()=>__taipei.place)).toBe(0);}
 await page.locator('[data-place="6"]').click();await expect(page.locator('#place-title')).toHaveText('Shilin Night Market');
 await page.locator('[data-place="0"]').focus();await page.keyboard.press('Enter');await expect(page.locator('#place-title')).toHaveText('Taipei 101');
});
