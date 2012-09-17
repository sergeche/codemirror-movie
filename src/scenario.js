CodeMirror.scenario = (function() {
	var actionsDefinition = {
		/**
		 * Type-in passed text into current editor char-by-char
		 * @param {Object} options Current options
		 * @param {CodeMirror} editor Editor instance where action should be 
		 * performed
		 * @param {Function} next Function to call when action performance
		 * is completed
		 */
		type: function(options, editor, next) {
			options = _.extend({
				text: '',  // text to type
				delay: 80, // delay between character typing
				pos: null  // initial position where to start typing
			}, options || {});
			
			if (!options.text)
				throw 'No text provided for "type" action';
			
			if (options.pos !== null) {
				editor.setCursor(makePos(options.pos, editor));
			}
			
			var chars = options.text.split('');
			setTimeout(function perform() {
				var ch = chars.shift();
				editor.replaceSelection(ch, 'end');
				if (chars.length)
					setTimeout(perform, options.delay);
				else
					next();
			}, options.delay);
		}
	};
	
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
	
	/**
	 * @param {Object} actions Actions scenario
	 * @param {Object} data Initial content (<code>String</code>) or editor
	 * instance (<code>CodeMirror</code>)
	 */
	function Scenario(actions, data) {
		this._actions = actions;
		this._editor = null;
		
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
	
	Scenario.prototype = {
		_setup: function(editor) {
			if (!editor && this._editor)
				editor = this._editor;
			
			if (this._initial) {
				editor.setValue(this._initial.content);
				editor.setCursor();
			}
			
			return editor;
		},
		
		play: function(editor) {
			editor = this._setup(editor);
			
			var actions = _.clone(this._actions);
			var next = function() {
				if (!actions || !actions.length)
					return;
				
				var action = actions.shift();
				var actionName, actionOptions = {};
				if (_.isString(action)) {
					actionName = action;
				} else {
					actionName = _.keys(action)[0];
					actionOptions = action[actionName];
				}
				
				if (actionName in actionsDefinition) {
					actionsDefinition[actionName](actionOptions, editor, next);
				} else {
					throw 'No such action: ' + actionName;
				}
			};
			
			editor.focus();
			next();
		}
	};
	
	return function(actions, data) {
		return new Scenario(actions, data);
	};
})();