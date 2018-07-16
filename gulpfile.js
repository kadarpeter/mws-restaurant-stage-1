/*eslint-env node */

// gulp plugins
const gulp         = require('gulp');
const autoprefixer = require('gulp-autoprefixer');
const browserSync  = require('browser-sync').create();
const concat       = require('gulp-concat');
const csso         = require('gulp-csso');
const critical     = require('critical');
const eslint       = require('gulp-eslint');
const pump         = require('pump');
const responsive   = require('gulp-responsive');
const sass         = require('gulp-sass');
const sourcemaps   = require('gulp-sourcemaps');
const uglify       = require('gulp-uglify');

const pkg          = require('./package.json');
const sources      = require('./sources.json');
const src_path     = './src/';
const dist_path    = './dist/';

// responsive images
const images = () => {
    return gulp.src(src_path + 'img/src/*.{jpg,png}')
        .pipe(responsive({
            // Resize all JPG images to three different sizes: 200, 500, and 630 pixels
            '*.jpg': [{
                width: 400
                //rename: { suffix: '-200px' },
            }, {
                width: 400 * 2,
                rename: {suffix: '@2x'},
            }, {
                width: 16,
                rename: {suffix: '--placeholder'},
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
        .pipe(gulp.dest(src_path + 'img'));
};
images.description = 'Create responsive images.';

const copyHtml = () => {
  return gulp.src([src_path + '*.html'])
      .pipe(gulp.dest(dist_path));
};
copyHtml.description = 'Copy html file to dist.';

const copyAssets = () => {
  // copy images from
  gulp.src([src_path + 'img/*.*'])
      .pipe(gulp.dest(dist_path + 'img'));

  // copy required assetes from src root
  let requiredAssets = [
    src_path + 'favicon.ico',
    src_path + 'sw.js',
    src_path + 'manifest.json'
  ];

  return gulp.src(requiredAssets)
    .pipe(gulp.dest(dist_path));
};
copyAssets.description = 'Copy assets file (images, icons, etc.) to dist.';

// sass
const scss = () => {
    return gulp.src(src_path + 'scss/**/*.scss')
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(dist_path + 'css/'))
        .pipe(browserSync.stream());
};
scss.description = 'Convert SCSS files to CSS.';

// autoprefixer
const prefixcss = () => {
    return gulp.src(dist_path + 'css/**/*.css')
        .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(gulp.dest(dist_path + 'css/'));
};
prefixcss.description = 'Use autoprefixer to support older brwosers.';

// minify css files
const cssmin = () => {
    return gulp.src(dist_path + '**/*.css')
        .pipe(sourcemaps.init())
        .pipe(csso({
          restructure: false,
          sourceMap: true,
          debug: false
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(dist_path));
};
cssmin.description = 'Minify css with csso.';

// critical css for the frontpage (https://github.com/addyosmani/critical)
const criticalcss = () => {
    return critical.generate({
        inline: true,
        base: dist_path,
        src: 'index.html',
        dest: 'index.html',
        minify: true,
        width: 480,
        height: 800
    });
};
criticalcss.description = 'Inline critical CSS for the entry page.';

// linting JS files
const lint = () => {
    return gulp.src([src_path + 'js/**/*.js', '!node_modules/**'])
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
lint.description = 'Linting Javascript files.';

// concat common JS files
const jsApp = () => {
  return gulp.src(sources.js.app)
    .pipe(sourcemaps.init())
    .pipe(concat('app.js'))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(dist_path + 'js/'));
};
jsApp.description = 'Concat common JS file for all the pages.';

// concat JS files for main page
const jsMain = () => {
  return gulp.src(sources.js.main)
    .pipe(sourcemaps.init())
    .pipe(concat('main.js'))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(dist_path + 'js/'));
};
jsMain.description = 'Concat JS file for the main page.';

// concat JS files for restaurant page
const jsRestaurant = () => {
  return gulp.src(sources.js.restaurant_info)
    .pipe(sourcemaps.init())
    .pipe(concat('restaurant_info.js'))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(dist_path + 'js/'));
};
jsRestaurant.description = 'Concat JS file for the restaurant page.';

// minify JS files to production
// TODO @kp: get solution for ES6 code (created: 2018. 06. 06.)
const minifyJs = (cb) => {
  pump([
      gulp.src(dist_path + 'js/*.js'),
      sourcemaps.init(),
      uglify(),
      /*rename({
        suffix: '.min'
      }),*/
      sourcemaps.write('./'),
      gulp.dest(dist_path + 'js/')
    ],
    cb
  );
};
minifyJs.description = 'Minify JS files.';

// start dev server (browserSync)
const serve = () => {
    let bsOptions = {
        server: dist_path,
        port: 8000,
        notify: false,
        logPrefix: pkg.name,
        watchOptions: {
            ignoreInitial: true,
            ignored: ['*.map', './node_modules']
        },
    };

    gulp.watch(src_path + 'scss/**/*.scss', gulp.series('scss'));
    gulp.watch(src_path + 'js/**/*.js', gulp.series('js'));
    gulp.watch(src_path + '**/*.html', gulp.series('copyHtml'));
    gulp.watch(src_path + 'sw.js', gulp.series('copyAssets'));
    gulp.watch(dist_path + '*.html').on('change', browserSync.reload);
    //gulp.watch(dist_path + 'js/**/*.js').on('change', browserSync.reload);

    browserSync.init(bsOptions);
};
serve.description = 'Serve with BroswerSync for development process.';

// start production (dist) server
const serveDist = () => {
    let bsOptions = {
        server: dist_path,
        port: 7000,
        notify: false,
        logPrefix: pkg.name,
        watchOptions: {
            ignoreInitial: true,
            ignored: ['*.map', './node_modules']
        },
    };

    browserSync.init(bsOptions);
};
serve.description = 'Serve with BroswerSync for production.';

// register tasks
gulp.task(copyHtml);
gulp.task(copyAssets);
gulp.task(images);
gulp.task(scss);
gulp.task(prefixcss);
gulp.task(criticalcss);
gulp.task(cssmin);
gulp.task(lint);
gulp.task(jsApp);
gulp.task(jsMain);
gulp.task(jsRestaurant);
gulp.task(minifyJs);
gulp.task(serve);
gulp.task(serveDist);
gulp.task('js', gulp.series('jsApp', 'jsMain', 'jsRestaurant'));
gulp.task('build:js', gulp.series('js')); // TODO @kp: minify JS files for production (created: 2018. 06. 06.)
gulp.task('build:css', gulp.series('scss', 'criticalcss', 'cssmin'));
gulp.task('build', gulp.series('images', gulp.parallel('build:js', 'build:css', 'copyHtml', 'copyAssets')));
gulp.task('serveDist', gulp.series('build', 'serveDist'));
gulp.task('default', gulp.series('images', gulp.parallel('copyHtml', 'copyAssets', 'scss', 'js'), 'serve'));
