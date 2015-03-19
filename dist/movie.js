!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var o;"undefined"!=typeof window?o=window:"undefined"!=typeof global?o=global:"undefined"!=typeof self&&(o=self),o.CodeMirrorMovie=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

var _defineProperty = function (obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); };

var _utils = require("./utils");

var extend = _utils.extend;
var makePos = _utils.makePos;
var getCursor = _utils.getCursor;

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

		var curPos = getCursor(editor);
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
			curPos = getCursor(editor);
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
			if (typeof options.command === "function") {
				options.command(editor, options);
			} else {
				editor.execCommand(options.command);
			}

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
},{"./utils":5}],2:[function(require,module,exports){
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
Object.defineProperty(exports, "__esModule", {
	value: true
});
"use strict";

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
},{"./utils":5}],3:[function(require,module,exports){
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
Object.defineProperty(exports, "__esModule", {
	value: true
});
/**
 * A high-level library interface for creating scenarios over textarea
 * element. The <code>CodeMirror.movie</code> takes reference to textarea
 * element (or its ID) and parses its content for initial content value,
 * scenario and outline.
 */
"use strict";

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
	sectionSeparator: "@@@",

	/** Regular expression to extract outline from scenario line */
	outlineSeparator: /\s+:::\s+(.+)$/,

	/** Automatically prettify keyboard shortcuts in outline */
	prettifyKeys: true,

	/** Strip parentheses from prettyfied keyboard shortcut definition */
	stripParentheses: false
};exports.defaultOptions = defaultOptions;

function movie(target) {
	var movieOptions = arguments[1] === undefined ? {} : arguments[1];
	var editorOptions = arguments[2] === undefined ? {} : arguments[2];

	setupCodeMirror();

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
		preventCursorMovement: true
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

function setupCodeMirror() {
	if (typeof CodeMirror === "undefined" || "preventCursorMovement" in CodeMirror.defaults) {
		return;
	}

	CodeMirror.defineOption("preventCursorMovement", false, function (cm) {
		var handler = function (cm, event) {
			return cm.getOption("readOnly") && event.preventDefault();
		};
		cm.on("keydown", handler);
		cm.on("mousedown", handler);
	});
}

if (typeof CodeMirror !== "undefined") {
	CodeMirror.movie = movie;
}
},{"./scenario":4,"./utils":5,"./widgets/outline":7}],4:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

Object.defineProperty(exports, "__esModule", {
	value: true
});
"use strict";

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

var defaultOptions = {
	beforeDelay: 1000,
	afterDelay: 1000
};

exports.defaultOptions = defaultOptions;
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

	_createClass(Scenario, {
		_setup: {
			value: function _setup(editor) {
				if (!editor && this._editor) {
					editor = this._editor;
				}

				editor.execCommand("revert");
				return editor;
			}
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
			}
		},
		pause: {

			/**
    * Pause current scenario playback. It can be restored with 
    * <code>play()</code> method call 
    */

			value: function pause() {
				this._state = STATE_PAUSE;
				this.trigger("pause");
			}
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
			}
		},
		state: {

			/**
    * Returns current playback state
    * @return {String}
    */

			get: function () {
				return this._state;
			}
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
			}
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
			})
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
			}
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
			}
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
			}
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
},{"./actions":1,"./utils":5,"./widgets/prompt":8,"./widgets/tooltip":9}],5:[function(require,module,exports){
"use strict";

exports.extend = extend;
exports.toArray = toArray;

/**
 * Returns prefixed (if required) CSS property name
 * @param  {String} prop
 * @return {String}
 */
exports.prefixed = prefixed;
exports.posObj = posObj;
exports.getCursor = getCursor;

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
Object.defineProperty(exports, "__esModule", {
	value: true
});
var propCache = {};

// detect CSS 3D Transforms for smoother animations
var has3d = (function () {
	var el = document.createElement("div");
	var cssTransform = prefixed("transform");
	if (cssTransform) {
		el.style[cssTransform] = "translateZ(0)";
		return /translatez/i.test(el.style[cssTransform]);
	}

	return false;
})();

exports.has3d = has3d;

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

function posObj(obj) {
	return {
		line: obj.line,
		ch: obj.ch
	};
}

function getCursor(editor) {
	var start = arguments[1] === undefined ? "from" : arguments[1];

	return posObj(editor.getCursor(start));
}

function makePos(pos, editor) {
	if (pos === "caret") {
		return getCursor(editor);
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
		return posObj(editor.posFromIndex(pos));
	}

	return posObj(pos);
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
},{}],6:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

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
Object.defineProperty(exports, "__esModule", {
	value: true
});
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

var easings = {
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

exports.easings = easings;
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

	_createClass(Tween, {
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
			}
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
			}
		},
		toggle: {
			value: function toggle() {
				if (this.animating) {
					this.stop();
				} else {
					this.start();
				}
			}
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
},{}],7:[function(require,module,exports){
"use strict";

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { "default": obj }; };

Object.defineProperty(exports, "__esModule", {
	value: true
});
/**
 * Module that creates list of action hints and highlights items when specified
 * action is performed
 */
"use strict";

var dom = _interopRequireWildcard(require("../dom"));

var _utils = require("../utils");

var template = _utils.template;
var find = _utils.find;
var toArray = _utils.toArray;
var extend = _utils.extend;
var defaultOptions = {
	wrapperTemplate: "<ul class=\"CodeMirror-outline\"><%= content %></ul>",
	itemTemplate: "<li data-action-id=\"<%= id %>\" class=\"CodeMirror-outline__item\"><%= title %></li>",
	itemClass: "CodeMirror-outline__item",
	selectedClass: "CodeMirror-outline__item_selected"
};

exports.defaultOptions = defaultOptions;
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
},{"../dom":2,"../utils":5}],8:[function(require,module,exports){
"use strict";

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { "default": obj }; };

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _defineProperty = function (obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); };

exports.show = show;
exports.hide = hide;
Object.defineProperty(exports, "__esModule", {
	value: true
});
/**
 * Shows fake prompt dialog with interactive value typing
 */
"use strict";

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

var actions = {
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

exports.actions = actions;

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
},{"../dom":2,"../utils":5,"../vendor/tween":6}],9:[function(require,module,exports){
"use strict";

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { "default": obj }; };

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _defineProperty = function (obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); };

exports.show = show;
exports.hide = hide;
Object.defineProperty(exports, "__esModule", {
	value: true
});
/**
 * Extension that allows authors to display context tooltips bound to specific
 * positions
 */
"use strict";

var tween = _interopRequire(require("../vendor/tween"));

var _utils = require("../utils");

var extend = _utils.extend;
var prefixed = _utils.prefixed;
var makePos = _utils.makePos;
var has3d = _utils.has3d;

var dom = _interopRequireWildcard(require("../dom"));

var instance = null;
var lastTween = null;

var alignDefaults = {
	/** CSS selector for getting popup tail */
	tailClass: "CodeMirror-tooltip__tail",

	/** Class name for switching tail/popup position relative to target point */
	belowClass: "CodeMirror-tooltip_below",

	/** Min distance between popup and viewport */
	popupMargin: 5,

	/** Min distance between popup left/right edge and its tail */
	tailMargin: 11
};

exports.alignDefaults = alignDefaults;
var actions = {
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

exports.actions = actions;

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
},{"../dom":2,"../utils":5,"../vendor/tween":6}]},{},[3])(3)
});