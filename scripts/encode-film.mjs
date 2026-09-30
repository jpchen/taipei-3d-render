import {spawn} from 'node:child_process';
import {filmRoot as root,filmDuration,filmFrames} from './film-shots.mjs';
const ffmpeg=process.env.FFMPEG||'/opt/homebrew/bin/ffmpeg';
function run(args){return new Promise((resolve,reject)=>{const p=spawn(ffmpeg,args,{stdio:'inherit'});p.on('error',reject);p.on('exit',code=>code===0?resolve():reject(Error(`ffmpeg ${code}`)));});}
const filters=`fade=t=in:st=0:d=0.3,fade=t=out:st=${filmDuration-.5}:d=0.5,format=yuv420p`;
await run(['-y','-framerate','30','-i',`${root}/frames/%05d.png`,'-vf',filters,'-frames:v',String(filmFrames),'-c:v','libx264','-preset','slow','-crf','16','-profile:v','high','-level','4.2','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-movflags','+faststart','-an',`${root}/Taipei-at-Dusk-60s-1080p-master.mp4`]);
await run(['-y','-i',`${root}/Taipei-at-Dusk-60s-1080p-master.mp4`,'-i',`${root}/natural-ambience.wav`,'-map','0:v:0','-map','1:a:0','-c:v','copy','-af','loudnorm=I=-23:TP=-2:LRA=8','-c:a','aac','-b:a','256k','-ar','48000','-t',String(filmDuration),'-movflags','+faststart',`${root}/Taipei-at-Dusk-60s-natural-sound-1080p.mp4`]);
console.log('FINISHED: one-minute 1080p master and natural-sound edition.');
