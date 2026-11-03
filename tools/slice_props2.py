# 按轮廓切道具，并按真实尺寸缩放（米），生成 _close(72px/米) 和 _hall(28px/米) 两个版本
import sys, json
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
src, out = sys.argv[1], sys.argv[2]
im=np.array(Image.open(src).convert('RGB')).astype(int); R,G,B=im[...,0],im[...,1],im[...,2]
mag=(R>200)&(B>200)&(G<90)
fg=ndi.binary_opening(~mag,iterations=1)
lab,n=ndi.label(ndi.binary_dilation(fg,iterations=9))
objs=ndi.find_objects(lab)
c=[(sl,i+1) for i,sl in enumerate(objs) if ((lab[sl]==i+1)&fg[sl]).sum()>1500]
H=im.shape[0]
row=lambda sl:0 if (sl[0].start+sl[0].stop)/2<H*0.33 else 1 if (sl[0].start+sl[0].stop)/2<H*0.66 else 2
c.sort(key=lambda t:(row(t[0]),t[0][1].start))
# 名字, 按什么定尺寸('w'宽/'h'高), 米
spec=[('teatable','w',1.4),('bamboochair','h',0.95),('woodstool','h',0.45),('redstool','h',0.46),('water','h',1.45),('gearrack','w',2.2),('door_open','h',2.3),('door_closed','h',2.3),('bench2','w',2.6)]
assert len(c)==len(spec),len(c)
man={}
for (nm,mode,m),(sl,i) in zip(spec,c):
    msk=(lab[sl]==i)&fg[sl]; l2,k=ndi.label(msk); sz=ndi.sum(msk,l2,range(1,k+1))
    keep=ndi.binary_fill_holes(np.isin(l2,[j+1 for j,s in enumerate(sz) if s>200]))&~mag[sl]
    rgb=im[sl].copy(); edge=keep&~ndi.binary_erosion(keep,iterations=2)
    sp=np.clip(np.minimum(rgb[...,0],rgb[...,2])-rgb[...,1],0,255)
    for ch in (0,2): rgb[...,ch]=np.where(edge,rgb[...,ch]-sp*0.6,rgb[...,ch])
    ys,xs=np.where(keep); y0,y1,x0,x1=ys.min(),ys.max()+1,xs.min(),xs.max()+1
    rgb=np.clip(rgb[y0:y1,x0:x1],0,255); a=keep[y0:y1,x0:x1]
    full=Image.fromarray(np.dstack([rgb*a[...,None],a*255]).astype(np.uint8),'RGBA')
    man[nm]={}
    for tag,px in (('close',72),('hall',28)):
        s=(m*px)/(full.width if mode=='w' else full.height)
        W,Hh=max(1,round(full.width*s)),max(1,round(full.height*s))
        arr=np.array(full.resize((W,Hh),Image.BOX)).astype(float); al=arr[...,3]/255
        col=np.where(al[...,None]>0,arr[...,:3]/np.maximum(al[...,None],1e-6),0)
        q=Image.fromarray(np.clip(col,0,255).astype(np.uint8)).quantize(40,method=Image.Quantize.MEDIANCUT).convert('RGB')
        qa=np.array(q).astype(int);pink=(qa[...,0]-qa[...,1]>70)&(qa[...,2]-qa[...,1]>50)&(qa[...,2]>120)
        o=np.dstack([np.array(q),((al>0.45)&~pink)*255]).astype(np.uint8)
        Image.fromarray(o,'RGBA').save(f'{out}/{nm}_{tag}.png'); man[nm][tag]=f'assets/props/{nm}_{tag}.png'
print(json.dumps(man))
