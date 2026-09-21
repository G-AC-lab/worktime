/* 作業時間記録：圏外でも動かすための仕組み
   通信できるときは最新を取りに行き、取れなければ端末内の控えを使う。
   本体（index.html）を差し替えたときは、次にオンラインで開いた時点で自動的に新しくなる。 */
var CACHE = "worktime-1";
var FILES = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];
/* sets.csv は毎回取りに行くのでここには入れない */

self.addEventListener("install", function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(FILES); }).then(function(){ return self.skipWaiting(); }));
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){ if(k !== CACHE) return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function(e){
  if(e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request).then(function(res){
      var copy = res.clone();
      caches.open(CACHE).then(function(c){ c.put(e.request, copy); }).catch(function(){});
      return res;
    }).catch(function(){
      return caches.match(e.request).then(function(hit){
        return hit || caches.match("./index.html");
      });
    })
  );
});
