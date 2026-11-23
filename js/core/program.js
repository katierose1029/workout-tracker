/* Program access: months (with overrides + custom months), sessions, day mapping, videos, plan start. */
'use strict';
PROGRAM.months.forEach(function(m){
  Object.keys(m.days).forEach(function(k){(m.days[k].ex||[]).forEach(function(e){e.n=tc(e.n);});});
  (m.extras||[]).forEach(function(x){(x.ex||[]).forEach(function(e){e.n=tc(e.n);});});
});
var PRG=PROGRAM.months;

/* ---------- program access ---------- */
function getMonths(){
  var out=PRG.map(function(m){
    var ov=S.meta.overrides&&S.meta.overrides[m.id];
    if(!ov)return m;
    var c=clone(m);Object.keys(ov).forEach(function(k){c.days[k]=ov[k];});return c;
  });
  (S.meta.custom||[]).forEach(function(m){out.push(m);});
  out.sort(function(a,b){return a.n-b.n;});
  return out;
}
function getMonth(id){var ms=getMonths();for(var i=0;i<ms.length;i++)if(ms[i].id===id)return ms[i];return ms[ms.length-1];}
function monthForDate(d){
  var ms=getMonths();
  for(var i=ms.length-1;i>=0;i--){var m=ms[i];if(m.start&&d>=weekSunday(m.start)&&d<=monthEnd(m))return {m:m,week:Math.floor(diffDays(d,weekSunday(m.start))/7)};}
  return null;
}
/* Last day of a month: the Saturday of its final week. */
function monthEnd(m){return addDays(m.start,m.weeks*7-2);}
function latestDated(){var ms=getMonths().filter(function(m){return m.start;});ms.sort(function(a,b){return a.start<b.start?-1:1;});return ms[ms.length-1];}
function contentAt(d){var mp=(S.meta.dayMap||{})[S.calWeek];if(mp&&mp.length===7&&typeof mp[d]==='number')return mp[d];return d<4?d:-1;}
function liIdx(){return contentAt(S.dayIdx);}
function currentMap(){var a=[];for(var d=0;d<7;d++)a.push(contentAt(d));return a;}
function labelAt(d){var li=contentAt(d);return li>=0?DAYS[li].name:'Active rest';}
function weekdayOf(x){if(x>=4)return x;for(var d=0;d<7;d++)if(contentAt(d)===x)return d;return x;}
function sessKeyFor(week,d){var li=contentAt(d);return li>=0?sessKey(week,li):('w'+week+'-r'+d);}
function dayStatusFor(m,w,d){var li=contentAt(d);if(li>=0)return dayStatus(m,w,li);var r=getSess(m.id,'w'+w+'-r'+d,false);return restDone(r)?'restdone':'none';}
function sessKey(week,dayIdx){return dayIdx<4?('w'+week+'-'+DAYS[dayIdx].k):('w'+week+'-r'+dayIdx);}
function slotDate(m,week,dayIdx){return m.start?dayDate(addDays(m.start,week*7),dayIdx):null;}
function getSess(monthId,key,create){
  var L=S.logs[monthId];
  if(!L){if(!create)return null;L=S.logs[monthId]={};}
  if(!L[key]){if(!create)return null;L[key]={};}
  return L[key];
}

function videoFor(name){
  var k=normKey(name),mv=S.meta.videos||{},u=Object.prototype.hasOwnProperty.call(mv,k)?mv[k]:(VIDEOS[k]||VIDEOS[VIDEO_ALIAS[k]]);
  return (u&&/^https?:\/\//i.test(u))?u:null;
}
function vlink(name,small){
  var u=videoFor(name);
  if(!u){var q='https://www.youtube.com/results?search_query='+encodeURIComponent(name+' exercise form');
    return '<a class="vlink find'+(small?' sm':'')+'" href="'+esc(q)+'" target="_blank" rel="noopener noreferrer" aria-label="Find a demo on YouTube: '+esc(name)+'">\u2315 '+(small?'Find demo':'Find demo on YouTube')+'</a>';}
  return '<a class="vlink'+(small?' sm':'')+'" href="'+esc(u)+'" target="_blank" rel="noopener noreferrer" aria-label="Watch video: '+esc(name)+'">\u25b6 '+(small?'Video':'Watch video')+'</a>';
}

function applyPlanStart(){
  var ps=S.meta.planStart;if(!ps)return;
  var cur=weekMonday(ps);
  PRG.slice().sort(function(a,b){return a.n-b.n;}).forEach(function(m){m.start=cur;m.end=addDays(cur,m.weeks*7-2);cur=addDays(cur,m.weeks*7);});
}
function firstPlanStart(){var ms=PRG.slice().sort(function(a,b){return a.n-b.n;});return ms[0].start;}
function pickInitialSelection(){
  applyPlanStart();
  var t=todayISO(),hit=monthForDate(t);
  S.dayIdx=wdIndex(t);S.mobDay=S.dayIdx;S.calWeek=S.calWeek||weekMonday(t);
  var sel=S.meta.sel;
  if(sel&&getMonth(sel.monthId)){S.monthId=sel.monthId;S.week=sel.week||0;return;}
  if(hit){S.monthId=hit.m.id;S.week=hit.week;return;}
  var dated=getMonths().filter(function(m){return m.start;}),ended=dated.filter(function(m){return monthEnd(m)<t;});
  ended.sort(function(x,y){return x.start<y.start?-1:1;});dated.sort(function(x,y){return x.start<y.start?-1:1;});
  var l=ended.length?ended[ended.length-1]:(dated[0]||getMonths()[0]);S.monthId=l.id;S.week=0;
}
