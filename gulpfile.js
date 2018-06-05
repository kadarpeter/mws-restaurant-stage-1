/*eslint-env node */

// gulp plugins
const gulp         = require('gulp');
const autoprefixer = require('gulp-autoprefixer');
const browserSync  = require('browser-sync').create();
const concat       = require('gulp-concat');
const eslint       = require('gulp-eslint');
const pump         = require('pump');
const responsive   = require('gulp-responsive');
const sass         = require('gulp-sass');
const sourcemaps   = require('gulp-sourcemaps');
const uglify       = require('gulp-uglify');

const pkg          = require('./package.json');
const sources      = require('./sources.json');
const paths = {
    dist: './dist/',
    css: {
        source: './scss/',
        dist: './dist/css/'
    },
    img: {
        source: './img/src/',
        dist: './dist/img/'
    },
    js: {
        source: './js/',
        dist: './dist/js/'
    }
};

// responsive images
const images = () => {
    return gulp.src(paths.img.source + '*.{jpg,png}')
        .pipe(responsive({
            // Resize all JPG images to three different sizes: 200, 500, and 630 pixels
            '*.jpg': [{
                width: 400
                //rename: { suffix: '-200px' },
            }, {
                width: 400 * 2,
                rename: {suffix: '@2x'},
            }],
            // Resize all PNG images to be retina ready
            '*.png': [{
                width: 250,
            }, {
                width: 250 * 2,
                rename: {suffix: '@2x'},
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
};
images.description = 'Create responsive images.';

const copyHtml = () => {
  return gulp.src(['./index.html', './restaurant.html'])
      .pipe(gulp.dest(paths.dist));
};

const copyAssets = () => {
  return gulp.src(['img/*.*'])
      .pipe(gulp.dest(paths.img.dist));
};

// sass
const scss = () => {
    return gulp.src(paths.css.source + '**/*.scss')
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(paths.css.dist))
        .pipe(browserSync.stream());
};
scss.description = 'Convert SCSS files to CSS';

// autoprefixer
const prefixcss = () => {
    return gulp.src(paths.css.dist + '**/*.css')
        .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(gulp.dest(paths.css.dist));
};
prefixcss.description = 'Use autoprefixer to support older brwosers';

// linting JS files
const lint = () => {
    return gulp.src([paths.js.source + '**/*.js', '!node_modules/**'])
        // eslint() attaches the lint output to the "eslint" property
        // of the file object so it can be used by other modules.
        .pipe(eslint())
        // eslint.format() outputs the lint results to the console.
        // Alternatively use eslint.formatEach() (see Docs).
        .pipe(eslint.format())
        // To have the process exit with an error code (1) on
        // lint error, return the stream and pipe to failAfterError last.
        .pipe(eslint.failAfterError());
};
lint.description = 'Linting Javascript files';

// concat JS files
const jsApp = () => {
  return gulp.src(sources.js.app)
    .pipe(sourcemaps.init())
    .pipe(concat('app.js'))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(paths.js.dist));
};

const jsServiceWorker = () => {
  return gulp.src(['./sw.js', './manifest.json'])
      .pipe(gulp.dest(paths.dist));
};

const jsMain = () => {
  return gulp.src(sources.js.main)
    .pipe(sourcemaps.init())
    .pipe(concat('main.js'))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(paths.js.dist));
};

const jsRestaurant = () => {
  return gulp.src(sources.js.restaurant_info)
    .pipe(sourcemaps.init())
    .pipe(concat('restaurant_info.js'))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(paths.js.dist));
};

// minify bb.app.js
const minifyJs = (cb) => {
  pump([
      gulp.src(paths.js.dist + '*.js'),
      sourcemaps.init(),
      uglify(),
      /*rename({
        suffix: '.min'
      }),*/
      sourcemaps.write('./'),
      gulp.dest(paths.js.dist)
    ],
    cb
  );
};
minifyJs.description = 'Minify JS files.';

// start server (browserSync)
const serve = () => {
    let bsOptions = {
        server: paths.dist,
        port: 8000,
        notify: false,
        logPrefix: pkg.name,
        watchOptions: {
            ignoreInitial: true,
            ignored: ['*.map', './node_modules']
        },
    };

    gulp.watch(paths.css.source + '**/*.scss', gulp.series('scss'));
    gulp.watch(paths.js.source + '**/*.js', gulp.series('js'));
    gulp.watch('./*.html', gulp.series('copyHtml'));

    browserSync.init(bsOptions);
};
serve.description = 'Serve with BroswerSync';

// register tasks
gulp.task(copyHtml);
gulp.task(copyAssets);
gulp.task(images);
gulp.task(scss);
gulp.task(prefixcss);
gulp.task(lint);
gulp.task(jsApp);
gulp.task(jsServiceWorker);
gulp.task(jsMain);
gulp.task(jsRestaurant);
gulp.task(minifyJs);
gulp.task(serve);
gulp.task('js', gulp.series('jsServiceWorker', 'jsApp', 'jsMain', 'jsRestaurant'));
gulp.task('default', gulp.series('copyHtml', 'copyAssets', 'images', 'scss', 'js', 'serve'));

