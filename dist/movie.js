!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var o;"undefined"!=typeof window?o=window:"undefined"!=typeof global?o=global:"undefined"!=typeof self&&(o=self),o.CodeMirrorMovie=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Users/Sergey/Projects/codemirror-movie/lib/actions.js":[function(require,module,exports){
"use strict";

var _defineProperty = function (obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); };

var _utils = require("./utils");

var extend = _utils.extend;
var makePos = _utils.makePos;

var actions = {
	/**
  * Type-in passed text into current editor char-by-char
  * @param {Object} options Current options
  * @param {CodeMirror} editor Editor instance where action should be 
  * performed
  * @param {Function} next Function to call when action performance
  * is completed
  * @param {Function} timer Function that creates timer for delayed 
  * execution. This timer will automatically delay execution when
  * scenario is paused and revert when played again 
  */
	type: function type(options, editor, next, timer) {
		options = extend({
			text: "", // text to type
			delay: 60, // delay between character typing
			pos: null // initial position where to start typing
		}, wrap("text", options));

		if (!options.text) {
			throw new Error("No text provided for \"type\" action");
		}

		if (options.pos !== null) {
			editor.setCursor(makePos(options.pos, editor));
		}

		var chars = options.text.split("");

		timer(function perform() {
			var ch = chars.shift();
			editor.replaceSelection(ch, "end");
			if (chars.length) {
				timer(perform, options.delay);
			} else {
				next();
			}
		}, options.delay);
	},

	/**
  * Wait for a specified timeout
  * @param options
  * @param editor
  * @param next
  * @param timer
  */
	wait: function wait(options, editor, next, timer) {
		options = extend({
			timeout: 100
		}, wrap("timeout", options));

		timer(next, parseInt(options.timeout, 10));
	},

	/**
  * Move caret to a specified position
  */
	moveTo: function moveTo(options, editor, next, timer) {
		options = extend({
			delay: 80,
			immediate: false // TODO: remove, use delay: 0 instead
		}, wrap("pos", options));

		if (typeof options.pos === "undefined") {
			throw new Error("No position specified for \"moveTo\" action");
		}

		var curPos = editor.getCursor(true);
		// reset selection, if exists
		editor.setSelection(curPos, curPos);
		var targetPos = makePos(options.pos, editor);

		if (options.immediate || !options.delay) {
			editor.setCursor(targetPos);
			next();
		}

		var deltaLine = targetPos.line - curPos.line;
		var deltaChar = targetPos.ch - curPos.ch;
		var steps = Math.max(deltaChar, deltaLine);
		// var stepLine = deltaLine / steps;
		// var stepChar = deltaChar / steps;
		var stepLine = deltaLine < 0 ? -1 : 1;
		var stepChar = deltaChar < 0 ? -1 : 1;

		timer(function perform() {
			curPos = editor.getCursor(true);
			if (steps > 0 && !(curPos.line == targetPos.line && curPos.ch == targetPos.ch)) {

				if (curPos.line != targetPos.line) {
					curPos.line += stepLine;
				}

				if (curPos.ch != targetPos.ch) {
					curPos.ch += stepChar;
				}

				editor.setCursor(curPos);
				steps--;
				timer(perform, options.delay);
			} else {
				editor.setCursor(targetPos);
				next();
			}
		}, options.delay);
	},

	/**
  * Similar to "moveTo" function but with immediate cursor position update
  */
	jumpTo: function jumpTo(options, editor, next, timer) {
		options = extend({
			afterDelay: 200
		}, wrap("pos", options));

		if (typeof options.pos === "undefined") {
			throw new Error("No position specified for \"jumpTo\" action");
		}

		editor.setCursor(makePos(options.pos, editor));
		timer(next, options.afterDelay);
	},

	/**
  * Executes predefined CodeMirror command
  * @param {Object} options
  * @param {CodeMirror} editor
  * @param {Function} next
  * @param {Function} timer
  */
	run: function run(options, editor, next, timer) {
		options = extend({
			beforeDelay: 500,
			times: 1
		}, wrap("command", options));

		var times = options.times;
		timer(function perform() {
			try {
				if (typeof options.command === "function") {
					options.command(editor, options);
				} else {
					editor.execCommand(options.command);
				}
			} catch (e) {}
			if (--times > 0) {
				timer(perform, options.beforeDelay);
			} else {
				next();
			}
		}, options.beforeDelay);
	},

	/**
  * Creates selection for specified position
  * @param {Object} options
  * @param {CodeMirror} editor
  * @param {Function} next
  * @param {Function} timer
  */
	select: function select(options, editor, next, timer) {
		options = extend({
			from: "caret"
		}, wrap("to", options));

		var from = makePos(options.from, editor);
		var to = makePos(options.to, editor);
		editor.setSelection(from, to);
		next();
	}
};

function wrap(key, value) {
	return typeof value === "object" ? value : _defineProperty({}, key, value);
}

module.exports = actions;

},{"./utils":"/Users/Sergey/Projects/codemirror-movie/lib/utils.js"}],"/Users/Sergey/Projects/codemirror-movie/lib/dom.js":[function(require,module,exports){
"use strict";

exports.viewportRect = viewportRect;

/**
 * Removes element from parent
 * @param {Element} elem
 * @returns {Element}
 */
exports.remove = remove;

/**
 * Renders string into DOM element
 * @param {String} str
 * @returns {Element}
 */
exports.toDOM = toDOM;

/**
 * Sets or retrieves CSS property value
 * @param {Element} elem
 * @param {String} prop
 * @param {String} val
 */
exports.css = css;

var toArray = require("./utils").toArray;

var w3cCSS = document.defaultView && document.defaultView.getComputedStyle;

function viewportRect() {
	var body = document.body;
	var docElem = document.documentElement;
	var clientTop = docElem.clientTop || body.clientTop || 0;
	var clientLeft = docElem.clientLeft || body.clientLeft || 0;
	var scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop;
	var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft;

	return {
		top: scrollTop - clientTop,
		left: scrollLeft - clientLeft,
		width: body.clientWidth || docElem.clientWidth,
		height: body.clientHeight || docElem.clientHeight
	};
}

function remove(elem) {
	ar(elem).forEach(function (el) {
		return el.parentNode && el.parentNode.removeChild(el);
	});
	return elem;
}

function toDOM(str) {
	var div = document.createElement("div");
	div.innerHTML = str;
	return div.firstChild;
}

function css(elem, prop, val) {
	if (typeof prop === "string" && val == null) {
		return getCSS(elem, prop);
	}

	if (typeof prop === "string") {
		var obj = {};
		obj[prop] = val;
		prop = obj;
	}

	setCSS(elem, prop);
}

function ar(obj) {
	if (obj.length === +obj.length) {
		return toArray(obj);
	}

	return Array.isArray(obj) ? obj : [obj];
}

function toCamelCase(name) {
	return name.replace(/\-(\w)/g, function (str, p1) {
		return p1.toUpperCase();
	});
}

/**
 * Returns CSS property value of given element.
 * @author jQuery Team
 * @param {Element} elem
 * @param {String} name CSS property value
 */
function getCSS(elem, name) {
	var rnumpx = /^-?\d+(?:px)?$/i,
	    rnum = /^-?\d(?:\.\d+)?/,
	    rsuf = /\d$/;

	var nameCamel = toCamelCase(name);
	// If the property exists in style[], then it's been set
	// recently (and is current)
	if (elem.style[nameCamel]) {
		return elem.style[nameCamel];
	}

	if (w3cCSS) {
		var cs = window.getComputedStyle(elem, "");
		return cs.getPropertyValue(name);
	}

	if (elem.currentStyle) {
		var ret = elem.currentStyle[name] || elem.currentStyle[nameCamel];
		var style = elem.style || elem;

		// From the awesome hack by Dean Edwards
		// http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291

		// If we're not dealing with a regular pixel number
		// but a number that has a weird ending, we need to convert it to pixels
		if (!rnumpx.test(ret) && rnum.test(ret)) {
			// Remember the original values
			var left = style.left,
			    rsLeft = elem.runtimeStyle.left;

			// Put in the new values to get a computed value out
			elem.runtimeStyle.left = elem.currentStyle.left;
			var suffix = rsuf.test(ret) ? "em" : "";
			style.left = nameCamel === "fontSize" ? "1em" : ret + suffix || 0;
			ret = style.pixelLeft + "px";

			// Revert the changed values
			style.left = left;
			elem.runtimeStyle.left = rsLeft;
		}

		return ret;
	}
}

/**
 * Sets CSS properties to given element
 * @param {Element} elem
 * @param {Object} params CSS properties to set
 */
function setCSS(elem, params) {
	if (!elem) {
		return;
	}

	var numProps = { "line-height": 1, "z-index": 1, opacity: 1 };
	var props = Object.keys(params).map(function (k) {
		var v = params[k];
		var name = k.replace(/([A-Z])/g, "-$1").toLowerCase();
		return name + ":" + (typeof v === "number" && !(name in numProps) ? v + "px" : v);
	});

	elem.style.cssText += ";" + props.join(";");
}
Object.defineProperty(exports, "__esModule", {
	value: true
});

},{"./utils":"/Users/Sergey/Projects/codemirror-movie/lib/utils.js"}],"/Users/Sergey/Projects/codemirror-movie/lib/movie.js":[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

/**
 * High-level function to create movie instance on textarea.
 * @param {Element} target Reference to textarea, either <code>Element</code>
 * or string ID. It can also accept existing CodeMirror object.
 * @param {Object} movieOptions Movie options. See <code>defaultOptions</code>
 * for value reference
 * @param {Object} editorOptions Additional options passed to CodeMirror
 * editor initializer.
 */
exports["default"] = movie;

var _utils = require("./utils");

var parseJSON = _utils.parseJSON;
var extend = _utils.extend;
var toArray = _utils.toArray;

var Scenario = _interopRequire(require("./scenario"));

var outline = _interopRequire(require("./widgets/outline"));

var ios = /AppleWebKit/.test(navigator.userAgent) && /Mobile\/\w+/.test(navigator.userAgent);
var mac = ios || /Mac/.test(navigator.platform);

var macCharMap = {
	ctrl: "⌃",
	control: "⌃",
	cmd: "⌘",
	shift: "⇧",
	alt: "⌥",
	enter: "⏎",
	tab: "⇥",
	left: "←",
	right: "→",
	up: "↑",
	down: "↓"
};

var pcCharMap = {
	cmd: "Ctrl",
	control: "Ctrl",
	ctrl: "Ctrl",
	alt: "Alt",
	shift: "Shift",
	left: "←",
	right: "→",
	up: "↑",
	down: "↓"
};

var defaultOptions = exports.defaultOptions = {
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
	sectionSeparator: "@@@",

	/** Regular expression to extract outline from scenario line */
	outlineSeparator: /\s+:::\s+(.+)$/,

	/** Automatically prettify keyboard shortcuts in outline */
	prettifyKeys: true,

	/** Strip parentheses from prettyfied keyboard shortcut definition */
	stripParentheses: false
};
function movie(target) {
	var movieOptions = arguments[1] === undefined ? {} : arguments[1];
	var editorOptions = arguments[2] === undefined ? {} : arguments[2];

	var hlLine = null;

	if (typeof target === "string") {
		target = document.getElementById(target);
	}

	var targetIsTextarea = target.nodeName.toLowerCase() === "textarea";

	movieOptions = extend({}, defaultOptions, movieOptions);
	editorOptions = extend({
		theme: "espresso",
		mode: "text/html",
		indentWithTabs: true,
		tabSize: 4,
		lineNumbers: true,
		onCursorActivity: function onCursorActivity() {
			if (editor.setLineClass) {
				editor.setLineClass(hlLine, null, null);
				hlLine = editor.setLineClass(editor.getCursor().line, null, "activeline");
			}
		},
		onKeyEvent: function onKeyEvent(ed, evt) {
			if (ed.getOption("readOnly")) {
				evt.stop();
				return true;
			}
		}
	}, editorOptions);

	var initialValue = editorOptions.value || (targetIsTextarea ? target.value : target.getValue()) || "";

	if (targetIsTextarea && movieOptions.parse) {
		extend(movieOptions, parseMovieDefinition(initialValue, movieOptions));
		initialValue = movieOptions.value;
		if (movieOptions.editorOptions) {
			extend(editorOptions, movieOptions.editorOptions);
		}

		// read CM options from given textarea
		var cmAttr = /^data\-cm\-(.+)$/i;
		toArray(target.attributes).forEach(function (attr) {
			var m = attr.name.match(cmAttr);
			if (m) {
				editorOptions[m[1]] = attr.value;
			}
		});
	}

	// normalize line endings
	initialValue = initialValue.replace(/\r?\n/g, "\n");

	// locate initial caret position from | symbol
	var initialPos = initialValue.indexOf("|");

	if (targetIsTextarea) {
		target.value = editorOptions.value = initialValue = initialValue.replace(/\|/g, "");
	}

	// create editor instance if needed
	var editor = targetIsTextarea ? CodeMirror.fromTextArea(target, editorOptions) : target;

	if (editor.setLineClass) {
		hlLine = editor.setLineClass(0, "activeline");
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
		wrapper.style.height = editorOptions.height + "px";
	}

	wrapper.className += " CodeMirror-movie" + (movieOptions.outline ? " CodeMirror-movie_with-outline" : "");

	var sc = new Scenario(movieOptions.scenario, editor);
	if (movieOptions.outline) {
		wrapper.className += " CodeMirror-movie_with-outline";
		wrapper.appendChild(outline(movieOptions.outline, sc));
	}
	return sc;
}

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
	return str.replace(/\((.+?)\)/g, function (m, kb) {
		if (reKey.test(kb)) {
			var parts = kb.toLowerCase().split(/[\-\+]/).map(function (key) {
				return map[key.toLowerCase()] || key.toUpperCase();
			});

			m = parts.join(mac ? "" : "+");
			if (!options.stripParentheses) {
				m = "(" + m + ")";
			}
		}

		return m;
	});
}

function readLines(text) {
	// IE fails to split string by regexp,
	// need to normalize newlines first
	var nl = "\n";
	var lines = (text || "").replace(/\r\n/g, nl).replace(/\n\r/g, nl).replace(/\r/g, nl).split(nl);

	return lines.filter(Boolean);
}

function unescape(text) {
	var replacements = {
		"&lt;": "<",
		"&gt;": ">",
		"&amp;": "&"
	};

	return text.replace(/&(lt|gt|amp);/g, function (str, p1) {
		return replacements[str] || str;
	});
}

/**
 * Extracts initial content, scenario and outline from given string
 * @param {String} text
 * @param {Object} options
 */
function parseMovieDefinition(text) {
	var options = arguments[1] === undefined ? {} : arguments[1];

	options = extend({}, defaultOptions, options || {});
	var parts = text.split(options.sectionSeparator);

	// parse scenario
	var reDef = /^(\w+)\s*:\s*(.+)$/;
	var scenario = [];
	var outline = {};
	var editorOptions = {};

	var skipComment = function (line) {
		return line.charAt(0) !== "#";
	};

	// read movie definition
	readLines(parts[1]).filter(skipComment).forEach(function (line) {
		// do we have outline definition here?
		line = line.replace(options.outlineSeparator, function (str, title) {
			if (options.prettifyKeys) {
				outline[scenario.length] = prettifyKeyBindings(title.trim());
			}
			return "";
		});

		var sd = line.match(reDef);
		if (!sd) {
			return scenario.push(line.trim());
		}

		if (sd[2].charAt(0) === "{") {
			var obj = {};
			obj[sd[1]] = parseJSON(unescape(sd[2]));
			return scenario.push(obj);
		}

		scenario.push(sd[1] + ":" + unescape(sd[2]));
	});

	// read editor options
	if (parts[2]) {
		readLines(parts[2]).filter(skipComment).forEach(function (line) {
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
// XXX add 'revert' action to CodeMirror to restore original text and position
CodeMirror.commands.revert = function (editor) {
	if (editor.__initial) {
		editor.setValue(editor.__initial.content);
		editor.setCursor(editor.__initial.pos);
	}
};

CodeMirror.movie = movie;
Object.defineProperty(exports, "__esModule", {
	value: true
});
/**
 * A high-level library interface for creating scenarios over textarea
 * element. The <code>CodeMirror.movie</code> takes reference to textarea
 * element (or its ID) and parses its content for initial content value,
 * scenario and outline.
 */

},{"./scenario":"/Users/Sergey/Projects/codemirror-movie/lib/scenario.js","./utils":"/Users/Sergey/Projects/codemirror-movie/lib/utils.js","./widgets/outline":"/Users/Sergey/Projects/codemirror-movie/lib/widgets/outline.js"}],"/Users/Sergey/Projects/codemirror-movie/lib/scenario.js":[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var commonActions = _interopRequire(require("./actions"));

var prompt = require("./widgets/prompt").actions;

var tooltip = require("./widgets/tooltip").actions;

var extend = require("./utils").extend;

var actionsDefinition = extend({}, commonActions, prompt, tooltip);

var STATE_IDLE = "idle";
var STATE_PLAY = "play";
var STATE_PAUSE = "pause";

// Regular expression used to split event strings
var eventSplitter = /\s+/;

var defaultOptions = exports.defaultOptions = {
	beforeDelay: 1000,
	afterDelay: 1000
};

/**
 * @param {Object} actions Actions scenario
 * @param {Object} data Initial content (<code>String</code>) or editor
 * instance (<code>CodeMirror</code>)
 */

var Scenario = (function () {
	function Scenario(actions, data) {
		_classCallCheck(this, Scenario);

		this._actions = actions;
		this._actionIx = 0;
		this._editor = null;
		this._state = STATE_IDLE;
		this._timerQueue = [];

		if (data && "getValue" in data) {
			this._editor = data;
		}

		var ed = this._editor;
		if (ed && !ed.__initial) {
			ed.__initial = {
				content: ed.getValue(),
				pos: ed.getCursor(true)
			};
		}
	}

	_prototypeProperties(Scenario, null, {
		_setup: {
			value: function _setup(editor) {
				if (!editor && this._editor) {
					editor = this._editor;
				}

				editor.execCommand("revert");
				return editor;
			},
			writable: true,
			configurable: true
		},
		play: {

			/**
    * Play current scenario
    * @param {CodeMirror} editor Editor instance where on which scenario 
    * should be played
    * @memberOf Scenario
    */

			value: function play(editor) {
				if (this._state === STATE_PLAY) {
					// already playing
					return;
				}

				if (this._state === STATE_PAUSE) {
					// revert from paused state
					editor = editor || this._editor;
					editor.focus();
					var timerObj = null;
					while (timerObj = this._timerQueue.shift()) {
						requestTimer(timerObj.fn, timerObj.delay);
					}

					this._state = STATE_PLAY;
					this.trigger("resume");
					return;
				}

				this._editor = editor = this._setup(editor);
				editor.focus();

				var timer = this.requestTimer.bind(this);
				var that = this;
				this._actionIx = 0;
				var next = (function (_next) {
					var _nextWrapper = function next() {
						return _next.apply(this, arguments);
					};

					_nextWrapper.toString = function () {
						return _next.toString();
					};

					return _nextWrapper;
				})(function () {
					if (that._actionIx >= that._actions.length) {
						return timer(function () {
							that.stop();
						}, defaultOptions.afterDelay);
					}

					that.trigger("action", that._actionIx);
					var action = parseActionCall(that._actions[that._actionIx++]);

					if (action.name in actionsDefinition) {
						actionsDefinition[action.name].call(that, action.options, editor, next, timer);
					} else {
						throw new Error("No such action: " + action.name);
					}
				});

				this._state = STATE_PLAY;
				this._editor.setOption("readOnly", true);
				this.trigger("play");
				timer(next, defaultOptions.beforeDelay);
			},
			writable: true,
			configurable: true
		},
		pause: {

			/**
    * Pause current scenario playback. It can be restored with 
    * <code>play()</code> method call 
    */

			value: function pause() {
				this._state = STATE_PAUSE;
				this.trigger("pause");
			},
			writable: true,
			configurable: true
		},
		stop: {

			/**
    * Stops playback of current scenario
    */

			value: function stop() {
				if (this._state !== STATE_IDLE) {
					this._state = STATE_IDLE;
					this._timerQueue.length = 0;
					this._editor.setOption("readOnly", false);
					this.trigger("stop");
				}
			},
			writable: true,
			configurable: true
		},
		state: {

			/**
    * Returns current playback state
    * @return {String}
    */

			get: function () {
				return this._state;
			},
			configurable: true
		},
		toggle: {

			/**
    * Toggle playback of movie scenario
    */

			value: function toggle() {
				if (this._state === STATE_PLAY) {
					this.pause();
				} else {
					this.play();
				}
			},
			writable: true,
			configurable: true
		},
		requestTimer: {
			value: (function (_requestTimer) {
				var _requestTimerWrapper = function requestTimer(_x, _x2) {
					return _requestTimer.apply(this, arguments);
				};

				_requestTimerWrapper.toString = function () {
					return _requestTimer.toString();
				};

				return _requestTimerWrapper;
			})(function (fn, delay) {
				if (this._state !== STATE_PLAY) {
					// save function call into a queue till next 'play()' call
					this._timerQueue.push({
						fn: fn,
						delay: delay
					});
				} else {
					return requestTimer(fn, delay);
				}
			}),
			writable: true,
			configurable: true
		},
		on: {

			// borrowed from Backbone
			/**
    * Bind one or more space separated events, `events`, to a `callback`
    * function. Passing `"all"` will bind the callback to all events fired.
    * @param {String} events
    * @param {Function} callback
    * @param {Object} context
    * @memberOf eventDispatcher
    */

			value: function on(events, callback, context) {
				var calls, event, node, tail, list;
				if (!callback) {
					return this;
				}

				events = events.split(eventSplitter);
				calls = this._callbacks || (this._callbacks = {});

				// Create an immutable callback list, allowing traversal during
				// modification.  The tail is an empty object that will always be used
				// as the next node.
				while (event = events.shift()) {
					list = calls[event];
					node = list ? list.tail : {};
					node.next = tail = {};
					node.context = context;
					node.callback = callback;
					calls[event] = {
						tail: tail,
						next: list ? list.next : node
					};
				}

				return this;
			},
			writable: true,
			configurable: true
		},
		off: {

			/**
    * Remove one or many callbacks. If `context` is null, removes all
    * callbacks with that function. If `callback` is null, removes all
    * callbacks for the event. If `events` is null, removes all bound
    * callbacks for all events.
    * @param {String} events
    * @param {Function} callback
    * @param {Object} context
    */

			value: function off(events, callback, context) {
				var event, calls, node, tail, cb, ctx;

				// No events, or removing *all* events.
				if (!(calls = this._callbacks)) {
					return;
				}

				if (!(events || callback || context)) {
					delete this._callbacks;
					return this;
				}

				// Loop through the listed events and contexts, splicing them out of the
				// linked list of callbacks if appropriate.
				events = events ? events.split(eventSplitter) : Object.keys(calls);
				while (event = events.shift()) {
					node = calls[event];
					delete calls[event];
					if (!node || !(callback || context)) {
						continue;
					}

					// Create a new list, omitting the indicated callbacks.
					tail = node.tail;
					while ((node = node.next) !== tail) {
						cb = node.callback;
						ctx = node.context;
						if (callback && cb !== callback || context && ctx !== context) {
							this.on(event, cb, ctx);
						}
					}
				}

				return this;
			},
			writable: true,
			configurable: true
		},
		trigger: {

			/**
    * Trigger one or many events, firing all bound callbacks. Callbacks are
    * passed the same arguments as `trigger` is, apart from the event name
    * (unless you're listening on `"all"`, which will cause your callback
    * to receive the true name of the event as the first argument).
    * @param {String} events
    */

			value: function trigger(events) {
				for (var _len = arguments.length, rest = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
					rest[_key - 1] = arguments[_key];
				}

				var event, node, calls, tail, args, all;
				if (!(calls = this._callbacks)) {
					return this;
				}

				all = calls.all;
				events = events.split(eventSplitter);

				// For each event, walk through the linked list of callbacks twice,
				// first to trigger the event, then to trigger any `"all"` callbacks.
				while (event = events.shift()) {
					if (node = calls[event]) {
						tail = node.tail;
						while ((node = node.next) !== tail) {
							node.callback.apply(node.context || this, rest);
						}
					}
					if (node = all) {
						tail = node.tail;
						args = [event].concat(rest);
						while ((node = node.next) !== tail) {
							node.callback.apply(node.context || this, args);
						}
					}
				}

				return this;
			},
			writable: true,
			configurable: true
		}
	});

	return Scenario;
})();

exports["default"] = Scenario;

/**
 * Parses action call from string
 * @param {String} data
 * @returns {Object}
 */
function parseActionCall(data) {
	if (typeof data === "string") {
		var parts = data.split(":");
		return {
			name: parts.shift(),
			options: parts.join(":")
		};
	} else {
		var name = Object.keys(data)[0];
		return {
			name: name,
			options: data[name]
		};
	}
}

function requestTimer(fn, delay) {
	if (!delay) {
		fn();
	} else {
		return setTimeout(fn, delay);
	}
}
Object.defineProperty(exports, "__esModule", {
	value: true
});

},{"./actions":"/Users/Sergey/Projects/codemirror-movie/lib/actions.js","./utils":"/Users/Sergey/Projects/codemirror-movie/lib/utils.js","./widgets/prompt":"/Users/Sergey/Projects/codemirror-movie/lib/widgets/prompt.js","./widgets/tooltip":"/Users/Sergey/Projects/codemirror-movie/lib/widgets/tooltip.js"}],"/Users/Sergey/Projects/codemirror-movie/lib/utils.js":[function(require,module,exports){
"use strict";

exports.extend = extend;
exports.toArray = toArray;

/**
 * Returns prefixed (if required) CSS property name
 * @param  {String} prop
 * @return {String}
 */
exports.prefixed = prefixed;

/**
 * Helper function that produces <code>{line, ch}</code> object from
 * passed argument
 * @param {Object} pos
 * @param {CodeMirror} editor
 * @returns {Object}
 */
exports.makePos = makePos;
exports.template = template;
exports.find = find;

/**
 * Relaxed JSON parser.
 * @param {String} text
 * @returns {Object} 
 */
exports.parseJSON = parseJSON;
var propCache = {};

// detect CSS 3D Transforms for smoother animations
var has3d = exports.has3d = (function () {
	var el = document.createElement("div");
	var cssTransform = prefixed("transform");
	if (cssTransform) {
		el.style[cssTransform] = "translateZ(0)";
		return /translatez/i.test(el.style[cssTransform]);
	}

	return false;
})();

function extend(obj) {
	for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
		args[_key - 1] = arguments[_key];
	}

	args.forEach(function (a) {
		if (typeof a === "object") {
			Object.keys(a).forEach(function (key) {
				return obj[key] = a[key];
			});
		}
	});
	return obj;
}

function toArray(obj) {
	var ix = arguments[1] === undefined ? 0 : arguments[1];

	return Array.prototype.slice.call(obj, ix);
}

function prefixed(prop) {
	if (prop in propCache) {
		return propCache[prop];
	}

	var el = document.createElement("div");
	var style = el.style;

	var prefixes = ["o", "ms", "moz", "webkit"];
	var props = [prop];
	var capitalize = function capitalize(str) {
		return str.charAt(0).toUpperCase() + str.substr(1);
	};

	prop = prop.replace(/\-([a-z])/g, function (str, ch) {
		return ch.toUpperCase();
	});

	var capProp = capitalize(prop);
	prefixes.forEach(function (prefix) {
		props.push(prefix + capProp, capitalize(prefix) + capProp);
	});

	for (var i = 0, il = props.length; i < il; i++) {
		if (props[i] in style) {
			return propCache[prop] = props[i];
		}
	}

	return propCache[prop] = null;
}

function makePos(pos, editor) {
	if (pos === "caret") {
		return editor.getCursor(true);
	}

	if (typeof pos === "string") {
		if (~pos.indexOf(":")) {
			var parts = pos.split(":");
			return {
				line: +parts[0],
				ch: +parts[1]
			};
		}

		pos = +pos;
	}

	if (typeof pos === "number") {
		return editor.posFromIndex(pos);
	}

	return pos;
}

function template(tmpl, data) {
	var fn = function (data) {
		return tmpl.replace(/<%([-=])?\s*([\w\-]+)\s*%>/g, function (str, op, key) {
			return data[key.trim()];
		});
	};
	return data ? fn(data) : fn;
}

function find(arr, iter) {
	var found;
	arr.some(function (item, i, arr) {
		if (iter(item, i, arr)) {
			return found = item;
		}
	});
	return found;
}

function parseJSON(text) {
	try {
		return new Function("return " + text)();
	} catch (e) {
		return {};
	}
}

Object.defineProperty(exports, "__esModule", {
	value: true
});

},{}],"/Users/Sergey/Projects/codemirror-movie/lib/vendor/tween.js":[function(require,module,exports){
"use strict";

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

exports["default"] = tween;

/**
 * Get or set default value
 * @param  {String} name
 * @param  {Object} value
 * @return {Object}
 */
exports.defaults = defaults;

/**
 * Returns all active animation objects.
 * For debugging mostly
 * @return {Array}
 */
exports._all = _all;
exports.stop = stop;
var global = window;
var time = Date.now ? function () {
	return Date.now();
} : function () {
	return +new Date();
};

var indexOf = "indexOf" in Array.prototype ? function (array, value) {
	return array.indexOf(value);
} : function (array, value) {
	for (var i = 0, il = array.length; i < il; i++) {
		if (array[i] === value) {
			return i;
		}
	}

	return -1;
};

function extend(obj) {
	for (var i = 1, il = arguments.length, source; i < il; i++) {
		source = arguments[i];
		if (source) {
			for (var prop in source) {
				obj[prop] = source[prop];
			}
		}
	}

	return obj;
}

/**
 * requestAnimationFrame polyfill by Erik Möller
 * fixes from Paul Irish and Tino Zijdel
 * http://paulirish.com/2011/requestanimationframe-for-smart-animating/
 * http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
 */
(function () {
	var lastTime = 0;
	var vendors = ["ms", "moz", "webkit", "o"];
	for (var x = 0; x < vendors.length && !global.requestAnimationFrame; ++x) {
		global.requestAnimationFrame = global[vendors[x] + "RequestAnimationFrame"];
		global.cancelAnimationFrame = global[vendors[x] + "CancelAnimationFrame"] || global[vendors[x] + "CancelRequestAnimationFrame"];
	}

	if (!global.requestAnimationFrame) global.requestAnimationFrame = function (callback, element) {
		var currTime = time();
		var timeToCall = Math.max(0, 16 - (currTime - lastTime));
		var id = global.setTimeout(function () {
			callback(currTime + timeToCall);
		}, timeToCall);
		lastTime = currTime + timeToCall;
		return id;
	};

	if (!global.cancelAnimationFrame) global.cancelAnimationFrame = function (id) {
		clearTimeout(id);
	};
})();

var dummyFn = function dummyFn() {};
var anims = [];
var idCounter = 0;

var defaults = {
	duration: 500, // ms
	delay: 0,
	easing: "linear",
	start: dummyFn,
	step: dummyFn,
	complete: dummyFn,
	autostart: true,
	reverse: false
};

var easings = exports.easings = {
	linear: function linear(t, b, c, d) {
		return c * t / d + b;
	},
	inQuad: function inQuad(t, b, c, d) {
		return c * (t /= d) * t + b;
	},
	outQuad: function outQuad(t, b, c, d) {
		return -c * (t /= d) * (t - 2) + b;
	},
	inOutQuad: function inOutQuad(t, b, c, d) {
		if ((t /= d / 2) < 1) {
			return c / 2 * t * t + b;
		}return -c / 2 * (--t * (t - 2) - 1) + b;
	},
	inCubic: function inCubic(t, b, c, d) {
		return c * (t /= d) * t * t + b;
	},
	outCubic: function outCubic(t, b, c, d) {
		return c * ((t = t / d - 1) * t * t + 1) + b;
	},
	inOutCubic: function inOutCubic(t, b, c, d) {
		if ((t /= d / 2) < 1) {
			return c / 2 * t * t * t + b;
		}return c / 2 * ((t -= 2) * t * t + 2) + b;
	},
	inExpo: function inExpo(t, b, c, d) {
		return t == 0 ? b : c * Math.pow(2, 10 * (t / d - 1)) + b - c * 0.001;
	},
	outExpo: function outExpo(t, b, c, d) {
		return t == d ? b + c : c * 1.001 * (-Math.pow(2, -10 * t / d) + 1) + b;
	},
	inOutExpo: function inOutExpo(t, b, c, d) {
		if (t == 0) {
			return b;
		}if (t == d) {
			return b + c;
		}if ((t /= d / 2) < 1) {
			return c / 2 * Math.pow(2, 10 * (t - 1)) + b - c * 0.0005;
		}return c / 2 * 1.0005 * (-Math.pow(2, -10 * --t) + 2) + b;
	},
	inElastic: function inElastic(t, b, c, d, a, p) {
		var s;
		if (t == 0) {
			return b;
		}if ((t /= d) == 1) {
			return b + c;
		}if (!p) p = d * 0.3;
		if (!a || a < Math.abs(c)) {
			a = c;s = p / 4;
		} else s = p / (2 * Math.PI) * Math.asin(c / a);
		return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
	},
	outElastic: function outElastic(t, b, c, d, a, p) {
		var s;
		if (t == 0) {
			return b;
		}if ((t /= d) == 1) {
			return b + c;
		}if (!p) p = d * 0.3;
		if (!a || a < Math.abs(c)) {
			a = c;s = p / 4;
		} else s = p / (2 * Math.PI) * Math.asin(c / a);
		return a * Math.pow(2, -10 * t) * Math.sin((t * d - s) * (2 * Math.PI) / p) + c + b;
	},
	inOutElastic: function inOutElastic(t, b, c, d, a, p) {
		var s;
		if (t == 0) {
			return b;
		}if ((t /= d / 2) == 2) {
			return b + c;
		}if (!p) p = d * (0.3 * 1.5);
		if (!a || a < Math.abs(c)) {
			a = c;s = p / 4;
		} else s = p / (2 * Math.PI) * Math.asin(c / a);
		if (t < 1) {
			return -0.5 * (a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
		}return a * Math.pow(2, -10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p) * 0.5 + c + b;
	},
	inBack: function inBack(t, b, c, d, s) {
		if (s == undefined) s = 1.70158;
		return c * (t /= d) * t * ((s + 1) * t - s) + b;
	},
	outBack: function outBack(t, b, c, d, s) {
		if (s == undefined) s = 1.70158;
		return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b;
	},
	inOutBack: function inOutBack(t, b, c, d, s) {
		if (s == undefined) s = 1.70158;
		if ((t /= d / 2) < 1) {
			return c / 2 * (t * t * (((s *= 1.525) + 1) * t - s)) + b;
		}return c / 2 * ((t -= 2) * t * (((s *= 1.525) + 1) * t + s) + 2) + b;
	},
	inBounce: function inBounce(t, b, c, d) {
		return c - this.outBounce(t, d - t, 0, c, d) + b;
	},
	outBounce: function outBounce(t, b, c, d) {
		if ((t /= d) < 1 / 2.75) {
			return c * (7.5625 * t * t) + b;
		} else if (t < 2 / 2.75) {
			return c * (7.5625 * (t -= 1.5 / 2.75) * t + 0.75) + b;
		} else if (t < 2.5 / 2.75) {
			return c * (7.5625 * (t -= 2.25 / 2.75) * t + 0.9375) + b;
		} else {
			return c * (7.5625 * (t -= 2.625 / 2.75) * t + 0.984375) + b;
		}
	},
	inOutBounce: function inOutBounce(t, b, c, d) {
		if (t < d / 2) {
			return this.inBounce(t * 2, 0, c, d) * 0.5 + b;
		}return this.outBounce(t * 2 - d, 0, c, d) * 0.5 + c * 0.5 + b;
	},
	outHard: function outHard(t, b, c, d) {
		var ts = (t /= d) * t;
		var tc = ts * t;
		return b + c * (1.75 * tc * ts + -7.4475 * ts * ts + 12.995 * tc + -11.595 * ts + 5.2975 * t);
	}
};

function mainLoop() {
	if (!anims.length) {
		// no animations left, stop polling
		return;
	}

	var now = time();
	var filtered = [],
	    tween,
	    opt;

	// do not use Array.filter() of _.filter() function
	// since tween’s callbacks can add new animations
	// in runtime. In this case, filter function will loose
	// newly created animation
	for (var i = 0; i < anims.length; i++) {
		tween = anims[i];

		if (!tween.animating) {
			continue;
		}

		opt = tween.options;

		if (tween.startTime > now) {
			filtered.push(tween);
			continue;
		}

		if (tween.infinite) {
			// opt.step.call(tween, 0);
			opt.step(0, tween);
			filtered.push(tween);
		} else if (tween.pos === 1 || tween.endTime <= now) {
			tween.pos = 1;
			// opt.step.call(tween, opt.reverse ? 0 : 1);
			opt.step(opt.reverse ? 0 : 1, tween);
			tween.stop();
		} else {
			tween.pos = opt.easing(now - tween.startTime, 0, 1, opt.duration);
			// opt.step.call(tween, opt.reverse ? 1 - tween.pos : tween.pos);
			opt.step(opt.reverse ? 1 - tween.pos : tween.pos, tween);
			filtered.push(tween);
		}
	}

	anims = filtered;

	if (anims.length) {
		requestAnimationFrame(mainLoop);
	}
}

function addToQueue(tween) {
	if (indexOf(anims, tween) == -1) {
		anims.push(tween);
		if (anims.length == 1) {
			mainLoop();
		}
	}
}

var Tween = exports.Tween = (function () {
	function Tween(options) {
		_classCallCheck(this, Tween);

		this.options = extend({}, defaults, options);

		var e = this.options.easing;
		if (typeof e == "string") {
			if (!easings[e]) throw "Unknown \"" + e + "\" easing function";
			this.options.easing = easings[e];
		}

		if (typeof this.options.easing != "function") throw "Easing should be a function";

		this._id = "tw" + idCounter++;

		if (this.options.autostart) {
			this.start();
		}
	}

	_prototypeProperties(Tween, null, {
		start: {

			/**
    * Start animation from the beginning
    */

			value: function start() {
				if (!this.animating) {
					this.pos = 0;
					this.startTime = time() + (this.options.delay || 0);
					this.infinite = this.options.duration === "infinite";
					this.endTime = this.infinite ? 0 : this.startTime + this.options.duration;
					this.animating = true;
					this.options.start(this);
					addToQueue(this);
				}

				return this;
			},
			writable: true,
			configurable: true
		},
		stop: {

			/**
    * Stop animation
    */

			value: function stop() {
				if (this.animating) {
					this.animating = false;
					if (this.options.complete) {
						this.options.complete(this);
					}
				}
				return this;
			},
			writable: true,
			configurable: true
		},
		toggle: {
			value: function toggle() {
				if (this.animating) {
					this.stop();
				} else {
					this.start();
				}
			},
			writable: true,
			configurable: true
		}
	});

	return Tween;
})();

function tween(options) {
	return new Tween(options);
}

function defaults(name, value) {
	if (typeof value != "undefined") {
		defaults[name] = value;
	}

	return defaults[name];
}

function _all() {
	return anims;
}

function stop() {
	for (var i = 0; i < anims.length; i++) {
		anims[i].stop();
	}

	anims.length = 0;
}

;
Object.defineProperty(exports, "__esModule", {
	value: true
});

},{}],"/Users/Sergey/Projects/codemirror-movie/lib/widgets/outline.js":[function(require,module,exports){
"use strict";

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { "default": obj }; };

var dom = _interopRequireWildcard(require("../dom"));

var _utils = require("../utils");

var template = _utils.template;
var find = _utils.find;
var toArray = _utils.toArray;
var extend = _utils.extend;
var defaultOptions = exports.defaultOptions = {
	wrapperTemplate: "<ul class=\"CodeMirror-outline\"><%= content %></ul>",
	itemTemplate: "<li data-action-id=\"<%= id %>\" class=\"CodeMirror-outline__item\"><%= title %></li>",
	itemClass: "CodeMirror-outline__item",
	selectedClass: "CodeMirror-outline__item_selected"
};

/**
 * @param {Object} hints
 * @param {Scenario} scenario
 * @param {Object} options
 */

exports["default"] = function (hints, scenario) {
	var options = arguments[2] === undefined ? {} : arguments[2];

	options = extend({}, defaultOptions, options);

	var hintKeys = Object.keys(hints).sort(function (a, b) {
		return a - b;
	});

	var itemTemplate = template(options.itemTemplate);
	var items = hintKeys.map(function (key) {
		return itemTemplate({ title: hints[key], id: key });
	});

	var el = dom.toDOM(template(options.wrapperTemplate, {
		content: items.join("")
	}));

	if (options.target) {
		options.target.appendChild(el);
	}

	scenario.on("action", function (id) {
		var items = toArray(el.querySelectorAll("." + options.itemClass));
		var matchedItem = find(items, function (elem) {
			return elem.getAttribute("data-action-id") == id;
		});

		if (matchedItem) {
			items.forEach(function (item) {
				return item.classList.remove(options.selectedClass);
			});
			matchedItem.classList.add(options.selectedClass);
		}
	}).on("stop", function () {
		toArray(el.querySelectorAll("." + options.itemClass)).forEach(function (item) {
			return item.classList.remove(options.selectedClass);
		});
	});

	return el;
};

Object.defineProperty(exports, "__esModule", {
	value: true
});
/**
 * Module that creates list of action hints and highlights items when specified
 * action is performed
 */

},{"../dom":"/Users/Sergey/Projects/codemirror-movie/lib/dom.js","../utils":"/Users/Sergey/Projects/codemirror-movie/lib/utils.js"}],"/Users/Sergey/Projects/codemirror-movie/lib/widgets/prompt.js":[function(require,module,exports){
"use strict";

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { "default": obj }; };

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _defineProperty = function (obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); };

exports.show = show;
exports.hide = hide;

var tween = _interopRequire(require("../vendor/tween"));

var _utils = require("../utils");

var extend = _utils.extend;
var template = _utils.template;
var has3d = _utils.has3d;
var prefixed = _utils.prefixed;

var dom = _interopRequireWildcard(require("../dom"));

var dialogInstance = null;
var bgInstance = null;
var lastTween = null;

var actions = exports.actions = {
	prompt: function prompt(options, editor, next, timer) {
		options = extend({
			title: "Enter something",
			delay: 80, // delay between character typing
			typeDelay: 1000, // time to wait before typing text
			hideDelay: 2000 // time to wait before hiding prompt dialog
		}, wrap("text", options));

		show(options.title, editor.getWrapperElement(), function (dialog) {
			timer(function () {
				typeText(dialog.querySelector(".CodeMirror-prompt__input"), options, timer, function () {
					timer(function () {
						hide(next);
					}, options.hideDelay);
				});
			}, options.typeDelay);
		});
	}
};

function show(text, target, callback) {
	hide();
	dialogInstance = dom.toDOM("<div class=\"CodeMirror-prompt\">\n\t\t<div class=\"CodeMirror-prompt__title\">" + text + "</div>\n\t\t<input type=\"text\" name=\"prompt\" class=\"CodeMirror-prompt__input\" readonly=\"readonly\" />\n\t\t</div>");
	bgInstance = dom.toDOM("<div class=\"CodeMirror-prompt__shade\"></div>");

	target.appendChild(dialogInstance);
	target.appendChild(bgInstance);

	animateShow(dialogInstance, bgInstance, { complete: callback });
}

function hide(callback) {
	if (dialogInstance) {
		if (lastTween) {
			lastTween.stop();
			lastTween = null;
		}
		animateHide(dialogInstance, bgInstance, { complete: callback });
		dialogInstance = bgInstance = null;
	} else if (callback) {
		callback();
	}
}

/**
 * @param {Element} dialog
 * @param {Element} bg
 * @param {Object} options 
 */
function animateShow(dialog, bg) {
	var options = arguments[2] === undefined ? {} : arguments[2];

	var cssTransform = prefixed("transform");
	var dialogStyle = dialog.style;
	var bgStyle = bg.style;
	var height = dialog.offsetHeight;
	var tmpl = template(has3d ? "translate3d(0, <%= pos %>, 0)" : "translate(0, <%= pos %>)");

	bgStyle.opacity = 0;
	tween({
		duration: 200,
		step: function step(pos) {
			bgStyle.opacity = pos;
		}
	});

	dialogStyle[cssTransform] = tmpl({ pos: -height });

	return lastTween = tween({
		duration: 400,
		easing: "outCubic",
		step: function step(pos) {
			dialogStyle[cssTransform] = tmpl({ pos: -height * (1 - pos) + "px" });
		},
		complete: function complete() {
			lastTween = null;
			options.complete && options.complete(dialog, bg);
		}
	});
}

/**
 * @param {Element} dialog
 * @param {Element} bg
 * @param {Object} options
 */
function animateHide(dialog, bg, options) {
	var dialogStyle = dialog.style;
	var bgStyle = bg.style;
	var height = dialog.offsetHeight;
	var cssTransform = prefixed("transform");
	var tmpl = template(has3d ? "translate3d(0, <%= pos %>, 0)" : "translate(0, <%= pos %>)");

	return tween({
		duration: 200,
		step: function step(pos) {
			dialogStyle[cssTransform] = tmpl({ pos: -height * pos + "px" });
			bgStyle.opacity = 1 - pos;
		},
		complete: function complete() {
			dom.remove([dialog, bg]);
			options.complete && options.complete(dialog, bg);
		}
	});
}

function typeText(target, options, timer, next) {
	var chars = options.text.split("");
	timer(function perform() {
		target.value += chars.shift();
		if (chars.length) {
			timer(perform, options.delay);
		} else {
			next();
		}
	}, options.delay);
}

function wrap(key, value) {
	return typeof value === "object" ? value : _defineProperty({}, key, value);
}
Object.defineProperty(exports, "__esModule", {
	value: true
});
/**
 * Shows fake prompt dialog with interactive value typing
 */

},{"../dom":"/Users/Sergey/Projects/codemirror-movie/lib/dom.js","../utils":"/Users/Sergey/Projects/codemirror-movie/lib/utils.js","../vendor/tween":"/Users/Sergey/Projects/codemirror-movie/lib/vendor/tween.js"}],"/Users/Sergey/Projects/codemirror-movie/lib/widgets/tooltip.js":[function(require,module,exports){
"use strict";

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { "default": obj }; };

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _defineProperty = function (obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); };

exports.show = show;
exports.hide = hide;

var tween = _interopRequire(require("../vendor/tween"));

var _utils = require("../utils");

var extend = _utils.extend;
var prefixed = _utils.prefixed;
var makePos = _utils.makePos;
var has3d = _utils.has3d;

var dom = _interopRequireWildcard(require("../dom"));

var instance = null;
var lastTween = null;

var alignDefaults = exports.alignDefaults = {
	/** CSS selector for getting popup tail */
	tailClass: "CodeMirror-tooltip__tail",

	/** Class name for switching tail/popup position relative to target point */
	belowClass: "CodeMirror-tooltip_below",

	/** Min distance between popup and viewport */
	popupMargin: 5,

	/** Min distance between popup left/right edge and its tail */
	tailMargin: 11
};

var actions = exports.actions = {
	/**
  * Shows tooltip with given text, wait for `options.wait`
  * milliseconds then hides tooltip
  */
	tooltip: function tooltip(options, editor, next, timer) {
		options = extend({
			wait: 4000, // time to wait before hiding tooltip
			pos: "caret" // position where tooltip should point to
		}, wrap("text", options));

		var pos = resolvePosition(options.pos, editor);
		show(options.text, pos, function () {
			timer(function () {
				hide(function () {
					return timer(next);
				});
			}, options.wait);
		});
	},

	/**
  * Shows tooltip with specified text. This tooltip should be explicitly 
  * hidden with `hideTooltip` action
  */
	showTooltip: function showTooltip(options, editor, next, timer) {
		options = extend({
			pos: "caret" // position where tooltip should point to
		}, wrap("text", options));

		show(options.text, resolvePosition(options.pos, editor));
		next();
	},

	/**
  * Hides tooltip, previously shown by 'showTooltip' action
  */
	hideTooltip: function hideTooltip(options, editor, next, timer) {
		hide(next);
	}
};

function show(text, pos, callback) {
	hide();

	instance = dom.toDOM("<div class=\"CodeMirror-tooltip\">\n\t\t<div class=\"CodeMirror-tooltip__content\">" + text + "</div>\n\t\t<div class=\"CodeMirror-tooltip__tail\"></div>\n\t\t</div>");

	dom.css(instance, prefixed("transform"), "scale(0)");
	document.body.appendChild(instance);

	alignPopupWithTail(instance, { position: pos });
	animateShow(instance, { complete: callback });
}

function hide(callback) {
	if (instance) {
		if (lastTween) {
			lastTween.stop();
			lastTween = null;
		}
		animateHide(instance, { complete: callback });
		instance = null;
	} else if (callback) {
		callback();
	}
}

/**
 * Helper function that finds optimal position of tooltip popup on page
 * and aligns popup tail with this position
 * @param {Element} popup
 * @param {Object} options
 */
function alignPopupWithTail(popup) {
	var options = arguments[1] === undefined ? {} : arguments[1];

	options = extend({}, alignDefaults, options);

	dom.css(popup, {
		left: 0,
		top: 0
	});

	var tail = popup.querySelector("." + options.tailClass);

	var resultX = 0,
	    resultY = 0;
	var pos = options.position;
	var vp = dom.viewportRect();

	var width = popup.offsetWidth;
	var height = popup.offsetHeight;

	var isTop;

	// calculate horizontal position
	resultX = Math.min(vp.width - width - options.popupMargin, Math.max(options.popupMargin, pos.x - vp.left - width / 2));

	// calculate vertical position
	if (height + tail.offsetHeight + options.popupMargin + vp.top < pos.y) {
		// place above target position
		resultY = Math.max(0, pos.y - height - tail.offsetHeight);
		isTop = true;
	} else {
		// place below target position
		resultY = pos.y + tail.offsetHeight;
		isTop = false;
	}

	// calculate tail position
	var tailMinLeft = options.tailMargin;
	var tailMaxLeft = width - options.tailMargin;
	tail.style.left = Math.min(tailMaxLeft, Math.max(tailMinLeft, pos.x - resultX - vp.left)) + "px";

	dom.css(popup, {
		left: resultX,
		top: resultY
	});

	popup.classList.toggle(options.belowClass, !isTop);
}

/**
 * @param {jQuery} elem
 * @param {Object} options 
 */
function animateShow(elem) {
	var options = arguments[1] === undefined ? {} : arguments[1];

	options = extend({}, alignDefaults, options);
	var cssOrigin = prefixed("transform-origin");
	var cssTransform = prefixed("transform");
	var style = elem.style;

	var tail = elem.querySelector("." + options.tailClass);
	var xOrigin = dom.css(tail, "left");
	var yOrigin = tail.offsetTop;
	if (elem.classList.contains(options.belowClass)) {
		yOrigin -= tail.offsetHeight;
	}

	yOrigin += "px";

	style[cssOrigin] = xOrigin + " " + yOrigin;
	var prefix = has3d ? "translateZ(0) " : "";

	return lastTween = tween({
		duration: 800,
		easing: "outElastic",
		step: function step(pos) {
			style[cssTransform] = prefix + "scale(" + pos + ")";
		},
		complete: function complete() {
			style[cssTransform] = "none";
			lastTween = null;
			options.complete && options.complete(elem);
		}
	});
}

/**
 * @param {jQuery} elem
 * @param {Object} options
 */
function animateHide(elem, options) {
	var style = elem.style;

	return tween({
		duration: 200,
		easing: "linear",
		step: function step(pos) {
			style.opacity = 1 - pos;
		},
		complete: function complete() {
			dom.remove(elem);
			options.complete && options.complete(elem);
		}
	});
}

/**
 * Resolves position where tooltip should point to
 * @param {Object} pos
 * @param {CodeMirror} editor
 * @returns {Object} Object with <code>x</code> and <code>y</code> 
 * properties
 */
function resolvePosition(pos, editor) {
	if (pos === "caret") {
		// get absolute position of current caret position
		return sanitizeCaretPos(editor.cursorCoords(true));
	}

	if (typeof pos === "object") {
		if ("x" in pos && "y" in pos) {
			// passed absolute coordinates
			return pos;
		}

		if ("left" in pos && "top" in pos) {
			// passed absolute coordinates
			return sanitizeCaretPos(pos);
		}
	}

	pos = makePos(pos, editor);
	return sanitizeCaretPos(editor.charCoords(pos));
}

function sanitizeCaretPos(pos) {
	if ("left" in pos) {
		pos.x = pos.left;
	}

	if ("top" in pos) {
		pos.y = pos.top;
	}

	return pos;
}

function wrap(key, value) {
	return typeof value === "object" ? value : _defineProperty({}, key, value);
}
Object.defineProperty(exports, "__esModule", {
	value: true
});
/**
 * Extension that allows authors to display context tooltips bound to specific
 * positions
 */

},{"../dom":"/Users/Sergey/Projects/codemirror-movie/lib/dom.js","../utils":"/Users/Sergey/Projects/codemirror-movie/lib/utils.js","../vendor/tween":"/Users/Sergey/Projects/codemirror-movie/lib/vendor/tween.js"}]},{},["/Users/Sergey/Projects/codemirror-movie/lib/movie.js"])("/Users/Sergey/Projects/codemirror-movie/lib/movie.js")
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9qcy1idW5kbGVyL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvU2VyZ2V5L1Byb2plY3RzL2NvZGVtaXJyb3ItbW92aWUvbGliL2FjdGlvbnMuanMiLCIvVXNlcnMvU2VyZ2V5L1Byb2plY3RzL2NvZGVtaXJyb3ItbW92aWUvbGliL2RvbS5qcyIsIi9Vc2Vycy9TZXJnZXkvUHJvamVjdHMvY29kZW1pcnJvci1tb3ZpZS9saWIvbW92aWUuanMiLCIvVXNlcnMvU2VyZ2V5L1Byb2plY3RzL2NvZGVtaXJyb3ItbW92aWUvbGliL3NjZW5hcmlvLmpzIiwiL1VzZXJzL1NlcmdleS9Qcm9qZWN0cy9jb2RlbWlycm9yLW1vdmllL2xpYi91dGlscy5qcyIsIi9Vc2Vycy9TZXJnZXkvUHJvamVjdHMvY29kZW1pcnJvci1tb3ZpZS9saWIvdmVuZG9yL3R3ZWVuLmpzIiwiL1VzZXJzL1NlcmdleS9Qcm9qZWN0cy9jb2RlbWlycm9yLW1vdmllL2xpYi93aWRnZXRzL291dGxpbmUuanMiLCIvVXNlcnMvU2VyZ2V5L1Byb2plY3RzL2NvZGVtaXJyb3ItbW92aWUvbGliL3dpZGdldHMvcHJvbXB0LmpzIiwiL1VzZXJzL1NlcmdleS9Qcm9qZWN0cy9jb2RlbWlycm9yLW1vdmllL2xpYi93aWRnZXRzL3Rvb2x0aXAuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7O3FCQ0E4QixTQUFTOztJQUEvQixNQUFNLFVBQU4sTUFBTTtJQUFFLE9BQU8sVUFBUCxPQUFPOztBQUV2QixJQUFJLE9BQU8sR0FBRzs7Ozs7Ozs7Ozs7O0FBWWIsS0FBSSxFQUFFLGNBQVMsT0FBTyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFO0FBQzVDLFNBQU8sR0FBRyxNQUFNLENBQUM7QUFDaEIsT0FBSSxFQUFFLEVBQUU7QUFDUixRQUFLLEVBQUUsRUFBRTtBQUNULE1B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LEdBQUcsQ0FBQyxDQUFBLEFBQUMsR0FBRyxDQUFDLENBQUM7RUFDaEM7QUFDRCxPQUFNLEVBQUUsZ0JBQVMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFO0FBQzVCLFNBQU0sQUFBQyxDQUFDLElBQUUsQ0FBQyxHQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsRUFBRSxJQUFHLENBQUMsR0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFBLEFBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsS0FBSyxDQUFDO0VBQ2xFO0FBQ0QsUUFBTyxFQUFFLGlCQUFTLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRTtBQUM3QixTQUFNLEFBQUMsQ0FBQyxJQUFFLENBQUMsR0FBSSxDQUFDLEdBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxLQUFLLElBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsR0FBRyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFBLEFBQUMsR0FBRyxDQUFDLENBQUM7RUFDbEU7QUFDRCxVQUFTLEVBQUUsbUJBQVMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFO0FBQy9CLE1BQUcsQ0FBQyxJQUFFLENBQUM7QUFBRSxVQUFPLENBQUMsQ0FBQztHQUFBLEFBQ2xCLElBQUcsQ0FBQyxJQUFFLENBQUM7QUFBRSxVQUFPLENBQUMsR0FBQyxDQUFDLENBQUM7R0FBQSxBQUNwQixJQUFHLENBQUMsQ0FBQyxJQUFFLENBQUMsR0FBQyxDQUFDLENBQUEsR0FBSSxDQUFDO0FBQUUsVUFBTyxDQUFDLEdBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLEVBQUUsSUFBRyxDQUFDLEdBQUcsQ0FBQyxDQUFBLEFBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBTSxDQUFDO0dBQUEsQUFDeEUsT0FBTyxDQUFDLEdBQUMsQ0FBQyxHQUFHLE1BQU0sSUFBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFBLEFBQUMsR0FBRyxDQUFDLENBQUM7RUFDdkQ7QUFDRCxVQUFTLEVBQUUsbUJBQVMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7QUFDckMsTUFBSSxDQUFDLENBQUM7QUFDTixNQUFHLENBQUMsSUFBRSxDQUFDO0FBQUUsVUFBTyxDQUFDLENBQUM7R0FBQSxBQUFFLElBQUcsQ0FBQyxDQUFDLElBQUUsQ0FBQyxDQUFBLElBQUcsQ0FBQztBQUFFLFVBQU8sQ0FBQyxHQUFDLENBQUMsQ0FBQztHQUFBLEFBQUUsSUFBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUMsQ0FBQyxHQUFDLEdBQUUsQ0FBQztBQUM3RCxNQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFO0FBQUUsSUFBQyxHQUFDLENBQUMsQ0FBQyxBQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDO0dBQUUsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFFLENBQUMsR0FBQyxJQUFJLENBQUMsRUFBRSxDQUFBLEFBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQztBQUNsRixTQUFPLEVBQUUsQ0FBQyxHQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFDLEVBQUUsSUFBRSxDQUFDLElBQUUsQ0FBQyxDQUFBLEFBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQSxJQUFHLENBQUMsR0FBQyxJQUFJLENBQUMsRUFBRSxDQUFBLEFBQUMsR0FBQyxDQUFDLENBQUUsQ0FBQSxBQUFDLEdBQUcsQ0FBQyxDQUFDO0VBQ3pFO0FBQ0QsV0FBVSxFQUFFLG9CQUFTLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFO0FBQ3RDLE1BQUksQ0FBQyxDQUFDO0FBQ04sTUFBRyxDQUFDLElBQUUsQ0FBQztBQUFFLFVBQU8sQ0FBQyxDQUFDO0dBQUEsQUFBRSxJQUFHLENBQUMsQ0FBQyxJQUFFLENBQUMsQ0FBQSxJQUFHLENBQUM7QUFBRSxVQUFPLENBQUMsR0FBQyxDQUFDLENBQUM7R0FBQSxBQUFFLElBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFDLENBQUMsR0FBQyxHQUFFLENBQUM7QUFDN0QsTUFBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRTtBQUFFLElBQUMsR0FBQyxDQUFDLENBQUMsQUFBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQztHQUFFLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBRSxDQUFDLEdBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQSxBQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUM7QUFDbEYsU0FBTyxDQUFDLEdBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFFLEdBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFBLElBQUcsQ0FBQyxHQUFDLElBQUksQ0FBQyxFQUFFLENBQUEsQUFBQyxHQUFDLENBQUMsQ0FBRSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUU7RUFDdkU7QUFDRCxhQUFZLEVBQUUsc0JBQVMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7QUFDeEMsTUFBSSxDQUFDLENBQUM7QUFDTixNQUFHLENBQUMsSUFBRSxDQUFDO0FBQUUsVUFBTyxDQUFDLENBQUM7R0FBQSxBQUNsQixJQUFHLENBQUMsQ0FBQyxJQUFFLENBQUMsR0FBQyxDQUFDLENBQUEsSUFBRyxDQUFDO0FBQUUsVUFBTyxDQUFDLEdBQUMsQ0FBQyxDQUFDO0dBQUEsQUFDM0IsSUFBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUMsQ0FBQyxJQUFFLEdBQUUsR0FBQyxHQUFHLENBQUEsQUFBQyxDQUFDO0FBQ3BCLE1BQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUU7QUFBRSxJQUFDLEdBQUMsQ0FBQyxDQUFDLEFBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLENBQUM7R0FBRSxNQUFZLENBQUMsR0FBRyxDQUFDLElBQUUsQ0FBQyxHQUFDLElBQUksQ0FBQyxFQUFFLENBQUEsQUFBQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3hGLE1BQUcsQ0FBQyxHQUFHLENBQUM7QUFBRSxVQUFPLENBQUMsR0FBRSxJQUFFLENBQUMsR0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBQyxFQUFFLElBQUUsQ0FBQyxJQUFFLENBQUMsQ0FBQSxBQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLENBQUEsSUFBRyxDQUFDLEdBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQSxBQUFDLEdBQUMsQ0FBQyxDQUFFLENBQUEsQUFBQyxHQUFHLENBQUMsQ0FBQztHQUFBLEFBQ3RGLE9BQU8sQ0FBQyxHQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBRSxJQUFFLENBQUMsSUFBRSxDQUFDLENBQUEsQUFBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFBLElBQUcsQ0FBQyxHQUFDLElBQUksQ0FBQyxFQUFFLENBQUEsQUFBQyxHQUFDLENBQUMsQ0FBRSxHQUFDLEdBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0VBQzlFO0FBQ0QsT0FBTSxFQUFFLGdCQUFTLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7QUFDL0IsTUFBRyxDQUFDLElBQUksU0FBUyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUM7QUFDL0IsU0FBTyxDQUFDLElBQUUsQ0FBQyxJQUFFLENBQUMsQ0FBQSxBQUFDLEdBQUMsQ0FBQyxJQUFFLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQSxHQUFFLENBQUMsR0FBRyxDQUFDLENBQUEsQUFBQyxHQUFHLENBQUMsQ0FBQztFQUNwQztBQUNELFFBQU8sRUFBRSxpQkFBUyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFO0FBQ2hDLE1BQUcsQ0FBQyxJQUFJLFNBQVMsRUFBRSxDQUFDLEdBQUcsT0FBTyxDQUFDO0FBQy9CLFNBQU8sQ0FBQyxJQUFFLENBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFBLEdBQUUsQ0FBQyxJQUFFLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQSxHQUFFLENBQUMsR0FBRyxDQUFDLENBQUEsQUFBQyxHQUFHLENBQUMsQ0FBQSxBQUFDLEdBQUcsQ0FBQyxDQUFDO0VBQzdDO0FBQ0QsVUFBUyxFQUFFLG1CQUFTLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7QUFDbEMsTUFBRyxDQUFDLElBQUksU0FBUyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUM7QUFDL0IsTUFBRyxDQUFDLENBQUMsSUFBRSxDQUFDLEdBQUMsQ0FBQyxDQUFBLEdBQUksQ0FBQztBQUFFLFVBQU8sQ0FBQyxHQUFDLENBQUMsSUFBRSxDQUFDLEdBQUMsQ0FBQyxJQUFFLENBQUMsQ0FBQyxDQUFDLElBQUcsS0FBSyxDQUFDLEdBQUUsQ0FBQyxDQUFBLEdBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQSxDQUFDLEFBQUMsR0FBRyxDQUFDLENBQUM7R0FBQSxBQUMvRCxPQUFPLENBQUMsR0FBQyxDQUFDLElBQUUsQ0FBQyxDQUFDLElBQUUsQ0FBQyxDQUFBLEdBQUUsQ0FBQyxJQUFFLENBQUMsQ0FBQyxDQUFDLElBQUcsS0FBSyxDQUFDLEdBQUUsQ0FBQyxDQUFBLEdBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQSxBQUFDLEdBQUcsQ0FBQyxDQUFBLEFBQUMsR0FBRyxDQUFDLENBQUM7RUFDdkQ7QUFDRCxTQUFRLEVBQUUsa0JBQVMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFO0FBQzlCLFNBQU8sQ0FBQyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7RUFDL0M7QUFDRCxVQUFTLEVBQUUsbUJBQVMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFO0FBQy9CLE1BQUcsQ0FBQyxDQUFDLElBQUUsQ0FBQyxDQUFBLEdBQUksQ0FBQyxHQUFDLElBQUksQUFBQyxFQUFFO0FBQ3BCLFVBQU8sQ0FBQyxJQUFFLE1BQU0sR0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFBLEFBQUMsR0FBRyxDQUFDLENBQUM7R0FDMUIsTUFBTSxJQUFHLENBQUMsR0FBRyxDQUFDLEdBQUMsSUFBSSxBQUFDLEVBQUU7QUFDdEIsVUFBTyxDQUFDLElBQUUsTUFBTSxJQUFFLENBQUMsSUFBRyxHQUFHLEdBQUMsSUFBSSxDQUFDLEFBQUMsR0FBQyxDQUFDLEdBQUcsSUFBRyxDQUFBLEFBQUMsR0FBRyxDQUFDLENBQUM7R0FDOUMsTUFBTSxJQUFHLENBQUMsR0FBRyxHQUFHLEdBQUMsSUFBSSxBQUFDLEVBQUU7QUFDeEIsVUFBTyxDQUFDLElBQUUsTUFBTSxJQUFFLENBQUMsSUFBRyxJQUFJLEdBQUMsSUFBSSxDQUFDLEFBQUMsR0FBQyxDQUFDLEdBQUcsTUFBSyxDQUFBLEFBQUMsR0FBRyxDQUFDLENBQUM7R0FDakQsTUFBTTtBQUNOLFVBQU8sQ0FBQyxJQUFFLE1BQU0sSUFBRSxDQUFDLElBQUcsS0FBSyxHQUFDLElBQUksQ0FBQyxBQUFDLEdBQUMsQ0FBQyxHQUFHLFFBQU8sQ0FBQSxBQUFDLEdBQUcsQ0FBQyxDQUFDO0dBQ3BEO0VBQ0Q7QUFDRCxZQUFXLEVBQUUscUJBQVMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFO0FBQ2pDLE1BQUcsQ0FBQyxHQUFHLENBQUMsR0FBQyxDQUFDO0FBQUUsVUFBTyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxHQUFFLEdBQUcsQ0FBQyxDQUFDO0dBQUEsQUFDeEQsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsR0FBRSxHQUFHLENBQUMsR0FBQyxHQUFFLEdBQUcsQ0FBQyxDQUFDO0VBQ3REO0FBQ0QsUUFBTyxFQUFFLGlCQUFTLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRTtBQUM3QixNQUFJLEVBQUUsR0FBRyxDQUFDLENBQUMsSUFBRSxDQUFDLENBQUEsR0FBRSxDQUFDLENBQUM7QUFDbEIsTUFBSSxFQUFFLEdBQUcsRUFBRSxHQUFDLENBQUMsQ0FBQztBQUNkLFNBQU8sQ0FBQyxHQUFHLENBQUMsSUFBRSxJQUFJLEdBQUMsRUFBRSxHQUFDLEVBQUUsR0FBRyxDQUFDLE1BQU0sR0FBQyxFQUFFLEdBQUMsRUFBRSxHQUFHLE1BQU0sR0FBQyxFQUFFLEdBQUcsQ0FBQyxNQUFNLEdBQUMsRUFBRSxHQUFHLE1BQU0sR0FBQyxDQUFDLENBQUEsQUFBQyxDQUFDO0VBQzlFO0NBQ0QsQ0FBQzs7QUFFRixTQUFTLFFBQVEsR0FBRztBQUNuQixLQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRTs7QUFFbEIsU0FBTztFQUNQOztBQUVELEtBQUksR0FBRyxHQUFHLElBQUksRUFBRSxDQUFDO0FBQ2pCLEtBQUksUUFBUSxHQUFHLEVBQUU7S0FBRSxLQUFLO0tBQUUsR0FBRyxDQUFDOzs7Ozs7QUFNOUIsTUFBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDdEMsT0FBSyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQzs7QUFFakIsTUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUU7QUFDckIsWUFBUztHQUNUOztBQUVELEtBQUcsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDOztBQUVwQixNQUFJLEtBQUssQ0FBQyxTQUFTLEdBQUcsR0FBRyxFQUFFO0FBQzFCLFdBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDckIsWUFBUztHQUNUOztBQUVELE1BQUksS0FBSyxDQUFDLFFBQVEsRUFBRTs7QUFFbkIsTUFBRyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDbkIsV0FBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztHQUNyQixNQUFNLElBQUksS0FBSyxDQUFDLEdBQUcsS0FBSyxDQUFDLElBQUksS0FBSyxDQUFDLE9BQU8sSUFBSSxHQUFHLEVBQUU7QUFDbkQsUUFBSyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUM7O0FBRWQsTUFBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDckMsUUFBSyxDQUFDLElBQUksRUFBRSxDQUFDO0dBQ2IsTUFBTTtBQUNOLFFBQUssQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEdBQUcsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxF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dGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImltcG9ydCB7ZXh0ZW5kLCBtYWtlUG9zfSBmcm9tICcuL3V0aWxzJztcblxudmFyIGFjdGlvbnMgPSB7XG5cdC8qKlxuXHQgKiBUeXBlLWluIHBhc3NlZCB0ZXh0IGludG8gY3VycmVudCBlZGl0b3IgY2hhci1ieS1jaGFyXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIEN1cnJlbnQgb3B0aW9uc1xuXHQgKiBAcGFyYW0ge0NvZGVNaXJyb3J9IGVkaXRvciBFZGl0b3IgaW5zdGFuY2Ugd2hlcmUgYWN0aW9uIHNob3VsZCBiZSBcblx0ICogcGVyZm9ybWVkXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb259IG5leHQgRnVuY3Rpb24gdG8gY2FsbCB3aGVuIGFjdGlvbiBwZXJmb3JtYW5jZVxuXHQgKiBpcyBjb21wbGV0ZWRcblx0ICogQHBhcmFtIHtGdW5jdGlvbn0gdGltZXIgRnVuY3Rpb24gdGhhdCBjcmVhdGVzIHRpbWVyIGZvciBkZWxheWVkIFxuXHQgKiBleGVjdXRpb24uIFRoaXMgdGltZXIgd2lsbCBhdXRvbWF0aWNhbGx5IGRlbGF5IGV4ZWN1dGlvbiB3aGVuXG5cdCAqIHNjZW5hcmlvIGlzIHBhdXNlZCBhbmQgcmV2ZXJ0IHdoZW4gcGxheWVkIGFnYWluIFxuXHQgKi9cblx0dHlwZTogZnVuY3Rpb24ob3B0aW9ucywgZWRpdG9yLCBuZXh0LCB0aW1lcikge1xuXHRcdG9wdGlvbnMgPSBleHRlbmQoe1xuXHRcdFx0dGV4dDogJycsICAvLyB0ZXh0IHRvIHR5cGVcblx0XHRcdGRlbGF5OiA2MCwgLy8gZGVsYXkgYmV0d2VlbiBjaGFyYWN0ZXIgdHlwaW5nXG5cdFx0XHRwb3M6IG51bGwgIC8vIGluaXRpYWwgcG9zaXRpb24gd2hlcmUgdG8gc3RhcnQgdHlwaW5nXG5cdFx0fSwgd3JhcCgndGV4dCcsIG9wdGlvbnMpKTtcblx0XHRcblx0XHRpZiAoIW9wdGlvbnMudGV4dCkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdObyB0ZXh0IHByb3ZpZGVkIGZvciBcInR5cGVcIiBhY3Rpb24nKTtcblx0XHR9XG5cdFx0XG5cdFx0aWYgKG9wdGlvbnMucG9zICE9PSBudWxsKSB7XG5cdFx0XHRlZGl0b3Iuc2V0Q3Vyc29yKG1ha2VQb3Mob3B0aW9ucy5wb3MsIGVkaXRvcikpO1xuXHRcdH1cblx0XHRcblx0XHR2YXIgY2hhcnMgPSBvcHRpb25zLnRleHQuc3BsaXQoJycpO1xuXHRcdFxuXHRcdHRpbWVyKGZ1bmN0aW9uIHBlcmZvcm0oKSB7XG5cdFx0XHR2YXIgY2ggPSBjaGFycy5zaGlmdCgpO1xuXHRcdFx0ZWRpdG9yLnJlcGxhY2VTZWxlY3Rpb24oY2gsICdlbmQnKTtcblx0XHRcdGlmIChjaGFycy5sZW5ndGgpIHtcblx0XHRcdFx0dGltZXIocGVyZm9ybSwgb3B0aW9ucy5kZWxheSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRuZXh0KCk7XG5cdFx0XHR9XG5cdFx0fSwgb3B0aW9ucy5kZWxheSk7XG5cdH0sXG5cdFxuXHQvKipcblx0ICogV2FpdCBmb3IgYSBzcGVjaWZpZWQgdGltZW91dFxuXHQgKiBAcGFyYW0gb3B0aW9uc1xuXHQgKiBAcGFyYW0gZWRpdG9yXG5cdCAqIEBwYXJhbSBuZXh0XG5cdCAqIEBwYXJhbSB0aW1lclxuXHQgKi9cblx0d2FpdDogZnVuY3Rpb24ob3B0aW9ucywgZWRpdG9yLCBuZXh0LCB0aW1lcikge1xuXHRcdG9wdGlvbnMgPSBleHRlbmQoe1xuXHRcdFx0dGltZW91dDogMTAwXG5cdFx0fSwgd3JhcCgndGltZW91dCcsIG9wdGlvbnMpKTtcblx0XHRcblx0XHR0aW1lcihuZXh0LCBwYXJzZUludChvcHRpb25zLnRpbWVvdXQsIDEwKSk7XG5cdH0sXG5cdFxuXHQvKipcblx0ICogTW92ZSBjYXJldCB0byBhIHNwZWNpZmllZCBwb3NpdGlvblxuXHQgKi9cblx0bW92ZVRvOiBmdW5jdGlvbihvcHRpb25zLCBlZGl0b3IsIG5leHQsIHRpbWVyKSB7XG5cdFx0b3B0aW9ucyA9IGV4dGVuZCh7XG5cdFx0XHRkZWxheTogODAsXG5cdFx0XHRpbW1lZGlhdGU6IGZhbHNlIC8vIFRPRE86IHJlbW92ZSwgdXNlIGRlbGF5OiAwIGluc3RlYWRcblx0XHR9LCB3cmFwKCdwb3MnLCBvcHRpb25zKSk7XG5cdFx0XG5cdFx0aWYgKHR5cGVvZiBvcHRpb25zLnBvcyA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcignTm8gcG9zaXRpb24gc3BlY2lmaWVkIGZvciBcIm1vdmVUb1wiIGFjdGlvbicpO1xuXHRcdH1cblx0XHRcblx0XHR2YXIgY3VyUG9zID0gZWRpdG9yLmdldEN1cnNvcih0cnVlKTtcblx0XHQvLyByZXNldCBzZWxlY3Rpb24sIGlmIGV4aXN0c1xuXHRcdGVkaXRvci5zZXRTZWxlY3Rpb24oY3VyUG9zLCBjdXJQb3MpO1xuXHRcdHZhciB0YXJnZXRQb3MgPSBtYWtlUG9zKG9wdGlvbnMucG9zLCBlZGl0b3IpO1xuXHRcdFxuXHRcdGlmIChvcHRpb25zLmltbWVkaWF0ZSB8fCAhb3B0aW9ucy5kZWxheSkge1xuXHRcdFx0ZWRpdG9yLnNldEN1cnNvcih0YXJnZXRQb3MpO1xuXHRcdFx0bmV4dCgpO1xuXHRcdH1cblx0XHRcblx0XHR2YXIgZGVsdGFMaW5lID0gdGFyZ2V0UG9zLmxpbmUgLSBjdXJQb3MubGluZTtcblx0XHR2YXIgZGVsdGFDaGFyID0gdGFyZ2V0UG9zLmNoIC0gY3VyUG9zLmNoO1xuXHRcdHZhciBzdGVwcyA9IE1hdGgubWF4KGRlbHRhQ2hhciwgZGVsdGFMaW5lKTtcblx0XHQvLyB2YXIgc3RlcExpbmUgPSBkZWx0YUxpbmUgLyBzdGVwcztcblx0XHQvLyB2YXIgc3RlcENoYXIgPSBkZWx0YUNoYXIgLyBzdGVwcztcblx0XHR2YXIgc3RlcExpbmUgPSBkZWx0YUxpbmUgPCAwID8gLTEgOiAxO1xuXHRcdHZhciBzdGVwQ2hhciA9IGRlbHRhQ2hhciA8IDAgPyAtMSA6IDE7XG5cblx0XHR0aW1lcihmdW5jdGlvbiBwZXJmb3JtKCkge1xuXHRcdFx0Y3VyUG9zID0gZWRpdG9yLmdldEN1cnNvcih0cnVlKTtcblx0XHRcdGlmIChzdGVwcyA+IDAgJiYgIShjdXJQb3MubGluZSA9PSB0YXJnZXRQb3MubGluZSAmJiBjdXJQb3MuY2ggPT0gdGFyZ2V0UG9zLmNoKSkge1xuXG5cdFx0XHRcdGlmIChjdXJQb3MubGluZSAhPSB0YXJnZXRQb3MubGluZSkge1xuXHRcdFx0XHRcdGN1clBvcy5saW5lICs9IHN0ZXBMaW5lO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKGN1clBvcy5jaCAhPSB0YXJnZXRQb3MuY2gpIHtcblx0XHRcdFx0XHRjdXJQb3MuY2ggKz0gc3RlcENoYXI7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRlZGl0b3Iuc2V0Q3Vyc29yKGN1clBvcyk7XG5cdFx0XHRcdHN0ZXBzLS07XG5cdFx0XHRcdHRpbWVyKHBlcmZvcm0sIG9wdGlvbnMuZGVsYXkpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0ZWRpdG9yLnNldEN1cnNvcih0YXJnZXRQb3MpO1xuXHRcdFx0XHRuZXh0KCk7XG5cdFx0XHR9XG5cdFx0fSwgb3B0aW9ucy5kZWxheSk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIFNpbWlsYXIgdG8gXCJtb3ZlVG9cIiBmdW5jdGlvbiBidXQgd2l0aCBpbW1lZGlhdGUgY3Vyc29yIHBvc2l0aW9uIHVwZGF0ZVxuXHQgKi9cblx0anVtcFRvOiBmdW5jdGlvbihvcHRpb25zLCBlZGl0b3IsIG5leHQsIHRpbWVyKSB7XG5cdFx0b3B0aW9ucyA9IGV4dGVuZCh7XG5cdFx0XHRhZnRlckRlbGF5OiAyMDBcblx0XHR9LCB3cmFwKCdwb3MnLCBvcHRpb25zKSk7XG5cblx0XHRpZiAodHlwZW9mIG9wdGlvbnMucG9zID09PSAndW5kZWZpbmVkJykge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdObyBwb3NpdGlvbiBzcGVjaWZpZWQgZm9yIFwianVtcFRvXCIgYWN0aW9uJyk7XG5cdFx0fVxuXHRcdFxuXHRcdGVkaXRvci5zZXRDdXJzb3IobWFrZVBvcyhvcHRpb25zLnBvcywgZWRpdG9yKSk7XG5cdFx0dGltZXIobmV4dCwgb3B0aW9ucy5hZnRlckRlbGF5KTtcblx0fSxcblx0XG5cdC8qKlxuXHQgKiBFeGVjdXRlcyBwcmVkZWZpbmVkIENvZGVNaXJyb3IgY29tbWFuZFxuXHQgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuXHQgKiBAcGFyYW0ge0NvZGVNaXJyb3J9IGVkaXRvclxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9ufSBuZXh0XG5cdCAqIEBwYXJhbSB7RnVuY3Rpb259IHRpbWVyXG5cdCAqL1xuXHRydW46IGZ1bmN0aW9uKG9wdGlvbnMsIGVkaXRvciwgbmV4dCwgdGltZXIpIHtcblx0XHRvcHRpb25zID0gZXh0ZW5kKHtcblx0XHRcdGJlZm9yZURlbGF5OiA1MDAsXG5cdFx0XHR0aW1lczogMVxuXHRcdH0sIHdyYXAoJ2NvbW1hbmQnLCBvcHRpb25zKSk7XG5cdFx0XG5cdFx0dmFyIHRpbWVzID0gb3B0aW9ucy50aW1lcztcblx0XHR0aW1lcihmdW5jdGlvbiBwZXJmb3JtKCkge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0aWYgKHR5cGVvZiBvcHRpb25zLmNvbW1hbmQgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0XHRvcHRpb25zLmNvbW1hbmQoZWRpdG9yLCBvcHRpb25zKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRlZGl0b3IuZXhlY0NvbW1hbmQob3B0aW9ucy5jb21tYW5kKTtcdFxuXHRcdFx0XHR9XG5cdFx0XHR9IGNhdGNoIChlKSB7fVxuXHRcdFx0aWYgKC0tdGltZXMgPiAwKSB7XG5cdFx0XHRcdHRpbWVyKHBlcmZvcm0sIG9wdGlvbnMuYmVmb3JlRGVsYXkpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0bmV4dCgpO1xuXHRcdFx0fVxuXHRcdH0sIG9wdGlvbnMuYmVmb3JlRGVsYXkpO1xuXHR9LFxuXHRcblx0LyoqXG5cdCAqIENyZWF0ZXMgc2VsZWN0aW9uIGZvciBzcGVjaWZpZWQgcG9zaXRpb25cblx0ICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcblx0ICogQHBhcmFtIHtDb2RlTWlycm9yfSBlZGl0b3Jcblx0ICogQHBhcmFtIHtGdW5jdGlvbn0gbmV4dFxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9ufSB0aW1lclxuXHQgKi9cblx0c2VsZWN0OiBmdW5jdGlvbihvcHRpb25zLCBlZGl0b3IsIG5leHQsIHRpbWVyKSB7XG5cdFx0b3B0aW9ucyA9IGV4dGVuZCh7XG5cdFx0XHRmcm9tOiAnY2FyZXQnXG5cdFx0fSwgd3JhcCgndG8nLCBvcHRpb25zKSk7XG5cdFx0XG5cdFx0dmFyIGZyb20gPSBtYWtlUG9zKG9wdGlvbnMuZnJvbSwgZWRpdG9yKTtcblx0XHR2YXIgdG8gPSBtYWtlUG9zKG9wdGlvbnMudG8sIGVkaXRvcik7XG5cdFx0ZWRpdG9yLnNldFNlbGVjdGlvbihmcm9tLCB0byk7XG5cdFx0bmV4dCgpO1xuXHR9XG59O1xuXG5mdW5jdGlvbiB3cmFwKGtleSwgdmFsdWUpIHtcblx0cmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgPyB2YWx1ZSA6IHtba2V5XTogdmFsdWV9O1xufVxuXG5leHBvcnQgZGVmYXVsdCBhY3Rpb25zOyIsIlwidXNlIHN0cmljdFwiO1xuXG5pbXBvcnQge3RvQXJyYXl9IGZyb20gJy4vdXRpbHMnO1xuXG52YXIgdzNjQ1NTID0gZG9jdW1lbnQuZGVmYXVsdFZpZXcgJiYgZG9jdW1lbnQuZGVmYXVsdFZpZXcuZ2V0Q29tcHV0ZWRTdHlsZTtcblxuZXhwb3J0IGZ1bmN0aW9uIHZpZXdwb3J0UmVjdCgpIHtcblx0dmFyIGJvZHkgPSBkb2N1bWVudC5ib2R5O1xuXHR2YXIgZG9jRWxlbSA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcblx0dmFyIGNsaWVudFRvcCA9IGRvY0VsZW0uY2xpZW50VG9wICB8fCBib2R5LmNsaWVudFRvcCAgfHwgMDtcblx0dmFyIGNsaWVudExlZnQgPSBkb2NFbGVtLmNsaWVudExlZnQgfHwgYm9keS5jbGllbnRMZWZ0IHx8IDA7XG5cdHZhciBzY3JvbGxUb3AgID0gd2luZG93LnBhZ2VZT2Zmc2V0IHx8IGRvY0VsZW0uc2Nyb2xsVG9wICB8fCBib2R5LnNjcm9sbFRvcDtcblx0dmFyIHNjcm9sbExlZnQgPSB3aW5kb3cucGFnZVhPZmZzZXQgfHwgZG9jRWxlbS5zY3JvbGxMZWZ0IHx8IGJvZHkuc2Nyb2xsTGVmdDtcblx0XG5cdHJldHVybiB7XG5cdFx0dG9wOiBzY3JvbGxUb3AgIC0gY2xpZW50VG9wLFxuXHRcdGxlZnQ6IHNjcm9sbExlZnQgLSBjbGllbnRMZWZ0LFxuXHRcdHdpZHRoOiBib2R5LmNsaWVudFdpZHRoIHx8IGRvY0VsZW0uY2xpZW50V2lkdGgsXG5cdFx0aGVpZ2h0OiBib2R5LmNsaWVudEhlaWdodCB8fCBkb2NFbGVtLmNsaWVudEhlaWdodFxuXHR9O1xufVxuXG4vKipcbiAqIFJlbW92ZXMgZWxlbWVudCBmcm9tIHBhcmVudFxuICogQHBhcmFtIHtFbGVtZW50fSBlbGVtXG4gKiBAcmV0dXJucyB7RWxlbWVudH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbW92ZShlbGVtKSB7XG5cdGFyKGVsZW0pLmZvckVhY2goZWwgPT4gZWwucGFyZW50Tm9kZSAmJiBlbC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGVsKSk7XG5cdHJldHVybiBlbGVtO1xufVxuXG4vKipcbiAqIFJlbmRlcnMgc3RyaW5nIGludG8gRE9NIGVsZW1lbnRcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAqIEByZXR1cm5zIHtFbGVtZW50fVxuICovXG5leHBvcnQgZnVuY3Rpb24gdG9ET00oc3RyKSB7XG5cdHZhciBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblx0ZGl2LmlubmVySFRNTCA9IHN0cjtcblx0cmV0dXJuIGRpdi5maXJzdENoaWxkO1xufVxuXG4vKipcbiAqIFNldHMgb3IgcmV0cmlldmVzIENTUyBwcm9wZXJ0eSB2YWx1ZVxuICogQHBhcmFtIHtFbGVtZW50fSBlbGVtXG4gKiBAcGFyYW0ge1N0cmluZ30gcHJvcFxuICogQHBhcmFtIHtTdHJpbmd9IHZhbFxuICovXG5leHBvcnQgZnVuY3Rpb24gY3NzKGVsZW0sIHByb3AsIHZhbCkge1xuXHRpZiAodHlwZW9mIHByb3AgPT09ICdzdHJpbmcnICYmIHZhbCA9PSBudWxsKSB7XG5cdFx0cmV0dXJuIGdldENTUyhlbGVtLCBwcm9wKTtcblx0fVxuXHRcblx0aWYgKHR5cGVvZiBwcm9wID09PSAnc3RyaW5nJykge1xuXHRcdHZhciBvYmogPSB7fTtcblx0XHRvYmpbcHJvcF0gPSB2YWw7XG5cdFx0cHJvcCA9IG9iajtcblx0fVxuXHRcblx0c2V0Q1NTKGVsZW0sIHByb3ApO1xufVxuXG5mdW5jdGlvbiBhcihvYmopIHtcblx0aWYgKG9iai5sZW5ndGggPT09ICtvYmoubGVuZ3RoKSB7XG5cdFx0cmV0dXJuIHRvQXJyYXkob2JqKTtcblx0fVxuXHRcblx0cmV0dXJuIEFycmF5LmlzQXJyYXkob2JqKSA/IG9iaiA6IFtvYmpdO1xufVxuXG5mdW5jdGlvbiB0b0NhbWVsQ2FzZShuYW1lKSB7XG5cdHJldHVybiBuYW1lLnJlcGxhY2UoL1xcLShcXHcpL2csIGZ1bmN0aW9uKHN0ciwgcDEpIHtcblx0XHRyZXR1cm4gcDEudG9VcHBlckNhc2UoKTtcblx0fSk7XG59XG5cbi8qKlxuICogUmV0dXJucyBDU1MgcHJvcGVydHkgdmFsdWUgb2YgZ2l2ZW4gZWxlbWVudC5cbiAqIEBhdXRob3IgalF1ZXJ5IFRlYW1cbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxlbVxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgQ1NTIHByb3BlcnR5IHZhbHVlXG4gKi9cbmZ1bmN0aW9uIGdldENTUyhlbGVtLCBuYW1lKSB7XG5cdHZhciBybnVtcHggPSAvXi0/XFxkKyg/OnB4KT8kL2ksXG5cdFx0cm51bSA9IC9eLT9cXGQoPzpcXC5cXGQrKT8vLFxuXHRcdHJzdWYgPSAvXFxkJC87XG5cdFxuXHR2YXIgbmFtZUNhbWVsID0gdG9DYW1lbENhc2UobmFtZSk7XG5cdC8vIElmIHRoZSBwcm9wZXJ0eSBleGlzdHMgaW4gc3R5bGVbXSwgdGhlbiBpdCdzIGJlZW4gc2V0XG5cdC8vIHJlY2VudGx5IChhbmQgaXMgY3VycmVudClcblx0aWYgKGVsZW0uc3R5bGVbbmFtZUNhbWVsXSkge1xuXHRcdHJldHVybiBlbGVtLnN0eWxlW25hbWVDYW1lbF07XG5cdH0gXG5cdFx0XG5cdGlmICh3M2NDU1MpIHtcblx0XHR2YXIgY3MgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShlbGVtLCAnJyk7XG5cdFx0cmV0dXJuIGNzLmdldFByb3BlcnR5VmFsdWUobmFtZSk7XG5cdH1cblx0XG5cdGlmIChlbGVtLmN1cnJlbnRTdHlsZSkge1xuXHRcdHZhciByZXQgPSBlbGVtLmN1cnJlbnRTdHlsZVtuYW1lXSB8fCBlbGVtLmN1cnJlbnRTdHlsZVtuYW1lQ2FtZWxdO1xuXHRcdHZhciBzdHlsZSA9IGVsZW0uc3R5bGUgfHwgZWxlbTtcblx0XHRcblx0XHQvLyBGcm9tIHRoZSBhd2Vzb21lIGhhY2sgYnkgRGVhbiBFZHdhcmRzXG5cdFx0Ly8gaHR0cDovL2VyaWsuZWFlLm5ldC9hcmNoaXZlcy8yMDA3LzA3LzI3LzE4LjU0LjE1LyNjb21tZW50LTEwMjI5MVxuXHRcdFxuXHRcdC8vIElmIHdlJ3JlIG5vdCBkZWFsaW5nIHdpdGggYSByZWd1bGFyIHBpeGVsIG51bWJlclxuXHRcdC8vIGJ1dCBhIG51bWJlciB0aGF0IGhhcyBhIHdlaXJkIGVuZGluZywgd2UgbmVlZCB0byBjb252ZXJ0IGl0IHRvIHBpeGVsc1xuXHRcdGlmICghcm51bXB4LnRlc3QocmV0KSAmJiBybnVtLnRlc3QocmV0KSkge1xuXHRcdFx0Ly8gUmVtZW1iZXIgdGhlIG9yaWdpbmFsIHZhbHVlc1xuXHRcdFx0dmFyIGxlZnQgPSBzdHlsZS5sZWZ0LCByc0xlZnQgPSBlbGVtLnJ1bnRpbWVTdHlsZS5sZWZ0O1xuXHRcdFx0XG5cdFx0XHQvLyBQdXQgaW4gdGhlIG5ldyB2YWx1ZXMgdG8gZ2V0IGEgY29tcHV0ZWQgdmFsdWUgb3V0XG5cdFx0XHRlbGVtLnJ1bnRpbWVTdHlsZS5sZWZ0ID0gZWxlbS5jdXJyZW50U3R5bGUubGVmdDtcblx0XHRcdHZhciBzdWZmaXggPSByc3VmLnRlc3QocmV0KSA/ICdlbScgOiAnJztcblx0XHRcdHN0eWxlLmxlZnQgPSBuYW1lQ2FtZWwgPT09ICdmb250U2l6ZScgPyAnMWVtJyA6IChyZXQgKyBzdWZmaXggfHwgMCk7XG5cdFx0XHRyZXQgPSBzdHlsZS5waXhlbExlZnQgKyAncHgnO1xuXHRcdFx0XG5cdFx0XHQvLyBSZXZlcnQgdGhlIGNoYW5nZWQgdmFsdWVzXG5cdFx0XHRzdHlsZS5sZWZ0ID0gbGVmdDtcblx0XHRcdGVsZW0ucnVudGltZVN0eWxlLmxlZnQgPSByc0xlZnQ7XG5cdFx0fVxuXHRcdFxuXHRcdHJldHVybiByZXQ7XG5cdH1cbn1cblxuLyoqXG4gKiBTZXRzIENTUyBwcm9wZXJ0aWVzIHRvIGdpdmVuIGVsZW1lbnRcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxlbVxuICogQHBhcmFtIHtPYmplY3R9IHBhcmFtcyBDU1MgcHJvcGVydGllcyB0byBzZXRcbiAqL1xuZnVuY3Rpb24gc2V0Q1NTKGVsZW0sIHBhcmFtcykge1xuXHRpZiAoIWVsZW0pIHtcblx0XHRyZXR1cm47XG5cdH1cblxuXHR2YXIgbnVtUHJvcHMgPSB7J2xpbmUtaGVpZ2h0JzogMSwgJ3otaW5kZXgnOiAxLCBvcGFjaXR5OiAxfTtcblx0dmFyIHByb3BzID0gT2JqZWN0LmtleXMocGFyYW1zKS5tYXAoayA9PiB7XG5cdFx0dmFyIHYgPSBwYXJhbXNba107XG5cdFx0dmFyIG5hbWUgPSBrLnJlcGxhY2UoLyhbQS1aXSkvZywgJy0kMScpLnRvTG93ZXJDYXNlKCk7XG5cdFx0cmV0dXJuIG5hbWUgKyAnOicgKyAoKHR5cGVvZiB2ID09PSAnbnVtYmVyJyAmJiAhKG5hbWUgaW4gbnVtUHJvcHMpKSA/IHYgKyAncHgnIDogdik7XG5cdH0pO1xuXG5cdGVsZW0uc3R5bGUuY3NzVGV4dCArPSAnOycgKyBwcm9wcy5qb2luKCc7Jyk7XG59IiwiLyoqXG4gKiBBIGhpZ2gtbGV2ZWwgbGlicmFyeSBpbnRlcmZhY2UgZm9yIGNyZWF0aW5nIHNjZW5hcmlvcyBvdmVyIHRleHRhcmVhXG4gKiBlbGVtZW50LiBUaGUgPGNvZGU+Q29kZU1pcnJvci5tb3ZpZTwvY29kZT4gdGFrZXMgcmVmZXJlbmNlIHRvIHRleHRhcmVhXG4gKiBlbGVtZW50IChvciBpdHMgSUQpIGFuZCBwYXJzZXMgaXRzIGNvbnRlbnQgZm9yIGluaXRpYWwgY29udGVudCB2YWx1ZSxcbiAqIHNjZW5hcmlvIGFuZCBvdXRsaW5lLlxuICovXG5cInVzZSBzdHJpY3RcIjtcblxuaW1wb3J0IHtwYXJzZUpTT04sIGV4dGVuZCwgdG9BcnJheX0gZnJvbSAnLi91dGlscyc7XG5pbXBvcnQgU2NlbmFyaW8gZnJvbSAnLi9zY2VuYXJpbyc7XG5pbXBvcnQgb3V0bGluZSBmcm9tICcuL3dpZGdldHMvb3V0bGluZSc7XG5cbnZhciBpb3MgPSAvQXBwbGVXZWJLaXQvLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkgJiYgL01vYmlsZVxcL1xcdysvLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCk7XG52YXIgbWFjID0gaW9zIHx8IC9NYWMvLnRlc3QobmF2aWdhdG9yLnBsYXRmb3JtKTtcblxudmFyIG1hY0NoYXJNYXAgPSB7XG5cdCdjdHJsJzogJ+KMgycsXG5cdCdjb250cm9sJzogJ+KMgycsXG5cdCdjbWQnOiAn4oyYJyxcblx0J3NoaWZ0JzogJ+KHpycsXG5cdCdhbHQnOiAn4oylJyxcblx0J2VudGVyJzogJ+KPjicsXG5cdCd0YWInOiAn4oelJyxcblx0J2xlZnQnOiAn4oaQJyxcblx0J3JpZ2h0JzogJ+KGkicsXG5cdCd1cCc6ICfihpEnLFxuXHQnZG93bic6ICfihpMnXG59O1xuXHRcbnZhciBwY0NoYXJNYXAgPSB7XG5cdCdjbWQnOiAnQ3RybCcsXG5cdCdjb250cm9sJzogJ0N0cmwnLFxuXHQnY3RybCc6ICdDdHJsJyxcblx0J2FsdCc6ICdBbHQnLFxuXHQnc2hpZnQnOiAnU2hpZnQnLFxuXHQnbGVmdCc6ICfihpAnLFxuXHQncmlnaHQnOiAn4oaSJyxcblx0J3VwJzogJ+KGkScsXG5cdCdkb3duJzogJ+KGkydcbn07XG5cbmV4cG9ydCB2YXIgZGVmYXVsdE9wdGlvbnMgPSB7XG5cdC8qKlxuXHQgKiBBdXRvbWF0aWNhbGx5IHBhcnNlIG1vdmllIGRlZmluaXRpb24gZnJvbSB0ZXh0YXJlYSBjb250ZW50LiBTZXR0aW5nXG5cdCAqIHRoaXMgcHJvcGVydHkgdG8gPGNvZGU+ZmFsc2U8L2NvZGU+IGFzc3VtZXMgdGhhdCB1c2VyIHdhbnRzIHRvXG5cdCAqIGV4cGxpY2l0bHkgcHJvdmlkZSBtb3ZpZSBkYXRhOiBpbml0aWFsIHZhbHVlLCBzY2VuYXJpbyBldGMuXG5cdCAqL1xuXHRwYXJzZTogdHJ1ZSxcblx0XG5cdC8qKlxuXHQgKiBTdHJpbmcgb3IgcmVnZXhwIHVzZWQgdG8gc2VwYXJhdGUgc2VjdGlvbnMgb2YgbW92aWUgZGVmaW5pdGlvbiwgZS5nLlxuXHQgKiBkZWZhdWx0IHZhbHVlLCBzY2VuYXJpbyBhbmQgZWRpdG9yIG9wdGlvbnNcblx0ICovXG5cdHNlY3Rpb25TZXBhcmF0b3I6ICdAQEAnLFxuXHRcblx0LyoqIFJlZ3VsYXIgZXhwcmVzc2lvbiB0byBleHRyYWN0IG91dGxpbmUgZnJvbSBzY2VuYXJpbyBsaW5lICovXG5cdG91dGxpbmVTZXBhcmF0b3I6IC9cXHMrOjo6XFxzKyguKykkLyxcblx0XG5cdC8qKiBBdXRvbWF0aWNhbGx5IHByZXR0aWZ5IGtleWJvYXJkIHNob3J0Y3V0cyBpbiBvdXRsaW5lICovXG5cdHByZXR0aWZ5S2V5czogdHJ1ZSxcblx0XG5cdC8qKiBTdHJpcCBwYXJlbnRoZXNlcyBmcm9tIHByZXR0eWZpZWQga2V5Ym9hcmQgc2hvcnRjdXQgZGVmaW5pdGlvbiAqL1xuXHRzdHJpcFBhcmVudGhlc2VzOiBmYWxzZVxufTtcblxuLyoqXG4gKiBIaWdoLWxldmVsIGZ1bmN0aW9uIHRvIGNyZWF0ZSBtb3ZpZSBpbnN0YW5jZSBvbiB0ZXh0YXJlYS5cbiAqIEBwYXJhbSB7RWxlbWVudH0gdGFyZ2V0IFJlZmVyZW5jZSB0byB0ZXh0YXJlYSwgZWl0aGVyIDxjb2RlPkVsZW1lbnQ8L2NvZGU+XG4gKiBvciBzdHJpbmcgSUQuIEl0IGNhbiBhbHNvIGFjY2VwdCBleGlzdGluZyBDb2RlTWlycm9yIG9iamVjdC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBtb3ZpZU9wdGlvbnMgTW92aWUgb3B0aW9ucy4gU2VlIDxjb2RlPmRlZmF1bHRPcHRpb25zPC9jb2RlPlxuICogZm9yIHZhbHVlIHJlZmVyZW5jZVxuICogQHBhcmFtIHtPYmplY3R9IGVkaXRvck9wdGlvbnMgQWRkaXRpb25hbCBvcHRpb25zIHBhc3NlZCB0byBDb2RlTWlycm9yXG4gKiBlZGl0b3IgaW5pdGlhbGl6ZXIuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIG1vdmllKHRhcmdldCwgbW92aWVPcHRpb25zPXt9LCBlZGl0b3JPcHRpb25zPXt9KSB7XG5cdHZhciBobExpbmUgPSBudWxsO1xuXG5cdGlmICh0eXBlb2YgdGFyZ2V0ID09PSAnc3RyaW5nJykge1xuXHRcdHRhcmdldCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHRhcmdldCk7XG5cdH1cblxuXHR2YXIgdGFyZ2V0SXNUZXh0YXJlYSA9IHRhcmdldC5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpID09PSAndGV4dGFyZWEnO1xuXHRcblx0bW92aWVPcHRpb25zID0gZXh0ZW5kKHt9LCBkZWZhdWx0T3B0aW9ucywgbW92aWVPcHRpb25zKTtcblx0ZWRpdG9yT3B0aW9ucyA9IGV4dGVuZCh7XG5cdFx0dGhlbWU6ICdlc3ByZXNzbycsXG5cdFx0bW9kZSA6ICd0ZXh0L2h0bWwnLFxuXHRcdGluZGVudFdpdGhUYWJzOiB0cnVlLFxuXHRcdHRhYlNpemU6IDQsXG5cdFx0bGluZU51bWJlcnMgOiB0cnVlLFxuXHRcdG9uQ3Vyc29yQWN0aXZpdHk6IGZ1bmN0aW9uKCkge1xuXHRcdFx0aWYgKGVkaXRvci5zZXRMaW5lQ2xhc3MpIHtcblx0XHRcdFx0ZWRpdG9yLnNldExpbmVDbGFzcyhobExpbmUsIG51bGwsIG51bGwpO1xuXHRcdFx0XHRobExpbmUgPSBlZGl0b3Iuc2V0TGluZUNsYXNzKGVkaXRvci5nZXRDdXJzb3IoKS5saW5lLCBudWxsLCAnYWN0aXZlbGluZScpO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0b25LZXlFdmVudDogZnVuY3Rpb24oZWQsIGV2dCkge1xuXHRcdFx0aWYgKGVkLmdldE9wdGlvbigncmVhZE9ubHknKSkge1xuXHRcdFx0XHRldnQuc3RvcCgpO1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblx0XHR9XG5cdH0sIGVkaXRvck9wdGlvbnMpO1xuXHRcblx0dmFyIGluaXRpYWxWYWx1ZSA9IGVkaXRvck9wdGlvbnMudmFsdWUgfHwgKHRhcmdldElzVGV4dGFyZWEgPyB0YXJnZXQudmFsdWUgOiB0YXJnZXQuZ2V0VmFsdWUoKSkgfHwgJyc7XG5cdFxuXHRpZiAodGFyZ2V0SXNUZXh0YXJlYSAmJiBtb3ZpZU9wdGlvbnMucGFyc2UpIHtcblx0XHRleHRlbmQobW92aWVPcHRpb25zLCBwYXJzZU1vdmllRGVmaW5pdGlvbihpbml0aWFsVmFsdWUsIG1vdmllT3B0aW9ucykpO1xuXHRcdGluaXRpYWxWYWx1ZSA9IG1vdmllT3B0aW9ucy52YWx1ZTtcblx0XHRpZiAobW92aWVPcHRpb25zLmVkaXRvck9wdGlvbnMpIHtcblx0XHRcdGV4dGVuZChlZGl0b3JPcHRpb25zLCBtb3ZpZU9wdGlvbnMuZWRpdG9yT3B0aW9ucyk7XG5cdFx0fVxuXG5cdFx0Ly8gcmVhZCBDTSBvcHRpb25zIGZyb20gZ2l2ZW4gdGV4dGFyZWFcblx0XHR2YXIgY21BdHRyID0gL15kYXRhXFwtY21cXC0oLispJC9pO1xuXHRcdHRvQXJyYXkodGFyZ2V0LmF0dHJpYnV0ZXMpLmZvckVhY2goZnVuY3Rpb24oYXR0cikge1xuXHRcdFx0dmFyIG0gPSBhdHRyLm5hbWUubWF0Y2goY21BdHRyKTtcblx0XHRcdGlmIChtKSB7XG5cdFx0XHRcdGVkaXRvck9wdGlvbnNbbVsxXV0gPSBhdHRyLnZhbHVlO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG5cdFxuXHQvLyBub3JtYWxpemUgbGluZSBlbmRpbmdzXG5cdGluaXRpYWxWYWx1ZSA9IGluaXRpYWxWYWx1ZS5yZXBsYWNlKC9cXHI/XFxuL2csICdcXG4nKTtcblx0XG5cdC8vIGxvY2F0ZSBpbml0aWFsIGNhcmV0IHBvc2l0aW9uIGZyb20gfCBzeW1ib2xcblx0dmFyIGluaXRpYWxQb3MgPSBpbml0aWFsVmFsdWUuaW5kZXhPZignfCcpO1xuXHRcblx0aWYgKHRhcmdldElzVGV4dGFyZWEpIHtcblx0XHR0YXJnZXQudmFsdWUgPSBlZGl0b3JPcHRpb25zLnZhbHVlID0gaW5pdGlhbFZhbHVlID0gaW5pdGlhbFZhbHVlLnJlcGxhY2UoL1xcfC9nLCAnJyk7XG5cdH1cblxuXHQvLyBjcmVhdGUgZWRpdG9yIGluc3RhbmNlIGlmIG5lZWRlZFxuXHR2YXIgZWRpdG9yID0gdGFyZ2V0SXNUZXh0YXJlYSA/IENvZGVNaXJyb3IuZnJvbVRleHRBcmVhKHRhcmdldCwgZWRpdG9yT3B0aW9ucykgOiB0YXJnZXQ7XG5cblx0aWYgKGVkaXRvci5zZXRMaW5lQ2xhc3MpIHtcblx0XHRobExpbmUgPSBlZGl0b3Iuc2V0TGluZUNsYXNzKDAsICdhY3RpdmVsaW5lJyk7XG5cdH1cblx0XG5cdGlmIChpbml0aWFsUG9zICE9IC0xKSB7XG5cdFx0ZWRpdG9yLnNldEN1cnNvcihlZGl0b3IucG9zRnJvbUluZGV4KGluaXRpYWxQb3MpKTtcblx0fVxuXHRcblx0Ly8gc2F2ZSBpbml0aWFsIGRhdGEgc28gd2UgY2FuIHJldmVydCB0byBpdCBsYXRlclxuXHRlZGl0b3IuX19pbml0aWFsID0ge1xuXHRcdGNvbnRlbnQ6IGluaXRpYWxWYWx1ZSxcblx0XHRwb3M6IGVkaXRvci5nZXRDdXJzb3IodHJ1ZSlcblx0fTtcblx0XG5cdHZhciB3cmFwcGVyID0gZWRpdG9yLmdldFdyYXBwZXJFbGVtZW50KCk7XG5cdFxuXHQvLyBhZGp1c3QgaGVpZ2h0LCBpZiByZXF1aXJlZFxuXHRpZiAoZWRpdG9yT3B0aW9ucy5oZWlnaHQpIHtcblx0XHR3cmFwcGVyLnN0eWxlLmhlaWdodCA9IGVkaXRvck9wdGlvbnMuaGVpZ2h0ICsgJ3B4Jztcblx0fVxuXHRcblx0d3JhcHBlci5jbGFzc05hbWUgKz0gJyBDb2RlTWlycm9yLW1vdmllJyArIChtb3ZpZU9wdGlvbnMub3V0bGluZSA/ICcgQ29kZU1pcnJvci1tb3ZpZV93aXRoLW91dGxpbmUnIDogJycpO1xuXHRcblx0dmFyIHNjID0gbmV3IFNjZW5hcmlvKG1vdmllT3B0aW9ucy5zY2VuYXJpbywgZWRpdG9yKTtcblx0aWYgKG1vdmllT3B0aW9ucy5vdXRsaW5lKSB7XG5cdFx0d3JhcHBlci5jbGFzc05hbWUgKz0gJyBDb2RlTWlycm9yLW1vdmllX3dpdGgtb3V0bGluZSc7XG5cdFx0d3JhcHBlci5hcHBlbmRDaGlsZChvdXRsaW5lKG1vdmllT3B0aW9ucy5vdXRsaW5lLCBzYykpO1xuXHR9XG5cdHJldHVybiBzYztcbn07XG5cbi8qKlxuICogUHJldHR5ZmllcyBrZXkgYmluZGluZ3MgcmVmZXJlbmNlcyBpbiBnaXZlbiBzdHJpbmc6IGZvcm1hdHMgaXQgYWNjb3JkaW5nXG4gKiB0byBjdXJyZW50IHVzZXLigJlzIHBsYXRmb3JtLiBUaGUga2V5IGJpbmRpbmcgc2hvdWxkIGJlIGRlZmluZWQgaW5zaWRlIFxuICogcGFyZW50aGVzZXMsIGUuZy4gPGNvZGU+KGN0cmwtYWx0LXVwKTwvY29kZT5cbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIFRyYW5zZm9ybSBvcHRpb25zXG4gKiBAcmV0dXJucyB7U3RyaW5nfVxuICovXG5mdW5jdGlvbiBwcmV0dGlmeUtleUJpbmRpbmdzKHN0ciwgb3B0aW9ucykge1xuXHRvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblx0dmFyIHJlS2V5ID0gL2N0cmx8YWx0fHNoaWZ0fGNtZC9pO1xuXHR2YXIgbWFwID0gbWFjID8gbWFjQ2hhck1hcCA6IHBjQ2hhck1hcDtcblx0cmV0dXJuIHN0ci5yZXBsYWNlKC9cXCgoLis/KVxcKS9nLCBmdW5jdGlvbihtLCBrYikge1xuXHRcdGlmIChyZUtleS50ZXN0KGtiKSkge1xuXHRcdFx0dmFyIHBhcnRzID0ga2IudG9Mb3dlckNhc2UoKVxuXHRcdFx0XHQuc3BsaXQoL1tcXC1cXCtdLylcblx0XHRcdFx0Lm1hcChrZXkgPT4gbWFwW2tleS50b0xvd2VyQ2FzZSgpXSB8fCBrZXkudG9VcHBlckNhc2UoKSk7XG5cdFx0XHRcblx0XHRcdG0gPSBwYXJ0cy5qb2luKG1hYyA/ICcnIDogJysnKTtcblx0XHRcdGlmICghb3B0aW9ucy5zdHJpcFBhcmVudGhlc2VzKSB7XG5cdFx0XHRcdG0gPSAnKCcgKyBtICsgJyknO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRcblx0XHRyZXR1cm4gbTtcblx0fSk7XG59XG5cbmZ1bmN0aW9uIHJlYWRMaW5lcyh0ZXh0KSB7XG5cdC8vIElFIGZhaWxzIHRvIHNwbGl0IHN0cmluZyBieSByZWdleHAsIFxuXHQvLyBuZWVkIHRvIG5vcm1hbGl6ZSBuZXdsaW5lcyBmaXJzdFxuXHR2YXIgbmwgPSAnXFxuJztcblx0dmFyIGxpbmVzID0gKHRleHQgfHwgJycpXG5cdFx0LnJlcGxhY2UoL1xcclxcbi9nLCBubClcblx0XHQucmVwbGFjZSgvXFxuXFxyL2csIG5sKVxuXHRcdC5yZXBsYWNlKC9cXHIvZywgbmwpXG5cdFx0LnNwbGl0KG5sKTtcblxuXHRyZXR1cm4gbGluZXMuZmlsdGVyKEJvb2xlYW4pO1xufVxuXG5mdW5jdGlvbiB1bmVzY2FwZSh0ZXh0KSB7XG5cdHZhciByZXBsYWNlbWVudHMgPSB7XG5cdFx0JyZsdDsnOiAgJzwnLFxuXHRcdCcmZ3Q7JzogICc+Jyxcblx0XHQnJmFtcDsnOiAnJidcblx0fTtcblxuXHRyZXR1cm4gdGV4dC5yZXBsYWNlKC8mKGx0fGd0fGFtcCk7L2csIGZ1bmN0aW9uKHN0ciwgcDEpIHtcblx0XHRyZXR1cm4gcmVwbGFjZW1lbnRzW3N0cl0gfHwgc3RyO1xuXHR9KTtcbn1cblxuLyoqXG4gKiBFeHRyYWN0cyBpbml0aWFsIGNvbnRlbnQsIHNjZW5hcmlvIGFuZCBvdXRsaW5lIGZyb20gZ2l2ZW4gc3RyaW5nXG4gKiBAcGFyYW0ge1N0cmluZ30gdGV4dFxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqL1xuZnVuY3Rpb24gcGFyc2VNb3ZpZURlZmluaXRpb24odGV4dCwgb3B0aW9ucz17fSkge1xuXHRvcHRpb25zID0gZXh0ZW5kKHt9LCBkZWZhdWx0T3B0aW9ucywgb3B0aW9ucyB8fCB7fSk7XG5cdHZhciBwYXJ0cyA9IHRleHQuc3BsaXQob3B0aW9ucy5zZWN0aW9uU2VwYXJhdG9yKTtcblxuXHQvLyBwYXJzZSBzY2VuYXJpb1xuXHR2YXIgcmVEZWYgPSAvXihcXHcrKVxccyo6XFxzKiguKykkLztcblx0dmFyIHNjZW5hcmlvID0gW107XG5cdHZhciBvdXRsaW5lID0ge307XG5cdHZhciBlZGl0b3JPcHRpb25zID0ge307XG5cblx0dmFyIHNraXBDb21tZW50ID0gbGluZSA9PiBsaW5lLmNoYXJBdCgwKSAhPT0gJyMnO1xuXG5cdC8vIHJlYWQgbW92aWUgZGVmaW5pdGlvblxuXHRyZWFkTGluZXMocGFydHNbMV0pLmZpbHRlcihza2lwQ29tbWVudCkuZm9yRWFjaChmdW5jdGlvbihsaW5lKSB7XG5cdFx0Ly8gZG8gd2UgaGF2ZSBvdXRsaW5lIGRlZmluaXRpb24gaGVyZT9cblx0XHRsaW5lID0gbGluZS5yZXBsYWNlKG9wdGlvbnMub3V0bGluZVNlcGFyYXRvciwgZnVuY3Rpb24oc3RyLCB0aXRsZSkge1xuXHRcdFx0aWYgKG9wdGlvbnMucHJldHRpZnlLZXlzKSB7XG5cdFx0XHRcdG91dGxpbmVbc2NlbmFyaW8ubGVuZ3RoXSA9IHByZXR0aWZ5S2V5QmluZGluZ3ModGl0bGUudHJpbSgpKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiAnJztcblx0XHR9KTtcblxuXHRcdHZhciBzZCA9IGxpbmUubWF0Y2gocmVEZWYpO1xuXHRcdGlmICghc2QpIHtcblx0XHRcdHJldHVybiBzY2VuYXJpby5wdXNoKGxpbmUudHJpbSgpKTtcblx0XHR9XG5cdFx0XHRcblxuXHRcdGlmIChzZFsyXS5jaGFyQXQoMCkgPT09ICd7Jykge1xuXHRcdFx0dmFyIG9iaiA9IHt9O1xuXHRcdFx0b2JqW3NkWzFdXSA9IHBhcnNlSlNPTih1bmVzY2FwZShzZFsyXSkpO1xuXHRcdFx0cmV0dXJuIHNjZW5hcmlvLnB1c2gob2JqKTtcblx0XHR9XG5cblx0XHRzY2VuYXJpby5wdXNoKHNkWzFdICsgJzonICsgdW5lc2NhcGUoc2RbMl0pKTtcblx0fSk7XG5cblx0Ly8gcmVhZCBlZGl0b3Igb3B0aW9uc1xuXHRpZiAocGFydHNbMl0pIHtcblx0XHRyZWFkTGluZXMocGFydHNbMl0pLmZpbHRlcihza2lwQ29tbWVudCkuZm9yRWFjaChmdW5jdGlvbihsaW5lKSB7XG5cdFx0XHR2YXIgc2QgPSBsaW5lLm1hdGNoKHJlRGVmKTtcblx0XHRcdGlmIChzZCkge1xuXHRcdFx0XHRlZGl0b3JPcHRpb25zW3NkWzFdXSA9IHNkWzJdO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG5cblx0cmV0dXJuIHtcblx0XHR2YWx1ZTogdW5lc2NhcGUocGFydHNbMF0udHJpbSgpKSxcblx0XHRzY2VuYXJpbzogc2NlbmFyaW8sXG5cdFx0b3V0bGluZTogT2JqZWN0LmtleXMob3V0bGluZSkubGVuZ3RoID8gb3V0bGluZSA6IG51bGwsXG5cdFx0ZWRpdG9yT3B0aW9uczogZWRpdG9yT3B0aW9uc1xuXHR9O1xufVxuLy8gWFhYIGFkZCAncmV2ZXJ0JyBhY3Rpb24gdG8gQ29kZU1pcnJvciB0byByZXN0b3JlIG9yaWdpbmFsIHRleHQgYW5kIHBvc2l0aW9uXG5Db2RlTWlycm9yLmNvbW1hbmRzLnJldmVydCA9IGZ1bmN0aW9uKGVkaXRvcikge1xuXHRpZiAoZWRpdG9yLl9faW5pdGlhbCkge1xuXHRcdGVkaXRvci5zZXRWYWx1ZShlZGl0b3IuX19pbml0aWFsLmNvbnRlbnQpO1xuXHRcdGVkaXRvci5zZXRDdXJzb3IoZWRpdG9yLl9faW5pdGlhbC5wb3MpO1xuXHR9XG59O1xuXG5Db2RlTWlycm9yLm1vdmllID0gbW92aWU7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbmltcG9ydCBjb21tb25BY3Rpb25zIGZyb20gJy4vYWN0aW9ucyc7XG5pbXBvcnQge2FjdGlvbnMgYXMgcHJvbXB0fSBmcm9tICcuL3dpZGdldHMvcHJvbXB0JztcbmltcG9ydCB7YWN0aW9ucyBhcyB0b29sdGlwfSBmcm9tICcuL3dpZGdldHMvdG9vbHRpcCc7XG5pbXBvcnQge2V4dGVuZH0gZnJvbSAnLi91dGlscyc7XG5cbnZhciBhY3Rpb25zRGVmaW5pdGlvbiA9IGV4dGVuZCh7fSwgY29tbW9uQWN0aW9ucywgcHJvbXB0LCB0b29sdGlwKTtcblxudmFyIFNUQVRFX0lETEUgID0gJ2lkbGUnO1xudmFyIFNUQVRFX1BMQVkgID0gJ3BsYXknO1xudmFyIFNUQVRFX1BBVVNFID0gJ3BhdXNlJztcblxuLy8gUmVndWxhciBleHByZXNzaW9uIHVzZWQgdG8gc3BsaXQgZXZlbnQgc3RyaW5nc1xudmFyIGV2ZW50U3BsaXR0ZXIgPSAvXFxzKy87XG5cbmV4cG9ydCB2YXIgZGVmYXVsdE9wdGlvbnMgPSB7XG5cdGJlZm9yZURlbGF5OiAxMDAwLFxuXHRhZnRlckRlbGF5OiAxMDAwXG59O1xuXG4vKipcbiAqIEBwYXJhbSB7T2JqZWN0fSBhY3Rpb25zIEFjdGlvbnMgc2NlbmFyaW9cbiAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIEluaXRpYWwgY29udGVudCAoPGNvZGU+U3RyaW5nPC9jb2RlPikgb3IgZWRpdG9yXG4gKiBpbnN0YW5jZSAoPGNvZGU+Q29kZU1pcnJvcjwvY29kZT4pXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFNjZW5hcmlvIHtcblx0Y29uc3RydWN0b3IoYWN0aW9ucywgZGF0YSkge1xuXHRcdHRoaXMuX2FjdGlvbnMgPSBhY3Rpb25zO1xuXHRcdHRoaXMuX2FjdGlvbkl4ID0gMDtcblx0XHR0aGlzLl9lZGl0b3IgPSBudWxsO1xuXHRcdHRoaXMuX3N0YXRlID0gU1RBVEVfSURMRTtcblx0XHR0aGlzLl90aW1lclF1ZXVlID0gW107XG5cdFx0XG5cdFx0aWYgKGRhdGEgJiYgJ2dldFZhbHVlJyBpbiBkYXRhKSB7XG5cdFx0XHR0aGlzLl9lZGl0b3IgPSBkYXRhO1xuXHRcdH1cblx0XHRcblx0XHR2YXIgZWQgPSB0aGlzLl9lZGl0b3I7XG5cdFx0aWYgKGVkICYmICFlZC5fX2luaXRpYWwpIHtcblx0XHRcdGVkLl9faW5pdGlhbCA9IHtcblx0XHRcdFx0Y29udGVudDogZWQuZ2V0VmFsdWUoKSxcblx0XHRcdFx0cG9zOiBlZC5nZXRDdXJzb3IodHJ1ZSlcblx0XHRcdH07XG5cdFx0fVxuXHR9XG5cblx0X3NldHVwKGVkaXRvcikge1xuXHRcdGlmICghZWRpdG9yICYmIHRoaXMuX2VkaXRvcikge1xuXHRcdFx0ZWRpdG9yID0gdGhpcy5fZWRpdG9yO1xuXHRcdH1cblx0XHRcblx0XHRlZGl0b3IuZXhlY0NvbW1hbmQoJ3JldmVydCcpO1xuXHRcdHJldHVybiBlZGl0b3I7XG5cdH1cblx0XG5cdC8qKlxuXHQgKiBQbGF5IGN1cnJlbnQgc2NlbmFyaW9cblx0ICogQHBhcmFtIHtDb2RlTWlycm9yfSBlZGl0b3IgRWRpdG9yIGluc3RhbmNlIHdoZXJlIG9uIHdoaWNoIHNjZW5hcmlvIFxuXHQgKiBzaG91bGQgYmUgcGxheWVkXG5cdCAqIEBtZW1iZXJPZiBTY2VuYXJpb1xuXHQgKi9cblx0cGxheShlZGl0b3IpIHtcblx0XHRpZiAodGhpcy5fc3RhdGUgPT09IFNUQVRFX1BMQVkpIHtcblx0XHRcdC8vIGFscmVhZHkgcGxheWluZ1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHRcblx0XHRpZiAodGhpcy5fc3RhdGUgPT09IFNUQVRFX1BBVVNFKSB7XG5cdFx0XHQvLyByZXZlcnQgZnJvbSBwYXVzZWQgc3RhdGVcblx0XHRcdGVkaXRvciA9IGVkaXRvciB8fCB0aGlzLl9lZGl0b3I7XG5cdFx0XHRlZGl0b3IuZm9jdXMoKTtcblx0XHRcdHZhciB0aW1lck9iaiA9IG51bGw7XG5cdFx0XHR3aGlsZSAodGltZXJPYmogPSB0aGlzLl90aW1lclF1ZXVlLnNoaWZ0KCkpIHtcblx0XHRcdFx0cmVxdWVzdFRpbWVyKHRpbWVyT2JqLmZuLCB0aW1lck9iai5kZWxheSk7XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdHRoaXMuX3N0YXRlID0gU1RBVEVfUExBWTtcblx0XHRcdHRoaXMudHJpZ2dlcigncmVzdW1lJyk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdFxuXHRcdHRoaXMuX2VkaXRvciA9IGVkaXRvciA9IHRoaXMuX3NldHVwKGVkaXRvcik7XG5cdFx0ZWRpdG9yLmZvY3VzKCk7XG5cdFx0XG5cdFx0dmFyIHRpbWVyID0gdGhpcy5yZXF1ZXN0VGltZXIuYmluZCh0aGlzKTtcblx0XHR2YXIgdGhhdCA9IHRoaXM7XG5cdFx0dGhpcy5fYWN0aW9uSXggPSAwO1xuXHRcdHZhciBuZXh0ID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRpZiAodGhhdC5fYWN0aW9uSXggPj0gdGhhdC5fYWN0aW9ucy5sZW5ndGgpIHtcblx0XHRcdFx0cmV0dXJuIHRpbWVyKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdHRoYXQuc3RvcCgpO1xuXHRcdFx0XHR9LCBkZWZhdWx0T3B0aW9ucy5hZnRlckRlbGF5KTtcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0dGhhdC50cmlnZ2VyKCdhY3Rpb24nLCB0aGF0Ll9hY3Rpb25JeCk7XG5cdFx0XHR2YXIgYWN0aW9uID0gcGFyc2VBY3Rpb25DYWxsKHRoYXQuX2FjdGlvbnNbdGhhdC5fYWN0aW9uSXgrK10pO1xuXHRcdFx0XG5cdFx0XHRpZiAoYWN0aW9uLm5hbWUgaW4gYWN0aW9uc0RlZmluaXRpb24pIHtcblx0XHRcdFx0YWN0aW9uc0RlZmluaXRpb25bYWN0aW9uLm5hbWVdLmNhbGwodGhhdCwgYWN0aW9uLm9wdGlvbnMsIGVkaXRvciwgbmV4dCwgdGltZXIpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKCdObyBzdWNoIGFjdGlvbjogJyArIGFjdGlvbi5uYW1lKTtcblx0XHRcdH1cblx0XHR9O1xuXHRcdFxuXHRcdHRoaXMuX3N0YXRlID0gU1RBVEVfUExBWTtcblx0XHR0aGlzLl9lZGl0b3Iuc2V0T3B0aW9uKCdyZWFkT25seScsIHRydWUpO1xuXHRcdHRoaXMudHJpZ2dlcigncGxheScpO1xuXHRcdHRpbWVyKG5leHQsIGRlZmF1bHRPcHRpb25zLmJlZm9yZURlbGF5KTtcblx0fVxuXHRcblx0LyoqXG5cdCAqIFBhdXNlIGN1cnJlbnQgc2NlbmFyaW8gcGxheWJhY2suIEl0IGNhbiBiZSByZXN0b3JlZCB3aXRoIFxuXHQgKiA8Y29kZT5wbGF5KCk8L2NvZGU+IG1ldGhvZCBjYWxsIFxuXHQgKi9cblx0cGF1c2UoKSB7XG5cdFx0dGhpcy5fc3RhdGUgPSBTVEFURV9QQVVTRTtcblx0XHR0aGlzLnRyaWdnZXIoJ3BhdXNlJyk7XG5cdH1cblx0XG5cdC8qKlxuXHQgKiBTdG9wcyBwbGF5YmFjayBvZiBjdXJyZW50IHNjZW5hcmlvXG5cdCAqL1xuXHRzdG9wKCkge1xuXHRcdGlmICh0aGlzLl9zdGF0ZSAhPT0gU1RBVEVfSURMRSkge1xuXHRcdFx0dGhpcy5fc3RhdGUgPSBTVEFURV9JRExFO1xuXHRcdFx0dGhpcy5fdGltZXJRdWV1ZS5sZW5ndGggPSAwO1xuXHRcdFx0dGhpcy5fZWRpdG9yLnNldE9wdGlvbigncmVhZE9ubHknLCBmYWxzZSk7XG5cdFx0XHR0aGlzLnRyaWdnZXIoJ3N0b3AnKTtcblx0XHR9XG5cdH1cblx0XG5cdC8qKlxuXHQgKiBSZXR1cm5zIGN1cnJlbnQgcGxheWJhY2sgc3RhdGVcblx0ICogQHJldHVybiB7U3RyaW5nfVxuXHQgKi9cblx0Z2V0IHN0YXRlKCkge1xuXHRcdHJldHVybiB0aGlzLl9zdGF0ZTtcblx0fVxuXHRcblx0LyoqXG5cdCAqIFRvZ2dsZSBwbGF5YmFjayBvZiBtb3ZpZSBzY2VuYXJpb1xuXHQgKi9cblx0dG9nZ2xlKCkge1xuXHRcdGlmICh0aGlzLl9zdGF0ZSA9PT0gU1RBVEVfUExBWSkge1xuXHRcdFx0dGhpcy5wYXVzZSgpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLnBsYXkoKTtcblx0XHR9XG5cdH1cblx0XG5cdHJlcXVlc3RUaW1lcihmbiwgZGVsYXkpIHtcblx0XHRpZiAodGhpcy5fc3RhdGUgIT09IFNUQVRFX1BMQVkpIHtcblx0XHRcdC8vIHNhdmUgZnVuY3Rpb24gY2FsbCBpbnRvIGEgcXVldWUgdGlsbCBuZXh0ICdwbGF5KCknIGNhbGxcblx0XHRcdHRoaXMuX3RpbWVyUXVldWUucHVzaCh7XG5cdFx0XHRcdGZuOiBmbixcblx0XHRcdFx0ZGVsYXk6IGRlbGF5XG5cdFx0XHR9KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIHJlcXVlc3RUaW1lcihmbiwgZGVsYXkpO1xuXHRcdH1cblx0fVxuXHRcblx0Ly8gYm9ycm93ZWQgZnJvbSBCYWNrYm9uZVxuXHQvKipcblx0ICogQmluZCBvbmUgb3IgbW9yZSBzcGFjZSBzZXBhcmF0ZWQgZXZlbnRzLCBgZXZlbnRzYCwgdG8gYSBgY2FsbGJhY2tgXG5cdCAqIGZ1bmN0aW9uLiBQYXNzaW5nIGBcImFsbFwiYCB3aWxsIGJpbmQgdGhlIGNhbGxiYWNrIHRvIGFsbCBldmVudHMgZmlyZWQuXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBldmVudHNcblx0ICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2tcblx0ICogQHBhcmFtIHtPYmplY3R9IGNvbnRleHRcblx0ICogQG1lbWJlck9mIGV2ZW50RGlzcGF0Y2hlclxuXHQgKi9cblx0b24oZXZlbnRzLCBjYWxsYmFjaywgY29udGV4dCkge1xuXHRcdHZhciBjYWxscywgZXZlbnQsIG5vZGUsIHRhaWwsIGxpc3Q7XG5cdFx0aWYgKCFjYWxsYmFjaykge1xuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fVxuXHRcdFxuXHRcdGV2ZW50cyA9IGV2ZW50cy5zcGxpdChldmVudFNwbGl0dGVyKTtcblx0XHRjYWxscyA9IHRoaXMuX2NhbGxiYWNrcyB8fCAodGhpcy5fY2FsbGJhY2tzID0ge30pO1xuXG5cdFx0Ly8gQ3JlYXRlIGFuIGltbXV0YWJsZSBjYWxsYmFjayBsaXN0LCBhbGxvd2luZyB0cmF2ZXJzYWwgZHVyaW5nXG5cdFx0Ly8gbW9kaWZpY2F0aW9uLiAgVGhlIHRhaWwgaXMgYW4gZW1wdHkgb2JqZWN0IHRoYXQgd2lsbCBhbHdheXMgYmUgdXNlZFxuXHRcdC8vIGFzIHRoZSBuZXh0IG5vZGUuXG5cdFx0d2hpbGUgKGV2ZW50ID0gZXZlbnRzLnNoaWZ0KCkpIHtcblx0XHRcdGxpc3QgPSBjYWxsc1tldmVudF07XG5cdFx0XHRub2RlID0gbGlzdCA/IGxpc3QudGFpbCA6IHt9O1xuXHRcdFx0bm9kZS5uZXh0ID0gdGFpbCA9IHt9O1xuXHRcdFx0bm9kZS5jb250ZXh0ID0gY29udGV4dDtcblx0XHRcdG5vZGUuY2FsbGJhY2sgPSBjYWxsYmFjaztcblx0XHRcdGNhbGxzW2V2ZW50XSA9IHtcblx0XHRcdFx0dGFpbCA6IHRhaWwsXG5cdFx0XHRcdG5leHQgOiBsaXN0ID8gbGlzdC5uZXh0IDogbm9kZVxuXHRcdFx0fTtcblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fVxuXG5cdC8qKlxuXHQgKiBSZW1vdmUgb25lIG9yIG1hbnkgY2FsbGJhY2tzLiBJZiBgY29udGV4dGAgaXMgbnVsbCwgcmVtb3ZlcyBhbGxcblx0ICogY2FsbGJhY2tzIHdpdGggdGhhdCBmdW5jdGlvbi4gSWYgYGNhbGxiYWNrYCBpcyBudWxsLCByZW1vdmVzIGFsbFxuXHQgKiBjYWxsYmFja3MgZm9yIHRoZSBldmVudC4gSWYgYGV2ZW50c2AgaXMgbnVsbCwgcmVtb3ZlcyBhbGwgYm91bmRcblx0ICogY2FsbGJhY2tzIGZvciBhbGwgZXZlbnRzLlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRzXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBjb250ZXh0XG5cdCAqL1xuXHRvZmYoZXZlbnRzLCBjYWxsYmFjaywgY29udGV4dCkge1xuXHRcdHZhciBldmVudCwgY2FsbHMsIG5vZGUsIHRhaWwsIGNiLCBjdHg7XG5cblx0XHQvLyBObyBldmVudHMsIG9yIHJlbW92aW5nICphbGwqIGV2ZW50cy5cblx0XHRpZiAoIShjYWxscyA9IHRoaXMuX2NhbGxiYWNrcykpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0XG5cdFx0aWYgKCEoZXZlbnRzIHx8IGNhbGxiYWNrIHx8IGNvbnRleHQpKSB7XG5cdFx0XHRkZWxldGUgdGhpcy5fY2FsbGJhY2tzO1xuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fVxuXG5cdFx0Ly8gTG9vcCB0aHJvdWdoIHRoZSBsaXN0ZWQgZXZlbnRzIGFuZCBjb250ZXh0cywgc3BsaWNpbmcgdGhlbSBvdXQgb2YgdGhlXG5cdFx0Ly8gbGlua2VkIGxpc3Qgb2YgY2FsbGJhY2tzIGlmIGFwcHJvcHJpYXRlLlxuXHRcdGV2ZW50cyA9IGV2ZW50cyA/IGV2ZW50cy5zcGxpdChldmVudFNwbGl0dGVyKSA6IE9iamVjdC5rZXlzKGNhbGxzKTtcblx0XHR3aGlsZSAoZXZlbnQgPSBldmVudHMuc2hpZnQoKSkge1xuXHRcdFx0bm9kZSA9IGNhbGxzW2V2ZW50XTtcblx0XHRcdGRlbGV0ZSBjYWxsc1tldmVudF07XG5cdFx0XHRpZiAoIW5vZGUgfHwgIShjYWxsYmFjayB8fCBjb250ZXh0KSkge1xuXHRcdFx0XHRjb250aW51ZTtcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0Ly8gQ3JlYXRlIGEgbmV3IGxpc3QsIG9taXR0aW5nIHRoZSBpbmRpY2F0ZWQgY2FsbGJhY2tzLlxuXHRcdFx0dGFpbCA9IG5vZGUudGFpbDtcblx0XHRcdHdoaWxlICgobm9kZSA9IG5vZGUubmV4dCkgIT09IHRhaWwpIHtcblx0XHRcdFx0Y2IgPSBub2RlLmNhbGxiYWNrO1xuXHRcdFx0XHRjdHggPSBub2RlLmNvbnRleHQ7XG5cdFx0XHRcdGlmICgoY2FsbGJhY2sgJiYgY2IgIT09IGNhbGxiYWNrKSB8fCAoY29udGV4dCAmJiBjdHggIT09IGNvbnRleHQpKSB7XG5cdFx0XHRcdFx0dGhpcy5vbihldmVudCwgY2IsIGN0eCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fVxuXHRcblx0LyoqXG5cdCAqIFRyaWdnZXIgb25lIG9yIG1hbnkgZXZlbnRzLCBmaXJpbmcgYWxsIGJvdW5kIGNhbGxiYWNrcy4gQ2FsbGJhY2tzIGFyZVxuXHQgKiBwYXNzZWQgdGhlIHNhbWUgYXJndW1lbnRzIGFzIGB0cmlnZ2VyYCBpcywgYXBhcnQgZnJvbSB0aGUgZXZlbnQgbmFtZVxuXHQgKiAodW5sZXNzIHlvdSdyZSBsaXN0ZW5pbmcgb24gYFwiYWxsXCJgLCB3aGljaCB3aWxsIGNhdXNlIHlvdXIgY2FsbGJhY2tcblx0ICogdG8gcmVjZWl2ZSB0aGUgdHJ1ZSBuYW1lIG9mIHRoZSBldmVudCBhcyB0aGUgZmlyc3QgYXJndW1lbnQpLlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRzXG5cdCAqL1xuXHR0cmlnZ2VyKGV2ZW50cywgLi4ucmVzdCkge1xuXHRcdHZhciBldmVudCwgbm9kZSwgY2FsbHMsIHRhaWwsIGFyZ3MsIGFsbDtcblx0XHRpZiAoIShjYWxscyA9IHRoaXMuX2NhbGxiYWNrcykpIHtcblx0XHRcdHJldHVybiB0aGlzO1xuXHRcdH1cblx0XHRcblx0XHRhbGwgPSBjYWxscy5hbGw7XG5cdFx0ZXZlbnRzID0gZXZlbnRzLnNwbGl0KGV2ZW50U3BsaXR0ZXIpO1xuXG5cdFx0Ly8gRm9yIGVhY2ggZXZlbnQsIHdhbGsgdGhyb3VnaCB0aGUgbGlua2VkIGxpc3Qgb2YgY2FsbGJhY2tzIHR3aWNlLFxuXHRcdC8vIGZpcnN0IHRvIHRyaWdnZXIgdGhlIGV2ZW50LCB0aGVuIHRvIHRyaWdnZXIgYW55IGBcImFsbFwiYCBjYWxsYmFja3MuXG5cdFx0d2hpbGUgKGV2ZW50ID0gZXZlbnRzLnNoaWZ0KCkpIHtcblx0XHRcdGlmIChub2RlID0gY2FsbHNbZXZlbnRdKSB7XG5cdFx0XHRcdHRhaWwgPSBub2RlLnRhaWw7XG5cdFx0XHRcdHdoaWxlICgobm9kZSA9IG5vZGUubmV4dCkgIT09IHRhaWwpIHtcblx0XHRcdFx0XHRub2RlLmNhbGxiYWNrLmFwcGx5KG5vZGUuY29udGV4dCB8fCB0aGlzLCByZXN0KTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0aWYgKG5vZGUgPSBhbGwpIHtcblx0XHRcdFx0dGFpbCA9IG5vZGUudGFpbDtcblx0XHRcdFx0YXJncyA9IFsgZXZlbnQgXS5jb25jYXQocmVzdCk7XG5cdFx0XHRcdHdoaWxlICgobm9kZSA9IG5vZGUubmV4dCkgIT09IHRhaWwpIHtcblx0XHRcdFx0XHRub2RlLmNhbGxiYWNrLmFwcGx5KG5vZGUuY29udGV4dCB8fCB0aGlzLCBhcmdzKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzO1xuXHR9XG59O1xuXG4vKipcbiAqIFBhcnNlcyBhY3Rpb24gY2FsbCBmcm9tIHN0cmluZ1xuICogQHBhcmFtIHtTdHJpbmd9IGRhdGFcbiAqIEByZXR1cm5zIHtPYmplY3R9XG4gKi9cbmZ1bmN0aW9uIHBhcnNlQWN0aW9uQ2FsbChkYXRhKSB7XG5cdGlmICh0eXBlb2YgZGF0YSA9PT0gJ3N0cmluZycpIHtcblx0XHR2YXIgcGFydHMgPSBkYXRhLnNwbGl0KCc6Jyk7XG5cdFx0cmV0dXJuIHtcblx0XHRcdG5hbWU6IHBhcnRzLnNoaWZ0KCksXG5cdFx0XHRvcHRpb25zOiBwYXJ0cy5qb2luKCc6Jylcblx0XHR9O1xuXHR9IGVsc2Uge1xuXHRcdHZhciBuYW1lID0gT2JqZWN0LmtleXMoZGF0YSlbMF07XG5cdFx0cmV0dXJuIHtcblx0XHRcdG5hbWU6IG5hbWUsXG5cdFx0XHRvcHRpb25zOiBkYXRhW25hbWVdXG5cdFx0fTtcblx0fVxufVxuXG5mdW5jdGlvbiByZXF1ZXN0VGltZXIoZm4sIGRlbGF5KSB7XG5cdGlmICghZGVsYXkpIHtcblx0XHRmbigpO1xuXHR9IGVsc2Uge1xuXHRcdHJldHVybiBzZXRUaW1lb3V0KGZuLCBkZWxheSk7XG5cdH1cbn0iLCJ2YXIgcHJvcENhY2hlID0ge307XG5cbi8vIGRldGVjdCBDU1MgM0QgVHJhbnNmb3JtcyBmb3Igc21vb3RoZXIgYW5pbWF0aW9ucyBcbmV4cG9ydCB2YXIgaGFzM2QgPSAoZnVuY3Rpb24oKSB7XG5cdHZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXHR2YXIgY3NzVHJhbnNmb3JtID0gcHJlZml4ZWQoJ3RyYW5zZm9ybScpO1xuXHRpZiAoY3NzVHJhbnNmb3JtKSB7XG5cdFx0ZWwuc3R5bGVbY3NzVHJhbnNmb3JtXSA9ICd0cmFuc2xhdGVaKDApJztcblx0XHRyZXR1cm4gKC90cmFuc2xhdGV6L2kpLnRlc3QoZWwuc3R5bGVbY3NzVHJhbnNmb3JtXSk7IFxuXHR9XG5cdFxuXHRyZXR1cm4gZmFsc2U7XG59KSgpO1xuXG5leHBvcnQgZnVuY3Rpb24gZXh0ZW5kKG9iaiwgLi4uYXJncykge1xuXHRhcmdzLmZvckVhY2goYSA9PiB7XG5cdFx0aWYgKHR5cGVvZiBhID09PSAnb2JqZWN0Jykge1xuXHRcdFx0T2JqZWN0LmtleXMoYSkuZm9yRWFjaChrZXkgPT4gb2JqW2tleV0gPSBhW2tleV0pO1xuXHRcdH1cblx0fSk7XG5cdHJldHVybiBvYmo7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0b0FycmF5KG9iaiwgaXg9MCkge1xuXHRyZXR1cm4gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwob2JqLCBpeCk7XG59XG5cbi8qKlxuICogUmV0dXJucyBwcmVmaXhlZCAoaWYgcmVxdWlyZWQpIENTUyBwcm9wZXJ0eSBuYW1lXG4gKiBAcGFyYW0gIHtTdHJpbmd9IHByb3BcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHByZWZpeGVkKHByb3ApIHtcblx0aWYgKHByb3AgaW4gcHJvcENhY2hlKSB7XG5cdFx0cmV0dXJuIHByb3BDYWNoZVtwcm9wXTtcblx0fVxuXG5cdHZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXHR2YXIgc3R5bGUgPSBlbC5zdHlsZTtcblxuXHR2YXIgcHJlZml4ZXMgPSBbJ28nLCAnbXMnLCAnbW96JywgJ3dlYmtpdCddO1xuXHR2YXIgcHJvcHMgPSBbcHJvcF07XG5cdHZhciBjYXBpdGFsaXplID0gZnVuY3Rpb24oc3RyKSB7XG5cdFx0cmV0dXJuIHN0ci5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHN0ci5zdWJzdHIoMSk7XG5cdH07XG5cblx0cHJvcCA9IHByb3AucmVwbGFjZSgvXFwtKFthLXpdKS9nLCBmdW5jdGlvbihzdHIsIGNoKSB7XG5cdFx0cmV0dXJuIGNoLnRvVXBwZXJDYXNlKCk7XG5cdH0pO1xuXG5cdHZhciBjYXBQcm9wID0gY2FwaXRhbGl6ZShwcm9wKTtcblx0cHJlZml4ZXMuZm9yRWFjaChmdW5jdGlvbihwcmVmaXgpIHtcblx0XHRwcm9wcy5wdXNoKHByZWZpeCArIGNhcFByb3AsIGNhcGl0YWxpemUocHJlZml4KSArIGNhcFByb3ApO1xuXHR9KTtcblxuXHRmb3IgKHZhciBpID0gMCwgaWwgPSBwcm9wcy5sZW5ndGg7IGkgPCBpbDsgaSsrKSB7XG5cdFx0aWYgKHByb3BzW2ldIGluIHN0eWxlKSB7XG5cdFx0XHRyZXR1cm4gcHJvcENhY2hlW3Byb3BdID0gcHJvcHNbaV07XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIHByb3BDYWNoZVtwcm9wXSA9IG51bGw7XG59XG5cbi8qKlxuICogSGVscGVyIGZ1bmN0aW9uIHRoYXQgcHJvZHVjZXMgPGNvZGU+e2xpbmUsIGNofTwvY29kZT4gb2JqZWN0IGZyb21cbiAqIHBhc3NlZCBhcmd1bWVudFxuICogQHBhcmFtIHtPYmplY3R9IHBvc1xuICogQHBhcmFtIHtDb2RlTWlycm9yfSBlZGl0b3JcbiAqIEByZXR1cm5zIHtPYmplY3R9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYWtlUG9zKHBvcywgZWRpdG9yKSB7XG5cdGlmIChwb3MgPT09ICdjYXJldCcpIHtcblx0XHRyZXR1cm4gZWRpdG9yLmdldEN1cnNvcih0cnVlKTtcblx0fVxuXG5cdGlmICh0eXBlb2YgcG9zID09PSAnc3RyaW5nJykge1xuXHRcdGlmICh+cG9zLmluZGV4T2YoJzonKSkge1xuXHRcdFx0bGV0IHBhcnRzID0gcG9zLnNwbGl0KCc6Jyk7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRsaW5lOiArcGFydHNbMF0sXG5cdFx0XHRcdGNoOiArcGFydHNbMV1cblx0XHRcdH07XG5cdFx0fVxuXHRcdFxuXHRcdHBvcyA9ICtwb3M7XG5cdH1cblx0XG5cdGlmICh0eXBlb2YgcG9zID09PSAnbnVtYmVyJykge1xuXHRcdHJldHVybiBlZGl0b3IucG9zRnJvbUluZGV4KHBvcyk7XG5cdH1cblx0XG5cdHJldHVybiBwb3M7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0ZW1wbGF0ZSh0bXBsLCBkYXRhKSB7XG5cdHZhciBmbiA9IGRhdGEgPT4gdG1wbC5yZXBsYWNlKC88JShbLT1dKT9cXHMqKFtcXHdcXC1dKylcXHMqJT4vZywgKHN0ciwgb3AsIGtleSkgPT4gZGF0YVtrZXkudHJpbSgpXSk7XG5cdHJldHVybiBkYXRhID8gZm4oZGF0YSkgOiBmbjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZpbmQoYXJyLCBpdGVyKSB7XG5cdHZhciBmb3VuZDtcblx0YXJyLnNvbWUoKGl0ZW0sIGksIGFycikgPT4ge1xuXHRcdGlmIChpdGVyKGl0ZW0sIGksIGFycikpIHtcblx0XHRcdHJldHVybiBmb3VuZCA9IGl0ZW07XG5cdFx0fVxuXHR9KTtcblx0cmV0dXJuIGZvdW5kO1xufVxuXG4vKipcbiAqIFJlbGF4ZWQgSlNPTiBwYXJzZXIuXG4gKiBAcGFyYW0ge1N0cmluZ30gdGV4dFxuICogQHJldHVybnMge09iamVjdH0gXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUpTT04odGV4dCkge1xuXHR0cnkge1xuXHRcdHJldHVybiAobmV3IEZ1bmN0aW9uKCdyZXR1cm4gJyArIHRleHQpKSgpO1xuXHR9IGNhdGNoKGUpIHtcblx0XHRyZXR1cm4ge307XG5cdH1cbn0iLCJ2YXIgZ2xvYmFsID0gd2luZG93O1xudmFyIHRpbWUgPSBEYXRlLm5vdyBcblx0PyBmdW5jdGlvbigpIHtyZXR1cm4gRGF0ZS5ub3coKTt9XG5cdDogZnVuY3Rpb24oKSB7cmV0dXJuICtuZXcgRGF0ZTt9O1xuXG52YXIgaW5kZXhPZiA9ICdpbmRleE9mJyBpbiBBcnJheS5wcm90b3R5cGVcblx0PyBmdW5jdGlvbihhcnJheSwgdmFsdWUpIHtyZXR1cm4gYXJyYXkuaW5kZXhPZih2YWx1ZSk7fVxuXHQ6IGZ1bmN0aW9uKGFycmF5LCB2YWx1ZSkge1xuXHRcdGZvciAodmFyIGkgPSAwLCBpbCA9IGFycmF5Lmxlbmd0aDsgaSA8IGlsOyBpKyspIHtcblx0XHRcdGlmIChhcnJheVtpXSA9PT0gdmFsdWUpIHtcblx0XHRcdFx0cmV0dXJuIGk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIC0xO1xuXHR9O1xuXG5mdW5jdGlvbiBleHRlbmQob2JqKSB7XG5cdGZvciAodmFyIGkgPSAxLCBpbCA9IGFyZ3VtZW50cy5sZW5ndGgsIHNvdXJjZTsgaSA8IGlsOyBpKyspIHtcblx0XHRzb3VyY2UgPSBhcmd1bWVudHNbaV07XG5cdFx0aWYgKHNvdXJjZSkge1xuXHRcdFx0Zm9yICh2YXIgcHJvcCBpbiBzb3VyY2UpIHtcblx0XHRcdFx0b2JqW3Byb3BdID0gc291cmNlW3Byb3BdO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHJldHVybiBvYmo7XG59XG5cbi8qKlxuICogcmVxdWVzdEFuaW1hdGlvbkZyYW1lIHBvbHlmaWxsIGJ5IEVyaWsgTcO2bGxlclxuICogZml4ZXMgZnJvbSBQYXVsIElyaXNoIGFuZCBUaW5vIFppamRlbFxuICogaHR0cDovL3BhdWxpcmlzaC5jb20vMjAxMS9yZXF1ZXN0YW5pbWF0aW9uZnJhbWUtZm9yLXNtYXJ0LWFuaW1hdGluZy9cbiAqIGh0dHA6Ly9teS5vcGVyYS5jb20vZW1vbGxlci9ibG9nLzIwMTEvMTIvMjAvcmVxdWVzdGFuaW1hdGlvbmZyYW1lLWZvci1zbWFydC1lci1hbmltYXRpbmdcbiAqL1xuKGZ1bmN0aW9uKCkge1xuXHR2YXIgbGFzdFRpbWUgPSAwO1xuXHR2YXIgdmVuZG9ycyA9IFsgJ21zJywgJ21veicsICd3ZWJraXQnLCAnbycgXTtcblx0Zm9yICh2YXIgeCA9IDA7IHggPCB2ZW5kb3JzLmxlbmd0aCAmJiAhZ2xvYmFsLnJlcXVlc3RBbmltYXRpb25GcmFtZTsgKyt4KSB7XG5cdFx0Z2xvYmFsLnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IGdsb2JhbFt2ZW5kb3JzW3hdICsgJ1JlcXVlc3RBbmltYXRpb25GcmFtZSddO1xuXHRcdGdsb2JhbC5jYW5jZWxBbmltYXRpb25GcmFtZSA9IGdsb2JhbFt2ZW5kb3JzW3hdICsgJ0NhbmNlbEFuaW1hdGlvbkZyYW1lJ11cblx0XHRcdFx0fHwgZ2xvYmFsW3ZlbmRvcnNbeF0gKyAnQ2FuY2VsUmVxdWVzdEFuaW1hdGlvbkZyYW1lJ107XG5cdH1cblx0XG5cdGlmICghZ2xvYmFsLnJlcXVlc3RBbmltYXRpb25GcmFtZSlcblx0XHRnbG9iYWwucmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gZnVuY3Rpb24oY2FsbGJhY2ssIGVsZW1lbnQpIHtcblx0XHRcdHZhciBjdXJyVGltZSA9IHRpbWUoKTtcblx0XHRcdHZhciB0aW1lVG9DYWxsID0gTWF0aC5tYXgoMCwgMTYgLSAoY3VyclRpbWUgLSBsYXN0VGltZSkpO1xuXHRcdFx0dmFyIGlkID0gZ2xvYmFsLnNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGNhbGxiYWNrKGN1cnJUaW1lICsgdGltZVRvQ2FsbCk7XG5cdFx0XHR9LCB0aW1lVG9DYWxsKTtcblx0XHRcdGxhc3RUaW1lID0gY3VyclRpbWUgKyB0aW1lVG9DYWxsO1xuXHRcdFx0cmV0dXJuIGlkO1xuXHRcdH07XG5cblx0aWYgKCFnbG9iYWwuY2FuY2VsQW5pbWF0aW9uRnJhbWUpXG5cdFx0Z2xvYmFsLmNhbmNlbEFuaW1hdGlvbkZyYW1lID0gZnVuY3Rpb24oaWQpIHtcblx0XHRcdGNsZWFyVGltZW91dChpZCk7XG5cdFx0fTtcbn0oKSk7XG5cblxudmFyIGR1bW15Rm4gPSBmdW5jdGlvbigpIHt9O1xudmFyIGFuaW1zID0gW107XG52YXIgaWRDb3VudGVyID0gMDtcblxudmFyIGRlZmF1bHRzID0ge1xuXHRkdXJhdGlvbjogNTAwLCAvLyBtc1xuXHRkZWxheTogMCxcblx0ZWFzaW5nOiAnbGluZWFyJyxcblx0c3RhcnQ6IGR1bW15Rm4sXG5cdHN0ZXA6IGR1bW15Rm4sXG5cdGNvbXBsZXRlOiBkdW1teUZuLFxuXHRhdXRvc3RhcnQ6IHRydWUsXG5cdHJldmVyc2U6IGZhbHNlXG59O1xuXG5leHBvcnQgdmFyIGVhc2luZ3MgPSB7XG5cdGxpbmVhcjogZnVuY3Rpb24odCwgYiwgYywgZCkge1xuXHRcdHJldHVybiBjICogdCAvIGQgKyBiO1xuXHR9LFxuXHRpblF1YWQ6IGZ1bmN0aW9uKHQsIGIsIGMsIGQpIHtcblx0XHRyZXR1cm4gYyoodC89ZCkqdCArIGI7XG5cdH0sXG5cdG91dFF1YWQ6IGZ1bmN0aW9uKHQsIGIsIGMsIGQpIHtcblx0XHRyZXR1cm4gLWMgKih0Lz1kKSoodC0yKSArIGI7XG5cdH0sXG5cdGluT3V0UXVhZDogZnVuY3Rpb24odCwgYiwgYywgZCkge1xuXHRcdGlmKCh0Lz1kLzIpIDwgMSkgcmV0dXJuIGMvMip0KnQgKyBiO1xuXHRcdHJldHVybiAtYy8yICooKC0tdCkqKHQtMikgLSAxKSArIGI7XG5cdH0sXG5cdGluQ3ViaWM6IGZ1bmN0aW9uKHQsIGIsIGMsIGQpIHtcblx0XHRyZXR1cm4gYyoodC89ZCkqdCp0ICsgYjtcblx0fSxcblx0b3V0Q3ViaWM6IGZ1bmN0aW9uKHQsIGIsIGMsIGQpIHtcblx0XHRyZXR1cm4gYyooKHQ9dC9kLTEpKnQqdCArIDEpICsgYjtcblx0fSxcblx0aW5PdXRDdWJpYzogZnVuY3Rpb24odCwgYiwgYywgZCkge1xuXHRcdGlmKCh0Lz1kLzIpIDwgMSkgcmV0dXJuIGMvMip0KnQqdCArIGI7XG5cdFx0cmV0dXJuIGMvMiooKHQtPTIpKnQqdCArIDIpICsgYjtcblx0fSxcblx0aW5FeHBvOiBmdW5jdGlvbih0LCBiLCBjLCBkKSB7XG5cdFx0cmV0dXJuKHQ9PTApID8gYiA6IGMgKiBNYXRoLnBvdygyLCAxMCAqKHQvZCAtIDEpKSArIGIgLSBjICogMC4wMDE7XG5cdH0sXG5cdG91dEV4cG86IGZ1bmN0aW9uKHQsIGIsIGMsIGQpIHtcblx0XHRyZXR1cm4odD09ZCkgPyBiK2MgOiBjICogMS4wMDEgKigtTWF0aC5wb3coMiwgLTEwICogdC9kKSArIDEpICsgYjtcblx0fSxcblx0aW5PdXRFeHBvOiBmdW5jdGlvbih0LCBiLCBjLCBkKSB7XG5cdFx0aWYodD09MCkgcmV0dXJuIGI7XG5cdFx0aWYodD09ZCkgcmV0dXJuIGIrYztcblx0XHRpZigodC89ZC8yKSA8IDEpIHJldHVybiBjLzIgKiBNYXRoLnBvdygyLCAxMCAqKHQgLSAxKSkgKyBiIC0gYyAqIDAuMDAwNTtcblx0XHRyZXR1cm4gYy8yICogMS4wMDA1ICooLU1hdGgucG93KDIsIC0xMCAqIC0tdCkgKyAyKSArIGI7XG5cdH0sXG5cdGluRWxhc3RpYzogZnVuY3Rpb24odCwgYiwgYywgZCwgYSwgcCkge1xuXHRcdHZhciBzO1xuXHRcdGlmKHQ9PTApIHJldHVybiBiOyAgaWYoKHQvPWQpPT0xKSByZXR1cm4gYitjOyAgaWYoIXApIHA9ZCouMztcblx0XHRpZighYSB8fCBhIDwgTWF0aC5hYnMoYykpIHsgYT1jOyBzPXAvNDsgfSBlbHNlIHMgPSBwLygyKk1hdGguUEkpICogTWF0aC5hc2luKGMvYSk7XG5cdFx0cmV0dXJuIC0oYSpNYXRoLnBvdygyLDEwKih0LT0xKSkgKiBNYXRoLnNpbigodCpkLXMpKigyKk1hdGguUEkpL3AgKSkgKyBiO1xuXHR9LFxuXHRvdXRFbGFzdGljOiBmdW5jdGlvbih0LCBiLCBjLCBkLCBhLCBwKSB7XG5cdFx0dmFyIHM7XG5cdFx0aWYodD09MCkgcmV0dXJuIGI7ICBpZigodC89ZCk9PTEpIHJldHVybiBiK2M7ICBpZighcCkgcD1kKi4zO1xuXHRcdGlmKCFhIHx8IGEgPCBNYXRoLmFicyhjKSkgeyBhPWM7IHM9cC80OyB9IGVsc2UgcyA9IHAvKDIqTWF0aC5QSSkgKiBNYXRoLmFzaW4oYy9hKTtcblx0XHRyZXR1cm4oYSpNYXRoLnBvdygyLC0xMCp0KSAqIE1hdGguc2luKCh0KmQtcykqKDIqTWF0aC5QSSkvcCApICsgYyArIGIpO1xuXHR9LFxuXHRpbk91dEVsYXN0aWM6IGZ1bmN0aW9uKHQsIGIsIGMsIGQsIGEsIHApIHtcblx0XHR2YXIgcztcblx0XHRpZih0PT0wKSByZXR1cm4gYjsgXG5cdFx0aWYoKHQvPWQvMik9PTIpIHJldHVybiBiK2M7XG5cdFx0aWYoIXApIHA9ZCooLjMqMS41KTtcblx0XHRpZighYSB8fCBhIDwgTWF0aC5hYnMoYykpIHsgYT1jOyBzPXAvNDsgfSAgICAgICBlbHNlIHMgPSBwLygyKk1hdGguUEkpICogTWF0aC5hc2luKGMvYSk7XG5cdFx0aWYodCA8IDEpIHJldHVybiAtLjUqKGEqTWF0aC5wb3coMiwxMCoodC09MSkpICogTWF0aC5zaW4oKHQqZC1zKSooMipNYXRoLlBJKS9wICkpICsgYjtcblx0XHRyZXR1cm4gYSpNYXRoLnBvdygyLC0xMCoodC09MSkpICogTWF0aC5zaW4oKHQqZC1zKSooMipNYXRoLlBJKS9wICkqLjUgKyBjICsgYjtcblx0fSxcblx0aW5CYWNrOiBmdW5jdGlvbih0LCBiLCBjLCBkLCBzKSB7XG5cdFx0aWYocyA9PSB1bmRlZmluZWQpIHMgPSAxLjcwMTU4O1xuXHRcdHJldHVybiBjKih0Lz1kKSp0KigocysxKSp0IC0gcykgKyBiO1xuXHR9LFxuXHRvdXRCYWNrOiBmdW5jdGlvbih0LCBiLCBjLCBkLCBzKSB7XG5cdFx0aWYocyA9PSB1bmRlZmluZWQpIHMgPSAxLjcwMTU4O1xuXHRcdHJldHVybiBjKigodD10L2QtMSkqdCooKHMrMSkqdCArIHMpICsgMSkgKyBiO1xuXHR9LFxuXHRpbk91dEJhY2s6IGZ1bmN0aW9uKHQsIGIsIGMsIGQsIHMpIHtcblx0XHRpZihzID09IHVuZGVmaW5lZCkgcyA9IDEuNzAxNTg7XG5cdFx0aWYoKHQvPWQvMikgPCAxKSByZXR1cm4gYy8yKih0KnQqKCgocyo9KDEuNTI1KSkrMSkqdCAtIHMpKSArIGI7XG5cdFx0cmV0dXJuIGMvMiooKHQtPTIpKnQqKCgocyo9KDEuNTI1KSkrMSkqdCArIHMpICsgMikgKyBiO1xuXHR9LFxuXHRpbkJvdW5jZTogZnVuY3Rpb24odCwgYiwgYywgZCkge1xuXHRcdHJldHVybiBjIC0gdGhpcy5vdXRCb3VuY2UodCwgZC10LCAwLCBjLCBkKSArIGI7XG5cdH0sXG5cdG91dEJvdW5jZTogZnVuY3Rpb24odCwgYiwgYywgZCkge1xuXHRcdGlmKCh0Lz1kKSA8KDEvMi43NSkpIHtcblx0XHRcdHJldHVybiBjKig3LjU2MjUqdCp0KSArIGI7XG5cdFx0fSBlbHNlIGlmKHQgPCgyLzIuNzUpKSB7XG5cdFx0XHRyZXR1cm4gYyooNy41NjI1Kih0LT0oMS41LzIuNzUpKSp0ICsgLjc1KSArIGI7XG5cdFx0fSBlbHNlIGlmKHQgPCgyLjUvMi43NSkpIHtcblx0XHRcdHJldHVybiBjKig3LjU2MjUqKHQtPSgyLjI1LzIuNzUpKSp0ICsgLjkzNzUpICsgYjtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIGMqKDcuNTYyNSoodC09KDIuNjI1LzIuNzUpKSp0ICsgLjk4NDM3NSkgKyBiO1xuXHRcdH1cblx0fSxcblx0aW5PdXRCb3VuY2U6IGZ1bmN0aW9uKHQsIGIsIGMsIGQpIHtcblx0XHRpZih0IDwgZC8yKSByZXR1cm4gdGhpcy5pbkJvdW5jZSh0KjIsIDAsIGMsIGQpICogLjUgKyBiO1xuXHRcdHJldHVybiB0aGlzLm91dEJvdW5jZSh0KjItZCwgMCwgYywgZCkgKiAuNSArIGMqLjUgKyBiO1xuXHR9LFxuXHRvdXRIYXJkOiBmdW5jdGlvbih0LCBiLCBjLCBkKSB7XG5cdFx0dmFyIHRzID0gKHQvPWQpKnQ7XG5cdFx0dmFyIHRjID0gdHMqdDtcblx0XHRyZXR1cm4gYiArIGMqKDEuNzUqdGMqdHMgKyAtNy40NDc1KnRzKnRzICsgMTIuOTk1KnRjICsgLTExLjU5NSp0cyArIDUuMjk3NSp0KTtcblx0fVxufTtcblxuZnVuY3Rpb24gbWFpbkxvb3AoKSB7XG5cdGlmICghYW5pbXMubGVuZ3RoKSB7XG5cdFx0Ly8gbm8gYW5pbWF0aW9ucyBsZWZ0LCBzdG9wIHBvbGxpbmdcblx0XHRyZXR1cm47XG5cdH1cblx0XG5cdHZhciBub3cgPSB0aW1lKCk7XG5cdHZhciBmaWx0ZXJlZCA9IFtdLCB0d2Vlbiwgb3B0O1xuXG5cdC8vIGRvIG5vdCB1c2UgQXJyYXkuZmlsdGVyKCkgb2YgXy5maWx0ZXIoKSBmdW5jdGlvblxuXHQvLyBzaW5jZSB0d2VlbuKAmXMgY2FsbGJhY2tzIGNhbiBhZGQgbmV3IGFuaW1hdGlvbnNcblx0Ly8gaW4gcnVudGltZS4gSW4gdGhpcyBjYXNlLCBmaWx0ZXIgZnVuY3Rpb24gd2lsbCBsb29zZVxuXHQvLyBuZXdseSBjcmVhdGVkIGFuaW1hdGlvblxuXHRmb3IgKHZhciBpID0gMDsgaSA8IGFuaW1zLmxlbmd0aDsgaSsrKSB7XG5cdFx0dHdlZW4gPSBhbmltc1tpXTtcblxuXHRcdGlmICghdHdlZW4uYW5pbWF0aW5nKSB7XG5cdFx0XHRjb250aW51ZTtcblx0XHR9XG5cblx0XHRvcHQgPSB0d2Vlbi5vcHRpb25zO1xuXG5cdFx0aWYgKHR3ZWVuLnN0YXJ0VGltZSA+IG5vdykge1xuXHRcdFx0ZmlsdGVyZWQucHVzaCh0d2Vlbik7XG5cdFx0XHRjb250aW51ZTtcblx0XHR9XG5cblx0XHRpZiAodHdlZW4uaW5maW5pdGUpIHtcblx0XHRcdC8vIG9wdC5zdGVwLmNhbGwodHdlZW4sIDApO1xuXHRcdFx0b3B0LnN0ZXAoMCwgdHdlZW4pO1xuXHRcdFx0ZmlsdGVyZWQucHVzaCh0d2Vlbik7XG5cdFx0fSBlbHNlIGlmICh0d2Vlbi5wb3MgPT09IDEgfHwgdHdlZW4uZW5kVGltZSA8PSBub3cpIHtcblx0XHRcdHR3ZWVuLnBvcyA9IDE7XG5cdFx0XHQvLyBvcHQuc3RlcC5jYWxsKHR3ZWVuLCBvcHQucmV2ZXJzZSA/IDAgOiAxKTtcblx0XHRcdG9wdC5zdGVwKG9wdC5yZXZlcnNlID8gMCA6IDEsIHR3ZWVuKTtcblx0XHRcdHR3ZWVuLnN0b3AoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dHdlZW4ucG9zID0gb3B0LmVhc2luZyhub3cgLSB0d2Vlbi5zdGFydFRpbWUsIDAsIDEsIG9wdC5kdXJhdGlvbik7XG5cdFx0XHQvLyBvcHQuc3RlcC5jYWxsKHR3ZWVuLCBvcHQucmV2ZXJzZSA/IDEgLSB0d2Vlbi5wb3MgOiB0d2Vlbi5wb3MpO1xuXHRcdFx0b3B0LnN0ZXAob3B0LnJldmVyc2UgPyAxIC0gdHdlZW4ucG9zIDogdHdlZW4ucG9zLCB0d2Vlbik7XG5cdFx0XHRmaWx0ZXJlZC5wdXNoKHR3ZWVuKTtcblx0XHR9XHRcdFx0XG5cdH1cblxuXHRhbmltcyA9IGZpbHRlcmVkO1xuXG5cdGlmIChhbmltcy5sZW5ndGgpIHtcblx0XHRyZXF1ZXN0QW5pbWF0aW9uRnJhbWUobWFpbkxvb3ApO1xuXHR9XG59XG5cbmZ1bmN0aW9uIGFkZFRvUXVldWUodHdlZW4pIHtcblx0aWYgKGluZGV4T2YoYW5pbXMsIHR3ZWVuKSA9PSAtMSkge1xuXHRcdGFuaW1zLnB1c2godHdlZW4pO1xuXHRcdGlmIChhbmltcy5sZW5ndGggPT0gMSkge1xuXHRcdFx0bWFpbkxvb3AoKTtcblx0XHR9XG5cdH1cbn1cblxuZXhwb3J0IGNsYXNzIFR3ZWVuIHtcblx0Y29uc3RydWN0b3Iob3B0aW9ucykge1xuXHRcdHRoaXMub3B0aW9ucyA9IGV4dGVuZCh7fSwgZGVmYXVsdHMsIG9wdGlvbnMpO1xuXHRcblx0XHR2YXIgZSA9IHRoaXMub3B0aW9ucy5lYXNpbmc7XG5cdFx0aWYgKHR5cGVvZiBlID09ICdzdHJpbmcnKSB7XG5cdFx0XHRpZiAoIWVhc2luZ3NbZV0pXG5cdFx0XHRcdHRocm93ICdVbmtub3duIFwiJyArIGUgKyAnXCIgZWFzaW5nIGZ1bmN0aW9uJztcblx0XHRcdHRoaXMub3B0aW9ucy5lYXNpbmcgPSBlYXNpbmdzW2VdO1xuXHRcdH1cblx0XHRcblx0XHRpZiAodHlwZW9mIHRoaXMub3B0aW9ucy5lYXNpbmcgIT0gJ2Z1bmN0aW9uJylcblx0XHRcdHRocm93ICdFYXNpbmcgc2hvdWxkIGJlIGEgZnVuY3Rpb24nO1xuXG5cdFx0dGhpcy5faWQgPSAndHcnICsgKGlkQ291bnRlcisrKTtcblx0XHRcblx0XHRpZiAodGhpcy5vcHRpb25zLmF1dG9zdGFydCkge1xuXHRcdFx0dGhpcy5zdGFydCgpO1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBTdGFydCBhbmltYXRpb24gZnJvbSB0aGUgYmVnaW5uaW5nXG5cdCAqL1xuXHRzdGFydCgpIHtcblx0XHRpZiAoIXRoaXMuYW5pbWF0aW5nKSB7XG5cdFx0XHR0aGlzLnBvcyA9IDA7XG5cdFx0XHR0aGlzLnN0YXJ0VGltZSA9IHRpbWUoKSArICh0aGlzLm9wdGlvbnMuZGVsYXkgfHwgMCk7XG5cdFx0XHR0aGlzLmluZmluaXRlID0gdGhpcy5vcHRpb25zLmR1cmF0aW9uID09PSAnaW5maW5pdGUnO1xuXHRcdFx0dGhpcy5lbmRUaW1lID0gdGhpcy5pbmZpbml0ZSA/IDAgOiB0aGlzLnN0YXJ0VGltZSArIHRoaXMub3B0aW9ucy5kdXJhdGlvbjtcblx0XHRcdHRoaXMuYW5pbWF0aW5nID0gdHJ1ZTtcblx0XHRcdHRoaXMub3B0aW9ucy5zdGFydCh0aGlzKTtcblx0XHRcdGFkZFRvUXVldWUodGhpcyk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cblxuXHQvKipcblx0ICogU3RvcCBhbmltYXRpb25cblx0ICovXG5cdHN0b3AoKSB7XG5cdFx0aWYgKHRoaXMuYW5pbWF0aW5nKSB7XG5cdFx0XHR0aGlzLmFuaW1hdGluZyA9IGZhbHNlO1xuXHRcdFx0aWYgKHRoaXMub3B0aW9ucy5jb21wbGV0ZSkge1xuXHRcdFx0XHR0aGlzLm9wdGlvbnMuY29tcGxldGUodGhpcyk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiB0aGlzO1xuXHR9XG5cblx0dG9nZ2xlKCkge1xuXHRcdGlmICh0aGlzLmFuaW1hdGluZykge1xuXHRcdFx0dGhpcy5zdG9wKCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuc3RhcnQoKTtcblx0XHR9XG5cdH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gdHdlZW4ob3B0aW9ucykge1xuXHRyZXR1cm4gbmV3IFR3ZWVuKG9wdGlvbnMpO1xufVxuXG4vKipcbiAqIEdldCBvciBzZXQgZGVmYXVsdCB2YWx1ZVxuICogQHBhcmFtICB7U3RyaW5nfSBuYW1lXG4gKiBAcGFyYW0gIHtPYmplY3R9IHZhbHVlXG4gKiBAcmV0dXJuIHtPYmplY3R9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZWZhdWx0cyhuYW1lLCB2YWx1ZSkge1xuXHRpZiAodHlwZW9mIHZhbHVlICE9ICd1bmRlZmluZWQnKSB7XG5cdFx0ZGVmYXVsdHNbbmFtZV0gPSB2YWx1ZTtcblx0fVxuXG5cdHJldHVybiBkZWZhdWx0c1tuYW1lXTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGFsbCBhY3RpdmUgYW5pbWF0aW9uIG9iamVjdHMuXG4gKiBGb3IgZGVidWdnaW5nIG1vc3RseVxuICogQHJldHVybiB7QXJyYXl9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBfYWxsKCkge1xuXHRyZXR1cm4gYW5pbXM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzdG9wKCkge1xuXHRmb3IgKHZhciBpID0gMDsgaSA8IGFuaW1zLmxlbmd0aDsgaSsrKSB7XG5cdFx0YW5pbXNbaV0uc3RvcCgpO1xuXHR9XG5cblx0YW5pbXMubGVuZ3RoID0gMDtcbn07IiwiLyoqXG4gKiBNb2R1bGUgdGhhdCBjcmVhdGVzIGxpc3Qgb2YgYWN0aW9uIGhpbnRzIGFuZCBoaWdobGlnaHRzIGl0ZW1zIHdoZW4gc3BlY2lmaWVkXG4gKiBhY3Rpb24gaXMgcGVyZm9ybWVkXG4gKi9cblwidXNlIHN0cmljdFwiO1xuXG5pbXBvcnQgKiBhcyBkb20gZnJvbSAnLi4vZG9tJztcbmltcG9ydCB7dGVtcGxhdGUsIGZpbmQsIHRvQXJyYXksIGV4dGVuZH0gZnJvbSAnLi4vdXRpbHMnO1xuXG5leHBvcnQgdmFyIGRlZmF1bHRPcHRpb25zID0ge1xuXHR3cmFwcGVyVGVtcGxhdGU6ICc8dWwgY2xhc3M9XCJDb2RlTWlycm9yLW91dGxpbmVcIj48JT0gY29udGVudCAlPjwvdWw+Jyxcblx0aXRlbVRlbXBsYXRlOiAnPGxpIGRhdGEtYWN0aW9uLWlkPVwiPCU9IGlkICU+XCIgY2xhc3M9XCJDb2RlTWlycm9yLW91dGxpbmVfX2l0ZW1cIj48JT0gdGl0bGUgJT48L2xpPicsXG5cdGl0ZW1DbGFzczogJ0NvZGVNaXJyb3Itb3V0bGluZV9faXRlbScsXG5cdHNlbGVjdGVkQ2xhc3M6ICdDb2RlTWlycm9yLW91dGxpbmVfX2l0ZW1fc2VsZWN0ZWQnXG59O1xuXHRcbi8qKlxuICogQHBhcmFtIHtPYmplY3R9IGhpbnRzXG4gKiBAcGFyYW0ge1NjZW5hcmlvfSBzY2VuYXJpb1xuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24oaGludHMsIHNjZW5hcmlvLCBvcHRpb25zPXt9KSB7XG5cdG9wdGlvbnMgPSBleHRlbmQoe30sIGRlZmF1bHRPcHRpb25zLCBvcHRpb25zKTtcblx0XG5cdHZhciBoaW50S2V5cyA9IE9iamVjdC5rZXlzKGhpbnRzKS5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtcblx0XHRyZXR1cm4gYSAtIGI7XG5cdH0pO1xuXHRcblx0dmFyIGl0ZW1UZW1wbGF0ZSA9IHRlbXBsYXRlKG9wdGlvbnMuaXRlbVRlbXBsYXRlKTtcblx0dmFyIGl0ZW1zID0gaGludEtleXMubWFwKGtleSA9PiBpdGVtVGVtcGxhdGUoe3RpdGxlOiBoaW50c1trZXldLCBpZDoga2V5fSkpO1xuXHRcblx0dmFyIGVsID0gZG9tLnRvRE9NKHRlbXBsYXRlKG9wdGlvbnMud3JhcHBlclRlbXBsYXRlLCB7XG5cdFx0Y29udGVudDogaXRlbXMuam9pbignJylcblx0fSkpO1xuXHRcblx0aWYgKG9wdGlvbnMudGFyZ2V0KSB7XG5cdFx0b3B0aW9ucy50YXJnZXQuYXBwZW5kQ2hpbGQoZWwpO1xuXHR9XG5cdFxuXHRzY2VuYXJpb1xuXHRcdC5vbignYWN0aW9uJywgZnVuY3Rpb24oaWQpIHtcblx0XHRcdHZhciBpdGVtcyA9IHRvQXJyYXkoZWwucXVlcnlTZWxlY3RvckFsbCgnLicgKyBvcHRpb25zLml0ZW1DbGFzcykpO1xuXHRcdFx0dmFyIG1hdGNoZWRJdGVtID0gZmluZChpdGVtcywgZWxlbSA9PiBlbGVtLmdldEF0dHJpYnV0ZSgnZGF0YS1hY3Rpb24taWQnKSA9PSBpZCk7XG5cdFx0XHRcblx0XHRcdGlmIChtYXRjaGVkSXRlbSkge1xuXHRcdFx0XHRpdGVtcy5mb3JFYWNoKGl0ZW0gPT4gaXRlbS5jbGFzc0xpc3QucmVtb3ZlKG9wdGlvbnMuc2VsZWN0ZWRDbGFzcykpO1xuXHRcdFx0XHRtYXRjaGVkSXRlbS5jbGFzc0xpc3QuYWRkKG9wdGlvbnMuc2VsZWN0ZWRDbGFzcyk7XG5cdFx0XHR9XG5cdFx0fSlcblx0XHQub24oJ3N0b3AnLCBmdW5jdGlvbigpIHtcblx0XHRcdHRvQXJyYXkoZWwucXVlcnlTZWxlY3RvckFsbCgnLicgKyBvcHRpb25zLml0ZW1DbGFzcykpXG5cdFx0XHQuZm9yRWFjaChpdGVtID0+IGl0ZW0uY2xhc3NMaXN0LnJlbW92ZShvcHRpb25zLnNlbGVjdGVkQ2xhc3MpKTtcblx0XHR9KTtcblx0XG5cdHJldHVybiBlbDtcbn07IiwiLyoqXG4gKiBTaG93cyBmYWtlIHByb21wdCBkaWFsb2cgd2l0aCBpbnRlcmFjdGl2ZSB2YWx1ZSB0eXBpbmdcbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbmltcG9ydCB0d2VlbiBmcm9tICcuLi92ZW5kb3IvdHdlZW4nO1xuaW1wb3J0IHtleHRlbmQsIHRlbXBsYXRlLCBoYXMzZCwgcHJlZml4ZWR9IGZyb20gJy4uL3V0aWxzJztcbmltcG9ydCAqIGFzIGRvbSBmcm9tICcuLi9kb20nO1xuXG52YXIgZGlhbG9nSW5zdGFuY2UgPSBudWxsO1xudmFyIGJnSW5zdGFuY2UgPSBudWxsO1xudmFyIGxhc3RUd2VlbiA9IG51bGw7XG5cbmV4cG9ydCB2YXIgYWN0aW9ucyA9IHtcblx0cHJvbXB0KG9wdGlvbnMsIGVkaXRvciwgbmV4dCwgdGltZXIpIHtcblx0XHRvcHRpb25zID0gZXh0ZW5kKHtcblx0XHRcdHRpdGxlOiAnRW50ZXIgc29tZXRoaW5nJyxcblx0XHRcdGRlbGF5OiA4MCwgICAgICAgIC8vIGRlbGF5IGJldHdlZW4gY2hhcmFjdGVyIHR5cGluZ1xuXHRcdFx0dHlwZURlbGF5OiAxMDAwLCAgLy8gdGltZSB0byB3YWl0IGJlZm9yZSB0eXBpbmcgdGV4dFxuXHRcdFx0aGlkZURlbGF5OiAyMDAwICAgLy8gdGltZSB0byB3YWl0IGJlZm9yZSBoaWRpbmcgcHJvbXB0IGRpYWxvZ1xuXHRcdH0sIHdyYXAoJ3RleHQnLCBvcHRpb25zKSk7XG5cdFx0XG5cdFx0c2hvdyhvcHRpb25zLnRpdGxlLCBlZGl0b3IuZ2V0V3JhcHBlckVsZW1lbnQoKSwgZnVuY3Rpb24oZGlhbG9nKSB7XG5cdFx0XHR0aW1lcihmdW5jdGlvbigpIHtcblx0XHRcdFx0dHlwZVRleHQoZGlhbG9nLnF1ZXJ5U2VsZWN0b3IoJy5Db2RlTWlycm9yLXByb21wdF9faW5wdXQnKSwgb3B0aW9ucywgdGltZXIsIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdHRpbWVyKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0aGlkZShuZXh0KTtcblx0XHRcdFx0XHR9LCBvcHRpb25zLmhpZGVEZWxheSk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSwgb3B0aW9ucy50eXBlRGVsYXkpO1xuXHRcdH0pO1xuXHR9XG59O1xuXG5leHBvcnQgZnVuY3Rpb24gc2hvdyh0ZXh0LCB0YXJnZXQsIGNhbGxiYWNrKSB7XG5cdGhpZGUoKTtcblx0ZGlhbG9nSW5zdGFuY2UgPSBkb20udG9ET00oYDxkaXYgY2xhc3M9XCJDb2RlTWlycm9yLXByb21wdFwiPlxuXHRcdDxkaXYgY2xhc3M9XCJDb2RlTWlycm9yLXByb21wdF9fdGl0bGVcIj4ke3RleHR9PC9kaXY+XG5cdFx0PGlucHV0IHR5cGU9XCJ0ZXh0XCIgbmFtZT1cInByb21wdFwiIGNsYXNzPVwiQ29kZU1pcnJvci1wcm9tcHRfX2lucHV0XCIgcmVhZG9ubHk9XCJyZWFkb25seVwiIC8+XG5cdFx0PC9kaXY+YCk7XG5cdGJnSW5zdGFuY2UgPSBkb20udG9ET00oJzxkaXYgY2xhc3M9XCJDb2RlTWlycm9yLXByb21wdF9fc2hhZGVcIj48L2Rpdj4nKTtcblx0XG5cdHRhcmdldC5hcHBlbmRDaGlsZChkaWFsb2dJbnN0YW5jZSk7XG5cdHRhcmdldC5hcHBlbmRDaGlsZChiZ0luc3RhbmNlKTtcblx0XG5cdGFuaW1hdGVTaG93KGRpYWxvZ0luc3RhbmNlLCBiZ0luc3RhbmNlLCB7Y29tcGxldGU6IGNhbGxiYWNrfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBoaWRlKGNhbGxiYWNrKSB7XG5cdGlmIChkaWFsb2dJbnN0YW5jZSkge1xuXHRcdGlmIChsYXN0VHdlZW4pIHtcblx0XHRcdGxhc3RUd2Vlbi5zdG9wKCk7XG5cdFx0XHRsYXN0VHdlZW4gPSBudWxsO1xuXHRcdH1cblx0XHRhbmltYXRlSGlkZShkaWFsb2dJbnN0YW5jZSwgYmdJbnN0YW5jZSwge2NvbXBsZXRlOiBjYWxsYmFja30pO1xuXHRcdGRpYWxvZ0luc3RhbmNlID0gYmdJbnN0YW5jZSA9IG51bGw7XG5cdH0gZWxzZSBpZiAoY2FsbGJhY2spIHtcblx0XHRjYWxsYmFjaygpO1xuXHR9XG59XG5cbi8qKlxuICogQHBhcmFtIHtFbGVtZW50fSBkaWFsb2dcbiAqIEBwYXJhbSB7RWxlbWVudH0gYmdcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIFxuICovXG5mdW5jdGlvbiBhbmltYXRlU2hvdyhkaWFsb2csIGJnLCBvcHRpb25zPXt9KSB7XG5cdHZhciBjc3NUcmFuc2Zvcm0gPSBwcmVmaXhlZCgndHJhbnNmb3JtJyk7XG5cdHZhciBkaWFsb2dTdHlsZSA9IGRpYWxvZy5zdHlsZTtcblx0dmFyIGJnU3R5bGUgPSBiZy5zdHlsZTtcblx0dmFyIGhlaWdodCA9IGRpYWxvZy5vZmZzZXRIZWlnaHQ7XG5cdHZhciB0bXBsID0gdGVtcGxhdGUoaGFzM2QgPyAndHJhbnNsYXRlM2QoMCwgPCU9IHBvcyAlPiwgMCknIDogJ3RyYW5zbGF0ZSgwLCA8JT0gcG9zICU+KScpO1xuXG5cdGJnU3R5bGUub3BhY2l0eSA9IDA7XG5cdHR3ZWVuKHtcblx0XHRkdXJhdGlvbjogMjAwLFxuXHRcdHN0ZXAocG9zKSB7XG5cdFx0XHRiZ1N0eWxlLm9wYWNpdHkgPSBwb3M7XG5cdFx0fVxuXHR9KTtcblx0XG5cdGRpYWxvZ1N0eWxlW2Nzc1RyYW5zZm9ybV0gPSB0bXBsKHtwb3M6IC1oZWlnaHR9KTtcblx0XG5cdHJldHVybiBsYXN0VHdlZW4gPSB0d2Vlbih7XG5cdFx0ZHVyYXRpb246IDQwMCxcblx0XHRlYXNpbmc6ICdvdXRDdWJpYycsXG5cdFx0c3RlcChwb3MpIHtcblx0XHRcdGRpYWxvZ1N0eWxlW2Nzc1RyYW5zZm9ybV0gPSB0bXBsKHtwb3M6ICgtaGVpZ2h0ICogKDEgLSBwb3MpKSArICdweCd9KTtcblx0XHR9LFxuXHRcdGNvbXBsZXRlOiBmdW5jdGlvbigpIHtcblx0XHRcdGxhc3RUd2VlbiA9IG51bGw7XG5cdFx0XHRvcHRpb25zLmNvbXBsZXRlICYmIG9wdGlvbnMuY29tcGxldGUoZGlhbG9nLCBiZyk7XG5cdFx0fVxuXHR9KTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGRpYWxvZ1xuICogQHBhcmFtIHtFbGVtZW50fSBiZ1xuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqL1xuZnVuY3Rpb24gYW5pbWF0ZUhpZGUoZGlhbG9nLCBiZywgb3B0aW9ucykge1xuXHR2YXIgZGlhbG9nU3R5bGUgPSBkaWFsb2cuc3R5bGU7XG5cdHZhciBiZ1N0eWxlID0gYmcuc3R5bGU7XG5cdHZhciBoZWlnaHQgPSBkaWFsb2cub2Zmc2V0SGVpZ2h0O1xuXHR2YXIgY3NzVHJhbnNmb3JtID0gcHJlZml4ZWQoJ3RyYW5zZm9ybScpO1xuXHR2YXIgdG1wbCA9IHRlbXBsYXRlKGhhczNkID8gJ3RyYW5zbGF0ZTNkKDAsIDwlPSBwb3MgJT4sIDApJyA6ICd0cmFuc2xhdGUoMCwgPCU9IHBvcyAlPiknKTtcblxuXHRyZXR1cm4gdHdlZW4oe1xuXHRcdGR1cmF0aW9uOiAyMDAsXG5cdFx0c3RlcChwb3MpIHtcblx0XHRcdGRpYWxvZ1N0eWxlW2Nzc1RyYW5zZm9ybV0gPSB0bXBsKHtwb3M6ICgtaGVpZ2h0ICogcG9zKSArICdweCd9KTtcblx0XHRcdGJnU3R5bGUub3BhY2l0eSA9IDEgLSBwb3M7XG5cdFx0fSxcblx0XHRjb21wbGV0ZSgpIHtcblx0XHRcdGRvbS5yZW1vdmUoW2RpYWxvZywgYmddKTtcblx0XHRcdG9wdGlvbnMuY29tcGxldGUgJiYgb3B0aW9ucy5jb21wbGV0ZShkaWFsb2csIGJnKTtcblx0XHR9XG5cdH0pO1xufVxuXG5mdW5jdGlvbiB0eXBlVGV4dCh0YXJnZXQsIG9wdGlvbnMsIHRpbWVyLCBuZXh0KSB7XG5cdHZhciBjaGFycyA9IG9wdGlvbnMudGV4dC5zcGxpdCgnJyk7XG5cdHRpbWVyKGZ1bmN0aW9uIHBlcmZvcm0oKSB7XG5cdFx0dGFyZ2V0LnZhbHVlICs9IGNoYXJzLnNoaWZ0KCk7XG5cdFx0aWYgKGNoYXJzLmxlbmd0aCkge1xuXHRcdFx0dGltZXIocGVyZm9ybSwgb3B0aW9ucy5kZWxheSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdG5leHQoKTtcblx0XHR9XG5cdH0sIG9wdGlvbnMuZGVsYXkpO1xufVxuXG5mdW5jdGlvbiB3cmFwKGtleSwgdmFsdWUpIHtcblx0cmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgPyB2YWx1ZSA6IHtba2V5XTogdmFsdWV9O1xufSIsIi8qKlxuICogRXh0ZW5zaW9uIHRoYXQgYWxsb3dzIGF1dGhvcnMgdG8gZGlzcGxheSBjb250ZXh0IHRvb2x0aXBzIGJvdW5kIHRvIHNwZWNpZmljXG4gKiBwb3NpdGlvbnNcbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbmltcG9ydCB0d2VlbiBmcm9tICcuLi92ZW5kb3IvdHdlZW4nO1xuaW1wb3J0IHtleHRlbmQsIHByZWZpeGVkLCBtYWtlUG9zLCBoYXMzZH0gZnJvbSAnLi4vdXRpbHMnO1xuaW1wb3J0ICogYXMgZG9tIGZyb20gJy4uL2RvbSc7XG5cbnZhciBpbnN0YW5jZSA9IG51bGw7XG52YXIgbGFzdFR3ZWVuID0gbnVsbDtcblxuZXhwb3J0IHZhciBhbGlnbkRlZmF1bHRzID0ge1xuXHQvKiogQ1NTIHNlbGVjdG9yIGZvciBnZXR0aW5nIHBvcHVwIHRhaWwgKi9cblx0dGFpbENsYXNzOiAnQ29kZU1pcnJvci10b29sdGlwX190YWlsJyxcblx0XG5cdC8qKiBDbGFzcyBuYW1lIGZvciBzd2l0Y2hpbmcgdGFpbC9wb3B1cCBwb3NpdGlvbiByZWxhdGl2ZSB0byB0YXJnZXQgcG9pbnQgKi9cblx0YmVsb3dDbGFzczogJ0NvZGVNaXJyb3ItdG9vbHRpcF9iZWxvdycsXG5cdFxuXHQvKiogTWluIGRpc3RhbmNlIGJldHdlZW4gcG9wdXAgYW5kIHZpZXdwb3J0ICovXG5cdHBvcHVwTWFyZ2luOiA1LFxuXHRcblx0LyoqIE1pbiBkaXN0YW5jZSBiZXR3ZWVuIHBvcHVwIGxlZnQvcmlnaHQgZWRnZSBhbmQgaXRzIHRhaWwgKi9cblx0dGFpbE1hcmdpbjogMTFcbn07XG5cbmV4cG9ydCB2YXIgYWN0aW9ucyA9IHtcblx0LyoqXG5cdCAqIFNob3dzIHRvb2x0aXAgd2l0aCBnaXZlbiB0ZXh0LCB3YWl0IGZvciBgb3B0aW9ucy53YWl0YFxuXHQgKiBtaWxsaXNlY29uZHMgdGhlbiBoaWRlcyB0b29sdGlwXG5cdCAqL1xuXHR0b29sdGlwKG9wdGlvbnMsIGVkaXRvciwgbmV4dCwgdGltZXIpIHtcblx0XHRvcHRpb25zID0gZXh0ZW5kKHtcblx0XHRcdHdhaXQ6IDQwMDAsICAgLy8gdGltZSB0byB3YWl0IGJlZm9yZSBoaWRpbmcgdG9vbHRpcFxuXHRcdFx0cG9zOiAnY2FyZXQnICAvLyBwb3NpdGlvbiB3aGVyZSB0b29sdGlwIHNob3VsZCBwb2ludCB0b1xuXHRcdH0sIHdyYXAoJ3RleHQnLCBvcHRpb25zKSk7XG5cdFx0XG5cdFx0dmFyIHBvcyA9IHJlc29sdmVQb3NpdGlvbihvcHRpb25zLnBvcywgZWRpdG9yKTtcblx0XHRzaG93KG9wdGlvbnMudGV4dCwgcG9zLCBmdW5jdGlvbigpIHtcblx0XHRcdHRpbWVyKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRoaWRlKCgpID0+IHRpbWVyKG5leHQpKTtcblx0XHRcdH0sIG9wdGlvbnMud2FpdCk7XG5cdFx0fSk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIFNob3dzIHRvb2x0aXAgd2l0aCBzcGVjaWZpZWQgdGV4dC4gVGhpcyB0b29sdGlwIHNob3VsZCBiZSBleHBsaWNpdGx5IFxuXHQgKiBoaWRkZW4gd2l0aCBgaGlkZVRvb2x0aXBgIGFjdGlvblxuXHQgKi9cblx0c2hvd1Rvb2x0aXAob3B0aW9ucywgZWRpdG9yLCBuZXh0LCB0aW1lcikge1xuXHRcdG9wdGlvbnMgPSBleHRlbmQoe1xuXHRcdFx0cG9zOiAnY2FyZXQnICAvLyBwb3NpdGlvbiB3aGVyZSB0b29sdGlwIHNob3VsZCBwb2ludCB0b1xuXHRcdH0sIHdyYXAoJ3RleHQnLCBvcHRpb25zKSk7XG5cdFx0XG5cdFx0c2hvdyhvcHRpb25zLnRleHQsIHJlc29sdmVQb3NpdGlvbihvcHRpb25zLnBvcywgZWRpdG9yKSk7XG5cdFx0bmV4dCgpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBIaWRlcyB0b29sdGlwLCBwcmV2aW91c2x5IHNob3duIGJ5ICdzaG93VG9vbHRpcCcgYWN0aW9uXG5cdCAqL1xuXHRoaWRlVG9vbHRpcChvcHRpb25zLCBlZGl0b3IsIG5leHQsIHRpbWVyKSB7XG5cdFx0aGlkZShuZXh0KTtcblx0fVxufTtcblxuZXhwb3J0IGZ1bmN0aW9uIHNob3codGV4dCwgcG9zLCBjYWxsYmFjaykge1xuXHRoaWRlKCk7XG5cdFxuXHRpbnN0YW5jZSA9IGRvbS50b0RPTShgPGRpdiBjbGFzcz1cIkNvZGVNaXJyb3ItdG9vbHRpcFwiPlxuXHRcdDxkaXYgY2xhc3M9XCJDb2RlTWlycm9yLXRvb2x0aXBfX2NvbnRlbnRcIj4ke3RleHR9PC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cIkNvZGVNaXJyb3ItdG9vbHRpcF9fdGFpbFwiPjwvZGl2PlxuXHRcdDwvZGl2PmApO1xuXHRcblx0ZG9tLmNzcyhpbnN0YW5jZSwgcHJlZml4ZWQoJ3RyYW5zZm9ybScpLCAnc2NhbGUoMCknKTtcblx0ZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChpbnN0YW5jZSk7XG5cdFxuXHRhbGlnblBvcHVwV2l0aFRhaWwoaW5zdGFuY2UsIHtwb3NpdGlvbjogcG9zfSk7XG5cdGFuaW1hdGVTaG93KGluc3RhbmNlLCB7Y29tcGxldGU6IGNhbGxiYWNrfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBoaWRlKGNhbGxiYWNrKSB7XG5cdGlmIChpbnN0YW5jZSkge1xuXHRcdGlmIChsYXN0VHdlZW4pIHtcblx0XHRcdGxhc3RUd2Vlbi5zdG9wKCk7XG5cdFx0XHRsYXN0VHdlZW4gPSBudWxsO1xuXHRcdH1cblx0XHRhbmltYXRlSGlkZShpbnN0YW5jZSwge2NvbXBsZXRlOiBjYWxsYmFja30pO1xuXHRcdGluc3RhbmNlID0gbnVsbDtcblx0fSBlbHNlIGlmIChjYWxsYmFjaykge1xuXHRcdGNhbGxiYWNrKCk7XG5cdH1cbn1cblxuLyoqXG4gKiBIZWxwZXIgZnVuY3Rpb24gdGhhdCBmaW5kcyBvcHRpbWFsIHBvc2l0aW9uIG9mIHRvb2x0aXAgcG9wdXAgb24gcGFnZVxuICogYW5kIGFsaWducyBwb3B1cCB0YWlsIHdpdGggdGhpcyBwb3NpdGlvblxuICogQHBhcmFtIHtFbGVtZW50fSBwb3B1cFxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqL1xuZnVuY3Rpb24gYWxpZ25Qb3B1cFdpdGhUYWlsKHBvcHVwLCBvcHRpb25zPXt9KSB7XG5cdG9wdGlvbnMgPSBleHRlbmQoe30sIGFsaWduRGVmYXVsdHMsIG9wdGlvbnMpO1xuXHRcblx0ZG9tLmNzcyhwb3B1cCwge1xuXHRcdGxlZnQ6IDAsXG5cdFx0dG9wOiAwXG5cdH0pO1xuXHRcblx0dmFyIHRhaWwgPSBwb3B1cC5xdWVyeVNlbGVjdG9yKCcuJyArIG9wdGlvbnMudGFpbENsYXNzKTtcblx0XG5cdHZhciByZXN1bHRYID0gMCwgcmVzdWx0WSA9IDA7XG5cdHZhciBwb3MgPSBvcHRpb25zLnBvc2l0aW9uO1xuXHR2YXIgdnAgPSBkb20udmlld3BvcnRSZWN0KCk7XG5cdFxuXHR2YXIgd2lkdGggPSBwb3B1cC5vZmZzZXRXaWR0aDtcblx0dmFyIGhlaWdodCA9IHBvcHVwLm9mZnNldEhlaWdodDtcblx0XG5cdHZhciBpc1RvcDtcblx0XHRcblx0Ly8gY2FsY3VsYXRlIGhvcml6b250YWwgcG9zaXRpb25cblx0cmVzdWx0WCA9IE1hdGgubWluKHZwLndpZHRoIC0gd2lkdGggLSBvcHRpb25zLnBvcHVwTWFyZ2luLCBNYXRoLm1heChvcHRpb25zLnBvcHVwTWFyZ2luLCBwb3MueCAtIHZwLmxlZnQgLSB3aWR0aCAvIDIpKTtcblx0XG5cdC8vIGNhbGN1bGF0ZSB2ZXJ0aWNhbCBwb3NpdGlvblxuXHRpZiAoaGVpZ2h0ICsgdGFpbC5vZmZzZXRIZWlnaHQgKyBvcHRpb25zLnBvcHVwTWFyZ2luICsgdnAudG9wIDwgcG9zLnkpIHtcblx0XHQvLyBwbGFjZSBhYm92ZSB0YXJnZXQgcG9zaXRpb25cblx0XHRyZXN1bHRZID0gTWF0aC5tYXgoMCwgcG9zLnkgLSBoZWlnaHQgLSB0YWlsLm9mZnNldEhlaWdodCk7XG5cdFx0aXNUb3AgPSB0cnVlO1xuXHR9IGVsc2Uge1xuXHRcdC8vIHBsYWNlIGJlbG93IHRhcmdldCBwb3NpdGlvbiBcblx0XHRyZXN1bHRZID0gcG9zLnkgKyB0YWlsLm9mZnNldEhlaWdodDtcblx0XHRpc1RvcCA9IGZhbHNlO1xuXHR9XG5cdFxuXHQvLyBjYWxjdWxhdGUgdGFpbCBwb3NpdGlvblxuXHR2YXIgdGFpbE1pbkxlZnQgPSBvcHRpb25zLnRhaWxNYXJnaW47XG5cdHZhciB0YWlsTWF4TGVmdCA9IHdpZHRoIC0gb3B0aW9ucy50YWlsTWFyZ2luO1xuXHR0YWlsLnN0eWxlLmxlZnQgPSBNYXRoLm1pbih0YWlsTWF4TGVmdCwgTWF0aC5tYXgodGFpbE1pbkxlZnQsIHBvcy54IC0gcmVzdWx0WCAtIHZwLmxlZnQpKSArICdweCc7XG5cdFxuXHRkb20uY3NzKHBvcHVwLCB7XG5cdFx0bGVmdDogcmVzdWx0WCxcblx0XHR0b3A6IHJlc3VsdFlcblx0fSk7XG5cdFxuXHRwb3B1cC5jbGFzc0xpc3QudG9nZ2xlKG9wdGlvbnMuYmVsb3dDbGFzcywgIWlzVG9wKTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge2pRdWVyeX0gZWxlbVxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgXG4gKi9cbmZ1bmN0aW9uIGFuaW1hdGVTaG93KGVsZW0sIG9wdGlvbnM9e30pIHtcblx0b3B0aW9ucyA9IGV4dGVuZCh7fSwgYWxpZ25EZWZhdWx0cywgb3B0aW9ucyk7XG5cdHZhciBjc3NPcmlnaW4gPSBwcmVmaXhlZCgndHJhbnNmb3JtLW9yaWdpbicpO1xuXHR2YXIgY3NzVHJhbnNmb3JtID0gcHJlZml4ZWQoJ3RyYW5zZm9ybScpO1xuXHR2YXIgc3R5bGUgPSBlbGVtLnN0eWxlO1xuXG5cdHZhciB0YWlsID0gZWxlbS5xdWVyeVNlbGVjdG9yKCcuJyArIG9wdGlvbnMudGFpbENsYXNzKTtcblx0dmFyIHhPcmlnaW4gPSBkb20uY3NzKHRhaWwsICdsZWZ0Jyk7XG5cdHZhciB5T3JpZ2luID0gdGFpbC5vZmZzZXRUb3A7XG5cdGlmIChlbGVtLmNsYXNzTGlzdC5jb250YWlucyhvcHRpb25zLmJlbG93Q2xhc3MpKSB7XG5cdFx0eU9yaWdpbiAtPSB0YWlsLm9mZnNldEhlaWdodDtcblx0fVxuXHRcblx0eU9yaWdpbiArPSAncHgnO1xuXG5cdHN0eWxlW2Nzc09yaWdpbl0gPSB4T3JpZ2luICsgJyAnICsgeU9yaWdpbjtcblx0dmFyIHByZWZpeCA9IGhhczNkID8gJ3RyYW5zbGF0ZVooMCkgJyA6ICcnO1xuXHRcblx0cmV0dXJuIGxhc3RUd2VlbiA9IHR3ZWVuKHtcblx0XHRkdXJhdGlvbjogODAwLFxuXHRcdGVhc2luZzogJ291dEVsYXN0aWMnLFxuXHRcdHN0ZXAocG9zKSB7XG5cdFx0XHRzdHlsZVtjc3NUcmFuc2Zvcm1dID0gcHJlZml4ICsgJ3NjYWxlKCcgKyBwb3MgKyAnKSc7XG5cdFx0fSxcblx0XHRjb21wbGV0ZSgpIHtcblx0XHRcdHN0eWxlW2Nzc1RyYW5zZm9ybV0gPSAnbm9uZSc7XG5cdFx0XHRsYXN0VHdlZW4gPSBudWxsO1xuXHRcdFx0b3B0aW9ucy5jb21wbGV0ZSAmJiBvcHRpb25zLmNvbXBsZXRlKGVsZW0pO1xuXHRcdH1cblx0fSk7XG59XG5cbi8qKlxuICogQHBhcmFtIHtqUXVlcnl9IGVsZW1cbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKi9cbmZ1bmN0aW9uIGFuaW1hdGVIaWRlKGVsZW0sIG9wdGlvbnMpIHtcblx0dmFyIHN0eWxlID0gZWxlbS5zdHlsZTtcblxuXHRyZXR1cm4gdHdlZW4oe1xuXHRcdGR1cmF0aW9uOiAyMDAsXG5cdFx0ZWFzaW5nOiAnbGluZWFyJyxcblx0XHRzdGVwOiBmdW5jdGlvbihwb3MpIHtcblx0XHRcdHN0eWxlLm9wYWNpdHkgPSAoMSAtIHBvcyk7XG5cdFx0fSxcblx0XHRjb21wbGV0ZTogZnVuY3Rpb24oKSB7XG5cdFx0XHRkb20ucmVtb3ZlKGVsZW0pO1xuXHRcdFx0b3B0aW9ucy5jb21wbGV0ZSAmJiBvcHRpb25zLmNvbXBsZXRlKGVsZW0pO1xuXHRcdH1cblx0fSk7XG59XG5cbi8qKlxuICogUmVzb2x2ZXMgcG9zaXRpb24gd2hlcmUgdG9vbHRpcCBzaG91bGQgcG9pbnQgdG9cbiAqIEBwYXJhbSB7T2JqZWN0fSBwb3NcbiAqIEBwYXJhbSB7Q29kZU1pcnJvcn0gZWRpdG9yXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBPYmplY3Qgd2l0aCA8Y29kZT54PC9jb2RlPiBhbmQgPGNvZGU+eTwvY29kZT4gXG4gKiBwcm9wZXJ0aWVzXG4gKi9cbmZ1bmN0aW9uIHJlc29sdmVQb3NpdGlvbihwb3MsIGVkaXRvcikge1xuXHRpZiAocG9zID09PSAnY2FyZXQnKSB7XG5cdFx0Ly8gZ2V0IGFic29sdXRlIHBvc2l0aW9uIG9mIGN1cnJlbnQgY2FyZXQgcG9zaXRpb25cblx0XHRyZXR1cm4gc2FuaXRpemVDYXJldFBvcyhlZGl0b3IuY3Vyc29yQ29vcmRzKHRydWUpKTtcblx0fVxuXG5cdGlmICh0eXBlb2YgcG9zID09PSAnb2JqZWN0Jykge1xuXHRcdGlmICgneCcgaW4gcG9zICYmICd5JyBpbiBwb3MpIHtcblx0XHRcdC8vIHBhc3NlZCBhYnNvbHV0ZSBjb29yZGluYXRlc1xuXHRcdFx0cmV0dXJuIHBvcztcblx0XHR9XG5cblx0XHRpZiAoJ2xlZnQnIGluIHBvcyAmJiAndG9wJyBpbiBwb3MpIHtcblx0XHRcdC8vIHBhc3NlZCBhYnNvbHV0ZSBjb29yZGluYXRlc1xuXHRcdFx0cmV0dXJuIHNhbml0aXplQ2FyZXRQb3MocG9zKTtcblx0XHR9XG5cdH1cblx0XG5cdHBvcyA9IG1ha2VQb3MocG9zLCBlZGl0b3IpO1xuXHRyZXR1cm4gc2FuaXRpemVDYXJldFBvcyhlZGl0b3IuY2hhckNvb3Jkcyhwb3MpKTtcbn1cblxuZnVuY3Rpb24gc2FuaXRpemVDYXJldFBvcyhwb3MpIHtcblx0aWYgKCdsZWZ0JyBpbiBwb3MpIHtcblx0XHRwb3MueCA9IHBvcy5sZWZ0O1xuXHR9XG5cblx0aWYgKCd0b3AnIGluIHBvcykge1xuXHRcdHBvcy55ID0gcG9zLnRvcDtcblx0fVxuXG5cdHJldHVybiBwb3M7XG59XG5cbmZ1bmN0aW9uIHdyYXAoa2V5LCB2YWx1ZSkge1xuXHRyZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyA/IHZhbHVlIDoge1trZXldOiB2YWx1ZX07XG59Il19
