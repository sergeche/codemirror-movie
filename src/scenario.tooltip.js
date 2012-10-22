/**
 * Extension that allows authors to display context tooltips bound to specific
 * positions
 */
CodeMirror.scenarioTooltip = (function() {
	var instance = null;
	var lastTween = null;
	var sc = CodeMirror.scenario;
	
	var alignDefaults = {
		/** CSS selector for getting popup tail */
		tailSelector: '.CodeMirror-tooltip__tail',
		
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
			width: $(window).width(),
			height: $(window).height()
		};
	}
	
	/**
	 * Helper function that finds optimal position of tooltip popup on page
	 * and aligns popup tail with this position
	 * @param {jQuery} popup
	 * @param {Object} options
	 */
	function alignPopupWithTail(popup, options) {
		options = _.extend({}, alignDefaults, options || {});
		
		popup.css({left: 0, top: 0});
		var tail = popup.find(options.tailSelector);
		
		var resultX = 0, resultY = 0;
		var pos = options.position;
		var vp = getViewportRect();
		
		var width = popup[0].offsetWidth;
		var height = popup[0].offsetHeight;
		
		var isTop;
			
		// calculate horizontal position
		resultX = Math.min(vp.width - width - options.popupMargin, Math.max(options.popupMargin, pos.x - vp.left - width / 2));
		
		// calculate vertical position
		if (height + tail.height() + options.popupMargin + vp.top < pos.y) {
			// place above target position
			resultY = Math.max(0, pos.y - height - tail.height());
			isTop = true;
		} else {
			// place below target position 
			resultY = pos.y + tail.height();
			isTop = false;
		}
		
		// calculate tail position
		var tailMinLeft = options.tailMargin;
		var tailMaxLeft = width - options.tailMargin;
		tail.css('left', Math.min(tailMaxLeft, Math.max(tailMinLeft, pos.x - resultX - vp.left)));
		
		popup
			.css({
				top: resultY,
				left: resultX
			})
			.toggleClass(options.belowClass, !isTop);
	}
	
	/**
	 * @param {jQuery} elem
	 * @param {Object} options 
	 */
	function animateShow(elem, options) {
		options = _.extend({}, alignDefaults, options || {});
		var cssOrigin = sc.prefixed('transformOrigin');
		var cssTransform = sc.prefixed('transform');
		var style = elem[0].style;

		var tail = elem.find(options.tailSelector);
		var xOrigin = tail.css('left');
		var yOrigin = tail[0].offsetTop;
		if (elem.hasClass(options.belowClass)) {
			yOrigin -= tail.height();
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
//				style[cssTransform] = 'none';
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
		var style = elem[0].style;

		return new Tween({
			duration: 200,
			easing: 'linear',
			step: function(pos) {
				style.opacity = (1 - pos);
			},
			complete: function() {
				elem.remove();
				if (options.onComplete) {
					options.onComplete(elem);
				}
			}
		});
	}
	
	function showTooltip(text, pos, callback) {
		hideTooltip();
		instance = $('<div class="CodeMirror-tooltip">' 
			+ '<div class="CodeMirror-tooltip__content">' + text + '</div>' 
			+ '<div class="CodeMirror-tooltip__tail"></div>' 
			+ '</div>')
			.css(sc.prefixed('transform'), 'scale(0)')
			.appendTo(document.body);
		
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
			return editor.cursorCoords(true);
		}
		
		if (typeof pos == 'object' && 'x' in pos && 'y' in pos) {
			// passed absolute coordinates
			return pos;
		}
		
		return editor.charCoords(sc.makePos(pos));
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
		showTooltip(options.text, pos);
		timer(function() {
			hideTooltip(function() {
				timer(next);
			});
		}, options.wait);
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
