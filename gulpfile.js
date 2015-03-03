var gulp = require('gulp');
var jsBundler = require('js-bundler');
var minifyCSS = require('gulp-minify-css');

gulp.task('js', function() {
	return gulp.src('./lib/movie.js')
		.pipe(jsBundler({standalone: 'CodeMirrorMovie'}))
		.pipe(gulp.dest('./dist'));
});

gulp.task('css', function() {
	return gulp.src('./lib/movie.css')
		.pipe(minifyCSS())
		.pipe(gulp.dest('./dist'));
});

gulp.task('watch', function() {
	jsBundler.watch({sourceMap: true});
	gulp.watch('./lib/**/*.js', ['js']);
});

gulp.task('default', ['js', 'css']);