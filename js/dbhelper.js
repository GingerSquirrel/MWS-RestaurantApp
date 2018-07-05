

/**
 * Common database helper functions.
 */
class DBHelper {


  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants/`;
  }

  static get DATABASE_URL_REVIEWS(){
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/reviews/`;
  }


  static getFormattedDate(unformattedDate){
    var dateString = "";
    var date = new Date(unformattedDate);
    var months = ["January", "Februrary", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    dateString += months[date.getMonth()]+" ";
    dateString += date.getDate()+", ";
    dateString += date.getFullYear();
    return dateString;
  }


  static moveCachedReviewsToServer(callback){
    //check that there are some reviews
    DBHelper.getCachedReviewDataFromDatabase().then(reviews => {
      if(reviews.length) {
        //there are reviews
        fetch("http://localhost:1337/reviews/", {
        method: 'POST',
        body: JSON.stringify(reviews),
        headers: {
          'content-type': 'application/json'
          }
        }).then(reviews => {
          idb.delete('restaurant-reviews-cache');
          callback(null, true);
        }).catch(error => {
          callback(error, null);
        });

      } else {
        //no reviews
        callback(null, true);
      }
    })
  }


  static getCachedReviewDataFromDatabase(){
    return DBHelper.openReviewsDatabaseCache().then(function(db){
    if(!db){
       return;
       }

      var store = db.transaction('reviews').objectStore('reviews');
      return store.getAll();

    })
  }




    static openReviewsDatabaseCache(){
    /*Check if the browser supports services workers*/
      if (!navigator.serviceWorker) {
        return Promise.resolve();
      }
    /* Create idb */
     return idb.open('restaurant-reviews-cache', 1, upgradeDb => {
        var store = upgradeDb.createObjectStore('reviews', {
          keyPath: 'restaurant_id'
      });
      store.createIndex('by-id', 'restaurant_id');
    })

  }

  static cacheReviewToDatabase(messages){
    return DBHelper.openReviewsDatabaseCache().then(function(db){
      if(!db){
        return;
      }

      var tx = db.transaction('reviews', 'readwrite');
      var store = tx.objectStore('reviews');
      messages.forEach(function(message){
        store.put(message);
      });
      return tx.complete;
    })
  }


  static fetchReviewsByRestaurantId(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchReviews((error, reviews) => {
      if (error) {
        callback(error, null);
      } else {
        const review = reviews.filter(r => r.restaurant_id == id);
        if (review) { // Got the restaurant
          callback(null, review);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  static fetchReviews(callback) {

    return DBHelper.getReviewDataFromDatabase().then(reviews => {
      if(reviews.length) {
        return Promise.resolve(reviews);
      } else {

        // add in get reviews ID too, below funciton only gets first 6
        return DBHelper.getReviewsFromWeb();
      }
    }).then(reviews => {
      callback(null, reviews);
    }).catch(error => {
      callback(error, null);
    });
  }

  static getReviewDataFromDatabase(){
    return DBHelper.openReviewsDatabase().then(function(db){
    if(!db){
       return;
       }

      var store = db.transaction('reviews').objectStore('reviews');
      return store.getAll();

    })
  }

  static openReviewsDatabase(){
    /*Check if the browser supports services workers*/
    if (!navigator.serviceWorker) {
      return Promise.resolve();
    }
    /* Create idb */
    return idb.open('restaurant-reviews2', 1, upgradeDb => {
      var store = upgradeDb.createObjectStore('reviews', {
        keyPath: 'id'
      });
      store.createIndex('by-id', 'id');
    })
  }

  static getReviewsFromWeb(){
    return fetch(DBHelper.DATABASE_URL_REVIEWS)
    .then(function(response){
      return response.json();
    }).then(reviews => {
      DBHelper.saveToReviewsDatabase(reviews);
      return reviews;
    });
  }

  static getReviewsFromWebId(id){
    return fetch(DBHelper.DATABASE_URL_REVIEWS+"?restaurant_id="+id)
    .then(function(response){
      return response.json();
    }).then(reviews => {
      DBHelper.saveToReviewsDatabase(reviews);
      return reviews;
    });
  }

  static saveToReviewsDatabase(messages){
  return DBHelper.openReviewsDatabase().then(function(db){
    if(!db){
       return;
    }

    var tx = db.transaction('reviews', 'readwrite');
    var store = tx.objectStore('reviews');
    messages.forEach(function(message){
      store.put(message);
    });

    return tx.complete;
  })
}


  static openDatabase(){
    /*Check if the browser supports services workers*/
      if (!navigator.serviceWorker) {
        return Promise.resolve();
      }
    /* Create idb */
     return idb.open('restaurant-reviews', 1, upgradeDb => {
        var store = upgradeDb.createObjectStore('restaurant', {
          keyPath: 'id'
      });
      store.createIndex('by-id', 'id');
    })

  }

  static saveToDatabase(messages){
  return DBHelper.openDatabase().then(function(db){
    if(!db){
      return;
    }

    var tx = db.transaction('restaurant', 'readwrite');
    var store = tx.objectStore('restaurant');
    messages.forEach(function(message){
      store.put(message);
    });

    return tx.complete;
  })
}

  static getFromWeb(){
    return fetch(DBHelper.DATABASE_URL)
    .then(function(response){
      return response.json();
    }).then(restaurants => {
      DBHelper.saveToDatabase(restaurants);
      return restaurants;
    });
  }

  static getDataFromDatabase(){
    return DBHelper.openDatabase().then(function(db){
    if(!db){
       return;
       }

      var store = db.transaction('restaurant').objectStore('restaurant');
      return store.getAll();

    })
  }


  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {

    return DBHelper.getDataFromDatabase().then(restaurants => {
      if(restaurants.length) {
        return Promise.resolve(restaurants);
      } else {
        return DBHelper.getFromWeb();
      }
    }).then(restaurants => {
      callback(null, restaurants);
    }).catch(error => {
      callback(error, null);
    });
  }



  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    if(restaurant.photograph == undefined){
      return (`/img/0.webp`);
    }
    return (`/img/${restaurant.photograph}.webp`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }

  static serviceWorker(){
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(function(reg){
        console.log('service worker registered');
      }).catch(function(err){
        console.log('service worker failed');
    });
    }
  }

}



