CodeMirror.scenario = (function() {
	var STATE_IDLE  = 0;
	var STATE_PLAY  = 1;
	var STATE_PAUSE = 2;
	
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
		type: function(options, editor, next, timer) {
			options = makeOptions(options, 'text', {
				text: '',  // text to type
				delay: 80, // delay between character typing
				pos: null  // initial position where to start typing
			});
			
			if (!options.text)
				throw 'No text provided for "type" action';
			
			if (options.pos !== null) {
				editor.setCursor(makePos(options.pos, editor));
			}
			
			var chars = options.text.split('');
			
			timer(function perform() {
				var ch = chars.shift();
				editor.replaceSelection(ch, 'end');
				if (chars.length)
					timer(perform, options.delay);
				else
					next();
			}, options.delay);
		},
		
		/**
		 * Wait for a specified timeout
		 * @param options
		 * @param editor
		 * @param next
		 * @param timer
		 */
		wait: function(options, editor, next, timer) {
			options = makeOptions(options, 'timeout', {
				timeout: 100
			});
			
			timer(next, parseInt(options.timeout));
		},
		
		/**
		 * Move caret to a specified position
		 */
		moveTo: function(options, editor, next, timer) {
			options = makeOptions(options, 'pos', {
				delay: 80,
				immediate: false
			});
			
			if (!options.pos) {
				throw 'No position specified for "moveTo" action';
			}
			
			var curPos = editor.getCursor(true);
			var targetPos = makePos(options.pos);
			
			if (options.immediate) {
				editor.setCursor(targetPos);
				next();
			}
			
			var deltaLine = targetPos.line - curPos.line;
			var deltaChar = targetPos.ch - curPos.ch;
			var steps = Math.max(deltaChar, deltaLine);
			var stepLine = deltaLine / steps;
			var stepChar = deltaChar / steps;
			timer(function perform() {
				if (steps > 0) {
					curPos.line += stepLine;
					curPos.ch += stepChar;
					editor.setCursor({
						line: Math.round(curPos.line),
						ch: Math.round(curPos.ch)
					});
					steps--;
					timer(perform, options.delay);
				} else {
					next();
				}
			}, options.delay);
		},
		
		/**
		 * Executes predefined CodeMirror command
		 * @param {Object} options
		 * @param {CodeMirror} editor
		 * @param {Function} next
		 * @param {Function} timer
		 */
		run: function(options, editor, next, timer) {
			options = makeOptions(options, 'command', {
				beforeDelay: 0
			});
			
			timer(function() {
				editor.execCommand(options.command);
				next();
			}, options.beforeDelay);
		},
		
		tooltip: function(options, editor, next, timer) {
			options = makeOptions(options, 'text', {
				text: '',
				delay: 2000,
				pos: 'caret'
			});
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
			var name = parts.shift();
			return {
				name: name,
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
		if (!delay)
			fn();
		else
			return setTimeout(fn, delay);
	}
	
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
		
		if (_.isString(data)) {
			this._initial = {
				content: data,
				pos: 0
			};
		} else if (data && 'getValue' in data) {
			this._initial = {
				content: data.getValue(),
				pos: data.getCursor(true)
			};
			this._editor = data;
		}
		
	}
	
	Scenario.prototype = _.extend({
		_setup: function(editor) {
			if (!editor && this._editor)
				editor = this._editor;
			
			if (this._initial) {
				editor.setValue(this._initial.content);
				editor.setCursor(this._initial.pos);
			}
			
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
			
			this._editor = editor = this._setup(editor);
			editor.focus();
			
			if (this._state === STATE_PAUSE) {
				// revert from paused state
				var timerObj = null;
				while (timerObj = this._timerQueue.shift()) {
					requestTimer(timerObj.fn, timerObj.delay);
				}
				
				this._state = STATE_PLAY;
				return;
			}
			
			
			var timer = _.bind(this.requestTimer, this);
			var that = this;
			this._actionIx = 0;
			var next = function() {
				if (that._actionIx >= that._actions.length)
					return that.stop();
				
				that.trigger('action', that._actionIx);
				var action = parseActionCall(that._actions[that._actionIx++]);
				
				if (action.name in actionsDefinition) {
					actionsDefinition[action.name].call(that, action.options, editor, next, timer);
				} else {
					throw 'No such action: ' + actionName;
				}
			};
			
			this._state = STATE_PLAY;
			this.trigger('play');
			next();
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
			this._state = STATE_IDLE;
			this._timerQueue.length = 0;
			this.trigger('stop');
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
		}
	}, _.events);
	
	return _.extend(function(actions, data) {
		return new Scenario(actions, data);
	}, {
		defineAction: function(name, fn) {
			actionsDefinition[name] = fn;
		},
		makeOptions: makeOptions
	});
})();