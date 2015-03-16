import {extend, makePos, getCursor} from './utils';

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
	type: function(options, editor, next, timer) {
		options = extend({
			text: '',  // text to type
			delay: 60, // delay between character typing
			pos: null  // initial position where to start typing
		}, wrap('text', options));
		
		if (!options.text) {
			throw new Error('No text provided for "type" action');
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
	wait: function(options, editor, next, timer) {
		options = extend({
			timeout: 100
		}, wrap('timeout', options));
		
		timer(next, parseInt(options.timeout, 10));
	},
	
	/**
	 * Move caret to a specified position
	 */
	moveTo: function(options, editor, next, timer) {
		options = extend({
			delay: 80,
			immediate: false // TODO: remove, use delay: 0 instead
		}, wrap('pos', options));
		
		if (typeof options.pos === 'undefined') {
			throw new Error('No position specified for "moveTo" action');
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
	jumpTo: function(options, editor, next, timer) {
		options = extend({
			afterDelay: 200
		}, wrap('pos', options));

		if (typeof options.pos === 'undefined') {
			throw new Error('No position specified for "jumpTo" action');
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
	run: function(options, editor, next, timer) {
		options = extend({
			beforeDelay: 500,
			times: 1
		}, wrap('command', options));
		
		var times = options.times;
		timer(function perform() {
			if (typeof options.command === 'function') {
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
	select: function(options, editor, next, timer) {
		options = extend({
			from: 'caret'
		}, wrap('to', options));
		
		var from = makePos(options.from, editor);
		var to = makePos(options.to, editor);
		editor.setSelection(from, to);
		next();
	}
};

function wrap(key, value) {
	return typeof value === 'object' ? value : {[key]: value};
}

export default actions;