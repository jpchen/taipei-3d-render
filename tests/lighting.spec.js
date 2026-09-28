import {test,expect} from '@playwright/test';
import {PNG} from 'pngjs';

function skyColor(buffer){
 const png=PNG.sync.read(buffer),sum=[0,0,0];let count=0;
 for(let y=100;y<Math.min(185,png.height);y+=3)for(let x=Math.floor(png.width*.15);x<png.width*.85;x+=3){const i=(y*png.width+x)*4;for(let channel=0;channel<3;channel++)sum[channel]+=png.data[i+channel];count++;}
 return sum.map(n=>n/count);
}

test('golden-hour and blue-hour renders have distinct skies and no shader errors',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('/');await page.waitForFunction(()=>window.__taipei?.ready,null,{timeout:90000});await expect(page.locator('#loading')).toHaveCount(0);
 await page.waitForTimeout(400);const golden=skyColor(await page.screenshot({path:'test-results/golden-hour.png'}));
 await page.locator('#settings-toggle').click();await page.locator('#time').fill('95');await page.locator('[data-close="settings"]').click();await page.waitForTimeout(550);
 const blue=skyColor(await page.screenshot({path:'test-results/blue-hour.png'}));
 expect(golden[0]/golden[2]).toBeGreaterThan(blue[0]/blue[2]);expect(Math.hypot(...golden.map((n,i)=>n-blue[i]))).toBeGreaterThan(20);
 expect(await page.evaluate(()=>__taipei.scene.environment?.isTexture)).toBe(true);expect(errors).toEqual([]);
});
