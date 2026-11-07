// 「乒乓」· 回合数值模拟
// 飞行：重力 + 空气阻力(Morrison Cd) + 马格努斯力(Kutta-Joukowski)；触台：冲量 + 库仑摩擦
// 设定值（非实测）：法向恢复系数 e=0.89，台面摩擦 μ=0.25，转速每 0.01s 衰减 0.2%
const PH={m:0.0027,d:0.04,R:0.02,g:9.8,rho:1.204,eta:1.82e-5,e:0.89,mu:0.25};PH.S=Math.PI*PH.d*PH.d/4;
const TAB={L:2.74,W:1.525,NET:1.37,NETH:0.1525};
const DT=0.004;
const _c=(v,a,b)=>Math.max(a,Math.min(b,v));
function _g(){let u=0,v=0;while(!u)u=Math.random();while(!v)v=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}
function Cd(Re){Re=Math.max(Re,1);
  return 24/Re+2.6*(Re/5)/(1+Math.pow(Re/5,1.52))+0.411*Math.pow(Re/2.63e5,-7.94)/(1+Math.pow(Re/2.63e5,-8))+0.25*(Re/1e6)/(1+Re/1e6);}
function flyStep(b,dt){
  const sp=Math.max(Math.hypot(b.vx,b.vy),1e-6),a=Math.atan2(b.vy,b.vx);
  const Fd=0.5*Cd(PH.rho*sp*PH.d/PH.eta)*PH.rho*sp*sp*PH.S;
  const FL=Math.PI*Math.PI*PH.rho*Math.pow(PH.d,3)*sp*b.n/8;
  const ax=(FL*Math.sin(a)-Fd*Math.cos(a))/PH.m, ay=(-PH.m*PH.g-FL*Math.cos(a)-Fd*Math.sin(a))/PH.m;
  b.x+=b.vx*dt;b.y+=b.vy*dt;b.z+=b.vz*dt;b.vx+=ax*dt;b.vy+=ay*dt;b.n*=Math.pow(0.998,dt/0.01);b.t+=dt;
}
// 打出去、落到台面（y=0）为止；返回落点 x、时间、落点速度、过网高度
function landSim(v,n,ang,x0,y0){
  const a=ang*Math.PI/180,b={x:x0,y:y0,z:0,vx:v*Math.cos(a),vy:v*Math.sin(a),vz:0,n,t:0};
  let clear=null,px=b.x,py=b.y;
  for(let i=0;i<700;i++){
    px=b.x;py=b.y;flyStep(b,DT);
    if(clear===null&&px<TAB.NET&&b.x>=TAB.NET){const f=(TAB.NET-px)/((b.x-px)||1e-9);clear=py+(b.y-py)*f;}
    if(b.y<0&&b.t>0.01)break;
  }
  const f=py/((py-b.y)||1e-9);
  return {xl:px+(b.x-px)*f,t:b.t-DT*(1-f),vx:b.vx,vy:b.vy,n:b.n,clear};
}
// 落点随仰角先增后减：返回 [低弹道解, 高弹道解]（可能缺）
function solveAngles(v,n,x0,y0,tx){
  const f=a=>landSim(v,n,a,x0,y0).xl,out=[];let pa=-25,pf=f(pa);
  if(pf>=tx)out.push(pa);
  for(let a=-21;a<=62;a+=4){const cf=f(a);
    if((pf<tx&&cf>=tx)||(pf>=tx&&cf<tx)){let lo=a-4,hi=a,up=pf<tx;for(let i=0;i<12;i++){const m=(lo+hi)/2,fm=f(m);if((fm<tx)===up)lo=m;else hi=m;}out.push((lo+hi)/2);}
    pa=a;pf=cf;}
  return out;
}
function solveAngle(v,n,x0,y0,tx){const r=solveAngles(v,n,x0,y0,tx);return r.length?r[0]:62;}
// 触台：返回 {vx,vy,n}（vy 向上为正）
function bounceTable(vx,vyDown,n){
  const w=2*Math.PI*n*PH.R,slip=vx-w,need=Math.abs(slip)/2.5,fmax=PH.mu*vyDown*(1+PH.e);
  const dv=-Math.sign(slip||1)*Math.min(need,fmax);
  return {vx:vx+dv,vy:vyDown*PH.e,n:(w-1.5*dv)/(2*Math.PI*PH.R)};
}

const SHOTS={
  serve_short:{name:'下旋短球发球',v:5.5,n:-45,tx:1.72,serve:1},
  serve_long:{name:'上旋长球发球',v:12,n:55,tx:2.5,serve:1},
  serve_fast:{name:'急长球发球',v:16.5,n:15,tx:2.55,serve:1},
  loop:{name:'拉球',v:11.5,n:95,tx:2.3},
  drive:{name:'快攻',v:15.5,n:35,tx:2.4},
  push:{name:'搓球',v:6.2,n:-42,tx:1.95},
  block:{name:'挡球',v:7.5,n:12,tx:2.15},
  chop:{name:'削球',v:9,n:-75,tx:2.25}
};
const TACTICS={
  serve:{name:'发球抢攻',desc:'多发短球，第三板抢攻'},
  rally:{name:'相持对拉',desc:'多拉弧圈，把回合拉长'},
  place:{name:'变化落点',desc:'专打对手弱侧，拖他的步法'},
  safe:{name:'稳字当头',desc:'球速降一档，少失误'},
  power:{name:'强攻',desc:'球速转速全提，失误也多'}
};

// 一板球：解出理想仰角，加上水平噪声后完整模拟（含触台与触台后的飞行）
function fireShot(S){
  let v=S.v,ang=0,found=false;
  search:for(const m of [1,.92,.85,.78,.7,.62,.55,.48,.42]){v=S.v*m;
    for(const a of solveAngles(v,S.n,S.x0,S.y0,S.tx)){const r=landSim(v,S.n,a,S.x0,S.y0);if(r.clear!==null&&r.clear>0.24&&Math.abs(r.xl-S.tx)<0.15){ang=a;found=true;break search;}}}
  if(!found){v=S.v;ang=solveAngle(v,S.n,S.x0,S.y0,S.tx);}
  ang+=_g()*S.sig*0.7;v*=1+_g()*S.svn;const n0=S.n*(1+_g()*0.07),zl=S.zt+_g()*S.zn;
  const r1=landSim(v,n0,ang,S.x0,S.y0),T1=Math.max(r1.t,0.05);
  const a=ang*Math.PI/180,b={x:S.x0,y:S.y0,z:0,vx:v*Math.cos(a),vy:v*Math.sin(a),vz:zl/T1,n:n0,t:0};
  const path=[[0,b.x,b.y,b.z,n0]];let status='in',crossed=false,landed=false,reach=null,reachT=0,landX=r1.xl;
  const rec=()=>path.push([b.t,b.x,b.y,b.z,b.n]);
  for(let i=0;i<900;i++){
    const px=b.x,py=b.y;flyStep(b,DT);
    if(!crossed&&px<TAB.NET&&b.x>=TAB.NET){crossed=true;
      const f=(TAB.NET-px)/((b.x-px)||1e-9),yc=py+(b.y-py)*f;
      if(yc<TAB.NETH+0.015){b.x=TAB.NET;b.y=Math.max(yc,0.02);rec();status='net';
        for(let j=0;j<60;j++){b.vx=0;b.vy-=PH.g*DT;b.y+=b.vy*DT;b.t+=DT;if(b.y<0)break;rec();}break;}}
    if(!landed&&b.y<0){
      const f=py/((py-b.y)||1e-9),xl=px+(b.x-px)*f;landed=true;landX=xl;
      if(xl<TAB.NET){status='own';b.x=xl;b.y=0;rec();break;}
      if(xl>TAB.L||Math.abs(b.z)>TAB.W/2){status='out';rec();
        for(let j=0;j<400;j++){flyStep(b,DT);rec();if(b.y<-0.75)break;}break;}
      const bn=bounceTable(b.vx,-b.vy,b.n);b.x=xl;b.y=0;b.vx=bn.vx;b.vy=bn.vy;b.n=bn.n;b.vz*=0.5;rec();
      for(let j=0;j<600;j++){
        flyStep(b,DT);rec();
        if(!reach&&b.x>=S.xhit){reach={x:b.x,y:b.y,vx:b.vx,vy:b.vy,n:b.n,z:b.z};reachT=b.t;}
        if(b.y<-0.75||b.t>2.2)break;
      }
      break;
    }
    rec();
  }
  if(status==='in'&&!reach){ // 短球：落台后到不了接球人站位，接球人上步在台面上方击球
    let pk=-1,mx=0;for(let q=1;q<path.length;q++)if(path[q][0]>T1&&path[q][2]>mx){mx=path[q][2];pk=q;}
    for(let q=Math.max(pk,1);q<path.length-1;q++){if(path[q][0]>T1&&path[q][2]<=0.16){const a=path[q-1],c=path[q],d=c[0]-a[0]||DT;
      reach={x:c[1],y:c[2],vx:(c[1]-a[1])/d,vy:(c[2]-a[2])/d,n:c[4],z:c[3]};reachT=c[0];break;}}
  }
  return {status,path,landX,landZ:zl,reach,reachT,endT:path[path.length-1][0]};
}

// ---------- 选球、选落点、接球判定 ----------
function pickServe(me,opp,tac){
  let w={short:.4,long:.3,fast:.3};
  if(tac==='serve')w={short:.6,long:.15,fast:.25};
  if(tac==='power')w={short:.2,long:.3,fast:.5};
  if(tac==='safe')w={short:.5,long:.5,fast:0};
  if(opp.wk==='recv')w.short*=1.6;
  const tot=w.short+w.long+w.fast;let r=Math.random()*tot;
  if((r-=w.short)<0)return 'serve_short';if((r-=w.long)<0)return 'serve_long';return 'serve_fast';
}
function pickShot(me,tac,inc,n){
  if(me.style==='chop')return 'chop';
  let att={loop:.6,drive:.65,safe:.3,mix:.5}[me.style]??.5;
  if(tac==='power')att+=.25;if(tac==='safe')att-=.3;if(tac==='rally')att+=.1;
  if(n===1&&tac==='serve')att=.95;
  const want=Math.random()<att,back=inc.n<-15,topAtk=me.style==='drive'?'drive':me.style==='safe'?'drive':'loop';
  if(back)return want?(me.style==='mix'?'loop':topAtk):'push';
  return want?(me.style==='mix'?'drive':topAtk):'block';
}
function pickZ(tac,opp,forceWeak,n){
  const cl=z=>_c(z,-0.7,0.7);
  if(tac==='power'){return (Math.random()<.5?-1:1)*(0.45+0.2*Math.random());}
  if(tac==='place'||forceWeak){
    if(opp.wk==='bh')return cl(0.52+0.12*_g());
    if(opp.wk==='foot')return (n%2?1:-1)*(0.6+0.06*_g());
    return cl(0.2*_g());
  }
  if(tac==='safe')return cl(0.2*_g());
  return cl(0.4*_g());
}
const MISS_TXT={spin:'被强烈的旋转骗了，没接住',speed:'来不及反应，球擦身而过',wide:'被调动了，没够着',short:'短球没上到位，够不着'};
// 接球判定：来球质量（速度、旋转、偏离）对比接球人的属性与士气
function handleBall(rc,sh,C,idx,n){
  const R=sh.reach,v=Math.hypot(R.vx,R.vy),spin=Math.abs(R.n),dz=Math.abs(R.z);
  const reach=0.55+0.035*rc.foot,side=R.z>0.15?'bh':'fh',attr=n===0?rc.recv:rc[side];
  const mor=C.mor[idx]/100,wf=_c(dz/reach,0,1.5);
  const shortF=sh.landX<1.95?_c((1.95-sh.landX)/0.6,0,1)*(1-_c((rc.foot-3)/10,0,.8)):0;
  const comp={spin:0.36*_c(spin/110,0,1),speed:0.28*_c((v-5)/12,0,1),wide:0.28*_c(wf,0,1.3),short:0.2*shortF};
  const diff=comp.spin+comp.speed+comp.wide+comp.short+(R.y<-0.06?0.05:0);
  const ability=(attr/12)*(0.75+0.5*mor)*(C.calm[idx]>0?1.1:1);
  const pMiss=_c(0.03+(diff-0.75*ability)*0.9,0.02,0.9);
  const top=Object.keys(comp).sort((a,b)=>comp[b]-comp[a])[0];
  return {ok:Math.random()>=pMiss,top,diff,spin:R.n,v};
}
function makeShot(me,opp,key,C,hit,inc,n){
  const SH=SHOTS[key],tac=C.tac[hit],st=hit===0;
  let v=SH.v,sp=SH.n,tx=SH.tx+_g()*0.1;
  if(tac==='safe'){v*=.85;sp*=.9;tx-=.1;}
  if(tac==='power'){v*=1.18;sp*=1.12;tx+=.1;}
  if(tac==='place')v*=.95;
  if(tac==='rally'&&(key==='loop'||key==='drive'))v*=.95;
  const side=inc&&inc.z>0.15?'bh':'fh';
  const stat=SH.serve?me.serve:(key==='push'||key==='block'||key==='chop')?(me.fh+me.bh)/2:me[side];
  const diff=inc?inc.diff:0,mor=C.mor[hit]/100;
  let sig=(1.9-0.1*stat)*(1+0.8*diff)*(1.3-0.4*mor);
  sig*=tac==='safe'?0.65:tac==='power'?1.35:(tac==='rally'&&(key==='loop'||key==='drive'))?0.88:1;
  if(C.calm[hit]>0)sig*=0.65;
  if(st&&me.trait==='怕输'&&C.pts[0]<C.pts[1]&&C.calm[hit]<=0)sig*=1.2;
  sig=Math.max(sig,0.5);
  const weak=st&&C.weak>0;
  return fireShot({v,n:sp,x0:SH.serve?-0.1:TAB.L-inc.x,y0:SH.serve?0.17:_c(inc.y,-0.12,0.38),tx,zt:pickZ(tac,opp,weak,n),
    sig,svn:0.03*sig/1.2,zn:0.07*sig/1.2,xhit:TAB.L+opp.dist});
}
// 一分：谁发球 → 逐板模拟直到有人失误。返回可回放的各板轨迹
function simPoint(C){
  const shots=[];let hit=C.server,t=0,inc=null,n=0,winner=-1,reason='';
  for(;n<16;n++){
    const me=C.P[hit],opp=C.P[1-hit];
    const key=n===0?pickServe(me,opp,C.tac[hit]):pickShot(me,C.tac[hit],inc,n);
    const sh=makeShot(me,opp,key,C,hit,inc,n);sh.who=hit;sh.key=key;sh.t0=t;shots.push(sh);
    const nm=SHOTS[key].name;
    if(sh.status!=='in'){winner=1-hit;
      reason=sh.status==='out'?`${me.nm}${nm}打出界了`:(inc&&inc.n<-15&&(key==='loop'||key==='drive'))?`${me.nm}被下旋压住，${nm}下网`:`${me.nm}${nm}下网`;break;}
    if(!sh.reach){winner=hit;reason=`${nm}落点刁，${opp.nm}没追上`;break;}
    const r=handleBall(opp,sh,C,1-hit,n);
    if(!r.ok){winner=hit;reason=`${nm}得分：${opp.nm}${MISS_TXT[r.top]}`;break;}
    t+=sh.reachT;inc={n:sh.reach.n,v:r.v,y:sh.reach.y,z:sh.reach.z,x:sh.reach.x,diff:r.diff};hit=1-hit;
  }
  if(winner<0){winner=Math.random()<.5?0:1;reason='相持太久，体力拼过了对手';}
  const last=shots[shots.length-1];
  return {shots,winner,reason,len:shots.length,total:last.t0+last.endT+0.55,srv:C.server};
}
// 回放：给定时间 τ，返回球位置和击球动作进度
function animAt(pt,tau){
  let i=pt.shots.length-1;
  for(let j=0;j<pt.shots.length;j++){const s=pt.shots[j],nx=pt.shots[j+1];if(!nx||tau<nx.t0){i=j;break;}}
  const s=pt.shots[i],last=i===pt.shots.length-1,seg=last?s.endT:s.reachT,loc=Math.max(0,tau-s.t0),p=s.path;
  let q=0;while(q+1<p.length&&p[q+1][0]<=loc)q++;
  const hold=loc>s.endT+0.35&&last;
  return {dirR:s.who===0,u:_c(loc/(seg||1),0,1),k:0,shot:i,ball:hold?null:{X:p[q][1],y:p[q][2],z:p[q][3]}};
}
if(typeof module!=='undefined')module.exports={simPoint,SHOTS,TACTICS,fireShot,landSim,bounceTable,solveAngle,solveAngles};
