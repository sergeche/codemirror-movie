/**
 * A high-level library interface for creating scenarios over textarea
 * element. The <code>CodeMirror.movie</code> takes reference to textarea
 * element (or its ID) and parses its content for initial content value,
 * scenario and outline.
 */
"use strict";

import {parseJSON, extend, toArray} from './utils';
import Scenario from './scenario';
import outline from './widgets/outline';

var ios = /AppleWebKit/.test(navigator.userAgent) && /Mobile\/\w+/.test(navigator.userAgent);
var mac = ios || /Mac/.test(navigator.platform);

var macCharMap = {
	'ctrl': '⌃',
	'control': '⌃',
	'cmd': '⌘',
	'shift': '⇧',
	'alt': '⌥',
	'enter': '⏎',
	'tab': '⇥',
	'left': '←',
	'right': '→',
	'up': '↑',
	'down': '↓'
};
	
var pcCharMap = {
	'cmd': 'Ctrl',
	'control': 'Ctrl',
	'ctrl': 'Ctrl',
	'alt': 'Alt',
	'shift': 'Shift',
	'left': '←',
	'right': '→',
	'up': '↑',
	'down': '↓'
};

export var defaultOptions = {
	/**
	 * Automatically parse movie definition from textarea content. Setting
	 * this property to <code>false</code> assumes that user wants to
	 * explicitly provide movie data: initial value, scenario etc.
	 */
	parse: true,
	
	/**
	 * String or regexp used to separate sections of movie definition, e.g.
	 * default value, scenario and editor options
	 */
	sectionSeparator: '@@@',
	
	/** Regular expression to extract outline from scenario line */
	outlineSeparator: /\s+:::\s+(.+)$/,
	
	/** Automatically prettify keyboard shortcuts in outline */
	prettifyKeys: true,
	
	/** Strip parentheses from prettyfied keyboard shortcut definition */
	stripParentheses: false
};

/**
 * High-level function to create movie instance on textarea.
 * @param {Element} target Reference to textarea, either <code>Element</code>
 * or string ID. It can also accept existing CodeMirror object.
 * @param {Object} movieOptions Movie options. See <code>defaultOptions</code>
 * for value reference
 * @param {Object} editorOptions Additional options passed to CodeMirror
 * editor initializer.
 */
export default function movie(target, movieOptions={}, editorOptions={}) {
	setupCodeMirror();

	if (typeof target === 'string') {
		target = document.getElementById(target);
	}

	var targetIsTextarea = target.nodeName.toLowerCase() === 'textarea';
	
	movieOptions = extend({}, defaultOptions, movieOptions);
	editorOptions = extend({
		theme: 'espresso',
		mode : 'text/html',
		indentWithTabs: true,
		tabSize: 4,
		lineNumbers : true,
		preventCursorMovement: true
	}, editorOptions);
	
	var initialValue = editorOptions.value || (targetIsTextarea ? target.value : target.getValue()) || '';
	
	if (targetIsTextarea && movieOptions.parse) {
		extend(movieOptions, parseMovieDefinition(initialValue, movieOptions));
		initialValue = movieOptions.value;
		if (movieOptions.editorOptions) {
			extend(editorOptions, movieOptions.editorOptions);
		}

		// read CM options from given textarea
		var cmAttr = /^data\-cm\-(.+)$/i;
		toArray(target.attributes).forEach(function(attr) {
			var m = attr.name.match(cmAttr);
			if (m) {
				editorOptions[m[1]] = attr.value;
			}
		});
	}
	
	// normalize line endings
	initialValue = initialValue.replace(/\r?\n/g, '\n');
	
	// locate initial caret position from | symbol
	var initialPos = initialValue.indexOf('|');
	
	if (targetIsTextarea) {
		target.value = editorOptions.value = initialValue = initialValue.replace(/\|/g, '');
	}

	// create editor instance if needed
	var editor = targetIsTextarea ? CodeMirror.fromTextArea(target, editorOptions) : target;

	if (initialPos != -1) {
		editor.setCursor(editor.posFromIndex(initialPos));
	}
	
	// save initial data so we can revert to it later
	editor.__initial = {
		content: initialValue,
		pos: editor.getCursor(true)
	};
	
	var wrapper = editor.getWrapperElement();
	
	// adjust height, if required
	if (editorOptions.height) {
		wrapper.style.height = editorOptions.height + 'px';
	}
	
	wrapper.className += ' CodeMirror-movie' + (movieOptions.outline ? ' CodeMirror-movie_with-outline' : '');
	
	var sc = new Scenario(movieOptions.scenario, editor);
	if (movieOptions.outline) {
		wrapper.className += ' CodeMirror-movie_with-outline';
		wrapper.appendChild(outline(movieOptions.outline, sc));
	}
	return sc;
};

/**
 * Prettyfies key bindings references in given string: formats it according
 * to current user’s platform. The key binding should be defined inside 
 * parentheses, e.g. <code>(ctrl-alt-up)</code>
 * @param {String} str
 * @param {Object} options Transform options
 * @returns {String}
 */
function prettifyKeyBindings(str, options) {
	options = options || {};
	var reKey = /ctrl|alt|shift|cmd/i;
	var map = mac ? macCharMap : pcCharMap;
	return str.replace(/\((.+?)\)/g, function(m, kb) {
		if (reKey.test(kb)) {
			var parts = kb.toLowerCase()
				.split(/[\-\+]/)
				.map(key => map[key.toLowerCase()] || key.toUpperCase());
			
			m = parts.join(mac ? '' : '+');
			if (!options.stripParentheses) {
				m = '(' + m + ')';
			}
		}
		
		return m;
	});
}

function readLines(text) {
	// IE fails to split string by regexp, 
	// need to normalize newlines first
	var nl = '\n';
	var lines = (text || '')
		.replace(/\r\n/g, nl)
		.replace(/\n\r/g, nl)
		.replace(/\r/g, nl)
		.split(nl);

	return lines.filter(Boolean);
}

function unescape(text) {
	var replacements = {
		'&lt;':  '<',
		'&gt;':  '>',
		'&amp;': '&'
	};

	return text.replace(/&(lt|gt|amp);/g, function(str, p1) {
		return replacements[str] || str;
	});
}

/**
 * Extracts initial content, scenario and outline from given string
 * @param {String} text
 * @param {Object} options
 */
function parseMovieDefinition(text, options={}) {
	options = extend({}, defaultOptions, options || {});
	var parts = text.split(options.sectionSeparator);

	// parse scenario
	var reDef = /^(\w+)\s*:\s*(.+)$/;
	var scenario = [];
	var outline = {};
	var editorOptions = {};

	var skipComment = line => line.charAt(0) !== '#';

	// read movie definition
	readLines(parts[1]).filter(skipComment).forEach(function(line) {
		// do we have outline definition here?
		line = line.replace(options.outlineSeparator, function(str, title) {
			if (options.prettifyKeys) {
				outline[scenario.length] = prettifyKeyBindings(title.trim());
			}
			return '';
		});

		var sd = line.match(reDef);
		if (!sd) {
			return scenario.push(line.trim());
		}
			

		if (sd[2].charAt(0) === '{') {
			var obj = {};
			obj[sd[1]] = parseJSON(unescape(sd[2]));
			return scenario.push(obj);
		}

		scenario.push(sd[1] + ':' + unescape(sd[2]));
	});

	// read editor options
	if (parts[2]) {
		readLines(parts[2]).filter(skipComment).forEach(function(line) {
			var sd = line.match(reDef);
			if (sd) {
				editorOptions[sd[1]] = sd[2];
			}
		});
	}

	return {
		value: unescape(parts[0].trim()),
		scenario: scenario,
		outline: Object.keys(outline).length ? outline : null,
		editorOptions: editorOptions
	};
}

function setupCodeMirror() {
	if (typeof CodeMirror === 'undefined' || 'preventCursorMovement' in CodeMirror.defaults) {
		return;
	}

	CodeMirror.defineOption('preventCursorMovement', false, cm => {
		var handler = (cm, event) => cm.getOption('readOnly') && event.preventDefault();
		cm.on('keydown', handler);
		cm.on('mousedown', handler);
	});
}

if (typeof CodeMirror !== 'undefined') {
	CodeMirror.movie = movie;
}