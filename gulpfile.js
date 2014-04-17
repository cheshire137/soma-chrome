// Require Gulp plugins and other libraries
var path = require('path');
var gulp = require('gulp');
var gutil = require('gulp-util');
var watch = require('gulp-watch');
var coffee = require('gulp-coffee');
var less = require('gulp-less');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var haml = require('gulp-ruby-haml');
var minifyCSS = require('gulp-minify-css');
var clean = require('gulp-clean');


/////////////////////////
// Shared variables /////
/////////////////////////

var on_error = function (err) { console.error(err.message); };
var src_path = './src';
var dest_path = './extension';

/////////////////////////
// Tasks ////////////////
/////////////////////////

// Compile LESS into CSS
gulp.task('less', function() {
  return gulp.src(src_path + '/*.less').
              pipe(less().on('error', on_error)).
              pipe(gulp.dest(dest_path));
});

// Compile CoffeeScript into JavaScript
gulp.task('coffee', function() {
  return gulp.src(src_path + '/*.coffee').
              pipe(coffee({bare: true}).on('error', on_error)).
              pipe(gulp.dest(dest_path));
});

// Compile Haml into HTML
gulp.task('haml', function() {
  return gulp.src(src_path + '/*.haml', {read: false}).
              pipe(haml().on('error', on_error)).
              pipe(gulp.dest(dest_path));
});

// Watch for changes in Haml files
gulp.task('haml-watch', function() {
  return gulp.src(src_path + '/*.haml', {read: false}).
              pipe(watch()).
              pipe(haml().on('error', on_error)).
              pipe(gulp.dest(dest_path));
});

// Watch files for changes
gulp.task('watch', function() {
  gulp.watch([src_path + '/*.less'], ['less']);
  gulp.watch([src_path + '/*.coffee'], ['coffee']);
});

// Default task
gulp.task('default', ['watch', 'haml-watch']);

// Compile all files once
gulp.task('run-all', ['haml', 'less', 'coffee']);
