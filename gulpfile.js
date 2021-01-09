const { src, dest, watch, parallel, series } = require("gulp");
const scss = require("gulp-sass");
const cssbeautify = require("gulp-cssbeautify");
const notify = require("gulp-notify");
const autoprefixer = require("gulp-autoprefixer");
const sync = require("browser-sync").create();
const imagemin = require("gulp-imagemin");
const cache = require("gulp-cache");
const fs = require("fs");
const ttf2woff = require("gulp-ttf2woff");
const ttf2woff2 = require("gulp-ttf2woff2");
const fileinclude = require('gulp-file-include');

function createFiles() {
  createFolders();

  setTimeout(() => {
    fs.writeFile("app/pages/index.html", "hello html", function (err) {
      if (err) {
        throw err;
      } else console.log("file created");
    });

    fs.writeFile(
      "app/scss/style.scss",
      '@import "_mixin.scss"; \n@import "_fonts.scss";',
      function (err) {
        if (err) {
          throw err;
        } else console.log("file created");
      }
    );

    fs.writeFile("app/scss/_fonts.scss", "", function (err) {
      if (err) {
        throw err;
      } else console.log("file created");
    });

    let mixinContent =
      "@mixin font-face($font-family, $url, $weight) { \n	@font-face { \n		font-family: '#{$font-family}'; \n		font-style: normal; \n		font-weight: #{$weight}; \n		font-display: swap; \n		src: 	url('../fonts/#{$url}.woff2') format('woff2'), \n				  url('../fonts/#{$url}.woff') format('woff'); \n	} \n}";
    fs.writeFile("app/scss/_mixin.scss", mixinContent, function (err) {
      if (err) {
        throw err;
      } else console.log("file created");
    });

    fs.writeFile("app/js/draft/common.js", "", function (err) {
      if (err) {
        throw err;
      } else console.log("file created");
    });
  }, 500);
}


function createFolders() {
  src("*.*", { read: false })
    .pipe(dest("app/pages/parts"))
    .pipe(dest("app/scss"))
    .pipe(dest("app/img"))
    .pipe(dest("app/_img"))
    .pipe(dest("app/js/draft"))
    .pipe(dest("app/fonts"))
    .pipe(dest("dist"));
}


function fileInclude() {
  return src(['app/pages/**/*.html'])
    .pipe(fileinclude({
            prefix: '@@',
            basepath: '@file'
          }))
    .pipe(dest('app'))
}


function convertStyleCss() {
  return src("app/scss/style.scss")
    .pipe(scss())
    .on("error", notify.onError())
    .pipe(
      autoprefixer({
        flex: true,
        grid: true,
        cascade: true,
      })
    )
    .pipe(cssbeautify())
    .pipe(dest("app/css"));
}


function imageCompress() {
  return src("app/_img/*.{jpg, png, svg}")
    .pipe(cache(
      imagemin([
        imagemin.gifsicle({ interlaced: true }),
        imagemin.mozjpeg({ quality: 80, progressive: true }),
        imagemin.optipng({ optimizationLevel: 4 }),
        imagemin.svgo({ 
          plugins: [{ remoteViewBox: true }, { cleanupIDs: false }],
         }),
        ])
      )
    )
    .pipe(dest("app/img"));    
} 


function watchFilesChanges() {
  watch("app/scss/**/*.scss", convertStyleCss);

  watch("app/_img", imageCompress);

  watch("app/pages/**/*.html", fileInclude);

  watch("app/*.html").on("change", sync.reload);
  watch("app/css/*.css").on("change", sync.reload);
  watch("app/js/*.js").on("change", sync.reload);

  watch("app/fonts/**.ttf", series(convertFonts, fontsStyle));
}


function browserSync() {
  sync.init({
    server: {
      baseDir: "app",
      open: "local",
    },
  });
}

exports.convertStyleCss = convertStyleCss;
exports.watchFilesChanges = watchFilesChanges;
exports.browserSync = browserSync;
exports.imageCompress = imageCompress;
exports.fileInclude = fileInclude;

exports.struct = createFiles;

exports.default = parallel( fileInclude, convertStyleCss, browserSync, watchFilesChanges, series(convertFonts, fontsStyle) );

function moveHTML() {
  return src("app/*.html").pipe(dest("dist"));
}

function moveCSS() {
  return src("app/css/*.css").pipe(dest("dist/css"));
}

function moveIMG() {
  return src("app/img/*").pipe(dest("dist/img"));
}

function moveJS() {
  return src("app/js/*.js").pipe(dest("dist/js"));
}

exports.moveHTML = moveHTML;
exports.moveCSS = moveCSS;
exports.moveIMG = moveIMG;
exports.moveJS = moveJS;

exports.build = series(moveHTML, moveCSS, moveIMG, moveJS);

function convertFonts() {
  src(["app/fonts/**.ttf"]).pipe(ttf2woff()).pipe(dest("app/fonts"));
  return src(["app/fonts/**.ttf"]).pipe(ttf2woff2()).pipe(dest("app/fonts"));
}

const cb = () => {};

let srcFonts = "app/scss/_fonts.scss";
let appFonts = "app/fonts";

function fontsStyle() {
  let file_content = fs.readFileSync(srcFonts);

  fs.writeFile(srcFonts, "", cb);
  fs.readdir(appFonts, function (err, items) {
    if (items) {
      let c_fontname;
      for (let i = 0; i < items.length; i++) {
        let fontname = items[i].split(".");
        fontname = fontname[0];
        if (c_fontname != fontname) {
          fs.appendFile(
            srcFonts,
            '@include font-face("' +
              fontname +
              '", "' +
              fontname +
              '", 400);\r\n',
            cb
          );
        }
        c_fontname = fontname;
      }
    }
  });
}

exports.fontsStyle = fontsStyle;
exports.convertFonts = convertFonts;