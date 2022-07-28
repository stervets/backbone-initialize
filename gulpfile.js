let gulp       = require("gulp"),
    plumber    = require("gulp-plumber"),
    uglify     = require("gulp-uglify"),
    coffee     = require("gulp-coffee"),
    sourcemaps = require("gulp-sourcemaps");

// Gulp config
let params = {
    path: {
        coffeeWatch: "app/src/**/*.coffee",
        pluginFile : "dist/backbone-initialize.coffee"
    }
};

//    Build plugin
gulp.task("buildPlugin", () => {
    gulp.src("dist/backbone-initialize.coffee")
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(coffee())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest("dist/"))
        .pipe(uglify())
        .pipe(gulp.dest("dist/min"));
    return true;
});

//    Build example
gulp.task("buildExample", () => {
    gulp.src("app/src/**/*.coffee")
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(coffee())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest("app/"));
    return true;
});

//  Build task
gulp.task("build", ["buildPlugin", "buildExample"]);

// Development task
gulp.task("devel", ["build"], () => {
    gulp.watch("dist/backbone-initialize.coffee", ["buildPlugin"]);
    gulp.watch("app/src/**/*.coffee", ["buildExample"]);
});

gulp.task("default", ["build"]);
