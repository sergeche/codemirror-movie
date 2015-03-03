/**
 * Extension that allows authors to display context tooltips bound to specific
 * positions
 */
"use strict";

import tween from '../vendor/tween';
import {extend, prefixed, makePos, has3d} from '../utils';
import * as dom from '../dom';

var instance = null;
var lastTween = null;

export var alignDefaults = {
	/** CSS selector for getting popup tail */
	tailClass: 'CodeMirror-tooltip__tail',
	
	/** Class name for switching tail/popup position relative to target point */
	belowClass: 'CodeMirror-tooltip_below',
	
	/** Min distance between popup and viewport */
	popupMargin: 5,
	
	/** Min distance between popup left/right edge and its tail */
	tailMargin: 11
};

export var actions = {
	/**
	 * Shows tooltip with given text, wait for `options.wait`
	 * milliseconds then hides tooltip
	 */
	tooltip(options, editor, next, timer) {
		options = extend({
			wait: 4000,   // time to wait before hiding tooltip
			pos: 'caret'  // position where tooltip should point to
		}, wrap('text', options));
		
		var pos = resolvePosition(options.pos, editor);
		show(options.text, pos, function() {
			timer(function() {
				hide(() => timer(next));
			}, options.wait);
		});
	},

	/**
	 * Shows tooltip with specified text. This tooltip should be explicitly 
	 * hidden with `hideTooltip` action
	 */
	showTooltip(options, editor, next, timer) {
		options = extend({
			pos: 'caret'  // position where tooltip should point to
		}, wrap('text', options));
		
		show(options.text, resolvePosition(options.pos, editor));
		next();
	},

	/**
	 * Hides tooltip, previously shown by 'showTooltip' action
	 */
	hideTooltip(options, editor, next, timer) {
		hide(next);
	}
};

export function show(text, pos, callback) {
	hide();
	
	instance = dom.toDOM(`<div class="CodeMirror-tooltip">
		<div class="CodeMirror-tooltip__content">${text}</div>
		<div class="CodeMirror-tooltip__tail"></div>
		</div>`);
	
	dom.css(instance, prefixed('transform'), 'scale(0)');
	document.body.appendChild(instance);
	
	alignPopupWithTail(instance, {position: pos});
	animateShow(instance, {complete: callback});
}

export function hide(callback) {
	if (instance) {
		if (lastTween) {
			lastTween.stop();
			lastTween = null;
		}
		animateHide(instance, {complete: callback});
		instance = null;
	} else if (callback) {
		callback();
	}
}

/**
 * Helper function that finds optimal position of tooltip popup on page
 * and aligns popup tail with this position
 * @param {Element} popup
 * @param {Object} options
 */
function alignPopupWithTail(popup, options={}) {
	options = extend({}, alignDefaults, options);
	
	dom.css(popup, {
		left: 0,
		top: 0
	});
	
	var tail = popup.querySelector('.' + options.tailClass);
	
	var resultX = 0, resultY = 0;
	var pos = options.position;
	var vp = dom.viewportRect();
	
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
	
	dom.css(popup, {
		left: resultX,
		top: resultY
	});
	
	popup.classList.toggle(options.belowClass, !isTop);
}

/**
 * @param {jQuery} elem
 * @param {Object} options 
 */
function animateShow(elem, options={}) {
	options = extend({}, alignDefaults, options);
	var cssOrigin = prefixed('transform-origin');
	var cssTransform = prefixed('transform');
	var style = elem.style;

	var tail = elem.querySelector('.' + options.tailClass);
	var xOrigin = dom.css(tail, 'left');
	var yOrigin = tail.offsetTop;
	if (elem.classList.contains(options.belowClass)) {
		yOrigin -= tail.offsetHeight;
	}
	
	yOrigin += 'px';

	style[cssOrigin] = xOrigin + ' ' + yOrigin;
	var prefix = has3d ? 'translateZ(0) ' : '';
	
	return lastTween = tween({
		duration: 800,
		easing: 'outElastic',
		step(pos) {
			style[cssTransform] = prefix + 'scale(' + pos + ')';
		},
		complete() {
			style[cssTransform] = 'none';
			lastTween = null;
			options.complete && options.complete(elem);
		}
	});
}

/**
 * @param {jQuery} elem
 * @param {Object} options
 */
function animateHide(elem, options) {
	var style = elem.style;

	return tween({
		duration: 200,
		easing: 'linear',
		step: function(pos) {
			style.opacity = (1 - pos);
		},
		complete: function() {
			dom.remove(elem);
			options.complete && options.complete(elem);
		}
	});
}

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

	if (typeof pos === 'object') {
		if ('x' in pos && 'y' in pos) {
			// passed absolute coordinates
			return pos;
		}

		if ('left' in pos && 'top' in pos) {
			// passed absolute coordinates
			return sanitizeCaretPos(pos);
		}
	}
	
	pos = makePos(pos, editor);
	return sanitizeCaretPos(editor.charCoords(pos));
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

function wrap(key, value) {
	return typeof value === 'object' ? value : {[key]: value};
}