// 「乒乓」· 比赛（自动打，教练只下指令卡）、打法方向与称号、开局问答、目标面板
const OPPS=[
 {id:'uncle',name:'巷口大叔',style:'横拍稳健',sty:'safe',tac:'safe',wk:'bh',r:5.5,weak:'反手',blk:['#8a6a4a','#4a4a4a','#2a1d14',false],prize:50,desc:'退休工人，打球全靠经验，反手比较慢。',lose:['大叔一板稳稳推回来，没接住','反手位被推了个空','大叔发球变了落点，接发球失误']},
 {id:'kid2',name:'隔壁球馆的小孩',style:'直拍快攻',sty:'drive',tac:'serve',wk:'foot',r:7,weak:'步法',blk:['#d0453a','#2b3550','#2a1d14',true],prize:80,desc:'动作快，但是步法跟不上。',lose:['对方正手快攻，没反应过来','直拍侧身抢攻，得分','对手一板快带，直接擦边']},
 {id:'old',name:'老球友',style:'削球',sty:'chop',tac:'rally',wk:'recv',r:8.5,weak:'接发球',of:true,prize:150,desc:'爷爷的老搭档，削球又稳又转。',lose:['削球下旋太转，回球下网','长短结合，被调动失分','老球友一个搓摆短，没够着']}
];
const WIN_TXT=['正手拉出一板好球，得分','发球抢攻，直接得分','接发球反拉成功','对手回球出界','相持中步法跟上，得分','反手一板挑打，得分'];
const MORE_TXT={'怕输':'有点紧张，手松了一下','天赋高但懒':'懒洋洋地少跑了一步','老实':'老老实实多打了一板','爱笑':'笑场了一下'};

const matchRating=s=>(s.stat.发球+s.stat.接发球+s.stat.正手+s.stat.反手+s.stat.步法)/5;

// ---------- 打法方向与称号 ----------
const LV_XP=[0,40,100,200];
const PATHS={
 '横拍弧圈':{t:['弧圈新手','普通弧圈手','区里的弧圈快手','城市弧圈王'],sk:[['拉起一板','正手 +1.5',{正手:1.5}],['侧身抢拉','步法 +1.5',{步法:1.5}],['前冲弧圈','接发球 +1.5',{接发球:1.5}],['发球抢攻','发球 +2',{发球:2}]]},
 '直拍快攻':{t:['快攻新手','普通快攻手','区里的快攻手','城市快攻王'],sk:[['近台快带','反手 +1.5',{反手:1.5}],['推挡调动','接发球 +1.5',{接发球:1.5}],['侧身爆冲','正手 +2',{正手:2}],['发球变化','发球 +2',{发球:2}]]},
 '削球手':{t:['削球新手','普通削球手','区里有名的削球手','城市削球王'],sk:[['加转下旋','反手 +1.5',{反手:1.5}],['搓摆短','接发球 +2',{接发球:2}],['长短结合','步法 +1.5',{步法:1.5}],['稳如磐石','心态 +2',{心态:2}]]},
 '全面型':{t:['乒乓新手','普通选手','区里的好手','城市好手'],sk:[['基本功扎实','正手、反手 +1',{正手:1,反手:1}],['发接发并重','发球、接发球 +1',{发球:1,接发球:1}],['脚下勤快','步法 +1.5',{步法:1.5}],['心态平稳','心态 +2',{心态:2}]]}
};
function sTitle(s){return s.path?PATHS[s.path].t[s.lv]:'（还没选打法方向）';}
function addXp(s,x){
  s.xp=(s.xp||0)+x;
  while(s.lv<3&&s.xp>=LV_XP[s.lv+1]){s.lv++;s.sp++;
    const t=s.path?PATHS[s.path].t[s.lv]:'升级';
    msg(`${s.name}升级了：${t}（获得 1 点技能点）`);toast(`${s.name} 升级：${t}！可以在学员页学新技能`);}
}
function pathHTML(i){
  const s=G.students[i],P=s.path&&PATHS[s.path],next=LV_XP[Math.min(3,s.lv+1)];
  if(!P)return `<h4>打法方向</h4><p class="hint">选一个方向，称号和技能就从这里长出来。</p><div class="row">${Object.keys(PATHS).map(k=>`<button onclick="setPath(${i},'${k}')">${k}</button>`).join('')}</div>`;
  return `<h4>打法方向：${s.path} · <b>${P.t[s.lv]}</b></h4><div class="attr"><span>经验</span>${bar(s.lv>=3?1:(s.xp-LV_XP[s.lv])/(next-LV_XP[s.lv]),1)}<em>${Math.floor(s.xp)}</em></div>
  <div class="row" style="margin-top:4px">${P.sk.map((k,j)=>{const got=s.skills.includes(j);return `<button class="${got?'on':''}" ${got||s.sp<1?'disabled':''} onclick="learnSkill(${i},${j})" title="${k[1]}">${k[0]}<small> ${k[1]}</small></button>`;}).join('')}</div><p class="hint">技能点 ${s.sp}（每次升级 +1）。学会后永久提升属性。</p>`;
}
function setPath(i,p){G.students[i].path=p;save();UI.student(i);}
function learnSkill(i,j){const s=G.students[i],k=PATHS[s.path].sk[j];if(s.sp<1||s.skills.includes(j))return;
  s.sp--;s.skills.push(j);for(const a in k[2])s.stat[a]=clamp(s.stat[a]+k[2][a],0,20);save();UI.student(i);}

// ---------- 比赛（数值模拟：每一分都是真的打出来的，见 rally.js） ----------
const canPlayToday=()=>new URLSearchParams(location.search).has('debug')||G.matchDay!==G.week*7+G.day;
function matchActors(){const M=MATCH,s=M.s;return [s.actor?s.actor:{blk:s.blk},M.o.of?'of':{blk:M.o.blk}];}
const STYLE_OF={'横拍弧圈':'loop','直拍快攻':'drive','削球手':'loop','全面型':'mix'};
function stuPlayer(s){return {nm:s.name,serve:s.stat.发球,recv:s.stat.接发球,fh:s.stat.正手,bh:s.stat.反手,foot:s.stat.步法,style:STYLE_OF[s.path]||'mix',dist:0.65,wk:null,trait:s.trait};}
function oppPlayer(o){const P={nm:o.name,serve:o.r,recv:o.r,fh:o.r,bh:o.r,foot:o.r,style:o.sty,dist:o.sty==='chop'?1.8:0.65,wk:o.wk};
  const k={bh:'bh',foot:'foot',recv:'recv'}[o.wk];if(k)P[k]-=3;return P;}
function startMatch(si,oi){
  const s=G.students[si],o=OPPS[oi];
  S.sel=boxes.find(x=>x.id===1)||boxes[0];
  MATCH={on:true,s,o,si,games:[0,0],pts:[0,0],gno:1,log:[],mor:[clamp(35+s.stat.心态*3+(s.mood-60)*.2,15,90),50],streak:[0,0],
    cards:{timeout:1,weak:1,calm:1},state:'between',alerts:0,res:null,P:[stuPlayer(s),oppPlayer(o)],tac:['rally',o.tac],otac0:o.tac,
    weak:0,calm:[0,0],pt:null,anim:null,gap:0,tau:0,spd:0.65,first:0,note:'',sw:false};
  G.matchDay=G.week*7+G.day;
  mlog(`${s.name} 对 ${o.name}（${o.style}），三局两胜，每局 11 分。`);
  S.view='close';fit();matchRender();
}
function mlog(t){MATCH.log.unshift(t);MATCH.log=MATCH.log.slice(0,5);}
function serverNow(){const M=MATCH,a=M.pts[0],b=M.pts[1],t=a+b;
  if(a>=10&&b>=10)return (M.first+(t-20))%2;return (M.first+Math.floor(t/2))%2;}
function pointCtx(){const M=MATCH;return {P:M.P,server:serverNow(),tac:M.tac,mor:M.mor,calm:M.calm,pts:M.pts,weak:M.weak};}
function applyPoint(pt){
  const M=MATCH,s=M.s,win=pt.winner===0;
  M.pts[win?0:1]++;
  if(win){M.mor[0]=clamp(M.mor[0]+3,0,100);M.mor[1]=clamp(M.mor[1]-2,0,100);M.streak=[M.streak[0]+1,0];}
  else{const calm=M.calm[0]>0?0.5:1,k=(s.trait==='怕输'&&M.pts[1]>M.pts[0])?5:3;
    M.mor[0]=clamp(M.mor[0]-k*calm,0,100);M.mor[1]=clamp(M.mor[1]+3,0,100);M.streak=[0,M.streak[1]+1];
    if(M.streak[1]===3)M.mor[0]=clamp(M.mor[0]-6*calm,0,100);}
  M.weak=Math.max(0,M.weak-1);M.calm=M.calm.map(x=>Math.max(0,x-1));
  mlog(`${M.pts[0]}:${M.pts[1]}　${pt.len}拍　${pt.reason}`);
  const a=M.pts[0],b=M.pts[1];
  if((a>=11||b>=11)&&Math.abs(a-b)>=2){endGame();return;}
  // 对手落后太多会改打法
  if(!M.sw&&a-b>=4&&M.tac[1]!=='power'){M.sw=true;M.tac[1]='power';mlog(`${M.o.name}落后了，改成强攻！`);}
  if(!win&&M.streak[1]===3&&M.alerts<2&&M.cards.timeout>0){M.alerts++;M.state='alert';M.note='对手连得 3 分，他有点慌了。教练，要叫暂停吗？';}
}
function endGame(){
  const M=MATCH,w=M.pts[0]>M.pts[1]?0:1;M.games[w]++;
  mlog(`第 ${M.gno} 局结束 ${M.pts[0]}:${M.pts[1]}，${w?M.o.name:M.s.name}拿下`);
  if(M.games[w]>=2){finishMatch();return;}
  M.gno++;M.pts=[0,0];M.streak=[0,0];M.alerts=0;M.sw=false;M.tac[1]=M.otac0;M.first=1-M.first;
  M.mor[0]=clamp(M.mor[0]+8,0,100);M.mor[1]=clamp(M.mor[1]+5,0,100);
  M.state='between';M.note='';
}
function finishMatch(){
  const M=MATCH,s=M.s,win=M.games[0]>M.games[1];
  const xp=win?15:8,cx=win?22:12;
  addXp(s,xp);G.coach=G.coach||{xp:0,lv:1};G.coach.xp+=cx;
  while(G.coach.xp>=40*G.coach.lv){G.coach.xp-=40*G.coach.lv;G.coach.lv++;msg('教练升级了！Lv.'+G.coach.lv);}
  const g={心态:win?.5:.3,正手:.3,反手:.3,发球:win?.2:0};
  for(const k in g)s.stat[k]=clamp(s.stat[k]+g[k],0,20);
  s.mood=clamp(s.mood+(win?10:-8),0,100);s.bond=clamp(s.bond+2,0,100);
  G.rep=clamp(G.rep+(win?2:.5),0,100);if(win){addInc('奖励',M.o.prize);}
  G.played=(G.played||0)+1;
  M.res={win,xp,cx,prize:win?M.o.prize:0,rep:win?2:.5,mood:win?10:-8};
  M.state='over';M.note='';save();hud();
}
function useMCard(k){
  const M=MATCH;if(!M||!M.cards[k]||M.state==='over')return;
  M.cards[k]=0;
  if(k==='timeout'){M.mor[0]=clamp(M.mor[0]+20,0,100);M.mor[1]=clamp(M.mor[1]-8,0,100);M.streak[1]=0;mlog('教练叫了暂停：先喘口气，别急。');if(M.state==='alert')M.state='paused';}
  if(k==='weak'){M.weak=8;mlog(`指令：专打他的「${M.o.weak}」（接下来 8 个球）`);}
  if(k==='calm'){M.calm[0]=8;M.mor[0]=clamp(M.mor[0]+8,0,100);mlog('指令：稳住别急，一板一板来。');}
  matchRender();
}
function setTac(k){const M=MATCH;if(M&&M.state==='between'){M.tac[0]=k;matchRender();}}
function matchGo(){const M=MATCH;if(M.state==='playing')M.state='paused';else{M.state='playing';M.note='';}matchRender();}
function matchSkip(){const M=MATCH;let n=0;
  if(M.pt){applyPoint(M.pt);M.pt=null;M.anim=null;}
  if(M.state==='between'||M.state==='alert'||M.state==='paused')M.state='playing';
  while(M.state==='playing'&&n++<400){applyPoint(simPoint(pointCtx()));}
  matchRender();}
function matchExit(){MATCH=null;S.view='hall';fit();nav();hud();}
function matchUpdate(dt){const M=MATCH;if(!M||!M.on||M.state!=='playing')return;
  if(!M.pt){if(M.gap>0){M.gap-=dt;return;}M.pt=simPoint(pointCtx());M.tau=0;}
  M.tau+=dt*M.spd;M.anim=animAt(M.pt,Math.min(M.tau,M.pt.total));
  if(M.tau>=M.pt.total){const pt=M.pt;M.pt=null;M.anim=null;M.gap=0.5;applyPoint(pt);matchRender();}}
function matchRender(){
  const M=MATCH,el=$('match');if(!el)return;
  if(!M||!M.on){el.style.display='none';return;}
  el.style.display='block';
  const mb=(v,c)=>`<span class="bar" style="width:120px"><i style="width:${v}%;background:${c}"></i></span>`;
  const btn=M.state==='playing'?'❚❚ 暂停':'▶ 继续';
  const C=[['timeout','叫暂停','士气 +20，打断对手连分'],['weak','专打弱点','接下来 8 球专打他的'+M.o.weak],['calm','稳住别急','失误少一些，士气 +8']];
  const r=M.res,srv=serverNow();
  const hint={bh:'他的反手慢，「变化落点」专打反手很有效',foot:'他步法跟不上，「变化落点」把他调动起来',recv:'他接发球差，「发球抢攻」多发短球'}[M.o.wk];
  const tacHTML=`<div id="mTac"><h3>第 ${M.gno} 局 · 布置战术</h3><small>对手：${M.o.name}（${M.o.style}）。${hint}。本局由${M.first?M.o.name:M.s.name}先发球。</small>
   <div class="tacs">${Object.entries(TACTICS).map(([k,t])=>`<button class="${M.tac[0]===k?'on':''}" onclick="setTac('${k}')"><b>${t.name}</b><small>${t.desc}</small></button>`).join('')}</div>
   <div class="row"><button class="go" onclick="matchGo()">开始第 ${M.gno} 局 ▶</button></div></div>`;
  el.innerHTML=`<div id="mScore"><small>${M.s.name} · ${sTitle(M.s)}</small>　<b>${M.games[0]}</b> 局 ｜ ${M.pts[0]} : ${M.pts[1]} ｜ <b>${M.games[1]}</b> 局　<small>${M.o.name}</small></div>
  <div id="mMor"><span>士气</span>${mb(M.mor[0],'#5f8a63')}<span style="margin:0 8px">第 ${M.gno} 局 · ${M.state==='between'?'':(srv?M.o.name:'我方')+'发球'}</span>${mb(M.mor[1],'#c98a4b')}</div>
  <div id="mLog"><b>文字播报</b>${M.log.map(l=>`<div>${l}</div>`).join('')}</div>
  ${M.state==='over'?'':`<div id="mCards"><div class="mnote2">${M.note||(M.state==='between'?`我方战术：${TACTICS[M.tac[0]].name}　对手战术：${TACTICS[M.tac[1]].name}`:`战术：${TACTICS[M.tac[0]].name}　vs　${TACTICS[M.tac[1]].name}`)}</div><div class="row" style="margin-top:4px">${C.map(c=>`<button class="mc" ${M.cards[c[0]]?'':'disabled'} title="${c[2]}" onclick="useMCard('${c[0]}')"><b>${c[1]}</b>${M.cards[c[0]]?'':'<small>已用过</small>'}</button>`).join('')}</div>
  <div class="row">${M.state==='between'?'':`<button class="go" onclick="matchGo()">${btn}</button>`}<button onclick="matchSkip()">跳到结果</button></div></div>`}
  ${M.state==='between'?tacHTML:''}
  ${r?`<div id="mOver"><h3>${r.win?'赢了！':'输了，没关系'}　${M.games[0]}:${M.games[1]}</h3>
   <div class="ln"><span>${M.s.name}经验</span><em>+${r.xp}（${sTitle(M.s)}）</em></div><div class="ln"><span>教练经验</span><em>+${r.cx}（Lv.${G.coach.lv}）</em></div>
   <div class="ln"><span>属性</span><em>心态、正手、反手${r.win?'、发球':''} 小幅提升</em></div><div class="ln"><span>心情</span><em>${r.mood>0?'+':''}${r.mood}</em></div><div class="ln"><span>人气</span><em>+${r.rep}</em></div>${r.prize?`<div class="ln"><span>奖金</span><em>${money(r.prize)}</em></div>`:''}
   <div class="row"><button class="go" onclick="matchExit()">◀ 返回球馆</button></div></div>`:''}`;
}

// ---------- 练习赛入口（赛程里） ----------
UI.matchSetup=function(si){
  si=si??G.students.findIndex(s=>s.joined);
  modal('练习赛：选择出战学员和对手',`<p class="hint">教练只在场边下指令，球由学员自己打。${canPlayToday()?'':'今天已经打过一场，明天再来。'}</p>
  <h4>出战</h4><div class="row">${G.students.map((s,i)=>s.joined?`<button class="${i===si?'on':''}" onclick="UI.matchSetup(${i})">${s.name}（实力 ${matchRating(s).toFixed(1)}）</button>`:'').join('')}</div>
  <h4>对手</h4>${OPPS.map((o,j)=>`<div class="ln"><span><b>${o.name}</b> · ${o.style} · 实力 ${o.r}<br><small>${o.desc}　奖金 ${money(o.prize)}</small></span><em><button ${canPlayToday()?'':'disabled'} onclick="startMatch(${si},${j})">开打</button></em></div>`).join('')}`);
};

// ---------- 开局问答 ----------
const QUIZ=[
 {q:'你觉得乒乓球最重要的是什么？',a:[['稳，不失误',()=>G.students.forEach(s=>s.stat.心态+=1),'全员 心态 +1'],['转，有旋转',()=>G.students.forEach(s=>{s.stat.发球+=1;s.stat.接发球+=1;}),'全员 发球、接发球 +1'],['快，抢先上手',()=>{G.flags.net=true;},'送一个集球网（解锁多球训练）']]},
 {q:'接手球馆，第一件事做什么？',a:[['先把坏的球台修了',()=>{G.tables[3]='ok';},'3 号台修好了'],['先去和街坊打招呼',()=>{for(const k in G.love)G.love[k]=Math.min(5,G.love[k]+1);},'三位街坊好感 +1'],['先攒点钱',()=>{G.money+=500;},'手上多 ¥500']]},
 {q:'你想当哪一种教练？',a:[['严格型',()=>G.students.forEach(s=>s.stat.勤奋+=1),'全员 勤奋 +1'],['温和型',()=>G.students.forEach(s=>{s.bond+=8;s.mood=Math.min(100,s.mood+10);}),'全员 关系 +8，心情 +10'],['陪练型',()=>{G.love.old=Math.min(5,G.love.old+1);},'老球友好感 +1']]}
];
UI.quiz=function(i){
  if(i>=QUIZ.length){G.quizDone=true;save();layout();hud();nav();closeUI();toast('问答结束，球馆开张！');return;}
  const Q=QUIZ[i];
  modal(`执教风格问答（${i+1}/${QUIZ.length}）`,`<p class="say">${Q.q}</p><div class="row" style="flex-direction:column">${Q.a.map((a,j)=>`<button onclick="QUIZ[${i}].a[${j}][1]();UI.quiz(${i+1});toast('${a[2]}')">${a[0]}<small>　${a[2]}</small></button>`).join('')}</div>`,true);
};

// ---------- 目标面板 ----------
let GOAL_MIN=false;
function goalHTML(){
  const cur=(G.week-1)*7+G.day,left=24-cur,n=[1,2,3,4,5,6].filter(usable).length;
  const L=[['人气到 ★3',stars()>=3,`现在 ★${stars()}`],['三张台都能用',[1,2,3].every(usable),`现在 ${n} 张`],['有学员升到 Lv.2',G.students.some(s=>s.lv>=1),''],['打过一场练习赛',(G.played||0)>0,'']];
  return `<div onclick="GOAL_MIN=!GOAL_MIN;goal()"><b>主要目标：参加市赛少儿组</b> ${GOAL_MIN?'▸':'▾'}</div>${GOAL_MIN?'':`<small>${left>=0?`距报名截止还有 ${left} 天（第4周周四）`:'已过报名截止'}</small>${L.map(l=>`<div>${l[1]?'✔':'○'} ${l[0]}<small> ${l[1]?'':l[2]}</small></div>`).join('')}`}`;
}
function goal(){const el=$('goal');if(el)el.innerHTML=goalHTML();}
goal();
