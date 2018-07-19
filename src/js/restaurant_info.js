let restaurant;
let reviews;
let isGoogleMapsLoaded = false;
const form = document.querySelector('#add-review-form');
const $favorite_button = document.querySelector('#favorite-button');
const $favorite_button_label = document.querySelector('#favorite-button-label');
/**
 * Fetch restaurant info on page load
 */
document.addEventListener('DOMContentLoaded', () => {
  fetchRestaurantFromURL()
    .then(restaurant => {
      self.restaurant = restaurant;
      fillRestaurantHTML();
      fillBreadcrumb();
      observeMap();
      if (true === restaurant.is_favorite || 'true' === restaurant.is_favorite) {
        toggleFavoriteButton();
      }
    })
    .catch(error => console.log(error));

  navigator.serviceWorker.addEventListener('message', event => {
    console.log(event.data);
    if ('sync-reviews' === event.data.action) {
      DBHelper.syncReviews();
    }
  });
});

/**
 * Initialize Google map, called from HTML.
 */
onGoogleMapsLoad = () => {
  console.log('Google Maps API loaded');
  isGoogleMapsLoaded = true;
};

observeMap = () => {
  if ('IntersectionObserver' in window) {
    let mapContainer = document.querySelector('#map-container');
    let mapObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && isGoogleMapsLoaded) {
          initMap();
          mapObserver.unobserve(entry.target);
        }
      });
    });

    mapObserver.observe(mapContainer);
  } else { // fallback
    initMap();
  }
};

window.initMap = () => {
  self.map = new google.maps.Map(document.querySelector('#map'), {
    zoom: 16,
    center: self.restaurant.latlng,
    scrollwheel: false
  });

  if (self.map) {
    DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
  }
};

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = () => {
  if (self.restaurant) {
    return Promise.resolve(self.restaurant);
  }

  const id = getParameterByName('id');
  if (!id) {
    console.error(`No restaurant id in URL! `);
  } else {
    return DBHelper.fetchRestaurantById(id)
  }
};

fetchReviewsFromURL = () => {
  if (self.reviews) {
    return Promise.resolve(self.reviews);
  }

  const id = getParameterByName('id');
  if (!id) {
    console.error(`No restaurant id in URL! `);
  } else {
    return DBHelper.fetchReviewsByRestaurantId(id);
  }
};

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.setAttribute('srcset', `${DBHelper.imageUrlForRestaurant(restaurant)} 1x, ${DBHelper.imageUrlForRestaurant(restaurant, '@2x')} 2x`);
  image.setAttribute('alt', `${restaurant.name} restaurant in ${restaurant.neighborhood}`);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fetchReviewsFromURL()
    .then(reviews => {
      self.reviews = reviews;
      fillReviewsHTML();
    });
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');
    row.tabIndex = 0;

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  title.tabIndex = 0;
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
};

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const reviewHeader = document.createElement('div');
  const name = document.createElement('span');

  li.classList.add('review-item');
  li.tabIndex = 0;
  name.innerHTML = review.name;
  name.classList.add('review-author');
  name.setAttribute('aria-label', 'Review author');
  reviewHeader.appendChild(name);
  reviewHeader.classList.add('review-header');

  const date = document.createElement('span');
  date.innerHTML = timeAgo(review.updatedAt);
  date.classList.add('review-date');
  date.setAttribute('aria-label', 'Review date');
  reviewHeader.appendChild(date);

  li.appendChild(reviewHeader);

  const rating = document.createElement('p');
  rating.innerHTML = `<span aria-label="Rating">Rating: ${review.rating}</span>`;
  rating.classList.add('review-rating');
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  // sync status
  let reviewSynced = !! review.id;
  if (!reviewSynced) {
    const status = document.createElement('span');
    status.setAttribute('id', `reviewStatus_${review.createdAt}`);
    status.classList.add('badge', reviewSynced ? 'badge--success' : 'badge--warning');
    status.innerHTML = reviewSynced ? 'Synced' : 'Offline';
    li.appendChild(status);
  }

  return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = `<a href="/restaurant.html?id=${restaurant.id}" aria-current="page">${restaurant.name}</a>`;
  breadcrumb.appendChild(li);
};

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
};

/**
 * Very simple validation. If the form is valid, then return the review object
 * @param form
 * @returns {*}|false
 */
validateReviewForm = (form) => {
  const $name = form.querySelector('#reviewer-name');
  const $comment = form.querySelector('#review-comment');
  const $rating = form.querySelector('#review-rating');
  
  let countErrors = 0;
  [$name, $comment].forEach(input => {
    let inputValueWithoutSpaces = input.value.replace(/\s+/g, '');
    let $errorMessageContainer  = form.querySelector(`#error-${input.id}`);
    let $formGroup              = $errorMessageContainer.parentNode;
    if (inputValueWithoutSpaces.length === 0) {
      $errorMessageContainer.innerHTML = 'This field is required!';
      $formGroup.classList.add('has-error');
      countErrors++;
    } else {
      $errorMessageContainer.innerHTML = '';
      $formGroup.classList.remove('has-error');
    }
  });

  if (countErrors) {
    return false;
  }

  let createdAt =(new Date()).getTime();

  return {
    restaurant_id: parseInt(getParameterByName('id'), 10),
    name: $name.value,
    rating: parseInt($rating.value, 10),
    comments: $comment.value,
    createdAt: createdAt,
    updatedAt: createdAt
  };
};

addReview = (review) => {
  // append to dom
  const reviewList = document.getElementById('reviews-list');
  reviewList.insertAdjacentElement('beforeend', createReviewHTML(review));

  // save to IDB
  DBHelper.addReview(review)
    .then(DBHelper.requestSync())
    .catch(err => {
      console.log(err);
    });

  // clear form
  form.reset();
};

addReviewListener = () => {
  // TODO @kp: remove test data (created: 2018. 07. 07.)
  form.querySelector('#reviewer-name').value = 'Peti';
  form.querySelector('#review-comment').value = 'Comment @ ' + new Date();
  
  form.addEventListener('submit', event => {
    event.preventDefault();

    let newReview = validateReviewForm(form);
    if (false !== newReview) {
      addReview(newReview);
    }
  });
};

addReviewListener();

toggleFavoriteButton = () => {
  $favorite_button.classList.toggle('is-favorite');
  if ($favorite_button.classList.contains('is-favorite')) {
    $favorite_button_label.innerHTML = 'Unfavorite';
  } else {
    $favorite_button_label.innerHTML = 'Add to favorites';
  }
};

addFavoriteListener = () => {
  $favorite_button.addEventListener('click', event => {
    event.preventDefault();
    toggleFavoriteButton();
    bookmarkRestaurant();
  })
};

addFavoriteListener();

bookmarkRestaurant = () => {
  if (!self.restaurant) {
    console.error('Restaurant not found');
  }

  DBHelper.favoriteRestaurantById(self.restaurant.id);
};

/**
 * Simple function to relative time format
 * @param t
 * @returns {string}
 */
timeAgo = (t) => {
  let a = new Date(t);
  let today = new Date();
  let yesterday = new Date(Date.now() - 86400000);
  let months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let year = a.getFullYear();
  let month = months[a.getMonth()];
  let date = a.getDate();
  let hour = a.getHours();
  let min = a.getMinutes();
  if (hour < 10) {
    hour = '0' + hour;
  }

  if (min < 10) {
    min = '0' + min;
  }

  if (a.setHours(0, 0, 0, 0) === today.setHours(0, 0, 0, 0))
    return 'today, ' + hour + ':' + min;
  else if (a.setHours(0, 0, 0, 0) === yesterday.setHours(0, 0, 0, 0))
    return 'yesterday, ' + hour + ':' + min;
  else if (year === today.getFullYear())
    return date + ' ' + month + ', ' + hour + ':' + min;
  else
    return date + ' ' + month + ' ' + year + ', ' + hour + ':' + min;
};
