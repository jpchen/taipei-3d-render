import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'});
try{
 const page=await browser.newPage({viewport:{width:1200,height:630},deviceScaleFactor:1});
 await page.goto(process.env.CAPTURE_URL||'http://127.0.0.1:5188');
 await page.waitForFunction(()=>window.__taipei?.ready,null,{timeout:90000});await page.locator('#loading').waitFor({state:'detached'});
 await page.addStyleTag({content:'#app > :not(#scene){visibility:hidden!important}'});
 await page.waitForTimeout(400);await mkdir('public/social',{recursive:true});
 await page.screenshot({path:'public/social/taipei-101-sunset.png'});
 console.log('Captured the actual Taipei 101 scene at 1200×630.');
}finally{await browser.close();}
