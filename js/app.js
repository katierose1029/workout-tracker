/* Boot: load saved data, wire up DOM events, register the service worker. Loaded last. */
'use strict';
function init(){
  var th=null;try{th=localStorage.getItem('ppw1:theme');}catch(e){}
  if(th==='light'||th==='dark'){S.theme=th;document.documentElement.setAttribute('data-theme',th);}
  pickInitialSelection();render();
  var ready,timeout;
  if(window.AppBackend&&window.AppBackend.configured){ready=window.AppBackend.ready();timeout=new Promise(function(){});}
  else{ready=(window.claude&&window.claude.use)?Promise.all([window.claude.use('db'),window.claude.use('user')]):Promise.resolve([null,null]);
  timeout=new Promise(function(r){setTimeout(function(){r([null,null]);},10000);});}
  Promise.race([ready,timeout]).then(function(r){
    var db=r[0],user=r[1];
    if(db&&user&&user.id){return user.id().then(function(id){Store.db=db;Store.uid=id;});}
  }).catch(function(){}).then(function(){return Store.loadAll();}).then(function(remote){
    var ids={};Object.keys(remote).forEach(function(k){ids[k]=1;});
    // include local docs
    try{for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i),pre='ppw1:'+Store.uid+':';if(k.indexOf(pre)===0)ids[k.slice(pre.length)]=1;}}catch(e){}
    Object.keys(ids).forEach(function(id){
      var a=remote[id],b=Store.mem[id]||Store.localGet(id),pick=a;
      if(b&&(!a||(b.ts||0)>(a.ts||0))){pick=b;if(Store.db){Store.docRef(id).set(b).catch(function(){});}}
      if(!pick||!pick.body)return;
      /* The database hands back frozen (read-only) documents. Copy them deeply so the page can edit its own data. */
      var body=JSON.parse(JSON.stringify(pick.body));
      if(id==='meta'){S.meta=Object.assign({custom:[],overrides:{},videos:{},mob:{},cycle:{},dayMap:{},sel:null},body);}
      else if(id.indexOf('log-')===0){S.logs[id.slice(4)]=body;}
    });
    try{
      var fixEx=function(a){(a||[]).forEach(function(e){if(e&&e.n)e.n=tc(e.n);});};
      var ov=S.meta.overrides||{};Object.keys(ov).forEach(function(mid){Object.keys(ov[mid]||{}).forEach(function(dk){fixEx(ov[mid][dk]&&ov[mid][dk].ex);});});
      (S.meta.custom||[]).forEach(function(cm){Object.keys(cm.days||{}).forEach(function(dk){fixEx(cm.days[dk]&&cm.days[dk].ex);});});
      var sb=S.meta.subs||{};Object.keys(sb).forEach(function(mid){Object.keys(sb[mid]||{}).forEach(function(dk){Object.keys(sb[mid][dk]||{}).forEach(function(k){var r=sb[mid][dk][k];if(r&&r.n)r.n=tc(r.n);});});});
      Object.keys(S.logs).forEach(function(mid){if(mid==='mobility')return;var L=S.logs[mid]||{};Object.keys(L).forEach(function(sk){var x=L[sk];if(!x)return;if(x.ex)Object.keys(x.ex).forEach(function(k){if(x.ex[k]&&x.ex[k].n)x.ex[k].n=tc(x.ex[k].n);});if(x.sub)Object.keys(x.sub).forEach(function(k){if(x.sub[k])x.sub[k]=tc(x.sub[k]);});});});
    }catch(e){}
    S.mode=Store.db?'account':'device';
    pickInitialSelection();S.ready=true;render();
  });
}

/* ---------- events ---------- */
document.addEventListener('click',function(e){
  var el=e.target.closest('[data-act]');if(!el)return;
  if(el.tagName==='SELECT')return;
  lastTarget=e.target;
  var a=el.getAttribute('data-act');
  if(a==='closemodal-bg'&&e.target!==el)return;
  var fn=ACTIONS[a];if(fn)fn(el,el.getAttribute('data-v'));
});
document.addEventListener('input',function(e){var t=e.target,f=t.getAttribute&&t.getAttribute('data-f');if(f&&INPUTS[f])INPUTS[f](t);});
document.addEventListener('change',function(e){
  var t=e.target;
  if(t.matches&&t.matches('select[data-act="selmonth"]')){selectMonth(t.value);return;}
  var f=t.getAttribute&&t.getAttribute('data-f');if(f&&CHANGES[f])CHANGES[f](t);
});
document.addEventListener('toggle',function(e){var t=e.target;if(t.tagName==='DETAILS'&&t.getAttribute('data-det')){S.open[t.getAttribute('data-det')]=t.open;}},true);

init();
if('serviceWorker' in navigator&&location.protocol!=='file:'){window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){});});}
