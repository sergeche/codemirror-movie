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

		if (_.isObject(pos)) {
			if ('x' in pos && 'y' in pos) {
				// passed absolute coordinates
				return pos;
			}

			if ('left' in pos && 'top' in pos) {
				// passed absolute coordinates
				return sanitizeCaretPos(pos);
			}
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
