/* Mobility-week logic. */
'use strict';
var MOB_ANCHOR="2026-11-16";
var SUGGEST_MOB=false; /* saved for later: set true to suggest a mobility week every 4th week from MOB_ANCHOR */
function suggestedMob(mon){if(!SUGGEST_MOB)return false;var d=diffDays(mon,MOB_ANCHOR);return d>=0&&d%28===0;}
function isMob(mon){var o=S.meta.mob||{};return Object.prototype.hasOwnProperty.call(o,mon)?!!o[mon]:suggestedMob(mon);}
function mobSess(mon,d,create){
  var L=S.logs.mobility;
  if(!L){if(!create)return null;L=S.logs.mobility={};}
  var k=mon+'-d'+d;
  if(!L[k]){if(!create)return null;L[k]={};}
  return L[k];
}
function mobDayStatus(mon,d){
  var s=mobSess(mon,d,false);if(!s)return 'none';if(s.done)return 'done';
  var n=0;Object.keys(s.chk||{}).forEach(function(k){if(s.chk[k])n++;});return n?'part':'none';
}
function mobIdx(mon,d){var o=S.meta.mobPick&&S.meta.mobPick[mon+'-d'+d];return (typeof o==='number'&&MOB[o])?o:d;}
function trainDoneOn(date){
  var hit=false;
  Object.keys(S.logs).forEach(function(id){if(id==='mobility')return;var L=S.logs[id]||{};Object.keys(L).forEach(function(k){var x=L[k];if(x&&x.done&&x.date===date)hit=true;});});
  return hit;
}
