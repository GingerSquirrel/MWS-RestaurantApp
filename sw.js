
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then(function(reg){
    console.log('service worker registered');
  }).catch(function(err){
    console.log('service worker failed');
});
}

self.addEventListener('install', function(event){

  event.waitUntil(
    caches.open('restuarant-app-v1').then(function(cache){
      return cache.addAll([
    '/',
    'js/dbhelper.js',
    'js/main.js',
    'js/restaurant_info.js',
    'css/styles.css',
    'img/',
    'restaurant.html',
    'index.html',
    'data/restaurants.json'

  ]);
    })
  );
});


self.addEventListener('fetch', function(event){
  event.respondWith(
    caches.match(event.request, {ignoreSearch: true}).then(function(response){
      if(response) return response;
      return fetch(event.request);
    })

  );
});
