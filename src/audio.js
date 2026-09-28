// Original synthesized ambience. Nothing is recorded or streamed from third parties.
export class TaipeiAudio {
  constructor() { this.enabled=false; this.volume=.55; this.ctx=null; }
  async toggle() {
    if(!this.ctx) this.create();
    await this.ctx.resume(); this.enabled=!this.enabled;this.updateGain();return this.enabled;
  }
  create() {
    const ctx=this.ctx=new AudioContext();
    this.master=ctx.createGain();this.master.gain.value=0;this.master.connect(ctx.destination);
    const noise=ctx.createBuffer(2,ctx.sampleRate*8,ctx.sampleRate);
    for(let c=0;c<2;c++){const a=noise.getChannelData(c);let last=0;for(let i=0;i<a.length;i++){last=(last+Math.random()*.04-.02)/1.02;a[i]=last*3;}}
    const source=ctx.createBufferSource();source.buffer=noise;source.loop=true;
    const wind=ctx.createBiquadFilter();wind.type='lowpass';wind.frequency.value=700;
    const gain=ctx.createGain();gain.gain.value=.36;source.connect(wind).connect(gain).connect(this.master);source.start();
    this.traffic=ctx.createGain();this.traffic.gain.value=.13;this.traffic.connect(this.master);
    for(const f of [48,71,97]){const o=ctx.createOscillator();o.type='sine';o.frequency.value=f;const g=ctx.createGain();g.gain.value=.07;o.connect(g).connect(this.traffic);o.start();}
    // Distant cicada chorus with slow, irregular changes in stereo position.
    const insect=ctx.createBufferSource();insect.buffer=noise;insect.loop=true;
    const band=ctx.createBiquadFilter();band.type='bandpass';band.frequency.value=4100;band.Q.value=6;
    const insectGain=ctx.createGain();insectGain.gain.value=.10;insect.connect(band).connect(insectGain).connect(this.master);insect.start();
    const lfo=ctx.createOscillator();lfo.frequency.value=.16;const mod=ctx.createGain();mod.gain.value=.06;lfo.connect(mod).connect(insectGain.gain);lfo.start();
    this.timer=setInterval(()=>{if(this.enabled&&document.visibilityState==='visible')this.bird();},6700);
    document.addEventListener('visibilitychange',()=>{if(document.hidden)ctx.suspend();else if(this.enabled)ctx.resume();});
  }
  bird(){const c=this.ctx,t=c.currentTime;const p=c.createStereoPanner();p.pan.value=Math.random()*1.6-.8;p.connect(this.master);for(let i=0;i<3;i++){const o=c.createOscillator(),g=c.createGain();o.frequency.setValueAtTime(1800+i*140,t+i*.16);o.frequency.exponentialRampToValueAtTime(2700,t+i*.16+.065);g.gain.setValueAtTime(0,t+i*.16);g.gain.linearRampToValueAtTime(.018,t+i*.16+.02);g.gain.exponentialRampToValueAtTime(.0001,t+i*.16+.12);o.connect(g).connect(p);o.start(t+i*.16);o.stop(t+i*.16+.15);o.onended=()=>{o.disconnect();g.disconnect();if(i===2)p.disconnect();};}}
  setVolume(v){this.volume=v;this.updateGain();}
  updateGain(){if(this.ctx)this.master.gain.setTargetAtTime(this.enabled?this.volume*.65:0,this.ctx.currentTime,.4);}
  update(altitude){if(this.ctx)this.traffic.gain.setTargetAtTime(.3/(1+altitude/250),this.ctx.currentTime,1);}
}
