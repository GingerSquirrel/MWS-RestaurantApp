
//console.log("service worker disabled for idb, reenable when done");

const nameOfCache = "restuarant-app-v1";

self.addEventListener('install', function(event){

  event.waitUntil(
    caches.open(nameOfCache).then(function(cache){
      return cache.addAll([
    '/',
    'js/dbhelper.js',
    'js/main.js',
    'js/restaurant_info.js',
    'js/idb.js',
    'js/index.js',
    'css/styles.css',
    'img/',
    'restaurant.html',
    'index.html',
    'data/restaurants.json'

  ]);
    })
  );
});


self.addEventListener('activate',  event => {
  //Allows pages to be controlled immediately (no reload)
  event.waitUntil(self.clients.claim());
});


self.addEventListener('fetch', function(event){
  event.respondWith(
    // checks cache
    caches.match(event.request, {ignoreSearch: true}).then(response => {
      return response || fetch(event.request);
    })
  );
});

//network falling back to cache - might need for optimisation

/*
self.addEventListener('fetch', function(event){
  event.respondWith(
    // checks cache
    fetch(event.request).catch(function(){
      return caches.match(event.request, {ignoreSearch: true});
    })
  );
});

*/
