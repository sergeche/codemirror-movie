/**
 * A shared library of source files required to buld CodeMirror
 * movie plugin, can be re-used by different builders
 */
var path = require('path');

var core = [
	'src/lib/tween.js',
	'src/dom.js',
	'src/scenario.js',
	'src/scenario.tooltip.js',
	'src/scenario.outline.js',
	'src/scenario.prompt.js',
	'src/movie.js'
];

var addons = [
	'src/lib/underscore.js'
];

function absPath(file) {
	return path.join(__dirname, file);
}

module.exports = {
	js: core.map(absPath),
	jsFull: addons.concat(core).map(absPath),
	css: absPath('src/scenario.css')
};