"use client";
import { useEffect, useRef, useState } from "react";
import type * as ThreeTypes from "three";

type SceneSettings={exploded:boolean;wireframe:boolean;paused:boolean};
export function Scene3D(settings:SceneSettings){
  const host=useRef<HTMLDivElement>(null),current=useRef(settings),invalidate=useRef(()=>{});
  current.current=settings;
  const [available,setAvailable]=useState(true);
  useEffect(()=>{invalidate.current();},[settings.exploded,settings.wireframe,settings.paused]);
  useEffect(()=>{
    let cleanup=()=>{},cancelled=false;
    const init=async()=>{
      try{
        const [THREE,{RoundedBoxGeometry},{RoomEnvironment}]=await Promise.all([import("three"),import("three/addons/geometries/RoundedBoxGeometry.js"),import("three/addons/environments/RoomEnvironment.js")]);
        if(cancelled||!host.current)return;
        const container=host.current;
        const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:"high-performance"});
        renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<700?1.3:1.7));renderer.setClearColor(0x000000,0);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
        renderer.domElement.setAttribute('aria-hidden','true');container.appendChild(renderer.domElement);
        const scene=new THREE.Scene();
        const camera=new THREE.PerspectiveCamera(35,1,.1,100);camera.position.set(6.3,3.8,8.5);camera.lookAt(0,0,0);
        const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();
        const env=pmrem.fromScene(room,.04);scene.environment=env.texture;scene.environmentIntensity=.55;room.dispose();pmrem.dispose();
        scene.add(new THREE.AmbientLight(0xd1d6d4,.3));
        const key=new THREE.DirectionalLight(0xe9e4d8,2.5);key.position.set(2,6,4);scene.add(key);
        const cyan=new THREE.DirectionalLight(0x99dcd2,2.7);cyan.position.set(-5,2,-2);scene.add(cyan);
        const rim=new THREE.PointLight(0xd5beee,22,18,2);rim.position.set(4,-1,-3);scene.add(rim);
        const group=new THREE.Group();group.rotation.set(.08,-.35,.08);scene.add(group);
        const brushedCanvas=document.createElement('canvas');brushedCanvas.width=128;brushedCanvas.height=128;
        const brush=brushedCanvas.getContext('2d')!;brush.fillStyle='#858585';brush.fillRect(0,0,128,128);
        for(let y=0;y<128;y++){const v=Math.round(115+Math.sin(y*41.73)*17);brush.fillStyle=`rgb(${v},${v},${v})`;brush.fillRect(0,y,128,1);}
        const texture=new THREE.CanvasTexture(brushedCanvas);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
        const metal=new THREE.MeshStandardMaterial({color:0x636c68,metalness:.96,roughness:.22,bumpMap:texture,bumpScale:.035});
        const dark=new THREE.MeshStandardMaterial({color:0x202827,metalness:.9,roughness:.28});
        const porcelain=new THREE.MeshStandardMaterial({color:0xc9cdc6,metalness:.8,roughness:.16});
        const emissive=new THREE.MeshStandardMaterial({color:0x8bcec2,emissive:0x62ac9d,emissiveIntensity:1.9,roughness:.6});
        const unit=new RoundedBoxGeometry(1,1,1,2,.11);
        const parts:ThreeTypes.Mesh[]=[];
        const add=(w:number,h:number,d:number,x:number,y:number,z:number,mat=metal)=>{
          const mesh=new THREE.Mesh(unit,mat);mesh.scale.set(w,h,d);mesh.position.set(x,y,z);
          mesh.userData.home=mesh.position.clone();mesh.userData.direction=mesh.position.clone().normalize();mesh.userData.turn=(parts.length%2?1:-1)*.06;
          group.add(mesh);parts.push(mesh);return mesh;
        };
        for(const z of [-.58,.58])for(let i=0;i<6;i++){
          const angle=(i+.5)*Math.PI/3;
          const x=Math.cos(angle)*1.82,y=Math.sin(angle)*1.82;
          const segment=add(1.94,.32,.4,x,y,z,i%3===0?dark:metal);segment.rotation.z=angle+Math.PI/2;
          const light=add(1.56,.018,.022,x*.92,y*.92,z+.215,emissive);light.rotation.z=angle+Math.PI/2;
          const vertex=i*Math.PI/3;
          const cap=add(.43,.43,.46,Math.cos(vertex)*2.1,Math.sin(vertex)*2.1,z,dark);cap.rotation.z=vertex+Math.PI/4;
        }
        for(let i=0;i<6;i++){
          const angle=i*Math.PI/3;
          add(.13,.13,1.35,Math.cos(angle)*2.08,Math.sin(angle)*2.08,0,metal);
          const fin=add(.5,.15,.82,Math.cos(angle)*1.85,Math.sin(angle)*1.85,0,metal);fin.rotation.z=angle+Math.PI/2;
        }
        const inner=new THREE.Group();group.add(inner);
        const crystalGeo=new THREE.OctahedronGeometry(.77,0);
        const crystal=new THREE.Mesh(crystalGeo,porcelain);inner.add(crystal);
        const edgeGeometry=new THREE.EdgesGeometry(crystalGeo);
        const edges=new THREE.LineSegments(edgeGeometry,new THREE.LineBasicMaterial({color:0xedf7ef,transparent:true,opacity:.35}));inner.add(edges);
        const orbitGeo=new THREE.TorusGeometry(1.01,.009,6,100);
        for(let i=0;i<2;i++){const orbit=new THREE.Mesh(orbitGeo,emissive);orbit.rotation.set(i*Math.PI/2,.45,.6);inner.add(orbit);}
        const dustGeo=new THREE.BufferGeometry(),positions=new Float32Array(360*3);
        for(let i=0;i<360;i++){positions[i*3]=Math.sin(i*133.13)*8;positions[i*3+1]=Math.cos(i*87.32)*5;positions[i*3+2]=Math.sin(i*37.18)*7;}
        dustGeo.setAttribute('position',new THREE.BufferAttribute(positions,3));const dustMat=new THREE.PointsMaterial({color:0x7d8881,size:.012,transparent:true,opacity:.4,sizeAttenuation:true});const dust=new THREE.Points(dustGeo,dustMat);scene.add(dust);
        const floorGeo=new THREE.RingGeometry(1.8,3.3,90),floorMat=new THREE.MeshBasicMaterial({color:0x758780,transparent:true,opacity:.035,side:THREE.DoubleSide});
        const floor=new THREE.Mesh(floorGeo,floorMat);floor.rotation.x=-Math.PI/2;floor.position.y=-2.6;scene.add(floor);
        let raf=0,inView=true,dragging=false,lastX=0,lastY=0,yaw=-.35,pitch=.08,explode=0,wire=false;
        const motion=matchMedia('(prefers-reduced-motion: reduce)'),started=performance.now();let last=0;
        const pointer={x:0,y:0};
        const render=(now:number)=>{
          raf=0;if(cancelled)return;
          const dt=Math.min(.04,(now-last)/1000||.016);last=now;
          const t=(now-started)/1000,assemble=motion.matches?0:Math.max(0,1-t/2.7);
          explode=motion.matches?Number(current.current.exploded):explode+(Number(current.current.exploded)-explode)*Math.min(1,dt*5);
          const spread=explode*1.05+assemble*assemble*2.8;
          parts.forEach(p=>{p.position.copy(p.userData.home).addScaledVector(p.userData.direction,spread);p.rotation.y=spread*p.userData.turn;});
          if(wire!==current.current.wireframe){wire=current.current.wireframe;[metal,dark,porcelain,emissive].forEach(m=>{m.wireframe=wire;});}
          const moving=!motion.matches&&!current.current.paused;
          if(moving&&!dragging)yaw+=dt*.045;
          group.rotation.y+=(yaw-group.rotation.y)*.085;group.rotation.x+=(pitch-group.rotation.x)*.085;
          group.position.y=moving?Math.sin(t*.65)*.055:0;inner.rotation.y=moving?t*.18:inner.rotation.y;
          camera.position.x+=(6.3+pointer.x*.6-camera.position.x)*.04;camera.position.y+=(3.8-pointer.y*.45-camera.position.y)*.04;camera.lookAt(0,0,0);
          renderer.render(scene,camera);
          if(inView&&(moving||assemble>0||Math.abs(explode-Number(current.current.exploded))>.001||dragging))raf=requestAnimationFrame(render);
        };
        const request=()=>{if(!raf&&!cancelled)raf=requestAnimationFrame(render);};invalidate.current=request;
        const resize=()=>{const b=container.getBoundingClientRect();if(!b.width||!b.height)return;renderer.setSize(b.width,b.height);camera.aspect=b.width/b.height;camera.position.z=b.width<480?11.4:8.5;camera.updateProjectionMatrix();request();};
        const ro=new ResizeObserver(resize);ro.observe(container);
        const io=new IntersectionObserver(([entry])=>{inView=entry.isIntersecting;if(inView)request();else{cancelAnimationFrame(raf);raf=0;}},{rootMargin:'80px'});io.observe(container);
        const down=(e:PointerEvent)=>{if(e.button!==0)return;dragging=true;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture(e.pointerId);container.dataset.dragging="true";request();};
        const move=(e:PointerEvent)=>{const b=container.getBoundingClientRect();pointer.x=(e.clientX-b.left)/b.width-.5;pointer.y=(e.clientY-b.top)/b.height-.5;if(dragging){yaw+=(e.clientX-lastX)*.008;pitch=Math.max(-.8,Math.min(.9,pitch+(e.clientY-lastY)*.006));lastX=e.clientX;lastY=e.clientY;}request();};
        const up=()=>{dragging=false;container.dataset.dragging="false";request();};
        renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointermove',move);renderer.domElement.addEventListener('pointerup',up);renderer.domElement.addEventListener('pointercancel',up);
        const keys=(e:KeyboardEvent)=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key))return;e.preventDefault();if(e.key==='ArrowLeft')yaw-=.15;if(e.key==='ArrowRight')yaw+=.15;if(e.key==='ArrowUp')pitch=Math.max(-.8,pitch-.12);if(e.key==='ArrowDown')pitch=Math.min(.9,pitch+.12);if(e.key==='Home'){yaw=-.35;pitch=.08;}group.rotation.set(pitch,yaw,.08);request();};container.addEventListener('keydown',keys);
        const lost=(e:Event)=>{e.preventDefault();cancelAnimationFrame(raf);setAvailable(false);};renderer.domElement.addEventListener('webglcontextlost',lost);
        resize();request();
        cleanup=()=>{cancelAnimationFrame(raf);container.removeEventListener('keydown',keys);ro.disconnect();io.disconnect();renderer.domElement.removeEventListener('pointerdown',down);renderer.domElement.removeEventListener('pointermove',move);renderer.domElement.removeEventListener('pointerup',up);renderer.domElement.removeEventListener('pointercancel',up);renderer.domElement.removeEventListener('webglcontextlost',lost);[unit,crystalGeo,edgeGeometry,orbitGeo,dustGeo,floorGeo].forEach(g=>g.dispose());[metal,dark,porcelain,emissive,dustMat,floorMat,edges.material].forEach(m=>m.dispose());texture.dispose();env.dispose();renderer.dispose();renderer.domElement.remove();};
      }catch{if(!cancelled)setAvailable(false);}
    };
    init();return()=>{cancelled=true;cleanup();};
  },[]);
  return <div className="scene3d" ref={host} role="img" tabIndex={0} aria-label="Interactive 3D containment sculpture. Drag or use arrow keys to rotate it; use the controls to separate its parts or show its wireframe.">{!available&&<div className="scene-fallback" aria-hidden="true"><div/><div/><div/></div>}</div>;
}