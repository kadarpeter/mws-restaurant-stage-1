let restaurant;

/**
 * Fetch restaurant info on page load
 */
document.addEventListener('DOMContentLoaded', () => {
  fetchRestaurantFromURL()
    .then(restaurant => {
      self.restaurant = restaurant;
      fillRestaurantHTML();
      fillBreadcrumb();
    })
    .catch(error => console.log(error));
});

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL()
    .then((restaurant) => {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });

      if (self.map) {
        DBHelper.mapMarkerForRestaurant(restaurant, self.map);
      }
  });
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
  fillReviewsHTML();
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
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
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
  date.innerHTML = review.date;
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
