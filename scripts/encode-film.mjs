import {writeFile,mkdir} from 'node:fs/promises';import {spawn} from 'node:child_process';import {shots} from './film-shots.mjs';
const root='renders/taipei-overview',serif='/System/Library/Fonts/Supplemental/Georgia.ttf',sans='/System/Library/Fonts/Supplemental/Arial.ttf';
await mkdir(`${root}/titles`,{recursive:true});const filters=[];let id=0;
async function title(text,start,end,x,y,size,font=sans){const path=`${root}/titles/${id++}.txt`;await writeFile(path,text);const alpha=`if(lt(t,${start}),0,if(lt(t,${start+.25}),(t-${start})/.25,if(lt(t,${end-.25}),1,if(lt(t,${end}),(${end}-t)/.25,0))))`;filters.push(`drawtext=fontfile='${font}':textfile='${path}':fontsize=${size}:fontcolor=white:x=${x}:y=${y}:shadowcolor=black@0.45:shadowx=1:shadowy=2:alpha='${alpha}'`);}
await title('TAIPEI',.25,4.7,76,798,94,serif);await title('A T   D U S K',.5,4.7,80,912,25);
let start=0;for(const shot of shots){if(start>0)await title(shot.label,start+.12,start+shot.duration-.10,72,72,23);start+=shot.duration;}
await title('A city to explore.',27.2,30,76,848,58,serif);await title('taipei.jonathanpchen.com',27.45,30,80,932,26);await title('Map data © OpenStreetMap contributors',26.4,30,'w-tw-40','h-36',15);
filters.push('fade=t=in:st=0:d=0.25','fade=t=out:st=29.6:d=0.4','format=yuv420p');await writeFile(`${root}/film-filter.txt`,filters.join(','));
function run(args){return new Promise((resolve,reject)=>{const p=spawn('/opt/homebrew/bin/ffmpeg',args,{stdio:'inherit'});p.on('exit',code=>code===0?resolve():reject(Error(`ffmpeg ${code}`)));});}
await run(['-y','-framerate','30','-i',`${root}/frames/%05d.png`,'-filter_script:v',`${root}/film-filter.txt`,'-frames:v','900','-c:v','libx264','-preset','slow','-crf','16','-profile:v','high','-level','4.2','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-movflags','+faststart','-an',`${root}/Taipei-at-Dusk-1080p-master.mp4`]);
await run(['-y','-i',`${root}/Taipei-at-Dusk-1080p-master.mp4`,'-i',`${root}/natural-ambience.wav`,'-map','0:v:0','-map','1:a:0','-c:v','copy','-af','loudnorm=I=-23:TP=-2:LRA=8','-c:a','aac','-b:a','256k','-ar','48000','-t','30','-movflags','+faststart',`${root}/Taipei-at-Dusk-natural-sound-1080p.mp4`]);
console.log('FINISHED: 1080p master and natural-sound edition.');
