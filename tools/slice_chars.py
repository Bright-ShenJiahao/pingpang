import sys, json, base64
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
src,out=sys.argv[1],sys.argv[2]
im=np.array(Image.open(src).convert('RGB')).astype(int)
R,G,B=im[...,0],im[...,1],im[...,2]
mag=(R>150)&(B>150)&(G<120)&(np.abs(R-B)<100)
fg=ndi.binary_opening(~mag,iterations=1)
lab,n=ndi.label(ndi.binary_dilation(fg,iterations=7))
objs=ndi.find_objects(lab)
c=[(sl,i+1) for i,sl in enumerate(objs) if ((lab[sl]==i+1)&fg[sl]).sum()>3000]
c.sort(key=lambda t:(0 if (t[0][0].start+t[0][0].stop)/2<270 else 1 if (t[0][0].start+t[0][0].stop)/2<560 else 2, t[0][1].start))
print(len(c),[ (s[0].start,s[1].start) for s,_ in c])
names=['kid_r','kid_f1','kid_f2','kid_f3','kid_b1','kid_b2','kid_b3','of_r','of_f1','of_f2','of_f3','of_b1','of_b2','of_b3','grandpa2','hero2']
assert len(c)==16
items={}
for nm,(sl,i) in zip(names,c):
    m=(lab[sl]==i)&fg[sl]; l2,k=ndi.label(m); sz=ndi.sum(m,l2,range(1,k+1))
    keep=np.isin(l2,[j+1 for j,s in enumerate(sz) if s>150])
    rgb=im[sl].copy(); edge=keep&~ndi.binary_erosion(keep,iterations=2)
    sp=np.clip(np.minimum(rgb[...,0],rgb[...,2])-rgb[...,1],0,255)
    for ch in (0,2): rgb[...,ch]=np.where(edge,rgb[...,ch]-sp*0.6,rgb[...,ch])
    ys,xs=np.where(keep); y0,y1,x0,x1=ys.min(),ys.max()+1,xs.min(),xs.max()+1
    items[nm]=(np.clip(rgb[y0:y1,x0:x1],0,255),keep[y0:y1,x0:x1])
REF=items['hero2'][1].shape[0]
meta={}
for nm,(rgb,a) in items.items():
    h,w=a.shape; fb=a[int(h*0.93):]; fx=np.where(fb)[1].mean()/w
    full=Image.fromarray(np.dstack([rgb*a[...,None],a*255]).astype(np.uint8),'RGBA')
    meta[nm]={'ax':float(fx),'src_h':int(h)}
    for tag,target in (('close',122),('hall',48)):
        s=target/REF; W,H=max(1,round(w*s)),max(1,round(h*s))
        arr=np.array(full.resize((W,H),Image.BOX)).astype(float); al=arr[...,3]/255
        col=np.where(al[...,None]>0,arr[...,:3]/np.maximum(al[...,None],1e-6),0)
        q=Image.fromarray(np.clip(col,0,255).astype(np.uint8)).quantize(40 if tag=='close' else 24,method=Image.Quantize.MEDIANCUT).convert('RGB')
        o=np.dstack([np.array(q),(al>0.5)*255]).astype(np.uint8)
        bad=(o[...,0]>170)&(o[...,2]>140)&(o[...,1]<110); o[bad,3]=0
        Image.fromarray(o,'RGBA').save(f'{out}/{nm}_{tag}.png')
js={}
for nm in meta:
    for tag in ('close','hall'):
        js[f'{nm}_{tag}']={'src':'data:image/png;base64,'+base64.b64encode(open(f'{out}/{nm}_{tag}.png','rb').read()).decode(),'ax':meta[nm]['ax']}
open(f'{out}/sprites2.js','w').write('const SPR2='+json.dumps(js)+';')
print(json.dumps({k:(round(v['ax'],2),v['src_h']) for k,v in meta.items()}))
