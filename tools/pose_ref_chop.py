import math
from PIL import Image, ImageDraw, ImageFont
F='/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'
fT=ImageFont.truetype(F,26,index=2); fS=ImageFont.truetype(F,19,index=2); fXS=ImageFont.truetype(F,16,index=2)
S=230; CW=300; GY=500; W=CW*7+40; H=740
img=Image.new('RGB',(W,H),'white'); d=ImageDraw.Draw(img)
NEAR=(60,120,220); FAR=(235,140,40); BODY=(30,30,30); GRAY=(130,130,130)
def add(a,b): return (a[0]+b[0],a[1]+b[1])
def ik(hip,ank,L1=0.44,L2=0.43):
    dx,dy=ank[0]-hip[0],ank[1]-hip[1]; D=min(math.hypot(dx,dy),L1+L2-1e-4)
    a=(L1*L1-L2*L2+D*D)/(2*D); hh=math.sqrt(max(0,L1*L1-a*a))
    mx,my=hip[0]+a*dx/D,hip[1]+a*dy/D
    k1=(mx+hh*dy/D,my-hh*dx/D); k2=(mx-hh*dy/D,my+hh*dx/D)
    return k1 if k1[0]>k2[0] else k2
def build(p):
    hip=p['hip']; L=math.radians(p['lean'])
    neck=add(hip,(0.52*math.sin(L),0.52*math.cos(L))); sh=add(neck,(0,-0.04))
    head=add(neck,(0.13*math.sin(L)+0.05,0.13*math.cos(L)+0.02))
    q=dict(hip=hip,neck=neck,sh=sh,head=head)
    for side in ('l','r'):
        ank=(p[side+'ank'],0.05); q[side+'leg']=(ik(hip,ank),ank)
        e=add(sh,p[side+'el']); w=add(e,p[side+'wr']); q[side+'arm']=(e,w)
    q['rk']=add(q['rarm'][1],p['rk']); return q
def person(i,title,p,notes,path=None):
    cx=20+CW*i+CW*0.55
    P=lambda f,h:(cx-f*S,GY-h*S)
    q=build(p)
    def seg(a,b,c,w): d.line([P(*a),P(*b)],fill=c,width=w)
    def dot(a,c,r=6): x,y=P(*a); d.ellipse([x-r,y-r,x+r,y+r],fill=c)
    def leg(k,c):
        kn,an=q[k]; seg(q['hip'],kn,c,9); seg(kn,an,c,9); seg(an,(an[0]+0.14,an[1]-0.04),c,9); dot(kn,c,5)
    def arm(k,c): e,w=q[k]; seg(q['sh'],e,c,8); seg(e,w,c,8); dot(e,c,6)
    def racket(side):
        col=(205,45,40) if p['face']=='red' else (25,25,25)
        w=q['rarm'][1]; c=q['rk']; seg(w,c,(150,105,60),6)
        ang=math.atan2(-(c[1]-w[1]),-(c[0]-w[0])); x,y=P(*c); rx,ry=26,15
        pts=[(x+rx*math.cos(t)*math.cos(ang)-ry*math.sin(t)*math.sin(ang),y+rx*math.cos(t)*math.sin(ang)+ry*math.sin(t)*math.cos(ang)) for t in [k*math.pi/18 for k in range(36)]]
        d.polygon(pts,fill=col,outline=NEAR if side=='near' else FAR,width=3)
    if p.get('behind'): arm('rarm',FAR); racket('far')
    leg('rleg',FAR)
    if p['side']=='far' and not p.get('behind'): arm('rarm',FAR); racket('far')
    seg(q['hip'],q['neck'],BODY,12)
    x,y=P(*q['head']); r=0.11*S; d.ellipse([x-r,y-r,x+r,y+r],fill='white',outline=BODY,width=5)
    nx,ny=P(q['head'][0]+0.11,q['head'][1]-0.01); d.polygon([(nx,ny-6),(nx-12,ny),(nx,ny+6)],fill=BODY)
    leg('lleg',NEAR); arm('larm',NEAR)
    if p['side']=='near': arm('rarm',FAR); racket('near')
    if path:
        pts=[P(*a) for a in path]
        d.line(pts,fill=GRAY,width=3,joint='curve')
        a,b=pts[-2],pts[-1]; an=math.atan2(b[1]-a[1],b[0]-a[0])
        d.polygon([b,(b[0]-16*math.cos(an-0.45),b[1]-16*math.sin(an-0.45)),(b[0]-16*math.cos(an+0.45),b[1]-16*math.sin(an+0.45))],fill=GRAY)
    wx,wy=P(p['wt'],0); d.polygon([(wx,wy+8),(wx-10,wy+24),(wx+10,wy+24)],fill=(200,40,40))
    x0=20+CW*i+10; d.text((x0,40),title,font=fT,fill=BODY)
    for k,n in enumerate(notes): d.text((x0,GY+40+k*26),n,font=fXS,fill=(60,60,60))
    return q
FH=dict(lank=0.36,rank=-0.44); BH=dict(lank=-0.44,rank=0.36)
F={
1:dict(hip=(-0.04,0.77),lean=22,lank=0.08,rank=-0.04,lel=(0.10,-0.25),lwr=(0.18,0.04),rel=(0.13,-0.24),rwr=(0.20,0.10),rk=(0.13,0.06),face='red',side='far',wt=0.02),
2:dict(hip=(-0.12,0.82),lean=8,**FH,lel=(0.12,-0.20),lwr=(0.17,0.0),rel=(-0.06,-0.18),rwr=(-0.02,0.28),rk=(-0.04,0.17),face='red',side='far',wt=-0.32),
3:dict(hip=(0.0,0.72),lean=16,**FH,lel=(0.10,-0.22),lwr=(0.12,-0.05),rel=(0.08,-0.20),rwr=(0.20,-0.02),rk=(0.13,-0.02),face='red',side='far',wt=0.0),
4:dict(hip=(0.06,0.64),lean=30,**FH,lel=(-0.06,-0.20),lwr=(-0.08,0.04),rel=(0.06,-0.27),rwr=(0.0,-0.25),rk=(-0.02,-0.11),face='red',side='far',wt=0.28),
5:dict(hip=(-0.10,0.80),lean=10,**BH,lel=(0.06,-0.24),lwr=(0.14,-0.04),rel=(0.14,-0.18),rwr=(-0.04,0.26),rk=(-0.05,0.10),face='black',side='near',wt=-0.34),
6:dict(hip=(0.0,0.68),lean=14,**BH,lel=(0.06,-0.24),lwr=(0.12,-0.06),rel=(0.12,-0.24),rwr=(0.20,-0.06),rk=(0.12,-0.03),face='black',side='near',wt=0.0),
7:dict(hip=(0.08,0.60),lean=20,**BH,lel=(-0.08,-0.18),lwr=(-0.10,0.04),rel=(0.10,-0.26),rwr=(0.06,-0.26),rk=(0.0,-0.11),face='black',side='far',behind=True,wt=0.30),
}
Q={k:build(v) for k,v in F.items()}
def mid(a,b,t=0.5,bulge=0.06): return (a[0]+(b[0]-a[0])*t+bulge,a[1]+(b[1]-a[1])*t)
notes={
1:('① 削球准备',['双脚平行、比肩略宽','双膝深屈，重心低','上身微前倾','拍在身前胸口高度','离台约1.5～2米']),
2:('② 正手削·引拍',['左脚(蓝)在前','前臂竖起，拍立在头侧','手肘朝下，拍面后仰','重心在右脚(后脚)','拍在身体外侧(远侧)']),
3:('③ 正手削·击球',['从头部右侧往左膝削','屈膝下沉、上身立直','拍经过身前腰部','重心右脚→左脚']),
4:('④ 正手削·随挥',['拍削到左膝内侧(右边)','膝盖高度，被左腿挡住一点','屈膝、上身稍前倾','重心落在左脚(前脚)','随后还原到身体中间①']),
5:('⑤ 反手削·引拍',['右脚(橙)在前','手肘在胸前、朝下','前臂竖起，拍引到','左耳高度(头侧)','重心在左脚(后脚)']),
6:('⑥ 反手削·击球',['从左耳往右膝方向削','边削边屈膝下压','拍经过身前腹部','重心左脚→右脚','拍在身体前面(近侧)']),
7:('⑦ 反手削·随挥',['拍削到右膝(外侧)','屈膝、重心往下压','拍被前腿挡住一部分','重心落在右脚(前脚)','还原时重心回升一点①']),
}
for k in range(1,8):
    path=None
    if k==3: a,b=Q[2]['rk'],Q[4]['rk']; path=[a,mid(a,Q[3]['rk'],0.5,0.08),Q[3]['rk'],b]
    if k==6: a,b=Q[5]['rk'],Q[7]['rk']; path=[a,mid(a,Q[6]['rk'],0.5,0.08),Q[6]['rk'],b]
    person(k-1,notes[k][0],F[k],notes[k][1],path)
d.line([(20,GY+8),(W-20,GY+8)],fill=(150,150,150),width=3)
d.text((20,8),'削球姿势参考（老球友 · 右手削球手）',font=fS,fill=(40,40,40))
d.text((20,H-46),'侧视，人物面朝左（← 球台方向），右手持横拍。橙色 = 右手右脚（持拍侧，离镜头远）；蓝色 = 左手左脚（离镜头近）。红三角 = 重心所在脚。灰箭头 = 挥拍路线。正手削用红色面，反手削用黑色面。',font=fXS,fill=(40,40,40))
img.save('/home/claude/pose/chop_pose_ref.png')
