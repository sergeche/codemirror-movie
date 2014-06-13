/**
 * A high-level library interface for creating scenarios over textarea
 * element. The <code>CodeMirror.movie</code> takes reference to textarea
 * element (or its ID) and parses its content for initial content value,
 * scenario and outline.
 * @constructor
 * @memberOf __movie  
 */
(function() {
	"use strict";
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
	
	var defaultOptions = {
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
				var parts = _.map(kb.toLowerCase().split(/[\-\+]/), function(key) {
					return map[key.toLowerCase()] || key.toUpperCase();
				});
				
				m = parts.join(mac ? '' : '+');
				if (!options.stripParentheses) {
					m = '(' + m + ')';
				}
			}
			
			return m;
		});
	}
	
	/**
	 * Relaxed JSON parser.
	 * @param {String} text
	 * @returns {Object} 
	 */
	function parseJSON(text) {
		try {
			return (new Function('return ' + text))();
		} catch(e) {
			return {};
		}
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

		return _.filter(lines, function(line) {
			return !!line;
		});
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
	function parseMovieDefinition(text, options) {
		options = _.extend({}, defaultOptions, options || {});
		var parts = text.split(options.sectionSeparator);

		// parse scenario
		var reDef = /^(\w+)\s*:\s*(.+)$/;
		var scenario = [];
		var outline = {};
		var editorOptions = {};

		// read movie definition
		_.each(readLines(parts[1]), function(line) {
			if (line.charAt(0) == '#'){
				// it’s a comment, skip the line	
				return;
			}

			// do we have outline definition here?
			line = line.replace(options.outlineSeparator, function(str, title) {
				if (options.prettifyKeys) {
					outline[scenario.length] = prettifyKeyBindings(_.dom.trim(title));
				}
				return '';
			});

			var sd = line.match(reDef);
			if (!sd) {
				return scenario.push(_.dom.trim(line));
			}
				

			if (sd[2].charAt(0) == '{') {
				var obj = {};
				obj[sd[1]] = parseJSON(unescape(sd[2]));
				return scenario.push(obj);
			}

			scenario.push(sd[1] + ':' + unescape(sd[2]));
		});

		// read editor options
		if (parts[2]) {
			_.each(readLines(parts[2]), function(line) {
				if (line.charAt(0) == '#'){
					// it’s a comment, skip the line
					return;
				}

				var sd = line.match(reDef);
				if (sd) {
					editorOptions[sd[1]] = sd[2];
				}
			});
		}

		return {
			value: unescape(_.dom.trim(parts[0])),
			scenario: scenario,
			outline: _.keys(outline).length ? outline : null,
			editorOptions: editorOptions
		};
	}
	
	/**
	 * High-level function to create movie instance on textarea.
	 * @param {Element} target Reference to textarea, either <code>Element</code>
	 * or string ID. It can also accept existing CodeMirror object.
	 * @param {Object} movieOptions Movie options. See <code>defaultOptions</code>
	 * for value reference
	 * @param {Object} editorOptions Additional options passed to CodeMirror
	 * editor initializer.
	 */
	CodeMirror.movie = function(target, movieOptions, editorOptions) {
		var hlLine = null;

		if (_.isString(target)) {
			target = document.getElementById(target);
		}
		var targetIsTextarea = target.tagName == 'textarea';
		
		movieOptions = _.extend({}, defaultOptions, movieOptions || {});
		
		editorOptions = _.extend({
			theme: 'espresso',
			mode : 'text/html',
			indentWithTabs: true,
			tabSize: 4,
			lineNumbers : true,
			onCursorActivity: function() {
				if (editor.setLineClass) {
					editor.setLineClass(hlLine, null, null);
					hlLine = editor.setLineClass(editor.getCursor().line, null, 'activeline');
				}
			},
			onKeyEvent: function(ed, evt) {
				if (ed.getOption('readOnly')) {
					evt.stop();
					return true;
				}
			}
		}, editorOptions || {});
		
		var initialValue = editorOptions.value || (targetIsTextarea ? target.value : target.getValue()) || '';
		
		if (targetIsTextarea && movieOptions.parse) {
			_.extend(movieOptions, parseMovieDefinition(initialValue, movieOptions));
			initialValue = movieOptions.value;
			if (movieOptions.editorOptions) {
				_.extend(editorOptions, movieOptions.editorOptions);
			}

			// read CM options from given textarea
			var cmAttr = /^data\-cm\-(.+)$/i;
			_.each(target.attributes, function(attr) {
				if (cmAttr.test(attr.name)) {
					editorOptions[RegExp.$1] = attr.value;
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

		if (editor.setLineClass) {
			hlLine = editor.setLineClass(0, 'activeline');
		}
		
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
		
		var sc = CodeMirror.scenario(movieOptions.scenario, editor);
		if (movieOptions.outline) {
			wrapper.className += ' CodeMirror-movie_with-outline';
			wrapper.appendChild(CodeMirror.scenarioOutline(movieOptions.outline, sc));
		}
		return sc;
	};
})();