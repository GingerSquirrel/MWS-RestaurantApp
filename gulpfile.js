var gulp = require('gulp');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');


gulp.task('default', function() {


    gulp.start('styles');
    gulp.start('watch');
});

gulp.task('styles', function(){
  gulp.src('sass/**/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(autoprefixer({
     browsers: ['last 2 versions']
  }))
    .pipe(gulp.dest('./css'));
});

gulp.task('watch', function(){
  gulp.watch('sass/**/*.scss', ['styles']);
});

