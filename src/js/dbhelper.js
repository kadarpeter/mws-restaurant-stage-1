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
    return `http://localhost:${port}`;
  }

  /**
     * Database name
     * @returns {string}
     * @constructor
     */
    static get DATABASE_NAME() {
      return 'restaurant';
    }

    static get TABLE_RESTAURANT() {
      return 'restaurant';
    }

    static get TABLE_REVIEW() {
      return 'review';
    }

    static get DATABASE_VERSION() {
      return 1;
    }

    static openDatabase() {
      return idb.open(DBHelper.DATABASE_NAME, DBHelper.DATABASE_VERSION, upgradeDb => {
        switch (upgradeDb.oldVersion) {
          case 0:
            upgradeDb.createObjectStore(DBHelper.TABLE_RESTAURANT, {
              keyPath: 'id'
            });
          case 1:
            let reviewStore = upgradeDb.createObjectStore(DBHelper.TABLE_REVIEW, {
              keyPath: 'offline_id',
              autoIncrement: true
            });
            reviewStore.createIndex('restaurant_id', 'restaurant_id');
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
          .objectStore(DBHelper.TABLE_RESTAURANT)
          .getAll();
      })
      .then(restaurants => {
        if (restaurants.length) {
          return restaurants;
        }

        return fetch(`${DBHelper.DATABASE_URL}/restaurants`)
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
        let store = tx.objectStore(DBHelper.TABLE_RESTAURANT);
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
        return restaurants.find(r => r.id === parseInt(id)) || Promise.reject(new Error(`Restaurant #${id} not found.`));
      })
  }

  // Fetch reviews for restaurant
  static fetchReviewsByRestaurantId(id)
  {
    return DBHelper.openDatabase()
      .then(db => {
        if (!db) return;

        return db.transaction(DBHelper.TABLE_REVIEW)
          .objectStore(DBHelper.TABLE_REVIEW)
          .index('restaurant_id')
          .getAll(parseInt(id, 10));
      })
      .then(reviews => {
        if (reviews.length) {
          //DBHelper.syncReviews();
          //DBHelper.updateReviewById(4, {name: 'Petiiii'});
          DBHelper.requestSync();
          return reviews;
        }

        // no reviews in the idb, so fetch from server
        let reviewsUrl = `${DBHelper.DATABASE_URL}/reviews/?restaurant_id=${id}`;
        return fetch(reviewsUrl)
          .then(response => response.json())
          .then(data => {
            DBHelper.cacheReviews(data);
            return data;
          })
          .catch(error => {
            console.error(error);
          })
      });
  }

  static cacheReviews(reviews) {
      DBHelper.openDatabase()
        .then(db => {
          let tx = db.transaction(DBHelper.TABLE_REVIEW, 'readwrite');
          let store = tx.objectStore(DBHelper.TABLE_REVIEW);
          reviews.forEach(review => store.put(review));

          return tx.complete;
        });
    }

  static addReview(review) {
    return DBHelper.openDatabase()
      .then(db => {
        if (!db) return;

        return db.transaction(DBHelper.TABLE_REVIEW, 'readwrite')
          .objectStore(DBHelper.TABLE_REVIEW)
          .put(review);
      });
  }

  static postReview(review) {
    // delete the offline_id property, we need it only in IDB
    // noinspection JSUnresolvedVariable
    delete review.offline_id;
    const options = {
      method: 'POST',
      body: JSON.stringify(review)
    };

    return fetch(`${DBHelper.DATABASE_URL}/reviews`, options);
  }

  static updateReviewById(offline_id, updatedReviewData) {
    console.log(`UPDATE REVIEW IN IDB BY ID #${offline_id}`);
    DBHelper.openDatabase()
      .then(db => {
        return db.transaction(DBHelper.TABLE_REVIEW, 'readwrite')
          .objectStore(DBHelper.TABLE_REVIEW)
          .openCursor(offline_id);
      }).then(cursor => {
        const  updatedReview = {...cursor.value, ...updatedReviewData};
        return cursor.update(updatedReview);
    })
  }

  static requestSync()
  {
    if (navigator.serviceWorker) {
      navigator.serviceWorker.ready.then(swRegistration => {
        console.log('Background Sync requested', new Date(Date.now()));
        return swRegistration.sync.register('sync-reviews');
      });
    }
  }

  static syncReviews()
  {
    DBHelper.openDatabase()
      .then(db => {
        return db.transaction(DBHelper.TABLE_REVIEW)
          .objectStore(DBHelper.TABLE_REVIEW)
          .getAll()
      }).then(reviews => {
        const reviews_need_sync = reviews.filter(r => !r.hasOwnProperty('id'));
        if (!reviews_need_sync.length) {
          console.info('There is no reviews to sync...');
          return;
        }
        console.log('sync needed', reviews_need_sync);
        return Promise.all(reviews_need_sync.map(review => {
          // post to server
          // noinspection JSUnresolvedVariable
          let offline_id = review.offline_id;
          return DBHelper.postReview(review)
            .then(response => {
              return response.json();
            }).then(data => {
              if (data.id) {
                DBHelper.updateReviewById(offline_id, {id: parseInt(data.id)});
              }
            })
        }));
    }).catch(err => console.error(err));
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  /*static fetchRestaurantByCuisine(cuisine, callback) {
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
  }*/

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  /*static fetchRestaurantByNeighborhood(neighborhood, callback) {
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
  }*/

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, favorites_only = false) {
    // Fetch all restaurants
    return DBHelper.fetchRestaurants()
      .then(restaurants => {
        let results = restaurants;
        if (cuisine !== 'all') { // filter by cuisine
          // noinspection JSUnresolvedVariable
          results = results.filter(r => r.cuisine_type === cuisine);
        }
        if (neighborhood !== 'all') { // filter by neighborhood
          // noinspection JSUnresolvedVariable
          results = results.filter(r => r.neighborhood === neighborhood);
        }
        if (true === favorites_only) {
          // noinspection JSUnresolvedVariable
          results = results.filter(r => (r.is_favorite === true || r.is_favorite === 'true'));
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
        // noinspection JSUnresolvedVariable
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
        // noinspection JSUnresolvedVariable
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
    // noinspection JSUnresolvedVariable
    let imgSrc = `/img/${restaurant.photograph}.jpg`;

    // fallback for image, if no photograph property
    // noinspection JSUnresolvedVariable
    if (!restaurant.photograph) {
      imgSrc = `/img/${restaurant.id}.jpg`;
    }
    return (imgSrc.replace('.jpg', suffix + '.jpg'));
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    // noinspection JSUnresolvedVariable
    return new google.maps.Marker({
        position: restaurant.latlng,
        title: restaurant.name,
        url: DBHelper.urlForRestaurant(restaurant),
        map: map,
        animation: google.maps.Animation.DROP
      }
    );
  }

}
