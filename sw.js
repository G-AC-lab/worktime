/* KIZAMI：圏外でも動かすための仕組み
   通信できるときは最新を取りに行き、取れなければ端末内の控えを使う。
   区切り版とワンタッチ版は同じサイト内にあるため、控えの名前を分け、
   相手の控えは消さないようにしている。 */
var PREFIX = "worktime-";
var CACHE = PREFIX + "3";
var FILES = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];
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
      return Promise.all(keys.map(function(k){
        if(k.indexOf(PREFIX) === 0 && k !== CACHE) return caches.delete(k);
      }));
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
      return caches.open(CACHE).then(function(c){
        return c.match(e.request).then(function(hit){ return hit || c.match("./index.html"); });
      });
    })
  );
});
