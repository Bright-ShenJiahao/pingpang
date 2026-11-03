import sys, json, base64, io
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
bgp, pp, out = sys.argv[1], sys.argv[2], sys.argv[3]
def b64(img, fmt='PNG'):
    b=io.BytesIO(); img.save(b,fmt); return 'data:image/'+fmt.lower()+';base64,'+base64.b64encode(b.getvalue()).decode()
# --- background: map to hall scale 960 x 310
bg=Image.open(bgp).convert('RGB')
bgh=bg.resize((960,310),Image.LANCZOS).quantize(96,method=Image.Quantize.MEDIANCUT).convert('RGB')
bgh.save(f'{out}/bg_hall.png')
# --- props
im=np.array(Image.open(pp).convert('RGB')).astype(int); R,G,B=im[...,0],im[...,1],im[...,2]
mag=(R>150)&(B>150)&(G<120)&(np.abs(R-B)<100)
fg=ndi.binary_opening(~mag,iterations=1)
lab,n=ndi.label(ndi.binary_dilation(fg,iterations=9))
objs=ndi.find_objects(lab)
c=[(sl,i+1) for i,sl in enumerate(objs) if ((lab[sl]==i+1)&fg[sl]).sum()>400]
H=im.shape[0]
def row(sl):
    cy=(sl[0].start+sl[0].stop)/2
    return 0 if cy<H*0.33 else 1 if cy<H*0.64 else 2
c.sort(key=lambda t:(row(t[0]),t[0][1].start))
names=['junk','covered','green','blue','bar_old_f','bar_old_s','bar_new_f','bar_new_s','lamp_off','lamp_on','counter','fridge','bench','net','dehum','basket','boxes']
print(len(c),[(row(s),s[1].start) for s,_ in c]); assert len(c)==17
K={'hall':28/96/(im.shape[1]/1920),'close':72/96/(im.shape[1]/1920)}
js={'BG':b64(bgh)}
prev=[]
for nm,(sl,i) in zip(names,c):
    m=(lab[sl]==i)&fg[sl]; l2,k=ndi.label(m); sz=ndi.sum(m,l2,range(1,k+1))
    keep=np.isin(l2,[j+1 for j,s in enumerate(sz) if s>60])
    rgb=im[sl].copy(); edge=keep&~ndi.binary_erosion(keep,iterations=2)
    sp=np.clip(np.minimum(rgb[...,0],rgb[...,2])-rgb[...,1],0,255)
    for ch in (0,2): rgb[...,ch]=np.where(edge,rgb[...,ch]-sp*0.6,rgb[...,ch])
    ys,xs=np.where(keep); y0,y1,x0,x1=ys.min(),ys.max()+1,xs.min(),xs.max()+1
    rgb=np.clip(rgb[y0:y1,x0:x1],0,255); a=keep[y0:y1,x0:x1]
    full=Image.fromarray(np.dstack([rgb*a[...,None],a*255]).astype(np.uint8),'RGBA')
    js[nm]={}
    for tag,s in K.items():
        W,Hh=max(1,round(full.width*s)),max(1,round(full.height*s))
        arr=np.array(full.resize((W,Hh),Image.BOX)).astype(float); al=arr[...,3]/255
        col=np.where(al[...,None]>0,arr[...,:3]/np.maximum(al[...,None],1e-6),0)
        q=Image.fromarray(np.clip(col,0,255).astype(np.uint8)).quantize(32,method=Image.Quantize.MEDIANCUT).convert('RGB')
        o=np.dstack([np.array(q),(al>0.45)*255]).astype(np.uint8)
        bad=(o[...,0]>170)&(o[...,2]>140)&(o[...,1]<110); o[bad,3]=0
        img=Image.fromarray(o,'RGBA'); js[nm][tag]=b64(img)
        if tag=='close': prev.append(img)
open(f'{out}/props.js','w').write('const PROPS='+json.dumps(js)+';')
W=sum(p.width+10 for p in prev); sh=Image.new('RGBA',(W,max(p.height for p in prev)+10),(70,60,50,255)); x=5
for p in prev: sh.alpha_composite(p,(x,5)); x+=p.width+10
sh.save('/tmp/props_prev.png'); print('ok')
