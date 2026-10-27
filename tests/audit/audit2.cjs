const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const URL=process.env.APP_URL||'file://'+require('path').resolve(__dirname,'../../index.html');
const st={v:4,at:Date.now(),shells:100,earned:100,tasks:5,zones:1,crew:{pete:{found:1,friend:1}},lastVisit:Date.now(),lastCollect:Date.now()-5*3600e3,done:{},goals:{},checkins:[],nospend:[],week:[]};
const p=await b.newPage({viewport:{width:390,height:844}});await p.goto(URL);await p.evaluate(s=>localStorage.setItem('critter-cove-v3',JSON.stringify(s)),st);await p.goto(URL);await p.waitForTimeout(200);
const sh=async()=>p.evaluate(()=>JSON.parse(localStorage.getItem('critter-cove-v3')).shells);
const R={};let s0=await sh();
await p.dblclick('#giftBtn');await p.waitForTimeout(200);R.giftDouble={before:s0,after:await sh()};
await p.click('nav button[data-tab=money]');s0=await sh();await p.click('#ciBtn');await p.fill('#ciAmt','40');await p.dblclick('#ciSave');await p.waitForTimeout(300);
R.checkinDouble={before:s0,after:await sh(),expectedGain:20};
await p.keyboard.press('Escape');s0=await sh();await p.dblclick('#nsBtn');await p.waitForTimeout(200);R.nospendDouble={before:s0,after:await sh(),expectedGain:10};
// timer interrupted: start timer, close, is there any way back?
await p.click('nav button[data-tab=island]');await p.click('#timerBtn');await p.waitForTimeout(300);await p.keyboard.press('Escape');await p.waitForTimeout(200);
R.timerAfterClose=await p.evaluate(()=>document.body.innerText.includes('Resume')?'resume offered':'timer gone, no resume');
// sheet labelling
await p.click('#gearBtn');R.dialogHasName=await p.evaluate(()=>{const d=document.querySelector('[role=dialog]');return !!(d.getAttribute('aria-label')||d.getAttribute('aria-labelledby'))});
console.log(JSON.stringify(R,null,1));await b.close();})();
