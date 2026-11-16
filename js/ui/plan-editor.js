/* Plan editing shared by Today, Month and Settings: edit a workout day, start a new month. */
'use strict';
function openEdit(dayKey){
  var m=getMonth(S.monthId),day=m.days[dayKey]||{title:'',ex:[]},def=DAYS.filter(function(d){return d.k===dayKey;})[0];
  S.modal={type:'edit',dayKey:dayKey,title:'Edit '+def.name,ex:clone(day.ex||[]).map(function(e){e.v=videoFor(e.n)||'';return e;}),dayTitle:day.title||def.name};render();
}
function saveEdit(){
  var M=S.modal,m=getMonth(S.monthId);
  var ex=M.ex.filter(function(e){return String(e.n).trim();}).map(function(e){var o={n:tc(String(e.n).trim()),s:e.s||3,u:e.u||'reps'};if(e.t)o.t=e.t;if(e.r)o.r=e.r;return o;});
  S.meta.videos=S.meta.videos||{};
  M.ex.forEach(function(e){
    var n=String(e.n).trim();if(!n)return;
    var key=normKey(n),v=String(e.v||'').trim();
    if(v&&!/^https?:\/\//i.test(v))v='https://'+v;
    if(v===(VIDEOS[key]||''))delete S.meta.videos[key];else S.meta.videos[key]=v;
  });
  var entry={title:M.dayTitle,ex:ex};
  var custom=(S.meta.custom||[]).filter(function(c){return c.id===m.id;})[0];
  if(custom)custom.days[M.dayKey]=entry;else{S.meta.overrides=S.meta.overrides||{};S.meta.overrides[m.id]=S.meta.overrides[m.id]||{};S.meta.overrides[m.id][M.dayKey]=entry;}
  persistMeta();S.modal=null;render();toast('Plan updated');
}
function openNewMonth(){
  var l=latestDated(),start=l?nextMonday(addDays(l.start,l.weeks*7)):nextMonday(todayISO());
  var t=todayISO();if(start<t&&l&&diffDays(t,addDays(l.start,l.weeks*7-1))<=7)start=start;
  S.modal={type:'newmonth',tpl:(l||getMonths()[getMonths().length-1]).id,start:start,weeks:4};render();
}
function createMonth(){
  var M=S.modal,tpl=getMonth(M.tpl),ms=getMonths(),maxN=0;ms.forEach(function(m){maxN=Math.max(maxN,Math.floor(m.n));});
  if(!M.start){toast('Pick a start date');return;}
  var start=nextMonday(M.start);
  var nm=clone(tpl);nm.id='u'+Date.now().toString(36);nm.n=maxN+1;nm.label='Month '+(maxN+1);nm.start=start;nm.end=addDays(start,M.weeks*7-1);nm.weeks=M.weeks;
  S.meta.custom=(S.meta.custom||[]).concat([nm]);S.monthId=nm.id;S.week=0;S.tab='today';S.modal=null;
  S.meta.sel={monthId:nm.id,week:0};persistMeta();render();window.scrollTo(0,0);toast(nm.label+' created');
}

MODALS['edit']=function(M){
  var h='';
    h+='<h2>'+esc(M.title)+'</h2><p class="muted small" style="margin:0 0 6px">Names, sets, order, and a video link for each movement. Names and sets apply to this month only; a video link is remembered for every month with the same exercise.</p>';
    M.ex.forEach(function(e,i){
      h+='<div class="edrow"><input data-f="ed-n" data-i="'+i+'" value="'+esc(e.n)+'" aria-label="Exercise name"><input data-f="ed-s" data-i="'+i+'" inputmode="numeric" value="'+e.s+'" aria-label="Sets">'
        +'<span class="row" style="gap:2px"><button class="btn sm ghost" data-act="ed-up" data-i="'+i+'" aria-label="Move up">\u2191</button><button class="btn sm ghost" data-act="ed-down" data-i="'+i+'" aria-label="Move down">\u2193</button><button class="btn sm ghost danger" data-act="ed-del" data-i="'+i+'" aria-label="Remove">\u2715</button></span></div><input class="vin" data-f="ed-v" data-i="'+i+'" inputmode="url" placeholder="Video link (optional)" value="'+esc(e.v||'')+'" aria-label="Video link for '+esc(e.n)+'">';
    });
    h+='<div style="margin-top:10px"><button class="btn sm" data-act="ed-add">Add exercise</button></div><div class="row" style="margin-top:16px"><button class="btn primary grow" data-act="ed-save">Save plan</button><button class="btn" data-act="closemodal">Cancel</button></div>';
  return h;
};
MODALS['newmonth']=function(M){
  var h='';
    var ms=getMonths(),lastDated=latestDated();
    h+='<h2>Start a new month</h2><div class="stack"><div><label class="small muted" for="nm-t">Copy exercises from</label><select class="sel" id="nm-t" data-f="nm-t" style="width:100%">'+ms.slice().reverse().map(function(m){return '<option value="'+m.id+'"'+(m.id===M.tpl?' selected':'')+'>'+esc(m.label)+'</option>';}).join('')+'</select></div>'
      +'<div><label class="small muted" for="nm-d">First Monday</label><input class="field" id="nm-d" type="date" data-f="nm-d" value="'+esc(M.start)+'"></div>'
      +'<div><label class="small muted" for="nm-w">Weeks</label><input class="field" id="nm-w" type="text" inputmode="numeric" data-f="nm-w" value="'+M.weeks+'"></div></div>'
      +'<div class="row" style="margin-top:16px"><button class="btn primary grow" data-act="nm-create">Create month</button><button class="btn" data-act="closemodal">Cancel</button></div>';
  return h;
};

ACTIONS['edit']=function(el,v){openEdit(v);};
ACTIONS['ed-add']=function(el,v){S.modal.ex.push({n:'New Exercise',s:3,u:'reps'});render();};
ACTIONS['ed-del']=function(el,v){S.modal.ex.splice(+el.getAttribute('data-i'),1);render();};
ACTIONS['ed-up']=function(el,v){var i3=+el.getAttribute('data-i');if(i3>0){var t3=S.modal.ex[i3];S.modal.ex[i3]=S.modal.ex[i3-1];S.modal.ex[i3-1]=t3;}render();};
ACTIONS['ed-down']=function(el,v){var i4=+el.getAttribute('data-i');if(i4<S.modal.ex.length-1){var t4=S.modal.ex[i4];S.modal.ex[i4]=S.modal.ex[i4+1];S.modal.ex[i4+1]=t4;}render();};
ACTIONS['ed-save']=function(el,v){saveEdit();};
ACTIONS['newmonth']=function(el,v){openNewMonth();};
ACTIONS['nm-create']=function(el,v){createMonth();};
INPUTS['ed-n']=function(t){S.modal.ex[+t.getAttribute('data-i')].n=t.value;};
INPUTS['ed-v']=function(t){S.modal.ex[+t.getAttribute('data-i')].v=t.value;};
INPUTS['ed-s']=function(t){S.modal.ex[+t.getAttribute('data-i')].s=Math.max(1,Math.min(12,parseInt(t.value,10)||1));};
INPUTS['nm-d']=function(t){S.modal.start=t.value;};
INPUTS['nm-w']=function(t){S.modal.weeks=Math.max(1,Math.min(6,parseInt(t.value,10)||4));};
CHANGES['nm-t']=function(t){S.modal.tpl=t.value;};
