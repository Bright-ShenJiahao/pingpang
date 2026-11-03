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

