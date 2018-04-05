let gulp      = require('gulp'),
  gutil       = require('gulp-util'),
  browserSync = require('browser-sync').create(),
  responsive  = require('gulp-responsive');

let paths = {
  css: {
    source: './css/'
  },
  img: {
    source: './img/src/',
    dist: './img/'
  }
};

// responsive images
gulp.task('images', function () {
  return gulp.src(paths.img.source + '*.{jpg,png}')
    .pipe(responsive({
      // Resize all JPG images to three different sizes: 200, 500, and 630 pixels
      '*.jpg': [{
        width: 400
        //rename: { suffix: '-200px' },
      }, {
        width: 400 * 2,
        rename: { suffix: '@2x' },
      }],
      // Resize all PNG images to be retina ready
      '*.png': [{
        width: 250,
      }, {
        width: 250 * 2,
        rename: { suffix: '@2x' },
      }],
    }, {
      // Global configuration for all images
      // The output quality for JPEG, WebP and TIFF output formats
      quality: 70,
      // Use progressive (interlace) scan for JPEG and PNG output
      progressive: true,
      // Strip all metadata
      withMetadata: false,
      errorOnUnusedConfig: false
    }))
    .pipe(gulp.dest(paths.img.dist));
});

// browsersync
gulp.task('browsersync', [], function () {
  browserSync.init({
    server: {
      baseDir: "./"
    },
    port: 8000
  });

  gulp.watch("./**/*.css").on('change', browserSync.reload);
  gulp.watch("./**/*.html").on('change', browserSync.reload);
  gulp.watch("./**/*.js").on('change', browserSync.reload);
});
