"use strict";
module.exports = function(grunt) {
	var files = require('./grunt-files');

	// Project configuration.
	grunt.initConfig({
		frontendConfig: {
			srcWebroot: './src',
			webroot: './dist'
		},

		lint: {
			files: ['grunt.js', 'src/*.js']
		},

		frontend: {
			'css-file': {
				'./dist/cm-movie.css': files.css
			},
			js: {
				'./dist/cm-movie.min.js': files.js,
				'./dist/cm-movie-full.min.js': files.jsFull
			}
		},

		concat: {
			main: {
				src: files.js,
				dest: './dist/cm-movie.js'
			},
			full: {
				src: files.jsFull,
				dest: './dist/cm-movie-full.js'
			}
		},

		watch: {
			files: '<config:lint.files>',
			tasks: 'default'
		},

		jshint: {
			options: {
				curly:   true,
				eqeqeq:  false,
				immed:   true,
				latedef: true,
				newcap:  true,
				noarg:   true,
				sub:     true,
				undef:   true,
				boss:    true,
				eqnull:  true,
				node:    true,
				es5:     true,
				evil:    true
			},
			globals: {
				'_': true,
				'document': true,
				'window': true,
				'Tween': true,
				'CodeMirror': true,
				'navigator': true
			}
		}
	});

	grunt.loadNpmTasks('grunt-frontend');
	grunt.loadNpmTasks('grunt-contrib-copy');

	// Default task.
	grunt.registerTask('default', 'lint concat frontend');
};
