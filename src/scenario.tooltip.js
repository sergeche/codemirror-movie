/**
 * Extension that allows authors to display context tooltips bound to specific
 * positions
 */
CodeMirror.scenarioTooltip = (function() {
	
	var alignDefaults = {
		/** CSS selector for getting popup tail */
		tailSelector: '.CodeMirror-tooltip__tail',
		
		/** Class name for switching tail/popup position relative to target point */
		onTopClass: 'CodeMirror-tooltip_at-bottom',
		
		/** Min distance between popup and viewport */
		popupMargin: 5,
		
		/** Min distance between popup and its tail */
		tailMargin: 5
	};
	
	function getViewportRect() {
		var body = document.body
		var docElem = document.documentElement;
		var clientTop = docElem.clientTop  || body.clientTop  || 0,
		clientLeft = docElem.clientLeft || body.clientLeft || 0,
		scrollTop  = win.pageYOffset || jQuery.support.boxModel && docElem.scrollTop  || body.scrollTop,
		scrollLeft = win.pageXOffset || jQuery.support.boxModel && docElem.scrollLeft || body.scrollLeft,
		top  = box.top  + scrollTop  - clientTop,
		left = box.left + scrollLeft - clientLeft;
	}
	
	/**
	 * Helper function that finds optimal position of tooltip popup on page
	 * and aligns popup tail with this position
	 * @param {Zepto} popup
	 * @param {Object} options
	 */
	function alignPopupWithTail(popup, options) {
		options = _.extend({}, alignDefaults, options || {});
		
		popup.css({left: 0, top: 0});
		var tail = popup.find(options.tailSelector);
		
		var resultX = 0, resultY = 0;
		var pos = options.position;
		
		var width = popup.get(0).offsetWidth;
		var height = popup.get(0).offsetHeight;
		var rect = {
			
			width: window.innerWidth,
			height: window.innerHeight
		};
		var isTop;
			
		// считаем позицию по горизонтали
		resultX = Math.min(overlay.get(0).offsetWidth - width - options.popupMargin, Math.max(options.popupMargin, pos.x - rect.left - width / 2));
		
		// считаем позицию по вертикали
		if (height + tail.height() + options.popupMargin + rect.top < pos.y) {
			// размещаем сверху
			resultY = Math.max(0, pos.y - height - tail.height() - rect.top);
			isTop = true;
		} else {
			// размещаем снизу
			resultY = pos.y + tail.height() - rect.top;
			isTop = false;
		}
		
		// высчитываем позицию хвостика
		var tailMinLeft = options.tailMargin;
		var tailMaxLeft = width - tail.width() - options.tailMargin;
		tail.css('left', Math.min(tailMaxLeft, Math.max(tailMinLeft, pos.x - resultX - rect.left)));
		
		popup
			.css({
				top: resultY,
				left: resultX
			})
			.toggleClass(options.onTopClass, isTop);
	}
})();