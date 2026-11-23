/* Offline support. Bump VERSION whenever you change any app file (index.html, css/, js/) so phones pick it up. */
var VERSION='v7';
var CACHE='workout-tracker-'+VERSION;
var SHELL=['firebase-config.js','firebase-backend.js','./','index.html','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png','icons/apple-touch-icon.png',
  'css/base.css',
  'css/today.css',
  'css/month.css',
  'css/progress.css',
  'js/data/program.js',
  'js/data/videos.js',
  'js/data/mobility.js',
  'js/data/cycle.js',
  'js/core/helpers.js',
  'js/core/state.js',
  'js/core/program.js',
  'js/core/store.js',
  'js/core/stats.js',
  'js/core/mobility.js',
  'js/core/cycle.js',
  'js/ui/shell.js',
  'js/ui/plan-editor.js',
  'js/pages/today.js',
  'js/pages/month.js',
  'js/pages/progress.js',
  'js/pages/settings.js',
  'js/app.js'];
self.addEventListener('install',function(e){e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(SHELL);}).then(function(){return self.skipWaiting();}));});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k.indexOf('workout-tracker-')===0&&k!==CACHE;}).map(function(k){return caches.delete(k);}));}).then(function(){return self.clients.claim();}));});
self.addEventListener('fetch',function(e){
  var req=e.request;if(req.method!=='GET')return;
  var url=new URL(req.url);
  /* Fonts and other outside files: use them when online, keep a copy for offline. */
  if(url.origin!==location.origin){
    e.respondWith(caches.open(CACHE).then(function(c){return fetch(req).then(function(r){c.put(req,r.clone());return r;}).catch(function(){return c.match(req);});}));
    return;
  }
  /* Our own files: show the saved copy right away, refresh it in the background. */
  e.respondWith(caches.open(CACHE).then(function(c){
    return c.match(req,{ignoreSearch:true}).then(function(hit){
      var net=fetch(req).then(function(r){if(r&&r.ok)c.put(req,r.clone());return r;}).catch(function(){return hit;});
      return hit||net;
    });
  }));
});
