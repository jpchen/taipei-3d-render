export function enableDestinationScroll(bar){
 let gesture=null,suppressClick=false;
 bar.addEventListener('pointerdown',e=>{suppressClick=false;if(e.pointerType==='touch'||![0,1].includes(e.button))return;gesture={id:e.pointerId,x:e.clientX,scroll:bar.scrollLeft,dragging:false};if(e.button===1)e.preventDefault();});
 window.addEventListener('pointermove',e=>{if(!gesture||e.pointerId!==gesture.id)return;const dx=e.clientX-gesture.x;if(!gesture.dragging&&Math.abs(dx)>6){gesture.dragging=true;suppressClick=true;bar.setPointerCapture(e.pointerId);bar.classList.add('dragging');}if(gesture.dragging){e.preventDefault();bar.scrollLeft=gesture.scroll-dx;}});
 function finish(e){if(!gesture||e.pointerId!==gesture.id)return;if(bar.hasPointerCapture(e.pointerId))bar.releasePointerCapture(e.pointerId);gesture=null;bar.classList.remove('dragging');}
 window.addEventListener('pointerup',finish);window.addEventListener('pointercancel',finish);window.addEventListener('blur',()=>{gesture=null;bar.classList.remove('dragging');});
 bar.addEventListener('click',e=>{if(suppressClick&&e.detail!==0){e.preventDefault();e.stopImmediatePropagation();suppressClick=false;}},true);
 bar.addEventListener('auxclick',e=>{if(e.button===1)e.preventDefault();});
 bar.addEventListener('dragstart',e=>e.preventDefault());
}
