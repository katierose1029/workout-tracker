/* Settings page (formerly "Data"): backups, cycle tracking, plan start, months, appearance, account. */
'use strict';
PAGES.settings={label:'Settings',view:viewSettings};

function viewSettings(){
  var h='<header class="top"><div><h1>Settings</h1><div class="sub" id="savestat">'+statusText()+'</div></div></header>';
  h+='<div class="card stack"><div><b>Back up your logs</b><p class="muted small" style="margin:4px 0 0">Download everything you\u2019ve logged. The JSON file can be restored here; the CSV opens in a spreadsheet.</p></div>'
    +'<div class="row wrap"><button class="btn" data-act="exportjson">Download backup (JSON)</button><button class="btn" data-act="exportcsv">Download spreadsheet (CSV)</button></div>'
    +'<div><label class="btn" style="display:inline-block">Restore from backup<input type="file" accept="application/json,.json" data-f="import" style="display:none"></label></div></div>';
  h+='<div class="card stack" style="margin-top:12px"><div><b>Cycle tracking</b><p class="muted small" style="margin:4px 0 0">Adds a phase picker (Follicular, Ovulation, Luteal, Menstrual) to the Today tab. It is only a note and never changes your plan. Entries are saved with the rest of your logs and included in your CSV backup.</p></div><div class="row wrap"><button class="chip" data-act="cycleon" data-v="1" aria-pressed="'+cycleOn()+'">On</button><button class="chip" data-act="cycleon" data-v="0" aria-pressed="'+(!cycleOn())+'">Off</button><button class="btn sm danger" data-act="clearcycle">Clear cycle entries</button></div></div>';
  if(cycleOn()){
    var wo=[-25,-20,-15,-10,-5,0,5,10,15],ro=[-4,-3,-2,-1,0,1,2,3,4];
    h+='<div class="card stack" style="margin-top:12px"><div><b>Suggested weights and reps by phase</b><p class="muted small" style="margin:4px 0 0">These adjust the suggestion under \u201cLast time\u201d on each lift. They are measured against the phase of your last session, so they do not compound. Change any value to fit how you train.</p></div>'
      +['m','f','o','l'].map(function(k){var a=adjFor(k);return '<div class="row wrap"><b style="width:92px">'+PH[k].n+'</b>'
        +'<label class="small muted">Weight <select class="sel" data-f="cadj" data-ph="'+k+'" data-p="w">'+wo.map(function(v){return '<option value="'+v+'"'+(v===a.w?' selected':'')+'>'+(v>0?'+':(v<0?'\u2212':''))+Math.abs(v)+'%</option>';}).join('')+'</select></label>'
        +'<label class="small muted">Reps <select class="sel" data-f="cadj" data-ph="'+k+'" data-p="r">'+ro.map(function(v){return '<option value="'+v+'"'+(v===a.r?' selected':'')+'>'+(v>0?'+':(v<0?'\u2212':''))+Math.abs(v)+'</option>';}).join('')+'</select></label></div>';}).join('')+'</div>';
  }
  h+='<div class="card stack" style="margin-top:12px"><div><b>Plan start date</b><p class="muted small" style="margin:4px 0 0">The Monday that Month 1, Week 1 begins. Later months follow in order. Your logs stay with their month, so moving this never loses anything. Pick any day and it snaps to that week\u2019s Monday.</p></div><input type="date" class="field" data-f="planstart" value="'+esc(S.meta.planStart||firstPlanStart())+'" aria-label="Plan start date"></div>';
  h+='<div class="card stack" style="margin-top:12px"><div><b>Months</b><p class="muted small" style="margin:4px 0 0">Add a new month when your next plan arrives. It starts as a copy of a month you pick, and you can edit any exercise.</p></div><button class="btn primary" data-act="newmonth">Start a new month</button></div>';
  h+='<div class="card stack" style="margin-top:12px"><div><b>Appearance</b></div><div class="row wrap">'+[['auto','Match device'],['light','Light'],['dark','Dark']].map(function(x){return '<button class="chip" data-act="theme" data-v="'+x[0]+'" aria-pressed="'+(S.theme===x[0])+'">'+x[1]+'</button>';}).join('')+'</div></div>';
  if(window.AppBackend&&window.AppBackend.configured&&Store.db){h+='<div class="card stack" style="margin-top:12px"><div><b>Account</b><p class="muted small" style="margin:4px 0 0">Your logs sync to your account.</p></div><button class="btn" data-act="signout">Sign out</button></div>';}
  var m=getMonth(S.monthId);
  h+='<div class="card stack" style="margin-top:12px"><div><b>Clear '+esc(m.label)+'</b><p class="muted small" style="margin:4px 0 0">Removes every set and note you logged in this month. The plan stays.</p></div><button class="btn danger" data-act="clearmonth">Clear this month\u2019s logs</button></div>';
  return h;
}

/* ---------- export / import ---------- */
function exportObj(){return {app:'workout-tracker',version:1,exportedAt:new Date().toISOString(),meta:S.meta,logs:S.logs};}
function saveFile(name,text,label){
  var p=(window.claude&&window.claude.use)?window.claude.use('downloads'):Promise.resolve(null);
  p.then(function(dl){
    if(!dl){
      try{
        var blob=new Blob([text],{type:/\.csv$/.test(name)?'text/csv':'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
        a.href=url;a.download=name;document.body.appendChild(a);a.click();document.body.removeChild(a);
        setTimeout(function(){URL.revokeObjectURL(url);},4000);toast('Saved '+name);return;
      }catch(e){}
      S.modal={type:'text',title:label,text:text};render();return;
    }
    return dl.save({filename:name,data:text}).then(function(){toast('Saved '+name);}).catch(function(e){if(e&&e.code!=='declined'){S.modal={type:'text',title:label,text:text};render();}});
  }).catch(function(){S.modal={type:'text',title:label,text:text};render();});
}
function exportJSON(){saveFile('workout-backup-'+todayISO()+'.json',JSON.stringify(exportObj(),null,1),'Backup (JSON)');}
function exportCSV(){
  var rows=[['date','month','week','day','exercise','set','weight_lb','reps_or_seconds','done','cycle_phase','cycle_day']];
  getMonths().forEach(function(m){
    var L=S.logs[m.id];if(!L)return;
    Object.keys(L).forEach(function(sk){
      var s=L[sk];if(!s||!s.ex)return;
      var mt=sk.match(/^w(\d+)-(.+)$/),dn=mt?mt[2]:sk;
      Object.keys(s.ex).forEach(function(k){(s.ex[k].sets||[]).forEach(function(x,i){
        if(!x.r&&!x.w)return;rows.push([s.date||'',m.label,mt?(+mt[1]+1):'',dn,s.ex[k].n||k,i+1,x.w||'',x.r||'',x.d?'yes':'no',(function(){var q=s.date&&phaseFor(s.date);return q?PH[q.k].n:'';})(),(function(){var q=s.date&&phaseFor(s.date);return q?q.day:'';})()]);});});
    });
  });
  var csv=rows.map(function(r){return r.map(function(c){c=String(c);return /[",\n]/.test(c)?'"'+c.replace(/"/g,'""')+'"':c;}).join(',');}).join('\n');
  saveFile('workout-sets-'+todayISO()+'.csv',csv,'Spreadsheet (CSV)');
}
function importFile(f){
  if(!f)return;
  var rd=new FileReader();
  rd.onload=function(){
    try{
      var o=JSON.parse(rd.result);if(!o||o.app!=='workout-tracker'||!o.logs)throw new Error('bad');
      S.modal={type:'confirm',title:'Restore this backup?',text:'This replaces the logs and custom months currently in the app with the ones in the file.',yes:'Restore',run:function(){
        var oldIds=Object.keys(S.logs);S.logs=o.logs;oldIds.forEach(function(id){if(!S.logs[id])Store.save('log-'+id,{});});S.meta=Object.assign({custom:[],overrides:{},videos:{},mob:{},cycle:{},dayMap:{},sel:null},o.meta||{});
        Object.keys(S.logs).forEach(persistLog);persistMeta();S.modal=null;pickInitialSelection();render();toast('Backup restored');}};
      render();
    }catch(e){toast('That file isn\u2019t a workout backup');}
  };
  rd.readAsText(f);
}
function setTheme(v){
  S.theme=v;try{localStorage.setItem('ppw1:theme',v);}catch(e){}
  if(v==='auto')document.documentElement.removeAttribute('data-theme');else document.documentElement.setAttribute('data-theme',v);
  render();
}

ACTIONS['cycleon']=function(el,v){S.meta.cycleOn=(v==='1');persistMeta();render();};
ACTIONS['clearcycle']=function(el,v){S.modal={type:'confirm',title:'Clear cycle entries?',text:'This removes every cycle phase you have recorded. It can\u2019t be undone.',yes:'Clear entries',run:function(){S.meta.cycle={};persistMeta();S.modal=null;render();toast('Cycle entries cleared');}};render();};
ACTIONS['theme']=function(el,v){setTheme(v);};
ACTIONS['signout']=function(el,v){if(window.AppBackend){AppBackend.signOut().then(function(){location.reload();});}};
ACTIONS['exportjson']=function(el,v){exportJSON();};
ACTIONS['exportcsv']=function(el,v){exportCSV();};
ACTIONS['clearmonth']=function(el,v){S.modal={type:'confirm',title:'Clear '+getMonth(S.monthId).label+'?',text:'This removes every logged set, note, and rest day in this month. It can\u2019t be undone.',yes:'Clear logs',run:function(){S.logs[S.monthId]={};persistLog(S.monthId);S.modal=null;render();toast('Month cleared');}};render();};
CHANGES['cadj']=function(t){var ck=t.getAttribute('data-ph'),cp=t.getAttribute('data-p');S.meta.cycleAdj=S.meta.cycleAdj||{};S.meta.cycleAdj[ck]=S.meta.cycleAdj[ck]||{};S.meta.cycleAdj[ck][cp]=parseInt(t.value,10)||0;persistMeta();};
CHANGES['planstart']=function(t){if(t.value){S.meta.planStart=weekMonday(t.value);applyPlanStart();persistMeta();render();toast('Plan now starts the week of '+fmtD(S.meta.planStart));}};
CHANGES['import']=function(t){importFile(t.files&&t.files[0]);};
