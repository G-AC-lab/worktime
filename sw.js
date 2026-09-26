/* KIZAMI：圏外でも動かすための仕組み（区切り版・ワンタッチ版の共用）
   通信できるときは最新を取りに行き、取れなければ端末内の控えを使う。
   本体を差し替えたときは、次にオンラインで開いた時点で自動的に新しくなる。 */
var CACHE = "worktime-2";
var FILES = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png",
             "./tap.html", "./manifest-tap.json", "./icon-tap-192.png", "./icon-tap-512.png"];
/* sets.csv は毎回取りに行くのでここには入れない */

self.addEventListener("install", function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){
      return Promise.all(FILES.map(function(f){ return c.add(f).catch(function(){}); }));
    }).then(function(){ return self.skipWaiting(); })
  );
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
        if(hit) return hit;
        var u = new URL(e.request.url);
        return caches.match(u.pathname.indexOf("tap.html") >= 0 ? "./tap.html" : "./index.html");
      });
    })
  );
});
