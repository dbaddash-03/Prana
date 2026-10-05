(()=>{'use strict';
/* ============ utils ============ */
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-3);
const pad=n=>String(n).padStart(2,'0');
const dkey=(d=new Date())=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const fromKey=k=>{const [y,m,d]=k.split('-').map(Number);return new Date(y,m-1,d)};
const addDays=(k,n)=>{const d=fromKey(k);d.setDate(d.getDate()+n);return dkey(d)};
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const num=(v,d=0)=>{const n=parseFloat(v);return Number.isFinite(n)?n:d};
const n0=v=>Math.round(v).toLocaleString('en-IN');
const n1=v=>(Math.round(v*10)/10).toLocaleString('en-IN');
const fmtDate=(k,o={day:'numeric',month:'short',year:'numeric'})=>fromKey(k).toLocaleDateString('en-IN',o);
const toMin=t=>{const [h,m]=t.split(':').map(Number);return h*60+m};
const fmtTime=t=>{const [h,m]=t.split(':').map(Number);return `${h%12||12}:${pad(m)} ${h>=12?'pm':'am'}`};
const nowMin=()=>{const d=new Date();return d.getHours()*60+d.getMinutes()};
const fmtSize=b=>b>1048576?(b/1048576).toFixed(1)+' MB':Math.max(1,Math.round(b/1024))+' KB';
const fmtQ=q=>{const w=Math.floor(q+1e-6),f=Math.round((q-w)*4)/4;const fr={0:'',.25:'¼',.5:'½',.75:'¾',1:''}[f];const W=f===1?w+1:w;return (W?W:'')+(fr||'')||'0'};
const sum=(a,f)=>a.reduce((s,x)=>s+f(x),0);
const rng=seed=>{let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}};

/* ============ state ============ */
const KEY='prana.v1',memStore={};
const store={get(){try{return localStorage.getItem(KEY)}catch(e){return memStore[KEY]||null}},set(v){try{localStorage.setItem(KEY,v)}catch(e){memStore[KEY]=v}}};
const DEFAULT=()=>({v:1,profile:{name:'',age:30,sex:'female',height:165,weight:65,activity:'light',goal:'maintain',diet:'vegetarian',conditions:[],allergies:'',onboarded:false},meds:[],medLog:{},meals:{},water:{},weights:[],labs:[],docs:[],yoga:{},plan:null,settings:{theme:'auto',notify:false,yogaMin:20}});
let S=(()=>{const d=DEFAULT();try{const raw=store.get();if(raw){const o=JSON.parse(raw);return Object.assign(d,o,{profile:Object.assign(d.profile,o.profile||{}),settings:Object.assign(d.settings,o.settings||{})})}}catch(e){}return d})();
const save=()=>store.set(JSON.stringify(S));
const has=c=>S.profile.conditions.includes(c);

/* files live in IndexedDB so large reports never touch localStorage */
const idb={p:null,mem:new Map(),
 open(){if(this.p)return this.p;this.p=new Promise(res=>{try{const r=indexedDB.open('prana-files',1);r.onupgradeneeded=()=>r.result.createObjectStore('f');r.onsuccess=()=>res(r.result);r.onerror=()=>res(null)}catch(e){res(null)}});return this.p},
 async put(id,blob){const db=await this.open();if(!db){this.mem.set(id,blob);return}return new Promise(res=>{try{const tx=db.transaction('f','readwrite');tx.objectStore('f').put(blob,id);tx.oncomplete=()=>res();tx.onerror=()=>{this.mem.set(id,blob);res()}}catch(e){this.mem.set(id,blob);res()}})},
 async get(id){const db=await this.open();if(!db)return this.mem.get(id)||null;return new Promise(res=>{try{const r=db.transaction('f').objectStore('f').get(id);r.onsuccess=()=>res(r.result||this.mem.get(id)||null);r.onerror=()=>res(this.mem.get(id)||null)}catch(e){res(this.mem.get(id)||null)}})},
 async del(id){this.mem.delete(id);const db=await this.open();if(!db)return;return new Promise(res=>{try{const tx=db.transaction('f','readwrite');tx.objectStore('f').delete(id);tx.oncomplete=()=>res();tx.onerror=()=>res()}catch(e){res()}})}
};

/* ============ icons ============ */
const P={
home:'<path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
pill:'<g transform="rotate(-40 12 12)"><rect x="2.5" y="8.5" width="19" height="7" rx="3.5"/><path d="M12 8.5v7"/></g>',
bowl:'<path d="M3.5 12h17a8.5 8.5 0 0 1-17 0z"/><path d="M8 8.5c0-1.5 1-1.5 1-3M12 8.5c0-1.5 1-1.5 1-3M16 8.5c0-1.5 1-1.5 1-3"/>',
calendar:'<rect x="3" y="4.5" width="18" height="16" rx="3"/><path d="M8 2.5v4M16 2.5v4M3 10h18"/>',
lotus:'<path d="M12 20c-4 0-8-3-9-8 3 0 6 1.5 7.5 4C11 14 11.5 12 12 10c.5 2 1 4 1.5 6 1.5-2.5 4.500-4 7.500-4-1 5-5 8-9 8z"/><path d="M12 10c-1.500-2-1.500-4.500 0-6.500 1.500 2 1.500 4.500 0 6.500z"/>',
folder:'<path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
plus:'<path d="M12 5v14M5 12h14"/>',check:'<path d="M5 12.5l4.500 4.500L19 7.500"/>',x:'<path d="M6 6l12 12M18 6 6 18"/>',
bell:'<path d="M6 16V11a6 6 0 1 1 12 0v5l1.500 2h-15z"/><path d="M10 21h4"/>',
sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.500 1.500M17.500 17.500 19 19M5 19l1.500-1.500M17.500 6.500 19 5"/>',
moon:'<path d="M20 14.500A8 8 0 0 1 9.500 4a8 8 0 1 0 10.500 10.500z"/>',
trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
edit:'<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.500 6.500l4 4"/>',
download:'<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',upload:'<path d="M12 16V5M7 9l5-5 5 5M5 20h14"/>',
search:'<circle cx="11" cy="11" r="6.500"/><path d="M16 16l4.500 4.500"/>',
drop:'<path d="M12 3s6 6.500 6 11a6 6 0 0 1-12 0c0-4.500 6-11 6-11z"/>',
flame:'<path d="M12 3c1 3.500 5 5.500 5 10a5 5 0 0 1-10 0c0-2 1-3.500 2-4.500 0 2 1 2.500 1.500 2.500C10 8 11 5 12 3z"/>',
left:'<path d="M15 5l-7 7 7 7"/>',right:'<path d="M9 5l7 7-7 7"/>',
play:'<path d="M7 4.500v15l12-7.500z"/>',pause:'<path d="M8 5v14M16 5v14"/>',skip:'<path d="M5 5v14l10-7zM19 5v14"/>',prev:'<path d="M19 5v14L9 12zM5 5v14"/>',
user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.500 3.500-7 8-7s8 2.500 8 7"/>',
spark:'<path d="M12 3l2 5.500L19.500 10 14 12l-2 5.500L10 12 4.500 10 10 8.500z"/><path d="M19 16l.8 2.200L22 19l-2.200.8L19 22l-.8-2.200L16 19l2.200-.8z"/>',
file:'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
image:'<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="1.800"/><path d="M4 18l5-5 4 4 3-3 4 4"/>',
heart:'<path d="M12 20s-8-4.800-8-11a4.500 4.500 0 0 1 8-2.800A4.500 4.500 0 0 1 20 9c0 6.200-8 11-8 11z"/>',
scale:'<rect x="3" y="4" width="18" height="16" rx="4"/><path d="M8 9a5 5 0 0 1 8 0M12 9l2-2"/>',
clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
alert:'<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17.500v.01"/>',
leaf:'<path d="M5 19C5 10 10 5 20 4c0 10-5 15-13 15z"/><path d="M5 19c3-5 6-8 10-10"/>',
sliders:'<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
share:'<path d="M12 15V4M8 8l4-4 4 4M5 13v6h14v-6"/>',
refresh:'<path d="M20 11a8 8 0 0 0-14-4L4 9M4 4v5h5M4 13a8 8 0 0 0 14 4l2-2M20 20v-5h-5"/>',
cart:'<path d="M3 4h2l2.500 11h10l2-8H7"/><circle cx="9" cy="19" r="1.500"/><circle cx="17" cy="19" r="1.500"/>',
chart:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
shield:'<path d="M12 3l8 3v6c0 5-3.500 8-8 9-4.500-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>'
};
const ic=(n,s=20)=>`<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n]||''}</svg>`;

/* ============ reference data ============ */
const COND={diabetes:'Type 2 diabetes / prediabetes',hypertension:'High blood pressure',cholesterol:'High cholesterol',thyroid:'Thyroid condition',pcos:'PCOS / PCOD',anemia:'Anemia',kidney:'Kidney concerns',backpain:'Back pain',joint:'Joint or knee pain',stress:'Stress or poor sleep',asthma:'Asthma',pregnancy:'Pregnant or nursing'};
const ACT={sedentary:['Mostly sitting',1.2],light:['Light: walks or 1–3 workouts a week',1.375],moderate:['Moderate: 3–5 workouts a week',1.55],active:['Very active: daily training',1.725]};
const GOALS={lose:'Lose weight',maintain:'Stay fit and healthy',gain:'Build muscle'};
const DIETS={vegetarian:'Vegetarian',vegan:'Vegan',eggetarian:'Eggetarian',nonveg:'Non-vegetarian'};
const RANK={vegan:0,vegetarian:1,eggetarian:2,nonveg:3};
const SLOTS={breakfast:'Breakfast',lunch:'Lunch',snack:'Snacks',dinner:'Dinner'};
const DOC_CATS=['Lab report','Prescription','Scan or imaging','Doctor’s notes','Discharge summary','Insurance or bill','Vaccination','Other'];
const CAT_STYLE={'Lab report':['tulsi-s','tulsi','chart'],'Prescription':['hib-s','hib','pill'],'Scan or imaging':['sky-s','sky','image'],'Doctor’s notes':['iris-s','iris','edit'],'Discharge summary':['turmeric-s','warn','file'],'Insurance or bill':['paper2','ink2','shield'],'Vaccination':['tulsi-s','tulsi','shield'],'Other':['paper2','ink2','file']};

/* name, unit, kcal, protein, carbs, fat, class(0 vegan,1 dairy,2 egg,3 non-veg), slots(b l s d), flags(g=high glycemic/sugar, f=fried/rich, s=salty, t=treat) */
const FOODS=[
['Poha','1 plate',270,6,45,8,0,'bs',''],['Moong dal chilla','2 pieces',230,14,26,7,0,'bs',''],['Besan chilla','2 pieces',240,12,28,9,0,'bs',''],
['Idli','3 pieces',175,6,36,1,0,'b',''],['Sambar','1 bowl',120,6,18,3,0,'bld',''],['Plain dosa','1 piece',170,4,28,4,0,'b',''],['Masala dosa','1 piece',330,7,45,13,0,'b','f'],
['Veg upma','1 bowl',250,6,38,8,0,'b',''],['Vegetable oats','1 bowl',210,8,33,5,0,'bs',''],['Oats porridge with milk','1 bowl',260,11,36,7,1,'b',''],
['Paneer paratha','1 piece',300,11,33,14,1,'b','f'],['Aloo paratha','1 piece',290,6,40,12,1,'b','fg'],['Boiled eggs','2 eggs',156,13,1,10,2,'bs',''],
['Egg bhurji','2 eggs',190,13,3,14,2,'bd',''],['Masala omelette','2 eggs',190,13,3,14,2,'b',''],['Egg white omelette','4 whites',90,15,1,0,2,'bd',''],
['Sprouts chaat','1 bowl',140,9,22,2,0,'bs',''],['Dhokla','4 pieces',160,6,25,4,1,'bs',''],['Thepla','2 pieces',220,6,28,9,1,'b',''],
['Hung curd','1 bowl',100,12,6,3,1,'bs',''],['Dahi (curd)','1 bowl',90,5,7,5,1,'bls',''],['Milk (toned)','1 glass',150,8,12,8,1,'bs',''],
['Whey protein','1 scoop',120,24,3,2,1,'s',''],['Protein shake with milk','1 glass',270,32,15,8,1,'s',''],['Sattu drink','1 glass',140,8,22,2,0,'bs',''],
['Roasted chana','30 g',110,6,18,2,0,'s',''],['Makhana (roasted)','1 cup',110,3,22,1,0,'s',''],['Almonds','10 nuts',70,3,3,6,0,'bs',''],
['Mixed nuts','30 g',180,5,6,16,0,'s',''],['Peanut butter','1 tbsp',95,4,3,8,0,'bs',''],['Banana','1 medium',105,1,27,0,0,'bs','g'],
['Apple','1 medium',95,0,25,0,0,'bs',''],['Papaya','1 bowl',60,1,15,0,0,'bs',''],['Guava','1 medium',68,3,14,1,0,'s',''],
['Roti','1 piece',100,3,18,2,0,'ld',''],['Multigrain roti','1 piece',110,4,18,3,0,'ld',''],['Steamed rice','1 cup',200,4,44,0,0,'ld','g'],
['Brown rice','1 cup',215,5,45,2,0,'ld',''],['Jeera rice','1 cup',240,4,44,5,0,'ld','g'],['Quinoa','1 cup',220,8,39,4,0,'ld',''],
['Dal tadka','1 bowl',180,9,25,5,0,'ld',''],['Moong dal','1 bowl',150,10,22,2,0,'ld',''],['Masoor dal','1 bowl',160,11,24,2,0,'ld',''],
['Rajma','1 bowl',230,12,35,4,0,'ld',''],['Chole','1 bowl',260,12,38,7,0,'ld',''],['Dal makhani','1 bowl',300,11,28,17,1,'ld','f'],
['Paneer bhurji','1 bowl',280,17,6,21,1,'ld','f'],['Palak paneer','1 bowl',270,14,9,20,1,'ld','f'],['Matar paneer','1 bowl',290,13,14,20,1,'ld','f'],
['Soya chunk curry','1 bowl',200,22,14,6,0,'ld',''],['Tofu stir-fry','1 bowl',190,17,8,11,0,'ld',''],['Mixed veg sabzi','1 bowl',120,3,14,6,0,'ld',''],
['Bhindi sabzi','1 bowl',110,2,10,7,0,'ld',''],['Lauki sabzi','1 bowl',80,2,10,3,0,'ld',''],['Palak sabzi','1 bowl',90,4,8,5,0,'ld',''],
['Kachumber salad','1 bowl',45,2,9,0,0,'lds',''],['Raita','1 bowl',80,4,8,3,1,'ld',''],['Chaas (buttermilk)','1 glass',40,2,4,1,1,'lbs',''],
['Khichdi','1 bowl',230,9,38,5,0,'ld',''],['Veg pulao','1 plate',320,7,54,8,0,'l','g'],['Grilled chicken breast','150 g',240,44,0,5,3,'ld',''],
['Chicken curry','1 bowl',260,28,6,14,3,'ld',''],['Tandoori chicken','2 pieces',260,30,4,14,3,'lds',''],['Egg curry','2 eggs',250,14,8,18,2,'ld',''],
['Fish curry','1 bowl',220,24,6,11,3,'ld',''],['Grilled fish','150 g',190,32,0,6,3,'ld',''],['Chicken soup','1 bowl',110,12,6,3,3,'ds',''],
['Vegetable soup','1 bowl',70,3,12,1,0,'ds',''],['Chicken biryani','1 plate',480,24,58,16,3,'l','gf'],['Butter chicken','1 bowl',380,26,12,26,3,'ld','f'],
['Samosa','1 piece',260,4,28,15,0,'s','fs'],['Pakora','4 pieces',240,6,22,14,0,'s','f'],['Veg sandwich','1 whole',250,8,36,8,1,'bs',''],
['Masala chai (with sugar)','1 cup',90,2,13,3,1,'bs','g'],['Chai (no sugar)','1 cup',50,2,4,3,1,'bs',''],['Gulab jamun','1 piece',150,2,22,6,1,'s','gt'],
['Sweet lassi','1 glass',220,7,34,6,1,'s','g'],['Boiled chickpea salad','1 bowl',220,11,32,5,0,'ls',''],['Paneer tikka','6 pieces',270,18,6,19,1,'sd',''],
['Pickle (achaar)','1 tbsp',40,0,2,3,0,'ld','s'],['Papad','1 piece',50,3,7,1,0,'ld','s']
].map(r=>({name:r[0],unit:r[1],kcal:r[2],p:r[3],c:r[4],f:r[5],cls:r[6],slots:r[7],fl:r[8]}));
const FMAP=Object.fromEntries(FOODS.map(f=>[f.name,f]));

/* curated Indian meal combinations: [food, servings] */
const COMBOS={
breakfast:[
 [['Moong dal chilla',1],['Hung curd',1]],[['Vegetable oats',1],['Almonds',1],['Papaya',1]],[['Poha',1],['Sprouts chaat',.5],['Chai (no sugar)',1]],
 [['Idli',1],['Sambar',1]],[['Besan chilla',1],['Chaas (buttermilk)',1]],[['Paneer paratha',1],['Dahi (curd)',1]],[['Oats porridge with milk',1],['Banana',1]],
 [['Dhokla',1],['Hung curd',.5],['Apple',1]],[['Boiled eggs',1],['Multigrain roti',1],['Papaya',1]],[['Egg bhurji',1],['Multigrain roti',1]],
 [['Masala omelette',1],['Roti',1],['Chai (no sugar)',1]],[['Egg white omelette',1],['Vegetable oats',.5],['Apple',1]],[['Thepla',1],['Dahi (curd)',1]],
 [['Plain dosa',2],['Sambar',1]],[['Veg upma',1],['Hung curd',1]],[['Sattu drink',1],['Roasted chana',1],['Apple',1]]],
snack1:[
 [['Apple',1],['Almonds',1]],[['Papaya',1],['Roasted chana',.5]],[['Chaas (buttermilk)',1],['Makhana (roasted)',.5]],[['Guava',1],['Almonds',1]],
 [['Sprouts chaat',1]],[['Hung curd',1],['Almonds',1]],[['Sattu drink',1]],[['Boiled eggs',1]],[['Protein shake with milk',.75]],[['Banana',1],['Peanut butter',1]]],
snack2:[
 [['Roasted chana',1],['Chai (no sugar)',1]],[['Makhana (roasted)',1],['Chai (no sugar)',1]],[['Sprouts chaat',1],['Chai (no sugar)',1]],[['Paneer tikka',1]],
 [['Dhokla',1],['Chaas (buttermilk)',1]],[['Boiled chickpea salad',1]],[['Mixed nuts',1],['Chai (no sugar)',1]],[['Vegetable soup',1],['Roasted chana',1]],
 [['Chicken soup',1],['Almonds',1]],[['Tandoori chicken',1]],[['Hung curd',1],['Apple',1]],[['Veg sandwich',1]]],
lunch:[
 [['Roti',2],['Dal tadka',1],['Mixed veg sabzi',1],['Kachumber salad',1],['Dahi (curd)',.5]],[['Brown rice',1],['Rajma',1],['Kachumber salad',1],['Raita',1]],
 [['Roti',2],['Palak paneer',1],['Moong dal',.5],['Kachumber salad',1]],[['Roti',2],['Chole',1],['Raita',1],['Kachumber salad',1]],
 [['Multigrain roti',2],['Soya chunk curry',1],['Lauki sabzi',1],['Kachumber salad',1]],[['Steamed rice',1],['Dal tadka',1],['Bhindi sabzi',1],['Raita',1]],
 [['Khichdi',1.5],['Raita',1],['Kachumber salad',1]],[['Quinoa',1],['Tofu stir-fry',1],['Moong dal',1]],[['Roti',2],['Chicken curry',1],['Kachumber salad',1],['Dal tadka',.5]],
 [['Brown rice',1],['Grilled fish',1],['Mixed veg sabzi',1],['Dal tadka',.5]],[['Roti',2],['Egg curry',1],['Palak sabzi',1],['Kachumber salad',1]],
 [['Multigrain roti',2],['Grilled chicken breast',1],['Mixed veg sabzi',1],['Dahi (curd)',1]],[['Roti',2],['Masoor dal',1],['Palak sabzi',1],['Kachumber salad',1]]],
dinner:[
 [['Roti',1],['Moong dal',1],['Lauki sabzi',1],['Kachumber salad',1]],[['Vegetable soup',1],['Paneer bhurji',.75],['Multigrain roti',1]],
 [['Khichdi',1],['Dahi (curd)',1],['Kachumber salad',1]],[['Multigrain roti',2],['Tofu stir-fry',1],['Palak sabzi',1]],
 [['Grilled fish',1],['Quinoa',.75],['Mixed veg sabzi',1]],[['Chicken soup',1],['Grilled chicken breast',1],['Roti',1],['Kachumber salad',1]],
 [['Roti',1],['Egg bhurji',1],['Bhindi sabzi',1]],[['Soya chunk curry',1],['Roti',1],['Kachumber salad',1]],[['Masoor dal',1],['Brown rice',.75],['Palak sabzi',1]],
 [['Fish curry',1],['Roti',1],['Kachumber salad',1]],[['Rajma',.75],['Roti',1],['Raita',1]],[['Tandoori chicken',1],['Multigrain roti',1],['Vegetable soup',1]],
 [['Roti',2],['Masoor dal',1],['Lauki sabzi',1]]]
};
const PLAN_SLOTS=[['breakfast','Breakfast','08:00',.25,.22],['snack1','Mid-morning','11:00',.1,.1],['lunch','Lunch','13:30',.3,.3],['snack2','Evening snack','17:00',.1,.12],['dinner','Dinner','20:00',.25,.26]];
const BOOSTERS=['Hung curd','Boiled eggs','Whey protein','Sprouts chaat','Roasted chana','Paneer tikka','Sattu drink'];

/* yoga & pranayama: key, devanagari, name, english, seconds, options */
const Y=(k,dev,n,en,secs,o)=>({k,dev,n,en,secs,sides:!!o.sd,type:o.ty||'asana',ph:o.ph,it:o.it,t:o.t.split(' '),g:(o.g||'').split(' ').filter(Boolean),av:(o.av||'').split(' ').filter(Boolean),care:(o.care||'').split(' ').filter(Boolean),b:o.b,h:o.h});
const POSES=[
Y('anulom','अनुलोम विलोम','Anulom Vilom','Alternate-nostril breathing',240,{ty:'breath',ph:1,it:1,t:'breath calm',g:'stress hypertension asthma',b:'Slow, even breathing that settles the mind and the heart rate.',h:'Sit tall. Close the right nostril, inhale through the left for 4 counts; close the left, exhale through the right for 4. Inhale right, exhale left. Keep it silent and effortless.'}),
Y('bhramari','भ्रामरी','Bhramari','Humming-bee breath',120,{ty:'breath',ph:1,it:1,t:'breath calm',g:'stress hypertension',b:'A soothing hum that eases tension and racing thoughts.',h:'Close your ears gently with your thumbs, eyes closed. Inhale through the nose, then exhale with a steady low hum. Repeat 6 to 8 times.'}),
Y('kapala','कपालभाति','Kapalabhati','Skull-shining breath',120,{ty:'breath',ph:1,it:3,t:'breath energy',g:'weightloss diabetes',av:'pregnancy hypertension asthma',care:'backpain',b:'Quick belly pumps that wake up the body and warm the core.',h:'Inhale normally, then exhale in short, sharp pulses by drawing the belly in. Do 20 pulses, rest, repeat. Stop if dizzy. Skip it with heart disease or a hernia.'}),
Y('dhyana','ध्यान','Dhyana','Seated meditation',300,{ty:'breath',ph:5.8,it:1,t:'calm breath restore',g:'stress hypertension',b:'Quiet attention that lowers stress and improves sleep.',h:'Sit comfortably, spine tall, hands on knees. Follow the natural breath. When the mind wanders, return gently to the breath.'}),
Y('marjari','मार्जरी आसन','Cat–Cow','Marjaryasana–Bitilasana',60,{ph:1.5,it:1,t:'back flex calm',g:'backpain pcos',care:'joint',b:'Warms up and mobilises the whole spine.',h:'On hands and knees, inhale to drop the belly and lift the chest; exhale to round the back and tuck the chin. Move slowly with the breath.'}),
Y('tada','ताड़ासन','Tadasana','Mountain pose',40,{ph:2,it:1,t:'posture calm balance',g:'backpain',b:'Builds tall, steady posture and body awareness.',h:'Stand with feet hip-width apart, weight even. Lengthen the spine, soften the shoulders, arms by your sides. Breathe slowly.'}),
Y('surya','सूर्य नमस्कार','Surya Namaskar','Sun salutation, slow pace',180,{ph:2,it:3,t:'flow strength energy flex',g:'diabetes pcos weightloss cholesterol muscle',av:'pregnancy',care:'hypertension backpain joint asthma',b:'A flowing sequence that raises the heart rate and moves every major joint.',h:'Link the 12 positions with your breath: arms up, fold forward, step back to plank, lower, cobra, downward dog, then step forward and rise. Do 3 slow rounds.'}),
Y('vriksha','वृक्षासन','Vrikshasana','Tree pose',60,{sd:1,ph:2,it:1,t:'balance calm',care:'joint',b:'Improves balance, focus and leg stability.',h:'Stand tall, place one foot on the inner calf or thigh (never on the knee), palms together at the chest. Fix your gaze on one point.'}),
Y('trikona','त्रिकोणासन','Trikonasana','Triangle pose',60,{sd:1,ph:2,it:2,t:'flex digest strength',g:'diabetes weightloss backpain',b:'Opens hips and hamstrings and tones the waist.',h:'Feet wide, front foot turned out. Reach forward, then tilt sideways, lower hand to the shin, other arm up. Keep the chest open.'}),
Y('veera','वीरभद्रासन II','Virabhadrasana II','Warrior II',60,{sd:1,ph:2,it:2,t:'strength balance',g:'weightloss muscle',care:'joint',b:'Builds leg strength and stamina.',h:'Wide stance, bend the front knee over the ankle, arms out at shoulder height, gaze over the front hand.'}),
Y('utkata','उत्कटासन','Utkatasana','Chair pose',45,{ph:2,it:3,t:'strength core',g:'weightloss muscle',care:'joint',b:'Fires up thighs, glutes and core.',h:'Feet together, bend the knees and sit back as if on a chair, arms reaching up. Keep the weight in the heels.'}),
Y('uttana','उत्तानासन','Uttanasana','Standing forward fold',45,{ph:2.5,it:2,t:'flex calm',g:'stress',care:'backpain hypertension',b:'Releases the back of the legs and quiets the mind.',h:'Hinge from the hips and fold forward with soft knees. Let the head hang heavy. Rise slowly.'}),
Y('plank','फलकासन','Phalakasana','Plank pose',45,{ph:3,it:3,t:'core strength',g:'weightloss muscle',av:'pregnancy',care:'joint',b:'Builds core, shoulder and arm strength.',h:'Hands under shoulders, body in one straight line from head to heels. Draw the belly in and breathe steadily.'}),
Y('nava','नावासन','Navasana','Boat pose',45,{ph:3,it:3,t:'core strength',g:'weightloss muscle',av:'pregnancy',care:'backpain',b:'Strengthens the abdominals and hip flexors.',h:'Sit, lean back slightly, lift the feet so shins are parallel to the floor, arms reach forward. Hold for 15 seconds, rest, repeat.'}),
Y('bhuja','भुजंगासन','Bhujangasana','Cobra pose',45,{ph:3,it:2,t:'back strength flex',g:'backpain stress',av:'pregnancy',care:'backpain',b:'Strengthens the back and opens the chest.',h:'Lie on your belly, hands under shoulders. Inhale and lift the chest with a long spine, elbows slightly bent. Look forward.'}),
Y('dhanu','धनुरासन','Dhanurasana','Bow pose',40,{ph:3,it:3,t:'back flex digest',g:'diabetes',av:'pregnancy hypertension',care:'backpain',b:'Stretches the front body and is traditionally practised for digestion.',h:'Lie on your belly, bend the knees, hold the ankles. Inhale and lift the chest and thighs, rocking gently on the belly.'}),
Y('ustra','उष्ट्रासन','Ustrasana','Camel pose',40,{ph:3,it:3,t:'flex back strength',g:'thyroid',av:'pregnancy hypertension',care:'backpain',b:'Opens the chest, shoulders and front of the thighs.',h:'Kneel upright, hands on the lower back. Press the hips forward and arch back, keeping the neck long. Come up with the breath.'}),
Y('setu','सेतु बन्धासन','Setu Bandhasana','Bridge pose',45,{ph:3.5,it:2,t:'back strength flex',g:'backpain thyroid pcos',av:'pregnancy',b:'Strengthens the glutes and spine, opens the chest.',h:'Lie on your back, feet flat near the hips. Press into the feet and lift the hips. Keep the knees in line and breathe.'}),
Y('matsya','मत्स्यासन','Matsyasana','Fish pose',40,{ph:3.5,it:2,t:'flex back',g:'thyroid asthma',av:'pregnancy',care:'hypertension backpain',b:'Opens the chest and throat and eases the upper back.',h:'Lie on your back, slide the hands under the hips, lift the chest and rest the crown lightly down. Keep the weight on the forearms.'}),
Y('mandu','मण्डूकासन','Mandukasana','Frog pose',45,{ph:4,it:2,t:'digest flex',g:'diabetes',av:'pregnancy',care:'joint',b:'Traditionally practised to support digestion and a healthy blood sugar routine.',h:'Sit on the heels, make loose fists and press them against the navel. Exhale, fold forward, and look ahead. Inhale to rise.'}),
Y('vajra','वज्रासन','Vajrasana','Thunderbolt pose',120,{ph:4,it:1,t:'digest calm',g:'diabetes digest',care:'joint',b:'The one pose that is comfortable right after meals; helps digestion.',h:'Kneel and sit back on your heels, spine tall, hands on thighs. Breathe slowly. Place a cushion under the seat if the knees complain.'}),
Y('pashchi','पश्चिमोत्तानासन','Paschimottanasana','Seated forward bend',60,{ph:4.5,it:2,t:'flex calm digest',g:'stress diabetes',av:'pregnancy',care:'backpain',b:'Lengthens the spine and hamstrings and calms the nervous system.',h:'Sit with legs straight, hinge forward from the hips and hold the shins or feet. Keep the spine long and breathe.'}),
Y('matsyen','अर्ध मत्स्येन्द्रासन','Ardha Matsyendrasana','Seated spinal twist',60,{sd:1,ph:4.5,it:2,t:'digest flex back',g:'diabetes pcos',av:'pregnancy',care:'backpain',b:'Wrings out the spine and stimulates digestion.',h:'Sit tall, cross one foot over the opposite knee, twist toward the bent knee, and hold the knee or foot. Lengthen on each inhale.'}),
Y('baddha','बद्ध कोणासन','Baddha Konasana','Butterfly pose',90,{ph:4.5,it:1,t:'flex calm',g:'pcos',care:'joint',b:'Opens the hips and the pelvic area.',h:'Sit with the soles of the feet together, knees falling out. Hold the feet and fold forward gently.'}),
Y('bala','बालासन','Balasana','Child’s pose',60,{ph:5,it:1,t:'calm back restore',g:'stress backpain',care:'joint pregnancy',b:'A resting pose that releases the back and soothes the mind.',h:'Kneel, sit back on the heels, fold forward and rest the forehead down, arms long or by your sides.'}),
Y('pavana','पवनमुक्तासन','Pawanmuktasana','Wind-relieving pose',60,{sd:1,ph:5,it:1,t:'digest back',g:'digest backpain',av:'pregnancy',b:'Eases gas and bloating and releases the lower back.',h:'Lie on your back, hug one knee to the chest, then the other. Breathe slowly and rock gently.'}),
Y('supta','सुप्त बद्ध कोणासन','Supta Baddha Konasana','Reclining bound angle',180,{ph:5.5,it:1,t:'restore calm',g:'pcos stress',av:'pregnancy',b:'Deeply restful; opens the hips and calms the breath.',h:'Lie on your back, soles of the feet together, knees falling out. Rest the hands on the belly and soften.'}),
Y('viparita','विपरीत करणी','Viparita Karani','Legs-up-the-wall',180,{ph:5.5,it:1,t:'restore calm',g:'stress hypertension',av:'pregnancy',b:'Relieves tired legs and quiets the nervous system.',h:'Lie on your back near a wall and rest your legs up against it. Arms relaxed. Skip it if you have glaucoma.'}),
Y('shava','शवासन','Shavasana','Final relaxation',240,{ph:6,it:1,t:'restore calm',g:'hypertension stress',care:'pregnancy',b:'Lets the body absorb the practice and the heart rate settle.',h:'Lie flat on your back, arms slightly away from the body, palms up. Close the eyes and release every muscle. If pregnant, lie on your left side.'})
];
const PMAP=Object.fromEntries(POSES.map(p=>[p.k,p]));
const THEMES=[
 ['Restore and reset','restore calm breath'],['Strength and stamina','strength core flow'],['Back and spine care','back flex calm'],
 ['Breath and balance','breath balance calm'],['Core and energy','core energy strength'],['Flow and flexibility','flow flex digest'],['Digest and unwind','digest flex restore']];

/* lab tests: bands are [upper bound (exclusive), label, level 0 ok / 1 watch / 2 act] */
const LABS=[
{k:'hba1c',n:'HbA1c',u:'%',dec:1,ref:'Below 5.7',r:()=>[[5.7,'Normal',0],[6.5,'Prediabetes range',1],[99,'Diabetes range',2]]},
{k:'fbs',n:'Fasting glucose',u:'mg/dL',ref:'70 to 99',r:()=>[[70,'Low',1],[100,'Normal',0],[126,'Prediabetes range',1],[999,'High',2]]},
{k:'tc',n:'Total cholesterol',u:'mg/dL',ref:'Below 200',r:()=>[[200,'Desirable',0],[240,'Borderline high',1],[999,'High',2]]},
{k:'ldl',n:'LDL cholesterol',u:'mg/dL',ref:'Below 100',r:()=>[[100,'Optimal',0],[130,'Near optimal',0],[160,'Borderline high',1],[999,'High',2]]},
{k:'hdl',n:'HDL cholesterol',u:'mg/dL',ref:'Above 40 (men), 50 (women)',r:sx=>sx==='male'?[[40,'Low',2],[999,'Good',0]]:[[50,'Low',2],[999,'Good',0]]},
{k:'tg',n:'Triglycerides',u:'mg/dL',ref:'Below 150',r:()=>[[150,'Normal',0],[200,'Borderline high',1],[9999,'High',2]]},
{k:'hb',n:'Hemoglobin',u:'g/dL',dec:1,ref:'13 to 17.5 (men), 12 to 15.5 (women)',r:sx=>sx==='male'?[[13,'Low',2],[17.6,'Normal',0],[99,'High',1]]:[[12,'Low',2],[15.6,'Normal',0],[99,'High',1]]},
{k:'vitd',n:'Vitamin D',u:'ng/mL',ref:'30 to 100',r:()=>[[20,'Deficient',2],[30,'Insufficient',1],[101,'Sufficient',0],[999,'High',1]]},
{k:'b12',n:'Vitamin B12',u:'pg/mL',ref:'Above 300',r:()=>[[200,'Low',2],[300,'Borderline',1],[99999,'Normal',0]]},
{k:'tsh',n:'TSH',u:'mIU/L',dec:2,ref:'0.4 to 4.5',r:()=>[[.4,'Low',1],[4.6,'Normal',0],[99,'High',2]]},
{k:'creat',n:'Creatinine',u:'mg/dL',dec:2,ref:'0.7 to 1.3 (men), 0.5 to 1.1 (women)',r:sx=>sx==='male'?[[.7,'Low',1],[1.31,'Normal',0],[99,'High',2]]:[[.5,'Low',1],[1.11,'Normal',0],[99,'High',2]]},
{k:'uric',n:'Uric acid',u:'mg/dL',dec:1,ref:'3.5 to 7.2 (men), 2.6 to 6 (women)',r:sx=>sx==='male'?[[3.5,'Low',1],[7.21,'Normal',0],[99,'High',2]]:[[2.6,'Low',1],[6.01,'Normal',0],[99,'High',2]]},
{k:'sys',n:'BP systolic',u:'mmHg',ref:'90 to 119',r:()=>[[90,'Low',1],[120,'Normal',0],[130,'Elevated',1],[999,'High',2]]},
{k:'dia',n:'BP diastolic',u:'mmHg',ref:'60 to 79',r:()=>[[60,'Low',1],[80,'Normal',0],[999,'High',2]]}
];
const LMAP=Object.fromEntries(LABS.map(l=>[l.k,l]));
const TIPS={
hba1c:'Choose low-GI carbs (dal, millets, oats, brown rice), pair carbs with protein and fibre, and walk 10 minutes after meals.',
fbs:'Keep dinner light and early, add fibre-rich foods, and walk after meals.',
tc:'Add oats, nuts, flaxseed and legumes; cut fried snacks and bakery items; limit ghee and butter.',
ldl:'Add oats, nuts, flaxseed, legumes and fish; cut fried snacks and excess ghee; stay active.',
tg:'Cut sugary drinks, sweets and refined flour; limit alcohol; add omega-3 foods like walnuts, flaxseed and fish.',
hdl:'Regular exercise, nuts, olive or mustard oil and quitting smoking can lift HDL.',
hb:'Pair iron-rich foods (spinach, rajma, chana, dates, jaggery) with vitamin C (lemon, amla, guava), and keep tea or coffee away from meals.',
vitd:'Get 15 to 20 minutes of midday sun on arms and legs, and add eggs, fortified milk or fatty fish. Ask your doctor about a supplement dose.',
b12:'Include milk, curd, paneer, eggs or fish. Vegetarians often need a supplement, so ask your doctor.',
tsh:'Take thyroid medicine at the same time each day as your doctor advises, and discuss this result with them.',
creat:'Hold off on protein supplements and discuss this result with your doctor before changing your protein intake.',
uric:'Drink more water; limit red meat, organ meats, alcohol and sugary drinks.',
sys:'Cut back on salt, pickles and papad; add curd, leafy greens and fruit; practise slow breathing and recheck at home.',
dia:'Cut back on salt, pickles and papad; add curd, leafy greens and fruit; practise slow breathing and recheck at home.'
};
/* ============ calculations ============ */
const latestWeight=()=>{const w=[...S.weights].sort((a,b)=>a.date<b.date?-1:1);return w.length?w[w.length-1].kg:num(S.profile.weight,65)};
function body(){
 const p=S.profile,h=num(p.height,165)/100,w=latestWeight(),age=num(p.age,30);
 const bmi=w/(h*h);
 const bmr=10*w+6.25*num(p.height,165)-5*age+(p.sex==='male'?5:p.sex==='female'?-161:-78);
 const mult=ACT[p.activity][1],tdee=bmr*mult;
 let kcal=tdee,adj=0;
 if(has('pregnancy')){adj=300}else if(p.goal==='lose'){adj=bmi>=25?-500:-400}else if(p.goal==='gain'){adj=300}
 kcal=tdee+adj;const floor=p.sex==='male'?1500:1200;if(kcal<floor){kcal=floor;adj=floor-tdee}
 kcal=Math.round(kcal/10)*10;
 const ideal=(p.sex==='male'?50:45.5)+0.9*(num(p.height,165)-152),pw=bmi>=30?ideal+.25*(w-ideal):w;
 let g=p.goal==='gain'?1.8:p.goal==='lose'?(p.activity==='sedentary'?1.2:1.4):({sedentary:1,light:1.1,moderate:1.2,active:1.4})[p.activity];
 if(age>=60)g=Math.max(g,1.2);if(has('pregnancy'))g=Math.max(g,1.1);if(has('kidney'))g=.8;
 let protein=Math.round(pw*g);protein=Math.min(protein,Math.round(kcal*.35/4));
 const fat=Math.round(kcal*(has('cholesterol')?.25:.28)/9);
 const carbs=Math.max(Math.round((kcal-protein*4-fat*9)/4),0);
 const water=has('kidney')?2000:Math.round(clamp(w*35,2000,3500)/250)*250;
 return {w,bmi,bmr,tdee,mult,adj,kcal,protein,fat,carbs,water,g,pw};
}
const bmiCat=b=>b<18.5?['Underweight','info']:b<23?['Healthy range','ok']:b<25?['Overweight','warn']:['Obese range','bad'];
const totals=date=>{let k=0,p=0,c=0,f=0;(S.meals[date]||[]).forEach(x=>{k+=x.kcal*x.q;p+=x.p*x.q;c+=x.c*x.q;f+=x.f*x.q});return{kcal:k,p,c,f,water:S.water[date]||0}};
const yogaMin=date=>sum(S.yoga[date]||[],s=>s.minutes);

/* ============ medicines ============ */
const DAYN=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MCOL=['#1E7B5C','#D2406A','#2F82D6','#E89A1F','#6A58C8','#0E9AA7'];
function medActive(m,date){if(m.paused)return false;if(m.start&&date<m.start)return false;if(m.end&&date>m.end)return false;return !m.days||m.days.length===0||m.days.includes(fromKey(date).getDay())}
function doses(date){const out=[];S.meds.forEach(m=>{if(medActive(m,date))m.times.forEach(t=>out.push({med:m,time:t,key:m.id+'@'+t}))});return out.sort((a,b)=>toMin(a.time)-toMin(b.time)||a.med.name.localeCompare(b.med.name))}
function doseState(d,date){const l=(S.medLog[date]||{})[d.key];if(l)return l.s;const today=dkey();if(date<today)return'missed';if(date>today)return'upcoming';const n=nowMin(),t=toMin(d.time);if(n>=t+120)return'missed';if(n>=t-15)return'due';return'upcoming'}
function setDose(date,d,s){
 const L=S.medLog[date]=S.medLog[date]||{};const prev=L[d.key]&&L[d.key].s;
 if(s==null)delete L[d.key];else L[d.key]={s,at:new Date().toISOString()};
 const m=d.med;if(m.stock!=null&&m.stock!==''){if(prev!=='taken'&&s==='taken')m.stock=Math.max(0,m.stock-(m.per||1));if(prev==='taken'&&s!=='taken')m.stock+=(m.per||1)}
 save()}
function adherence(days){let taken=0,total=0;const today=dkey();for(let i=0;i<days;i++){const date=addDays(today,-i);doses(date).forEach(d=>{const s=doseState(d,date);if(s==='upcoming'||s==='due')return;total++;if(s==='taken')taken++})}return{taken,total,pct:total?taken/total:null}}
function daysLeft(m){if(m.stock==null||m.stock===''||m.paused)return null;const perDay=m.times.length*(m.per||1)*((m.days&&m.days.length?m.days.length:7)/7);return perDay?Math.floor(m.stock/perDay):null}
const period=t=>{const h=+t.split(':')[0];return h<12?'Morning':h<16?'Afternoon':h<20?'Evening':'Night'};

/* ============ labs ============ */
const labsFor=k=>S.labs.filter(l=>l.k===k).sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:0);
const latestLab=k=>{const a=labsFor(k);return a[a.length-1]||null};
function labStatus(k,v){const def=LMAP[k],bands=def.r(S.profile.sex);const b=bands.find(x=>v<x[0])||bands[bands.length-1];return{label:b[1],lvl:b[2]}}
const labFmt=(k,v)=>{const d=LMAP[k].dec;return d?(+v).toFixed(d):String(v)};
function flaggedLabs(){return LABS.map(def=>{const l=latestLab(def.k);if(!l)return null;const s=labStatus(def.k,l.v);return s.lvl>0?{def,l,s}:null}).filter(Boolean).sort((a,b)=>b.s.lvl-a.s.lvl||(a.l.date<b.l.date?1:-1))}

/* ============ diet plan ============ */
function allergenRx(){const a=(S.profile.allergies||'').toLowerCase(),r=[];
 if(/peanut/.test(a))r.push('peanut');if(/\bnuts?\b|almond|cashew/.test(a))r.push('almond|mixed nuts|peanut');
 if(/milk|dairy|lactose/.test(a))r.push('milk|curd|dahi|paneer|raita|chaas|lassi|whey|paratha|makhani|thepla|dhokla|sandwich|butter chicken|porridge|protein shake|hung|chai');
 if(/egg/.test(a))r.push('egg|omelette|bhurji');if(/gluten|wheat/.test(a))r.push('roti|paratha|upma|thepla|sandwich|oats');
 if(/soy/.test(a))r.push('soya|tofu');if(/fish|seafood/.test(a))r.push('fish');
 return r.length?new RegExp(r.join('|'),'i'):null}
function foodOK(f,relax){
 if(f.cls>RANK[S.profile.diet])return false;const rx=allergenRx();if(rx&&rx.test(f.name))return false;
 if(!relax){if((has('diabetes')||has('pcos'))&&/[gt]/.test(f.fl))return false;if((has('hypertension')||has('kidney'))&&f.fl.includes('s'))return false;if(has('cholesterol')&&/[ft]/.test(f.fl))return false}
 return true}
const cinfo=c=>c.reduce((a,[n,q])=>{const f=FMAP[n];return{k:a.k+f.kcal*q,p:a.p+f.p*q,c:a.c+f.c*q,f:a.f+f.f*q}},{k:0,p:0,c:0,f:0});
const planSig=()=>{const t=body();return[t.kcal,t.protein,S.profile.diet,[...S.profile.conditions].sort().join(','),S.profile.allergies].join('|')};
function dayTotals(day){let k=0,p=0,c=0,f=0;day.slots.forEach(s=>s.items.forEach(i=>{const x=FMAP[i.n];if(!x)return;k+=x.kcal*i.q;p+=x.p*i.q;c+=x.c*i.q;f+=x.f*i.q}));return{k,p,c,f}}
function genPlan(seed){
 const t=body(),rnd=rng(seed),used=new Map(),days=[];
 ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].forEach(name=>{
  const slots=PLAN_SLOTS.map(([key,label,time,kp,pp])=>{
   const all=COMBOS[key].filter(c=>c.every(([n])=>FMAP[n]));
   let pool=all.filter(c=>c.every(([n])=>foodOK(FMAP[n])));
   if(!pool.length)pool=all.filter(c=>c.every(([n])=>foodOK(FMAP[n],true)));
   if(!pool.length)return{key,label,time,items:[]};
   const tk=t.kcal*kp,tp=t.protein*pp;let best=null;
   pool.forEach(c=>{const b=cinfo(c);[.75,1,1.25,1.5].forEach(m=>{
    let sc=Math.abs(b.k*m-tk)/tk+.7*Math.abs(b.p*m-tp)/Math.max(tp,12)+(used.get(c)||0)*.4+rnd()*.25+(m===1?0:.03);
    if((has('diabetes')||has('pcos'))&&b.k)sc+=Math.max(0,b.c*4/b.k-.55)*1.2;
    if(!best||sc<best.sc)best={c,m,sc}})});
   used.set(best.c,(used.get(best.c)||0)+1);
   return{key,label,time,items:best.c.map(([n,q])=>({n,q:Math.max(.25,Math.round(q*best.m*4)/4)}))}});
  const day={name,slots};let g=0;
  while(!has('kidney')&&g++<2){const dt=dayTotals(day);if(dt.p>=t.protein*.92)break;
   const sn=day.slots.find(s=>s.key==='snack2');
   const cand=BOOSTERS.map(n=>FMAP[n]).filter(f=>f&&foodOK(f)&&!day.slots.some(s=>s.items.some(i=>i.n===f.name))&&dt.k+f.kcal<=t.kcal*1.1).sort((a,b)=>b.p/b.kcal-a.p/a.kcal)[0];
   if(!cand||!sn)break;sn.items.push({n:cand.name,q:1,boost:true})}
  days.push(day)});
 return{seed,sig:planSig(),days}}
function ensurePlan(force){if(force||!S.plan||S.plan.sig!==planSig()){S.plan=genPlan(force?Math.floor(Math.random()*1e9):(S.plan?S.plan.seed:7));save()}return S.plan}
function proteinIdeas(gap,room){
 return FOODS.filter(f=>foodOK(f)&&f.p>=8&&f.kcal<=Math.max(room,160)+60&&!/Protein shake/.test(f.name)).sort((a,b)=>b.p/b.kcal-a.p/a.kcal).slice(0,3)}

/* ============ yoga routine ============ */
const weekIdx=()=>(new Date().getDay()+6)%7; /* Mon=0 */
function buildRoutine(minutes,theme,variant){
 const [tname,tags]=THEMES[theme],conds=S.profile.conditions,goal=S.profile.goal==='lose'?'weightloss':S.profile.goal==='gain'?'muscle':'';
 const allowed=POSES.filter(p=>!p.av.some(a=>conds.includes(a))),want=tags.split(' ');
 const rnd=rng(theme*977+(variant||0)*131+new Date().getDate()*7);
 const score=p=>p.t.filter(x=>want.includes(x)).length*2+p.g.filter(x=>conds.includes(x)||x===goal).length*1.5-p.care.filter(x=>conds.includes(x)).length*.6+rnd()*.9;
 const total=minutes*60,closer=PMAP.shava,reserve=Math.min(closer.secs,Math.round(total*.15));
 const scored=new Map(allowed.map(p=>[p,score(p)]));
 const breaths=allowed.filter(p=>p.type==='breath'&&p.ph===1).sort((a,b)=>scored.get(b)-scored.get(a));
 const opener=breaths[0]||null,openSecs=opener?Math.min(opener.secs,Math.round(total*.16)):0;
 const room=total-reserve-openSecs;
 let cand=allowed.filter(p=>p!==opener&&p.k!=='shava').sort((a,b)=>scored.get(b)-scored.get(a)),main=[],used=0,hard=0;
 for(const p of cand){if(used+p.secs>room)continue;if(p.it===3&&hard>=3)continue;main.push(p);used+=p.secs;if(p.it===3)hard++}
 main.sort((a,b)=>a.ph-b.ph);
 const f=main.length?Math.min(1.5,room/used):1;
 const steps=[];if(opener)steps.push({p:opener,secs:openSecs});
 main.forEach(p=>steps.push({p,secs:Math.max(20,Math.round(p.secs*f/5)*5)}));
 steps.push({p:closer,secs:reserve});
 return{theme:tname,minutes:Math.round(sum(steps,s=>s.secs)/60),steps}}
function expandSteps(steps){const out=[];steps.forEach(({p,secs})=>{if(p.sides){const h=Math.round(secs/2);out.push({p,secs:h,label:'Right side'},{p,secs:h,label:'Left side'})}else out.push({p,secs,label:''})});return out}
const gk=p=>p.t.some(x=>/strength|core|energy|flow/.test(x))&&p.type!=='breath'?'k1':p.t.some(x=>/flex|back|digest/.test(x))?'k2':'k3';

/* ============ score, streak, insights ============ */
function calPct(d,t){const r=d.kcal/t.kcal;return r<=1.1?Math.min(r,1):Math.max(0,1-(r-1.1)/.4)}
function dayParts(date){
 const t=body(),d=totals(date),ds=doses(date);
 const taken=ds.filter(x=>doseState(x,date)==='taken').length;
 return{t,d,ds,taken,pc:{protein:clamp(d.p/t.protein,0,1),cal:calPct(d,t),water:clamp(d.water/t.water,0,1),meds:ds.length?taken/ds.length:null,yoga:clamp(yogaMin(date)/15,0,1)}}}
function scoreFor(date){
 const {pc}=dayParts(date),w={protein:25,cal:15,water:15,meds:30,yoga:15};let s=0,tw=0;
 Object.keys(w).forEach(k=>{if(pc[k]==null)return;s+=w[k]*pc[k];tw+=w[k]});return Math.round(s/tw*100)}
const activeDay=date=>(S.meals[date]||[]).length>0||(S.water[date]||0)>0||yogaMin(date)>0||Object.keys(S.medLog[date]||{}).length>0;
function streak(){let n=0,d=dkey();if(!activeDay(d))d=addDays(d,-1);while(activeDay(d)&&n<400){n++;d=addDays(d,-1)}return n}
function insights(){
 const out=[],t=body(),date=dkey(),d=totals(date),hr=new Date().getHours(),ds=doses(date);
 const missed=ds.filter(x=>doseState(x,date)==='missed'),due=ds.filter(x=>doseState(x,date)==='due');
 if(due.length)out.push({tone:'warn',ic:'pill',t:`${due[0].med.name} is due now`,x:`${fmtTime(due[0].time)}, ${due[0].med.timing||'as directed'}. Tap Taken once you have had it.`,pr:1});
 if(missed.length)out.push({tone:'bad',ic:'alert',t:`${missed.length} dose${missed.length>1?'s':''} not logged today`,x:'Mark each one taken or skipped so your history stays accurate. Do not double up later without asking your doctor.',pr:2});
 S.meds.forEach(m=>{const dl=daysLeft(m);if(dl!=null&&dl<=5)out.push({tone:'warn',ic:'pill',t:`${m.name}: about ${dl} day${dl===1?'':'s'} of stock left`,x:'Plan a refill before you run out.',pr:2})});
 const gap=t.protein-d.p;
 if(hr>=12&&gap>t.protein*.25){const ideas=proteinIdeas(gap,t.kcal-d.kcal);out.push({tone:'info',ic:'flame',t:`${n0(gap)} g of protein still to go`,x:ideas.length?'Easy options: '+ideas.map(i=>`${i.name.toLowerCase()} (${i.p} g)`).join(', ')+'.':'Add a protein source to your next meal.',pr:3,go:'food'})}
 if(hr>=14&&d.water<t.water*.5)out.push({tone:'info',ic:'drop',t:'Hydration is behind',x:`You are at ${n0(d.water)} ml of ${n0(t.water)} ml. Keep a bottle at your desk and sip regularly.`,pr:3.5});
 if(d.kcal>t.kcal*1.1)out.push({tone:'warn',ic:'bowl',t:'You are above today’s calorie target',x:'Keep dinner light: soup, dal with salad, or sprouts. A 10-minute walk after eating helps too.',pr:3});
 flaggedLabs().slice(0,2).forEach(f=>out.push({tone:f.s.lvl===2?'bad':'warn',ic:'chart',t:`${f.def.n} is ${f.s.label.toLowerCase()} (${labFmt(f.def.k,f.l.v)} ${f.def.u})`,x:TIPS[f.def.k]+' Share this result with your doctor.',pr:2.6,go:'records'}));
 if(!yogaMin(date)&&hr>=5){const r=buildRoutine(S.settings.yogaMin||20,weekIdx(),0);out.push({tone:'ok',ic:'lotus',t:`Today’s practice: ${r.theme}, ${r.minutes} min`,x:has('stress')?'A calm session will help with stress and sleep.':'Chosen for your goal and health conditions.',pr:4,act:'yogaStart',go:'yoga'})}
 const w=[...S.weights].sort((a,b)=>a.date<b.date?-1:1);
 if(w.length>=2){const last=w[w.length-1],ref=w.find(x=>x.date>=addDays(last.date,-14))||w[0],days=Math.max(1,(fromKey(last.date)-fromKey(ref.date))/864e5),perWk=(last.kg-ref.kg)/days*7;
  if(S.profile.goal==='lose'&&days>=7){if(perWk<-1)out.push({tone:'warn',ic:'scale',t:'Weight is dropping quickly',x:`About ${n1(Math.abs(perWk))} kg a week. A steady 0.25 to 0.75 kg is easier to sustain and protects muscle.`,pr:4.5});else if(perWk<=-.2)out.push({tone:'ok',ic:'scale',t:'Weight is moving the right way',x:`About ${n1(Math.abs(perWk))} kg a week. Keep protein steady to protect muscle.`,pr:6})}}
 const st=streak();if(st>=3)out.push({tone:'ok',ic:'flame',t:`${st}-day streak`,x:'You have logged something every day. Consistency is what moves the numbers.',pr:7});
 return out.sort((a,b)=>a.pr-b.pr).slice(0,4)}

/* ============ ui core ============ */
let view='today';
const ui={medTab:'today',recTab:'docs',planTab:'meals',planDay:weekIdx(),foodDate:dkey(),docCat:'All',docQ:'',yogaTheme:weekIdx(),yogaMin:S.settings.yogaMin||20,yogaVar:0,poseF:'All',animated:false,pick:null,chat:[],coaching:false};
const caps={sample:null,downloads:null};
const A={};
const NAV=[['today','Today','home'],['meds','Medicines','pill'],['food','Nutrition','bowl'],['plan','My plan','calendar'],['yoga','Yoga','lotus'],['records','Records','folder']];
const TONE={ok:['tulsi-s','tulsi'],warn:['warn-s','warn'],bad:['bad-s','bad'],info:['sky-s','sky']};
const tone=t=>`style="background:var(--${TONE[t][0]});color:var(--${TONE[t][1]})"`;
const empty=(i,h,x,btn)=>`<div class="empty"><div class="ei">${ic(i,24)}</div><h3>${h}</h3><p>${x}</p>${btn?`<div class="sp"></div>${btn}`:''}</div>`;
const head=(t,s,acts)=>`<div class="top"><div><h1>${t}</h1>${s?`<p>${s}</p>`:''}</div><div class="acts">${acts||''}</div></div>`;

function toast(msg,o={}){const el=document.createElement('div');el.className='toast'+(o.bad?' bad':'');el.innerHTML=`<span>${esc(msg)}</span>${o.act?`<button data-a="${o.act}" data-k="${esc(o.k||'')}">${esc(o.label||'Undo')}</button>`:''}`;$('#toasts').appendChild(el);setTimeout(()=>el.remove(),o.ms||3400);return el}
let ov=null,onClose=null;
function modal(inner,{cls='',close}={}){closeModal(true);ov=document.createElement('div');ov.className='ov';ov.innerHTML=`<div class="sheet ${cls}" role="dialog" aria-modal="true">${inner}</div>`;ov.addEventListener('mousedown',e=>{if(e.target===ov&&!cls.includes('full'))closeModal()});document.body.appendChild(ov);onClose=close||null;const f=ov.querySelector('[autofocus]');if(f)f.focus();return ov.firstElementChild}
function closeModal(quiet){if(!ov)return;ov.remove();ov=null;const c=onClose;onClose=null;if(c&&!quiet)c()}
const sheetHead=(t,s)=>`<div class="sh"><div><h2>${esc(t)}</h2>${s?`<p class="sub" style="margin-top:4px">${s}</p>`:''}</div><button class="ib" data-a="close" aria-label="Close">${ic('x',18)}</button></div>`;
const q=s=>ov?ov.querySelector(s):null;
const qv=s=>{const e=q(s);return e?e.value:''};

function applyTheme(){const t=S.settings.theme;if(t==='auto')document.documentElement.removeAttribute('data-theme');else document.documentElement.setAttribute('data-theme',t)}
function renderNav(){$('#nav').innerHTML=NAV.map(([k,l,i])=>`<button data-a="nav" data-v="${k}" ${view===k?'aria-current="page"':''}>${ic(i)}<span>${l}</span></button>`).join('');
 $('#avatar').textContent=(S.profile.name||'P').trim().charAt(0).toUpperCase()||'P';$('#whoName').textContent=S.profile.name||'Your profile'}
function render(){const m=$('#main'),top=m.scrollTop;renderNav();m.innerHTML=`<div class="page">${VIEWS[view]()}</div>`;m.scrollTop=top;
 if(view==='today'&&!ui.animated){ui.animated=true;requestAnimationFrame(()=>requestAnimationFrame(()=>$$('.arc').forEach(a=>a.style.strokeDashoffset=a.dataset.off)))}}

/* ============ charts ============ */
function bars(vals,{labels=[],target=0,h=110,color='var(--tulsi)'}={}){
 const w=320,max=Math.max(target,...vals,1)*1.12,bw=w/vals.length;let s=`<svg class="chart" viewBox="0 0 ${w} ${h+20}" width="100%" role="img" aria-label="Bar chart">`;
 if(target){const y=h-target/max*h;s+=`<line x1="0" x2="${w}" y1="${y}" y2="${y}" style="stroke:var(--ink3)" stroke-dasharray="4 4" stroke-width="1" opacity=".6"/>`}
 vals.forEach((v,i)=>{const bh=v>0?Math.max(v/max*h,4):2,x=i*bw+bw*.18,last=i===vals.length-1;
  s+=`<rect x="${x}" y="${h-bh}" width="${bw*.64}" height="${bh}" rx="6" style="fill:${v>0?color:'var(--line)'}" opacity="${last?1:.6}"/><text x="${i*bw+bw/2}" y="${h+14}" text-anchor="middle">${esc(labels[i]||'')}</text>`});
 return s+'</svg>'}
function line(pts,{h=170,w=440,band,dec=1}={}){
 if(!pts.length)return'';const xs=pts.map(p=>fromKey(p.x).getTime()),ys=pts.map(p=>p.y);
 let lo=Math.min(...ys,band?band[0]:Infinity),hi=Math.max(...ys,band?band[1]:-Infinity);const pd=(hi-lo)*.18||1;lo-=pd;hi+=pd;
 const x0=Math.min(...xs),x1=Math.max(...xs),px=t=>x1===x0?w/2:38+(t-x0)/(x1-x0)*(w-54),py=v=>10+(1-(v-lo)/(hi-lo))*(h-34);
 let s=`<svg class="chart" viewBox="0 0 ${w} ${h}" width="100%" role="img" aria-label="Trend chart">`;
 [lo+pd,(lo+hi)/2,hi-pd].forEach(v=>{s+=`<line x1="38" x2="${w-10}" y1="${py(v)}" y2="${py(v)}" style="stroke:var(--line)"/><text x="32" y="${py(v)+4}" text-anchor="end">${n1(v)}</text>`});
 if(band)s+=`<rect x="38" y="${py(band[1])}" width="${w-48}" height="${Math.max(2,py(band[0])-py(band[1]))}" style="fill:var(--tulsi-s)" opacity=".75"/>`;
 const path=pts.map((p,i)=>`${i?'L':'M'}${px(xs[i]).toFixed(1)} ${py(p.y).toFixed(1)}`).join(' ');
 s+=`<path d="${path}" fill="none" style="stroke:var(--tulsi)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`;
 pts.forEach((p,i)=>{s+=`<circle cx="${px(xs[i])}" cy="${py(p.y)}" r="4" style="fill:var(--paper);stroke:var(--tulsi)" stroke-width="2"/>`});
 s+=`<text x="${px(x0)}" y="${h-4}" text-anchor="start">${fmtDate(pts[0].x,{day:'numeric',month:'short'})}</text>`;
 if(pts.length>1)s+=`<text x="${w-10}" y="${h-4}" text-anchor="end">${fmtDate(pts[pts.length-1].x,{day:'numeric',month:'short'})}</text>`;
 return s+'</svg>'}
function orbit(rings,score,anim){
 const cx=150,sw=15,gap=8;let s=`<svg viewBox="0 0 300 300" class="orbit" role="img" aria-label="Today's progress rings, score ${score} out of 100">`;
 rings.forEach((r,i)=>{const rad=cx-sw/2-6-i*(sw+gap),C=2*Math.PI*rad,p=clamp(r.pct||0,0,1),off=C*(1-p);
  s+=`<circle cx="150" cy="150" r="${rad}" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="${sw}"/>`;
  s+=`<circle class="arc" cx="150" cy="150" r="${rad}" fill="none" stroke="${r.color}" stroke-width="${sw}" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${anim?off:C}" data-off="${off}" opacity="${p>.005?1:0}" transform="rotate(-90 150 150)"/>`});
 return s+`<text x="150" y="152" text-anchor="middle" class="oscore">${score}</text><text x="150" y="176" text-anchor="middle" class="olabel">today’s score</text></svg>`}

/* ============ Today ============ */
function doseRow(d,date){
 const s=doseState(d,date),m=d.med,[tm,ap]=fmtTime(d.time).split(' ');
 const tag={taken:'<span class="tag ok">Taken</span>',skipped:'<span class="tag">Skipped</span>',missed:'<span class="tag hib">Not logged</span>',due:'<span class="tag warn">Due now</span>',upcoming:''}[s];
 const done=s==='taken'||s==='skipped';
 const act=done?`<button class="btn ghost sm" data-a="undoDose" data-k="${d.key}" data-d="${date}">Undo</button>`:`<button class="btn sm" data-a="takeDose" data-k="${d.key}" data-d="${date}">${ic('check',15)}Taken</button><button class="btn ghost sm" data-a="skipDose" data-k="${d.key}" data-d="${date}">Skip</button>`;
 return `<div class="dose ${s}"><div class="tm-b">${tm}<small>${ap}</small></div><div class="grow"><div class="t"><span class="pdot" style="--c:${m.color||'var(--tulsi)'}"></span> ${esc(m.name)} <span class="m">${esc(m.dose||'')}</span> ${tag}</div><div class="m">${esc([m.timing,m.notes].filter(Boolean).join(', '))}</div></div><div class="acts">${act}</div></div>`}
function viewToday(){
 const date=dkey(),{t,d,ds,taken,pc}=dayParts(date),score=scoreFor(date),hr=new Date().getHours();
 const greet=hr<5?'Good night':hr<12?'Good morning':hr<17?'Good afternoon':'Good evening',name=S.profile.name?`, ${esc(S.profile.name.split(' ')[0])}`:'';
 const left=ds.length-taken,pLeft=Math.max(0,t.protein-d.p),ym=yogaMin(date);
 const rings=[{pct:pc.protein,color:'#F5B445'},{pct:pc.cal,color:'#4CCB9C'},{pct:pc.water,color:'#62AEF2'},ds.length?{pct:pc.meds,color:'#F0698F'}:{pct:pc.yoga,color:'#A89AF0'}];
 const leg=[['#F5B445',`${n0(d.p)} of ${n0(t.protein)} g`,'Protein'],['#4CCB9C',`${n0(d.kcal)} of ${n0(t.kcal)}`,'Calories'],['#62AEF2',`${n1(d.water/1000)} of ${n1(t.water/1000)} L`,'Water'],ds.length?['#F0698F',`${taken} of ${ds.length} doses`,'Medicines']:['#A89AF0',`${ym} min`,'Yoga today']];
 const fresh=!d.kcal&&!taken&&!ym&&!d.water;
 const lead=fresh?'A fresh day. Log breakfast or take your first dose and your rings will start to fill.':`${ds.length?(left?`${left} dose${left>1?'s':''} still to take. `:'Every dose is done. '):''}${pLeft>0?`${n0(pLeft)} g of protein to go.`:'Protein goal reached.'}`;
 const slot=hr<10?'breakfast':hr<15?'lunch':hr<18?'snack':'dinner';
 const ins=insights(),flag=flaggedLabs().slice(0,4),rt=buildRoutine(S.settings.yogaMin||20,weekIdx(),0);
 const cups=Math.round(t.water/250),on=Math.floor(d.water/250);
 const wk=[...Array(7)].map((_,i)=>addDays(date,i-6));
 return `<section class="hero"><div><div class="date">${new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}</div><h1>${greet}${name}.</h1><p class="lead">${lead}</p>
 <div class="acts"><button class="btn" data-a="addFood" data-slot="${slot}">${ic('plus',18)}Log a meal</button><button class="btn ghost" data-a="yogaStart">${ic('lotus',18)}Start yoga</button></div>
 <div class="legend">${leg.map(l=>`<div class="leg"><i style="background:${l[0]}"></i><div><b>${l[1]}</b><span>${l[2]}</span></div></div>`).join('')}</div></div>
 <div>${orbit(rings,score,ui.animated)}</div></section>
 <div class="grid c2"><div class="panel"><div class="ph"><div><h2>Medicines today</h2><p class="sub">${ds.length?`${taken} of ${ds.length} taken`:'Nothing scheduled'}</p></div><button class="btn soft sm" data-a="addMed">${ic('plus',15)}Add</button></div>
 ${ds.length?`<div>${ds.map(x=>doseRow(x,date)).join('')}</div>`:empty('pill','No medicines yet','Add your prescriptions once and Prana will remind you at the right time, track refills and show your adherence.',`<button class="btn" data-a="addMed">${ic('plus',16)}Add a medicine</button>`)}</div>
 <div class="panel"><div class="ph"><div><h2>What to do next</h2><p class="sub">Based on your day, labs and goals</p></div></div>
 <div>${ins.length?ins.map(i=>`<div class="why"><div class="wi" ${tone(i.tone)}>${ic(i.ic,18)}</div><div class="grow"><div class="t">${esc(i.t)}</div><div class="m">${esc(i.x)}</div>${i.act?`<div style="margin-top:8px"><button class="btn soft sm" data-a="${i.act}">${ic('play',14)}Start now</button></div>`:i.go?`<div style="margin-top:8px"><button class="btn ghost sm" data-a="go" data-v="${i.go}">Open</button></div>`:''}</div></div>`).join(''):empty('check','You are on track','Nothing needs attention right now.')}</div></div></div>
 <div class="grid c3"><div class="panel"><div class="ph"><div><h2>Hydration</h2><p class="sub">${n0(d.water)} of ${n0(t.water)} ml</p></div></div>
 <div class="cups" style="margin-top:12px">${[...Array(cups)].map((_,i)=>`<button class="cup ${i<on?'on':''}" data-a="cup" data-v="${i}" aria-label="Glass ${i+1}"></button>`).join('')}</div>
 <div class="acts" style="margin-top:14px"><button class="btn soft sm" data-a="waterAdd" data-v="250">${ic('drop',15)}250 ml</button><button class="btn ghost sm" data-a="waterAdd" data-v="500">500 ml</button><button class="btn ghost sm" data-a="waterAdd" data-v="-250">Undo</button></div></div>
 <div class="panel"><div class="ph"><div><h2>Today’s practice</h2><p class="sub">${esc(rt.theme)}, ${rt.minutes} min</p></div></div>
 <div class="pills" style="margin:12px 0 16px">${rt.steps.slice(0,5).map(s=>`<span class="tag ${gk(s.p)==='k1'?'warn':gk(s.p)==='k2'?'ok':'iris'}">${esc(s.p.n)}</span>`).join('')}${rt.steps.length>5?`<span class="tag">+${rt.steps.length-5} more</span>`:''}</div>
 <div class="acts"><button class="btn" data-a="yogaStart">${ic('play',15)}Start</button><button class="btn ghost" data-a="go" data-v="yoga">Customise</button></div>${ym?`<p class="m" style="margin-top:12px">${ym} min logged today. Well done.</p>`:''}</div>
 <div class="panel"><div class="ph"><div><h2>This week</h2><p class="sub">Daily score, ${streak()}-day streak</p></div></div><div style="margin-top:10px">${bars(wk.map(scoreFor),{labels:wk.map(k=>fromKey(k).toLocaleDateString('en-IN',{weekday:'narrow'})),target:80,h:100})}</div></div></div>
 <div class="panel"><div class="ph"><div><h2>Lab watch</h2><p class="sub">Latest results outside the typical range</p></div><button class="btn ghost sm" data-a="go" data-v="records">All records</button></div>
 ${flag.length?`<div class="grid c4" style="margin:14px 0 0">${flag.map(f=>`<button class="lab l${f.s.lvl}" data-a="labOpen" data-k="${f.def.k}"><div class="m">${f.def.n}</div><div class="mid">${labFmt(f.def.k,f.l.v)} <span class="m">${f.def.u}</span></div><span class="tag ${f.s.lvl===2?'bad':'warn'}">${f.s.label}</span></button>`).join('')}</div>`:`<p class="sub" style="margin-top:10px">${S.labs.length?'Everything you have logged is in the typical range.':'Add values from your blood reports and Prana will tailor food and yoga advice to them.'}</p><div class="sp"></div><button class="btn soft sm" data-a="addLabs">${ic('plus',15)}Add lab results</button>`}</div>`}

/* ============ Medicines ============ */
function viewMeds(){
 const date=dkey(),tab=ui.medTab,ds=doses(date);
 const seg=`<div class="seg" role="tablist">${[['today','Today'],['all','All medicines'],['hist','History']].map(([k,l])=>`<button class="${tab===k?'on':''}" data-a="medTab" data-v="${k}">${l}</button>`).join('')}</div>`;
 let body='';
 if(tab==='today'){
  if(!ds.length)body=`<div class="panel">${empty('pill','No doses today','Add a medicine with its timings and it will appear here with a reminder.',`<button class="btn" data-a="addMed">${ic('plus',16)}Add a medicine</button>`)}</div>`;
  else{const groups={};ds.forEach(d=>(groups[period(d.time)]=groups[period(d.time)]||[]).push(d));
   body=['Morning','Afternoon','Evening','Night'].filter(p=>groups[p]).map(p=>`<div class="panel" style="margin-bottom:14px"><div class="ph"><h2>${p}</h2><span class="m">${groups[p].filter(x=>doseState(x,date)==='taken').length} of ${groups[p].length} taken</span></div>${groups[p].map(x=>doseRow(x,date)).join('')}</div>`).join('')}
 }else if(tab==='all'){
  body=S.meds.length?`<div class="panel"><div class="rows">${S.meds.map(m=>{const dl=daysLeft(m),sched=m.times.map(fmtTime).join(', ')+(m.days&&m.days.length?', '+m.days.map(i=>DAYN[i]).join(' '):', every day');
   return `<div class="row" style="align-items:flex-start;flex-wrap:wrap"><span class="pdot" style="--c:${m.color};margin-top:8px"></span><div class="grow"><div class="t">${esc(m.name)} <span class="m">${esc(m.dose||'')} ${esc(m.form||'')}</span> ${m.paused?'<span class="tag">Paused</span>':''}</div><div class="m">${esc(sched)}</div><div class="m">${esc([m.timing,m.notes].filter(Boolean).join(', '))}</div>
   ${dl!=null?`<div style="margin-top:8px;max-width:260px"><div class="meter" style="--c:${dl<=5?'var(--hib)':dl<=14?'var(--turmeric)':'var(--tulsi)'}"><i style="width:${clamp(dl/30*100,4,100)}%"></i></div><div class="m" style="margin-top:4px">${m.stock} left, about ${dl} day${dl===1?'':'s'}</div></div>`:''}</div>
   <div class="acts"><button class="ib sm" data-a="editMed" data-id="${m.id}" aria-label="Edit">${ic('edit',15)}</button><button class="btn ghost sm" data-a="pauseMed" data-id="${m.id}">${m.paused?'Resume':'Pause'}</button><button class="ib sm" data-a="delMed" data-id="${m.id}" aria-label="Delete">${ic('trash',15)}</button></div></div>`}).join('')}</div></div>`:`<div class="panel">${empty('pill','Your medicine list is empty','Add a medicine to start tracking.',`<button class="btn" data-a="addMed">${ic('plus',16)}Add a medicine</button>`)}</div>`;
 }else{
  const a7=adherence(7),a30=adherence(30),days=[...Array(14)].map((_,i)=>addDays(date,i-13));
  const pct=a=>a.pct==null?'No data':Math.round(a.pct*100)+'%';
  body=`<div class="grid c3"><div class="stat"><div class="big">${pct(a7)}</div><div class="m">Adherence, last 7 days</div></div><div class="stat"><div class="big">${pct(a30)}</div><div class="m">Adherence, last 30 days</div></div><div class="stat"><div class="big">${a30.taken}<span class="m"> of ${a30.total}</span></div><div class="m">Doses taken in 30 days</div></div></div>
  <div class="panel"><div class="ph"><div><h2>Last 14 days</h2><p class="sub">Green is all doses taken, amber is partly, red is none</p></div></div>
  ${S.meds.length?`<div class="scroll-x"><div style="min-width:520px">${S.meds.map(m=>`<div class="flex ac gap8" style="margin-top:12px"><div style="width:120px" class="t ell"><span class="pdot" style="--c:${m.color}"></span> ${esc(m.name)}</div><div class="hm grow" style="grid-template-columns:repeat(14,1fr)">${days.map(dt=>{const x=doses(dt).filter(d=>d.med.id===m.id);if(!x.length)return`<div class="cell na" title="${fmtDate(dt)}: not scheduled"></div>`;const sts=x.map(d=>doseState(d,dt)),tk=sts.filter(s=>s==='taken').length;if(sts.every(s=>s==='upcoming'||s==='due'))return`<div class="cell na"></div>`;return`<div class="cell ${tk===x.length?'full':tk?'part':'none'}" title="${fmtDate(dt)}: ${tk} of ${x.length} taken"></div>`}).join('')}</div></div>`).join('')}
  <div class="flex gap8" style="margin:10px 0 0 128px"><span class="m grow">${fmtDate(days[0],{day:'numeric',month:'short'})}</span><span class="m">Today</span></div></div></div>`:empty('chart','No history yet','Once you add medicines, your 14-day record appears here.')}</div>`}
 return head('Medicines','Reminders, refills and your adherence in one place.',`<button class="btn" data-a="addMed">${ic('plus',18)}Add medicine</button>`)+`<div style="margin-bottom:18px">${seg}</div>`+body}

function medForm(id){
 const m=id?S.meds.find(x=>x.id===id):null,times=m?m.times:['08:00'],days=m?(m.days||[]):[];
 const timeRow=t=>`<div class="flex gap8 ac" style="margin-bottom:8px"><input type="time" class="tm" value="${t}"><button class="ib sm" data-a="rmTime" aria-label="Remove time">${ic('x',14)}</button></div>`;
 modal(`${sheetHead(m?'Edit medicine':'Add a medicine','Copy this from your prescription.')}
 <div class="field"><label for="mName">Name</label><input type="text" id="mName" value="${esc(m?m.name:'')}" placeholder="e.g. Metformin" autofocus></div>
 <div class="two"><div class="field"><label for="mDose">Strength or dose</label><input type="text" id="mDose" value="${esc(m?m.dose:'')}" placeholder="500 mg"></div>
 <div class="field"><label for="mForm">Form</label><select id="mForm">${['Tablet','Capsule','Syrup','Injection','Drops','Sachet','Inhaler','Ointment'].map(f=>`<option ${m&&m.form===f?'selected':''}>${f}</option>`).join('')}</select></div></div>
 <div class="field"><span class="lbl">Reminder times</span><div id="times">${times.map(timeRow).join('')}</div>
 <div class="pills"><button class="pill" data-a="addTime" data-v="08:00">Morning</button><button class="pill" data-a="addTime" data-v="14:00">Afternoon</button><button class="pill" data-a="addTime" data-v="18:00">Evening</button><button class="pill" data-a="addTime" data-v="21:00">Night</button></div></div>
 <div class="field"><label for="mTiming">How to take it</label><select id="mTiming">${['After food','Before food','With food','On an empty stomach','At bedtime','No preference'].map(f=>`<option ${m&&m.timing===f?'selected':''}>${f}</option>`).join('')}</select></div>
 <div class="field"><span class="lbl">Days</span><div class="pills" id="mDays">${DAYN.map((d,i)=>`<button class="pill ${!days.length||days.includes(i)?'on':''}" data-a="tog" data-i="${i}">${d}</button>`).join('')}</div><span class="hint">Keep all selected for every day.</span></div>
 <div class="two"><div class="field"><label for="mStart">Start date</label><input type="date" id="mStart" value="${m?m.start||'':dkey()}"></div><div class="field"><label for="mEnd">End date (optional)</label><input type="date" id="mEnd" value="${m?m.end||'':''}"></div></div>
 <div class="two"><div class="field"><label for="mStock">Units left in stock</label><input type="number" id="mStock" min="0" value="${m&&m.stock!=null?m.stock:''}" placeholder="e.g. 30"></div><div class="field"><label for="mPer">Units per dose</label><input type="number" id="mPer" min="0.25" step="0.25" value="${m?m.per||1:1}"></div></div>
 <div class="field"><label for="mNotes">Notes</label><input type="text" id="mNotes" value="${esc(m?m.notes:'')}" placeholder="What it is for, or the doctor’s advice"></div>
 <div class="sf"><button class="btn ghost" data-a="close">Cancel</button><button class="btn" data-a="saveMed" data-id="${id||''}">Save medicine</button></div>`,{});
 q('#times').dataset.row=timeRow('__T__')}

/* ============ helpers for part 2 ============ */
S.customFoods=S.customFoods||[];
const allFoods=()=>FOODS.concat(S.customFoods);
const SLOTLET={breakfast:'b',lunch:'l',snack:'s',dinner:'d'};
const fdate=()=>view==='food'?ui.foodDate:dkey();
const medDate=el=>(el&&el.dataset&&el.dataset.d)||dkey();
function addMeal(date,slot,f,qty){
 const L=S.meals[date]=S.meals[date]||[];
 const ex=L.find(x=>x.slot===slot&&x.name===f.name);
 if(ex)ex.q+=qty;else L.push({id:uid(),slot,name:f.name,unit:f.unit,kcal:f.kcal,p:f.p,c:f.c,f:f.f,q:qty});
 save()}
async function saveFile(filename,data,mime){
 if(caps.downloads){try{await caps.downloads.save({filename,data});return true}catch(e){if(e&&e.code==='cancelled')return false}}
 try{const blob=data instanceof Blob?data:new Blob([data],{type:mime||'text/plain'});const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000);return true}catch(e){toast('Saving is not available here.',{bad:true});return false}}
let chimeCtx=null;
function chime(){try{chimeCtx=chimeCtx||new (window.AudioContext||window.webkitAudioContext)();const c=chimeCtx;[660,880].forEach((fq,i)=>{const o=c.createOscillator(),g=c.createGain();o.frequency.value=fq;o.type='sine';g.gain.setValueAtTime(.0001,c.currentTime+i*.18);g.gain.exponentialRampToValueAtTime(.18,c.currentTime+i*.18+.03);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+i*.18+.9);o.connect(g);g.connect(c.destination);o.start(c.currentTime+i*.18);o.stop(c.currentTime+i*.18+1)})}catch(e){}}

/* ============ navigation + medicine actions ============ */
A.nav=el=>{view=el.dataset.v;closeModal(true);render();$('#main').scrollTop=0};
A.go=A.nav;
A.close=()=>closeModal();
A.profile=()=>profileModal();
A.medTab=el=>{ui.medTab=el.dataset.v;render()};
A.takeDose=el=>{const date=medDate(el),d=doses(date).find(x=>x.key===el.dataset.k);if(!d)return;setDose(date,d,'taken');render();toast(`${d.med.name} marked as taken`)};
A.skipDose=el=>{const date=medDate(el),d=doses(date).find(x=>x.key===el.dataset.k);if(!d)return;setDose(date,d,'skipped');render()};
A.undoDose=el=>{const date=medDate(el),d=doses(date).find(x=>x.key===el.dataset.k);if(!d)return;setDose(date,d,null);render()};
A.takeNow=el=>{const date=dkey(),d=doses(date).find(x=>x.key===el.dataset.k);if(!d)return;setDose(date,d,'taken');el.closest('.toast')&&el.closest('.toast').remove();render()};
A.addMed=()=>medForm();
A.editMed=el=>medForm(el.dataset.id);
A.addTime=el=>{const box=q('#times');if(!box)return;box.insertAdjacentHTML('beforeend',box.dataset.row.replace('__T__',el.dataset.v))};
A.rmTime=el=>{const box=q('#times');if(!box)return;if(box.children.length>1)el.parentElement.remove()};
A.tog=el=>el.classList.toggle('on');
A.saveMed=el=>{
 const name=qv('#mName').trim();if(!name){toast('Please enter the medicine name.',{bad:true});return}
 const times=[...new Set($$('.tm',ov).map(i=>i.value).filter(Boolean))].sort();if(!times.length){toast('Add at least one reminder time.',{bad:true});return}
 const on=$$('#mDays .pill.on',ov).map(b=>+b.dataset.i),days=on.length===7?[]:on;if(!on.length){toast('Pick at least one day.',{bad:true});return}
 const id=el.dataset.id,old=id?S.meds.find(x=>x.id===id):null;
 const stockRaw=qv('#mStock'),m=Object.assign(old||{id:uid(),color:MCOL[S.meds.length%MCOL.length],paused:false},{name,dose:qv('#mDose').trim(),form:qv('#mForm'),times,timing:qv('#mTiming'),days,start:qv('#mStart')||dkey(),end:qv('#mEnd')||'',stock:stockRaw===''?null:Math.max(0,num(stockRaw)),per:Math.max(.25,num(qv('#mPer'),1)),notes:qv('#mNotes').trim()});
 if(!old)S.meds.push(m);save();closeModal(true);render();toast(old?'Medicine updated':`${name} added. You will be reminded at ${times.map(fmtTime).join(', ')}.`)};
let lastDel=null;
A.delMed=el=>{const i=S.meds.findIndex(x=>x.id===el.dataset.id);if(i<0)return;lastDel={m:S.meds[i],i};S.meds.splice(i,1);save();render();toast(`${lastDel.m.name} removed`,{act:'undoDelMed',label:'Undo',ms:6000})};
A.undoDelMed=el=>{if(!lastDel)return;S.meds.splice(Math.min(lastDel.i,S.meds.length),0,lastDel.m);lastDel=null;save();el.closest('.toast').remove();render()};
A.pauseMed=el=>{const m=S.meds.find(x=>x.id===el.dataset.id);if(!m)return;m.paused=!m.paused;save();render()};
A.waterAdd=el=>{const date=medDate(el),v=num(el.dataset.v);S.water[date]=Math.max(0,(S.water[date]||0)+v);save();render()};
A.cup=el=>{const date=medDate(el),i=+el.dataset.v,cur=S.water[date]||0;S.water[date]=cur>=(i+1)*250?i*250:(i+1)*250;save();render()};

/* ============ Nutrition ============ */
const SLOTICON={breakfast:'sun',lunch:'bowl',snack:'leaf',dinner:'moon'};
function viewFood(){
 const date=ui.foodDate,today=dkey(),t=body(),d=totals(date),meals=S.meals[date]||[];
 const gap=Math.max(0,t.protein-d.p),room=t.kcal-d.kcal,ideas=gap>5?proteinIdeas(gap,room):[];
 const label=date===today?'Today':date===addDays(today,-1)?'Yesterday':fmtDate(date,{weekday:'short',day:'numeric',month:'short'});
 const mac=(n,v,tg,col,u)=>`<div class="macro"><div class="l"><span>${n}</span><b>${n0(v)} / ${n0(tg)} ${u}</b></div><div class="meter" style="--c:${col}"><i style="width:${clamp(v/tg*100,0,100)}%"></i></div></div>`;
 const wk=[...Array(7)].map((_,i)=>addDays(today,i-6)),cups=Math.round(t.water/250),on=Math.floor(d.water/250);
 const slotsHtml=Object.entries(SLOTS).map(([k,l])=>{const it=meals.filter(x=>x.slot===k),kc=sum(it,x=>x.kcal*x.q),pr=sum(it,x=>x.p*x.q);
  return `<div class="slot"><div class="flex ac jb"><div class="flex ac gap8"><span class="ib sm" style="border:0;background:var(--paper2)">${ic(SLOTICON[k],16)}</span><h3>${l}</h3></div><div class="flex ac gap8"><span class="m">${it.length?`${n0(kc)} kcal, ${n0(pr)} g protein`:''}</span><button class="btn soft sm" data-a="addFood" data-slot="${k}">${ic('plus',14)}Add</button></div></div>
  ${it.length?`<div style="margin-top:6px">${it.map(x=>`<div class="food"><div class="grow"><div class="t">${esc(x.name)}</div><div class="m">${fmtQ(x.q)} × ${esc(x.unit)}, ${n0(x.kcal*x.q)} kcal, ${n1(x.p*x.q)} g protein</div></div><div class="stepper"><button data-a="qty" data-id="${x.id}" data-v="-0.5" aria-label="Less">−</button><span>${fmtQ(x.q)}</span><button data-a="qty" data-id="${x.id}" data-v="0.5" aria-label="More">+</button></div><button class="ib sm" data-a="delFood" data-id="${x.id}" aria-label="Remove ${esc(x.name)}">${ic('trash',14)}</button></div>`).join('')}</div>`:`<p class="m" style="margin:8px 0 0">Nothing logged yet.</p>`}</div>`}).join('');
 return head('Nutrition','Log what you eat. Prana keeps your protein, calories and water on target.',`<div class="flex ac gap8"><button class="ib" data-a="foodDay" data-v="-1" aria-label="Previous day">${ic('left',18)}</button><b style="min-width:92px;text-align:center">${label}</b><button class="ib" data-a="foodDay" data-v="1" aria-label="Next day" ${date>=today?'disabled':''}>${ic('right',18)}</button></div>`)+
 `<div class="grid c2"><div class="panel"><div class="ph"><div><h2>${n0(d.kcal)} <span class="m" style="font-weight:500">of ${n0(t.kcal)} kcal</span></h2><p class="sub">${room>=0?`${n0(room)} kcal left`:`${n0(-room)} kcal over`} for ${label.toLowerCase()}</p></div></div>
 <div style="display:grid;gap:14px;margin-top:14px">${mac('Protein',d.p,t.protein,'var(--turmeric)','g')}${mac('Carbohydrates',d.c,t.carbs,'var(--tulsi)','g')}${mac('Fat',d.f,t.fat,'var(--hib)','g')}</div></div>
 <div class="panel"><div class="ph"><div><h2>Protein coach</h2><p class="sub">${gap>5?`${n0(gap)} g to reach ${n0(t.protein)} g`:'Protein target reached'}</p></div></div>
 ${gap>5&&ideas.length?`<div>${ideas.map(f=>`<div class="idea"><div class="grow"><div class="t">${esc(f.name)}</div><div class="m">${esc(f.unit)}, ${f.p} g protein, ${f.kcal} kcal</div></div><button class="btn soft sm" data-a="quickAdd" data-n="${esc(f.name)}">${ic('plus',14)}Add</button></div>`).join('')}</div>`:`<p class="sub" style="margin-top:12px">${gap>5?'Add a protein-rich food to your next meal.':'Spread protein across meals and keep it up tomorrow.'}${has('kidney')?' Because you noted kidney concerns, stay at your doctor’s advised protein level.':''}</p>`}</div></div>
 <div class="grid c2"><div class="panel"><div class="ph"><h2>Meals</h2></div>${slotsHtml}</div>
 <div style="display:flex;flex-direction:column;gap:18px"><div class="panel"><div class="ph"><div><h2>Water</h2><p class="sub">${n0(d.water)} of ${n0(t.water)} ml</p></div></div><div class="cups" style="margin-top:12px">${[...Array(cups)].map((_,i)=>`<button class="cup ${i<on?'on':''}" data-a="cup" data-v="${i}" data-d="${date}" aria-label="Glass ${i+1}"></button>`).join('')}</div>
 <div class="acts" style="margin-top:14px"><button class="btn soft sm" data-a="waterAdd" data-v="250" data-d="${date}">${ic('drop',15)}250 ml</button><button class="btn ghost sm" data-a="waterAdd" data-v="500" data-d="${date}">500 ml</button><button class="btn ghost sm" data-a="waterAdd" data-v="-250" data-d="${date}">Undo</button></div></div>
 <div class="panel"><div class="ph"><div><h2>Protein, last 7 days</h2><p class="sub">Dashed line is your target of ${n0(t.protein)} g</p></div></div>${bars(wk.map(k=>totals(k).p),{labels:wk.map(k=>fromKey(k).toLocaleDateString('en-IN',{weekday:'narrow'})),target:t.protein,color:'var(--turmeric)',h:110})}</div></div></div>`}
A.foodDay=el=>{const n=addDays(ui.foodDate,num(el.dataset.v));if(n>dkey())return;ui.foodDate=n;render()};
A.qty=el=>{const L=S.meals[ui.foodDate]||[],x=L.find(i=>i.id===el.dataset.id);if(!x)return;x.q=Math.max(.5,x.q+num(el.dataset.v));save();render()};
A.delFood=el=>{const L=S.meals[ui.foodDate]||[],i=L.findIndex(x=>x.id===el.dataset.id);if(i>=0)L.splice(i,1);save();render()};
A.quickAdd=el=>{const f=allFoods().find(x=>x.name===el.dataset.n);if(!f)return;const hr=new Date().getHours(),slot=el.dataset.slot||(hr<10?'breakfast':hr<15?'lunch':hr<18?'snack':'dinner');addMeal(fdate(),slot,f,1);render();toast(`${f.name} added`)};

/* food picker */
A.addFood=el=>{ui.pick={slot:el.dataset.slot||'snack',tab:'Suggested',date:fdate()};foodPicker()};
function foodPicker(){
 const p=ui.pick,tabs=['Suggested','All','High protein','Frequent','Custom'];
 modal(`${sheetHead('Add to '+SLOTS[p.slot].toLowerCase(),'Tap a food to add one serving. Adjust quantities afterwards.')}
 <input type="search" id="fpSearch" placeholder="Search foods" autocomplete="off" autofocus aria-label="Search foods">
 <div style="margin:12px 0"><div class="seg" id="fpTabs">${tabs.map(t=>`<button class="${p.tab===t?'on':''}" data-a="pickTab" data-v="${t}">${t}</button>`).join('')}</div></div>
 <div id="fpList"></div><div class="sf"><button class="btn" data-a="close">Done</button></div>`,{cls:'wide'});
 q('#fpSearch').addEventListener('input',renderPick);renderPick()}
function renderPick(){
 const p=ui.pick,box=q('#fpList');if(!box)return;const term=qv('#fpSearch').trim().toLowerCase();
 let list=allFoods();
 if(p.tab==='Custom'&&!term){
  box.innerHTML=`<div class="panel" style="padding:16px;margin-bottom:12px"><div class="field"><label for="cfName">Food name</label><input type="text" id="cfName" placeholder="e.g. Homemade protein bar"></div><div class="two"><div class="field"><label for="cfUnit">Serving</label><input type="text" id="cfUnit" placeholder="1 piece"></div><div class="field"><label for="cfK">Calories</label><input type="number" id="cfK" min="0"></div></div><div class="three"><div class="field"><label for="cfP">Protein g</label><input type="number" id="cfP" min="0" step="0.1"></div><div class="field"><label for="cfC">Carbs g</label><input type="number" id="cfC" min="0" step="0.1"></div><div class="field"><label for="cfF">Fat g</label><input type="number" id="cfF" min="0" step="0.1"></div></div><button class="btn" data-a="saveCustom">Save food</button></div>
  ${S.customFoods.map(f=>pickRow(f)).join('')}`;return}
 if(term)list=list.filter(f=>f.name.toLowerCase().includes(term)).filter(f=>f.cls===undefined||f.cls<=RANK[S.profile.diet]);
 else if(p.tab==='Suggested')list=list.filter(f=>foodOK(f)&&(f.slots||'').includes(SLOTLET[p.slot]||'s')).sort((a,b)=>b.p/b.kcal-a.p/a.kcal).slice(0,45);
 else if(p.tab==='All')list=list.filter(f=>foodOK(f,true)).sort((a,b)=>a.name.localeCompare(b.name));
 else if(p.tab==='High protein')list=list.filter(f=>foodOK(f,true)&&f.p>=10).sort((a,b)=>b.p-a.p);
 else if(p.tab==='Frequent'){const c={};Object.values(S.meals).forEach(a=>a.forEach(x=>c[x.name]=(c[x.name]||0)+1));list=list.filter(f=>c[f.name]).sort((a,b)=>c[b.name]-c[a.name]).slice(0,20)}
 box.innerHTML=list.length?list.map(pickRow).join(''):`<p class="sub" style="padding:18px 4px">${p.tab==='Frequent'?'Foods you log often will appear here.':'No matches. Try the Custom tab to add your own food.'}</p>`}
const pickRow=f=>`<div class="food"><div class="grow"><div class="t">${esc(f.name)}</div><div class="m">${esc(f.unit)}, ${f.kcal} kcal, ${f.p} g protein</div></div><button class="btn soft sm" data-a="pickFood" data-n="${esc(f.name)}">${ic('plus',14)}Add</button></div>`;
A.pickTab=el=>{ui.pick.tab=el.dataset.v;$$('#fpTabs button',ov).forEach(b=>b.classList.toggle('on',b===el));renderPick()};
A.pickFood=el=>{const f=allFoods().find(x=>x.name===el.dataset.n);if(!f)return;addMeal(ui.pick.date,ui.pick.slot,f,1);render();toast(`${f.name} added to ${SLOTS[ui.pick.slot].toLowerCase()}`,{ms:1600})};
A.saveCustom=()=>{const name=qv('#cfName').trim();if(!name){toast('Give the food a name.',{bad:true});return}
 S.customFoods.push({name,unit:qv('#cfUnit').trim()||'1 serving',kcal:num(qv('#cfK')),p:num(qv('#cfP')),c:num(qv('#cfC')),f:num(qv('#cfF')),cls:0,slots:'blsd',fl:''});save();renderPick();toast('Custom food saved')};

/* ============ My plan ============ */
const GUARD={
diabetes:'Carbohydrates are kept moderate and paired with protein and fibre. Sweets, sweet drinks and high-glycemic dishes are left out, and Vajrasana after meals is suggested in yoga.',
hypertension:'Salty items such as pickle and papad are avoided, and breathing practices are favoured. Inversions and strong breath holds are kept out of your yoga.',
cholesterol:'Fried and rich dishes are left out, fat is capped near 25% of calories, and oats, legumes and nuts are favoured.',
thyroid:'Meals stay balanced with enough protein. Take thyroid medicine at the same time daily as your doctor advises, and discuss soy-heavy meals with them.',
pcos:'Low-glycemic carbs with protein at each meal. Sweets and sugary drinks are left out, and hip-opening and flowing yoga is favoured.',
anemia:'Iron-rich foods like dal, rajma, chana and leafy greens appear often. Pair them with a vitamin C source such as lemon, amla or guava, and keep tea away from meals.',
kidney:'Protein is held at 0.8 g per kg and the protein booster is switched off. Salty items are avoided and water is set to 2 L. Please follow your nephrologist’s limits.',
backpain:'Spine-friendly poses such as cat–cow and bridge are favoured, while deep forward bends and strong twists are used with care.',
joint:'Kneeling and deep knee-bend poses are used with care, and gentle strengthening is preferred.',
stress:'Calming breathwork, restorative poses and a longer final relaxation are included to support sleep and stress.',
asthma:'Gentle breathing practices are favoured. Fast breathing such as Kapalabhati is left out. Keep your inhaler nearby when you practise.',
pregnancy:'Calories and protein are raised slightly. Poses that compress the belly, deep twists, and strong breathing are left out. Please check every practice with your doctor.'};
function viewPlan(){
 const t=body(),bc=bmiCat(t.bmi),plan=ensurePlan(),tab=ui.planTab;
 const seg=`<div class="seg">${[['meals','Weekly meals'],['why','Why this plan']].concat(caps.sample?[['coach','Ask coach']]:[]).map(([k,l])=>`<button class="${tab===k?'on':''}" data-a="planTab" data-v="${k}">${l}</button>`).join('')}</div>`;
 const stats=`<div class="grid c4"><div class="stat"><div class="big">${n0(t.kcal)}</div><div class="m">Calories a day</div></div><div class="stat"><div class="big">${t.protein} g</div><div class="m">Protein a day, about ${n1(t.protein/t.pw)} g per kg</div></div><div class="stat"><div class="big">${n1(t.water/1000)} L</div><div class="m">Water a day</div></div><div class="stat"><div class="big">${n1(t.bmi)}</div><div class="m"><span class="tag ${bc[1]}">${bc[0]}</span></div></div></div>`;
 let content='';
 if(tab==='meals'){
  const day=plan.days[clamp(ui.planDay,0,6)],dt=dayTotals(day);
  const chips=`<div class="days" style="margin-bottom:16px">${plan.days.map((d,i)=>`<button class="dy ${i===ui.planDay?'on':''}" data-a="planDay" data-v="${i}"><b>${d.name}</b>${n0(dayTotals(d).k)}</button>`).join('')}</div>`;
  const slots=day.slots.map(s=>{const k=sum(s.items,i=>(FMAP[i.n]?FMAP[i.n].kcal:0)*i.q),p=sum(s.items,i=>(FMAP[i.n]?FMAP[i.n].p:0)*i.q);
   return `<div class="slot"><div class="flex ac jb gap8 wrap"><div><h3>${s.label} <span class="m" style="font-weight:500">${fmtTime(s.time)}</span></h3><div class="m">${n0(k)} kcal, ${n0(p)} g protein</div></div>${s.items.length?`<button class="btn soft sm" data-a="logSlot" data-key="${s.key}">${ic('check',14)}Log this</button>`:''}</div>
   <div style="margin-top:8px">${s.items.map(i=>{const f=FMAP[i.n];return f?`<div class="item"><span>${esc(f.name)} ${i.boost?'<span class="tag warn">protein boost</span>':''}</span><span class="q">${fmtQ(i.q)} × ${esc(f.unit)}</span></div>`:''}).join('')||'<p class="m">No suitable combination found. Try refreshing the plan.</p>'}</div></div>`}).join('');
  content=`<div class="panel"><div class="ph"><div><h2>${day.name}day plan</h2><p class="sub">${n0(dt.k)} kcal of ${n0(t.kcal)}, ${n0(dt.p)} g protein of ${t.protein} g</p></div><div class="acts"><button class="btn ghost sm" data-a="refreshPlan">${ic('refresh',14)}New ideas</button><button class="btn ghost sm" data-a="shop">${ic('cart',14)}Shopping list</button></div></div>${chips}${slots}</div>
  <p class="hint" style="margin-top:12px">Built from Indian meal combinations that match your diet, allergies and conditions. Portions are scaled to your targets. Tap Log this to add a meal to today.</p>`}
 else if(tab==='why'){
  const lf=flaggedLabs(),cs=S.profile.conditions;
  const row=(i,c,t1,t2)=>`<div class="why"><div class="wi" style="background:var(--${c}-s);color:var(--${c})">${ic(i,18)}</div><div class="grow"><div class="t">${t1}</div><div class="m">${t2}</div></div></div>`;
  content=`<div class="grid c2"><div class="panel"><div class="ph"><h2>How your targets are worked out</h2></div>
  ${row('flame','turmeric',`Resting energy: ${n0(t.bmr)} kcal`,`The Mifflin-St Jeor formula uses your age, height (${num(S.profile.height)} cm) and weight (${n1(t.w)} kg).`)}
  ${row('sun','tulsi',`Daily energy: ${n0(t.tdee)} kcal`,`Resting energy × ${t.mult} for “${ACT[S.profile.activity][0].split(':')[0].toLowerCase()}”.`)}
  ${row('scale','sky',`Target: ${n0(t.kcal)} kcal`,t.adj===0?'Your goal is to maintain, so no adjustment is applied.':`${t.adj>0?'Plus':'Minus'} ${n0(Math.abs(t.adj))} kcal for “${has('pregnancy')?'pregnancy or nursing':GOALS[S.profile.goal].toLowerCase()}”. The plan never goes below ${S.profile.sex==='male'?1500:1200} kcal.`)}
  ${row('bowl','hib',`Protein: ${t.protein} g`,`About ${n1(t.g)} g per kg of ${n1(t.pw)} kg body weight, matched to your goal and activity, and capped at 35% of calories.${has('kidney')?' Held lower because of your kidney note.':''}`)}
  ${row('drop','sky',`Water: ${n1(t.water/1000)} L`,'About 35 ml per kg, kept between 2 and 3.5 L.')}
  ${row('heart','iris',`BMI ${n1(t.bmi)}: ${bc[0].toLowerCase()}`,'Uses Asian cut-offs, where 23 and above is overweight and 25 and above is obese. BMI is a screening number only.')}</div>
  <div style="display:flex;flex-direction:column;gap:18px"><div class="panel"><div class="ph"><h2>Guardrails for you</h2></div>${cs.length?cs.map(c=>row('shield','tulsi',COND[c],GUARD[c])).join(''):'<p class="sub" style="margin-top:8px">No conditions selected. Add any you have in your profile and the plan will adapt.</p><div class="sp"></div><button class="btn soft sm" data-a="profile">Open profile</button>'}</div>
  <div class="panel"><div class="ph"><h2>From your lab results</h2></div>${lf.length?lf.map(f=>row('chart',f.s.lvl===2?'hib':'turmeric',`${f.def.n}: ${labFmt(f.def.k,f.l.v)} ${f.def.u}, ${f.s.label.toLowerCase()}`,TIPS[f.def.k])).join(''):`<p class="sub" style="margin-top:8px">${S.labs.length?'Everything you have logged is in range.':'Add lab values in Records and this section will explain how they shape your food and yoga.'}</p>`}</div></div></div>
  <p class="hint" style="margin-top:12px">These are general wellness guidelines, not a prescription. Always follow your doctor’s advice, and never change prescribed medicines because of anything in this app.</p>`}
 else{
  const sugg=['Why is my protein target this number?','Suggest a high-protein Indian snack under 200 calories','How can I improve my latest lab results with food?','Give me a simple plan for a busy workday'];
  content=`<div class="panel"><div class="ph"><div><h2>Ask your coach</h2><p class="sub">Answers use your profile, targets and recent logs. Your documents and medicine names are never sent.</p></div></div>
  <div id="chat" style="display:flex;flex-direction:column;gap:12px;margin:14px 0">${ui.chat.length?ui.chat.map((m,i)=>m.role==='user'?`<div class="say" style="align-self:flex-end;background:var(--tulsi-s);max-width:88%">${esc(m.content)}</div>`:`<div class="say" ${i===ui.chat.length-1?'id="coachLast"':''}>${m.content?md(m.content):'<span class="spin"></span> Thinking'}</div>`).join(''):`<div class="pills">${sugg.map(s=>`<button class="pill" data-a="coachAsk" data-q="${esc(s)}">${esc(s)}</button>`).join('')}</div>`}</div>
  <div class="flex gap8"><textarea id="coachIn" rows="2" placeholder="Ask about food, protein, yoga or your results" style="min-height:48px" aria-label="Your question"></textarea><div style="display:flex;flex-direction:column;gap:6px"><button class="btn" data-a="coachSend" ${ui.coaching?'disabled':''}>Send</button>${ui.coaching?'<button class="btn ghost sm" data-a="coachStop">Stop</button>':''}</div></div>
  <p class="hint" style="margin-top:10px">The coach is an AI and can make mistakes. It is not a doctor. For symptoms, medicines or test results, speak to your clinician.</p></div>`}
 return head('My plan','A diet built from your body, goals, conditions and lab results.',seg)+stats+content}
A.planTab=el=>{ui.planTab=el.dataset.v;render()};
A.planDay=el=>{ui.planDay=+el.dataset.v;render()};
A.refreshPlan=()=>{ensurePlan(true);render();toast('Fresh meal ideas ready')};
A.logSlot=el=>{const day=ensurePlan().days[ui.planDay],s=day.slots.find(x=>x.key===el.dataset.key);if(!s)return;const slot=s.key.startsWith('snack')?'snack':s.key;
 s.items.forEach(i=>{const f=FMAP[i.n];if(f)addMeal(dkey(),slot,f,i.q)});render();toast(`${s.label} logged for today`,{act:'go',k:'',label:'View'});const b=$('#toasts .toast:last-child button');if(b){b.dataset.v='food';ui.foodDate=dkey()}};
function shopList(){const m=new Map();ensurePlan().days.forEach(d=>d.slots.forEach(s=>s.items.forEach(i=>{const f=FMAP[i.n];if(!f)return;const e=m.get(f.name)||{f,q:0};e.q+=i.q;m.set(f.name,e)})));return [...m.values()].sort((a,b)=>a.f.name.localeCompare(b.f.name))}
A.shop=()=>{const l=shopList();modal(`${sheetHead('Shopping list','Everything in this week’s plan, as servings.')}<div>${l.map(e=>`<div class="food"><div class="grow t">${esc(e.f.name)}</div><span class="m">${fmtQ(e.q)} × ${esc(e.f.unit)}</span></div>`).join('')}</div><div class="sf"><button class="btn ghost" data-a="saveShop">${ic('download',16)}Save list</button><button class="btn" data-a="close">Done</button></div>`,{cls:'wide'})};
A.saveShop=async()=>{const txt='Prana weekly shopping list\n\n'+shopList().map(e=>`- ${e.f.name}: ${fmtQ(e.q)} x ${e.f.unit}`).join('\n')+'\n';if(await saveFile('prana-shopping-list.txt',txt,'text/plain'))toast('List saved')};

/* markdown-lite for coach replies */
function md(s){const lines=esc(s).split('\n');let out='',list=null;
 const inl=t=>t.replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/(^|[^*])\*([^*\s][^*]*?)\*(?!\*)/g,'$1<i>$2</i>');
 const close=()=>{if(list){out+=`</${list}>`;list=null}};
 for(const ln of lines){let m;
  if(m=ln.match(/^\s*[-*•]\s+(.*)/)){if(list!=='ul'){close();out+='<ul>';list='ul'}out+=`<li>${inl(m[1])}</li>`}
  else if(m=ln.match(/^\s*\d+[.)]\s+(.*)/)){if(list!=='ol'){close();out+='<ol>';list='ol'}out+=`<li>${inl(m[1])}</li>`}
  else if(!ln.trim())close();
  else{close();const h=ln.match(/^#{1,4}\s+(.*)/);out+=h?`<p><b>${inl(h[1])}</b></p>`:`<p>${inl(ln)}</p>`}}
 close();return out}
let ctl=null;
function coachRules(){
 const p=S.profile,t=body(),today=dkey(),days=[...Array(7)].map((_,i)=>addDays(today,-i)).filter(k=>(S.meals[k]||[]).length);
 const avgK=days.length?sum(days,k=>totals(k).kcal)/days.length:0,avgP=days.length?sum(days,k=>totals(k).p)/days.length:0,ad=adherence(7);
 const lf=flaggedLabs().map(f=>`${f.def.n} ${labFmt(f.def.k,f.l.v)} ${f.def.u} (${f.s.label})`).join('; ')||'none flagged';
 const w=[...S.weights].sort((a,b)=>a.date<b.date?-1:1),wt=w.length>1?`${n1(w[0].kg)} kg on ${w[0].date} to ${n1(w[w.length-1].kg)} kg on ${w[w.length-1].date}`:'not enough data';
 return `You are the wellness coach inside Prana, a health app used in India. Be warm, practical and specific. Suggest everyday Indian foods and simple yoga. You are not a doctor: never diagnose, never advise starting, stopping or changing medicines, and tell the person to see their clinician for symptoms or concerning results. Keep answers under about 220 words, use short paragraphs or a short list, and no headings.

Person: ${p.name||'user'}, age ${p.age}, ${p.sex}, ${p.height} cm, ${n1(t.w)} kg, BMI ${n1(t.bmi)}. Goal: ${GOALS[p.goal]}. Diet: ${DIETS[p.diet]}. Activity: ${ACT[p.activity][0]}. Conditions: ${p.conditions.map(c=>COND[c]).join(', ')||'none noted'}. Allergies: ${p.allergies||'none'}.
Daily targets: ${n0(t.kcal)} kcal, ${t.protein} g protein, ${n1(t.water/1000)} L water.
Last 7 days: average ${n0(avgK)} kcal and ${n0(avgP)} g protein on ${days.length} logged days; medicine adherence ${ad.pct==null?'n/a':Math.round(ad.pct*100)+'%'}; yoga ${sum([...Array(7)].map((_,i)=>addDays(today,-i)),k=>yogaMin(k))} minutes.
Latest flagged labs: ${lf}. Weight trend: ${wt}.`}
async function coachSend(text){
 if(!caps.sample||ui.coaching)return;
 ui.chat.push({role:'user',content:text},{role:'assistant',content:''});ui.coaching=true;ctl=new AbortController();render();
 const hist=ui.chat.slice(0,-1).slice(-12);if(hist[0].role!=='user')hist.shift();
 const turns=hist.map((m,i)=>i===0?{role:'user',content:coachRules()+'\n\nConversation starts here.\n\n'+m.content}:m);
 const last=ui.chat[ui.chat.length-1];
 try{
  const r=await caps.sample(turns,{cache:false,signal:ctl.signal,modelTier:'default',onText:({text})=>{last.content=text;const e=$('#coachLast');if(e){e.innerHTML=md(text);e.scrollIntoView({block:'nearest'})}}});
  last.content=r.text||last.content;
 }catch(e){
  if(e&&e.code==='not_granted'){caps.sample=null;ui.chat=[];ui.planTab='meals';toast('The AI coach needs your permission to run. It is switched off for now.')}
  else if(e&&e.code==='cancelled'){if(!last.content)ui.chat.splice(-2,2)}
  else{if(e&&e.text)last.content=e.text;else ui.chat.splice(-1,1);toast(e&&e.code==='rate_limited'?'Too many questions at once. Please wait a moment.':'The coach could not answer right now. Please try again.',{bad:true})}
 }
 ui.coaching=false;ctl=null;if(view==='plan')render()}
A.coachAsk=el=>coachSend(el.dataset.q);
A.coachSend=()=>{const i=$('#coachIn');if(!i)return;const v=i.value.trim();if(v){i.value='';coachSend(v)}};
A.coachStop=()=>{if(ctl)ctl.abort()};

/* ============ Yoga ============ */
const FILTERS={All:null,Breath:['breath'],Strength:['strength','core'],Flexibility:['flex'],Back:['back'],Digestion:['digest'],Calm:['calm'],Restore:['restore']};
const poseAvoid=p=>p.av.filter(a=>has(a));
const poseCare=p=>p.care.filter(a=>has(a));
function viewYoga(){
 const today=dkey(),wk=[...Array(7)].map((_,i)=>addDays(today,-i)),wmin=sum(wk,yogaMin),ses=sum(wk,k=>(S.yoga[k]||[]).length);
 const r=buildRoutine(ui.yogaMin,ui.yogaTheme,ui.yogaVar),left=POSES.filter(p=>poseAvoid(p).length);
 const dnames=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
 const f=FILTERS[ui.poseF],lib=POSES.filter(p=>!f||p.t.some(x=>f.includes(x)));
 const seqHtml=r.steps.map(({p,secs})=>`<button class="sq" style="padding:0;text-align:left" data-a="poseOpen" data-k="${p.k}"><div class="gl ${gk(p)}">${esc(p.dev.split(' ')[0])}</div><div class="sb"><b>${esc(p.n)}</b>${secs>=60?Math.round(secs/60*10)/10+' min':secs+' s'}${p.sides?', each side':''}</div></button>`).join('');
 return head('Yoga','Daily sessions that adapt to your goal, health conditions and time.',`<button class="btn" data-a="yogaStart">${ic('play',16)}Start practice</button>`)+
 `<div class="grid c3"><div class="stat"><div class="big">${wmin}<span class="m"> min</span></div><div class="m">Practised in the last 7 days</div></div><div class="stat"><div class="big">${ses}</div><div class="m">Sessions in the last 7 days</div></div><div class="stat"><div class="big">${yogaMin(today)}<span class="m"> min</span></div><div class="m">Logged today</div></div></div>
 <div class="panel" style="margin-bottom:18px"><div class="ph"><div><h2>${esc(r.theme)}</h2><p class="sub">${r.minutes} minutes, ${r.steps.length} practices${S.profile.conditions.length?`. Adjusted for ${S.profile.conditions.map(c=>COND[c].toLowerCase()).join(', ')}.`:'.'}</p></div><button class="btn ghost sm" data-a="yogaShuffle">${ic('refresh',14)}Shuffle</button></div>
 <div class="pills" style="margin:12px 0">${[10,20,30,45].map(m=>`<button class="pill ${ui.yogaMin===m?'on':''}" data-a="yogaLen" data-v="${m}">${m} min</button>`).join('')}</div>
 <div class="seq">${seqHtml}</div>
 ${left.length?`<p class="hint">Left out for you: ${left.slice(0,8).map(p=>esc(p.n)).join(', ')}${left.length>8?` and ${left.length-8} more`:''}.</p>`:''}</div>
 <div class="panel" style="margin-bottom:18px"><div class="ph"><div><h2>Weekly rhythm</h2><p class="sub">Each day has a focus. Pick a day to preview its session.</p></div></div><div class="days" style="margin-top:12px">${dnames.map((d,i)=>`<button class="dy ${ui.yogaTheme===i?'on':''}" data-a="yogaTheme" data-v="${i}"><b>${d}</b>${esc(THEMES[i][0].split(' ')[0])}</button>`).join('')}</div></div>
 <div class="panel"><div class="ph"><div><h2>Pose library</h2><p class="sub">${POSES.length} poses and breathing practices. Tap one for steps and cautions.</p></div></div>
 <div class="pills" style="margin:12px 0 16px">${Object.keys(FILTERS).map(k=>`<button class="pill ${ui.poseF===k?'on':''}" data-a="poseFilter" data-v="${k}">${k}</button>`).join('')}</div>
 <div class="grid c3" style="margin:0">${lib.map(p=>`<button class="pose ${poseAvoid(p).length?'skip':''}" data-a="poseOpen" data-k="${p.k}"><div class="gl ${gk(p)}">${esc(p.dev)}</div><div class="pb"><div class="t">${esc(p.n)}</div><div class="m">${esc(p.en)}</div>${poseAvoid(p).length?'<span class="tag bad" style="margin-top:6px">Not advised for you</span>':poseCare(p).length?'<span class="tag warn" style="margin-top:6px">Go gently</span>':''}</div></button>`).join('')}</div></div>
 <p class="hint" style="margin-top:12px">Yoga suggestions are general guidance. Stop if you feel pain, dizziness or breathlessness, and check with your doctor before starting, especially with a heart condition, pregnancy, glaucoma or a recent injury.</p>`}
A.yogaLen=el=>{ui.yogaMin=+el.dataset.v;S.settings.yogaMin=ui.yogaMin;save();render()};
A.yogaShuffle=()=>{ui.yogaVar++;render()};
A.yogaTheme=el=>{ui.yogaTheme=+el.dataset.v;ui.yogaVar=0;render()};
A.poseFilter=el=>{ui.poseF=el.dataset.v;render()};
A.poseOpen=el=>{const p=PMAP[el.dataset.k];if(!p)return;const av=poseAvoid(p),ca=poseCare(p);
 modal(`${sheetHead(p.n,esc(p.en))}<div class="gl ${gk(p)}" style="height:120px;border-radius:18px;font-size:42px;display:grid;place-items:center;margin-bottom:14px">${esc(p.dev)}</div>
 ${av.length?`<div class="why" style="border:0;background:var(--bad-s);border-radius:14px;padding:12px;margin-bottom:12px"><div class="wi" style="color:var(--bad)">${ic('alert',18)}</div><div class="grow"><div class="t">Not advised with your noted conditions</div><div class="m">${av.map(a=>COND[a]).join(', ')}. Prana leaves this out of your routines.</div></div></div>`:''}
 ${ca.length?`<div class="why" style="border:0;background:var(--warn-s);border-radius:14px;padding:12px;margin-bottom:12px"><div class="wi" style="color:var(--warn)">${ic('alert',18)}</div><div class="grow"><div class="t">Go gently</div><div class="m">Because of ${ca.map(a=>COND[a].toLowerCase()).join(', ')}, keep the range small, avoid forcing and stop at any discomfort.</div></div></div>`:''}
 <p style="margin-bottom:12px">${esc(p.b)}</p><div class="lbl">How to do it</div><p style="margin:4px 0 12px">${esc(p.h)}</p>
 <div class="pills">${p.t.map(x=>`<span class="tag">${esc(x)}</span>`).join('')}<span class="tag info">${p.secs>=60?Math.round(p.secs/60*10)/10+' min':p.secs+' s'}${p.sides?' each side':''}</span></div>
 ${p.av.length?`<p class="hint" style="margin-top:12px">Generally avoided in: ${p.av.map(a=>COND[a].toLowerCase()).join(', ')}.</p>`:''}
 <div class="sf"><button class="btn" data-a="close">Close</button></div>`)};

/* guided player */
let pl=null;
const ARC=2*Math.PI*44;
A.yogaStart=()=>{const r=view==='yoga'?buildRoutine(ui.yogaMin,ui.yogaTheme,ui.yogaVar):buildRoutine(S.settings.yogaMin||20,weekIdx(),0);startPlayer(r)};
function startPlayer(r){
 const steps=expandSteps(r.steps);if(!steps.length)return;
 pl={steps,i:0,left:steps[0].secs,paused:false,elapsed:0,theme:r.theme,t:null};
 modal(`<div class="m" id="plMeta" style="color:#9CC7BA"></div><div class="pl-glyph" id="plGlyph"></div><h2 id="plName" style="color:#fff;font-size:30px"></h2><p id="plEn" style="color:#BFDDD3"></p>
 <div class="pl-ring"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="6"/><circle id="plArc" cx="50" cy="50" r="44" fill="none" stroke="#F5B445" stroke-width="6" stroke-linecap="round" stroke-dasharray="${ARC}" stroke-dashoffset="0" transform="rotate(-90 50 50)"/></svg><div class="tt" id="plTime" aria-live="off"></div></div>
 <p id="plHow" style="max-width:54ch;color:#BFDDD3;font-size:15px"></p><p id="plNext" class="m" style="color:#9CC7BA"></p>
 <div class="acts" style="justify-content:center"><button class="ib" data-a="plPrev" aria-label="Previous">${ic('prev',20)}</button><button class="btn" id="plPause" data-a="plPause">${ic('pause',16)}Pause</button><button class="ib" data-a="plNext" aria-label="Next">${ic('skip',20)}</button></div>
 <button class="btn ghost sm" data-a="plQuit">End session</button>`,{cls:'full',close:()=>finishPlayer(false)});
 pl.t=setInterval(playTick,1000);drawPlayer();chime()}
function drawPlayer(){
 if(!pl)return;const s=pl.steps[pl.i],nx=pl.steps[pl.i+1],set=(id,v,h)=>{const e=q('#'+id);if(e)e[h?'innerHTML':'textContent']=v};
 set('plMeta',`${pl.theme}. Step ${pl.i+1} of ${pl.steps.length}${s.label?`, ${s.label.toLowerCase()}`:''}`);set('plGlyph',s.p.dev.split(' ')[0]);set('plName',s.p.n+(s.label?` (${s.label.toLowerCase()})`:''));set('plEn',s.p.en);
 set('plHow',s.p.h);set('plNext',nx?`Next: ${nx.p.n}${nx.label&&nx.p===s.p?' ('+nx.label.toLowerCase()+')':''}`:'Last practice. Take your time.');drawTime()}
function drawTime(){if(!pl)return;const s=pl.steps[pl.i],m=Math.floor(pl.left/60),sec=pl.left%60,t=q('#plTime'),a=q('#plArc');if(t)t.textContent=`${m}:${String(sec).padStart(2,'0')}`;if(a)a.style.strokeDashoffset=ARC*(1-pl.left/s.secs)}
function playTick(){if(!pl||pl.paused)return;pl.left--;pl.elapsed++;if(pl.left<=0){chime();if(pl.i>=pl.steps.length-1){finishPlayer(true);return}pl.i++;pl.left=pl.steps[pl.i].secs;drawPlayer()}else drawTime()}
A.plPause=el=>{if(!pl)return;pl.paused=!pl.paused;el.innerHTML=pl.paused?`${ic('play',16)}Resume`:`${ic('pause',16)}Pause`};
A.plNext=()=>{if(!pl)return;if(pl.i>=pl.steps.length-1){finishPlayer(true);return}pl.i++;pl.left=pl.steps[pl.i].secs;drawPlayer()};
A.plPrev=()=>{if(!pl)return;pl.i=Math.max(0,pl.i-1);pl.left=pl.steps[pl.i].secs;drawPlayer()};
A.plQuit=()=>closeModal();
function finishPlayer(done){
 if(!pl)return;const p=pl;pl=null;clearInterval(p.t);closeModal(true);
 const min=Math.round(p.elapsed/60);
 if(done||min>=1){const d=dkey();(S.yoga[d]=S.yoga[d]||[]).push({id:uid(),theme:p.theme,minutes:Math.max(1,min)});save();toast(done?`Practice complete. ${Math.max(1,min)} min logged. Namaste.`:`${Math.max(1,min)} min logged`)}
 render()}

/* ============ Records ============ */
const guessCat=n=>{n=n.toLowerCase();return /lab|blood|cbc|hba1c|lipid|thyroid|sugar|urine|report/.test(n)?DOC_CATS[0]:/rx|prescri|medicine/.test(n)?DOC_CATS[1]:/xray|x-ray|mri|\bct\b|scan|ultrasound|usg|echo|ecg/.test(n)?DOC_CATS[2]:/discharge/.test(n)?DOC_CATS[4]:/insur|bill|invoice|claim|receipt/.test(n)?DOC_CATS[5]:/vacc|immun/.test(n)?DOC_CATS[6]:/note|consult|opd/.test(n)?DOC_CATS[3]:DOC_CATS[7]};
const catStyle=c=>{const s=CAT_STYLE[c]||CAT_STYLE.Other;return `background:var(--${s[0]});color:var(--${s[1]})`};
function docListHtml(){
 const term=ui.docQ.trim().toLowerCase();
 const list=S.docs.filter(d=>(ui.docCat==='All'||d.cat===ui.docCat)&&(!term||(d.name+' '+d.cat+' '+(d.note||'')).toLowerCase().includes(term))).sort((a,b)=>a.date<b.date?1:a.date>b.date?-1:b.added-a.added);
 if(!list.length)return S.docs.length?`<p class="sub" style="padding:18px 2px">No documents match.</p>`:empty('folder','No documents yet','Drop in lab reports, prescriptions, scans or bills. They stay on this device.');
 return list.map(d=>{const s=CAT_STYLE[d.cat]||CAT_STYLE.Other;return `<div class="row"><div class="fi" style="${catStyle(d.cat)}">${ic(s[2],20)}</div><div class="grow"><div class="t ell">${esc(d.name)}</div><div class="m ell">${esc(d.cat)}, ${fmtDate(d.date)}, ${fmtSize(d.size||0)}${d.note?', '+esc(d.note):''}</div></div><div class="acts">${d.cat===DOC_CATS[0]?`<button class="btn soft sm" data-a="addLabs" data-doc="${d.id}">Add results</button>`:''}<button class="btn ghost sm" data-a="docOpen" data-id="${d.id}">Open</button><button class="ib sm" data-a="docAskDel" data-id="${d.id}" aria-label="Delete ${esc(d.name)}">${ic('trash',15)}</button></div></div>`}).join('')}
function viewRecords(){
 const tab=ui.recTab,seg=`<div class="seg">${[['docs','Documents'],['labs','Lab results'],['body','Body']].map(([k,l])=>`<button class="${tab===k?'on':''}" data-a="recTab" data-v="${k}">${l}</button>`).join('')}</div>`;
 let c='';
 if(tab==='docs'){
  c=`<div class="drop" id="drop"><div class="fi" style="background:var(--tulsi-s);color:var(--tulsi);margin:0 auto 10px">${ic('upload',20)}</div><div class="t">Drop reports here, or choose files</div><p class="m" style="margin:4px 0 14px">PDF, photos and text files. Stored privately on this device, not uploaded anywhere.</p><button class="btn" data-a="pickFiles">${ic('plus',16)}Choose files</button><input type="file" id="fileIn" multiple hidden accept=".pdf,.png,.jpg,.jpeg,.webp,.heic,.txt,.doc,.docx,.csv,image/*,application/pdf"></div>
  <div class="panel" style="margin-top:18px"><div class="ph"><div><h2>Your documents</h2><p class="sub">${S.docs.length} saved</p></div></div>
  <input type="search" id="docSearch" placeholder="Search documents" value="${esc(ui.docQ)}" aria-label="Search documents" style="margin:10px 0">
  <div class="pills" style="margin-bottom:8px">${['All'].concat(DOC_CATS).map(k=>`<button class="pill ${ui.docCat===k?'on':''}" data-a="docCat" data-v="${esc(k)}">${esc(k)}</button>`).join('')}</div>
  <div class="rows" id="docList">${docListHtml()}</div></div>`}
 else if(tab==='labs'){
  const have=LABS.filter(d=>latestLab(d.k));
  c=have.length?`<div class="grid c3">${have.map(d=>{const l=latestLab(d.k),s=labStatus(d.k,l.v),n=labsFor(d.k).length;return `<button class="lab l${s.lvl}" data-a="labOpen" data-k="${d.k}"><div class="flex jb ac"><span class="m">${d.n}</span><span class="m">${fmtDate(l.date,{day:'numeric',month:'short'})}</span></div><div class="mid" style="margin:4px 0 8px">${labFmt(d.k,l.v)} <span class="m">${d.u}</span></div><div class="flex ac gap8 wrap"><span class="tag ${s.lvl===2?'bad':s.lvl===1?'warn':'ok'}">${s.label}</span><span class="m">${n} reading${n>1?'s':''}</span></div></button>`}).join('')}</div>
  <p class="hint">Ranges are typical adult reference values. Your lab’s own ranges and your doctor’s interpretation always take priority.</p>`:`<div class="panel">${empty('chart','No lab results yet','Type in values from a blood report. Prana flags what is outside the typical range and adjusts your food and yoga advice.',`<button class="btn" data-a="addLabs">${ic('plus',16)}Add lab results</button>`)}</div>`}
 else{
  const ws=[...S.weights].sort((a,b)=>a.date<b.date?-1:1),t=body(),h=num(S.profile.height,165)/100,lo=18.5*h*h,hi=22.9*h*h;
  c=`<div class="grid c2"><div class="panel"><div class="ph"><div><h2>Weight</h2><p class="sub">Healthy range for your height is about ${n1(lo)} to ${n1(hi)} kg</p></div></div>
  ${ws.length>1?`<div style="margin-top:12px">${line(ws.map(w=>({x:w.date,y:w.kg})),{band:[lo,hi]})}</div>`:`<p class="sub" style="margin:12px 0">Log your weight once a week to see the trend.</p>`}
  <div class="flex gap8 ac wrap" style="margin-top:14px"><input type="number" id="wKg" step="0.1" min="25" max="250" placeholder="kg" style="width:110px" aria-label="Weight in kg" value="${n1(t.w)}"><input type="date" id="wDate" value="${dkey()}" max="${dkey()}" style="width:auto" aria-label="Date"><button class="btn" data-a="addWeight">Log weight</button></div></div>
  <div class="panel"><div class="ph"><div><h2>History</h2><p class="sub">BMI ${n1(t.bmi)}, ${bmiCat(t.bmi)[0].toLowerCase()}</p></div></div>${ws.length?`<div class="rows" style="max-height:340px;overflow:auto">${[...ws].reverse().map(w=>`<div class="row"><div class="grow t">${n1(w.kg)} kg</div><span class="m">${fmtDate(w.date)}</span><button class="ib sm" data-a="delWeight" data-d="${w.date}" aria-label="Delete entry">${ic('trash',14)}</button></div>`).join('')}</div>`:`<p class="sub" style="margin-top:12px">No entries yet.</p>`}</div></div>`}
 const act=tab==='labs'?`<button class="btn" data-a="addLabs">${ic('plus',18)}Add results</button>`:'';
 return head('Records','Your reports, lab values and body measurements in one private place.',act)+`<div style="margin-bottom:18px">${seg}</div>`+c}
A.recTab=el=>{ui.recTab=el.dataset.v;render()};
A.docCat=el=>{ui.docCat=el.dataset.v;render()};
A.pickFiles=()=>{const i=$('#fileIn');if(i)i.click()};
function handleFiles(files){
 const ok=[...files].filter(f=>{if(f.size>25*1048576){toast(`${f.name} is larger than 25 MB and was skipped.`,{bad:true});return false}return true});
 if(!ok.length)return;ui.pending=ok;
 modal(`${sheetHead(ok.length>1?`Add ${ok.length} documents`:'Add document','Check the details so you can find it later.')}
 ${ok.map((f,i)=>`<div class="panel" style="padding:14px;margin-bottom:12px"><div class="field"><label for="dn${i}">Name</label><input type="text" id="dn${i}" value="${esc(f.name.replace(/\.[^.]+$/,''))}"></div><div class="two"><div class="field"><label for="dc${i}">Type</label><select id="dc${i}">${DOC_CATS.map(c=>`<option ${c===guessCat(f.name)?'selected':''}>${esc(c)}</option>`).join('')}</select></div><div class="field"><label for="dd${i}">Report date</label><input type="date" id="dd${i}" value="${dkey()}" max="${dkey()}"></div></div><div class="field" style="margin-bottom:0"><label for="dnote${i}">Note (optional)</label><input type="text" id="dnote${i}" placeholder="Doctor, hospital or what it was for"></div></div>`).join('')}
 <div class="sf"><button class="btn ghost" data-a="close">Cancel</button><button class="btn" data-a="saveDocs">Save to Prana</button></div>`,{cls:'wide'})}
A.saveDocs=async()=>{
 const fs=ui.pending||[],rows=fs.map((f,i)=>({f,name:qv('#dn'+i).trim()||f.name,cat:qv('#dc'+i),date:qv('#dd'+i)||dkey(),note:qv('#dnote'+i).trim()}));
 let lastLab=null;
 for(const r of rows){const id=uid();await idb.put(id,r.f);S.docs.push({id,name:r.name,cat:r.cat,date:r.date,file:r.f.name,size:r.f.size,type:r.f.type||'',note:r.note,added:Date.now()});if(r.cat===DOC_CATS[0])lastLab=id}
 save();ui.pending=null;closeModal(true);ui.recTab='docs';render();
 toast(`${rows.length} document${rows.length>1?'s':''} saved`,lastLab?{act:'addLabs',k:lastLab,label:'Add results',ms:8000}:{})};
let pvUrl=null;
A.docOpen=async el=>{
 const d=S.docs.find(x=>x.id===el.dataset.id);if(!d)return;
 modal(`${sheetHead(d.name,`${esc(d.cat)}, ${fmtDate(d.date)}`)}<div id="pv" class="empty"><span class="spin"></span></div>${d.note?`<p class="m" style="margin-top:10px">${esc(d.note)}</p>`:''}<div class="sf"><button class="btn ghost" data-a="docSave" data-id="${d.id}">${ic('download',16)}Save a copy</button><button class="btn" data-a="close">Close</button></div>`,{cls:'wide',close:()=>{if(pvUrl){URL.revokeObjectURL(pvUrl);pvUrl=null}}});
 const blob=await idb.get(d.id),pv=q('#pv');if(!pv)return;
 if(!blob){pv.className='';pv.innerHTML='<p class="sub">This file is no longer stored on this device. It may have been cleared by the browser.</p>';return}
 const nm=(d.file||d.name).toLowerCase(),type=blob.type||d.type||'';pv.className='';
 try{
  if(/^image\//.test(type)||/\.(png|jpe?g|webp|gif)$/.test(nm)){const u=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(blob)});pv.innerHTML=`<img class="pvimg" alt="${esc(d.name)}" src="${u}">`}
  else if(/pdf/.test(type)||/\.pdf$/.test(nm)){pvUrl=URL.createObjectURL(blob);pv.innerHTML=`<iframe class="preview" src="${pvUrl}" title="${esc(d.name)}"></iframe><p class="hint" style="margin-top:8px">If the preview is blank, use Save a copy to open it in your PDF app.</p>`}
  else if(/^text\//.test(type)||/\.(txt|csv)$/.test(nm)){const tx=await blob.text();pv.innerHTML=`<pre class="pvtxt">${esc(tx)}</pre>`}
  else pv.innerHTML='<p class="sub">Preview is not available for this file type. Use Save a copy to open it.</p>';
 }catch(e){pv.innerHTML='<p class="sub">Could not preview this file.</p>'}};
A.docSave=async el=>{const d=S.docs.find(x=>x.id===el.dataset.id);if(!d)return;const b=await idb.get(d.id);if(!b){toast('File not found on this device.',{bad:true});return}
 const ext=((d.file||'').match(/\.[A-Za-z0-9]+$/)||[''])[0]||(/pdf/.test(b.type)?'.pdf':/png/.test(b.type)?'.png':/jpe?g/.test(b.type)?'.jpg':'.txt');
 const fn=d.name.replace(/[^\w\- ]+/g,'').trim().replace(/\s+/g,'-')+ext;if(await saveFile(fn,b,b.type))toast('Copy saved')};
function confirmBox(title,text,act,btn,data){modal(`${sheetHead(title)}<p>${text}</p><div class="sf"><button class="btn ghost" data-a="close">Cancel</button><button class="btn danger" data-a="${act}" ${Object.entries(data||{}).map(([k,v])=>`data-${k}="${esc(v)}"`).join(' ')}>${btn}</button></div>`)}
A.docAskDel=el=>{const d=S.docs.find(x=>x.id===el.dataset.id);if(d)confirmBox('Delete this document?',`“${esc(d.name)}” will be removed from this device. This cannot be undone.`,'docDel','Delete',{id:d.id})};
A.docDel=async el=>{const id=el.dataset.id;S.docs=S.docs.filter(x=>x.id!==id);S.labs.forEach(l=>{if(l.doc===id)l.doc=''});save();await idb.del(id);closeModal(true);render();toast('Document deleted')};

/* labs */
function labForm(docId){
 const docs=S.docs.filter(d=>d.cat===DOC_CATS[0]);
 modal(`${sheetHead('Add lab results','Fill in only the values on your report.')}
 <div class="two"><div class="field"><label for="lDate">Report date</label><input type="date" id="lDate" value="${dkey()}" max="${dkey()}"></div><div class="field"><label for="lDoc">Linked document</label><select id="lDoc"><option value="">None</option>${docs.map(d=>`<option value="${d.id}" ${d.id===docId?'selected':''}>${esc(d.name)}</option>`).join('')}</select></div></div>
 <div class="two">${LABS.map(d=>`<div class="field"><label for="lab_${d.k}">${d.n} <span class="hint">(${d.u})</span></label><input type="number" id="lab_${d.k}" step="any" min="0" inputmode="decimal" placeholder="${esc(d.ref)}"></div>`).join('')}</div>
 <div class="sf"><button class="btn ghost" data-a="close">Cancel</button><button class="btn" data-a="saveLabs">Save results</button></div>`,{cls:'wide'})}
A.addLabs=el=>labForm(el&&el.dataset?(el.dataset.doc||el.dataset.k||''):'');
A.saveLabs=()=>{const date=qv('#lDate')||dkey(),doc=qv('#lDoc');let n=0;
 LABS.forEach(d=>{const raw=qv('#lab_'+d.k);if(raw==='')return;const v=num(raw,NaN);if(!Number.isFinite(v))return;S.labs=S.labs.filter(l=>!(l.k===d.k&&l.date===date));S.labs.push({id:uid(),k:d.k,date,v,doc});n++});
 if(!n){toast('Enter at least one value.',{bad:true});return}save();closeModal(true);ui.recTab='labs';if(view!=='records'&&view!=='today'&&view!=='plan')view='records';render();toast(`${n} result${n>1?'s':''} saved. Your plan has been updated.`)};
A.labOpen=el=>{const def=LMAP[el.dataset.k],arr=labsFor(def.k);if(!arr.length)return;const last=arr[arr.length-1],s=labStatus(def.k,last.v);
 const bands=def.r(S.profile.sex);let prev=0;const ok=[];bands.forEach(b=>{if(b[2]===0)ok.push([prev,b[0]]);prev=b[0]});
 let band=null;if(ok.length){let lo=ok[0][0],hi=ok[ok.length-1][1];if(hi>=900)hi=Math.max(lo*1.4,last.v);if(lo===0)lo=hi*.6;band=[lo,hi]}
 modal(`${sheetHead(def.n,`Typical range: ${esc(def.ref)} ${def.u}`)}<div class="flex ac gap8" style="margin-bottom:10px"><span class="big">${labFmt(def.k,last.v)}</span><span class="m">${def.u}</span><span class="tag ${s.lvl===2?'bad':s.lvl===1?'warn':'ok'}">${s.label}</span></div>
 ${arr.length>1?line(arr.map(a=>({x:a.date,y:a.v})),{band}):'<p class="sub">Add another result to see a trend.</p>'}
 ${s.lvl>0&&TIPS[def.k]?`<div class="say" style="margin:14px 0"><b>What can help:</b> ${esc(TIPS[def.k])}<br><span class="m">Share this result with your doctor before making changes.</span></div>`:''}
 <div class="lbl" style="margin-top:12px">History</div><div class="rows">${[...arr].reverse().map(a=>{const st=labStatus(def.k,a.v);return `<div class="row"><div class="grow t">${labFmt(def.k,a.v)} ${def.u}</div><span class="tag ${st.lvl===2?'bad':st.lvl===1?'warn':'ok'}">${st.label}</span><span class="m">${fmtDate(a.date)}</span><button class="ib sm" data-a="delLab" data-id="${a.id}" aria-label="Delete reading">${ic('trash',14)}</button></div>`}).join('')}</div>
 <div class="sf"><button class="btn" data-a="close">Close</button></div>`,{cls:'wide'})};
A.delLab=el=>{const l=S.labs.find(x=>x.id===el.dataset.id);if(!l)return;S.labs=S.labs.filter(x=>x.id!==l.id);save();closeModal(true);render();toast('Reading deleted')};

/* weight */
function logWeight(date,kg){S.weights=S.weights.filter(w=>w.date!==date);S.weights.push({date,kg:Math.round(kg*10)/10})}
A.addWeight=()=>{const kg=num($('#wKg').value),date=$('#wDate').value||dkey();if(kg<25||kg>250){toast('Enter a weight between 25 and 250 kg.',{bad:true});return}logWeight(date,kg);save();render();toast('Weight logged')};
A.delWeight=el=>{S.weights=S.weights.filter(w=>w.date!==el.dataset.d);save();render()};

/* ============ Profile and settings ============ */
const optList=(o,sel)=>Object.entries(o).map(([k,v])=>`<option value="${k}" ${k===sel?'selected':''}>${esc(Array.isArray(v)?v[0]:v)}</option>`).join('');
const condPills=sel=>`<div class="pills" id="pConds">${Object.entries(COND).map(([k,l])=>`<button class="pill ${sel.includes(k)?'on':''}" data-a="tog" data-c="${k}">${esc(l)}</button>`).join('')}</div>`;
function profileModal(){
 const p=S.profile;
 modal(`${sheetHead('Profile and settings','Everything is stored on this device only.')}
 <div class="two"><div class="field"><label for="pName">Name</label><input type="text" id="pName" value="${esc(p.name)}"></div><div class="field"><label for="pAge">Age</label><input type="number" id="pAge" min="10" max="100" value="${p.age}"></div></div>
 <div class="three"><div class="field"><label for="pSex">Sex</label><select id="pSex">${optList({female:'Female',male:'Male',other:'Other'},p.sex)}</select></div><div class="field"><label for="pHeight">Height (cm)</label><input type="number" id="pHeight" value="${p.height}"></div><div class="field"><label for="pWeight">Weight (kg)</label><input type="number" id="pWeight" step="0.1" value="${n1(latestWeight())}"></div></div>
 <div class="field"><label for="pAct">Activity</label><select id="pAct">${optList(ACT,p.activity)}</select></div>
 <div class="two"><div class="field"><label for="pGoal">Goal</label><select id="pGoal">${optList(GOALS,p.goal)}</select></div><div class="field"><label for="pDiet">Diet</label><select id="pDiet">${optList(DIETS,p.diet)}</select></div></div>
 <div class="field"><span class="lbl">Health conditions</span>${condPills(p.conditions)}<span class="hint">Used to filter foods and yoga. Not a diagnosis.</span></div>
 <div class="field"><label for="pAll">Food allergies or intolerances</label><input type="text" id="pAll" value="${esc(p.allergies)}" placeholder="e.g. peanuts, lactose, gluten"></div>
 <div class="field"><span class="lbl">Appearance</span><div class="seg">${[['auto','Auto'],['light','Light'],['dark','Dark']].map(([k,l])=>`<button class="${S.settings.theme===k?'on':''}" data-a="setTheme" data-v="${k}">${l}</button>`).join('')}</div></div>
 <div class="field"><span class="lbl">Reminders</span><div class="flex ac gap8 wrap"><button class="btn ${S.settings.notify?'soft':'ghost'} sm" data-a="notif">${ic('bell',15)}${S.settings.notify?'Notifications on':'Enable notifications'}</button><span class="hint">Dose reminders always show in the app while it is open.</span></div></div>
 <div class="sf" style="margin-bottom:18px"><button class="btn ghost" data-a="close">Cancel</button><button class="btn" data-a="saveProfile">Save profile</button></div>
 <div class="panel" style="padding:16px"><h3 style="font-size:16px;margin-bottom:10px">Your data</h3><div class="acts"><button class="btn ghost sm" data-a="exportSummary">${ic('file',15)}Health summary</button><button class="btn ghost sm" data-a="backup">${ic('download',15)}Backup</button><button class="btn ghost sm" data-a="restorePick">${ic('upload',15)}Restore</button><button class="btn soft sm" data-a="sampleAsk">${ic('spark',15)}Load sample data</button><button class="btn danger sm" data-a="eraseAsk">${ic('trash',15)}Erase all</button></div><input type="file" id="restoreIn" accept=".json,application/json" hidden>
 <p class="hint" style="margin-top:10px">Backups include your profile, medicines, logs and lab values. Document files stay on this device, so save copies of important ones.</p></div>
 <p class="hint" style="margin-top:14px">Prana offers general wellness guidance and is not medical advice. It does not diagnose conditions or replace your doctor. Never change or stop a prescribed medicine because of this app.</p>`,{cls:'wide'})}
A.setTheme=el=>{S.settings.theme=el.dataset.v;save();applyTheme();$$('.seg button[data-a="setTheme"]',ov).forEach(b=>b.classList.toggle('on',b===el))};
A.notif=async el=>{
 if(S.settings.notify){S.settings.notify=false;save();el.className='btn ghost sm';el.innerHTML=`${ic('bell',15)}Enable notifications`;return}
 if(!('Notification' in window)){toast('This browser does not support notifications. In-app reminders still work.',{bad:true});return}
 try{const r=Notification.permission==='granted'?'granted':await Notification.requestPermission();if(r==='granted'){S.settings.notify=true;save();el.className='btn soft sm';el.innerHTML=`${ic('bell',15)}Notifications on`}else toast('Notifications were not allowed. In-app reminders still work.')}catch(e){toast('Notifications are unavailable here. In-app reminders still work.')}};
A.saveProfile=()=>{
 const age=num(qv('#pAge')),h=num(qv('#pHeight')),w=num(qv('#pWeight'));
 if(age<10||age>100||h<100||h>230||w<25||w>250){toast('Please check your age, height and weight.',{bad:true});return}
 const oldW=latestWeight();
 Object.assign(S.profile,{name:qv('#pName').trim(),age,sex:qv('#pSex'),height:h,weight:w,activity:qv('#pAct'),goal:qv('#pGoal'),diet:qv('#pDiet'),allergies:qv('#pAll').trim(),conditions:$$('#pConds .pill.on',ov).map(b=>b.dataset.c)});
 if(Math.abs(w-oldW)>.04)logWeight(dkey(),w);
 save();closeModal(true);render();toast('Profile saved. Your plan has been updated.')};

function summaryText(){
 const p=S.profile,t=body(),ad=adherence(30),L=[];
 L.push('PRANA HEALTH SUMMARY',`Generated ${fmtDate(dkey())}`,'This is a self-recorded summary for discussion with a clinician. It is not medical advice.','');
 L.push('PROFILE',`Name: ${p.name||'n/a'}`,`Age: ${p.age}, Sex: ${p.sex}, Height: ${p.height} cm, Weight: ${n1(t.w)} kg, BMI: ${n1(t.bmi)} (${bmiCat(t.bmi)[0]})`,`Goal: ${GOALS[p.goal]}, Diet: ${DIETS[p.diet]}`,`Conditions noted: ${p.conditions.map(c=>COND[c]).join(', ')||'none'}`,`Allergies: ${p.allergies||'none'}`,'');
 L.push('DAILY TARGETS USED',`Calories: ${n0(t.kcal)} kcal, Protein: ${t.protein} g, Water: ${n1(t.water/1000)} L`,'');
 L.push('MEDICINES');if(!S.meds.length)L.push('None recorded');S.meds.forEach(m=>L.push(`- ${m.name} ${m.dose||''} (${m.form||''}), ${m.times.map(fmtTime).join(', ')}, ${m.timing||''}${m.days&&m.days.length?', '+m.days.map(i=>DAYN[i]).join('/'):', daily'}${m.paused?' [paused]':''}${m.notes?'. '+m.notes:''}`));
 L.push(`Adherence, last 30 days: ${ad.pct==null?'n/a':Math.round(ad.pct*100)+'% ('+ad.taken+' of '+ad.total+' doses)'}`,'');
 L.push('LATEST LAB RESULTS');let any=false;LABS.forEach(d=>{const l=latestLab(d.k);if(!l)return;any=true;const s=labStatus(d.k,l.v);L.push(`- ${d.n}: ${labFmt(d.k,l.v)} ${d.u} (${s.label}), ${fmtDate(l.date)}, typical ${d.ref}`)});if(!any)L.push('None recorded');L.push('');
 const ws=[...S.weights].sort((a,b)=>a.date<b.date?-1:1).slice(-8);L.push('WEIGHT LOG');if(!ws.length)L.push('None recorded');ws.forEach(w=>L.push(`- ${fmtDate(w.date)}: ${n1(w.kg)} kg`));
 const days=[...Array(7)].map((_,i)=>addDays(dkey(),-i)).filter(k=>(S.meals[k]||[]).length);
 if(days.length)L.push('',`FOOD, last 7 logged days: average ${n0(sum(days,k=>totals(k).kcal)/days.length)} kcal and ${n0(sum(days,k=>totals(k).p)/days.length)} g protein`);
 L.push('',`DOCUMENTS ON FILE: ${S.docs.length}`);S.docs.slice(0,20).forEach(d=>L.push(`- ${d.name} (${d.cat}, ${fmtDate(d.date)})`));
 return L.join('\n')+'\n'}
A.exportSummary=async()=>{if(await saveFile('prana-health-summary.txt',summaryText(),'text/plain'))toast('Summary saved')};
A.backup=async()=>{if(await saveFile(`prana-backup-${dkey()}.json`,JSON.stringify(S,null,1),'application/json'))toast('Backup saved')};
A.restorePick=()=>{const i=q('#restoreIn');if(i)i.click()};
async function restoreFile(f){
 try{const o=JSON.parse(await f.text());if(!o||typeof o!=='object'||!o.profile||!Array.isArray(o.meds))throw 0;
  const d=DEFAULT();S=Object.assign(d,o,{profile:Object.assign(d.profile,o.profile),settings:Object.assign(d.settings,o.settings||{})});S.customFoods=S.customFoods||[];S.profile.onboarded=true;save();applyTheme();closeModal(true);render();toast('Backup restored. Document files are not part of backups.')}
 catch(e){toast('That file is not a Prana backup.',{bad:true})}}
A.eraseAsk=()=>confirmBox('Erase everything?','Your profile, medicines, logs, lab values and stored documents will be removed from this device. Consider saving a backup first.','erase','Erase all data');
A.erase=async()=>{const ids=S.docs.map(d=>d.id);for(const id of ids)await idb.del(id);S=DEFAULT();S.customFoods=[];save();applyTheme();ui.animated=false;ui.chat=[];view='today';closeModal(true);render();onboard()};
A.sampleAsk=()=>{const has_=S.meds.length||S.docs.length||Object.keys(S.meals).length;if(has_)confirmBox('Replace with sample data?','This swaps your current data for a sample profile (Aarav) so you can explore. Save a backup first if you want to keep yours.','sampleGo','Load sample');else A.sampleGo()};
A.sampleGo=async()=>{closeModal(true);await fillSample();ui.animated=false;view='today';render();toast('Sample data loaded. Explore every tab, then erase it from Profile when you are done.',{ms:6000})};

/* ============ Onboarding ============ */
const OB={step:0,d:null};
function onboard(){OB.step=0;OB.d=Object.assign({},S.profile,{conditions:[...S.profile.conditions]});obShow()}
function obShow(){
 const d=OB.d,dots=`<div class="flex gap8" style="margin-bottom:14px">${[0,1,2].map(i=>`<i style="height:5px;flex:1;border-radius:9px;background:${i<=OB.step?'var(--tulsi)':'var(--line)'}"></i>`).join('')}</div>`;
 let h='';
 if(OB.step===0)h=`<div class="pl-ring" style="display:none"></div><h2 style="font-size:28px">Welcome to Prana</h2><p class="sub" style="margin:6px 0 16px">Your medicines, meals, reports and yoga in one calm place. Tell us a little so we can personalise it. Your data never leaves this device.</p>
 <div class="two"><div class="field"><label for="pName">First name</label><input type="text" id="pName" value="${esc(d.name)}" autofocus></div><div class="field"><label for="pAge">Age</label><input type="number" id="pAge" min="10" max="100" value="${d.age}"></div></div>
 <div class="three"><div class="field"><label for="pSex">Sex</label><select id="pSex">${optList({female:'Female',male:'Male',other:'Other'},d.sex)}</select></div><div class="field"><label for="pHeight">Height (cm)</label><input type="number" id="pHeight" value="${d.height}"></div><div class="field"><label for="pWeight">Weight (kg)</label><input type="number" id="pWeight" step="0.1" value="${d.weight}"></div></div>`;
 else if(OB.step===1)h=`<h2 style="font-size:26px">Your lifestyle and goal</h2><p class="sub" style="margin:6px 0 16px">This sets your calorie, protein and water targets.</p>
 <div class="field"><label for="pAct">How active are you?</label><select id="pAct">${optList(ACT,d.activity)}</select></div><div class="field"><label for="pGoal">Main goal</label><select id="pGoal">${optList(GOALS,d.goal)}</select></div><div class="field"><label for="pDiet">What do you eat?</label><select id="pDiet">${optList(DIETS,d.diet)}</select></div>`;
 else h=`<h2 style="font-size:26px">Health conditions</h2><p class="sub" style="margin:6px 0 14px">Optional. Select any that apply so food and yoga suggestions stay safe for you.</p>${condPills(d.conditions)}<div class="field" style="margin-top:14px"><label for="pAll">Food allergies (optional)</label><input type="text" id="pAll" value="${esc(d.allergies)}" placeholder="e.g. peanuts, lactose"></div><p class="hint">Prana gives general wellness guidance, not medical advice. Always follow your doctor.</p>`;
 const foot=OB.step<2?`<div class="sf">${OB.step?`<button class="btn ghost" data-a="obBack">Back</button>`:''}<button class="btn" data-a="obNext">Continue</button></div>`:`<div class="sf"><button class="btn ghost" data-a="obBack">Back</button><button class="btn soft" data-a="obDone" data-v="sample">${ic('spark',15)}Explore with sample data</button><button class="btn" data-a="obDone" data-v="fresh">Start fresh</button></div>`;
 modal(dots+h+foot,{});}
function obCollect(){const g=id=>{const e=q('#'+id);return e?e.value:null},d=OB.d;
 if(OB.step===0){const age=num(g('pAge')),h=num(g('pHeight')),w=num(g('pWeight'));if(age<10||age>100||h<100||h>230||w<25||w>250){toast('Please check your age, height and weight.',{bad:true});return false}Object.assign(d,{name:g('pName').trim(),age,sex:g('pSex'),height:h,weight:w})}
 else if(OB.step===1)Object.assign(d,{activity:g('pAct'),goal:g('pGoal'),diet:g('pDiet')});
 else Object.assign(d,{allergies:(g('pAll')||'').trim(),conditions:$$('#pConds .pill.on',ov).map(b=>b.dataset.c)});
 return true}
A.obNext=()=>{if(obCollect()){OB.step++;obShow()}};
A.obBack=()=>{obCollect();OB.step=Math.max(0,OB.step-1);obShow()};
A.obDone=async el=>{if(!obCollect())return;Object.assign(S.profile,OB.d,{onboarded:true});logWeight(dkey(),num(OB.d.weight,65));save();closeModal(true);
 if(el.dataset.v==='sample'){await fillSample();ui.animated=false}
 render();toast(el.dataset.v==='sample'?'Sample data loaded. Erase it from Profile any time.':'All set. Start by adding your medicines or logging a meal.',{ms:5000})};

/* ============ Sample data ============ */
async function fillSample(){
 for(const d of S.docs)await idb.del(d.id);
 const keep=S.settings,today=dkey(),rnd=rng(20260402),D=DEFAULT();
 S=Object.assign(D,{profile:Object.assign(D.profile,{name:'Aarav Sharma',age:34,sex:'male',height:172,weight:80,activity:'light',goal:'lose',diet:'vegetarian',conditions:['diabetes','cholesterol','stress'],allergies:'',onboarded:true}),settings:Object.assign(D.settings,{theme:keep.theme,notify:keep.notify})});
 S.customFoods=[];const st=addDays(today,-30);
 S.meds=[{id:uid(),name:'Metformin',dose:'500 mg',form:'Tablet',times:['08:00','20:00'],timing:'After food',days:[],start:st,end:'',stock:38,per:1,notes:'For blood sugar, as prescribed',color:MCOL[0],paused:false},
  {id:uid(),name:'Atorvastatin',dose:'10 mg',form:'Tablet',times:['21:30'],timing:'At bedtime',days:[],start:st,end:'',stock:4,per:1,notes:'For cholesterol',color:MCOL[1],paused:false},
  {id:uid(),name:'Vitamin D3',dose:'60,000 IU',form:'Capsule',times:['09:00'],timing:'After food',days:[0],start:st,end:'',stock:6,per:1,notes:'Weekly, on Sundays',color:MCOL[3],paused:false}];
 for(let i=14;i>=1;i--){const date=addDays(today,-i),L=S.medLog[date]={};doses(date).forEach(d=>{const r=rnd();if(r<.86)L[d.key]={s:'taken',at:date+'T'+d.time+':00'};else if(r<.92)L[d.key]={s:'skipped',at:date+'T'+d.time+':00'}})}
 {const L=S.medLog[today]={};doses(today).forEach(d=>{if(toMin(d.time)<nowMin()-130)L[d.key]={s:'taken',at:new Date().toISOString()}})}
 ensurePlan(true);const plan=S.plan;
 for(let i=6;i>=1;i--){const date=addDays(today,-i),day=plan.days[(i*3)%7],list=S.meals[date]=[];
  day.slots.forEach(s=>{const slot=s.key.startsWith('snack')?'snack':s.key;s.items.forEach(it=>{if(rnd()<.12)return;const f=FMAP[it.n];if(!f)return;const q=Math.max(.5,Math.round(it.q*(.75+rnd()*.35)*2)/2);list.push({id:uid(),slot,name:f.name,unit:f.unit,kcal:f.kcal,p:f.p,c:f.c,f:f.f,q})})})}
 if(new Date().getHours()>=9){const b=plan.days[weekIdx()].slots[0],list=S.meals[today]=[];b.items.forEach(it=>{const f=FMAP[it.n];if(f)list.push({id:uid(),slot:'breakfast',name:f.name,unit:f.unit,kcal:f.kcal,p:f.p,c:f.c,f:f.f,q:Math.max(.5,Math.round(it.q*2)/2)})})}
 for(let i=6;i>=1;i--)S.water[addDays(today,-i)]=1500+Math.floor(rnd()*5)*250;S.water[today]=750;
 [84.2,83.6,83.1,82.5,82,81.2,80.6,80].forEach((kg,j)=>S.weights.push({date:addDays(today,-7*(7-j)),kg}));
 const d1=addDays(today,-120),d2=addDays(today,-14),v1={hba1c:6.4,fbs:118,tc:228,ldl:148,hdl:38,tg:210,vitd:16,b12:260,sys:138,dia:88},v2={hba1c:5.9,fbs:104,tc:204,ldl:124,hdl:41,tg:168,vitd:24,b12:340,sys:128,dia:82};
 const labDoc=uid(),rxDoc=uid();
 Object.keys(v1).forEach(k=>{S.labs.push({id:uid(),k,date:d1,v:v1[k],doc:''});S.labs.push({id:uid(),k,date:d2,v:v2[k],doc:labDoc})});
 const t1=`SAMPLE BLOOD REPORT\nPatient: Aarav Sharma, 34 M\nDate: ${d2}\n\nHbA1c: 5.9 %\nFasting glucose: 104 mg/dL\nTotal cholesterol: 204 mg/dL\nLDL: 124 mg/dL\nHDL: 41 mg/dL\nTriglycerides: 168 mg/dL\nVitamin D: 24 ng/mL\nVitamin B12: 340 pg/mL\n\nThis is made-up demo content.\n`;
 const t2=`SAMPLE PRESCRIPTION\nDr. R. Mehta, General Medicine\nDate: ${st}\n\n1. Metformin 500 mg, one tablet twice daily after food\n2. Atorvastatin 10 mg, one tablet at bedtime\n3. Vitamin D3 60,000 IU, one capsule weekly\n\nReview after 3 months with repeat HbA1c and lipid profile.\nThis is made-up demo content.\n`;
 await idb.put(labDoc,new Blob([t1],{type:'text/plain'}));await idb.put(rxDoc,new Blob([t2],{type:'text/plain'}));
 S.docs=[{id:labDoc,name:'Blood report, HbA1c and lipid profile',cat:DOC_CATS[0],date:d2,file:'blood-report.txt',size:t1.length,type:'text/plain',note:'Sample document',added:Date.now()},{id:rxDoc,name:'Prescription, Dr. Mehta',cat:DOC_CATS[1],date:st,file:'prescription.txt',size:t2.length,type:'text/plain',note:'Sample document',added:Date.now()-1}];
 S.yoga[addDays(today,-1)]=[{id:uid(),theme:'Breath and balance',minutes:20}];S.yoga[addDays(today,-3)]=[{id:uid(),theme:'Strength and stamina',minutes:25}];S.yoga[addDays(today,-5)]=[{id:uid(),theme:'Restore and reset',minutes:15}];
 S.plan=null;ensurePlan();save();applyTheme()}

/* ============ reminders ============ */
const fired=new Set();let lastMinute=-1;
function tick(){
 const date=dkey(),n=nowMin();
 doses(date).forEach(d=>{const t=toMin(d.time),id=date+d.key;
  if(n>=t&&n<t+120&&!fired.has(id)&&doseState(d,date)!=='taken'&&doseState(d,date)!=='skipped'){fired.add(id);
   toast(`Time for ${d.med.name} ${d.med.dose||''} (${d.med.timing||'as directed'})`,{act:'takeNow',k:d.key,label:'Taken',ms:20000});chime();
   if(S.settings.notify&&'Notification' in window&&Notification.permission==='granted'){try{new Notification('Prana: medicine time',{body:`${d.med.name} ${d.med.dose||''}, ${d.med.timing||''}`,tag:id})}catch(e){}}}});
 if(n!==lastMinute){lastMinute=n;if(!ov&&(view==='today'||view==='meds'))render()}}

/* ============ wiring ============ */
const VIEWS={today:viewToday,meds:viewMeds,food:viewFood,plan:viewPlan,yoga:viewYoga,records:viewRecords};
document.addEventListener('click',e=>{const el=e.target.closest('[data-a]');if(!el)return;const f=A[el.dataset.a];if(!f)return;e.preventDefault();
 try{const r=f(el,e);if(r&&r.catch)r.catch(err=>{console.error(err);toast('Something went wrong. Please try again.',{bad:true})})}catch(err){console.error(err);toast('Something went wrong. Please try again.',{bad:true})}});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&ov)closeModal();
 if(e.key==='Enter'&&!e.shiftKey&&e.target&&e.target.id==='coachIn'){e.preventDefault();A.coachSend()}});
document.addEventListener('change',e=>{const t=e.target;
 if(t.id==='fileIn'){if(t.files&&t.files.length)handleFiles(t.files);t.value=''}
 else if(t.id==='restoreIn'){if(t.files&&t.files[0])restoreFile(t.files[0]);t.value=''}});
document.addEventListener('input',e=>{if(e.target.id==='docSearch'){ui.docQ=e.target.value;const l=$('#docList');if(l)l.innerHTML=docListHtml()}});
document.addEventListener('dragover',e=>{const d=e.target.closest&&e.target.closest('#drop');if(d){e.preventDefault();d.classList.add('over')}});
document.addEventListener('dragleave',e=>{const d=e.target.closest&&e.target.closest('#drop');if(d)d.classList.remove('over')});
document.addEventListener('drop',e=>{const d=e.target.closest&&e.target.closest('#drop');if(d){e.preventDefault();d.classList.remove('over');if(e.dataTransfer&&e.dataTransfer.files.length)handleFiles(e.dataTransfer.files)}});

/* ============ init ============ */
applyTheme();$('#brandIc').innerHTML=ic('lotus',22);
render();
if(!S.profile.onboarded)onboard();
setInterval(tick,20000);setTimeout(tick,1500);
(async()=>{try{
 if(window.claude&&typeof window.claude.use==='function'){
  const [s,d]=await Promise.all([window.claude.use('sample').catch(()=>null),window.claude.use('downloads').catch(()=>null)]);
  caps.sample=s||null;caps.downloads=d||null;
  if(!ov&&(view==='plan'||view==='records'))render()}
}catch(e){}})();
})();