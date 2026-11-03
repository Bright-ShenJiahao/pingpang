// 「乒乓」原型 · 主程序
if(new URLSearchParams(location.search).has('debug')){document.body.classList.add('debug');document.getElementById('bar').style.display='flex';}

const SPR={};for(const k in ASSETS.chars)SPR[k]={src:ASSETS.chars[k].src,ax:ASSETS.chars[k].ax};
const IM={};for(const k in SPR){IM[k]=new Image();IM[k].src=SPR[k].src;}

const PI={BG:new Image()};PI.BG.src=ASSETS.scenes.hall_bg;for(const k in ASSETS.props){PI[k]={};for(const t of ['hall','close']){const im=new Image();im.src=ASSETS.props[k][t];PI[k][t]=im;}}
const STREET=ASSETS.scenes.street;
function pimg(k){const c=PI[k]&&PI[k].close,h=PI[k]&&PI[k].hall;if(!(c&&c.complete&&c.naturalWidth&&h.complete))return null;return S.view==='hall'?{img:c,width:h.width*ZOOM,height:h.height*ZOOM}:c;}
function smooth(){ctx.imageSmoothingEnabled=S.view==='hall';ctx.imageSmoothingQuality='high';}
function drawAt(im,cx,by){smooth();ctx.drawImage(im.img||im,Math.round(cx-im.width/2),Math.round(by-im.height),im.width,im.height);}

const S={mode:'train',state:'start',orient:'land',grid:false,view:'hall',sel:null};
const ZOOM=1, HALL={PX:28*ZOOM,DY:14*ZOOM,SK:6*ZOOM,GROUND:332}, CLOSE={PX:72,DY:36,SK:14,GROUND:520};
const HALL_W=31.5, HALL_D=13, WALL_H=3.5, REST=4.5;
let RES=1,PX,DY,SK,GROUND,HOMECAM=0,cam=0,VW=960,VH=540,boxes=[],scale=1;
const cv=document.getElementById('c'), ctx=cv.getContext('2d'), fr=document.getElementById('frame');
function useCfg(c){PX=c.PX;DY=c.DY;SK=c.SK;GROUND=c.GROUND;}

function P(x,d,h){return [Math.round(x*PX+d*SK-cam), Math.round(GROUND-d*DY-h*PX)];}
function poly(pts,c){ctx.fillStyle=c;ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.fill();}
function faceX(x0,x1,d,h0,h1,c){poly([P(x0,d,h0),P(x1,d,h0),P(x1,d,h1),P(x0,d,h1)],c);}
function faceD(x,d0,d1,h0,h1,c){poly([P(x,d0,h0),P(x,d1,h0),P(x,d1,h1),P(x,d0,h1)],c);}
function topF(x0,x1,d0,d1,h,c){poly([P(x0,d0,h),P(x1,d0,h),P(x1,d1,h),P(x0,d1,h)],c);}
function cuboid(x0,x1,d0,d1,h,ct,cf,cs){faceD(x1,d0,d1,0,h,cs);faceX(x0,x1,d0,0,h,cf);topF(x0,x1,d0,d1,h,ct);}
function rnd(seed){return ()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};}

function layout(){
  let rows,cols;
  if(S.mode==='train'){rows=[[1,5.5],[5.5,10]];cols=[0,1,2].map(i=>[REST+i*9,REST+9+i*9]);}
  else{rows=[[1,7],[7,13]];cols=[0,1].map(i=>[REST+1.5+i*12,REST+13.5+i*12]);}
  boxes=[];
  rows.forEach((r,ri)=>cols.forEach((c,ci)=>{
    const id=ri*cols.length+ci+1; let st='ok';
    if(S.state==='start'){
      if(S.mode==='train') st=G.tables[id]||'junk';
      else st= ri===0 ? 'ok':'empty';
    }
    const blue=st==='blue'||S.state==='fixed'; if(st==='blue')st='ok';
    boxes.push({x0:c[0],x1:c[1],d0:r[0],d1:r[1],ri,ci,id,st,blue});
  }));
}
const fixed=()=>S.state==='fixed';
const flag=k=>fixed()||(typeof G!=='undefined'&&G.flags&&G.flags[k]);
const C={wall:'#d8c7a0',dado:()=>fixed()?'#5f8a63':'#6d8466',ceil:'#3a332c',terr:'#b7ad9b',court:'#9a4c40',aisle:'#557a5c',wood:'#9c7650',
  tableTop:()=>fixed()?'#34539a':'#3f6b4c',tableFace:()=>fixed()?'#233b72':'#2d4e37',
  barF:()=>fixed()?'#2f4f95':'#8a4b3c',barT:()=>fixed()?'#5c7cc0':'#a8695a',barS:()=>fixed()?'#26407a':'#73402f'};

function drawRoom(){
  ctx.fillStyle=C.ceil;ctx.fillRect(0,0,VW,GROUND+20);
  if(PI.BG.complete&&PI.BG.naturalWidth){ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(PI.BG,-cam,GROUND-300*ZOOM,960*ZOOM,310*ZOOM);
    if(flag('paint')){ctx.globalAlpha=0.55;boxes.forEach(b=>topF(b.x0+0.25,b.x1-0.25,b.d0+0.15,b.d1-0.15,0,C.court));ctx.globalAlpha=1;}
    return;}
  faceD(0,0,HALL_D,0,WALL_H+1.2,'#c4b48e');faceD(0,0,HALL_D,0,1.2,'#5f7659');
  faceX(0,HALL_W,HALL_D,0,WALL_H,C.wall);faceX(0,HALL_W,HALL_D,0,1.2,C.dado());
  for(let x=6.5;x<HALL_W-2;x+=6){faceX(x,x+2.2,HALL_D,1.45,3.05,'#5b6b5a');faceX(x+0.1,x+2.1,HALL_D,1.55,2.95,fixed()?'#cfe0d6':'#b9c4a8');faceX(x+1.07,x+1.13,HALL_D,1.55,2.95,'#5b6b5a');}
  [[0.3,1.0],[1.2,1.9],[2.1,2.8]].forEach(a=>faceX(a[0],a[1],HALL_D,1.9,2.45,'#e9dcae'));
  faceX(3.1,4.0,HALL_D,1.6,2.9,'#b0473b');
  const ck=P(4.3,HALL_D,2.8);ctx.fillStyle='#f5efe0';ctx.beginPath();ctx.arc(ck[0]+6,ck[1],Math.max(4,PX*0.18),0,7);ctx.fill();
  topF(0,HALL_W,0,HALL_D,0,fixed()?C.aisle:C.terr);
  topF(0,REST,0,HALL_D,0,C.wood);
  if(!fixed()){const r=rnd(7);ctx.fillStyle='rgba(80,70,60,.35)';for(let i=0;i<500;i++){const p=P(REST+r()*(HALL_W-REST),r()*HALL_D,0);ctx.fillRect(p[0],p[1],1,1);}}
  else boxes.forEach(b=>topF(b.x0+0.25,b.x1-0.25,b.d0+0.15,b.d1-0.15,0,C.court));
}
function drawGrid(){
  if(!S.grid)return;
  ctx.strokeStyle='rgba(255,255,255,.12)';ctx.lineWidth=1;ctx.beginPath();
  for(let x=0;x<=HALL_W+0.01;x+=0.5){const a=P(x,0,0),b=P(x,HALL_D,0);ctx.moveTo(a[0]+.5,a[1]);ctx.lineTo(b[0]+.5,b[1]);}
  for(let d=0;d<=HALL_D;d+=0.5){const a=P(0,d,0),b=P(HALL_W,d,0);ctx.moveTo(a[0],a[1]+.5);ctx.lineTo(b[0],b[1]+.5);}
  ctx.stroke();
}
function barrierX(x0,x1,d,list){for(let x=x0;x<x1-0.01;x+=1.5){const xe=Math.min(x+1.5,x1);
  list.push({k:d,f:()=>{const im=pimg(flag('barrier')?'bar_new_f':'bar_old_f');if(im){const a=P(x+0.02,d,0),c=P(xe-0.02,d,0),h=Math.round(0.82*PX);smooth();ctx.drawImage(im.img||im,a[0],a[1]-h,c[0]-a[0],h);return;}
    faceX(x+0.03,xe-0.03,d,0.05,0.75,C.barF());faceX(x+0.03,xe-0.03,d,0.68,0.75,C.barT());}});}}
function barrierD(x,d0,d1,list){for(let d=d0;d<d1-0.01;d+=1.5){const de=Math.min(d+1.5,d1);
  list.push({k:d+0.2,f:()=>{const im=pimg(flag('barrier')?'bar_new_s':'bar_old_s');if(im){const a=P(x,d+0.02,0),c=P(x,de-0.02,0.82);smooth();ctx.drawImage(im.img||im,a[0]-2,c[1],Math.max(4,c[0]-a[0]+4),a[1]-c[1]);return;}
    faceD(x,d+0.03,de-0.03,0.05,0.75,C.barS());faceD(x,d+0.03,de-0.03,0.68,0.75,C.barT());}});}}
function table(b,list){
  const cx=(b.x0+b.x1)/2, cd=(b.d0+b.d1)/2, x0=cx-1.37,x1=cx+1.37,d0=cd-0.7625,d1=cd+0.7625;
  if(b.st==='empty')return;
  {const key=b.st==='junk'?'junk':b.st==='broken'?'covered':(b.blue?'blue':'green');
   if(pimg(key)){list.push({k:cd,f:()=>{const im=pimg(key),c=P(cx,cd,0),f=P(cx,cd-0.62,0);drawAt(im,c[0],f[1]);}});return;}}
  if(b.st==='junk'){list.push({k:cd,f:()=>{cuboid(cx-2.2,cx-0.9,cd-0.3,cd+0.6,0.9,'#b59b72','#8d7552','#6f5b40');cuboid(cx-2.0,cx-1.1,cd-0.2,cd+0.4,1.6,'#c4ab80','#9a8260','#7a6548');
    cuboid(cx-0.4,cx+1.8,cd-0.5,cd+0.7,0.5,'#7b7366','#5e574c','#4a443c');cuboid(cx+0.2,cx+1.2,cd-0.1,cd+0.5,1.1,'#a08a66','#7e6b4e','#64543d');cuboid(cx+1.9,cx+2.5,cd-0.2,cd+0.3,0.45,'#c0392b','#962d22','#7a241b');}});return;}
  const legs=()=>[[x0+0.25,d1-0.15],[x1-0.25,d1-0.15],[x0+0.25,d0+0.15],[x1-0.25,d0+0.15],[cx-0.1,d0+0.15],[cx+0.1,d0+0.15]].forEach(l=>faceX(l[0]-0.03,l[0]+0.03,l[1],0,0.72,'#2b2b2b'));
  if(b.st==='broken'){list.push({k:cd,f:()=>{legs();faceX(x0,x1,d0,0.66,0.74,'#8f8a80');topF(x0,x1,d0,d1,0.74,'#a9a396');faceX(x0-0.05,x1+0.05,d0-0.02,0.35,0.74,'#9a9488');faceX(x0+0.4,x0+0.9,d0-0.02,0.35,0.5,'#8a8478');}});return;}
  list.push({k:cd,f:()=>{legs();faceX(x0,x1,d0,0.70,0.76,C.tableFace());
    topF(x0,x1,d0,d1,0.76,'#f1f1ea');topF(x0+0.03,x1-0.03,d0+0.03,d1-0.03,0.76,C.tableTop());
    const a=P(x0+0.03,cd,0.76),e=P(x1-0.03,cd,0.76);ctx.fillStyle='rgba(255,255,255,.7)';ctx.fillRect(a[0],a[1],e[0]-a[0],1);
    faceD(cx,d0-0.12,d1+0.12,0.76,0.9125,'rgba(30,30,40,.75)');faceD(cx,d0-0.12,d1+0.12,0.89,0.9125,'#eee');}});
}
function person(x,d,H,shirt,pants,hair,dir,sw,key,list,kid){
  list.push({k:key,f:()=>{
    const w=kid?0.34:0.42, f=P(x,d,0), s=PX/48;
    ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(f[0]-Math.round(12*s),f[1]-Math.max(1,Math.round(2*s)),Math.round(24*s),Math.max(2,Math.round(4*s)));
    const L=0.47*H,T=0.82*H;
    faceX(x-w/2,x-0.02,d,0,L,pants);faceX(x+0.02,x+w/2,d,0,L,pants);
    faceX(x-w/2,x-w/2+0.12,d,0,0.06,'#eee');faceX(x+w/2-0.12,x+w/2,d,0,0.06,'#eee');
    faceX(x-w/2-0.02,x+w/2+0.02,d,L-0.02,T,shirt);
    faceX(x-0.1,x+0.1,d,T,H-0.02,'#e6b98c');
    faceX(x-0.12,x+0.12,d,H-0.09,H+0.03,hair);faceX(dir>0?x-0.12:x+0.04,dir>0?x-0.04:x+0.12,d,T+0.06,H,hair);
    faceX(dir>0?x+0.04:x-0.08,dir>0?x+0.08:x-0.04,d,H-0.15,H-0.11,'#2a1d14');
    const hx=x+dir*(w/2+0.12+sw*0.25), hh=0.55*H+sw*0.18;
    faceX(Math.min(x+dir*w/2,hx)-0.02,Math.max(x+dir*w/2,hx)+0.02,d,hh,hh+0.07,shirt);
    const r=P(hx+dir*0.1,d,hh+0.04);ctx.fillStyle=dir>0?'#c0392b':'#1e1e1e';ctx.beginPath();ctx.ellipse(r[0],r[1],Math.max(2,4*s),Math.max(2,5*s),0,0,7);ctx.fill();
    ctx.fillStyle='#b98b5a';ctx.fillRect(r[0]-Math.max(1,Math.round(s)),r[1]+Math.round(4*s),Math.max(1,Math.round(2*s)),Math.max(2,Math.round(4*s)));
  }});
}
function sprite(name,x,d,flip,key,list){
  list.push({k:key,f:()=>{
    const hall=S.view==='hall', id=name+'_close', img=IM[id], dim=IM[name+(hall?'_hall':'_close')]; if(!img||!img.complete||!dim.complete)return;
    const zk=hall?ZOOM:1,w=dim.width*zk,h=dim.height*zk,f=P(x,d,0),ax=SPR[id].ax;
    ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.ellipse(f[0],f[1],PX*0.3,PX*0.07,0,0,7);ctx.fill();
    smooth();ctx.save();
    if(flip){const dx=Math.round(f[0]-(1-ax)*w);ctx.translate(dx+w,f[1]-h);ctx.scale(-1,1);ctx.drawImage(img,0,0,w,h);}
    else ctx.drawImage(img,Math.round(f[0]-ax*w),f[1]-h,w,h);
    ctx.restore();}});
}
function person2(x,d,o,dir,sw,key,list){
  list.push({k:key,f:()=>{
    const H=o.H,w=0.36*H/1.6,f=P(x,d,0),s=PX/48;
    ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(f[0]-Math.round(11*s),f[1]-Math.max(1,Math.round(2*s)),Math.round(22*s),Math.max(2,Math.round(4*s)));
    const L=0.47*H,T=0.82*H;
    faceX(x-w/2+0.02,x-0.03,d,0,L,'#e6b98c');faceX(x+0.03,x+w/2-0.02,d,0,L,'#e6b98c');
    faceX(x-w/2,x-w/2+0.1,d,0,0.05,'#f2f2f2');faceX(x+w/2-0.1,x+w/2,d,0,0.05,'#f2f2f2');
    if(o.skirt)faceX(x-w/2-0.05,x+w/2+0.05,d,o.skirt,L+0.04,o.bottom);
    faceX(x-w/2-0.02,x+w/2+0.02,d,L,T,o.shirt);
    faceX(x-0.09,x+0.09,d,T,H-0.02,'#efc59a');
    faceX(x-0.11,x+0.11,d,H-0.08,H+0.03,o.hair);
    faceX(dir>0?x-0.11:x+0.03,dir>0?x-0.03:x+0.11,d,o.long?T-0.12:T+0.06,H,o.hair);
    if(o.pig){faceX(dir>0?x-0.17:x+0.11,dir>0?x-0.11:x+0.17,d,H-0.2,H-0.08,o.hair);}
    faceX(dir>0?x+0.03:x-0.07,dir>0?x+0.07:x-0.03,d,H-0.14,H-0.1,'#2a1d14');
    const hx=x+dir*(w/2+0.1+sw*0.22), hh=0.55*H+sw*0.15;
    faceX(Math.min(x+dir*w/2,hx)-0.02,Math.max(x+dir*w/2,hx)+0.02,d,hh,hh+0.06,o.shirt);
    const r=P(hx+dir*0.09,d,hh+0.04);ctx.fillStyle=dir>0?'#c0392b':'#1e1e1e';ctx.beginPath();ctx.ellipse(r[0],r[1],Math.max(2,3.6*s),Math.max(2,4.5*s),0,0,7);ctx.fill();
  }});
}
const PEOPLE=[['#f2f0e6','#2b3550','#3a2a1e',false],['#3e66a8','#2b3550','#2a1d14',true],['#c45a3a','#3a3a3a','#2a1d14',true],['#d7a63a','#5a4632','#888',false]];
// ===== 球台上的人：按游戏状态决定谁在打 =====
// 角色：'kid'(只能在左) 'girl'(只能在左) 'of'老球友(只能在右) 'mom'(只能在右) 或 {blk:[上衣,裤子,头发,是否小孩]}
const clamp01=v=>Math.max(0,Math.min(1,v));
function players(b,t,list,span){
  if(b.st!=='ok')return;
  const pair=(typeof tableActors==='function')?tableActors(b):null; if(!pair)return;
  const [L,R]=pair, cx=(b.x0+b.x1)/2, cd=(b.d0+b.d1)/2;
  const slow=L==='girl'||R==='mom', chop=R==='of';
  const per=slow?1.8:1.1, ph=t/per+b.id*0.37, k=Math.floor(ph), u=ph-k, dirR=k%2===0;
  let xa=cx-(slow?2.05:span), xb=cx+(chop?span+1.2:slow?1.8:span);
  // 进门动画：时段开始时从左墙大门走到球台
  const ap=(typeof arriveP==='function')?arriveP(b.id):1;
  let da=cd-0.05, db=cd+0.05, walking=ap<1;
  if(walking){const door=[0.6,1.3];const e=t=>t<0.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
    const pa=clamp01(e(Math.min(1,ap*1.15))), pb=clamp01(e(Math.max(0,ap*1.15-0.15)));
    xa=door[0]+(xa-door[0])*pa; da=door[1]+(da-door[1])*pa; xb=door[0]+(xb-door[0])*pb; db=door[1]+(db-door[1])*pb;}
  if(walking){
    const wa=Math.sin(t*14)>0?0.03:0;
    if(L==='kid'||L==='girl')sprite(L==='kid'?'kid_r':'girl0',xa,da,false,da-0.001+wa,list);else person(xa,da,L.blk[3]?1.4:1.7,L.blk[0],L.blk[1],L.blk[2],1,0,da-0.001,list,L.blk[3]);
    if(R==='of'||R==='mom')sprite(R==='of'?'of_r':'mom0',xb,db,true,db-0.002,list);else person(xb,db,R.blk[3]?1.4:1.7,R.blk[0],R.blk[1],R.blk[2],1,0,db-0.002,list,R.blk[3]);
    return;}
  // 左边
  if(L==='kid'){let p='kid_r';if(dirR)p=u<0.12?'kid_f2':u<0.35?'kid_f3':'kid_r';else p=u>0.55?'kid_f1':'kid_r';sprite(p,xa-0.1,cd-0.05,false,cd-0.001,list);}
  else if(L==='girl'){sprite(dirR&&u<0.25?'girl1':'girl0',xa,cd-0.05,false,cd-0.001,list);}
  else{const c=L.blk,sw=dirR?Math.max(0,1-u*4):Math.max(0,(u-0.7)*3);person(xa,cd-0.05,c[3]?1.40:1.70,c[0],c[1],c[2],1,sw,cd-0.001,list,c[3]);}
  // 右边
  if(R==='of'){const F=Math.floor(k/2)%2===0?['of_f1','of_f2','of_f3']:['of_b1','of_b2','of_b3'];let p='of_r';if(dirR)p=u>0.45?F[0]:'of_r';else p=u<0.12?F[1]:u<0.4?F[2]:'of_r';sprite(p,xb,cd+0.05,false,cd-0.002,list);}
  else if(R==='mom'){sprite(!dirR&&u<0.25?'mom1':'mom0',xb,cd+0.05,false,cd-0.002,list);}
  else{const c=R.blk,sw=!dirR?Math.max(0,1-u*4):Math.max(0,(u-0.7)*3);person(xb,cd+0.05,c[3]?1.40:1.70,c[0],c[1],c[2],-1,sw,cd-0.002,list,c[3]);}
  // 球
  const fromX=dirR?xa+0.4:xb-0.45, toX=dirR?xb-0.45:xa+0.4, x=fromX+(toX-fromX)*u; let h;
  if(slow){const bt=0.62;if(u<bt){const v=u/bt;h=0.9+(0.76-0.9)*v+0.7*4*v*(1-v);}else{const v=(u-bt)/(1-bt);h=0.76+(0.9-0.76)*v+0.55*4*v*(1-v);}}
  else if(chop){const bt=dirR?0.6:0.7,peak=dirR?0.35:0.18,h0=dirR?0.95:0.7,h1=dirR?0.75:0.95;if(u<bt){const v=u/bt;h=h0+(0.76-h0)*v+peak*4*v*(1-v);}else{const v=(u-bt)/(1-bt);h=0.76+(h1-0.76)*v+0.2*4*v*(1-v);}}
  else{const bt=0.72;if(u<bt){const v=u/bt;h=0.95+(0.76-0.95)*v+0.35*4*v*(1-v);}else{const v=(u-bt)/(1-bt);h=0.76+(0.95-0.76)*v+0.25*4*v*(1-v);}}
  const bs=Math.max(2,Math.round(PX*0.055));
  list.push({k:cd-0.003,f:()=>{const p=P(x,cd,h);ctx.fillStyle='#fff';ctx.fillRect(p[0]-1,p[1]-1,bs,bs);}});
}
function lamps(b,list){
  const cx=(b.x0+b.x1)/2, cd=(b.d0+b.d1)/2, on=b.st==='ok', s=PX/48;
  list.push({k:cd+0.5,f:()=>{
    const p=P(cx,cd,3.2), im=pimg(on?'lamp_on':'lamp_off');
    if(on){ctx.fillStyle='rgba(255,236,180,.08)';ctx.beginPath();const a=P(cx-1.6,cd-0.7,0.76),c=P(cx+1.6,cd-0.7,0.76);ctx.moveTo(p[0]-8*s,p[1]+6*s);ctx.lineTo(p[0]+8*s,p[1]+6*s);ctx.lineTo(c[0],c[1]);ctx.lineTo(a[0],a[1]);ctx.closePath();ctx.fill();}
    if(S.view==='hall'&&b.ri===0)return;
    if(im){ctx.fillStyle='#2a2420';ctx.fillRect(p[0],0,1,Math.max(0,p[1]-im.height+8));drawAt(im,p[0],p[1]+8);return;}
    ctx.fillStyle='#222';ctx.fillRect(p[0],0,1,p[1]);ctx.fillStyle='#3c3c3c';ctx.fillRect(p[0]-10*s,p[1],20*s,6*s);ctx.fillStyle=on?'#fff3c4':'#555';ctx.fillRect(p[0]-8*s,p[1]+6*s,16*s,Math.max(1,2*s));}});
}
function restArea(list){
  const put=(k,x,d,h)=>list.push({k:d,f:()=>{const im=pimg(k);if(!im)return;const p=P(x,d,h||0);drawAt(im,p[0],p[1]);}});
  // 左墙上的大门：有人进门时打开
  list.push({k:12.95,f:()=>{const open=(typeof arriveP==='function')&&arriveP(6)<1;const im=pimg(open?'door_open':'door_closed');const p=P(0.15,0.4,0);
    if(im){smooth();ctx.drawImage(im.img||im,Math.round(p[0]-im.width*0.25),Math.round(p[1]-im.height),im.width,im.height);}}});
  // 后排走道：沿后墙一排长凳（避开吊灯电线）
  [6.6,15.6,24.6].forEach(x=>put('bench2',x,12.2));
  // 最里面：收银柜台 + 冰柜；买了器材架就挂在柜台后面的墙上
  if(flag('gear'))put('gearrack',1.5,12.8,0.9);
  sprite('hero2',1.6,11.7,false,11.7,list);
  put('counter',1.5,10.6); put('fridge',3.4,11.9);
  // 中间：工夫茶台、竹椅、小凳、红塑料凳，旁边饮水机
  put('bamboochair',1.15,8.6); put('teatable',2.2,7.6); put('redstool',3.5,7.9); put('woodstool',2.3,6.6);
  put('water',4.0,5.4);
  put('basket',5.4,1.3);
  if(flag('net'))put('net',6.4,10.6); if(flag('dehum'))put('dehum',3.9,9.8);
}
function label(x,y,txt){ctx.font='11px sans-serif';ctx.textBaseline='top';const tw=ctx.measureText(txt).width;ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(x-2,y-1,tw+4,13);ctx.fillStyle='#ffe9b0';ctx.fillText(txt,x,y);}
function labels(){
  if(!S.grid)return;
  boxes.forEach(b=>{const p=P(b.x0+0.3,b.d0+0.35,0);const name=S.mode==='train'?`${b.id}号台`:`${b.id}号场`;
    label(p[0],p[1]-12,`${name} ${b.x1-b.x0}×${b.d1-b.d0}m`+(b.st==='broken'?' 待修':b.st==='junk'?' 堆杂物':b.st==='empty'?' 空置':''));});
  const q=P(0.2,0.4,0);label(q[0],q[1]-12,'入口·柜台/休息区');
  const y=GROUND+6;ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(0,y,VW,14);ctx.font='10px sans-serif';
  for(let m=0;m<=HALL_W;m++){const x=Math.round(m*PX-cam);if(x<-20||x>VW+20)continue;ctx.fillStyle='#ffe9b0';ctx.fillRect(x,y,1,m%3===0?8:4);if(m%3===0)ctx.fillText(m+'m',x+2,y+2);}
}
function hallHit(mx,my){
  const cand=boxes.filter(b=>b.st==='ok'&&!(S.state==='start'&&b.ri>0)).sort((a,b)=>a.d0-b.d0);
  for(const b of cand){const a=P(b.x0,b.d0,0),c=P(b.x1,b.d1,2);if(mx>=a[0]&&mx<=c[0]&&my<=a[1]&&my>=c[1])return b;}
  return null;
}

function drawHall(t){
  useCfg(HALL);
  ctx.fillStyle='#1a1612';ctx.fillRect(0,0,VW,VH);
  drawRoom();drawGrid();
  const list=[],xe={},de={};
  boxes.forEach(b=>{
    [[b.d0,b.x0,b.x1],[b.d1,b.x0,b.x1]].forEach(e=>{const k=e.join('|');if(!xe[k])xe[k]=e;});
    [[b.x0,b.d0,b.d1],[b.x1,b.d0,b.d1]].forEach(e=>{const k=e.join('|');if(!de[k])de[k]=e;});
    table(b,list);players(b,t,list,S.mode==='match'?2.4:1.9);lamps(b,list);
  });
  const front=Math.min(...boxes.map(b=>b.d0));
  Object.values(xe).forEach(e=>{if(e[0]<=front+0.01)list.push({k:e[0],f:()=>faceX(e[1],e[2],e[0],0,0.04,C.barS())});else barrierX(e[1],e[2],e[0],list);});
  Object.values(de).forEach(e=>barrierD(e[0],e[1],e[2],list));
  restArea(list);
  list.sort((a,b)=>b.k-a.k).forEach(o=>o.f());
  if(typeof drawFly==='function')drawFly();
  labels();
}
function drawClose(t){
  useCfg(CLOSE);
  const b={x0:0,x1:12,d0:0.5,d1:6.5,ri:0,id:S.sel?S.sel.id:1,st:'ok',blue:S.sel?S.sel.blue:false};
  ctx.fillStyle=C.ceil;ctx.fillRect(0,0,VW,VH);
  faceX(-4,16,7.5,0,4,'#4a4238');faceX(-4,16,7.5,0,1.2,'#3d4a3a');
  topF(-4,16,0,7.5,0,fixed()?'#4a6a52':'#8f877a');
  topF(b.x0+0.2,b.x1-0.2,b.d0+0.1,b.d1-0.1,0,fixed()?C.court:'#a59d8e');
  const list=[];
  barrierX(b.x0,b.x1,b.d1,list);barrierD(b.x0,b.d0,b.d1,list);barrierD(b.x1,b.d0,b.d1,list);
  list.push({k:b.d0,f:()=>faceX(b.x0,b.x1,b.d0,0,0.03,C.barS())});
  table(b,list);players(b,t,list,2.4);lamps(b,list);
  list.push({k:6.0,f:()=>{cuboid(9.2,10.2,6.0,6.4,0.75,'#7a5530','#5e4024','#4a321c');cuboid(9.4,10.0,6.1,6.25,1.0,'#f2f2f2','#e8e8e8','#bbb');
    const p=P(9.42,6.1,0.98);ctx.fillStyle='#222';ctx.font='bold 13px monospace';ctx.textBaseline='top';ctx.fillText('7  5',p[0]+3,p[1]+2);}});
  list.sort((a,c)=>c.k-a.k).forEach(o=>o.f());
  if(S.grid){const y=0;ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(0,y,VW,14);ctx.font='10px sans-serif';
    for(let m=-4;m<=16;m++){const x=Math.round(m*PX-cam);if(x<-20||x>VW+20)continue;ctx.fillStyle='#ffe9b0';ctx.fillRect(x,y,1,8);ctx.fillText(m+'m',x+2,y+2);}
    const q=P(b.x0+0.2,b.d1-0.3,0);label(q[0],q[1]-12,'比赛场 12×6m（市赛级别）');}
}
let LAST_TS=0;
function loop(ts){
  const t=ts/1000,dt=LAST_TS?(ts-LAST_TS)/1000:0;LAST_TS=ts;if(typeof update==='function')update(dt);ctx.setTransform(RES,0,0,RES,0,0);
  if(S.view==='hall')drawHall(t);else drawClose(t);
  requestAnimationFrame(loop);
}

function maxCam(){return S.view==='hall'?Math.max(0,HALL_W*HALL.PX+HALL_D*HALL.SK-VW):0;}
function clampCam(){if(S.view==='hall')cam=Math.max(0,Math.min(maxCam(),cam));}
function centerClose(){cam=Math.round(6*CLOSE.PX+3.5*CLOSE.SK-VW/2);}
function fit(){
  const port=S.orient==='port';
  VW=port?540:960;VH=port?960:404;CLOSE.GROUND=port?520:384;cv.style.width=VW+'px';cv.style.height=VH+'px';
  fr.className=port?'port':'land';fr.style.width=VW+'px';fr.style.height=VH+'px';
  const hall=S.view==='hall';
  document.getElementById('nav').style.display=hall?'flex':'none';document.getElementById('side').style.display=hall&&port?'block':'none';document.getElementById('hud').style.display=hall?'flex':'none';if(!hall)closeUI();
  ['score','mctl'].forEach(id=>document.getElementById(id).style.display=hall?'none':'flex');
  document.getElementById('mnote').style.display=!hall&&port?'block':'none';
  const st=document.getElementById('stage');
  scale=Math.min(st.clientWidth/VW,st.clientHeight/VH);
  fr.style.transform=`scale(${scale})`;
  RES=Math.min(4,scale*(window.devicePixelRatio||1));cv.width=Math.round(VW*RES);cv.height=Math.round(VH*RES);
  fr.style.left=Math.max(0,(st.clientWidth-VW*scale)/2)+'px';fr.style.top=Math.max(0,(st.clientHeight-VH*scale)/2)+'px';
  if(hall)clampCam();else centerClose();
}
document.querySelectorAll('#bar button[data-k]').forEach(b=>b.onclick=()=>{
  S[b.dataset.k]=b.dataset.v;document.querySelectorAll(`#bar button[data-k="${b.dataset.k}"]`).forEach(o=>o.classList.toggle('on',o===b));
  if(b.dataset.k==='mode'){S.view='hall';cam=HOMECAM;}
  layout();fit();
});
document.getElementById('gridBtn').onclick=e=>{S.grid=!S.grid;e.target.classList.toggle('on',S.grid);};
document.getElementById('back').onclick=()=>{S.view='hall';cam=HOMECAM;fit();};
let drag=null;
cv.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,c:cam,moved:false};cv.setPointerCapture(e.pointerId);});
cv.addEventListener('pointermove',e=>{if(!drag)return;if(Math.abs(e.clientX-drag.x)>5)drag.moved=true;if(S.view==='hall'&&drag.moved){cam=drag.c-(e.clientX-drag.x)/scale;clampCam();}});
cv.addEventListener('pointerup',e=>{
  if(drag&&!drag.moved&&S.view==='hall'){const r=cv.getBoundingClientRect();
    const h=hitAll((e.clientX-r.left)/scale,(e.clientY-r.top)/scale);
    if(h){if(h.kind==='table')UI.tableMenu(h.b);else UI[h.kind]();}}
  drag=null;});
cv.addEventListener('wheel',e=>{if(S.view==='hall'){cam+=(e.deltaX||e.deltaY);clampCam();}e.preventDefault();},{passive:false});
addEventListener('resize',fit);
addEventListener('keydown',e=>{if(e.key==='Escape'){if(S.view!=='hall'){S.view='hall';cam=HOMECAM;fit();}else closeUI();}});


