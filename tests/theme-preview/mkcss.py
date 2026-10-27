import json
T=json.load(open('themes.json'))
def vars_(t): return "".join(f"--{k}:{v};" for k,v in t.items() if k not in ("start","legend","focus","togoff","field","moss-dk")) + "".join(f"--{k}:{t[k]};" for k in ("start","legend","focus","togoff","field","moss-dk"))
# fixes shared by both themes (from the accessibility audit)
SHARED = """
:focus-visible,.field input:focus{ outline-color:var(--focus)!important; }
.island [data-critter]:focus-visible{ outline:3px solid var(--focus); }
.tog{ background:var(--togoff); } .tog[aria-checked="true"]{ background:var(--moss-dk); }
.tog::after{ display:grid; place-items:center; font:700 14px/1 system-ui; color:var(--moss-dk); }
.tog[aria-checked="true"]::after{ content:"✓"; }
.field input,.field textarea,.addline input,.field select,select{ border-color:var(--field)!important; }
.btn.tstart{ background:var(--start); }
.rar.legendary{ color:var(--legend); }
.task{ border-color:var(--moss-dk); }
.label{ font-size:13px; } .pill,.goaltext,.field .help{ font-size:14px; } nav.tabs button{ font-size:14px; }
"""
A_EXTRA = """
.card,.task,.gift,.nbanner{ box-shadow:0 1px 2px rgba(70,55,30,.06),0 8px 20px -12px rgba(70,55,30,.22); }
.island{ box-shadow:0 8px 20px -14px rgba(40,70,60,.35); }
"""
A_EXTRA_DARK = """.card,.task,.gift,.nbanner,.island{ box-shadow:none; }"""
B_EXTRA = """
.card,.gift,.nbanner{ box-shadow:0 2px 0 rgba(120,80,30,.07),0 10px 24px -14px rgba(120,80,30,.28); border-color:transparent; }
.task{ border-width:3px; background:linear-gradient(180deg, color-mix(in srgb, var(--sea) 18%, var(--surface)) 0, var(--surface) 120px); box-shadow:0 12px 28px -16px rgba(20,90,100,.45); }
.btn.main{ box-shadow:0 4px 0 var(--moss-dk); }
.btn.shell{ box-shadow:0 4px 0 #C9921C; }
.btn.tstart{ box-shadow:0 3px 0 var(--sea-dk); }
.btn.coral{ box-shadow:0 4px 0 #C8573A; }
.btn.main:active,.btn.shell:active,.btn.tstart:active,.btn.coral:active{ transform:translateY(3px); box-shadow:0 1px 0 var(--moss-dk); }
.shells{ background:var(--shell); border-color:transparent; color:var(--on-fill); box-shadow:0 3px 0 #C9921C; }
.island{ border:3px solid var(--sea-dk); }
.island [data-critter], .grid svg, .sis-ava svg{ filter:saturate(1.18); }
.progress i{ background:linear-gradient(90deg, var(--moss), var(--sea)); }
.ladder .seg.on{ background:var(--shell); }
nav.tabs button[aria-current="page"] svg{ background:var(--sea); }
"""
B_EXTRA_DARK = """.card,.gift,.nbanner,.task{ box-shadow:none; border-color:var(--line); } .task{ border-color:var(--moss-dk); background:linear-gradient(180deg, color-mix(in srgb, var(--sea) 40%, var(--surface)) 0, var(--surface) 120px); } .btn.shell,.shells{ box-shadow:0 3px 0 #A97A12; }"""
FONTS = """@font-face{font-family:Fredoka;src:url("FONTDIR/Fredoka.ttf");font-weight:300 700;}
@font-face{font-family:"Atkinson Hyperlegible";src:url("FONTDIR/AtkinsonHyperlegible-Regular.ttf");font-weight:400;}
@font-face{font-family:"Atkinson Hyperlegible";src:url("FONTDIR/AtkinsonHyperlegible-Bold.ttf");font-weight:700;}
"""
def css(name, extra, extra_dark):
    L,D=T[name+"-light"],T[name+"-dark"]
    return (f":root:root:root{{{vars_(L)}}}\n@media (prefers-color-scheme: dark){{:root:root:root{{{vars_(D)}color-scheme:dark}}}}\n"
            + SHARED + extra + f"\n@media (prefers-color-scheme: dark){{{extra_dark}}}\n")
out={"A":css("A",A_EXTRA,A_EXTRA_DARK),"B":css("B",B_EXTRA,B_EXTRA_DARK),"current":"","fonts":FONTS}
json.dump(out,open('themes-css.json','w'),indent=1)
open('cozy.css','w').write(out["A"]); open('playful.css','w').write(out["B"])
print(len(out["A"]),len(out["B"]))
