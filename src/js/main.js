let restaurants,
  neighborhoods,
  cuisines,
  isGoogleMapsLoaded = false;
var map;
var markers = [];

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', () => {
  fetchNeighborhoods();
  fetchCuisines();
  updateRestaurants();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods()
    .then(neighborhoods => {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    })
    .catch(error => console.error(error));
};

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
};

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines()
    .then(cuisines => {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    })
    .catch(error => console.error(error));
};

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
};

/**
 * Initialize Google map, called from HTML.
 */
const $mapContainer      = document.querySelector('#map-container');
const $map               = document.querySelector('#map');
const $toggleMapCheckbox = document.querySelector('#toggle-map-checkbox');
window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map($map, {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  //updateRestaurants();
  addMarkersToMap();
};

onGoogleMapsLoad = () => {
  console.log('Google Maps API loaded');
  isGoogleMapsLoaded = true;
};


toggleGoogleMap = () => {
  if (!isGoogleMapsLoaded) {
    $toggleMapCheckbox.checked = false;
    alert('Google Maps is not loaded yet...');
    return;
  }

  $mapContainer.classList.toggle('is-hidden');
  if (!$mapContainer.classList.contains('is-hidden') && isGoogleMapsLoaded && !map) {
    initMap();
  }
};

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect   = document.getElementById('cuisines-select');
  const nSelect   = document.getElementById('neighborhoods-select');
  const fCheckbox = document.getElementById('favorite-checkbox');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;
  const favorites_only = fCheckbox.checked;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, favorites_only)
    .then(restaurants => {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    })
    .catch(error => console.error(error));
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  lazyLoadImages();
  if (self.map) {
    addMarkersToMap();
  }
};

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  const image = document.createElement('img');
  image.className = 'restaurant-img js-lazy-img';
  image.src = DBHelper.imageUrlForRestaurant(restaurant, '--placeholder');
  image.setAttribute('data-src', DBHelper.imageUrlForRestaurant(restaurant));
  image.setAttribute('data-srcset', `${DBHelper.imageUrlForRestaurant(restaurant)} 1x, ${DBHelper.imageUrlForRestaurant(restaurant, '@2x')} 2x`);
  //image.setAttribute('srcset', `${DBHelper.imageUrlForRestaurant(restaurant)} 1x, ${DBHelper.imageUrlForRestaurant(restaurant, '@2x')} 2x`);
  image.setAttribute('alt', `${restaurant.name} restaurant in ${restaurant.neighborhood}`);
  li.append(image);

  const name = document.createElement('h1');
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more);

  return li
};

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
};
