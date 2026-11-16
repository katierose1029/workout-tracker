/* Storage: localStorage cache + optional Firestore sync. */
'use strict';
/* ---------- storage ---------- */
var Store={db:null,uid:'local',timers:{},mem:{},
  lk:function(id){return 'ppw1:'+this.uid+':'+id;},
  localGet:function(id){try{var v=localStorage.getItem(this.lk(id));return v?JSON.parse(v):null;}catch(e){return null;}},
  localSet:function(id,obj){try{localStorage.setItem(this.lk(id),JSON.stringify(obj));}catch(e){}},
  docRef:function(id){return this.db.collection('users/'+this.uid+'/data').doc(id);},
  save:function(id,body){
    var obj={ts:Date.now(),body:body};
    this.mem[id]=obj;this.localSet(id,obj);
    if(!this.db)return;
    var self=this;clearTimeout(this.timers[id]);
    this.timers[id]=setTimeout(function(){
      self.docRef(id).set(obj).then(function(){S.mode='account';setStatus();}).catch(function(){S.mode='device';setStatus();});
    },700);
  },
  loadAll:function(){
    var self=this,res={};
    return new Promise(function(resolve){
      var done=false;
      function finish(){if(done)return;done=true;resolve(res);}
      var t=setTimeout(finish,10000);
      if(!self.db){clearTimeout(t);finish();return;}
      self.db.collection('users/'+self.uid+'/data').get().then(function(snap){
        snap.docs.forEach(function(d){var v=d.data();if(v)res[d.id]=v;});
        clearTimeout(t);finish();
      }).catch(function(){clearTimeout(t);finish();});
    });
  }
};
function persistLog(monthId){Store.save('log-'+monthId,S.logs[monthId]||{});}
function persistMeta(){Store.save('meta',S.meta);}
function setStatus(){var el=document.getElementById('savestat');if(el)el.textContent=statusText();}
function statusText(){return S.mode==='account'?'Saved to your account':'Saved on this device only';}
