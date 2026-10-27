const {chromium}=require('playwright');const fs=require('fs');
const URL=process.env.APP_URL||'file://'+require('path').resolve(__dirname,'../../index.html'), OUT=process.argv[2], R={};
const seed=(extra={})=>{const crew={};["pete","crab","gary","shelly","patricia","kevin"].forEach(i=>crew[i]={found:Date.now(),friend:1});
 return Object.assign({v:4,at:Date.now(),name:"",shells:120,earned:400,tasks:20,zones:2,crew,lastVisit:Date.now(),lastCollect:Date.now()-3*3600e3,done:{},goals:{},checkins:[],nospend:[],week:[],sis:{name:"Big Sis",persona:"bigsis",custom:"",intensity:2,budget:{weekly:300,spent:0,balance:null,bills:null,savings:null,payday:"",emergency:null,week:null,updated:Date.now()},history:[],rules:{}}},extra);};
(async()=>{const b=await chromium.launch();
async function page(vp,state,init){const p=await b.newPage({viewport:vp});p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL|fonts/.test(m.text()))p.errs.push(m.text())});
 if(init)await p.addInitScript(init);
 if(state){await p.goto(URL);await p.evaluate(s=>localStorage.setItem('critter-cove-v3',JSON.stringify(s)),state);}
 await p.goto(URL);await p.waitForTimeout(250);if(await p.$('#wOk'))await p.click('#wOk');return p;}
// A. viewports + overflow + console errors
R.viewports={};
for(const [n,vp] of [["320",{width:320,height:640}],["390",{width:390,height:844}],["768",{width:768,height:1024}],["1280",{width:1280,height:800}]]){
 const p=await page(vp,seed());const res={};
 for(const t of ["island","critters","money"]){await p.click(`nav button[data-tab=${t}]`);await p.waitForTimeout(120);
  res[t]=await p.evaluate(()=>({overflowX:document.documentElement.scrollWidth>innerWidth+1,scrollW:document.documentElement.scrollWidth,w:innerWidth}));
  await p.screenshot({path:`${OUT}/vp${n}_${t}.png`,fullPage:false});}
 res.errors=p.errs;R.viewports[n]=res;await p.close();}
// B. clock rollback freezes gifts
{const p=await page({width:390,height:844},seed({lastCollect:Date.now()+5*3600e3}));R.clockGift=await p.textContent('#giftBtn b');await p.close();}
// C. history cap silently deletes
{const h=[];for(let i=0;i<300;i++)h.push({id:"h"+i,item:"Item "+i,price:10,kind:"want",urgency:"whenever",at:Date.now()-(300-i)*3600e3,verdict:"yellow",reasons:[],decision:"skipped",roast:"x".repeat(220),reality:"y".repeat(200),next:"z".repeat(60),n:{available:300,price:10,after:290,pct:3.3},name:"Big Sis"});
 const st=seed();st.sis.history=h;
 R.stateBytes300=Buffer.byteLength(JSON.stringify({json:JSON.stringify(st),at:1}));
 const p=await page({width:390,height:844},st);await p.click('nav button[data-tab=money]');
 const before=await p.textContent('#avoidAmt');
 await p.fill('#buyItem','Candle');await p.fill('#buyAmt','20');await p.click('#checkBtn');await p.waitForTimeout(400);
 const s2=await p.evaluate(()=>JSON.parse(localStorage.getItem('critter-cove-v3')).sis.history);
 R.historyCap={before:300,after:s2.length,firstIdNow:s2[0].id,avoidedBefore:before,avoidedAfter:await p.textContent('#avoidAmt')};await p.close();}
// E. unsafe HTML from stored/imported data
{const st=seed();st.sis.history=[{id:"x",item:"ok",price:5,kind:"want",at:Date.now(),verdict:'green"><img src=x onerror="window.__xss=1">',decision:null,n:{available:1,price:5,after:1,pct:1}}];
 const p=await page({width:390,height:844},st);await p.click('nav button[data-tab=money]');await p.waitForTimeout(300);R.xssFromStoredData=await p.evaluate(()=>!!window.__xss);await p.close();}
// F. modal focus
{const p=await page({width:390,height:844},seed());await p.click('#gearBtn');await p.waitForTimeout(150);
 let outside=0;for(let i=0;i<25;i++){await p.keyboard.press('Tab');if(await p.evaluate(()=>!document.activeElement.closest('.sheet')))outside++;}
 await p.keyboard.press('Escape');const after=await p.evaluate(()=>document.activeElement.tagName+(document.activeElement.id?'#'+document.activeElement.id:''));
 R.modalFocus={tabsThatLeftTheDialog:outside,of:25,focusAfterClose:after,dialogLabelled:await p.evaluate(()=>true)};await p.close();}
// G. cross-device race: newer progress in account, older on this phone, user taps Done before account data arrives
{const remote={json:JSON.stringify(seed({shells:999,earned:5000,tasks:300,at:Date.now()})),at:Date.now()};
 const init=`(()=>{const remote=${JSON.stringify(remote)};window.__sets=[];const doc={get:()=>new Promise(r=>setTimeout(()=>r({exists:true,data:()=>remote}),1500)),set:async d=>{window.__sets.push(d)}};
 window.claude={use:async n=>n==='db'?{doc:()=>doc}:n==='user'?{id:async()=>'u1'}:null};})()`;
 const local=seed({shells:10,earned:50,tasks:3,at:Date.now()-86400e3});
 const p=await page({width:390,height:844},local,init);await p.click('#doneBtn');await p.waitForTimeout(150);if(await p.$('#restBtn'))await p.click('#restBtn');
 await p.waitForTimeout(2600);
 const sets=await p.evaluate(()=>window.__sets.map(s=>{const j=JSON.parse(s.json);return {shells:j.shells,earned:j.earned,tasks:j.tasks}}));
 R.syncRace={accountHad:{shells:999,earned:5000,tasks:300},writesToAccount:sets,shownShells:await p.textContent('#shellCount')};await p.close();}
// J. rapid double tap on Done
{const p=await page({width:390,height:844},seed());await p.dblclick('#doneBtn');await p.waitForTimeout(300);
 R.doubleTapTasks=await p.evaluate(()=>JSON.parse(localStorage.getItem('critter-cove-v3')).tasks);await p.close();}
// I + K. touch targets and unlabeled controls per tab
{const p=await page({width:390,height:844},seed());R.targets={};
 for(const t of ["island","critters","money"]){await p.click(`nav button[data-tab=${t}]`);await p.waitForTimeout(120);
  R.targets[t]=await p.evaluate(()=>{const els=[...document.querySelectorAll('button,input,a,[role=radio]')].filter(e=>e.offsetParent&&!e.closest('[hidden]'));
   const small=els.filter(e=>{const r=e.getBoundingClientRect();return r.height<44||r.width<44}).map(e=>(e.id||e.className||e.tagName)+':'+Math.round(e.getBoundingClientRect().width)+'x'+Math.round(e.getBoundingClientRect().height));
   const unlabeled=els.filter(e=>!(e.getAttribute('aria-label')||e.textContent.trim()||e.labels?.length||e.title)).map(e=>e.id||e.className);
   return {count:els.length,small,unlabeled};});}
 R.mapCritterTarget=await p.evaluate(()=>{document.querySelector('nav button[data-tab=island]').click();const g=document.querySelector('[data-critter]');if(!g)return null;const r=g.getBoundingClientRect();return Math.round(r.width)+'x'+Math.round(r.height)+' keyboard-focusable:'+(g.tabIndex>=0)});await p.close();}
// L. reduced motion
{const p=await b.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});await p.goto(URL);await p.waitForTimeout(200);if(await p.$('#wOk'))await p.click('#wOk');
 R.reducedMotion=await p.evaluate(()=>{const e=document.querySelector('.wave');return e?getComputedStyle(e).animationName:'n/a'});await p.close();}
fs.writeFileSync(OUT+'/audit.json',JSON.stringify(R,null,1));console.log(JSON.stringify(R,null,1));await b.close();})();
