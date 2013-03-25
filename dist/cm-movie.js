/**
 * requestAnimationFrame polyfill by Erik Möller
 * fixes from Paul Irish and Tino Zijdel
 * http://paulirish.com/2011/requestanimationframe-for-smart-animating/
 * http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
 */
(function() {
	var lastTime = 0;
	var vendors = [ 'ms', 'moz', 'webkit', 'o' ];
	for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
		window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
		window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame']
				|| window[vendors[x] + 'CancelRequestAnimationFrame'];
	}

	if (!window.requestAnimationFrame)
		window.requestAnimationFrame = function(callback, element) {
			var currTime = (new Date()).getTime();
			var timeToCall = Math.max(0, 16 - (currTime - lastTime));
			var id = window.setTimeout(function() {
				callback(currTime + timeToCall);
			}, timeToCall);
			lastTime = currTime + timeToCall;
			return id;
		};

	if (!window.cancelAnimationFrame)
		window.cancelAnimationFrame = function(id) {
			clearTimeout(id);
		};
}());

(function(global) {
	var dummyFn = function() {};
	var anims = [];
	
	var defaults = {
		duration: 500, // ms
		easing: 'linear',
		step: dummyFn,
		complete: dummyFn,
		autostart: true
	};
	
	var easings = {
		linear: function(t, b, c, d) {
			return c * t / d + b;
		},
		easeInQuad: function(t, b, c, d) {
			return c*(t/=d)*t + b;
		},
		easeOutQuad: function(t, b, c, d) {
			return -c *(t/=d)*(t-2) + b;
		},
		easeInOutQuad: function(t, b, c, d) {
			if((t/=d/2) < 1) return c/2*t*t + b;
			return -c/2 *((--t)*(t-2) - 1) + b;
		},
		easeInCubic: function(t, b, c, d) {
			return c*(t/=d)*t*t + b;
		},
		easeOutCubic: function(t, b, c, d) {
			return c*((t=t/d-1)*t*t + 1) + b;
		},
		easeInOutCubic: function(t, b, c, d) {
			if((t/=d/2) < 1) return c/2*t*t*t + b;
			return c/2*((t-=2)*t*t + 2) + b;
		},
		
		easeInExpo: function(t, b, c, d) {
			return(t==0) ? b : c * Math.pow(2, 10 *(t/d - 1)) + b - c * 0.001;
		},
		easeOutExpo: function(t, b, c, d) {
			return(t==d) ? b+c : c * 1.001 *(-Math.pow(2, -10 * t/d) + 1) + b;
		},
		easeInOutExpo: function(t, b, c, d) {
			if(t==0) return b;
			if(t==d) return b+c;
			if((t/=d/2) < 1) return c/2 * Math.pow(2, 10 *(t - 1)) + b - c * 0.0005;
			return c/2 * 1.0005 *(-Math.pow(2, -10 * --t) + 2) + b;
		},
		
		easeInElastic: function(t, b, c, d, a, p) {
			var s;
			if(t==0) return b;  if((t/=d)==1) return b+c;  if(!p) p=d*.3;
			if(!a || a < Math.abs(c)) { a=c; s=p/4; } else s = p/(2*Math.PI) * Math.asin(c/a);
			return -(a*Math.pow(2,10*(t-=1)) * Math.sin((t*d-s)*(2*Math.PI)/p )) + b;
		},
		easeOutElastic: function(t, b, c, d, a, p) {
			var s;
			if(t==0) return b;  if((t/=d)==1) return b+c;  if(!p) p=d*.3;
			if(!a || a < Math.abs(c)) { a=c; s=p/4; } else s = p/(2*Math.PI) * Math.asin(c/a);
			return(a*Math.pow(2,-10*t) * Math.sin((t*d-s)*(2*Math.PI)/p ) + c + b);
		},
		easeInOutElastic: function(t, b, c, d, a, p) {
			var s;
			if(t==0) return b; 
			if((t/=d/2)==2) return b+c;
			if(!p) p=d*(.3*1.5);
			if(!a || a < Math.abs(c)) { a=c; s=p/4; }       else s = p/(2*Math.PI) * Math.asin(c/a);
			if(t < 1) return -.5*(a*Math.pow(2,10*(t-=1)) * Math.sin((t*d-s)*(2*Math.PI)/p )) + b;
			return a*Math.pow(2,-10*(t-=1)) * Math.sin((t*d-s)*(2*Math.PI)/p )*.5 + c + b;
		},
		easeInBack: function(t, b, c, d, s) {
			if(s == undefined) s = 1.70158;
			return c*(t/=d)*t*((s+1)*t - s) + b;
		},
		easeOutBack: function(t, b, c, d, s) {
			if(s == undefined) s = 1.70158;
			return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
		},
		easeInOutBack: function(t, b, c, d, s) {
			if(s == undefined) s = 1.70158;
			if((t/=d/2) < 1) return c/2*(t*t*(((s*=(1.525))+1)*t - s)) + b;
			return c/2*((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2) + b;
		},
		easeInBounce: function(t, b, c, d) {
			return c - $.easing.easeOutBounce(x, d-t, 0, c, d) + b;
		},
		easeOutBounce: function(t, b, c, d) {
			if((t/=d) <(1/2.75)) {
				return c*(7.5625*t*t) + b;
			} else if(t <(2/2.75)) {
				return c*(7.5625*(t-=(1.5/2.75))*t + .75) + b;
			} else if(t <(2.5/2.75)) {
				return c*(7.5625*(t-=(2.25/2.75))*t + .9375) + b;
			} else {
				return c*(7.5625*(t-=(2.625/2.75))*t + .984375) + b;
			}
		},
		easeInOutBounce: function(t, b, c, d) {
			if(t < d/2) return $.easing.easeInBounce(x, t*2, 0, c, d) * .5 + b;
			return $.easing.easeOutBounce(x, t*2-d, 0, c, d) * .5 + c*.5 + b;
		}
	};
	
	function mainLoop() {
		if (!anims.length) {
			// no animations left, stop polling
			return;
		}
		
		var now = +new Date;
		var filtered = [], tween, opt;

		// do not use Array.filter() of _.filter() function
		// since tween’s callbacks can add new animations
		// in runtime. In this case, filter function will loose
		// newly created animation
		for (var i = 0; i < anims.length; i++) {
			tween = anims[i];
			var opt = tween.options;
			if (tween.pos === 1 || tween.endTime <= now) {
				opt.step.call(tween, tween.pos = 1);
				tween.stop();
			} else {
				tween.pos = opt.easing(now - tween.startTime, 0, 1, opt.duration);
				opt.step.call(tween, tween.pos);
				filtered.push(tween);
			}			
		};
	
		anims = filtered;

		if (anims.length) {
			requestAnimationFrame(mainLoop);
		}
	}
	
	function addToQueue(tween) {
		if (_.indexOf(anims, tween) == -1) {
			anims.push(tween);
			if (anims.length == 1)
				mainLoop();
		}
	}
	
	function Tween(options) {
		this.options = _.extend({}, defaults, options || {});
		
		var e = this.options.easing;
		if (_.isString(e)) {
			if (!easings[e])
				throw 'Unknown "' + e + '" easing function';
			this.options.easing = easings[e];
		}
		
		if (!_.isFunction(this.options.easing))
			throw 'Easing should be a function';

		this._id = _.uniqueId('tw');
		
		if (this.options.autostart)
			this.start();
	}
	
	Tween.prototype = {
		/**
		 * Start animation from the beginning
		 */
		start: function() {
			this.pos = 0;
			this.startTime = +new Date;
			this.endTime = this.startTime + this.options.duration;
			this.animating = true;
			addToQueue(this);
		},
		
		/**
		 * Stop animation
		 */
		stop: function() {
			this.animating = false;
			this.options.complete();
		}
	};

	Tween.__getAnims = function() {
		return anims;
	};
	
	global.Tween = Tween;
})(this);
/**
 * Small DOM utility library
 */
(function(global) {
	"use strict";
	var w3cCSS = document.defaultView && document.defaultView.getComputedStyle;
	
	function toCamelCase(name) {
		return name.replace(/\-(\w)/g, function(str, p1) {
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
			var cs = window.getComputedStyle(elem, '');
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
				var left = style.left, rsLeft = elem.runtimeStyle.left;
				
				// Put in the new values to get a computed value out
				elem.runtimeStyle.left = elem.currentStyle.left;
				var suffix = rsuf.test(ret) ? 'em' : '';
				style.left = nameCamel === 'fontSize' ? '1em' : (ret + suffix || 0);
				ret = style.pixelLeft + 'px';
				
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

		var numProps = {'line-height': 1, 'z-index': 1, opacity: 1};
		
		var props = _.map(params, function(v, k) {
			var name = k.replace(/([A-Z])/g, '-$1').toLowerCase();
			return name + ':' + ((_.isNumber(v) && !(name in numProps)) ? v + 'px' : v);
		});

		elem.style.cssText += ';' + props.join(';');
	}
	
	/**
	 * @returns {Array}
	 */
	function ar(obj) {
		if (obj.length === +obj.length) {
			return _.toArray(obj);
		}
		
		return _.isArray(obj) ? obj : [obj];
	}
	
	_.extend(global, {
		/**
		 * Trims whitespace from string
		 * @param {String} str
		 * @returns {String}
		 */
		trim: function(str) {
			if (str && 'trim' in String.prototype) {
				return str.trim();
			}
			
			return str.replace(/^\s+/, '').replace(/\s+$/, '');
		},
		
		/**
		 * Check if element contains given class
		 * @param {Element} elem
		 * @param {String} className
		 * @return {Boolean}
		 */
		hasClass: function(elem, className) {
			return ~(' ' + elem.className + ' ').indexOf(' ' + className + ' ');
		},
		
		/**
		 * Adds class name to given element
		 * @param {Element} elem
		 * @param {String} className
		 * @return {Element}
		 */
		addClass: function(elem, className) {
			_.each(ar(elem), function(el) {
				var classes = _.filter(className.split(/\s+/g), function(c) {
					return c && !this.hasClass(el, c);
				}, this);
				
				if (classes.length) {
					el.className += (el.className ? ' ' : '') + classes.join(' ');
				}
			}, this);
			
			return elem;
		},
		
		/**
		 * Removes given class name from specified element
		 * @param {Element} elem
		 * @param {String} className
		 * @return {Element}
		 */
		removeClass: function(elem, className) {
			var reSplit = /\s+/g;
			_.each(ar(elem), function(el) {
				el.className = _.difference((el.className || '').split(reSplit), className.split(/\s+/g)).join(' ');
			}, this);
			
			return elem;
		},
		
		/**
		 * Toggles given class on specified element
		 * @param {Element} elem
		 * @param {String} className
		 * @param {Boolean} cond
		 * @returns {Element}
		 */
		toggleClass: function(elem, className, cond) {
			_.each(ar(elem), function(el) {
				var c = cond;
				if (_.isUndefined(c)) {
					c = this.hasClass(el, className);
				}
				
				if (c) {
					this.removeClass(el, className);
				} else {
					this.addClass(el, className);
				}
			}, this);
			
			return elem;
		},
		
		/**
		 * Find elements with given class inside specified context element
		 * @param {String} className
		 * @param {Element} context Context element, default is <code>document</code> 
		 * @returns {Array}
		 */
		getByClass: function(className, context) {
			if (document.getElementsByClassName) {
				return (context || document).getElementsByClassName(className);
			}
			 
			return _.filter((context || document).getElementsByTagName('*'), function(elem) {
				return this.hasClass(elem, className);
			}, this);
		},
		
		/**
		 * Removes element from parent
		 * @param {Element} elem
		 * @returns {Element}
		 */
		remove: function(elem) {
			_.each(ar(elem), function(el) {
				if (el.parentNode) {
					el.parentNode.removeChild(el);
				}
			});
			
			return elem;
		},
		
		/**
		 * Renders string into DOM element
		 * @param {String} str
		 * @returns {Element}
		 */
		toDOM: function(str) {
			var div = document.createElement('div');
			div.innerHTML = str;
			return div.firstChild;
		},
		
		/**
		 * Sets or retrieves CSS property value
		 * @param {Element} elem
		 * @param {String} prop
		 * @param {String} val
		 */
		css: function(elem, prop, val) {
			if (_.isString(prop) && _.isUndefined(val)) {
				return getCSS(elem, prop);
			}
			
			if (_.isString(prop)) {
				var obj = {};
				obj[prop] = val;
				prop = obj;
			}
			
			setCSS(elem, prop);
		}
	});
})(_.dom = {});
CodeMirror.scenario = (function() {
	"use strict";
	var STATE_IDLE  = 'idle';
	var STATE_PLAY  = 'play';
	var STATE_PAUSE = 'pause';
	
	// Regular expression used to split event strings
	var eventSplitter = /\s+/;
	
	// Create a local reference to slice/splice.
	var slice = Array.prototype.slice;
	
	var defaultOptions = {
		beforeDelay: 1000,
		afterDelay: 1000
	};
	
	// detect CSS 3D Transforms for smoother animations 
	var has3d = (function() {
		var el = document.createElement('div');
		var cssTransform = prefixed('transform');
		if (cssTransform) {
			el.style[cssTransform] = 'translateZ(0)';
			return (/translatez/i).test(el.style[cssTransform]); 
		}
		
		return false;
	})();
	
	// borrow CSS prefix detection from Modernizr
	function prefixed(prop) {
		var prefixes = ['Webkit', 'Moz', 'O', 'ms'];
		var ucProp = prop.charAt(0).toUpperCase() + prop.slice(1);
		var props = (prop + ' ' + prefixes.join(ucProp + ' ') + ucProp).split(' ');
		var el = document.createElement('div');
		var p = null;
		for (var i in props) {
			p = props[i];
			if (el.style[p] !== undefined) {
				return p;
			}
		}

		return p;
	}
	
	var actionsDefinition = {
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
		'type': function(options, editor, next, timer) {
			options = makeOptions(options, 'text', {
				text: '',  // text to type
				delay: 60, // delay between character typing
				pos: null  // initial position where to start typing
			});
			
			if (!options.text) {
				throw 'No text provided for "type" action';
			}
			
			if (options.pos !== null) {
				editor.setCursor(makePos(options.pos, editor));
			}
			
			var chars = options.text.split('');
			
			timer(function perform() {
				var ch = chars.shift();
				editor.replaceSelection(ch, 'end');
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
		'wait': function(options, editor, next, timer) {
			options = makeOptions(options, 'timeout', {
				timeout: 100
			});
			
			timer(next, parseInt(options.timeout, 10));
		},
		
		/**
		 * Move caret to a specified position
		 */
		'moveTo': function(options, editor, next, timer) {
			options = makeOptions(options, 'pos', {
				delay: 80,
				immediate: false // TODO: remove, use delay: 0 instead
			});
			
			if (!options.pos) {
				throw 'No position specified for "moveTo" action';
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
		'jumpTo': function(options, editor, next, timer) {
			options = makeOptions(options, 'pos', {
				afterDelay: 200
			});

			if (!options.pos) {
				throw 'No position specified for "jumpTo" action';
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
		'run': function(options, editor, next, timer) {
			options = makeOptions(options, 'command', {
				beforeDelay: 500,
				times: 1
			});
			
			var times = options.times;
			timer(function perform() {
				try {
					if (_.isFunction(options.command)) {
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
		'select': function(options, editor, next, timer) {
			options = makeOptions(options, 'to', {
				from: 'caret'
			});
			
			var from = makePos(options.from, editor);
			var to = makePos(options.to, editor);
			editor.setSelection(from, to);
			next();
		}
	};
	
	/**
	 * Parses action call from string
	 * @param {String} data
	 * @returns {Object}
	 */
	function parseActionCall(data) {
		if (_.isString(data)) {
			var parts = data.split(':');
			return {
				name: parts.shift(),
				options: parts.join(':')
			};
		} else {
			var name = _.keys(data)[0];
			return {
				name: name,
				options: data[name]
			};
		}
	}
	
	function makeOptions(options, name, defaults) {
		if (_.isString(options)) {
			var o = {};
			o[name] = options;
			options = o;
		}
		
		return _.extend(defaults, options || {});
	}
	
	/**
	 * Helper function that produces <code>{line, ch}</code> object from
	 * passed argument
	 * @param {Object} pos
	 * @param {CodeMirror} editor
	 * @returns {Object}
	 */
	function makePos(pos, editor) {
		if (_.isString(pos)) {
			if (pos === 'caret') {
				return editor.getCursor(true);
			}
			
			if (~pos.indexOf(':')) {
				var parts = pos.split(':');
				return {
					line: parseInt(parts[0], 10),
					ch: parseInt(parts[1], 10)
				};
			}
			
			pos = parseInt(pos, 10);
		}
		
		if (_.isNumber(pos)) {
			return editor.posFromIndex(pos);
		}
		
		return pos;
	}
	
	function requestTimer(fn, delay) {
		if (!delay) {
			fn();
		} else {
			return setTimeout(fn, delay);
		}
	}
	
	// XXX add 'revert' action to CodeMirror to restore original text and position
	CodeMirror.commands.revert = function(editor) {
		if (editor.__initial) {
			editor.setValue(editor.__initial.content);
			editor.setCursor(editor.__initial.pos);
		}
	};
	
	
	/**
	 * @param {Object} actions Actions scenario
	 * @param {Object} data Initial content (<code>String</code>) or editor
	 * instance (<code>CodeMirror</code>)
	 */
	function Scenario(actions, data) {
		this._actions = actions;
		this._actionIx = 0;
		this._editor = null;
		this._state = STATE_IDLE;
		this._timerQueue = [];
		
		if (data && 'getValue' in data) {
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
	
	Scenario.prototype = {
		_setup: function(editor) {
			if (!editor && this._editor) {
				editor = this._editor;
			}
			
			editor.execCommand('revert');
			return editor;
		},
		
		/**
		 * Play current scenario
		 * @param {CodeMirror} editor Editor instance where on which scenario 
		 * should be played
		 * @memberOf Scenario
		 */
		play: function(editor) {
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
				this.trigger('resume');
				return;
			}
			
			this._editor = editor = this._setup(editor);
			editor.focus();
			
			var timer = _.bind(this.requestTimer, this);
			var that = this;
			this._actionIx = 0;
			var next = function() {
				if (that._actionIx >= that._actions.length) {
					return timer(function() {
						that.stop();
					}, defaultOptions.afterDelay);
				}
				
				that.trigger('action', that._actionIx);
				var action = parseActionCall(that._actions[that._actionIx++]);
				
				if (action.name in actionsDefinition) {
					actionsDefinition[action.name].call(that, action.options, editor, next, timer);
				} else {
					throw 'No such action: ' + action.name;
				}
			};
			
			this._state = STATE_PLAY;
			this._editor.setOption('readOnly', true);
			this.trigger('play');
			timer(next, defaultOptions.beforeDelay);
		},
		
		/**
		 * Pause current scenario playback. It can be restored with 
		 * <code>play()</code> method call 
		 */
		pause: function() {
			this._state = STATE_PAUSE;
			this.trigger('pause');
		},
		
		/**
		 * Stops playback of current scenario
		 */
		stop: function() {
			if (this._state !== STATE_IDLE) {
				this._state = STATE_IDLE;
				this._timerQueue.length = 0;
				this._editor.setOption('readOnly', false);
				this.trigger('stop');
			}
		},
		
		/**
		 * Returns current playback state
		 * @return {String}
		 */
		state: function() {
			return this._state;
		},
		
		/**
		 * Toggle playback of movie scenario
		 */
		toggle: function() {
			if (this._state === STATE_PLAY) {
				this.pause();
			} else {
				this.play();
			}
		},
		
		requestTimer: function(fn, delay) {
			if (this._state !== STATE_PLAY) {
				// save function call into a queue till next 'play()' call
				this._timerQueue.push({
					fn: fn,
					delay: delay
				});
			} else {
				return requestTimer(fn, delay);
			}
		},
		
		// borrowed from Backbone
		/**
		 * Bind one or more space separated events, `events`, to a `callback`
		 * function. Passing `"all"` will bind the callback to all events fired.
		 * @param {String} events
		 * @param {Function} callback
		 * @param {Object} context
		 * @memberOf eventDispatcher
		 */
		on: function(events, callback, context) {
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
					tail : tail,
					next : list ? list.next : node
				};
			}

			return this;
		},

		/**
		 * Remove one or many callbacks. If `context` is null, removes all
		 * callbacks with that function. If `callback` is null, removes all
		 * callbacks for the event. If `events` is null, removes all bound
		 * callbacks for all events.
		 * @param {String} events
		 * @param {Function} callback
		 * @param {Object} context
		 */
		off: function(events, callback, context) {
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
			events = events ? events.split(eventSplitter) : _.keys(calls);
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
					if ((callback && cb !== callback) || (context && ctx !== context)) {
						this.on(event, cb, ctx);
					}
				}
			}

			return this;
		},
		
		/**
		 * Trigger one or many events, firing all bound callbacks. Callbacks are
		 * passed the same arguments as `trigger` is, apart from the event name
		 * (unless you're listening on `"all"`, which will cause your callback
		 * to receive the true name of the event as the first argument).
		 * @param {String} events
		 */
		trigger: function(events) {
			var event, node, calls, tail, args, all, rest;
			if (!(calls = this._callbacks)) {
				return this;
			}
			
			all = calls.all;
			events = events.split(eventSplitter);
			rest = slice.call(arguments, 1);

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
					args = [ event ].concat(rest);
					while ((node = node.next) !== tail) {
						node.callback.apply(node.context || this, args);
					}
				}
			}

			return this;
		}
	};
	
	return _.extend(function(actions, data) {
		return new Scenario(actions, data);
	}, {
		defineAction: function(name, fn) {
			actionsDefinition[name] = fn;
		},
		makeOptions: makeOptions,
		makePos: makePos,
		has3d: has3d,
		prefixed: prefixed
	});
})();
/**
 * Extension that allows authors to display context tooltips bound to specific
 * positions
 */
CodeMirror.scenarioTooltip = (function() {
	"use strict";
	var instance = null;
	var lastTween = null;
	var sc = CodeMirror.scenario;
	
	var alignDefaults = {
		/** CSS selector for getting popup tail */
		tailClass: 'CodeMirror-tooltip__tail',
		
		/** Class name for switching tail/popup position relative to target point */
		belowClass: 'CodeMirror-tooltip_below',
		
		/** Min distance between popup and viewport */
		popupMargin: 5,
		
		/** Min distance between popup left/right edge and its tail */
		tailMargin: 11
	};
	
	function getViewportRect() {
		var body = document.body;
		var docElem = document.documentElement;
		var clientTop = docElem.clientTop  || body.clientTop  || 0;
		var clientLeft = docElem.clientLeft || body.clientLeft || 0;
		var scrollTop  = window.pageYOffset || docElem.scrollTop  || body.scrollTop;
		var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft;
		
		return {
			top: scrollTop  - clientTop,
			left: scrollLeft - clientLeft,
			width: body.clientWidth || docElem.clientWidth,
			height: body.clientHeight || docElem.clientHeight
		};
	}
	
	/**
	 * Helper function that finds optimal position of tooltip popup on page
	 * and aligns popup tail with this position
	 * @param {Element} popup
	 * @param {Object} options
	 */
	function alignPopupWithTail(popup, options) {
		options = _.extend({}, alignDefaults, options || {});
		
		_.dom.css(popup, {
			left: 0,
			top: 0
		});
		
		var tail = _.dom.getByClass(options.tailClass, popup)[0];
		
		var resultX = 0, resultY = 0;
		var pos = options.position;
		var vp = getViewportRect();
		
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
		tail.style.left = Math.min(tailMaxLeft, Math.max(tailMinLeft, pos.x - resultX - vp.left)) + 'px';
		
		_.dom.css(popup, {
			left: resultX,
			top: resultY
		});
		
		_.dom.toggleClass(popup, options.belowClass, isTop);
	}
	
	/**
	 * @param {jQuery} elem
	 * @param {Object} options 
	 */
	function animateShow(elem, options) {
		options = _.extend({}, alignDefaults, options || {});
		var cssOrigin = sc.prefixed('transformOrigin');
		var cssTransform = sc.prefixed('transform');
		var style = elem.style;

		var tail = _.dom.getByClass(options.tailClass, elem)[0];
		var xOrigin = _.dom.css(tail, 'left');
		var yOrigin = tail.offsetTop;
		if (_.dom.hasClass(elem, options.belowClass)) {
			yOrigin -= tail.offsetHeight;
		}
		
		yOrigin += 'px';

		style[cssOrigin] = xOrigin + ' ' + yOrigin;
		var prefix = sc.has3d ? 'translateZ(0) ' : '';
		
		return lastTween = new Tween({
			duration: 800,
			easing: 'easeOutElastic',
			step: function(pos) {
				style[cssTransform] = prefix + 'scale(' + pos + ')';
			},
			complete: function() {
				style[cssTransform] = 'none';
				lastTween = null;
				if (options.onComplete) {
					options.onComplete(elem);
				}
			}
		});
	}

	/**
	 * @param {jQuery} elem
	 * @param {Object} options
	 */
	function animateHide(elem, options) {
		var style = elem.style;

		return new Tween({
			duration: 200,
			easing: 'linear',
			step: function(pos) {
				style.opacity = (1 - pos);
			},
			complete: function() {
				_.dom.remove(elem);
				if (options.onComplete) {
					options.onComplete(elem);
				}
			}
		});
	}
	
	function showTooltip(text, pos, callback) {
		hideTooltip();
		
		instance = _.dom.toDOM('<div class="CodeMirror-tooltip">' +
			'<div class="CodeMirror-tooltip__content">' + text + '</div>' + 
			'<div class="CodeMirror-tooltip__tail"></div>' + 
			'</div>');
		
		_.dom.css(instance, sc.prefixed('transform'), 'scale(0)');
		document.body.appendChild(instance);
		
		alignPopupWithTail(instance, {position: pos});
		animateShow(instance, {onComplete: callback});
	}
	
	function hideTooltip(callback) {
		if (instance) {
			if (lastTween) {
				lastTween.stop();
				lastTween = null;
			}
			animateHide(instance, {onComplete: callback});
			instance = null;
		} else if (callback) {
			callback();
		}
	}
	
	// XXX extend CodeMirror scenario with new actions
	
	/**
	 * Resolves position where tooltip should point to
	 * @param {Object} pos
	 * @param {CodeMirror} editor
	 * @returns {Object} Object with <code>x</code> and <code>y</code> 
	 * properties
	 */
	function resolvePosition(pos, editor) {
		if (pos === 'caret') {
			// get absolute position of current caret position
			return sanitizeCaretPos(editor.cursorCoords(true));
		}
		
		if (pos && 'x' in pos && 'y' in pos) {
			// passed absolute coordinates
			return pos;
		}

		if (pos && 'left' in pos && 'top' in pos) {
			// passed absolute coordinates
			return sanitizeCaretPos(pos);
		}
		
		return sanitizeCaretPos(editor.charCoords(sc.makePos(pos)));
	}

	function sanitizeCaretPos(pos) {
		if ('left' in pos) {
			pos.x = pos.left;
		}

		if ('top' in pos) {
			pos.y = pos.top;
		}

		return pos;
	}
	
	/**
	 * Shows tooltip with specified text, wait for <code>options.wait</code>
	 * milliseconds then hides tooltip
	 */
	sc.defineAction('tooltip', function(options, editor, next, timer) {
		options = sc.makeOptions(options, 'text', {
			wait: 4000,   // time to wait before hiding tooltip
			pos: 'caret'  // position where tooltip should point to
		});
		
		var pos = resolvePosition(options.pos, editor);
		showTooltip(options.text, pos, function() {
			timer(function() {
				hideTooltip(function() {
					timer(next);
				});
			}, options.wait);
		});
	});
	
	/**
	 * Shows tooltip with specified text. This tooltip should be explicitly 
	 * hidden with <code>hideTooltip</code> action
	 */
	sc.defineAction('showTooltip', function(options, editor, next, timer) {
		options = sc.makeOptions(options, 'text', {
			pos: 'caret'  // position where tooltip should point to
		});
		
		showTooltip(options.text, resolvePosition(options.pos, editor));
		next();
	});
	
	/**
	 * Hides tooltip, previously shown by <code>showTooltip</code> action
	 */
	sc.defineAction('hideTooltip', function(options, editor, next, timer) {
		hideTooltip(next);
	});
	
	return {
		show: showTooltip,
		hide: hideTooltip
	};
})();

/**
 * Module that creates list of action hints and highlights items when specified
 * action is performed
 */
CodeMirror.scenarioOutline = (function() {
	"use strict";
	var defaultOptions = {
		wrapperTemplate: '<ul class="CodeMirror-outline"><%= content %></ul>',
		itemTemplate: '<li data-action-id="<%= id %>" class="CodeMirror-outline__item"><%= title %></li>',
		itemClass: 'CodeMirror-outline__item',
		selectedClass: 'CodeMirror-outline__item_selected'
	};
		
	/**
	 * @param {Object} hints
	 * @param {Scenario} scenario
	 * @param {Object} options
	 */
	return function(hints, scenario, options) {
		options = _.extend({}, defaultOptions, options || {});
		
		var hintKeys = _.keys(hints);
		hintKeys.sort(function(a, b) {
			return parseInt(a, 10) - parseInt(b, 10);
		});
		
		var itemTemplate = _.template(options.itemTemplate);
		var items = _.map(hintKeys, function(key) {
			return itemTemplate({
				title: hints[key],
				id: key
			});
		});
		
		var el = _.dom.toDOM(_.template(options.wrapperTemplate, {
			content: items.join('')
		}));
		
		if (options.target) {
			options.target.appendChild(el);
		}
		
		scenario
			.on('action', function(id) {
				var items = _.dom.getByClass(options.itemClass, el);
				var matchedItem = _.find(items, function(elem) {
					return elem.getAttribute('data-action-id') == id;
				});
				
				if (matchedItem) {
					_.dom.removeClass(items, options.selectedClass);
					_.dom.addClass(matchedItem, options.selectedClass);
				}
			})
			.on('stop', function() {
				_.dom.removeClass(_.dom.getByClass(options.itemClass, el), options.selectedClass);
			});
		
		return el;
	};
})();
/**
 * Shows fake prompt dialog with interactive value typing
 */
CodeMirror.scenarioPrompt = (function() {
	"use strict";
	var dialogInstance = null;
	var bgInstance = null;
	var lastTween = null;
	
	var sc = CodeMirror.scenario;
	
	function showPrompt(text, target, callback) {
		hidePrompt();
		dialogInstance = _.dom.toDOM('<div class="CodeMirror-prompt">' +
			'<div class="CodeMirror-prompt__title">' + text + '</div>' + 
			'<input type="text" name="prompt" class="CodeMirror-prompt__input" readonly="readonly" />' + 
			'</div>');
		bgInstance = _.dom.toDOM('<div class="CodeMirror-prompt__shade"></div>');
		
		target.appendChild(dialogInstance);
		target.appendChild(bgInstance);
		
		animateShow(dialogInstance, bgInstance, {onComplete: callback});
	}
	
	function hidePrompt(callback) {
		if (dialogInstance) {
			if (lastTween) {
				lastTween.stop();
				lastTween = null;
			}
			animateHide(dialogInstance, bgInstance, {onComplete: callback});
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
	function animateShow(dialog, bg, options) {
		options = options || {};
		var cssTransform = sc.prefixed('transform');
		var dialogStyle = dialog.style;
		var bgStyle = bg.style;
		var height = dialog.offsetHeight;
		var tmpl = _.template(sc.has3d ? 'translate3d(0, <%= pos %>, 0)' : 'translate(0, <%= pos %>)');

		bgStyle.opacity = 0;
		new Tween({
			duration: 200,
			step: function(pos) {
				bgStyle.opacity = pos;
			}
		});
		
		dialogStyle[cssTransform] = tmpl({pos: -height});
		
		return lastTween = new Tween({
			duration: 400,
			easing: 'easeOutCubic',
			step: function(pos) {
				dialogStyle[cssTransform] = tmpl({pos: (-height * (1 - pos)) + 'px'});
			},
			complete: function() {
				lastTween = null;
				if (options.onComplete) {
					options.onComplete(dialog, bg);
				}
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
		var cssTransform = sc.prefixed('transform');
		var tmpl = _.template(sc.has3d ? 'translate3d(0, <%= pos %>, 0)' : 'translate(0, <%= pos %>)');

		return new Tween({
			duration: 200,
			step: function(pos) {
				dialogStyle[cssTransform] = tmpl({pos: (-height * pos) + 'px'});
				bgStyle.opacity = 1 - pos;
			},
			complete: function() {
				_.dom.remove([dialog, bg]);
				if (options.onComplete) {
					options.onComplete(dialog, bg);
				}
			}
		});
	}
	
	function typeText(target, options, timer, next) {
		var chars = options.text.split('');
		timer(function perform() {
			target.value += chars.shift();
			if (chars.length) {
				timer(perform, options.delay);
			} else {
				next();
			}
		}, options.delay);
	}
	
	// XXX extend CodeMirror scenario with new actions
	sc.defineAction('prompt', function(options, editor, next, timer) {
		options = sc.makeOptions(options, 'text', {
			title: 'Enter something',
			delay: 80,        // delay between character typing
			typeDelay: 1000,  // time to wait before typing text
			hideDelay: 2000   // time to wait before hiding prompt dialog
		});
		
		showPrompt(options.title, editor.getWrapperElement(), function(dialog) {
			timer(function() {
				typeText(_.dom.getByClass('CodeMirror-prompt__input', dialog)[0], options, timer, function() {
					timer(function() {
						hidePrompt(next);
					}, options.hideDelay);
				});
			}, options.typeDelay);
		});
	});
})();
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
	 * Hich-level function to create movie instance on textarea.
	 * @param {Element} target Reference to textarea, either <code>Element</code>
	 * or string ID
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
		
		var initialValue = editorOptions.value || target.value || '';
		
		if (movieOptions.parse) {
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
		target.value = editorOptions.value = initialValue = initialValue.replace(/\|/g, '');
		
		// create editor instance
		var editor = CodeMirror.fromTextArea(target, editorOptions);
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