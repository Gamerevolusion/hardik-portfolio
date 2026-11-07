"use client";
import { useEffect, useRef, useState } from "react";
import { RotateCcw, FastForward } from "lucide-react";

const crew = [
  {name:"Layout",color:"#b9adff"}, {name:"Type",color:"#e6b88a"},
  {name:"Systems",color:"#8cd8d2"}, {name:"Play",color:"#df9dbd"}
];
type Job = {el:HTMLElement;start:number;duration:number;lane:number;x:number;y:number;w:number;h:number;dx:number;dy:number;angle:number;outline:HTMLDivElement;guideX:HTMLDivElement;guideY:HTMLDivElement;original:{transform:string;opacity:string;maskImage:string;maskSize:string;maskRepeat:string;transformOrigin:string};done:boolean};
const smooth=(p:number)=>{p=Math.max(0,Math.min(1,p));return p*p*(3-2*p);};

export function SwarmRebuild({replay}:{replay:number}) {
  const layer=useRef<HTMLDivElement>(null),stop=useRef(()=>{});
  const [running,setRunning]=useState(false),[speed,setSpeed]=useState(1),[cycle,setCycle]=useState(0),[skipped,setSkipped]=useState(false);
  useEffect(()=>{setSkipped(false);},[replay,cycle]);
  useEffect(()=>{
    const surface=layer.current!,motion=matchMedia("(prefers-reduced-motion: reduce)");
    if(skipped||motion.matches){setRunning(false);return;}
    let disposed=false,raf=0,observer:IntersectionObserver|null=null;
    let draw:(now:number)=>void=()=>{};
    const jobs:Job[]=[],seen=new Set<HTMLElement>();
    const laneEnds=crew.map(()=>performance.now()+250/speed);
    let serial=0;
    const cursors=crew.map(person=>{
      const el=document.createElement("div");el.className="builder-cursor";el.style.setProperty("--cursor-color",person.color);
      el.innerHTML='<svg viewBox="0 0 24 28"><path d="M3 2L4 23L10 17L14 26L18 24L14 15L22 14Z"/></svg>';
      const label=document.createElement("span");label.textContent=person.name;el.appendChild(label);surface.appendChild(el);return el;
    });
    const restore=(j:Job)=>{Object.assign(j.el.style,j.original);j.outline.remove();j.guideX.remove();j.guideY.remove();j.done=true;};
    const enqueue=(elements:HTMLElement[],initial=false)=>{
      if(disposed)return;
      const now=performance.now();
      for(const el of elements){
        const box=el.getBoundingClientRect();
        if(seen.has(el)||box.width<2||box.height<2||getComputedStyle(el).display==="none")continue;
        seen.add(el);const n=serial++,lane=n%crew.length;
        const start=Math.max(now+(initial?180+n*95:60)/speed,laneEnds[lane]);
        const duration=(initial?2350:1450)/speed;laneEnds[lane]=start+duration+100/speed;
        const outline=document.createElement("div");outline.className="swarm-selection";outline.style.setProperty("--cursor-color",crew[lane].color);
        for(let k=0;k<8;k++){const h=document.createElement("i");h.className='selection-handle handle-'+k;outline.appendChild(h);}
        const name=document.createElement("span");name.className="selection-name";name.textContent=el.dataset.layer||el.tagName.toLowerCase();outline.appendChild(name);
        const dims=document.createElement("span");dims.className="selection-size";outline.appendChild(dims);
        const guideX=document.createElement("div"),guideY=document.createElement("div");guideX.className="snap-guide snap-x";guideY.className="snap-guide snap-y";
        [outline,guideX,guideY].forEach(node=>surface.appendChild(node));
        const original={transform:el.style.transform,opacity:el.style.opacity,maskImage:el.style.maskImage,maskSize:el.style.maskSize,maskRepeat:el.style.maskRepeat,transformOrigin:el.style.transformOrigin};
        const range=Math.min(180,innerWidth*.19);
        const j:Job={el,start,duration,lane,x:box.left,y:box.top+scrollY,w:box.width,h:box.height,dx:(n%2?1:-1)*range,dy:(n%3===0?-95:105),angle:(n%2?1:-1)*7,outline,guideX,guideY,original,done:false};
        el.style.opacity="0";el.style.transformOrigin="0 0";jobs.push(j);
      }
      if(jobs.some(j=>!j.done)){setRunning(true);if(!raf)raf=requestAnimationFrame(now=>draw(now));}
    };
    const candidates=Array.from(document.querySelectorAll<HTMLElement>('[data-build]'));
    enqueue(candidates.filter(el=>{const r=el.getBoundingClientRect();return r.top<innerHeight&&r.bottom>0;}),true);
    observer=new IntersectionObserver(entries=>enqueue(entries.filter(e=>e.isIntersecting).map(e=>e.target as HTMLElement)),{threshold:.13});
    candidates.forEach(el=>observer!.observe(el));
    draw=now=>{
      if(disposed)return;
      cursors.forEach(c=>{c.style.opacity="0";});
      let active=false;
      for(const j of jobs){
        if(j.done)continue;
        const p=(now-j.start)/j.duration;
        if(p<0){active=true;continue;}
        if(p>=1){restore(j);continue;}
        active=true;
        const created=smooth(p/.18),drag=smooth((p-.24)/.57),size=smooth((p-.12)/.19);
        const wobble=Math.sin(drag*Math.PI)*18*(j.lane%2?1:-1);
        const dx=j.dx*(1-drag),dy=j.dy*(1-drag)+wobble,angle=j.angle*(1-drag),sx=.78+.22*size,sy=.72+.28*size;
        const left=j.x+dx,top=j.y-scrollY+dy;
        j.el.style.opacity=String(created);
        j.el.style.transform=`translate3d(${dx}px,${dy}px,0) rotate(${angle}deg) scale(${sx},${sy})`;
        if(j.el.dataset.build==="type"&&p<.25){j.el.style.maskImage="linear-gradient(#000,#000)";j.el.style.maskRepeat="no-repeat";j.el.style.maskSize=`${Math.floor(Math.min(1,p/.24)*28)/28*100}% 100%`;}
        else{j.el.style.maskImage=j.original.maskImage;j.el.style.maskSize=j.original.maskSize;j.el.style.maskRepeat=j.original.maskRepeat;}
        Object.assign(j.outline.style,{display:"block",left:`${left}px`,top:`${top}px`,width:`${j.w*sx}px`,height:`${j.h*sy}px`,transform:`rotate(${angle}deg)`,opacity:String(p>.89?(1-p)/.11:1)});
        j.outline.dataset.phase=p<.24?"resize":p<.82?"drag":"snap";
        j.outline.querySelector('.selection-size')!.textContent=`${Math.round(j.w*sx)} × ${Math.round(j.h*sy)}`;
        const guideOpacity=p>.73&&p<.94?"1":"0";
        Object.assign(j.guideX.style,{left:`${j.x}px`,opacity:guideOpacity});Object.assign(j.guideY.style,{top:`${j.y-scrollY}px`,opacity:guideOpacity});
        const cursor=cursors[j.lane];
        const px=p<.24?j.w*sx:j.w*sx*.32,py=p<.24?j.h*sy:Math.min(24,j.h*.35);
        const r=angle*Math.PI/180;
        const x=left+px*Math.cos(r)-py*Math.sin(r),y=top+px*Math.sin(r)+py*Math.cos(r);
        cursor.style.opacity="1";cursor.dataset.action=p<.24?"resize":p<.82?"drag":"release";
        cursor.style.transform=`translate3d(${x}px,${y}px,0) scale(${p>.24&&p<.82?.86:1})`;
      }
      if(active)raf=requestAnimationFrame(draw);else{raf=0;setRunning(false);}
    };
    const cleanup=()=>{if(disposed)return;disposed=true;cancelAnimationFrame(raf);observer?.disconnect();jobs.filter(j=>!j.done).forEach(restore);surface.replaceChildren();setRunning(false);};
    stop.current=cleanup;
    const key=(e:KeyboardEvent)=>{if(e.key==="Escape"){setSkipped(true);cleanup();}};
    const interrupt=()=>{setSkipped(true);cleanup();};
    const changed=()=>{if(motion.matches)cleanup();};
    document.addEventListener("keydown",key);window.addEventListener("portfolio:interrupt",interrupt);motion.addEventListener("change",changed);
    return()=>{cleanup();document.removeEventListener("keydown",key);window.removeEventListener("portfolio:interrupt",interrupt);motion.removeEventListener("change",changed);};
  },[replay,cycle,speed,skipped]);
  return <><div ref={layer} className="swarm-layer" aria-hidden="true"/>{running&&<div className="swarm-toolbar" aria-label="Assembly controls"><span className="assembly-status"><i/> Assembling the scene</span><button onClick={()=>setSpeed(v=>v===3?1:v+1)} aria-label={`Assembly speed ${speed} times`}>{speed}×</button><button aria-label="Replay assembly" onClick={()=>setCycle(v=>v+1)}><RotateCcw size={14}/></button><button onClick={()=>{setSkipped(true);stop.current();}} className="skip-assembly">Skip <FastForward size={13}/></button></div>}</>;
}
