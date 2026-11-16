/* Today page: week navigation, training day (lifts / active rest), mobility week, cycle card,
   exercise substitutions and removals. */
'use strict';
PAGES.today={label:'Today',view:viewToday};

function moveHTML(){
  var custom=!!((S.meta.dayMap||{})[S.calWeek]);
  var h='<h2>Change workout day</h2><p class="muted small" style="margin:0 0 8px">Move <b>'+esc(labelAt(S.dayIdx))+'</b> to another day. Whatever is on that day swaps places with it. This only changes the week of '+esc(fmtD(S.calWeek))+'.</p><div class="sublist" role="list">';
  for(var d=0;d<7;d++){if(d===S.dayIdx)continue;h+='<button data-act="moveto" data-v="'+d+'"><span>'+WD[d]+' '+esc(fmtD(addDays(S.calWeek,d)))+'</span><span class="muted small">'+esc(labelAt(d))+'</span></button>';}
  return h+'</div><div class="row" style="margin-top:12px">'+(custom?'<button class="btn" data-act="resetmap">Reset this week</button>':'')+'<button class="btn" data-act="closemodal">Cancel</button></div>';
}
function weekModeCard(){
  var mon=S.calWeek,mob=isMob(mon),cur=weekMonday(todayISO()),sug=suggestedMob(mon);
  return '<section class="card wmode"><div class="row between"><button class="btn sm ghost nav" data-act="calweek" data-v="-1" aria-label="Previous week">‹</button>'
    +'<div style="text-align:center"><b>Week of '+esc(fmtD(mon))+'</b><div class="muted small">'+(mon===cur?'This week':(mon<cur?'Past week':'Upcoming week'))+(sug?' · suggested mobility week':'')+'</div></div>'
    +'<button class="btn sm ghost nav" data-act="calweek" data-v="1" aria-label="Next week">›</button></div>'
    +'<div class="row between wrap" style="margin-top:10px"><label class="small muted">Jump to a date <input type="date" class="mini" style="width:150px" data-f="jumpdate" value="'+esc(mon)+'"></label>'+(mon!==cur?'<button class="btn sm" data-act="calweek" data-v="today">This week</button>':'')+'</div>'
    +'<div class="seg" role="group" aria-label="Week type"><button class="chip" data-act="setmob" data-v="0" aria-pressed="'+(!mob)+'">Training week</button><button class="chip" data-act="setmob" data-v="1" aria-pressed="'+mob+'">Mobility week</button></div>'
    +'<div class="muted small" style="margin-top:8px">Choose Training week or Mobility week for the week shown. You can switch any week either way.</div></section>';
}
function mobPicker(mon,d){
  var cur=mobIdx(mon,d);
  return '<section class="card" style="margin-bottom:12px"><label class="small muted" for="pickmob">Mobility workout for '+esc(WD[d])+'</label>'
    +'<select id="pickmob" class="sel" style="width:100%;margin-top:6px;font-size:14px;padding-left:8px;padding-right:4px" data-f="pickmob" aria-label="Mobility workout for this day">'
    +MOB.map(function(x,i){return '<option value="'+i+'"'+(i===cur?' selected':'')+'>'+esc(x.t)+'</option>';}).join('')+'</select></section>';
}
function ticksHTML(train,mob){
  if(!train&&!mob)return '';
  return '<span class="ticks" aria-hidden="true">'+(train?'<span class="tick" title="Training done">\u2713</span>':'')+(mob?'<span class="tick mob" title="Mobility done">\u2713</span>':'')+'</span>';
}
function viewMobility(){
  var mon=S.calWeek,d=S.mobDay,t=todayISO(),day=MOB[mobIdx(mon,d)],s=mobSess(mon,d,false)||{},chk=s.chk||{},m=getMonth(S.monthId),h='';
  var done=0;day.i.forEach(function(x){if(chk[x[0]])done++;});
  h+='<header class="top"><div><h1>'+esc(fmtLong(addDays(mon,d)))+'</h1><div class="sub">Mobility week</div></div></header>';
  h+='<div class="strip" role="group" aria-label="Day of week">';
  for(var i=0;i<7;i++){
    var st=mobDayStatus(mon,i),dd=addDays(mon,i);
    h+='<button class="day'+(dd===t?' today':'')+'" style="--pc:var(--c-rest)" data-st="'+st+'" data-act="mobday" data-v="'+i+'" aria-pressed="'+(S.mobDay===i)+'" aria-label="'+WD[i]+' '+esc(fmtD(dd))+', '+esc(MOB[mobIdx(mon,i)].t)+(st==='done'?', mobility done':'')+(trainDoneOn(dd)?', training done':'')+'"><span class="wd">'+WD3[i]+'</span><span class="dn">'+parseISO(dd).getDate()+'</span><span class="pip"></span>'+ticksHTML(trainDoneOn(dd),st==='done')+'</button>';
  }
  h+='</div>'+mobPicker(mon,d)+'<section class="dayhead" style="--pc:var(--c-rest)"><h2>'+esc(day.t)+'</h2><div class="muted small">'+esc(day.s)+'</div>'
    +'<div class="progress" style="--pc:var(--ok)"><i style="width:'+Math.round(done/day.i.length*100)+'%"></i></div></section>';
  h+='<div class="card">'+day.i.map(function(x){
    return '<div class="check" style="align-items:flex-start"><label class="row grow" style="align-items:flex-start"><input type="checkbox" data-f="mchk" data-name="'+esc(x[0])+'"'+(chk[x[0]]?' checked':'')+'><span><b>'+esc(x[0])+'</b><br><span class="muted small">'+esc(x[1])+'</span></span></label>'+vlink(x[0],true)+'</div>';}).join('')+'</div>';
  h+='<div class="card" style="margin-top:12px"><label class="small muted" for="mnote">Notes</label><textarea id="mnote" class="field" data-f="mnote" placeholder="What felt tight or easy today?">'+esc(s.note||'')+'</textarea></div>';
  h+='<div style="margin-top:12px">'+(s.done?'<button class="btn block" data-act="mobfinish">Reopen day</button>':'<button class="btn ok block" data-act="mobfinish">Finish day</button>')+'</div>';
  return h;
}
function cycleCard(){
  if(!cycleOn())return '';
  var d=isMob(S.calWeek)?S.mobDay:S.dayIdx,date=addDays(S.calWeek,d),ph=phaseFor(date),own=!!(S.meta.cycle&&S.meta.cycle[date]);
  var h='<section class="card cyc"><div class="row between"><b>Cycle Phase</b><span class="muted small">'+esc(fmtD(date))+'</span></div>';
  var mx=Math.max(40,ph?ph.day:0),opts='<option value="">Select day\u2026</option>';
  for(var i=1;i<=mx;i++)opts+='<option value="'+i+'"'+(ph&&ph.day===i?' selected':'')+'>Day '+i+'</option>';
  h+='<div class="row" style="gap:8px;margin-top:8px;flex-wrap:wrap"><label class="small muted" for="cycday">Cycle day</label><select id="cycday" data-f="cycday" aria-label="Cycle day">'+opts+'</select>'
    +(ph?'<button class="vlink find sm" style="margin:0" data-act="cycplus">+1 Day</button>':'')+'</div>'
    +'<div class="seg" style="margin-top:8px" role="group" aria-label="Cycle phase">'+['m','f','o','l'].map(function(k){return '<button class="chip" data-act="setphase" data-v="'+k+'" aria-pressed="'+(!!ph&&ph.k===k)+'">'+PH[k].n+'</button>';}).join('')+'</div>';
  if(ph){
    h+=phaseInfo(ph.k)+'<div class="muted small" style="margin-top:6px"><b>Day '+ph.day+'</b>'+(ph.day>40?' \u00b7 past Day 40. Pick Day 1 when a new cycle begins.':'')+' \u00b7 '+(own?'Set for this day.':'Counted from '+esc(fmtD(ph.from))+'.')+' It counts up automatically.'+(own?' <button class="vlink find sm" style="margin:0 0 0 6px" data-act="clearphase">Clear</button>':'')+'</div>';
  }else h+='<div class="muted small" style="margin-top:8px">Pick today\u2019s cycle day (1\u201340) and the app counts forward on its own. This is just a note for you and never changes your plan.</div>';
  return h+'</section>';
}
function viewToday(){
  return weekModeCard()+cycleCard()+(isMob(S.calWeek)?viewMobility():viewTraining());
}
function viewTraining(){
  var m=getMonth(S.monthId),t=todayISO(),h='';
  if(S.week>=m.weeks)S.week=0;
  var latest=latestDated(),inM=monthForDate(t),upcoming=getMonths().some(function(x){return x.start&&x.start>t;}),pastEnd=!inM&&!upcoming&&latest&&t>addDays(latest.start,latest.weeks*7-1);
  h+='<header class="top"><div><h1>'+esc(fmtLong(addDays(S.calWeek,S.dayIdx)))+'</h1><div class="sub">'+esc(m.label)+' \u00b7 Week '+(S.week+1)+'</div></div>'
    +'<select class="sel" aria-label="Month" data-act="selmonth">'+monthOptions(m.id)+'</select></header>';
  if(pastEnd){
    h+='<div class="banner"><b>'+esc(latest.label)+' has ended.</b> Add your next month to keep logging.<div style="margin-top:8px"><button class="btn primary sm" data-act="newmonth">Start next month</button></div></div>';
  }
  h+=weekChips(m);
  h+='<div class="strip" role="group" aria-label="Day of week">';
  for(var d=0;d<7;d++){
    var li=contentAt(d),st=dayStatusFor(m,S.week,d),dd=addDays(S.calWeek,d),col=li>=0?DAYS[li].col:'var(--c-rest)';
    var isToday=dd&&dd===t;
    h+='<button class="day'+(isToday?' today':'')+'" style="--pc:'+col+'" data-st="'+st+'" data-act="day" data-v="'+d+'" aria-pressed="'+(S.dayIdx===d)+'" aria-label="'+WD[d]+(dd?' '+fmtD(dd):'')+', '+labelAt(d)+(st==='done'||st==='restdone'?', training done':'')+((mobSess(S.calWeek,d,false)||{}).done?', mobility done':'')+'">'
      +'<span class="wd">'+WD3[d]+'</span><span class="dn">'+(dd?parseISO(dd).getDate():(d+1))+'</span><span class="pip"></span><span class="lb">'+(li>=0?DAYS[li].short:'Rest')+'</span>'+ticksHTML(st==='done'||st==='restdone',(mobSess(S.calWeek,d,false)||{}).done)+'</button>';
  }
  h+='</div>';
  h+=workoutPicker();
  h+=liIdx()>=0?viewLift(m):viewRest(m);
  return h;
}
function workoutPicker(){
  var cur=liIdx();
  var opts=(cur<0?'<option value="-1" selected>Active rest (choose a workout)</option>':'')
    +DAYS.map(function(x,i){return '<option value="'+i+'"'+(i===cur?' selected':'')+'>'+esc(x.full)+'</option>';}).join('');
  return '<section class="card" style="margin-bottom:12px"><label class="small muted" for="pickwo">Workout for '+esc(WD[S.dayIdx])+'</label>'
    +'<select id="pickwo" class="sel" style="width:100%;margin-top:6px;font-size:14px;padding-left:8px;padding-right:4px" data-f="pickwo" aria-label="Workout for this day">'+opts+'</select></section>';
}

function viewLift(m){
  var d=liIdx(),def=DAYS[d],day=m.days[def.k],key=sessKey(S.week,d),sess=getSess(m.id,key,false)||{};
  var h='<section class="dayhead" style="--pc:'+def.col+'"><h2>'+esc(def.name)+'</h2><div class="muted small">'+esc(def.sub)+(day&&day.title?' \u00b7 '+esc(day.title):'')+'</div><button class="vlink find" style="margin-top:8px" data-act="moveday">\u21c5 Change day</button></section>';
  if(!day||!day.ex||!day.ex.length){
    return h+'<div class="card"><p style="margin:0 0 10px"><b>No '+esc(def.name.toLowerCase())+' session in '+esc(m.label)+'.</b></p><p class="muted small" style="margin:0 0 12px">This month\u2019s plan doesn\u2019t include this day. You can add your own exercises.</p><button class="btn primary" data-act="edit" data-v="'+def.k+'">Add exercises</button></div>';
  }
  var hist=buildHistory(),st=sessionStats(sess),planned=plannedFor(m,sess,def.k);
  var pct=Math.min(100,planned?Math.round(st.sets/planned*100):0);
  h+='<div class="card"><div class="row between wrap"><div><b id="setprog">'+st.sets+' of '+planned+' sets logged</b><div class="muted small">Done on '
    +'<input type="date" class="mini" style="width:150px" data-f="date" value="'+esc(sess.date||addDays(S.calWeek,S.dayIdx))+'" aria-label="Date performed"></div></div>'
    +'<div class="row"><button class="btn sm ghost" data-act="edit" data-v="'+def.k+'">Edit plan</button></div></div>'
    +'<div class="progress" style="--pc:'+def.col+'"><i id="progbar" style="width:'+pct+'%"></i></div></div>';
  h+=checklist('wu','Warm-up',(m.warm&&m.warm[(d===0||d===2)?'upper':'lower'])||[],sess,d);
  var usedKeys={},removed=[];
  day.ex.forEach(function(e,i){
    var base=normKey(e.n),k=base;if(usedKeys[base]){usedKeys[base]++;k=base+'#'+usedKeys[base];}else usedKeys[base]=1;
    var sn=subName(m,sess,def.k,k),ee=e,bb=base;
    if(sn){ee=Object.assign({},e,{n:sn,planned:e.n});delete ee.t;bb=normKey(sn);}
    if(isRemoved(m,sess,def.k,k)){removed.push({k:k,n:sn||e.n,mine:!!(sess.rm&&sess.rm[k]===true)});return;}
    h+=exCard(ee,k,bb,sess,hist,key);
  });
  if(removed.length){
    h+='<div class="card" style="margin-top:12px"><b>Removed exercises ('+removed.length+')</b><div class="muted small">Restore brings an exercise back for this workout only. Anything you logged is kept.</div>'
      +removed.map(function(r){return '<div class="row between" style="margin-top:8px"><span>'+esc(r.n)+'<span class="muted small" style="display:block">'+(r.mine?'Removed from this workout':'Removed for the rest of the month')+'</span></span><button class="btn sm" data-act="unrm" data-ex="'+esc(r.k)+'">Restore</button></div>';}).join('')+'</div>';
  }
  h+=checklist('cd','Cool-down',(m.cool&&m.cool[(d===0||d===2)?'upper':'lower'])||[],sess,d);
  h+='<div class="card" style="margin-top:12px"><label class="small muted" for="note">Notes</label><textarea id="note" class="field" data-f="note" placeholder="How did it feel? Anything to change next time?">'+esc(sess.note||'')+'</textarea></div>';
  h+='<div style="margin-top:12px">'+(sess.done?'<button class="btn block" data-act="finish">Reopen workout</button>':'<button class="btn ok block" data-act="finish">Finish workout</button>')+'</div>';
  return h;
}
function checklist(id,title,items,sess,d){
  if(!items.length)return '';
  var store=sess[id]||{},n=0;items.forEach(function(x){if(store[x])n++;});
  var open=!!S.open[id+d];
  return '<details class="card" style="margin-top:12px" data-det="'+id+d+'"'+(open?' open':'')+'><summary><span>'+title+'</span><span class="muted small" style="margin-left:auto;margin-right:10px">'+n+'/'+items.length+'</span></summary><div class="inner">'
    +items.map(function(x,i){return '<div class="check"><label class="row grow"><input type="checkbox" data-f="chk" data-list="'+id+'" data-name="'+esc(x)+'"'+(store[x]?' checked':'')+'><span>'+esc(tc(x))+'</span></label>'+vlink(x,true)+'</div>';}).join('')+'</div></details>';
}
function exCard(e,k,base,sess,hist,sessionKey){
  var rec=(sess.ex&&sess.ex[k])||{},sets=rec.sets||[],n=Math.max(e.s,sets.length),unit=e.u||'reps';
  var past=(hist.H[base]||[]).filter(function(x){return x.sk!==sessionKey||x.mid!==S.monthId;});
  var cur=sess.date||todayISO();
  var before=past.filter(function(x){return !x.date||x.date<=cur;});
  var last=before.length?before[before.length-1]:(past.length?past[past.length-1]:null);
  var best=0;past.forEach(function(x){best=Math.max(best,topWeight(x.sets));});
  var mine=sets.filter(setIsDone),isPR=best>0&&mine.length&&topWeight(mine)>best;
  var h='<article class="ex" data-ex="'+esc(k)+'"><div class="row between"><h3>'+esc(e.n)+'</h3>'+(isPR?'<span class="pr">New best</span>':'')+'</div>'
    +'<div class="meta">'+e.s+' sets'+(e.t?' \u00b7 '+esc(e.t):'')+(unit!=='reps'&&!e.t?' \u00b7 '+unit:'')+(e.r?' \u00b7 rest '+e.r+'s':'')+'</div>'+vlink(e.n,false)+' <button class="vlink find" data-act="sub" data-ex="'+esc(k)+'">\u21c4 Substitute</button> <button class="vlink find" data-act="rm" data-ex="'+esc(k)+'">\u2715 Remove</button>'
    +(e.planned?'<div class="subnote">Substituted for '+esc(e.planned)+' <button data-act="unsub" data-ex="'+esc(k)+'">Undo</button></div>':'');
  if(last)h+='<div class="last">Last time '+(last.date?fmtD(last.date)+': ':': ')+esc(fmtSets(last.sets))+' <button data-act="uselast" data-ex="'+esc(k)+'" data-base="'+esc(base)+'">Use last</button></div>';
  h+=sugLine(last,k,base,unit);
  for(var i=0;i<n;i++){
    var s=sets[i]||{},ok=setIsDone(s);
    h+='<div class="setrow'+(ok?' ok':'')+'" data-i="'+i+'"><span class="sn">'+(i+1)+'</span>'
      +'<label><span>lb</span><input type="text" inputmode="decimal" data-f="w" data-ex="'+esc(k)+'" data-i="'+i+'" value="'+esc(s.w||'')+'" aria-label="Set '+(i+1)+' weight in pounds"></label>'
      +'<label><span>'+(unit==='reps'?'reps':unit)+'</span><input type="text" inputmode="numeric" data-f="r" data-ex="'+esc(k)+'" data-i="'+i+'" value="'+esc(s.r||'')+'" aria-label="Set '+(i+1)+' '+unit+'"></label>'
      +'<input type="checkbox" data-f="d" data-ex="'+esc(k)+'" data-i="'+i+'"'+(ok?' checked':'')+' aria-label="Set '+(i+1)+' done"></div>';
  }
  h+='<div class="exfoot"><button class="btn sm" data-act="addset" data-ex="'+esc(k)+'">Add set</button>'+(n>1?'<button class="btn sm ghost" data-act="rmset" data-ex="'+esc(k)+'">Remove last</button>':'')+'</div></article>';
  return h;
}

function viewRest(m){
  var d=S.dayIdx,key=sessKeyFor(S.week,d),r=getSess(m.id,key,false)||{};
  var walk=r.walk||{},yoga=r.yoga||{},med=r.med||{};
  var sessions=(m.rest||[]).filter(function(x){return !/meditation|breath/i.test(x);});
  if(!sessions.length)sessions=['Yoga flow','Pilates'];
  var h='<section class="dayhead" style="--pc:var(--c-rest)"><h2>Active rest</h2><div class="muted small">Walking, yoga, or both. Whatever feels right today.</div><button class="vlink find" style="margin-top:8px" data-act="moveday">\u21c5 Change day</button></section>';
  h+='<div class="restopt" data-on="'+(walk.on?1:0)+'"><label class="check"><input type="checkbox" data-f="rest" data-g="walk" data-p="on"'+(walk.on?' checked':'')+'><b>Walk</b></label>'
    +'<div class="row wrap" style="padding-left:32px"><label class="small muted">Minutes <input class="mini" type="text" inputmode="numeric" data-f="rest" data-g="walk" data-p="min" value="'+esc(walk.min||'')+'"></label>'
    +'<label class="small muted">Steps <input class="mini" type="text" inputmode="numeric" data-f="rest" data-g="walk" data-p="steps" value="'+esc(walk.steps||'')+'"></label></div></div>';
  h+='<div class="restopt" data-on="'+(yoga.on?1:0)+'"><label class="check"><input type="checkbox" data-f="rest" data-g="yoga" data-p="on"'+(yoga.on?' checked':'')+'><b>Yoga</b></label>'
    +'<div class="row wrap" style="padding-left:32px"><select class="sel" data-f="rest" data-g="yoga" data-p="session" aria-label="Yoga session"><option value="">Choose a session</option>'
    +sessions.map(function(x){return '<option'+(yoga.session===x?' selected':'')+'>'+esc(x)+'</option>';}).join('')
    +'<option'+(yoga.session==='Other'?' selected':'')+'>Other</option></select>'
    +'<label class="small muted">Minutes <input class="mini" type="text" inputmode="numeric" data-f="rest" data-g="yoga" data-p="min" value="'+esc(yoga.min||'')+'"></label></div></div>';
  h+='<div class="restopt" data-on="'+(med.on?1:0)+'"><label class="check"><input type="checkbox" data-f="rest" data-g="med" data-p="on"'+(med.on?' checked':'')+'><b>Meditation or breathwork</b></label></div>';
  h+='<div class="card" style="margin-top:12px"><label class="small muted" for="note">Notes</label><textarea id="note" class="field" data-f="note" placeholder="Energy, soreness, how the walk felt">'+esc(r.note||'')+'</textarea></div>';
  if(m.extras&&m.extras.length){
    h+='<h3 style="margin:18px 0 6px;font-size:18px">Also in '+esc(m.label)+'</h3>';
    m.extras.forEach(function(x){h+='<details class="card" style="margin-top:8px"><summary><span>'+esc(x.title)+'</span></summary><div class="inner"><ul class="plist">'+x.ex.map(function(e){return '<li><span>'+esc(e.n)+'</span><span class="muted">'+e.s+' sets</span></li>';}).join('')+'</ul></div></details>';});
  }
  return h;
}

/* ---------- mutations ---------- */
/* ---------- mutations ---------- */
function touchSession(create){
  var m=getMonth(S.monthId),key=sessKeyFor(S.week,S.dayIdx),s=getSess(m.id,key,create);
  return {m:m,key:key,s:s};
}
function subName(m,sess,dayKey,k){
  if(sess&&sess.sub&&Object.prototype.hasOwnProperty.call(sess.sub,k))return sess.sub[k]||null;
  var ms=S.meta.subs&&S.meta.subs[m.id]&&S.meta.subs[m.id][dayKey]&&S.meta.subs[m.id][dayKey][k];
  return (ms&&S.week>=ms.w)?ms.n:null;
}
function subOptions(M){
  var seen={},all=[],q=(M.q||'').toLowerCase().trim(),words=normKey(M.planned).split('-');
  getMonths().forEach(function(m){Object.keys(m.days).forEach(function(dk){(m.days[dk].ex||[]).forEach(function(e){
    var key=normKey(e.n);if(seen[key])return;seen[key]=1;all.push({n:e.n,key:key,same:dk===M.dayKey});});});});
  var out=all.filter(function(o){return o.key!==normKey(M.planned)&&(q?o.n.toLowerCase().indexOf(q)>=0:o.same);});
  out.forEach(function(o){var w=o.key.split('-'),sc=0;w.forEach(function(x){if(words.indexOf(x)>=0&&x.length>2)sc++;});o.score=sc;});
  out.sort(function(a,b){return b.score-a.score||a.n.localeCompare(b.n);});
  return out.slice(0,40);
}
function subModalHTML(M){
  var opts=subOptions(M);
  var h='<h2>Substitute exercise</h2><p class="muted small" style="margin:0 0 8px">Replacing <b>'+esc(M.planned)+'</b>. Your logged sets, history and video follow the new movement.</p>'
   +'<label class="radio"><input type="radio" name="subscope" data-f="sub-scope" value="this"'+(M.scope==='this'?' checked':'')+'><span>Just this workout</span></label>'
   +'<label class="radio"><input type="radio" name="subscope" data-f="sub-scope" value="month"'+(M.scope==='month'?' checked':'')+'><span>This workout and the rest of the month</span></label>'
   +'<input class="field" type="search" style="margin-top:8px" placeholder="Search all exercises" data-f="sub-q" value="'+esc(M.q||'')+'" aria-label="Search exercises">'
   +'<div class="sublist" role="list">'+(opts.length?opts.map(function(o){return '<button data-act="subpick" data-v="'+esc(o.n)+'"><span>'+esc(o.n)+'</span>'+(videoFor(o.n)?'<span class="muted small">video</span>':'')+'</button>';}).join(''):'<div class="muted" style="padding:12px">No matches. Use your own name below.</div>')+'</div>'
   +'<div class="muted small">'+(M.q?'Showing matches from every day.':'Similar movements from your plans. Search to look across all days.')+'</div>'
   +'<label class="small muted" for="subc" style="display:block;margin-top:12px">Or type your own</label><div class="row"><input class="field grow" id="subc" data-f="sub-c" placeholder="e.g. Dumbbell Goblet Squat" value="'+esc(M.custom||'')+'"><button class="btn primary" data-act="subuse">Use name</button></div>'
   +'<div style="margin-top:14px"><button class="btn" data-act="closemodal">Cancel</button></div>';
  return h;
}
function openSub(k){
  var m=getMonth(S.monthId),e=exDef(m,k);if(!e)return;
  S.modal={type:'sub',k:k,dayKey:DAYS[liIdx()].k,planned:e.planned||e.n,q:'',scope:'this',custom:''};render();
}
function applySub(name){
  var M=S.modal,m=getMonth(S.monthId),c=touchSession(true);name=tc(String(name||'').trim());if(!name)return;
  if(M.scope==='month'){
    S.meta.subs=S.meta.subs||{};var a=S.meta.subs[m.id]=S.meta.subs[m.id]||{},b=a[M.dayKey]=a[M.dayKey]||{};
    b[M.k]={n:name,w:S.week};if(c.s.sub)delete c.s.sub[M.k];persistMeta();
  }else{c.s.sub=c.s.sub||{};c.s.sub[M.k]=name;}
  if(c.s.ex&&c.s.ex[M.k])c.s.ex[M.k].n=name;
  persistLog(c.m.id);S.modal=null;render();toast('Substituted with '+name);
}
/* ---------- remove exercise ---------- */
function exKeyList(day){var used={},out=[];(day.ex||[]).forEach(function(e){var b=normKey(e.n),k=b;if(used[b]){used[b]++;k=b+'#'+used[b];}else used[b]=1;out.push(k);});return out;}
function isRemoved(m,sess,dayKey,k){
  if(sess&&sess.rm&&Object.prototype.hasOwnProperty.call(sess.rm,k))return !!sess.rm[k];
  var r=S.meta.rms&&S.meta.rms[m.id]&&S.meta.rms[m.id][dayKey]&&S.meta.rms[m.id][dayKey][k];
  return !!(r&&S.week>=r.w);
}
function plannedFor(m,sess,dayKey){
  var day=m.days[dayKey]||{},ks=exKeyList(day),n=0;
  (day.ex||[]).forEach(function(e,i){if(!isRemoved(m,sess,dayKey,ks[i]))n+=e.s;});
  return n;
}
function openRm(k){
  var m=getMonth(S.monthId),e=exDef(m,k);if(!e)return;
  S.modal={type:'rm',k:k,dayKey:DAYS[liIdx()].k,name:e.n,scope:'this'};render();
}
function applyRm(){
  var M=S.modal,m=getMonth(S.monthId),c=touchSession(true);
  if(M.scope==='month'){
    S.meta.rms=S.meta.rms||{};var a=S.meta.rms[m.id]=S.meta.rms[m.id]||{},b=a[M.dayKey]=a[M.dayKey]||{};
    b[M.k]={w:S.week};if(c.s.rm)delete c.s.rm[M.k];persistMeta();
  }else{c.s.rm=c.s.rm||{};c.s.rm[M.k]=true;}
  persistLog(c.m.id);S.modal=null;render();toast('Removed '+M.name);
}
function undoRm(k){
  var c=touchSession(true);c.s.rm=c.s.rm||{};c.s.rm[k]=false;
  persistLog(c.m.id);render();toast('Exercise restored');
}
function undoSub(k){
  var c=touchSession(true);c.s.sub=c.s.sub||{};c.s.sub[k]='';
  var e=exDef(c.m,k);if(e&&c.s.ex&&c.s.ex[k])c.s.ex[k].n=e.n;
  persistLog(c.m.id);render();toast('Back to the planned exercise');
}
function ensureEx(sess,k,name){
  sess.ex=sess.ex||{};
  if(!sess.ex[k])sess.ex[k]={n:name,sets:[]};
  return sess.ex[k];
}
function exDef(m,k){
  var day=m.days[DAYS[liIdx()].k],used={},out=null;
  (day.ex||[]).forEach(function(e){var b=normKey(e.n),kk=b;if(used[b]){used[b]++;kk=b+'#'+used[b];}else used[b]=1;if(kk===k)out=e;});
  if(out){var sn=subName(m,getSess(m.id,sessKeyFor(S.week,S.dayIdx),false),DAYS[liIdx()].k,k);if(sn){out=Object.assign({},out,{n:sn,planned:out.n});delete out.t;}}
  return out;
}
function stampDate(sess){if(!sess.date)sess.date=todayISO();}
function updateLive(row){
  var ctx=touchSession(false);if(!ctx.s)return;
  var planned=plannedFor(ctx.m,ctx.s,DAYS[liIdx()].k),st=sessionStats(ctx.s);
  var el=document.getElementById('setprog');if(el)el.textContent=st.sets+' of '+planned+' sets logged';
  var bar=document.getElementById('progbar');if(bar)bar.style.width=Math.min(100,planned?Math.round(st.sets/planned*100):0)+'%';
  if(row){var cb=row.querySelector('input[type=checkbox]'),ok=cb&&cb.checked;row.classList.toggle('ok',!!ok);}
}

/* ---------- modals ---------- */
MODALS['sub']=subModalHTML;
MODALS['moveday']=function(){return moveHTML();};
MODALS['rm']=function(M){
  var h='';
    h+='<h2>Remove exercise</h2><p class="muted small" style="margin:0 0 8px">Remove <b>'+esc(M.name)+'</b> from this workout. Anything you already logged is kept, and you can restore it later.</p>'
      +'<label class="radio"><input type="radio" name="rmscope" data-f="sub-scope" value="this"'+(M.scope==='this'?' checked':'')+'><span>Just this workout</span></label>'
      +'<label class="radio"><input type="radio" name="rmscope" data-f="sub-scope" value="month"'+(M.scope==='month'?' checked':'')+'><span>This workout and the rest of the month</span></label>'
      +'<div class="row" style="margin-top:14px"><button class="btn danger grow" data-act="rm-do">Remove exercise</button><button class="btn" data-act="closemodal">Cancel</button></div>';
  return h;
};

/* ---------- actions ---------- */
ACTIONS['calweek']=function(el,v){S.calWeek=(v==='today')?weekMonday(todayISO()):addDays(S.calWeek,7*(+v));S.dayIdx=S.mobDay=(S.calWeek===weekMonday(todayISO())?wdIndex(todayISO()):0);render();};
ACTIONS['day']=function(el,v){S.dayIdx=+v;render();};
ACTIONS['setmob']=function(el,v){S.meta.mob=S.meta.mob||{};S.meta.mob[S.calWeek]=(v==='1');persistMeta();render();};
ACTIONS['mobday']=function(el,v){S.mobDay=+v;render();};
ACTIONS['mobfinish']=function(el,v){var ms=mobSess(S.calWeek,S.mobDay,true);ms.done=!ms.done;if(!ms.date)ms.date=todayISO();persistLog('mobility');render();if(ms.done)toast('Day saved');};
ACTIONS['moveday']=function(el,v){S.modal={type:'moveday'};render();};
ACTIONS['moveto']=function(el,v){var to=+v,mp=currentMap(),fr=S.dayIdx,tmp=mp[fr];mp[fr]=mp[to];mp[to]=tmp;S.meta.dayMap=S.meta.dayMap||{};S.meta.dayMap[S.calWeek]=mp;persistMeta();S.dayIdx=to;S.modal=null;render();toast('Moved to '+WD[to]);};
ACTIONS['resetmap']=function(el,v){if(S.meta.dayMap)delete S.meta.dayMap[S.calWeek];persistMeta();S.modal=null;render();toast('Back to the usual order');};
ACTIONS['setphase']=function(el,v){var pd=addDays(S.calWeek,isMob(S.calWeek)?S.mobDay:S.dayIdx);S.meta.cycle=S.meta.cycle||{};S.meta.cycle[pd]=PH_START[v];persistMeta();render();};
ACTIONS['cycday1']=function(el,v){var pd1=addDays(S.calWeek,isMob(S.calWeek)?S.mobDay:S.dayIdx);S.meta.cycle=S.meta.cycle||{};S.meta.cycle[pd1]=1;persistMeta();render();};
ACTIONS['cycplus']=function(el,v){var pd2=addDays(S.calWeek,isMob(S.calWeek)?S.mobDay:S.dayIdx),p2=phaseFor(pd2);if(p2){S.meta.cycle=S.meta.cycle||{};S.meta.cycle[pd2]=p2.day+1;persistMeta();render();}};
ACTIONS['clearphase']=function(el,v){var cd=addDays(S.calWeek,isMob(S.calWeek)?S.mobDay:S.dayIdx);if(S.meta.cycle)delete S.meta.cycle[cd];persistMeta();render();};
ACTIONS['addset']=function(el,v){var c=touchSession(true),e=exDef(c.m,el.getAttribute('data-ex'));if(!e)return;var rec=ensureEx(c.s,el.getAttribute('data-ex'),e.n);var n=Math.max(e.s,rec.sets.length);while(rec.sets.length<n+1)rec.sets.push({});persistLog(c.m.id);render();};
ACTIONS['rmset']=function(el,v){var c1=touchSession(true),k1=el.getAttribute('data-ex'),e1=exDef(c1.m,k1);if(!e1)return;var r1=ensureEx(c1.s,k1,e1.n);var n1=Math.max(e1.s,r1.sets.length);if(n1>1){r1.sets=r1.sets.slice(0,n1-1);while(r1.sets.length<n1-1)r1.sets.push({});}persistLog(c1.m.id);render();};
ACTIONS['uselast']=function(el,v){
      var c2=touchSession(true),k2=el.getAttribute('data-ex'),b2=el.getAttribute('data-base'),e2=exDef(c2.m,k2),hist=buildHistory(),past=(hist.H[b2]||[]).filter(function(x){return !(x.mid===c2.m.id&&x.sk===c2.key);});
      var cur=c2.s.date||todayISO(),before=past.filter(function(x){return !x.date||x.date<=cur;}),last=before.length?before[before.length-1]:past[past.length-1];
      if(!last||!e2)return;var rec2=ensureEx(c2.s,k2,e2.n),n2=Math.max(e2.s,last.sets.length);
      rec2.sets=[];for(var i=0;i<n2;i++){var src=last.sets[Math.min(i,last.sets.length-1)];if(el.getAttribute('data-adj')==='1'){var phx=phaseFor(addDays(S.calWeek,S.dayIdx)),lpx=last.date?phaseFor(last.date):null;if(phx)src=adjSet(src,phx.k,lpx?lpx.k:null,(e2.u||'reps'));}var cur2=rec2.sets[i]={w:src.w||'',r:src.r||'',d:false};}
      stampDate(c2.s);persistLog(c2.m.id);render();toast('Filled in from last time. Tick each set as you finish it.');};
ACTIONS['finish']=function(el,v){var c4=touchSession(true);c4.s.done=!c4.s.done;if(c4.s.done)stampDate(c4.s);persistLog(c4.m.id);render();if(c4.s.done)toast('Workout saved');};
ACTIONS['sub']=function(el,v){openSub(el.getAttribute('data-ex'));};
ACTIONS['unsub']=function(el,v){undoSub(el.getAttribute('data-ex'));};
ACTIONS['subpick']=function(el,v){applySub(v);};
ACTIONS['subuse']=function(el,v){applySub(S.modal.custom);};
ACTIONS['rm']=function(el,v){openRm(el.getAttribute('data-ex'));};
ACTIONS['rm-do']=function(el,v){applyRm();};
ACTIONS['unrm']=function(el,v){undoRm(el.getAttribute('data-ex'));};

/* ---------- inputs ---------- */
function onSetInput(t){
  var f=t.getAttribute('data-f');
  var ctx=touchSession(true),k=t.getAttribute('data-ex'),i=+t.getAttribute('data-i'),e=exDef(ctx.m,k);if(!e)return;
  var rec=ensureEx(ctx.s,k,e.n);while(rec.sets.length<=i)rec.sets.push({});
  var s=rec.sets[i];s[f]=t.value.trim();stampDate(ctx.s);
  var row=t.closest('.setrow'),cb=row.querySelector('input[type=checkbox]');
  var want=num(s.r)>0;if(f==='r'){s.d=want;cb.checked=want;}else if(want&&!s.d){s.d=true;cb.checked=true;}
  updateLive(row);persistLog(ctx.m.id);
}
INPUTS['w']=onSetInput;
INPUTS['r']=onSetInput;
INPUTS['note']=function(t){var c=touchSession(true);c.s.note=t.value;persistLog(c.m.id);};
INPUTS['date']=function(t){var c2=touchSession(true);c2.s.date=t.value||undefined;persistLog(c2.m.id);};
INPUTS['rest']=function(t){
  var c3=touchSession(true),g=t.getAttribute('data-g'),p=t.getAttribute('data-p');
  if(t.type!=='checkbox'){c3.s[g]=c3.s[g]||{};c3.s[g][p]=t.value;stampDate(c3.s);persistLog(c3.m.id);}
};
INPUTS['mnote']=function(t){var mn=mobSess(S.calWeek,S.mobDay,true);mn.note=t.value;persistLog('mobility');};
INPUTS['sub-q']=function(t){S.modal.q=t.value;var pos=t.selectionStart;render();var el2=document.querySelector('[data-f=sub-q]');if(el2){el2.focus();try{el2.setSelectionRange(pos,pos);}catch(e3){}}};
INPUTS['sub-c']=function(t){S.modal.custom=t.value;};

/* ---------- changes ---------- */
CHANGES['d']=function(t){
  var ctx=touchSession(true),k=t.getAttribute('data-ex'),i=+t.getAttribute('data-i'),e=exDef(ctx.m,k);if(!e)return;
  var rec=ensureEx(ctx.s,k,e.n);while(rec.sets.length<=i)rec.sets.push({});
  rec.sets[i].d=t.checked;stampDate(ctx.s);persistLog(ctx.m.id);render();
};
CHANGES['chk']=function(t){
  var c=touchSession(true),list=t.getAttribute('data-list'),nm=t.getAttribute('data-name');
  c.s[list]=c.s[list]||{};c.s[list][nm]=t.checked;stampDate(c.s);persistLog(c.m.id);render();
};
CHANGES['rest']=function(t){
  var c3=touchSession(true),g=t.getAttribute('data-g'),p=t.getAttribute('data-p');
  c3.s[g]=c3.s[g]||{};c3.s[g][p]=(t.type==='checkbox')?t.checked:t.value;stampDate(c3.s);persistLog(c3.m.id);
  if(t.type==='checkbox'||t.tagName==='SELECT')render();
};
CHANGES['date']=INPUTS['date'];
CHANGES['note']=INPUTS['note'];
CHANGES['mchk']=function(t){var mc=mobSess(S.calWeek,S.mobDay,true);mc.chk=mc.chk||{};mc.chk[t.getAttribute('data-name')]=t.checked;if(!mc.date)mc.date=todayISO();persistLog('mobility');render();};
CHANGES['pickmob']=function(t){
  var pv=parseInt(t.value,10);
    if(MOB[pv]){var mp2=JSON.parse(JSON.stringify(S.meta.mobPick||{}));mp2[S.calWeek+'-d'+S.mobDay]=pv;S.meta.mobPick=mp2;persistMeta();render();toast(MOB[pv].t+' set for '+WD[S.mobDay]);}
};
CHANGES['pickwo']=function(t){
  var want=parseInt(t.value,10);
  if(want>=0&&want<DAYS.length){
    var mp=currentMap(),fr=S.dayIdx,at=mp.indexOf(want);
      if(at!==fr){var swapped=mp[fr];mp[fr]=want;if(at>=0)mp[at]=swapped;S.meta.dayMap=S.meta.dayMap||{};S.meta.dayMap[S.calWeek]=mp;persistMeta();toast(DAYS[want].name+' set for '+WD[fr]);}
      else render();
  }else render();
};
CHANGES['cycday']=function(t){var cv=parseInt(t.value,10);if(cv>0){var pd3=addDays(S.calWeek,isMob(S.calWeek)?S.mobDay:S.dayIdx);S.meta.cycle=S.meta.cycle||{};S.meta.cycle[pd3]=cv;persistMeta();render();}};
CHANGES['jumpdate']=function(t){if(t.value){S.calWeek=weekMonday(t.value);S.dayIdx=S.mobDay=wdIndex(t.value);render();}};
CHANGES['sub-scope']=function(t){S.modal.scope=t.value;};
