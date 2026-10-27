import json,sys
def lum(h):
    h=h.lstrip('#'); r,g,b=[int(h[i:i+2],16)/255 for i in (0,2,4)]
    f=lambda c: c/12.92 if c<=0.03928 else ((c+0.055)/1.055)**2.4
    return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b)
def cr(a,b):
    la,lb=lum(a),lum(b); return (max(la,lb)+0.05)/(min(la,lb)+0.05)
# (label, fg, bg, kind) kind: text 4.5 / large 3 / ui 3
PAIRS=[("Body text on page","ink","bg","text"),("Body text on card","ink","surface","text"),("Body text on sunk field","ink","sunk","text"),
("Hint text on page","muted","bg","text"),("Hint text on card","muted","surface","text"),("Hint text on sunk","muted","sunk","text"),
("Main button label (Done/Start)","on-fill","moss","text"),("Gold button label","on-fill","shell","text"),("Coral button label","on-fill","coral","text"),("Timer-start button label","on-fill","sea","text"),
("Grey button label","ink","sunk","text"),
("Focus ring vs card","focus","surface","ui"),("Focus ring vs page","focus","bg","ui"),
("Toggle OFF track vs card","togoff","surface","ui"),("Toggle ON track vs card","moss","surface","ui"),
("Input box edge vs card","field","surface","ui"),
("Task-card outline vs card","moss","surface","ui"),
("Over-budget text","bad","surface","text"),("Under-budget text","good","surface","text"),("Rare label","rare","surface","text"),("Legendary label","legend","surface","text"),
("Nav active pill icon","on-fill","shell","ui"),("Nav inactive label","muted","surface","text")]
def audit(t):
    out=[]
    for lab,f,b,k in PAIRS:
        need=4.5 if k=="text" else 3.0
        v=cr(t[f],t[b]); out.append((lab,t[f],t[b],round(v,2),need,v>=need))
    return out
if __name__=="__main__":
    T=json.load(open(sys.argv[1]))
    for name,t in T.items():
        print("==",name)
        for r in audit(t):
            print(("PASS" if r[5] else "FAIL"),f"{r[3]:5}",">=",r[4],r[0],r[1],"on",r[2])
