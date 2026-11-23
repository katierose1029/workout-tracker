/* Month page: calendar grid of the selected month with completion stats. */
'use strict';
PAGES.month={label:'Month',view:viewMonth};

function viewMonth(){
  var m=getMonth(S.monthId),st=monthStats(m),h='';
  h+='<header class="top"><div><h1>'+esc(m.label)+'</h1><div class="sub">'+m.weeks+' weeks</div></div>'
    +'<select class="sel" aria-label="Month" data-act="selmonth">'+monthOptions(m.id)+'</select></header>';
  h+='<div class="stats"><div class="stat"><b>'+st.sess+'<small class="muted" style="font-size:15px"> / '+st.planned+'</small></b><span>Workouts done</span></div>'
    +'<div class="stat"><b>'+st.sets+'</b><span>Sets logged</span></div><div class="stat"><b>'+(st.vol?fmtNum(st.vol):'\u2013')+'</b><span>Pounds lifted</span></div></div>';
  h+='<table class="mgrid" aria-label="Month overview"><thead><tr><th></th>'+WEEK_ORDER.map(function(i){return '<th>'+WD3[i]+'</th>';}).join('')+'</tr></thead><tbody>';
  for(var w=0;w<m.weeks;w++){
    h+='<tr><td class="wk">W'+(w+1)+'</td>';
    for(var j=0;j<7;j++){
      var d=WEEK_ORDER[j],s=dayStatus(m,w,d),dd=null,lab=d<4?DAYS[d].short:'';
      var txt=s==='done'||s==='restdone'?'\u2713':(dd?parseISO(dd).getDate():(d<4?lab:'\u00b7'));
      h+='<td><button class="cell" style="--pc:'+(d<4?DAYS[d].col:'var(--c-rest)')+'" data-st="'+s+'" data-act="open" data-w="'+w+'" data-d="'+d+'" aria-label="Week '+(w+1)+' '+WD[d]+(s==='done'||s==='restdone'?', done':'')+'">'+txt+'</button></td>';
    }
    h+='</tr>';
  }
  h+='</tbody></table><div class="legend">'+DAYS.map(function(x){return '<span><i style="background:'+x.col+'"></i>'+x.short+'</span>';}).join('')+'<span><i style="background:var(--c-rest)"></i>Rest</span></div>';
  // plan preview
  h+='<h2 style="font-size:20px;margin:18px 0 8px">This month\u2019s plan</h2>';
  DAYS.forEach(function(def,i){
    var day=m.days[def.k];
    h+='<details class="card" style="margin-top:8px"'+(S.open['pl'+def.k]?' open':'')+' data-det="pl'+def.k+'"><summary><span><b>'+WD[i]+'</b> \u00b7 '+esc(def.name)+'</span></summary><div class="inner">';
    if(day&&day.ex.length){h+='<ul class="plist">'+day.ex.map(function(e){return '<li><span>'+esc(e.n)+'</span><span class="muted">'+e.s+'\u00d7'+(e.t?esc(e.t.replace(' reps','')):(e.u||'reps'))+'</span></li>';}).join('')+'</ul>';}
    else h+='<p class="muted small">Not in this month\u2019s plan.</p>';
    h+='<div style="margin-top:8px"><button class="btn sm" data-act="edit" data-v="'+def.k+'">Edit exercises</button></div></div></details>';
  });
  if(m.extras&&m.extras.length){
    m.extras.forEach(function(x){h+='<details class="card" style="margin-top:8px"><summary><span>'+esc(x.title)+'</span></summary><div class="inner"><ul class="plist">'+x.ex.map(function(e){return '<li><span>'+esc(e.n)+'</span><span class="muted">'+e.s+' sets</span></li>';}).join('')+'</ul></div></details>';});
  }
  h+='<div style="margin-top:16px"><button class="btn" data-act="newmonth">Start a new month</button></div>';
  return h;
}

ACTIONS['open']=function(el,v){S.monthId=S.monthId;S.week=+el.getAttribute('data-w');S.dayIdx=weekdayOf(+el.getAttribute('data-d'));S.tab='today';saveSel();render();window.scrollTo(0,0);};
