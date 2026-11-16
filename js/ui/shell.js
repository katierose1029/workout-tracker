/* App shell: page registry, render loop, tab bar, toast, modals, shared widgets.
   Each page file (js/pages/*.js) registers itself in PAGES and adds its own
   click handlers (ACTIONS), input/change handlers (INPUTS/CHANGES) and modals (MODALS). */
'use strict';
var PAGES={};    /* tab id -> {label, view} ; TABS sets the order in the tab bar */
var TABS=['today','month','progress','settings'];
var ACTIONS={};  /* data-act -> function(el, value) */
var INPUTS={};   /* data-f   -> function(target)  on 'input'  */
var CHANGES={};  /* data-f   -> function(target)  on 'change' */
var MODALS={};   /* S.modal.type -> function(modal) returning the sheet's inner HTML */

function render(){
  var y=window.scrollY,app=document.getElementById('app'),oldR=document.querySelector('.range'),sl=oldR?oldR.scrollLeft:null;
  var body='';
  if(!S.ready)body='<div class="card" role="status" style="margin-top:40px">Loading your logs\u2026</div>';
  else body=(PAGES[S.tab]||PAGES.today).view();
  app.innerHTML='<main>'+body+'</main>'+tabBar()+modalHTML()+(S.toast?'<div class="toast" role="status">'+esc(S.toast)+'</div>':'');
  var nr=document.querySelector('.range');
  if(nr){nr.scrollLeft=(sl==null)?nr.scrollWidth:sl;}
  window.scrollTo(0,y);
}
function tabBar(){
  return '<nav class="tabs" aria-label="Sections">'+TABS.map(function(id){
    return '<button data-act="tab" data-v="'+id+'"'+(S.tab===id?' aria-current="page"':'')+'>'+ICON[id]+'<span>'+PAGES[id].label+'</span></button>';}).join('')+'</nav>';
}
function toast(msg){S.toast=msg;render();setTimeout(function(){if(S.toast===msg){S.toast='';render();}},2200);}

function monthOptions(sel){
  return getMonths().map(function(m){
    return '<option value="'+m.id+'"'+(m.id===sel?' selected':'')+'>'+esc(m.label)+'</option>';}).join('');
}
function weekChips(m){
  var h='<div class="weeks" role="group" aria-label="Week">';
  for(var w=0;w<m.weeks;w++)h+='<button class="chip" data-act="week" data-v="'+w+'" aria-pressed="'+(S.week===w)+'">Week '+(w+1)+'</button>';
  return h+'</div>';
}

function modalHTML(){
  var M=S.modal;if(!M)return '';
  var fn=MODALS[M.type];
  return '<div class="scrim" data-act="closemodal-bg"><div class="sheet" role="dialog" aria-modal="true" aria-label="'+esc(M.title||'Dialog')+'">'+(fn?fn(M):'')+'</div></div>';
}
MODALS['confirm']=function(M){
  var h='';
    h+='<h2>'+esc(M.title)+'</h2><p>'+esc(M.text)+'</p><div class="row" style="margin-top:14px"><button class="btn danger grow" data-act="confirm-yes">'+esc(M.yes)+'</button><button class="btn" data-act="closemodal">Cancel</button></div>';
  return h;
};
MODALS['text']=function(M){
  var h='';
    h+='<h2>'+esc(M.title)+'</h2><p class="muted small">Select all and copy this text.</p><textarea class="field" style="min-height:200px" readonly onfocus="this.select()">'+esc(M.text)+'</textarea><div style="margin-top:12px"><button class="btn" data-act="closemodal">Close</button></div>';
  return h;
};

var lastTarget=null;
function saveSel(){S.meta.sel={monthId:S.monthId,week:S.week};persistMeta();}
function selectMonth(id){S.monthId=id;S.week=0;var h=monthForDate(todayISO());if(h&&h.m.id===id)S.week=h.week;saveSel();render();}

/* ----- shared actions ----- */
ACTIONS['tab']=function(el,v){S.tab=v;render();window.scrollTo(0,0);};
ACTIONS['week']=function(el,v){S.week=+v;saveSel();render();};
ACTIONS['selmonth']=function(el,v){};
ACTIONS['closemodal']=function(el,v){S.modal=null;render();};
ACTIONS['closemodal-bg']=function(el,v){if(el===lastTarget)S.modal=null,render();};
ACTIONS['confirm-yes']=function(el,v){if(S.modal&&S.modal.run)S.modal.run();};
