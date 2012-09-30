/**
 * Shows fake prompt dialog with interactive value typing
 */
CodeMirror.scenarioPrompt = (function() {
	var dialogInstance = null;
	var bgInstance = null;
	
	var sc = CodeMirror.scenario;
	
	function showPrompt(text, target, callback) {
		hidePrompt();
		dialogInstance = $('<div class="CodeMirror-prompt">' 
			+ '<div class="CodeMirror-prompt__title">' + text + '</div>' 
			+ '<input type="text" name="prompt" class="CodeMirror-prompt__input" readonly="readonly" />' 
			+ '</div>')
			.appendTo(target);
		bgInstance = $('<div class="CodeMirror-prompt__shade"></div>').appendTo(target);
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
	 * @param {jQuery} dialog
	 * @param {jQuery} bg
	 * @param {Object} options 
	 */
	function animateShow(dialog, bg, options) {
		options = options || {};
		var cssTransform = sc.prefixed('transform');
		var dialogStyle = dialog[0].style;
		var bgStyle = bg[0].style;
		var height = dialog[0].offsetHeight;
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
	 * @param {jQuery} dialog
	 * @param {jQuery} bg
	 * @param {Object} options
	 */
	function animateHide(dialog, bg, options) {
		var dialogStyle = dialog[0].style;
		var bgStyle = bg[0].style;
		var height = dialog[0].offsetHeight;
		var cssTransform = sc.prefixed('transform');
		var tmpl = _.template(sc.has3d ? 'translate3d(0, <%= pos %>, 0)' : 'translate(0, <%= pos %>)');

		return new Tween({
			duration: 200,
			step: function(pos) {
				dialogStyle[cssTransform] = tmpl({pos: (-height * pos) + 'px'});
				bgStyle.opacity = 1 - pos;
			},
			complete: function() {
				dialog.remove();
				bg.remove();
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
			if (chars.length)
				timer(perform, options.delay);
			else
				next();
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
				typeText(dialog.find('.CodeMirror-prompt__input')[0], options, timer, function() {
					timer(function() {
						hidePrompt(next);
					}, options.hideDelay);
				});
			}, options.typeDelay);
		});
	});
})();