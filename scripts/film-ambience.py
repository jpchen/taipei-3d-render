"""Original synthesized stereo ambience; no third-party recordings."""
import numpy as np
from scipy.signal import butter,sosfilt
from scipy.io.wavfile import write
from pathlib import Path
sr=48000;duration=30;n=sr*duration;t=np.arange(n)/sr;rng=np.random.default_rng(5829);out=np.zeros((n,2),dtype=np.float64)
def noise(lo,hi):
 sos=butter(3,[lo,hi] if lo else hi,btype='bandpass' if lo else 'lowpass',fs=sr,output='sos');v=sosfilt(sos,rng.standard_normal(n));return v/(np.std(v)+1e-9)
def envelope(a,b,fade=.8):return np.clip((t-a)/fade,0,1)*np.clip((b-t)/fade,0,1)
for ch in range(2):
 out[:,ch]+=noise(30,700)*.008*(.75+.2*np.sin(t*.31+ch))
 out[:,ch]+=noise(45,190)*.005*(1-envelope(10,20))
 out[:,ch]+=noise(400,3400)*.004*envelope(19,26)*(.6+.35*np.sin(t*1.3+ch))
 out[:,ch]+=noise(1200,5700)*.0025*envelope(25,31)
for freq in [48,71,97]:
 wave=np.sin(2*np.pi*(freq*t+.07*np.sin(t*.5)))*.0015
 out+=wave[:,None]
def event(start,signal,pan,volume):
 i=int(start*sr);m=min(len(signal),n-i)
 if i<0 or m<=0:return
 out[i:i+m,0]+=signal[:m]*np.sqrt((1-pan)/2)*volume
 out[i:i+m,1]+=signal[:m]*np.sqrt((1+pan)/2)*volume
for start in [1.5,6.2,9.6,11.4,12.8,14.9,16.1,18.3,21.1,23.6]:
 for j in range(3):
  u=np.arange(int(.13*sr))/sr;phase=2*np.pi*(1800*u+3300*u*u);bird=np.sin(phase)*np.sin(np.pi*u/.13)**2
  event(start+j*.17,bird,float(rng.uniform(-.7,.7)),.009 if 11<start<17 else .0035)
for start in np.arange(23.2,29.5,.48):
 u=np.arange(int(.08*sr))/sr;step=rng.standard_normal(len(u))*np.exp(-u*65);event(start,step,float(rng.uniform(-.7,.7)),.005)
for start in [24.1,26.4,27.8,29.0]:
 u=np.arange(int(.35*sr))/sr;clink=(np.sin(2*np.pi*1750*u)+.4*np.sin(2*np.pi*2830*u))*np.exp(-u*19);event(start,clink,float(rng.uniform(-.6,.6)),.005)
fade=np.clip(t/.5,0,1)*np.clip((duration-t)/.7,0,1);out*=fade[:,None]
Path('renders/taipei-overview').mkdir(parents=True,exist_ok=True);write('renders/taipei-overview/natural-ambience.wav',sr,out.astype(np.float32));print('Created 30-second original stereo soundscape',np.max(np.abs(out)))
