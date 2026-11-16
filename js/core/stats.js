/* Stats and per-exercise history. */
'use strict';
/* ---------- stats ---------- */
function setIsDone(s){return !!(s&&s.d&&num(s.r)>0);}
function sessionStats(sess){
  var sets=0,vol=0,reps=0;
  if(sess&&sess.ex){Object.keys(sess.ex).forEach(function(k){(sess.ex[k].sets||[]).forEach(function(s){
    if(setIsDone(s)){sets++;reps+=num(s.r);vol+=num(s.r)*num(s.w);}});});}
  return {sets:sets,vol:vol,reps:reps};
}
function plannedSets(day){var n=0;(day.ex||[]).forEach(function(e){n+=e.s;});return n;}
function monthStats(m){
  var L=S.logs[m.id]||{},sess=0,planned=0,sets=0,vol=0,rest=0,byDay={push:0,quads:0,pull:0,glutes:0};
  for(var w=0;w<m.weeks;w++){
    for(var d=0;d<4;d++){
      var key=sessKey(w,d),dayDef=m.days[DAYS[d].k];if(dayDef)planned++;
      var s=L[key];if(!s)continue;
      var st=sessionStats(s);sets+=st.sets;vol+=st.vol;byDay[DAYS[d].k]+=st.sets;
      if(s.done)sess++;
    }
    for(var r=4;r<7;r++){var rs=L[sessKey(w,r)];if(rs&&restDone(rs))rest++;}
  }
  return {sess:sess,planned:planned,sets:sets,vol:vol,rest:rest,byDay:byDay};
}
function restDone(r){return !!(r&&((r.walk&&r.walk.on)||(r.yoga&&r.yoga.on)||(r.med&&r.med.on)));}
function dayStatus(m,week,d){
  var s=getSess(m.id,sessKey(week,d),false);
  if(!s)return 'none';
  if(d<4){if(s.done)return 'done';return sessionStats(s).sets>0?'part':'none';}
  return restDone(s)?'restdone':'none';
}

/* ---------- history (per exercise) ---------- */
function buildHistory(){
  var H={},names={};
  getMonths().forEach(function(m){
    var L=S.logs[m.id];if(!L)return;
    Object.keys(L).forEach(function(sk){
      var s=L[sk];if(!s||!s.ex)return;
      var date=s.date||m.start||'',mid=m.n;
      Object.keys(s.ex).forEach(function(k){
        var e=s.ex[k],sets=(e.sets||[]).filter(setIsDone);
        if(!sets.length)return;
        var base=e.n?normKey(e.n):k.replace(/#\d+$/,'');
        (H[base]=H[base]||[]).push({date:date,n:mid,mid:m.id,sk:sk,sets:sets});
        names[base]=e.n||names[base]||base;
      });
    });
  });
  Object.keys(H).forEach(function(k){H[k].sort(function(a,b){return (a.date||'').localeCompare(b.date||'')||a.n-b.n||a.sk.localeCompare(b.sk);});});
  return {H:H,names:names};
}
function topWeight(sets){var m=0;sets.forEach(function(s){m=Math.max(m,num(s.w));});return m;}
function e1rm(sets){var m=0;sets.forEach(function(s){var r=num(s.r),w=num(s.w);if(w>0&&r>0&&r<=12)m=Math.max(m,w*(1+r/30));});return m;}
function totalReps(sets){var n=0;sets.forEach(function(s){n+=num(s.r);});return n;}
function fmtSets(sets){return sets.map(function(s){var w=num(s.w);return (w?fmtNum(w):'BW')+'\u00d7'+num(s.r);}).join(', ');}
