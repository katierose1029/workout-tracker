/* Progress page: month-over-month ridge chart and per-exercise history. */
'use strict';
PAGES.progress={label:'Progress',view:viewProgress};

function metricValue(m,metric){
  var st=monthStats(m);
  return metric==='sessions'?st.sess:(metric==='sets'?st.sets:st.vol);
}
function ridgeSVG(metric){
  var all=getMonths(),first=-1;
  all.forEach(function(m,i){var st=monthStats(m);if(first<0&&(st.sets>0||st.sess>0))first=i;});
  var startIdx=first<0?Math.max(0,all.length-12):Math.max(0,first-1);
  var ms=all.slice(startIdx),vals=ms.map(function(m){return metricValue(m,metric);}),mx=Math.max.apply(null,vals.concat([1]));
  var step=44,W=ms.length*step+40,H=210,base=170,cur=S.monthId;
  var far='',near='',snow='',labels='',hit='',flag='';
  var farPts=[[0,base]];
  for(var i=0;i<=ms.length;i++){
    var a=vals[Math.max(0,i-1)]||0,b=vals[Math.min(ms.length-1,i)]||0,hh=18+((a+b)/2/mx)*70;
    farPts.push([20+i*step-step/2+step/2-step/2,base-hh*0.8]);
    farPts.push([20+i*step,base-hh*0.55-Math.abs(Math.sin(i*1.7))*14]);
  }
  farPts.push([W,base]);
  far='<path d="M'+farPts.map(function(p){return p[0].toFixed(1)+','+p[1].toFixed(1);}).join(' L')+' Z" fill="var(--ridge-far)"/>';
  var pts=[[0,base]];
  ms.forEach(function(m,i){
    var x=20+i*step+step/2,v=vals[i],h=8+Math.pow(v/mx,0.85)*118,shoulder=Math.min(h*0.28,24);
    pts.push([x-step/2,base-shoulder*0.6]);pts.push([x,base-h]);pts.push([x+step/2,base-shoulder*0.6]);
    if(v>0){var cap=Math.min(h*0.32,26);
      snow+='<path d="M'+x+','+(base-h)+' L'+(x-cap*0.55)+','+(base-h+cap)+' L'+(x-cap*0.1)+','+(base-h+cap*0.72)+' L'+(x+cap*0.2)+','+(base-h+cap)+' L'+(x+cap*0.55)+','+(base-h+cap*0.8)+' Z" fill="var(--ridge-snow)"/>';}
    if(m.id===cur)flag='<circle cx="'+x+'" cy="'+(base-h-9)+'" r="4.5" fill="var(--accent)"/>';
    labels+='<text x="'+x+'" y="'+(base+22)+'" text-anchor="middle" font-size="11" fill="'+(m.id===cur?'var(--ink)':'var(--muted)')+'" font-weight="'+(m.id===cur?700:500)+'">'+(Math.floor(m.n)===m.n?m.n:Math.floor(m.n)+(m.n%1>0.15?'b':'a'))+'</text>';
    hit+='<rect x="'+(x-step/2)+'" y="0" width="'+step+'" height="'+(base+30)+'" fill="transparent" data-act="gomonth" data-v="'+m.id+'" style="cursor:pointer"><title>'+esc(m.label)+': '+(metric==='volume'?fmtNum(v)+' lb':v+' '+metric)+'</title></rect>';
  });
  pts.push([W,base]);
  near='<path d="M'+pts.map(function(p){return p[0].toFixed(1)+','+p[1].toFixed(1);}).join(' L')+' Z" fill="var(--ridge-near)"/>';
  return '<svg width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Training range: one peak per month, taller means more '+metric+'">'+far+near+snow+flag
    +'<line x1="0" y1="'+base+'" x2="'+W+'" y2="'+base+'" stroke="var(--line)"/>'+labels+hit+'</svg>';
}
function lineChart(pts,label,unit){
  if(!pts.length)return '';
  var W=640,H=240,L=46,R=14,T=14,B=30;
  var ys=pts.map(function(p){return p.y;}),mn=Math.min.apply(null,ys),mx=Math.max.apply(null,ys);
  if(mx===mn){mx=mx+1;mn=Math.max(0,mn-1);}
  var span=mx-mn;mn=Math.max(0,mn-span*0.15);mx=mx+span*0.15;
  var X=function(i){return pts.length===1?(L+(W-L-R)/2):L+(W-L-R)*i/(pts.length-1);};
  var Y=function(v){return T+(H-T-B)*(1-(v-mn)/(mx-mn));};
  var g='',i;
  for(i=0;i<=3;i++){var v=mn+(mx-mn)*i/3,yy=Y(v);g+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+yy+'" y2="'+yy+'" stroke="var(--line)"/><text x="'+(L-8)+'" y="'+(yy+4)+'" text-anchor="end" font-size="12" fill="var(--muted)">'+Math.round(v*10)/10+'</text>';}
  var path='M'+pts.map(function(p,i){return X(i).toFixed(1)+','+Y(p.y).toFixed(1);}).join(' L');
  var dots=pts.map(function(p,i){return '<circle cx="'+X(i)+'" cy="'+Y(p.y)+'" r="4.5" fill="var(--accent)" stroke="var(--surface)" stroke-width="2"><title>'+esc(p.t)+'</title></circle>';}).join('');
  var xl='<text x="'+X(0)+'" y="'+(H-8)+'" font-size="12" fill="var(--muted)" text-anchor="'+(pts.length===1?'middle':'start')+'">'+esc(pts[0].l)+'</text>'+(pts.length>1?'<text x="'+X(pts.length-1)+'" y="'+(H-8)+'" font-size="12" fill="var(--muted)" text-anchor="end">'+esc(pts[pts.length-1].l)+'</text>':'');
  return '<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+esc(label)+'">'+g+(pts.length>1?'<path d="'+path+'" fill="none" stroke="var(--c-push)" stroke-width="2.5" stroke-linejoin="round"/>':'')+dots+xl+'</svg>';
}
function viewProgress(){
  var hist=buildHistory(),h='';
  h+='<header class="top"><div><h1>Progress</h1><div class="sub">Month to month</div></div></header>';
  h+='<div class="row wrap" style="margin-bottom:8px" role="group" aria-label="Range measure">'
    +[['sessions','Workouts'],['sets','Sets'],['volume','Pounds lifted']].map(function(x){return '<button class="chip" data-act="metric" data-v="'+x[0]+'" aria-pressed="'+(S.metric===x[0])+'">'+x[1]+'</button>';}).join('')+'</div>';
  h+='<div class="range">'+ridgeSVG(S.metric)+'</div><p class="muted small" style="margin:6px 2px 0">Each peak is a month. Tap one to open it.</p>';
  // monthly table
  var rows=getMonths().filter(function(m){var s=monthStats(m);return s.sets>0||s.sess>0||s.rest>0;});
  h+='<h2 style="font-size:20px;margin:22px 0 8px">Months logged</h2>';
  if(!rows.length)h+='<div class="card muted">Nothing logged yet. Your first workout will start the range.</div>';
  else{
    h+='<div class="card" style="padding:6px 10px"><table class="t"><thead><tr><th>Month</th><th>Workouts</th><th>Sets</th><th>Pounds</th><th>Rest days</th></tr></thead><tbody>';
    rows.forEach(function(m){var s=monthStats(m);h+='<tr><td>'+esc(m.label.replace('Month ','M'))+'</td><td>'+s.sess+'/'+s.planned+'</td><td>'+s.sets+'</td><td>'+(s.vol?fmtNum(s.vol):'\u2013')+'</td><td>'+s.rest+'</td></tr>';});
    h+='</tbody></table></div>';
  }
  // exercise explorer
  h+='<h2 style="font-size:20px;margin:22px 0 8px">Exercise history</h2>';
  var keys=Object.keys(hist.H).sort(function(a,b){var la=hist.H[a],lb=hist.H[b];return (lb[lb.length-1].date||'').localeCompare(la[la.length-1].date||'')||lb.length-la.length;});
  if(!keys.length){h+='<div class="card muted">Log a few sets and each exercise will get its own chart here.</div>';return h;}
  var q=S.exQuery.toLowerCase();
  var shown=keys.filter(function(k){return !q||hist.names[k].toLowerCase().indexOf(q)>=0;});
  h+='<input class="field" type="search" placeholder="Search exercises" value="'+esc(S.exQuery)+'" data-f="exq" aria-label="Search exercises">';
  h+='<div class="exlist" role="list">'+(shown.length?shown.slice(0,60).map(function(k){return '<button data-act="pickex" data-v="'+esc(k)+'" aria-pressed="'+(S.exKey===k)+'"><span>'+esc(hist.names[k])+'</span><span class="muted small">'+hist.H[k].length+'\u00d7</span></button>';}).join(''):'<div class="muted" style="padding:12px">No match.</div>')+'</div>';
  if(S.exKey&&hist.H[S.exKey]){
    var ses=hist.H[S.exKey],hasW=ses.some(function(x){return topWeight(x.sets)>0;});
    var metric=S.pmetric;if(!hasW)metric='reps';
    var pts=ses.map(function(x){
      var y=metric==='weight'?topWeight(x.sets):(metric==='e1rm'?e1rm(x.sets):totalReps(x.sets));
      return {y:Math.round(y*10)/10,l:x.date?fmtD(x.date):('M'+x.n),t:(x.date?fmtD(x.date)+': ':'')+fmtSets(x.sets)};
    }).filter(function(p){return p.y>0;});
    h+='<h3 style="margin:16px 0 6px;font-size:18px">'+esc(hist.names[S.exKey])+'</h3>';
    if(hasW)h+='<div class="row wrap" role="group" aria-label="Chart measure">'+[['weight','Top weight'],['e1rm','Est. 1RM'],['reps','Total reps']].map(function(x){return '<button class="chip" data-act="pmetric" data-v="'+x[0]+'" aria-pressed="'+(metric===x[0])+'">'+x[1]+'</button>';}).join('')+'</div>';
    h+='<div class="chart">'+(pts.length?lineChart(pts,hist.names[S.exKey]+' over time',metric==='reps'?'reps':'lb'):'<p class="muted" style="padding:10px">No weights logged for this exercise yet.</p>')+'</div>';
    h+='<div class="card" style="margin-top:10px;padding:6px 10px"><table class="t"><thead><tr><th>Date</th><th>Sets (weight\u00d7reps)</th></tr></thead><tbody>'
      +ses.slice().reverse().slice(0,12).map(function(x){return '<tr><td>'+esc(x.date?fmtD(x.date):'M'+x.n)+'</td><td>'+esc(fmtSets(x.sets))+'</td></tr>';}).join('')+'</tbody></table></div>';
  }
  return h;
}

ACTIONS['gomonth']=function(el,v){S.monthId=v;S.week=0;S.tab='month';saveSel();render();window.scrollTo(0,0);};
ACTIONS['metric']=function(el,v){S.metric=v;render();};
ACTIONS['pmetric']=function(el,v){S.pmetric=v;render();};
ACTIONS['pickex']=function(el,v){S.exKey=v;render();};
INPUTS['exq']=function(t){S.exQuery=t.value;var pos=t.selectionStart;render();var el=document.querySelector('[data-f=exq]');if(el){el.focus();try{el.setSelectionRange(pos,pos);}catch(e2){}}};
