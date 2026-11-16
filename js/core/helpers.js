/* Small pure helpers: text, dates, numbers. */
'use strict';
/* Title Case for exercise names; small words (a, an, the, of ...) stay lowercase unless they start the name. */
var TC_SMALL={a:1,an:1,the:1,of:1,and:1,or:1,to:1,in:1,on:1,at:1,for:1,with:1,by:1,vs:1};
var TC_ACR={db:'DB',ez:'EZ',kb:'KB',rdl:'RDL'};
function tc(str){
  var first=true;
  return String(str==null?'':str).split(/(\s+)/).map(function(w){
    if(!w||/^\s+$/.test(w))return w;
    var out=w.split('-').map(function(part,pi){
      var m=part.match(/^([^A-Za-z0-9]*)([A-Za-z0-9].*)$/);if(!m)return part;
      var pre=m[1],core=m[2],low=core.toLowerCase();
      if(TC_ACR[low])return pre+TC_ACR[low];
      if(core===core.toUpperCase()&&/[A-Z]{2,}/.test(core))return part;
      if(pi===0&&!first&&TC_SMALL[low])return pre+low;
      return pre+core.charAt(0).toUpperCase()+core.slice(1).toLowerCase().replace(/(^|\s)([a-z])/g,function(x){return x;});
    }).join('-');
    first=false;return out;
  }).join('');
}

/* ---------- small helpers ---------- */
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function pad(n){return n<10?'0'+n:''+n;}
function iso(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
function parseISO(s){var p=s.split('-');return new Date(+p[0],+p[1]-1,+p[2]);}
function addDays(s,n){var d=parseISO(s);d.setDate(d.getDate()+n);return iso(d);}
function diffDays(a,b){return Math.round((parseISO(a)-parseISO(b))/86400000);}
function todayISO(){return iso(new Date());}
function wdIndex(s){return (parseISO(s).getDay()+6)%7;}
function fmtD(s){if(!s)return '';return parseISO(s).toLocaleDateString('en-US',{month:'short',day:'numeric'});}
function fmtLong(s){return parseISO(s).toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});}
function num(v){var n=parseFloat(String(v).replace(',','.'));return isFinite(n)?n:0;}
function clone(o){return JSON.parse(JSON.stringify(o));}
function nextMonday(s){var i=wdIndex(s);return addDays(s,i===0?0:7-i);}
function normKey(name){
  return String(name).toLowerCase().replace(/\bdb\b/g,'dumbbell').replace(/\bkb\b/g,'kettlebell').replace(/\bbw\b/g,'bodyweight')
    .replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,'-');
}
function fmtNum(n){return n>=1000?(Math.round(n/100)/10)+'k':String(Math.round(n));}
function weekMonday(iso){return addDays(iso,-wdIndex(iso));}
