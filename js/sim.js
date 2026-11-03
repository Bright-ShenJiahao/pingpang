// 「乒乓」· 经营循环（时段结算、训练成长、收支、人气、设施、存档）与界面
const DAYS=['周一','周二','周三','周四','周五','周六','周日'], SLOTS=['上午','下午','晚上'];
const ACTS=['开课','带训练','修理','走访','休息'];
const STATS=['发球','接发球','正手','反手','步法','体力','心态','勤奋'];
const $=id=>document.getElementById(id);
const money=n=>(n<0?'-¥':'¥')+Math.abs(Math.round(n)).toLocaleString();
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const SAVE_KEY='pingpang_save_v1';

// ---------- 数据定义 ----------
// 训练项目：提升哪些属性(权重)、体力消耗、需要什么
const TRAIN={
  '多球':{gain:{步法:.5,正手:.3,反手:.3},hp:-15,table:true,need:'net',needText:'需要集球网'},
  '对练':{gain:{正手:.35,反手:.35,心态:.2},hp:-12,table:true},
  '发球接发球':{gain:{发球:.5,接发球:.5},hp:-8,table:true},
  '体能':{gain:{体力:.5,步法:.3},hp:-15,table:false},
  '陪练（老球友）':{gain:{接发球:.2,反手:.3,心态:.3},hp:-12,table:true,need:'chop',needText:'老球友好感 ♥3 解锁'},
  '休息':{gain:{},hp:+30,table:false}
};
// 相性：性格/打法 × 训练项目
const AFF={'怕输':{对练:1.3,'陪练（老球友）':1.2,发球接发球:0.9},'天赋高但懒':{多球:1.3,体能:0.7,对练:1.1},
  '老实':{发球接发球:1.2,体能:1.2},'爱笑':{对练:1.3,多球:0.8},'直拍快攻':{'陪练（老球友）':1.3,发球接发球:1.1}};
function affinity(s,p){let m=1;if(AFF[s.trait]&&AFF[s.trait][p])m*=AFF[s.trait][p];if(AFF[s.style]&&AFF[s.style][p])m*=AFF[s.style][p];return m;}
const affMark=m=>m>=1.25?'◎':m>=1.05?'○':m<=0.85?'△':'';
// 设施工程：放进施工队列，安排「修理」时段完成
const FAC=[
  {id:'t3_fix',name:'修好 3 号台',cost:800,show:()=>G.tables[3]==='broken',done:()=>{G.tables[3]='ok';},desc:'台面起翘、网架松了'},
  {id:'net',name:'集球网',cost:600,show:()=>!G.flags.net,done:()=>{G.flags.net=true;},desc:'解锁多球训练'},
  {id:'fridge',name:'柜台加冰柜（卖饮料）',cost:800,show:()=>!G.flags.drinks,done:()=>{G.flags.drinks=true;},desc:'每位客人买汽水 ¥3'},
  {id:'gear',name:'柜台后挂器材架（卖胶皮、球拍）',cost:1500,show:()=>!G.flags.gear,done:()=>{G.flags.gear=true;},desc:'客人会顺手买胶皮、球拍、球'},
  {id:'ceiling',name:'修吊顶',cost:500,show:()=>!G.flags.ceiling,done:()=>{G.flags.ceiling=true;},desc:'不修会漏水'},
  {id:'dehum',name:'除湿机',cost:1500,show:()=>!G.flags.dehum,done:()=>{G.flags.dehum=true;},desc:'回南天训练不再打折'},
  {id:'paint',name:'地面刷漆',cost:1800,show:()=>!G.flags.paint,done:()=>{G.flags.paint=true;G.rep+=5;},desc:'训练效果 +10%，人气 +5'},
  {id:'barrier',name:'换新挡板',cost:2000,show:()=>!G.flags.barrier,done:()=>{G.flags.barrier=true;G.rep+=10;},desc:'人气 +10'},
  ...[1,2,3].map(n=>({id:'blue'+n,name:`${n} 号台换新蓝台`,cost:1500,show:()=>G.tables[n]==='ok',done:()=>{G.tables[n]='blue';},desc:'训练效果 +10%，散客更爱来'})),
  ...[4,5,6].map(n=>({id:'clean'+n,name:`清理 ${n} 号格杂物`,cost:300,show:()=>G.tables[n]==='junk',done:()=>{G.tables[n]='broken';},desc:'清理后才能修台'})),
  ...[4,5,6].map(n=>({id:'fix'+n,name:`修好 ${n} 号台`,cost:1000,show:()=>G.tables[n]==='broken',done:()=>{G.tables[n]='ok';},desc:'后排的旧台'}))
];
const NB=[{id:'tang',name:'糖水铺阿姨',give:'饮料供货、八卦情报',spon:'挡板广告 · 糖水会'},
  {id:'shi',name:'士多店老板',give:'球和胶皮进货',spon:'器材进货打折'},
  {id:'old',name:'老球友',give:'削球陪练、爷爷的旧事',spon:'♥3 解锁削球陪练'}];
const WISHES=[
  {text:'先把 3 号台修好',ok:()=>G.tables[3]!=='broken',reward:()=>{G.rep+=5;},rewardText:'人气 +5'},
  {text:'让三张台都能用',ok:()=>[1,2,3].every(n=>usable(n)),reward:()=>{G.rep+=5;},rewardText:'人气 +5'},
  {text:'让糖水铺阿姨愿意帮忙（♥3）',ok:()=>G.love.tang>=3,reward:()=>{G.money+=500;},rewardText:'阿姨送来一箱汽水，¥500'},
  {text:'球馆人气到三颗星',ok:()=>stars()>=3,reward:()=>{},rewardText:''},
  {text:'带一个孩子去打市赛',ok:()=>false,reward:()=>{},rewardText:''}
];
const TIPS=['多球：一筐球连续喂，练的是步法和连续性。','打削球手不要跟他比耐心，拉加转和突击要结合。','怕输的孩子，领先的时候最要提醒他冷静。','懒孩子练多球最有效：球一直来，想偷懒都难。','回南天地板滑，别让孩子们拼命跑。'];

function newGame(){
  return {week:1,day:0,slot:0,money:5000,rep:5,weather:'回南天',
    tables:{1:'ok',2:'ok',3:'broken',4:'junk',5:'junk',6:'junk'},
    flags:{},queue:[],love:{tang:1,shi:1,old:2},visit:'tang',talked:{},
    sched:Array.from({length:7},()=>['开课','带训练','修理']),
    students:[
      {id:'A',name:'小学员 A',spr:'kid_r_close',actor:'kid',hand:'右手横拍',style:'弧圈快攻',trait:'怕输',talent:1.0,stat:{发球:6,接发球:5,正手:8,反手:6,步法:7,体力:9,心态:4,勤奋:8},hp:90,mood:60,bond:30,train:'对练',tbl:1,joined:true,story:'第一次来球馆时躲在门后看了半小时。'},
      {id:'B',name:'小学员 B',spr:null,blk:['#3e66a8','#2b3550','#2a1d14',true],hand:'右手横拍',style:'快攻',trait:'天赋高但懒',talent:1.4,stat:{发球:9,接发球:8,正手:9,反手:8,步法:5,体力:5,心态:7,勤奋:3},hp:80,mood:70,bond:10,train:'发球接发球',tbl:1,joined:true,story:'（待写）'},
      {id:'C',name:'小学员 C',spr:null,blk:['#c45a3a','#3a3a3a','#2a1d14',true],hand:'右手直拍',style:'直拍快攻',trait:'老实',talent:0.9,stat:{发球:5,接发球:6,正手:7,反手:4,步法:6,体力:8,心态:6,勤奋:9},hp:90,mood:65,bond:20,train:'体能',tbl:0,joined:true,story:'（待写）'},
      {id:'D',name:'小女孩',spr:'girl0_close',actor:'girl',hand:'右手横拍',style:'新手',trait:'爱笑',talent:1.2,stat:{发球:2,接发球:2,正手:3,反手:2,步法:3,体力:5,心态:8,勤奋:6},hp:90,mood:85,bond:15,train:'对练',tbl:2,joined:true,story:'看了电视上的比赛，非要妈妈带她来学打球。'}],
    msgs:['老球友：「你爷爷当年的球拍还在柜台抽屉里。」','市乒协：第 4 周周六举办市赛少儿组，周四截止报名。'],
    wishDone:[],cust:{},wk:freshWeek(),lastTip:''};
}
function freshWeek(){return {inc:{课程:0,散客:0,饮料:0,器材:0,奖励:0},out:{设施:0,水电房租:0},gain:{},rep0:null};}
let G=load()||newGame();
let ARRIVE_T0=performance.now();
function arriveP(id){if(S.view!=='hall')return 1;return clamp((performance.now()-ARRIVE_T0-(id-1)*350)/2600,0,1);}
function save(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(G));}catch(e){}}
function load(){try{const s=localStorage.getItem(SAVE_KEY);return s?JSON.parse(s):null;}catch(e){return null;}}

// ---------- 规则 ----------
const stars=()=>clamp(1+Math.floor(G.rep/20),1,5);
const usable=n=>G.tables[n]==='ok'||G.tables[n]==='blue';
const isWeekend=()=>G.day>=5;
const atHall=s=>s.joined&&(isWeekend()||G.slot>0);   // 工作日上午在上学
function boxOf(id){return boxes.find(b=>b.id===id);}
function trainOK(s,p){const t=TRAIN[p];if(t.need==='net'&&!G.flags.net)return false;if(t.need==='chop'&&G.love.old<3)return false;return true;}
// 球台上是谁：学员优先，其次散客
function tableActors(b){
  if(S.mode!=='train'&&S.view==='hall')return [{blk:PEOPLE[0]},{blk:PEOPLE[1]}];
  const here=G.students.filter(s=>atHall(s)&&s.tbl===b.id&&TRAIN[s.train].table&&s.train!=='休息');
  const act=s=>s.actor?s.actor:{blk:s.blk};
  if(here.length>=2){let a=here[0],c=here[1];if(c.actor&&!a.actor)[a,c]=[c,a];return [act(a),{blk:c.blk||['#f2f0e6','#2b3550','#2a1d14',true]}];}
  if(here.length===1){const s=here[0];
    const R=s.train==='陪练（老球友）'?'of':s.actor==='girl'?'mom':s.id==='A'?'of':{blk:['#f2f0e6','#2b3550','#3a2a1e',false]};
    return [act(s),R];}
  if((G.cust[b.id]||0)>0)return [{blk:PEOPLE[(b.id*2)%4]},{blk:PEOPLE[(b.id*2+1)%4]}];
  return null;
}

// ---------- 飘字 ----------
const FLY=[];
function fly(x,d,text,color){const now=performance.now(),n=FLY.filter(f=>Math.abs(f.x-x)<1.5&&Math.abs(f.d-d)<1.5&&now-f.t0<400).length;FLY.push({x,d,text,color:color||'#ffe9a8',t0:now,dy:n*16});}
function drawFly(){
  const now=performance.now();ctx.font='bold 13px sans-serif';ctx.textAlign='center';ctx.textBaseline='bottom';
  for(let i=FLY.length-1;i>=0;i--){const f=FLY[i],a=(now-f.t0)/1800;if(a>1){FLY.splice(i,1);continue;}
    const p=P(f.x,f.d,1.9);const y=p[1]-a*26-(f.dy||0);ctx.globalAlpha=1-a*a;ctx.fillStyle='rgba(30,20,10,.7)';ctx.fillText(f.text,p[0]+1,y+1);ctx.fillStyle=f.color;ctx.fillText(f.text,p[0],y);}
  ctx.globalAlpha=1;ctx.textAlign='left';
}
function flyAtTable(id,text,color,dx){const b=boxOf(id);if(b)fly((b.x0+b.x1)/2+(dx||0),(b.d0+b.d1)/2,text,color);}

// ---------- 时段结算 ----------
function addInc(k,v){G.money+=v;G.wk.inc[k]=(G.wk.inc[k]||0)+v;}
function addOut(k,v){G.money-=v;G.wk.out[k]=(G.wk.out[k]||0)+v;}
function endSlot(){
  if(G.wk.rep0===null)G.wk.rep0=G.rep;
  const act=G.sched[G.day][G.slot], lines=[];
  const coach=act==='带训练';
  const hallStudents=G.students.filter(atHall);
  // 1 主角的行动
  if(act==='开课'){
    if(![1,2,3].some(usable)){lines.push('没有能用的台子，课开不了');}
    else{const base=[120,180,220][G.slot],name=['老年晨练班','少儿班','成人班'][G.slot],v=Math.round(base*(0.6+stars()*0.2));
      addInc('课程',v);G.rep+=0.6;lines.push(`${name} 收入 ${money(v)}`);flyAtTable(firstUsable(),'+'+money(v),'#ffe08a',-1);}
  }else if(act==='修理'){
    if(G.queue.length){const names=[];G.queue.forEach(id=>{const f=FAC.find(x=>x.id===id);f.done();names.push(f.name);});G.queue=[];layout();
      lines.push('完工：'+names.join('、'));names.forEach((n,i)=>fly(REST+6+i*3,3,'完工！','#9ff0a0'));}
    else{G.rep+=0.5;lines.push('打扫了球馆，人气小涨');}
  }else if(act==='走访'){
    const n=NB.find(x=>x.id===G.visit);G.love[n.id]=Math.min(5,G.love[n.id]+1);lines.push(`走访${n.name}，好感 ♥${G.love[n.id]}`);
    if(n.id==='old'&&G.love.old===3)msg('老球友：「以后让孩子们来跟我练削球！」（解锁削球陪练）');
    if(n.id==='tang'&&G.love.tang===3)msg('糖水铺阿姨：「有什么要帮忙的尽管说。」');
  }else if(act==='休息'){hallStudents.forEach(s=>s.mood=clamp(s.mood+5,0,100));lines.push('陪大家聊了会天，心情 +5');}
  // 2 学员训练
  const wet=G.weather==='回南天'&&!G.flags.dehum;
  hallStudents.forEach(s=>{
    let p=s.train; if(TRAIN[p].table&&!usable(s.tbl))p='体能'; if(!trainOK(s,p))p='体能';
    const T=TRAIN[p];
    if(p==='休息'){s.hp=clamp(s.hp+30,0,100);s.mood=clamp(s.mood+8,0,100);return;}
    let m=0.25*affinity(s,p)*s.talent*(0.5+s.stat.勤奋/20);
    if(s.trait==='天赋高但懒'&&!coach)m*=0.6;
    if(coach){m*=1.4;s.bond=clamp(s.bond+1,0,100);}
    if(s.hp<25)m*=0.5; if(s.mood<30)m*=0.7;
    if(wet)m*=0.7; if(G.flags.paint)m*=1.1; if(G.tables[s.tbl]==='blue'&&T.table)m*=1.1;
    const ups=[];
    for(const [k,w] of Object.entries(T.gain)){const before=Math.floor(s.stat[k]);s.stat[k]=Math.min(20,s.stat[k]+w*m*(0.8+Math.random()*0.4));
      const d=Math.floor(s.stat[k])-before;if(d>0){ups.push(k+' +'+d);G.wk.gain[s.name]=G.wk.gain[s.name]||{};G.wk.gain[s.name][k]=(G.wk.gain[s.name][k]||0)+d;}}
    s.hp=clamp(s.hp+T.hp,0,100);s.mood=clamp(s.mood-2,0,100);
    ups.forEach((u,i)=>{if(T.table)flyAtTable(s.tbl,`${s.name.replace('小学员 ','')} ${u}`,'#a8e0ff',(i-0.5)*1.2);else fly(REST+2,5+i,`${s.name.replace('小学员 ','')} ${u}`,'#a8e0ff');});
  });
  // 3 散客 + 饮料
  const busy=new Set(hallStudents.filter(s=>TRAIN[s.train].table).map(s=>s.tbl));
  let people=0;G.cust={};
  [1,2,3,4,5,6].forEach(n=>{if(!usable(n)||busy.has(n))return;
    const want=(0.4+stars()*0.25+(G.slot===2?0.6:0)+(G.tables[n]==='blue'?0.3:0))*(G.weather==='雨'?0.7:1);
    const c=Math.min(2,Math.floor(want+Math.random()));G.cust[n]=c;
    if(c>0){const v=c*10;addInc('散客',v);people+=c;G.rep+=0.08*c;flyAtTable(n,'+'+money(v));}});
  if(G.flags.gear){let v=0;const buyers=Math.floor((people+hallStudents.length)*(0.15+stars()*0.04)+Math.random());for(let i=0;i<buyers;i++)v+=[20,45,60,120][Math.floor(Math.random()*4)];if(v>0){addInc('器材',v);fly(1.5,11,'+'+money(v)+' 器材','#ffd27a');}}
  if(G.flags.drinks){const v=(people+hallStudents.length+(act==='开课'?6:0))*3;if(v>0){addInc('饮料',v);fly(3.4,11.9,'+'+money(v)+' 汽水','#ffe08a');}}
  // 4 心愿
  checkWishes();
  G.rep=clamp(G.rep,0,100);
  // 5 时间推进
  const doneSlot=`${DAYS[G.day]}${SLOTS[G.slot]}`;
  G.slot++;
  if(G.slot>2){G.slot=0;
    G.students.forEach(s=>{s.hp=clamp(s.hp+25,0,100);s.mood=clamp(s.mood+(60-s.mood)*0.2,0,100);});
    G.talked={};
    if(G.day===6){addOut('水电房租',900);const wk=G.wk;showWeek(wk);G.wk=freshWeek();G.week++;G.day=0;}
    else G.day++;
    rollWeather();
  }
  // 下一个时段的散客（让画面先热闹起来）
  previewCustomers();
  ARRIVE_T0=performance.now();
  save();hud();nav();
  toast(`${doneSlot}：${lines.join('；')||'—'}`);
}
function firstUsable(){return [1,2,3,4,5,6].find(usable)||1;}
function rollWeather(){const r=Math.random();G.weather=r<0.55?'晴':r<0.7?'阴':r<0.85?'雨':'回南天';if(G.weather==='回南天'&&!G.flags.dehum)msg('又是回南天，地板湿滑，今天训练效果打七折。');}
function previewCustomers(){
  const busy=new Set(G.students.filter(s=>atHall(s)&&TRAIN[s.train].table).map(s=>s.tbl));G.cust={};
  [1,2,3,4,5,6].forEach(n=>{if(usable(n)&&!busy.has(n))G.cust[n]=Math.random()<0.35+stars()*0.1+(G.slot===2?0.2:0)?1:0;});
}
function msg(t){G.msgs.unshift(t);G.msgs=G.msgs.slice(0,20);}
function checkWishes(){WISHES.forEach((w,i)=>{if(!G.wishDone.includes(i)&&w.ok()){G.wishDone.push(i);w.reward();msg('完成心愿：'+w.text+(w.rewardText?'（'+w.rewardText+'）':''));fly(2,9,'✔ '+w.text,'#9ff0a0');}});}

// ---------- 界面 ----------
let toastT=null;
function toast(t){const el=$('toast');if(!el)return;el.textContent=t;el.style.opacity=1;clearTimeout(toastT);toastT=setTimeout(()=>el.style.opacity=0,4500);}
function hud(){
  $('hud').innerHTML=`<span>第${G.week}周 · ${DAYS[G.day]} · ${SLOTS[G.slot]}</span><span>${money(G.money)}</span><span>人气 ${'★'.repeat(stars())}${'☆'.repeat(5-stars())}</span><span>${G.weather}</span><span class="nbk" onclick="openUI('notebook')">笔记本${G.msgs.length?'<b>●</b>':''}</span><span class="gear" onclick="openUI('system')">设置</span>`;
}
function bar(v,max=20){return `<span class="bar"><i style="width:${clamp(v/max,0,1)*100}%"></i></span>`;}
function nav(){
  const today=G.sched[G.day];
  $('nav').innerHTML=`<div class="today">${SLOTS.map((s,i)=>`<span class="${i===G.slot?'cur':i<G.slot?'past':''}" onclick="openUI('schedule')">${s[0]}·${today[i]}</span>`).join('')}</div>
  <div class="btns">${[['日程','schedule'],['学员','students'],['训练','training'],['设施','facility'],['街坊','street'],['赛程','fixtures'],['笔记','notebook']].map(b=>`<button onclick="openUI('${b[1]}')">${b[0]}${b[1]==='facility'&&G.queue.length?'·'+G.queue.length:''}</button>`).join('')}</div><button class="go" onclick="endSlot()">结束${SLOTS[G.slot]} ▶</button>`;
  side();
}
function side(){
  const el=$('side');if(!el)return;
  el.innerHTML=G.students.filter(s=>s.joined).map((s,i)=>`<div class="sc" onclick="UI.student(${i})">${s.spr?`<img src="${SPR[s.spr].src}">`:'<div class="ph"></div>'}<div><b>${s.name}</b> <span class="tag">${s.trait}</span><br>${atHall(s)?s.train+(TRAIN[s.train].table?' · '+s.tbl+'号台':''):'上学中'}<br>体力 ${bar(s.hp,100)} 心情 ${bar(s.mood,100)}</div></div>`).join('');
}
function modal(title,html,small){$('modal').className='ov'+(small?' small':'');$('modal').style.display='block';$('modal').innerHTML=`<div class="mh"><b>${title}</b><span onclick="closeUI()">关闭 ✕</span></div><div class="mb">${html}</div>`;}
function closeUI(){$('modal').style.display='none';}
const UI={
 schedule(){
  const today=G.sched[G.day];
  modal('日程安排',`<h4>今天（${DAYS[G.day]}）</h4><div class="slots">${SLOTS.map((s,i)=>`<div class="slot ${i===G.slot?'cur':''} ${i<G.slot?'past':''}"><b>${s}${i<G.slot?'（已过）':''}</b>${ACTS.map(a=>`<button class="${today[i]===a?'on':''}" ${i<G.slot?'disabled':''} onclick="G.sched[${G.day}][${i}]='${a}';UI.schedule();nav();save()">${a}</button>`).join('')}</div>`).join('')}</div>
  <h4>本周</h4><table class="wk"><tr><th></th>${DAYS.map((d,i)=>`<th class="${i===G.day?'cur':''}">${d}</th>`).join('')}</tr>${SLOTS.map((s,j)=>`<tr><th>${s}</th>${DAYS.map((d,i)=>`<td class="${i===G.day&&j===G.slot?'cur':''}" onclick="${i>G.day||(i===G.day&&j>=G.slot)?`cycleAct(${i},${j})`:''}">${G.sched[i][j]}</td>`).join('')}</tr>`).join('')}</table>
  <p class="hint">点本周表格的格子可以切换安排。开课：上午老年晨练班、下午少儿班、晚上成人班，收学费、涨人气 · 带训练：本时段训练效果 ×1.4，懒孩子不偷懒 · 修理：完成施工队列里的工程（没有工程就打扫，人气 +1） · 走访：去找街坊，好感 +1 · 休息：陪大家聊天，心情 +5。工作日上午孩子们在上学。</p>`);
 },
 students(){
  modal('学员名册',`<div class="cards">${G.students.filter(s=>s.joined).map((s,i)=>`<div class="scard" onclick="UI.student(${i})">${s.spr?`<img src="${SPR[s.spr].src}">`:'<div class="ph">待出图</div>'}<b>${s.name}</b><small>${s.hand} · ${s.style}</small><span class="tag">${s.trait}</span><small>体力 ${bar(s.hp,100)}</small><small>心情 ${bar(s.mood,100)}</small><small>现在：${atHall(s)?s.train+(TRAIN[s.train].table?' · '+s.tbl+'号台':''):'上学中'}</small></div>`).join('')}</div>`);
 },
 student(i){
  const s=G.students[i],grp={技术:['发球','接发球','正手','反手'],身体:['步法','体力'],心理:['心态','勤奋']};
  modal(s.name,`<div class="detail"><div class="left">${s.spr?`<img src="${SPR[s.spr].src}">`:'<div class="ph big">待出图</div>'}<span class="tag">${s.trait}</span><small>${s.hand}<br>${s.style}</small></div>
  <div class="right">${Object.entries(grp).map(([g,ks])=>`<h4>${g}</h4>${ks.map(k=>`<div class="attr"><span>${k}</span>${bar(s.stat[k])}<em>${Math.floor(s.stat[k])}</em></div>`).join('')}`).join('')}
  <h4>状态</h4><div class="attr"><span>体力</span>${bar(s.hp,100)}<em>${Math.round(s.hp)}</em></div><div class="attr"><span>心情</span>${bar(s.mood,100)}<em>${Math.round(s.mood)}</em></div><div class="attr"><span>关系</span>${bar(s.bond,100)}<em>${s.bond}</em></div>
  <h4>小故事</h4><p>${s.story}</p></div></div>
  <div class="row"><button onclick="UI.students()">◀ 名册</button><button ${G.talked[s.id]?'disabled':''} onclick="UI.talk(${i})">谈话${G.talked[s.id]?'（今天聊过了）':''}</button><button onclick="UI.training()">安排训练</button></div>`);
 },
 talk(i){
  const s=G.students[i];
  modal('和'+s.name+'谈话',`<p class="say">「教练，今天练什么？」</p><div class="row">${[['鼓励','鼓励'],['施压','施压'],['冷静','让他冷静']].map(([k,t])=>`<button onclick="doTalk(${i},'${k}')">${t}</button>`).join('')}</div><p id="react" class="react">（选一个说法，看他的反应。每人每天一次）</p><div class="row"><button onclick="UI.student(${i})">◀ 返回</button></div>`,true);
 },
 training(){
  modal('训练安排（每个时段都按这个执行）',`<table class="tr"><tr><th>学员</th><th>训练项目（◎很合适 ○合适 △不太合适）</th><th>球台</th><th>体力</th></tr>${G.students.filter(s=>s.joined).map((s,i)=>`<tr><td>${s.name}<br><small>${s.trait}${atHall(s)?'':' · 上学中'}</small></td><td>${Object.keys(TRAIN).map(t=>{const ok=trainOK(s,t),m=affinity(s,t);return `<button class="${s.train===t?'on':''}" ${ok?'':'disabled title="'+TRAIN[t].needText+'"'} onclick="G.students[${i}].train='${t}';UI.training();save()">${t}${affMark(m)}</button>`;}).join('')}</td><td>${TRAIN[s.train].table?`<select onchange="G.students[${i}].tbl=+this.value;save()">${[1,2,3,4,5,6].map(n=>`<option ${!usable(n)?'disabled':''} ${s.tbl===n?'selected':''} value="${n}">${n}号台${usable(n)?'':'（不能用）'}</option>`).join('')}</select>`:'—'}</td><td>${bar(s.hp,100)}</td></tr>`).join('')}</table>
  <p class="hint">一张台最多两人。只有一个人时，老球友或妈妈会陪练。多球需要集球网；削球陪练要老球友好感 ♥3。体力低于 25 时效果减半。</p>`);
 },
 facility(){
  const q=G.queue.map(id=>FAC.find(f=>f.id===id));
  modal('设施与修理',`${q.length?`<h4>施工队列（安排一个「修理」时段完成）</h4>${q.map(f=>`<div class="ln"><span>${f.name}</span><em>施工中</em></div>`).join('')}`:''}
  <h4>可以做的工程</h4><table class="tr"><tr><th>工程</th><th>效果</th><th>费用</th><th></th></tr>${FAC.filter(f=>f.show()&&!G.queue.includes(f.id)).map(f=>`<tr><td>${f.name}</td><td>${f.desc}</td><td>${money(f.cost)}</td><td><button ${G.money<f.cost?'disabled':''} onclick="buyFac('${f.id}')">${G.money<f.cost?'钱不够':'下单'}</button></td></tr>`).join('')}</table>
  <p class="hint">下单时付钱，排进施工队列；把日程里某个时段安排成「修理」，那个时段结束时完工。</p>`);
 },
 street(){
  modal('街坊 · 骑楼老街',`<div class="street"><img src="${STREET}"><div class="nbs">${NB.map(n=>`<div class="nb"><b>${n.name}</b><span class="love">${'♥'.repeat(G.love[n.id])}${'♡'.repeat(5-G.love[n.id])}</span><small>能提供：${n.give}</small><small>${n.spon}</small><div class="row"><button class="${G.visit===n.id?'on':''}" onclick="G.visit='${n.id}';UI.street();save()">${G.visit===n.id?'✔ 下次走访找他':'下次走访找他'}</button></div></div>`).join('')}</div></div><p class="hint">在日程里安排「走访」，那个时段就会去找你选的人，好感 +1。</p>`);
 },
 fixtures(){
  modal('赛程与报名',`<table class="tr"><tr><th>时间</th><th>比赛</th><th>状态</th></tr><tr><td>第2周 周六</td><td>街坊友谊赛（球馆内）</td><td>需 3 张台可用</td></tr><tr><td>第4周 周六</td><td><b>市赛 · 少儿组</b><br><small>小组赛 1 场 + 淘汰赛 2～3 场</small></td><td>周四截止报名</td></tr></table>
  <p class="hint">比赛系统还在设计中，现在先看比赛特写。</p>`);
 },
 notebook(tab='wish'){
  const T={wish:'心愿',msg:'消息',tip:'训练心得'};
  const body=tab==='wish'?WISHES.map((w,i)=>`<label class="chk"><input type="checkbox" ${G.wishDone.includes(i)?'checked':''} disabled> ${w.text}${w.rewardText?` <small>（${w.rewardText}）</small>`:''}</label>`).join(''):tab==='msg'?`<ul>${G.msgs.map(m=>`<li>${m}</li>`).join('')}</ul>`:`<ul>${TIPS.map(m=>`<li>${m}</li>`).join('')}</ul>`;
  modal('爷爷的笔记本',`<img src="${SPR.grandpa2_close.src}" style="float:right;image-rendering:pixelated;height:110px"><div class="tabs">${Object.entries(T).map(([k,v])=>`<button class="${k===tab?'on':''}" onclick="UI.notebook('${k}')">${v}</button>`).join('')}</div><div class="paper">${body}</div>`);
 },
 system(){modal('设置',`<div class="row"><button onclick="save();toast('已存档')">存档</button><button onclick="if(confirmReset()){}">重新开始</button></div><p class="hint">每个时段结束会自动存档（存在这台设备的浏览器里）。</p><p id="resetq" class="react" style="display:none">确定要清空存档、从头开始吗？<button onclick="localStorage.removeItem(SAVE_KEY);G=newGame();layout();hud();nav();closeUI();toast('已重新开始')">确定</button></p>`,true);},
 tableMenu(b){
  const name=b.id+'号台', st=G.tables[b.id];
  if(usable(b.id)){const who=G.students.filter(s=>atHall(s)&&s.tbl===b.id&&TRAIN[s.train].table&&s.train!=='休息');
    modal(name+(st==='blue'?'（蓝台）':''),`<p>${SLOTS[G.slot]}：${who.length?who.map(s=>s.name+'（'+s.train+'）').join('、'):(G.cust[b.id]?'散客在打球':'空着')}</p><div class="row"><button onclick="closeUI();S.sel=boxes.find(x=>x.id===${b.id});S.view='close';fit()">观看</button><button onclick="UI.training()">安排训练</button></div>`,true);}
  else{const f=FAC.find(x=>x.show()&&(x.id==='t3_fix'&&b.id===3||x.id==='clean'+b.id||x.id==='fix'+b.id));
    modal(name+(st==='junk'?'（堆杂物）':'（待修）'),f?`<p>${f.desc}。费用 ${money(f.cost)}</p>${G.queue.includes(f.id)?'<p>已下单，安排一个「修理」时段完工。</p>':`<div class="row"><button ${G.money<f.cost?'disabled':''} onclick="buyFac('${f.id}');UI.tableMenu(boxes.find(x=>x.id===${b.id}))">下单（${f.name}）</button></div>`}`:'<p>—</p>',true);}
 },
 tea(){modal('工夫茶台',`<p>一张老茶台，茶盘、紫砂壶、几只小茶杯，旁边一把随手泡。爷爷以前常和老球友坐在这里，一泡茶喝一下午，边喝边看人打球。</p><p class="hint">以后：老球友不打球时会坐在这里；可以「喝茶聊天」加街坊好感、听爷爷的旧事；学员练累了来这里歇脚。</p>`,true);},
 shop(){modal('柜台 · 小卖部',`<p>${G.flags.drinks?'冰柜里有汽水，每位客人买一瓶 ¥3，自动结算。':'还没开始卖饮料：加个冰柜就能卖汽水。'}</p><p>${G.flags.gear?'后墙挂着器材架，客人会顺手买胶皮、球拍、球。':'柜台后墙可以挂一个器材架，卖胶皮、球拍、球。'}</p>${G.flags.drinks&&G.flags.gear?'':'<div class="row"><button onclick="openUI(\'facility\')">去设施下单</button></div>'}`,true);}
};
function confirmReset(){$('resetq').style.display='block';return false;}
function cycleAct(d,sl){const i=ACTS.indexOf(G.sched[d][sl]);G.sched[d][sl]=ACTS[(i+1)%ACTS.length];UI.schedule();nav();save();}
function showWeek(wk){
  const inc=Object.values(wk.inc).reduce((a,b)=>a+b,0), out=Object.values(wk.out).reduce((a,b)=>a+b,0);
  const g=Object.entries(wk.gain);
  setTimeout(()=>modal(`第${G.week-1}周 结算`,`<div class="two"><div><h4>收入</h4>${Object.entries(wk.inc).map(([k,v])=>`<div class="ln"><span>${k}</span><em>${money(v)}</em></div>`).join('')}<div class="ln tot"><span>合计</span><em>${money(inc)}</em></div></div>
  <div><h4>支出</h4>${Object.entries(wk.out).map(([k,v])=>`<div class="ln"><span>${k}</span><em>${money(v)}</em></div>`).join('')}<div class="ln tot"><span>合计</span><em>${money(out)}</em></div></div></div>
  <h4>学员成长</h4>${g.length?g.map(([n,o])=>`<div class="ln"><span>${n}</span><em>${Object.entries(o).map(([k,v])=>k+' +'+v).join(' · ')}</em></div>`).join(''):'<p>这周没有明显进步。</p>'}
  <h4>球馆</h4><div class="ln"><span>人气</span><em>${Math.round(wk.rep0??G.rep)} → ${Math.round(G.rep)}（${'★'.repeat(stars())}）</em></div><div class="ln"><span>手上的钱</span><em>${money(G.money)}</em></div>
  <div class="row"><button class="go" onclick="closeUI()">进入第${G.week}周 ▶</button></div>`),50);
}
function openUI(k){UI[k]();}
function buyFac(id){const f=FAC.find(x=>x.id===id);if(G.money<f.cost)return;addOut('设施',f.cost);G.queue.push(id);save();hud();nav();if($('modal').style.display==='block'&&$('modal').textContent.includes('设施与修理'))UI.facility();toast(`已下单：${f.name}。安排一个「修理」时段完工`);}
function doTalk(i,k){const s=G.students[i];if(G.talked[s.id])return;G.talked[s.id]=1;
  const R={怕输:{鼓励:['他点点头，握拍的手松了一点。',{心态:.6}],施压:['他低下头，半天没说话。',{心态:-.8}],冷静:['他深呼吸了几次。',{心态:1}]},
    天赋高但懒:{鼓励:['「知道啦知道啦。」好像更放松了……',{勤奋:-.4}],施压:['「切，谁怕谁。」',{勤奋:1}],冷静:['他打了个哈欠。',{}]},
    老实:{鼓励:['他用力点头。',{心态:.4}],施压:['「我会多练的。」',{勤奋:.6}],冷静:['「嗯。」',{心态:.4}]},
    爱笑:{鼓励:['她笑得眼睛都眯起来了。',{心态:.5}],施压:['她嘴一撇，差点哭出来。',{心态:-.6}],冷静:['「好～」',{心态:.3}]}}[s.trait][k];
  const eff=Object.entries(R[1]).map(([a,v])=>{s.stat[a]=clamp(s.stat[a]+v,0,20);return a+(v>0?' ↑':' ↓');});
  s.mood=clamp(s.mood+(k==='施压'?-6:4),0,100);s.bond=clamp(s.bond+1,0,100);save();
  $('react').textContent=R[0]+(eff.length?'（'+eff.join('，')+'）':'');}
function hitAll(mx,my){
  useCfg(HALL);
  for(const b of [...boxes].sort((a,c)=>a.d0-c.d0)){const a=P(b.x0,b.d0,0),c=P(b.x1,b.d1,2);if(mx>=a[0]&&mx<=c[0]&&my<=a[1]&&my>=c[1])return {kind:'table',b};}
  const a=P(0,9.5,0),c=P(REST,12.8,2.2);if(mx>=a[0]&&mx<=c[0]+40&&my<=a[1]&&my>=c[1])return {kind:'shop'};
  const g1=P(1.0,6.3,0),g2=P(3.2,8.8,1.2);if(mx>=g1[0]&&mx<=g2[0]&&my<=g1[1]&&my>=g2[1])return {kind:'tea'};
  const e=P(0,0.3,0),f=P(0,2.3,2.4);if(mx>=Math.min(e[0],f[0])-10&&mx<=Math.max(e[0],f[0])+20&&my<=e[1]&&my>=f[1])return {kind:'street'};
  return null;
}

layout();previewCustomers();hud();nav();fit();
if(!location.hash.startsWith('#guide'))requestAnimationFrame(loop);
