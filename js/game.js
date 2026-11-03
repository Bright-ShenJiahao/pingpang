// 「乒乓」原型 · 主程序
if(new URLSearchParams(location.search).has('debug')){document.body.classList.add('debug');document.getElementById('bar').style.display='flex';}

const SPR={};for(const k in ASSETS.chars)SPR[k]={src:ASSETS.chars[k].src,ax:ASSETS.chars[k].ax};
const IM={};for(const k in SPR){IM[k]=new Image();IM[k].src=SPR[k].src;}

const PI={BG:new Image()};PI.BG.src=ASSETS.scenes.hall_bg;for(const k in ASSETS.props){PI[k]={};for(const t of ['hall','close']){const im=new Image();im.src=ASSETS.props[k][t];PI[k][t]=im;}}
const STREET=ASSETS.scenes.street;
function pimg(k){const c=PI[k]&&PI[k].close,h=PI[k]&&PI[k].hall;if(!(c&&c.complete&&c.naturalWidth&&h.complete))return null;return S.view==='hall'?{img:c,width:h.width,height:h.height}:c;}
function smooth(){ctx.imageSmoothingEnabled=S.view==='hall';ctx.imageSmoothingQuality='high';}
function drawAt(im,cx,by){smooth();ctx.drawImage(im.img||im,Math.round(cx-im.width/2),Math.round(by-im.height),im.width,im.height);}

const S={mode:'train',state:'start',orient:'land',grid:false,view:'hall',sel:null};
const HALL={PX:28,DY:14,SK:6,GROUND:332}, CLOSE={PX:72,DY:36,SK:14,GROUND:520};
const HALL_W=31.5, HALL_D=13, WALL_H=3.5, REST=4.5;
let RES=1,PX,DY,SK,GROUND,cam=0,VW=960,VH=540,boxes=[],scale=1;
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
      if(S.mode==='train') st=G.tables[id];
      else st= ri===0 ? 'ok':'empty';
    }
    boxes.push({x0:c[0],x1:c[1],d0:r[0],d1:r[1],ri,ci,id,st});
  }));
}
const fixed=()=>S.state==='fixed';
const C={wall:'#d8c7a0',dado:()=>fixed()?'#5f8a63':'#6d8466',ceil:'#3a332c',terr:'#b7ad9b',court:'#9a4c40',aisle:'#557a5c',wood:'#9c7650',
  tableTop:()=>fixed()?'#34539a':'#3f6b4c',tableFace:()=>fixed()?'#233b72':'#2d4e37',
  barF:()=>fixed()?'#2f4f95':'#8a4b3c',barT:()=>fixed()?'#5c7cc0':'#a8695a',barS:()=>fixed()?'#26407a':'#73402f'};

function drawRoom(){
  ctx.fillStyle=C.ceil;ctx.fillRect(0,0,VW,GROUND+20);
  if(PI.BG.complete&&PI.BG.naturalWidth){ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(PI.BG,-cam,GROUND-300,960,310);
    if(fixed()){ctx.globalAlpha=0.55;boxes.forEach(b=>topF(b.x0+0.25,b.x1-0.25,b.d0+0.15,b.d1-0.15,0,C.court));ctx.globalAlpha=1;}
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
  list.push({k:d,f:()=>{const im=pimg(fixed()?'bar_new_f':'bar_old_f');if(im){const a=P(x+0.02,d,0),c=P(xe-0.02,d,0),h=Math.round(0.82*PX);smooth();ctx.drawImage(im.img||im,a[0],a[1]-h,c[0]-a[0],h);return;}
    faceX(x+0.03,xe-0.03,d,0.05,0.75,C.barF());faceX(x+0.03,xe-0.03,d,0.68,0.75,C.barT());}});}}
function barrierD(x,d0,d1,list){for(let d=d0;d<d1-0.01;d+=1.5){const de=Math.min(d+1.5,d1);
  list.push({k:d+0.2,f:()=>{const im=pimg(fixed()?'bar_new_s':'bar_old_s');if(im){const a=P(x,d+0.02,0),c=P(x,de-0.02,0.82);smooth();ctx.drawImage(im.img||im,a[0]-2,c[1],Math.max(4,c[0]-a[0]+4),a[1]-c[1]);return;}
    faceD(x,d+0.03,de-0.03,0.05,0.75,C.barS());faceD(x,d+0.03,de-0.03,0.68,0.75,C.barT());}});}}
function table(b,list){
  const cx=(b.x0+b.x1)/2, cd=(b.d0+b.d1)/2, x0=cx-1.37,x1=cx+1.37,d0=cd-0.7625,d1=cd+0.7625;
  if(b.st==='empty')return;
  {const key=b.st==='junk'?'junk':b.st==='broken'?'covered':(fixed()?'blue':'green');
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
    const w=dim.width,h=dim.height,f=P(x,d,0),ax=SPR[id].ax;
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
function players(b,t,list,span){
  if(b.st!=='ok')return; if(S.view==='hall'&&S.state==='start'&&b.ri>0)return;
  const cx=(b.x0+b.x1)/2, cd=(b.d0+b.d1)/2;
  const ph=t/1.1+b.id*0.37, k=Math.floor(ph), u=ph-k, dirR=k%2===0;
  if(S.view!=='hall'||b.id===1){
    // 小学员(左) 正手 vs 老球友(右) 削球，老球友离台更远
    const xa=cx-span, xb=cx+span+1.2, fh=Math.floor(k/2)%2===0;
    let kp='kid_r'; if(dirR){kp=u<0.12?'kid_f2':u<0.35?'kid_f3':'kid_r';} else {kp=u>0.55?'kid_f1':'kid_r';}
    let op='of_r'; const F=fh?['of_f1','of_f2','of_f3']:['of_b1','of_b2','of_b3'];
    if(dirR){op=u>0.45?F[0]:'of_r';} else {op=u<0.12?F[1]:u<0.4?F[2]:'of_r';}
    sprite(kp,xa-0.1,cd-0.05,false,cd-0.001,list);
    sprite(op,xb,cd+0.05,false,cd-0.002,list);
    const from=dirR?xa+0.45:xb-0.5, to=dirR?xb-0.5:xa+0.45, bt=dirR?0.6:0.7, x=from+(to-from)*u; let h;
    const peak=dirR?0.35:0.18;
    if(u<bt){const v=u/bt;h=(dirR?0.95:0.7)+(0.76-(dirR?0.95:0.7))*v+peak*4*v*(1-v);}else{const v=(u-bt)/(1-bt);h=0.76+((dirR?0.75:0.95)-0.76)*v+0.2*4*v*(1-v);}
    const bs=Math.max(2,Math.round(PX*0.055));
    list.push({k:cd-0.003,f:()=>{const p=P(x,cd,h);ctx.fillStyle='#fff';ctx.fillRect(p[0]-1,p[1]-1,bs,bs);}});
    return;
  }
  if(b.id===2&&S.mode==='train'){
    // 新手在打：慢悠悠的高抛球，抬来抬去，隔几板就下网
    const per=1.8, ph2=t/per, k2=Math.floor(ph2), u2=ph2-k2, d2=k2%2===0, miss=false;
    if(!(IM.girl0_close&&IM.girl0_close.complete)){}
    const xa=cx-1.5, xb=cx+1.5, pa=PEOPLE[0], pb=PEOPLE[3];
    const swA=d2?Math.max(0,0.6-u2*3):0, swB=!d2?Math.max(0,0.6-u2*3):0;
    // 小女孩(左,面朝右) 和 妈妈(右,面朝左)；每 4 板的第 4 板小女孩打空，妈妈笑着弯腰
    let gp='girl0', mp='mom0';
    if(d2){ if(u2<0.25)gp='girl1'; } else { if(u2<0.25)mp='mom1'; if(miss&&u2>0.72)gp='girl2'; }
    sprite(gp,xa-0.55,cd-0.05,false,cd-0.001,list);
    sprite(mp,xb+0.3,cd+0.05,false,cd-0.002,list);
    const from=d2?xa-0.1:xb-0.4, to=d2?xb-0.4:xa-0.1; let x,h;
    if(miss&&!d2&&u2>0.8){x=to-(u2-0.8)*2.5;h=Math.max(0.02,0.9-(u2-0.8)*4.4);}
    else{x=from+(to-from)*u2;const bt=0.62;if(u2<bt){const v=u2/bt;h=0.9+(0.76-0.9)*v+0.7*4*v*(1-v);}else{const v=(u2-bt)/(1-bt);h=0.76+(0.9-0.76)*v+0.55*4*v*(1-v);}}
    const bs=Math.max(2,Math.round(PX*0.055));
    list.push({k:cd-0.003,f:()=>{const p=P(x,cd,h);ctx.fillStyle='#fff';ctx.fillRect(p[0]-1,p[1]-1,bs,bs);}});
    return;
  }
  const xa=cx-span, xb=cx+span;
  const pa=PEOPLE[(b.id*2)%4], pb=PEOPLE[(b.id*2+1)%4];
  const swA=dirR?Math.max(0,1-u*4):Math.max(0,(u-0.7)*3), swB=!dirR?Math.max(0,1-u*4):Math.max(0,(u-0.7)*3);
  person(xa,cd-0.05,pa[3]?1.40:1.70,pa[0],pa[1],pa[2],1,swA,cd-0.001,list,pa[3]);
  person(xb,cd+0.05,pb[3]?1.40:1.70,pb[0],pb[1],pb[2],-1,swB,cd-0.002,list,pb[3]);
  const from=dirR?xa+0.45:xb-0.45, to=dirR?xb-0.45:xa+0.45, bt=0.72, x=from+(to-from)*u; let h;
  if(u<bt){const v=u/bt;h=0.95+(0.76-0.95)*v+0.35*4*v*(1-v);}else{const v=(u-bt)/(1-bt);h=0.76+(0.95-0.76)*v+0.25*4*v*(1-v);}
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
  const put=(k,x,d)=>list.push({k:d,f:()=>{const im=pimg(k);if(!im)return;const p=P(x,d,0);drawAt(im,p[0],p[1]);}});
  sprite('hero2',1.6,11.7,false,11.7,list);
  put('counter',1.5,10.6); put('fridge',3.4,11.9); put('bench',2.0,2.8); put('bench',2.0,6.8); put('basket',5.4,1.3);
  if(fixed()){put('net',6.4,10.6);put('dehum',3.9,9.2);}
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
  labels();
}
function drawClose(t){
  useCfg(CLOSE);
  const b={x0:0,x1:12,d0:0.5,d1:6.5,ri:0,id:S.sel?S.sel.id:1,st:'ok'};
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
function loop(ts){
  const t=ts/1000;ctx.setTransform(RES,0,0,RES,0,0);
  if(S.view==='hall')drawHall(t);else drawClose(t);
  requestAnimationFrame(loop);
}

function maxCam(){return S.view==='hall'?Math.max(0,HALL_W*HALL.PX+HALL_D*HALL.SK-VW):0;}
function clampCam(){if(S.view==='hall')cam=Math.max(0,Math.min(maxCam(),cam));}
function centerClose(){cam=Math.round(6*CLOSE.PX+3.5*CLOSE.SK-VW/2);}
function fit(){
  const port=S.orient==='port';
  VW=port?540:960;VH=port?960:540;cv.style.width=VW+'px';cv.style.height=VH+'px';
  fr.className=port?'port':'land';fr.style.width=VW+'px';fr.style.height=VH+'px';
  const hall=S.view==='hall';
  document.getElementById('nav').style.display=hall?'block':'none';document.getElementById('hud').style.display=hall?'flex':'none';if(!hall)closeUI();
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
  if(b.dataset.k==='mode'){S.view='hall';cam=0;}
  layout();fit();
});
document.getElementById('gridBtn').onclick=e=>{S.grid=!S.grid;e.target.classList.toggle('on',S.grid);};
document.getElementById('back').onclick=()=>{S.view='hall';cam=0;fit();};
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
addEventListener('keydown',e=>{if(e.key==='Escape'){if(S.view!=='hall'){S.view='hall';cam=0;fit();}else closeUI();}});


// ===== 游戏状态（线框用的假数据）=====
const DAYS=['周一','周二','周三','周四','周五','周六','周日'], SLOTS=['上午','下午','晚上'];
const ACTS=['开课','带训练','修理','走访','休息'];
const G={week:1,day:0,slot:0,money:5000,pop:1,weather:'回南天',
  tables:{1:'ok',2:'ok',3:'broken',4:'junk',5:'junk',6:'junk'},
  sched:Array.from({length:7},()=>['开课','带训练','休息']),
  students:[
    {name:'小学员 A',spr:'kid_r_close',hand:'右手横拍',style:'弧圈快攻',trait:'怕输',stat:{发球:6,接发球:5,正手:8,反手:6,步法:7,体力:9,心态:4,勤奋:8},hp:80,mood:60,bond:30,train:'多球',tbl:1,story:'第一次来球馆时躲在门后看了半小时。'},
    {name:'小学员 B',spr:null,hand:'右手横拍',style:'快攻',trait:'天赋高但懒',stat:{发球:9,接发球:8,正手:9,反手:8,步法:5,体力:5,心态:7,勤奋:3},hp:70,mood:70,bond:10,train:'对练',tbl:2,story:'（待写）'},
    {name:'小学员 C',spr:null,hand:'右手直拍',style:'直拍快攻',trait:'老实',stat:{发球:5,接发球:6,正手:7,反手:4,步法:6,体力:8,心态:6,勤奋:9},hp:90,mood:65,bond:20,train:'发球接发球',tbl:2,story:'（待写）'}],
  notes:{wish:[['先把 3 号台修好',false],['让球馆晚上亮起来',false],['带一个孩子去打市赛',false]],
    msg:['老球友：「你爷爷当年的球拍还在柜台抽屉里。」','糖水铺阿姨：「回南天又来了，你那地板要注意。」','市乒协：第 4 周周六举办市赛少儿组，周四截止报名。'],
    tip:['多球：一筐球连续喂，练的是步法和连续性。','打削球手不要跟他比耐心，拉加转和突击要结合。','怕输的孩子，领先的时候最要提醒他冷静。']},
  nb:[{name:'糖水铺阿姨',love:2,give:'饮料供货、八卦情报',spon:'挡板广告 · 糖水会'},
      {name:'士多店老板',love:1,give:'球和胶皮进货',spon:'器材进货打折'},
      {name:'老球友',love:3,give:'削球陪练、爷爷的旧事',spon:'解锁陪练训练'}],
  fac:[['3 号台','待修','修理',800],['灯（3 号格）','坏','修理',300],['集球网','无','购买',600],['除湿机','吊扇','购买',1500],['挡板','旧挡板','换新',2000],['柜台','旧木桌','加冰柜',1200],['吊顶','漏水','修理',500]],
  income:{课程:1800,散客:600,饮料:240,广告:0}, cost:{修理:800,进货:300,水电房租:900}};
const TRAIN=['多球','对练','发球接发球','体能','陪练（老球友）','休息'];
const $=id=>document.getElementById(id);
const money=n=>'¥'+n.toLocaleString();

function hud(){
  $('hud').innerHTML=`<span>第${G.week}周 · ${DAYS[G.day]} · ${SLOTS[G.slot]}</span><span>${money(G.money)}</span><span>人气 ${'★'.repeat(G.pop)}${'☆'.repeat(5-G.pop)}</span><span>${G.weather}</span><span class="nbk" onclick="openUI('notebook')">笔记本<b>●</b></span><span class="gear" onclick="openUI('system')">设置</span>`;
}
function bar(v,max=20){return `<span class="bar"><i style="width:${v/max*100}%"></i></span>`;}
function nav(){
  const today=G.sched[G.day];
  $('nav').innerHTML=`<div class="today"><b>今天</b>${SLOTS.map((s,i)=>`<span class="${i===G.slot?'cur':''}">${s}：${today[i]}</span>`).join('')}</div>
  <div class="btns">${[['日程','schedule'],['学员','students'],['训练','training'],['设施','facility'],['街坊','street'],['赛程','fixtures'],['笔记本','notebook']].map(b=>`<button onclick="openUI('${b[1]}')">${b[0]}</button>`).join('')}<button class="go" onclick="endSlot()">结束时段 ▶</button></div>`;
}
function modal(title,html,small){
  $('modal').className='ov'+(small?' small':'');$('modal').style.display='block';
  $('modal').innerHTML=`<div class="mh"><b>${title}</b><span onclick="closeUI()">关闭 ✕</span></div><div class="mb">${html}</div>`;
}
function closeUI(){$('modal').style.display='none';}
const UI={
 schedule(){
  const today=G.sched[G.day];
  modal('日程安排',`<h4>今天（${DAYS[G.day]}）</h4><div class="slots">${SLOTS.map((s,i)=>`<div class="slot ${i===G.slot?'cur':''}"><b>${s}</b>${ACTS.map(a=>`<button class="${today[i]===a?'on':''}" onclick="G.sched[${G.day}][${i}]='${a}';UI.schedule();nav()">${a}</button>`).join('')}</div>`).join('')}</div>
  <h4>本周</h4><table class="wk"><tr><th></th>${DAYS.map((d,i)=>`<th class="${i===G.day?'cur':''}">${d}</th>`).join('')}</tr>${SLOTS.map((s,j)=>`<tr><th>${s}</th>${DAYS.map((d,i)=>`<td class="${i===G.day&&j===G.slot?'cur':''}">${i>=5&&j===0?'活动':G.sched[i][j]}</td>`).join('')}</tr>`).join('')}</table>
  <p class="hint">开课 = 收学费、涨人气；带训练 = 当时段训练效果加成；修理占 1～2 个时段；周末上午固定是社区活动或比赛。</p>`);
 },
 students(){
  modal('学员名册',`<div class="cards">${G.students.map((s,i)=>`<div class="scard" onclick="UI.student(${i})">${s.spr?`<img src="${SPR[s.spr].src}">`:'<div class="ph">待出图</div>'}<b>${s.name}</b><small>${s.hand} · ${s.style}</small><span class="tag">${s.trait}</span><small>体力 ${bar(s.hp,100)}</small><small>心情 ${bar(s.mood,100)}</small></div>`).join('')}</div><p class="hint">点卡片看详情。MVP 只有 3 个学员。</p>`);
 },
 student(i){
  const s=G.students[i],grp={技术:['发球','接发球','正手','反手'],身体:['步法','体力'],心理:['心态','勤奋']};
  modal(s.name,`<div class="detail"><div class="left">${s.spr?`<img src="${SPR[s.spr].src}">`:'<div class="ph big">待出图</div>'}<span class="tag">${s.trait}</span><small>${s.hand}<br>${s.style}</small></div>
  <div class="right">${Object.entries(grp).map(([g,ks])=>`<h4>${g}</h4>${ks.map(k=>`<div class="attr"><span>${k}</span>${bar(s.stat[k])}<em>${s.stat[k]}</em></div>`).join('')}`).join('')}
  <h4>状态</h4><div class="attr"><span>体力</span>${bar(s.hp,100)}<em>${s.hp}</em></div><div class="attr"><span>心情</span>${bar(s.mood,100)}<em>${s.mood}</em></div><div class="attr"><span>关系</span>${bar(s.bond,100)}<em>${s.bond}</em></div>
  <h4>小故事</h4><p>${s.story}</p></div></div>
  <div class="row"><button onclick="UI.students()">◀ 名册</button><button onclick="UI.talk(${i})">谈话</button><button onclick="UI.training()">安排训练</button></div>`);
 },
 talk(i){
  const s=G.students[i];
  const R={怕输:{鼓励:'他点点头，握拍的手松了一点。心态 ↑',施压:'他低下头，半天没说话。心态 ↓↓',冷静:'他深呼吸了几次。心态 ↑↑'},
    天赋高但懒:{鼓励:'「知道啦知道啦。」好像更放松了……勤奋 ↓',施压:'「切，谁怕谁。」勤奋 ↑↑',冷静:'他打了个哈欠。没反应'},
    老实:{鼓励:'他用力点头。心情 ↑',施压:'「我会多练的。」勤奋 ↑',冷静:'「嗯。」心态 ↑'}}[s.trait];
  modal('和'+s.name+'谈话',`<p class="say">「教练，今天练什么？」</p><div class="row">${['鼓励','施压','冷静'].map(k=>`<button onclick="document.getElementById('react').textContent='${R[k]}'">${k==='冷静'?'让他冷静':k}</button>`).join('')}</div><p id="react" class="react">（选一个说法，看他的反应）</p><div class="row"><button onclick="UI.student(${i})">◀ 返回</button></div><p class="hint">每人每天一次。同一套选项也用在比赛的局间指挥里。</p>`,true);
 },
 training(){
  modal('训练安排 · '+SLOTS[G.slot],`<table class="tr"><tr><th>学员</th><th>训练项目</th><th>球台</th><th>体力</th></tr>${G.students.map((s,i)=>`<tr><td>${s.name}<br><small>${s.trait}</small></td><td>${TRAIN.map(t=>`<button class="${s.train===t?'on':''}" onclick="G.students[${i}].train='${t}';UI.training()">${t}</button>`).join('')}</td><td><select onchange="G.students[${i}].tbl=+this.value">${[1,2,3].map(n=>`<option ${G.tables[n]!=='ok'?'disabled':''} ${s.tbl===n?'selected':''} value="${n}">${n}号台${G.tables[n]!=='ok'?'（不能用）':''}</option>`).join('')}</select></td><td>${bar(s.hp,100)}</td></tr>`).join('')}</table>
  <p class="hint">多球需要集球网；对练是两个学员共用一张台；陪练要老球友好感度够高。没人盯着的时候，「懒」的学员效果打折。</p>`);
 },
 facility(){
  modal('设施与修理',`<table class="tr"><tr><th>设施</th><th>现在</th><th></th><th>费用</th></tr>${G.fac.map((f,i)=>`<tr><td>${f[0]}</td><td>${f[1]}</td><td><button onclick="buyFac(${i})">${f[2]}</button></td><td>${money(f[3])}</td></tr>`).join('')}</table><p class="hint">也可以直接在球馆里点球台修理。升级后画面会跟着变。具体价格待定。</p>`);
 },
 street(){
  modal('街坊 · 骑楼老街',`<div class="street"><img src="${STREET}"><div class="nbs">${G.nb.map((n,i)=>`<div class="nb"><b>${n.name}</b><span class="love">${'♥'.repeat(n.love)}${'♡'.repeat(5-n.love)}</span><small>能提供：${n.give}</small><small>赞助：${n.spon}</small><div class="row"><button onclick="nbTalk(${i})">闲聊</button><button ${n.love<3?'disabled':''}>谈赞助${n.love<3?'（好感不够）':''}</button></div></div>`).join('')}</div></div><p class="hint">走访占 1 个时段。街景以后做成可点的场景（点店铺找人）。</p>`);
 },
 fixtures(){
  modal('赛程与报名',`<table class="tr"><tr><th>时间</th><th>比赛</th><th>状态</th></tr><tr><td>第2周 周六</td><td>街坊友谊赛（球馆内）</td><td>需 3 张台可用</td></tr><tr><td>第4周 周六</td><td><b>市赛 · 少儿组</b><br><small>小组赛 1 场 + 淘汰赛 2～3 场</small></td><td>周四截止报名</td></tr></table>
  <h4>报名名单</h4>${G.students.map(s=>`<label class="chk"><input type="checkbox" ${s.trait!=='天赋高但懒'?'checked':''}> ${s.name}（${s.style}）</label>`).join('')}
  <p class="hint">比赛界面先留占位：赛前战术（滑条）、局间指挥、暂停 1 次。点球馆里的 1 号台可以先看比赛特写。</p>`);
 },
 notebook(tab='wish'){
  const T={wish:'心愿',msg:'消息',tip:'训练心得'};
  const body=tab==='wish'?G.notes.wish.map((w,i)=>`<label class="chk"><input type="checkbox" ${w[1]?'checked':''} disabled> ${w[0]}</label>`).join(''):`<ul>${G.notes[tab].map(m=>`<li>${m}</li>`).join('')}</ul>`;
  modal('爷爷的笔记本',`<img src="${SPR.grandpa2_close.src}" style="float:right;image-rendering:pixelated;height:110px"><div class="tabs">${Object.entries(T).map(([k,v])=>`<button class="${k===tab?'on':''}" onclick="UI.notebook('${k}')">${v}</button>`).join('')}</div><div class="paper">${body}</div><p class="hint">代替收件箱：目标、消息、新手引导都写成爷爷的笔迹。</p>`);
 },
 system(){modal('设置',`<div class="row"><button>存档</button><button>读档</button><button>重新开始</button></div><div class="attr"><span>音乐</span>${bar(14)}</div><div class="attr"><span>音效</span>${bar(16)}</div><p class="hint">存在浏览器本地：自动存档 1 个 + 手动存档 1 个。</p>`,true);},
 week(){
  const inc=Object.values(G.income).reduce((a,b)=>a+b,0), out=Object.values(G.cost).reduce((a,b)=>a+b,0);
  modal(`第${G.week}周 结算`,`<div class="two"><div><h4>收入</h4>${Object.entries(G.income).map(([k,v])=>`<div class="ln"><span>${k}</span><em>${money(v)}</em></div>`).join('')}<div class="ln tot"><span>合计</span><em>${money(inc)}</em></div></div>
  <div><h4>支出</h4>${Object.entries(G.cost).map(([k,v])=>`<div class="ln"><span>${k}</span><em>${money(v)}</em></div>`).join('')}<div class="ln tot"><span>合计</span><em>${money(out)}</em></div></div></div>
  <h4>学员成长</h4>${G.students.map(s=>`<div class="ln"><span>${s.name}</span><em>正手 +1 · 步法 +1</em></div>`).join('')}
  <h4>本周</h4><div class="ln"><span>人气</span><em>★ → ★★</em></div><div class="ln"><span>完成的心愿</span><em>先把 3 号台修好</em></div>
  <div class="row"><button class="go" onclick="closeUI()">进入第${G.week}周 ▶</button></div>`);
 },
 tableMenu(b){
  const name=b.id+'号台', st=G.tables[b.id];
  if(b.id===2&&st==='ok'){modal(name,`<p>一个小女孩和她妈妈在打球。妈妈慢慢地喂高球，小女孩抬来抬去，隔几板就下网，两个人笑个不停。</p><p id="girl" class="react" style="display:none">妈妈：「她看了电视上的比赛，非要来学打球……你们这里收小孩吗？」<br>（以后：可以招成新学员）</p><div class="row"><button onclick="document.getElementById('girl').style.display='block'">上前搭话</button></div>`,true);return;}
  if(st==='ok') modal(name,`<p>${SLOTS[G.slot]}：${G.students.filter(s=>s.tbl===b.id).map(s=>s.name+'（'+s.train+'）').join('、')||'空着'}</p><div class="row"><button onclick="closeUI();S.sel=boxes.find(x=>x.id===${b.id});S.view='close';fit()">观看（比赛特写）</button><button onclick="UI.training()">安排训练</button></div>`,true);
  else if(st==='broken') modal(name+'（待修）',`<p>台面起翘、网架松了。修好后变成能用的旧绿台。</p><p>费用 ${money(800)} · 占 1 个时段</p><div class="row"><button onclick="fixTable(${b.id},'ok',800)">修理</button></div>`,true);
  else modal(name+'（堆杂物）',`<p>堆着纸箱和旧椅子。清理后才能修台。</p><p>费用 ${money(200)} · 占 1 个时段</p><div class="row"><button onclick="fixTable(${b.id},'broken',200)">清理</button></div>`,true);
 },
 shop(){modal('柜台 · 小卖部',`<table class="tr"><tr><th>商品</th><th>库存</th><th>售价</th><th></th></tr><tr><td>汽水</td><td>24</td><td>¥3</td><td><button>进货</button></td></tr><tr><td>乒乓球（盒）</td><td>6</td><td>¥20</td><td><button>进货</button></td></tr><tr><td>胶皮</td><td>—</td><td>—</td><td><button disabled>需要器材柜</button></td></tr></table><p class="hint">MVP 只做饮料和球；胶皮、球拍要先升级柜台。</p>`,true);}
};
function openUI(k){UI[k]();}
function fixTable(id,to,cost){G.tables[id]=to;G.money-=cost;if(id===3&&to==='ok')G.notes.wish[0][1]=true;layout();hud();closeUI();}
function buyFac(i){const f=G.fac[i];if(f[0]==='3 号台'){fixTable(3,'ok',f[3]);return;}G.money-=f[3];f[1]='已完成';f[2]='—';hud();UI.facility();}
function nbTalk(i){const n=G.nb[i];if(n.love<5)n.love++;UI.street();}
function endSlot(){
  G.slot++; if(G.slot>2){G.slot=0;G.day++; if(G.day>6){G.day=0;UI.week();G.week++;}}
  hud();nav();
}
function hitAll(mx,my){
  useCfg(HALL);
  for(const b of [...boxes].sort((a,c)=>a.d0-c.d0)){const a=P(b.x0,b.d0,0),c=P(b.x1,b.d1,2);if(mx>=a[0]&&mx<=c[0]&&my<=a[1]&&my>=c[1])return {kind:'table',b};}
  const a=P(0,9.5,0),c=P(REST,12.8,2.2);if(mx>=a[0]&&mx<=c[0]+40&&my<=a[1]&&my>=c[1])return {kind:'shop'};
  const e=P(0,0,0),f=P(REST,9,1);if(mx>=e[0]&&mx<=f[0]&&my<=e[1]&&my>=f[1])return {kind:'street'};
  return null;
}

hud();nav();layout();fit();
if(!location.hash.startsWith('#guide'))requestAnimationFrame(loop);
// ===== 参考图导出（#guide-bg / #guide-props）=====
function guideBG(){
  const k=56/28; useCfg({PX:56,DY:28,SK:12,GROUND:600}); cam=0;
  VW=1920;VH=620;cv.width=VW;cv.height=VH;
  S.state='start'; ctx.fillStyle=C.ceil;ctx.fillRect(0,0,VW,VH);
  drawRoom();
  ctx.setLineDash([10,8]);ctx.lineWidth=3;ctx.strokeStyle='#ffffff';
  boxes.forEach(b=>{const pts=[P(b.x0,b.d0,0),P(b.x1,b.d0,0),P(b.x1,b.d1,0),P(b.x0,b.d1,0)];ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.stroke();});
  ctx.setLineDash([]);
  ctx.font='bold 22px sans-serif';ctx.fillStyle='#fff';ctx.textAlign='center';
  boxes.forEach(b=>{const p=P((b.x0+b.x1)/2,(b.d0+b.d1)/2,0);ctx.fillText('球台位(留空)',p[0],p[1]+8);});
  let p=P(2.25,6.5,0);ctx.fillText('柜台/休息区(木地板留空)',p[0],p[1]);
  ctx.textAlign='left';
}
function guideProps(){
  VW=1920;VH=1080;cv.width=VW;cv.height=VH;ctx.fillStyle='#ff00ff';ctx.fillRect(0,0,VW,VH);
  const cfg=(g)=>useCfg({PX:96,DY:48,SK:20,GROUND:g});cam=0;
  const L=(x,y,t)=>{ctx.font='bold 20px sans-serif';ctx.fillStyle='#000';ctx.fillText(t,x,y);};
  // row 1: tables
  cfg(330);const tb=[['junk','① 堆杂物'],['broken','② 盖布待修'],['ok','③ 旧绿台'],['okB','④ 蓝台']];
  tb.forEach((t,i)=>{const list=[];const x0=0.6+i*5;const b={x0,x1:x0+4,d0:0,d1:2,id:9,st:t[0]==='okB'?'ok':t[0]};
    if(t[0]==='okB')S.state='fixed';else S.state='start';table(b,list);list.sort((a,c)=>c.k-a.k).forEach(o=>o.f());L(x0*96+40,370,t[1]);});
  // row 2: barriers + lamps
  cfg(640);S.state='start';let list=[];
  barrierX(0.6,2.1,0.3,list);barrierD(3.4,0,1.5,list);list.forEach(o=>o.f());L(60,690,'⑤ 旧挡板 正面');L(330,690,'⑥ 旧挡板 侧面');
  S.state='fixed';list=[];barrierX(5.6,7.1,0.3,list);barrierD(8.4,0,1.5,list);list.forEach(o=>o.f());L(540,690,'⑦ 新挡板 正面');L(810,690,'⑧ 新挡板 侧面');
  [[11.5,false,'⑨ 灯(坏)'],[14,true,'⑩ 灯(亮)']].forEach(([x,on,t])=>{const pp=P(x,0.5,0.9);ctx.fillStyle='#3c3c3c';ctx.fillRect(pp[0]-20,pp[1],40,12);ctx.fillStyle=on?'#fff3c4':'#555';ctx.fillRect(pp[0]-16,pp[1]+12,32,4);ctx.fillStyle='#222';ctx.fillRect(pp[0],pp[1]-120,2,120);L(pp[0]-40,690,t);});
  // row 3: rest-area props
  cfg(980);S.state='start';
  cuboid(0.4,2.6,0,1,1.05,'#c79a62','#8c6438','#6e4e2b');L(50,1030,'⑪ 柜台(旧木桌)');
  cuboid(4,4.8,0,0.8,1.8,'#e8eef0','#c8c6bd','#a9b4b8');L(380,1030,'⑫ 冰柜');
  cuboid(6.2,9,0,0.4,0.45,'#b8864f','#8c6438','#6e4e2b');L(610,1030,'⑬ 长凳');
  cuboid(10.2,12.6,0,0.6,1.0,'#33558f','#2a4677','#203a63');L(990,1030,'⑭ 集球网(示意)');
  cuboid(13.6,14.2,0,0.5,1.1,'#ddd','#bbb','#999');L(1300,1030,'⑮ 除湿机');
  cuboid(15.4,16,0,0.5,0.55,'#b59b72','#8d7552','#6f5b40');L(1480,1030,'⑯ 球筐');
  cuboid(17,18.6,0,0.5,0.5,'#7b7366','#5e574c','#4a443c');L(1640,1030,'⑰ 纸箱杂物');
}
if(location.hash==='#guide-bg'||location.hash==='#guide-props'){
  window.loop=()=>{}; layout(); setTimeout(()=>{location.hash==='#guide-bg'?guideBG():guideProps();cv.style.width=VW+'px';cv.style.height=VH+'px';fr.style.transform='none';fr.style.width=VW+'px';fr.style.height=VH+'px';['hud','nav','modal','score','mctl','mnote'].forEach(i=>document.getElementById(i).style.display='none');document.getElementById('bar').style.display='none';},50);
}

