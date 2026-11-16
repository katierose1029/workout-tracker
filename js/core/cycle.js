/* Cycle phase logic and phase-based weight/rep suggestions. */
'use strict';
function adjText(k){var a=adjFor(k),w=a.w===0?'same weight':((a.w>0?'+':'\u2212')+Math.abs(a.w)+'% weight'),r=a.r===0?'same reps':((a.r>0?'+':'\u2212')+Math.abs(a.r)+' reps');return w+', '+r;}
function phaseInfo(k){
  var x=PH[k];
  return '<details class="phinfo" data-det="cyc"'+(S.open.cyc===false?'':' open')+' style="margin-top:8px"><summary><b>'+esc(x.n)+' phase</b> <span class="muted small">'+esc(x.d)+'</span></summary>'
    +'<div class="small" style="margin-top:6px"><b>What is happening:</b> '+esc(x.w)+'</div>'
    +'<div class="small" style="margin-top:6px"><b>Best workouts:</b></div><ul class="plist" style="margin-top:2px">'+x.b.map(function(t){return '<li style="display:list-item;list-style:disc;margin-left:18px;border-top:0;padding:2px 0;font-size:14px">'+esc(t)+'</li>';}).join('')+'</ul><div class="small" style="margin-top:6px"><b>Suggested lifts:</b> '+esc(adjText(k))+'</div></details>';
}
var CYC_ADJ={m:{w:-15,r:0},f:{w:0,r:0},o:{w:5,r:-2},l:{w:-10,r:2}};
function adjFor(k){var d=CYC_ADJ[k],o=(S.meta.cycleAdj||{})[k]||{};return {w:(o.w!=null?+o.w:d.w),r:(o.r!=null?+o.r:d.r)};}
function adjSet(st,kNow,kLast,unit){
  var a=adjFor(kNow),b=kLast?adjFor(kLast):{w:0,r:0},w=num(st.w),r=num(st.r);
  var nw=w>0?Math.max(0,Math.round(w*(1+a.w/100)/(1+b.w/100))):0;
  var nr=(unit==='reps')?Math.max(1,r+a.r-b.r):r;
  return {w:nw?String(nw):(st.w||''),r:String(nr)};
}
function sugSets(last,unit){
  if(!cycleOn()||!last)return null;
  var ph=phaseFor(addDays(S.calWeek,S.dayIdx));if(!ph)return null;
  var lp=last.date?phaseFor(last.date):null;
  var out=last.sets.map(function(x){return adjSet(x,ph.k,lp?lp.k:null,unit);});
  var same=out.every(function(o,i){return num(o.w)===num(last.sets[i].w)&&num(o.r)===num(last.sets[i].r);});
  return same?null:{ph:ph.k,sets:out};
}
function sugLine(last,k,base,unit){
  var sg=sugSets(last,unit);if(!sg)return '';
  return '<div class="last">Suggested for '+esc(PH[sg.ph].n)+': '+esc(fmtSets(sg.sets))+' <button data-act="uselast" data-adj="1" data-ex="'+esc(k)+'" data-base="'+esc(base)+'">Use suggestion</button></div>';
}
function cycleOn(){return S.meta.cycleOn!==false;}
var PH_START={m:1,f:8,o:14,l:21};
function cycNum(v){return typeof v==='number'?v:(PH_START[v]||null);}
function phOfDay(n){return n<=7?'m':(n<=13?'f':(n<=20?'o':'l'));}
function phaseFor(date){
  var c=S.meta.cycle||{},best=null;
  Object.keys(c).forEach(function(k){if(k<=date&&cycNum(c[k])&&(!best||k>best))best=k;});
  if(!best)return null;
  var n=cycNum(c[best])+diffDays(date,best);
  return {k:phOfDay(n),day:n,from:best};
}
