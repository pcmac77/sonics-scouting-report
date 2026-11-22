import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import * as THREE from 'three';
import { START, RIM, evaluateSwipe, shotPosition, clamp } from './game';

function random(seed = 73) { let n=seed; return () => { n=(1664525*n+1013904223)>>>0; return n/4294967296; }; }
function ballTextures() {
  const rand=random(); const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=1024;
  const c=canvas.getContext('2d');c.fillStyle='#ba5218';c.fillRect(0,0,2048,1024);
  const bump=document.createElement('canvas');bump.width=2048;bump.height=1024;const b=bump.getContext('2d');b.fillStyle='#747474';b.fillRect(0,0,2048,1024);
  for(let row=0;row<180;row++) for(let col=0;col<350;col++) {
    const x=col*6+(row%2)*3+(rand()-.5)*1.5,y=row*6+(rand()-.5)*1.5,r=1.3+rand()*.8;
    const light=rand();c.fillStyle=`hsl(${20+rand()*5} 76% ${33+light*13}%)`;c.beginPath();c.ellipse(x,y,r,r*.82,0,0,Math.PI*2);c.fill();
    b.fillStyle=`rgb(${155+light*95},${155+light*95},${155+light*95})`;b.beginPath();b.arc(x,y,r,0,Math.PI*2);b.fill();
  }
  c.save();c.translate(1024,510);c.rotate(-.07);c.fillStyle='#351d15';c.textAlign='center';c.font='italic 900 84px Arial';c.fillText('SONICS',0,0);c.font='700 17px Arial';c.fillText('BUILT FOR THE LOVE OF THE GAME',0,34);c.restore();
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=8;
  const bumps=new THREE.CanvasTexture(bump);bumps.anisotropy=8;return {map,bumps};
}
function makeBall(textures) {
  const ball=new THREE.Group();const material=new THREE.MeshPhysicalMaterial({map:textures.map,bumpMap:textures.bumps,bumpScale:.028,roughness:.77,metalness:0,clearcoat:.12,clearcoatRoughness:.7});
  const sphere=new THREE.Mesh(new THREE.SphereGeometry(.72,96,64),material);sphere.castShadow=true;ball.add(sphere);
  const seamMat=new THREE.MeshStandardMaterial({color:'#211814',roughness:.96});
  // Recessed-looking black channels follow the sphere, never a flat image overlay.
  for (const normal of [new THREE.Vector3(1,0,0),new THREE.Vector3(0,1,0),new THREE.Vector3(0,0,1),new THREE.Vector3(1,0,1).normalize()]) {
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.7205,.0105,8,192),seamMat);
    ring.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),normal);ball.add(ring);
  }
  ball.rotation.set(.3,-.8,.22);return ball;
}
function floorTexture() {
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=1024;const c=canvas.getContext('2d'),rand=random(12);
  c.fillStyle='#463121';c.fillRect(0,0,1024,1024);
  for(let y=0;y<1024;y+=64) {
    for(let x=-512;x<1024;x+=256) { const shift=(y/64%2)*128;c.fillStyle=`hsl(28 29% ${19+rand()*8}%)`;c.fillRect(x+shift,y,255,63); }
    for(let i=0;i<100;i++) {c.strokeStyle=`rgba(205,162,105,${rand()*.08})`;c.beginPath();const yy=y+rand()*62;c.moveTo(0,yy);c.lineTo(1024,yy+rand()*3);c.stroke();}
  }
  const tex=new THREE.CanvasTexture(canvas);tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(10,10);tex.colorSpace=THREE.SRGBColorSpace;return tex;
}
function glowTexture() {
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;const c=canvas.getContext('2d'),g=c.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,156,70,1)');g.addColorStop(.2,'rgba(255,111,20,.25)');g.addColorStop(1,'rgba(255,80,0,0)');c.fillStyle=g;c.fillRect(0,0,128,128);return new THREE.CanvasTexture(canvas);
}
function buildHoop() {
  const group=new THREE.Group();const board=new THREE.Mesh(new THREE.BoxGeometry(3.2,1.95,.12),new THREE.MeshPhysicalMaterial({color:'#8a9fa6',transparent:true,opacity:.23,roughness:.15,metalness:.2}));board.position.set(0,4.7,-7.05);group.add(board);
  function line(points,color='#d1d8d3') {const l=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p))),new THREE.LineBasicMaterial({color,transparent:true,opacity:.7}));group.add(l);}
  line([[-1.6,3.73,-6.97],[-1.6,5.67,-6.97],[1.6,5.67,-6.97],[1.6,3.73,-6.97],[-1.6,3.73,-6.97]]);
  line([[-.55,3.97,-6.96],[-.55,4.65,-6.96],[.55,4.65,-6.96],[.55,3.97,-6.96],[-.55,3.97,-6.96]],'#fff0cd');
  const rim=new THREE.Mesh(new THREE.TorusGeometry(.61,.045,12,96),new THREE.MeshStandardMaterial({color:'#ff651c',emissive:'#e74100',emissiveIntensity:.3,roughness:.35,metalness:.5}));rim.rotation.x=Math.PI/2;rim.position.set(RIM.x,RIM.y,RIM.z);rim.castShadow=true;group.add(rim);
  const netMat=new THREE.LineBasicMaterial({color:'#e8e6db',transparent:true,opacity:.72});
  for(let i=0;i<16;i++) {
    const points=[];for(let j=0;j<=8;j++){const angle=i/16*Math.PI*2+(j%2)*.13,r=.59-j*.025;points.push(new THREE.Vector3(Math.cos(angle)*r,RIM.y-j*.105,RIM.z+Math.sin(angle)*r));}
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),netMat));
  }
  for(let j=1;j<8;j++){const points=[];for(let i=0;i<=32;i++){const a=i/32*Math.PI*2,r=.59-j*.025;points.push(new THREE.Vector3(Math.cos(a)*r,RIM.y-j*.105,RIM.z+Math.sin(a)*r));}group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),netMat));}
  const post=new THREE.Mesh(new THREE.CylinderGeometry(.08,.13,5.8,12),new THREE.MeshStandardMaterial({color:'#282e34',metalness:.7,roughness:.4}));post.position.set(0,2.9,-7.6);group.add(post);return group;
}

const Court=forwardRef(function Court({mode,motion,onShot,onBounce,onReady,onFallback,onFlight},ref) {
  const host=useRef(null),api=useRef(null),latest=useRef({mode,motion,onShot,onBounce,onReady,onFallback,onFlight});latest.current={mode,motion,onShot,onBounce,onReady,onFallback,onFlight};
  useImperativeHandle(ref,()=>({shoot:()=>api.current?.shoot({x:0,depth:0,made:true}),bounce:()=>api.current?.bounce(),reset:()=>api.current?.reset()}),[]);
  useEffect(()=>{
    let renderer;
    try {renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});} catch {latest.current.onFallback();return;}
    const container=host.current;container.appendChild(renderer.domElement);const canvas=renderer.domElement;
    canvas.setAttribute('aria-label','Interactive basketball. Drag to spin. In shooting mode, swipe up or use the Shoot button.');canvas.setAttribute('tabindex','0');
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.65));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;renderer.outputColorSpace=THREE.SRGBColorSpace;
    const scene=new THREE.Scene();scene.fog=new THREE.FogExp2('#080c10',.035);
    const camera=new THREE.PerspectiveCamera(43,1,.1,150);camera.position.set(0,3.1,9);
    scene.add(new THREE.HemisphereLight('#c7d9ff','#4d2412',1.7));
    const key=new THREE.SpotLight('#ffe8c8',160,35,Math.PI/4,.7,1.4);key.position.set(-3,9,5);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.bias=-.0004;key.shadow.normalBias=.02;scene.add(key);key.target.position.set(1,2,0);scene.add(key.target);
    const edge=new THREE.PointLight('#ff6b14',65,24,1.5);edge.position.set(5,4,-3);scene.add(edge);
    const fill=new THREE.DirectionalLight('#819fc7',2.1);fill.position.set(-6,3,-2);scene.add(fill);
    const textures=ballTextures(),ball=makeBall(textures);scene.add(ball);
    const courtTex=floorTexture();const floor=new THREE.Mesh(new THREE.PlaneGeometry(120,120),new THREE.MeshStandardMaterial({map:courtTex,roughness:.27,metalness:.25,color:'#6e665f'}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
    const shadowCanvas=document.createElement('canvas');shadowCanvas.width=128;shadowCanvas.height=128;const sc=shadowCanvas.getContext('2d'),sg=sc.createRadialGradient(64,64,5,64,64,64);sg.addColorStop(0,'rgba(0,0,0,.85)');sg.addColorStop(1,'transparent');sc.fillStyle=sg;sc.fillRect(0,0,128,128);const shadowTex=new THREE.CanvasTexture(shadowCanvas);
    const shadow=new THREE.Mesh(new THREE.PlaneGeometry(3.6,3.6),new THREE.MeshBasicMaterial({map:shadowTex,transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.015;scene.add(shadow);
    function courtLine(points,opacity=.3,color='#f6e4c8') {const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(p[0],.025,p[1]))),new THREE.LineBasicMaterial({color,transparent:true,opacity}));scene.add(line);}
    courtLine([[-8,5],[-8,-12],[8,-12],[8,5],[-8,5]],.22);courtLine([[-2.5,-7],[-2.5,-1],[2.5,-1],[2.5,-7]],.18);
    const arc=[];for(let i=0;i<=100;i++){const a=Math.PI*i/100;arc.push([Math.cos(a)*6,-7+Math.sin(a)*6]);}courtLine(arc,.3);courtLine([[-8,5],[8,5]],.3);
    const halo=new THREE.Mesh(new THREE.RingGeometry(1.25,1.27,120),new THREE.MeshBasicMaterial({color:'#ff8b29',transparent:true,opacity:.65,side:THREE.DoubleSide}));halo.rotation.x=-Math.PI/2;halo.position.y=.035;scene.add(halo);
    const wave=new THREE.Mesh(new THREE.RingGeometry(.95,1,96),new THREE.MeshBasicMaterial({color:'#ff9c3e',transparent:true,opacity:0,side:THREE.DoubleSide}));wave.rotation.x=-Math.PI/2;wave.position.y=.04;scene.add(wave);
    const hoop=buildHoop();scene.add(hoop);hoop.visible=false;
    const glow=glowTexture();const lights=[];for(let i=0;i<8;i++){const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:i%2?'#ff8b35':'#c4dcff',transparent:true,opacity:.65,depthWrite:false}));sprite.position.set((i-3.5)*3.5,6.8,-16);sprite.scale.set(1.2,1.2,1);scene.add(sprite);lights.push(sprite);}
    const dustGeo=new THREE.BufferGeometry(),dustPos=new Float32Array(160*3),rand=random(9);for(let i=0;i<160;i++){dustPos[i*3]=(rand()-.5)*30;dustPos[i*3+1]=rand()*10;dustPos[i*3+2]=(rand()-.5)*25;}dustGeo.setAttribute('position',new THREE.BufferAttribute(dustPos,3));const dust=new THREE.Points(dustGeo,new THREE.PointsMaterial({color:'#dfa35b',size:.025,transparent:true,opacity:.4,depthWrite:false}));scene.add(dust);
    const confetti=[];const confettiGeometry=new THREE.PlaneGeometry(.09,.16);for(let i=0;i<95;i++){const m=new THREE.Mesh(confettiGeometry,new THREE.MeshBasicMaterial({color:['#ff861d','#ffcc72','#daddea','#6e66e5'][i%4],side:THREE.DoubleSide,transparent:true}));m.visible=false;scene.add(m);confetti.push({mesh:m,v:new THREE.Vector3()});}
    let shot=null,bouncing=0,velocity={x:0,y:.004},pointer=null,last=performance.now(),raf,modeBefore='hero',celebration=0,waveAge=10,disposed=false;
    const shoot=result=>{if(latest.current.mode!=='play'||shot)return;shot={...result,age:0,reported:false};latest.current.onFlight(true);};
    const bounce=()=>{bouncing=1;waveAge=0;latest.current.onBounce();};
    api.current={shoot,bounce,reset:()=>{shot=null;celebration=0;confetti.forEach(p=>p.mesh.visible=false);}};
    function resize(){const w=container.clientWidth,h=container.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=w<650?51:43;camera.updateProjectionMatrix();}
    const observer=new ResizeObserver(resize);observer.observe(container);resize();
    const down=e=>{if(e.button!==0)return;pointer={x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,moved:0};canvas.setPointerCapture(e.pointerId);};
    const move=e=>{if(!pointer)return;const dx=e.clientX-pointer.lastX,dy=e.clientY-pointer.lastY;pointer.moved+=Math.abs(dx)+Math.abs(dy);if(latest.current.mode==='hero'){ball.rotation.y+=dx*.012;ball.rotation.x+=dy*.008;velocity={x:dy*.001,y:dx*.001};}pointer.lastX=e.clientX;pointer.lastY=e.clientY;};
    const up=e=>{if(!pointer)return;const p=pointer;pointer=null;if(latest.current.mode==='hero'){if(p.moved<12)bounce();}else if(latest.current.mode==='play'){const result=evaluateSwipe(e.clientX-p.x,e.clientY-p.y,container.clientWidth,container.clientHeight);if(result)shoot(result);}};
    const cancel=()=>{pointer=null;};canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',cancel);
    const contextLost=e=>{e.preventDefault();latest.current.onFallback();};canvas.addEventListener('webglcontextlost',contextLost);
    function burst(){celebration=3.5;for(const p of confetti){p.mesh.visible=true;p.mesh.position.set((rand()-.5)*5,4+rand()*2,-3+rand()*5);p.v.set((rand()-.5)*4,2+rand()*4,(rand()-.5)*3);p.mesh.material.opacity=1;}}
    function animate(now){if(disposed)return;raf=requestAnimationFrame(animate);const dt=Math.min((now-last)/1000,.04);last=now;if(document.hidden)return;const state=latest.current,isHero=state.mode==='hero',small=camera.aspect<.8;
      if(modeBefore!==state.mode){if(state.mode==='play'){shot=null;ball.rotation.set(.2,-.7,.15);}if(state.mode==='won')burst();modeBefore=state.mode;}
      const camPos=isHero?new THREE.Vector3(0,3.1,9):new THREE.Vector3(0,3.25,9.5);camera.position.lerp(camPos,.07);const lookY=isHero?(small?3.0:2.1):2.55;camera.lookAt(0,lookY,isHero?0:-3);
      hoop.visible=!isHero;const scale=isHero?(small?1.53:1.85):.58;ball.scale.lerp(new THREE.Vector3(scale,scale,scale),.1);
      if(isHero){const x=small?0:1.65;const y=(small?1.9:2.15)+(state.motion?Math.sin(now*.0008)*.09:0);bouncing=Math.max(0,bouncing-dt*.75);const b=bouncing>0?Math.sin((1-bouncing)*Math.PI*3)*Math.exp(-(1-bouncing)*2):0;ball.position.lerp(new THREE.Vector3(x,y+Math.max(-.85,b*.8),0),.15);if(!pointer&&state.motion){ball.rotation.y+=dt*.27+velocity.y;ball.rotation.x+=velocity.x;velocity.x*=.95;velocity.y*=.95;}}
      else if(shot){shot.age+=dt;const travel=1.5;const t=shot.age/travel;if(t<=1){const p=shotPosition(t,shot);ball.position.set(p.x,p.y,p.z);}else{const a=(t-1)*travel;ball.position.set(shot.x+(shot.made?0:Math.sin(a*5)*.4),Math.max(.43,RIM.y-a*4-a*a*3),RIM.z-shot.depth-a*1.8);if(!shot.reported){shot.reported=true;latest.current.onShot(shot.made);waveAge=0;wave.position.set(shot.x,.04,RIM.z-shot.depth);}}ball.rotation.x-=dt*5;if(shot.age>2.35){shot=null;latest.current.onFlight(false);}}
      else{ball.position.lerp(new THREE.Vector3(START.x,START.y+(state.motion?Math.sin(now*.002)*.035:0),START.z),.12);if(state.motion)ball.rotation.y+=dt*.3;}
      halo.visible=isHero;halo.position.x=small?0:1.65;halo.material.opacity=.28+(state.motion?Math.sin(now*.001)*.12:.1);shadow.position.x=ball.position.x;shadow.position.z=ball.position.z;const sh=clamp(1+ball.position.y*.15,.7,2);shadow.scale.set(sh,sh,sh);shadow.material.opacity=clamp(1-ball.position.y*.08,.25,.9);
      waveAge+=dt;wave.visible=waveAge<1.3;if(wave.visible){if(isHero)wave.position.set(ball.position.x,.04,ball.position.z);wave.scale.setScalar(1+waveAge*3);wave.material.opacity=(1-waveAge/1.3)*.7;}
      if(state.motion)dust.rotation.y+=dt*.012;
      if(celebration>0){celebration-=dt;for(const p of confetti){p.v.y-=dt*2;p.mesh.position.addScaledVector(p.v,dt);if(state.motion){p.mesh.rotation.x+=dt*3;p.mesh.rotation.z+=dt*2;}p.mesh.material.opacity=Math.min(1,celebration);if(celebration<=0)p.mesh.visible=false;}}
      renderer.render(scene,camera);
    }
    raf=requestAnimationFrame(animate);latest.current.onReady();
    return()=>{disposed=true;cancelAnimationFrame(raf);observer.disconnect();canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',cancel);canvas.removeEventListener('webglcontextlost',contextLost);scene.traverse(o=>{o.geometry?.dispose();if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});textures.map.dispose();textures.bumps.dispose();courtTex.dispose();shadowTex.dispose();glow.dispose();renderer.dispose();canvas.remove();api.current=null;};
  },[]);
  return <div className="court-canvas" ref={host}/>;
});
export default Court;
