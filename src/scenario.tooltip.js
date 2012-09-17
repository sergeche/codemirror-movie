/**
 * Extension that allows authors to display context tooltips bound to specific
 * positions
 */
CodeMirror.scenarioTooltip = (function() {
	var instance = null;
	var lastTween = null;
	
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
	
	// detect CSS 3D Transforms for smoother animations 
	var has3d = (function() {
		var el = document.createElement('div');
		var cssTransform = prefixed('transform');
		if (cssTransform) {
			el.style[cssTransform] = 'translateZ(0)';
			return /translatez/i.test(el.style[cssTransform]); 
		}
		
		return false;
	})();
	
	// borrow CSS prefix detection from Modernizr
	function prefixed(prop) {
		var prefixes = ['Webkit', 'Moz', 'O', 'ms'];
		var ucProp = prop.charAt(0).toUpperCase() + prop.slice(1);
		var props = (prop + ' ' + prefixes.join(ucProp + ' ') + ucProp).split(' ');
		var el = document.createElement('div');
		for (var i in props) {
			var prop = props[i];
			if (el.style[prop] !== undefined) {
				return prop;
			}
		}

		return null;
	}
	
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
			width: window.innerWidth,
			height: window.innerHeight
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
		
		var width = popup.width();
		var height = popup.height();
		
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
		var cssOrigin = prefixed('transformOrigin');
		var cssTransform = prefixed('transform');
		var style = elem[0].style;

		var tail = elem.find(options.tailSelector);
		var xOrigin = tail.css('left');
		var yOrigin = tail[0].offsetTop;
		if (elem.hasClass(options.belowClass)) {
			yOrigin -= tail.height();
		}
		
		yOrigin += 'px';

		style[cssOrigin] = xOrigin + ' ' + yOrigin;
		var prefix = has3d ? 'translateZ(0) ' : '';
		
		lastTween = new Tween({
			duration: 800,
			easing: 'easeOutElastic',
			step: function(pos) {
				style[cssTransform] = prefix + 'scale(' + pos + ')';
			},
			complete: function() {
//				style[cssTransform] = 'none';
				lastTween = null;
			}
		});
	}

	/**
	 * @param {jQuery} elem
	 * @param {Object} options
	 */
	function animateHide(elem, options) {
		var cssTransform = prefixed('transform');
		var style = elem[0].style;
		var prefix = has3d ? 'translateZ(0) ' : '';

		new Tween({
			duration: 400,
			easing: 'easeInBack',
			step: function(pos) {
				style[cssTransform] = prefix + 'scale(' + (1 - pos) + ')';
			},
			complete: function() {
				elem.remove();
			}
		});
	}
	
	return {
		show: function(text, pos) {
			this.hide();
			instance = $('<div class="CodeMirror-tooltip">' 
				+ '<div class="CodeMirror-tooltip__content">' + text + '</div>' 
				+ '<div class="CodeMirror-tooltip__tail"></div>' 
				+ '</div>')
				.css('transform', 'scale(0)')
				.appendTo(document.body);
			
			alignPopupWithTail(instance, {position: pos});
			animateShow(instance);
		},
		
		hide: function() {
			if (instance) {
				if (lastTween) {
					lastTween.stop();
					lastTween = null;
				}
				animateHide(instance);
				instance = null;
			}
		}
	};
})();