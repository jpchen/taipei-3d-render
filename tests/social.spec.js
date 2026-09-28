import {test,expect} from '@playwright/test';
import {PNG} from 'pngjs';
test('link crawlers receive a full-size Taipei render without running JavaScript',async({request})=>{
 const response=await request.get('/',{headers:{'User-Agent':'Twitterbot/1.0'}});expect(response.ok()).toBeTruthy();const html=await response.text(),head=html.split('</head>')[0];
 expect(head).toContain('name="twitter:card" content="summary_large_image"');const image=head.match(/property="og:image" content="([^"]+)"/)[1];expect(image).toMatch(/^https:\/\/taipei\.jonathanpchen\.com\/social\//);
 const asset=await request.get(new URL(image).pathname);expect(asset.ok()).toBeTruthy();expect(asset.headers()['content-type']).toContain('image/png');const png=PNG.sync.read(await asset.body());expect(png.width).toBe(1200);expect(png.height).toBe(630);expect(png.data.length).toBe(1200*630*4);
});
