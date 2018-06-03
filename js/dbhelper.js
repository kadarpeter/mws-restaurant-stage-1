/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  /**
     * Database name
     * @returns {string}
     * @constructor
     */
    static get DATABASE_NAME() {
      return 'restaurant';
    }

    static get DATABASE_VERSION() {
      return 1;
    }

    static openDatabase() {
      return idb.open(DBHelper.DATABASE_NAME, DBHelper.DATABASE_VERSION, upgradeDb => {
        console.log('open databse');
        switch (upgradeDb.oldVersion) {
          case 0:
            let store = upgradeDb.createObjectStore(DBHelper.DATABASE_NAME, {
              keyPath: 'id'
            });
        }

        //store.createIndex('cuisine', '')
      });
    }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants() {
    return DBHelper.openDatabase()
      .then(db => {
        if (!db) return;

        return db.transaction(DBHelper.DATABASE_NAME)
          .objectStore(DBHelper.DATABASE_NAME)
          .getAll();
      })
      .then(restaurants => {
        if (restaurants.length) {
          return restaurants;
        }

        return fetch(DBHelper.DATABASE_URL)
          .then(response => response.json())
          .then(data => {
            DBHelper.cacheRestaurants(data);
            return data;
          })
          .catch(error => {
            console.error(error)
          })
      });
  }

  static cacheRestaurants(restaurants) {
    DBHelper.openDatabase()
      .then(db => {
        let tx = db.transaction(DBHelper.DATABASE_NAME, 'readwrite');
        let store = tx.objectStore(DBHelper.DATABASE_NAME);
        restaurants.forEach(restaurant => store.put(restaurant));

        return tx.complete;
      });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id) {
    //let restaurantUrl = `${this.DATABASE_URL}/${id}`;

    return DBHelper.fetchRestaurants()
      .then(restaurants => {
        return restaurants.find(r => r.id == id) || Promise.reject(new Error(`Restaurant #${id} not found.`));
      })
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
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood) {
    // Fetch all restaurants
    return DBHelper.fetchRestaurants()
      .then(restaurants => {
        let results = restaurants
        if (cuisine !== 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood !== 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        return results;
      });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods() {
    return DBHelper.fetchRestaurants()
      .then(restaurants => {
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
        return Array.from(new Set(neighborhoods));
      });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines() {
    // Fetch all restaurants
    return DBHelper.fetchRestaurants()
      .then(restaurants => {
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
        return Array.from(new Set(cuisines));
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
  static imageUrlForRestaurant(restaurant, suffix = '') {
    let imgSrc = `/img/${restaurant.photograph}.jpg`;

    // fallback for image, if no photograph property
    if (!restaurant.photograph) {
      imgSrc = `/img/${restaurant.id}.jpg`;
    }
    return (imgSrc.replace('.jpg', suffix + '.jpg'));
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
        animation: google.maps.Animation.DROP
      }
    );
    return marker;
  }

}
