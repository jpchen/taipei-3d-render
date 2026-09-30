// Supply a local audio file you have permission to include in the conference film.
import {filmRoot,filmDuration} from './film-shots.mjs';
import {resolve} from 'node:path';import {stat} from 'node:fs/promises';import {execFileSync,spawn} from 'node:child_process';
const input=process.argv[2];if(!input)throw Error('Usage: node scripts/mux-film-music.mjs /path/to/authorized-audio-file');const audio=resolve(input);if(!(await stat(audio)).isFile())throw Error('Expected a local audio file');
const probe=JSON.parse(execFileSync('/opt/homebrew/bin/ffprobe',['-v','error','-show_entries','format=duration','-of','json',audio],{encoding:'utf8'}));if(!(Number(probe.format.duration)>=filmDuration))throw Error('Audio must contain at least 60 seconds');
const root=filmRoot,args=['-y','-i',`${root}/Taipei-at-Dusk-60s-1080p-master.mp4`,'-i',audio,'-map','0:v:0','-map','1:a:0','-c:v','copy','-af','volume=-1.5dB','-c:a','aac','-b:a','256k','-ar','48000','-t',String(filmDuration),'-movflags','+faststart',`${root}/Taipei-at-Dusk-60s-music-1080p.mp4`];
const p=spawn('/opt/homebrew/bin/ffmpeg',args,{stdio:'inherit'});p.on('exit',code=>{process.exitCode=code;});
