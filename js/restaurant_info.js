let restaurant;
var map;


document.addEventListener('DOMContentLoaded', (event) => {
  DBHelper.serviceWorker();
  fetchRestaurantFromURL();
})


/**
 * Initialize Google map, called from HTML.
 */
setMapTitle = () => {
  const mapFrame = document.querySelector('#map').querySelector('iframe');
  mapFrame.setAttribute('title', 'Google map showing the location of this restaurant');

};

window.initRestMap = () => {
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 16,
    center: self.restaurant.latlng,
    scrollwheel: false
  });

  DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
  self.map.addListener('tilesloaded', setMapTitle);
}


loadStaticMap = (restaurant = self.restaurant) => {
  var map = document.getElementById('map-container');
  map.setAttribute('onclick', 'loadMap();');

  var url = "https://maps.googleapis.com/maps/api/staticmap?"
  //+"center=Brooklyn+Bridge,New+York,NY"
  +"&zoom=11"
  +"&size=600x300"
  +"&maptype=roadmap";
  url += `&markers=color:red%7C${restaurant.latlng.lat},${restaurant.latlng.lng}`;
  url += "&key=AIzaSyC89Xoq-j_tvlTwr_T6772k0DvAi0aEvpI";
  map.setAttribute("style", "background-image:url("+url+"); background-size: cover; background-position:center;");
}

loadMap = () => {
  var tag = document.createElement("script");
  tag.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyC89Xoq-j_tvlTwr_T6772k0DvAi0aEvpI&libraries=places&callback=initRestMap";
  document.getElementsByTagName("body")[0].appendChild(tag);

  var element = document.createElement("div");
  element.id = "map";
  document.getElementById("map-container").appendChild(element);
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = () => {

  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    console.log("error getting restaurant")
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.log(error);
        return;
      }
      fillBreadcrumb();
      fillRestaurantHTML();
      loadStaticMap();
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {

  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const fave = document.getElementById('fave-button');
  fave.setAttribute('data-toggle', restaurant.is_favorite);

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  //image.alt = restaurant.alt;

  image.src = DBHelper.imageUrlForRestaurant(restaurant);

  if(image.src.endsWith('/img/0.jpg')){
    image.alt = "Awaiting photograph of restaurant";
  }else{
    image.alt = "A photograph of the Restaurant";
  }

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
}



toggleFaveButton = () => {
  var buttonData = document.getElementById('fave-button').getAttribute('data-toggle');
  if(buttonData == "true"){
    //button data is true

    fetch("http://localhost:1337/restaurants/"+self.restaurant.id+"/?is_favorite=false", {
      method: 'PUT',
    }).then(response => {
      response.json
    }).catch((error) => {
      console.log('error adding fave: ' + error);
    }).then(response => {
      console.log('Fave removed')
      document.getElementById('fave-button').setAttribute('data-toggle', 'false');
      DBHelper.getFromWeb();
    });

  }else{
    //button data is false

    fetch("http://localhost:1337/restaurants/"+self.restaurant.id+"/?is_favorite=true", {
      method: 'PUT',
    }).then(response => {
      response.json
    }).catch((error) => {
      console.log('error adding fave: ' + error);
    }).then(response => {
      console.log('Fave added')
      document.getElementById('fave-button').setAttribute('data-toggle', 'true');
      DBHelper.getFromWeb();
    });
  }
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */

fillReviewsHTML = () => {


  DBHelper.moveCachedReviewsToServer((err, done) => {
    if(done){
      DBHelper.getReviewsFromWebId(self.restaurant.id);
    }
  });

  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  container.appendChild(title);


  //DBHelper.getReviews(self.restaurant.id, (err, reviews) => {
  DBHelper.fetchReviewsByRestaurantId(self.restaurant.id, (err, reviews) => {
  if (!reviews || err) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    createReviewSubmissionForm();
    return;
  }

  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);

  createReviewSubmissionForm();
  })
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {

  let date = review.createdAt != undefined ? DBHelper.getFormattedDate(review.createdAt) : "Just added!";

  const li = document.createElement('li');
  li.className = "review-item";
  const div = document.createElement('div')
  div.className = "review-inner";

  const name = document.createElement('div');

  name.className = "review-top";
  name.innerHTML = "<span class='review-name'>"+review.name+"</span><span class='review-date'>"+date+"</span>";
  div.appendChild(name);

  /*
  const date = document.createElement('p');
  date.innerHTML = review.date;
  li.appendChild(date);
  */


  const comments = document.createElement('div');
  comments.className = "review-comments";
  comments.innerHTML = `<span class='review-rating'>Rating: ${review.rating}</span><p>${review.comments}</p>`;
  div.appendChild(comments);


  li.append(div);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  li.setAttribute('aria-current', "page");
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

createReviewSubmissionForm = () => {
  const formDiv = document.getElementById("add-review");
  const form = document.createElement('form');

  /* fields here */
  const nameLabel = document.createElement('label');
  nameLabel.htmlFor = "reviewFormName";
  nameLabel.innerHTML = "Name";
  form.append(nameLabel);

  const name = document.createElement('input');
  name.id = "reviewFormName";
  name.type = "text";
  name.name = "name";
  form.append(name);

  const labelRating = document.createElement('label');
  labelRating.htmlFor = "reviewFormRating";
  labelRating.innerHTML = "Star Rating";
  form.append(labelRating);

  const rating = document.createElement('select');
  rating.id = "reviewFormRating";
  rating.name = "rating";
  for(var i = 5; i > 0; i--){
    option = document.createElement('option');
    option.value = option.text = i;
    rating.appendChild(option);
  }
  form.append(rating);

  const reviewLabel = document.createElement('label');
  reviewLabel.htmlFor = "reviewFormReview";
  reviewLabel.innerHTML = "Review: ";
  form.append(reviewLabel);

  const review = document.createElement('textarea');
  review.id = "reviewFormReview";
  review.name = "review";
  form.append(review);

  const button = document.createElement('button');
  button.innerHTML = "Submit Review";
  button.onclick = sendReview;
  form.append(button);

  formDiv.appendChild(form);
}

function sendReview(event){
  event.preventDefault();
  console.log("send review function run");

  const name = document.getElementById("reviewFormName").value
  const rating = document.getElementById("reviewFormRating").value;
  const review = document.getElementById("reviewFormReview").value;
  const id = self.restaurant.id;
  //const time = Date.now();

  const reviewObj = {
    "restaurant_id": id,
    "name": name,
    "rating": rating,
    "comments": review
  }

if(navigator.onLine){

  fetch("http://localhost:1337/reviews/", {
    method: 'POST',
    body: JSON.stringify(reviewObj),
    headers: {
      'content-type': 'application/json'
    }
  }).then(response => {
    response.json
  }).catch((error) => {
    console.log('error adding review: ' + error);
  }).then(response => {
    console.log('Review added');
    console.log(reviewObj);
    const ul = document.getElementById('reviews-list');
    ul.appendChild(createReviewHTML(reviewObj));

    DBHelper.getReviewsFromWebId(self.restaurant.id);
    document.getElementById('add-review').innerHTML = "Thank-you!";

  });
}else{
   console.log("add offline cache");

   DBHelper.cacheReviewToDatabase([reviewObj]);

   document.getElementById('add-review').innerHTML = "Thank-you! Your review will be uploaded next time you go online.";
   }
}

