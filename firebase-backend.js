/* Firebase backend for Workout Tracker (Auth + Firestore).
   Exposes window.AppBackend.ready() -> Promise<[db, user]> where db is Firestore (compat API)
   and user = {id: () => Promise<uid>}. Resolves [null,null] when the user chooses "device only",
   or when Firebase is not configured / not reachable, so the app keeps working offline. */
(function(){
  var cfg=window.FIREBASE_CONFIG||{};
  var configured=cfg.apiKey&&cfg.apiKey.indexOf('REPLACE_ME')!==0&&window.firebase;
  var emu=/[?&]emulator=1/.test(location.search)||(function(){try{return localStorage.getItem('ppw1:emulator')==='1';}catch(e){return false;}})();
  var auth=null,db=null;

  function el(html){var d=document.createElement('div');d.innerHTML=html;return d.firstChild;}
  var CSS='#authov{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:16px;font:16px -apple-system,BlinkMacSystemFont,sans-serif}'
    +'#authov .box{background:#fff;color:#111;border-radius:16px;padding:20px;width:100%;max-width:360px;display:flex;flex-direction:column;gap:10px}'
    +'#authov input{font-size:16px;padding:10px;border:1px solid #bbb;border-radius:8px}'
    +'#authov button{font-size:16px;padding:10px;border-radius:8px;border:1px solid #888;background:#f3f3f3}'
    +'#authov button.pri{background:#111;color:#fff;border-color:#111}#authov .err{color:#b00020;font-size:14px;min-height:18px}';

  function showLogin(){
    return new Promise(function(resolve){
      var st=document.createElement('style');st.textContent=CSS;document.head.appendChild(st);
      var ov=el('<div id="authov"><form class="box" id="authform" novalidate><h2 style="margin:0">Sign in</h2>'
        +'<p style="margin:0;font-size:14px;color:#555">Sign in to save your workouts to your account and sync across devices.</p>'
        +'<input id="authemail" type="email" autocomplete="email" placeholder="Email" aria-label="Email">'
        +'<input id="authpass" type="password" autocomplete="current-password" placeholder="Password (6+ characters)" aria-label="Password">'
        +'<div class="err" id="autherr" role="alert"></div>'
        +'<button class="pri" id="authin" type="submit">Sign in</button>'
        +'<button id="authup" type="button">Create account</button>'
        +'<button id="authreset" type="button">Forgot password</button>'
        +'<button id="authskip" type="button">Use on this device only</button></form></div>');
      document.body.appendChild(ov);
      var $=function(id){return document.getElementById(id);};
      function err(e){$('autherr').textContent=(e&&e.message||String(e)).replace('Firebase: ','');}
      function done(u){ov.remove();st.remove();resolve(u);}
      function creds(){return [$('authemail').value.trim(),$('authpass').value];}
      $('authform').addEventListener('submit',function(ev){ev.preventDefault();var c=creds();
        auth.signInWithEmailAndPassword(c[0],c[1]).then(function(r){done(r.user);}).catch(err);});
      $('authup').addEventListener('click',function(){var c=creds();
        auth.createUserWithEmailAndPassword(c[0],c[1]).then(function(r){done(r.user);}).catch(err);});
      $('authreset').addEventListener('click',function(){var c=creds();
        if(!c[0]){err('Enter your email first.');return;}
        auth.sendPasswordResetEmail(c[0]).then(function(){err('Password reset email sent.');}).catch(err);});
      $('authskip').addEventListener('click',function(){done(null);});
    });
  }

  function currentUser(){
    return new Promise(function(resolve){
      var off=auth.onAuthStateChanged(function(u){off();resolve(u);});
    });
  }

  var AppBackend={
    configured:!!configured,
    ready:function(){
      if(!configured)return Promise.resolve([null,null]);
      try{
        if(!firebase.apps.length)firebase.initializeApp(cfg);
        auth=firebase.auth();db=firebase.firestore();
        if(emu){auth.useEmulator('http://127.0.0.1:9099',{disableWarnings:true});db.useEmulator('127.0.0.1',8080);}
        else{try{db.enablePersistence({synchronizeTabs:true}).catch(function(){});}catch(e){}}
      }catch(e){return Promise.resolve([null,null]);}
      return currentUser().then(function(u){return u||showLogin();}).then(function(u){
        if(!u)return [null,null];
        return [db,{id:function(){return Promise.resolve(u.uid);}}];
      });
    },
    signOut:function(){return auth?auth.signOut():Promise.resolve();}
  };
  window.AppBackend=AppBackend;
})();
