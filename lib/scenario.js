"use strict";

import commonActions from './actions';
import {actions as prompt} from './widgets/prompt';
import {actions as tooltip} from './widgets/tooltip';
import {extend} from './utils';

var actionsDefinition = extend({}, commonActions, prompt, tooltip);

var STATE_IDLE  = 'idle';
var STATE_PLAY  = 'play';
var STATE_PAUSE = 'pause';

// Regular expression used to split event strings
var eventSplitter = /\s+/;

export var defaultOptions = {
	beforeDelay: 1000,
	afterDelay: 1000
};

/**
 * @param {Object} actions Actions scenario
 * @param {Object} data Initial content (<code>String</code>) or editor
 * instance (<code>CodeMirror</code>)
 */
export default class Scenario {
	constructor(actions, data) {
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

	_setup(editor) {
		if (!editor && this._editor) {
			editor = this._editor;
		}
		
		editor.execCommand('revert');
		return editor;
	}
	
	/**
	 * Play current scenario
	 * @param {CodeMirror} editor Editor instance where on which scenario 
	 * should be played
	 * @memberOf Scenario
	 */
	play(editor) {
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
		
		var timer = this.requestTimer.bind(this);
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
				throw new Error('No such action: ' + action.name);
			}
		};
		
		this._state = STATE_PLAY;
		this._editor.setOption('readOnly', true);
		this.trigger('play');
		timer(next, defaultOptions.beforeDelay);
	}
	
	/**
	 * Pause current scenario playback. It can be restored with 
	 * <code>play()</code> method call 
	 */
	pause() {
		this._state = STATE_PAUSE;
		this.trigger('pause');
	}
	
	/**
	 * Stops playback of current scenario
	 */
	stop() {
		if (this._state !== STATE_IDLE) {
			this._state = STATE_IDLE;
			this._timerQueue.length = 0;
			this._editor.setOption('readOnly', false);
			this.trigger('stop');
		}
	}
	
	/**
	 * Returns current playback state
	 * @return {String}
	 */
	get state() {
		return this._state;
	}
	
	/**
	 * Toggle playback of movie scenario
	 */
	toggle() {
		if (this._state === STATE_PLAY) {
			this.pause();
		} else {
			this.play();
		}
	}
	
	requestTimer(fn, delay) {
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
	
	// borrowed from Backbone
	/**
	 * Bind one or more space separated events, `events`, to a `callback`
	 * function. Passing `"all"` will bind the callback to all events fired.
	 * @param {String} events
	 * @param {Function} callback
	 * @param {Object} context
	 * @memberOf eventDispatcher
	 */
	on(events, callback, context) {
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
	}

	/**
	 * Remove one or many callbacks. If `context` is null, removes all
	 * callbacks with that function. If `callback` is null, removes all
	 * callbacks for the event. If `events` is null, removes all bound
	 * callbacks for all events.
	 * @param {String} events
	 * @param {Function} callback
	 * @param {Object} context
	 */
	off(events, callback, context) {
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
				if ((callback && cb !== callback) || (context && ctx !== context)) {
					this.on(event, cb, ctx);
				}
			}
		}

		return this;
	}
	
	/**
	 * Trigger one or many events, firing all bound callbacks. Callbacks are
	 * passed the same arguments as `trigger` is, apart from the event name
	 * (unless you're listening on `"all"`, which will cause your callback
	 * to receive the true name of the event as the first argument).
	 * @param {String} events
	 */
	trigger(events, ...rest) {
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
				args = [ event ].concat(rest);
				while ((node = node.next) !== tail) {
					node.callback.apply(node.context || this, args);
				}
			}
		}

		return this;
	}
};

/**
 * Parses action call from string
 * @param {String} data
 * @returns {Object}
 */
function parseActionCall(data) {
	if (typeof data === 'string') {
		var parts = data.split(':');
		return {
			name: parts.shift(),
			options: parts.join(':')
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