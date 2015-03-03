/**
 * Shows fake prompt dialog with interactive value typing
 */
"use strict";

import tween from '../vendor/tween';
import {extend, template, has3d, prefixed} from '../utils';
import * as dom from '../dom';

var dialogInstance = null;
var bgInstance = null;
var lastTween = null;

export var actions = {
	prompt(options, editor, next, timer) {
		options = extend({
			title: 'Enter something',
			delay: 80,        // delay between character typing
			typeDelay: 1000,  // time to wait before typing text
			hideDelay: 2000   // time to wait before hiding prompt dialog
		}, wrap('text', options));
		
		show(options.title, editor.getWrapperElement(), function(dialog) {
			timer(function() {
				typeText(dialog.querySelector('.CodeMirror-prompt__input'), options, timer, function() {
					timer(function() {
						hide(next);
					}, options.hideDelay);
				});
			}, options.typeDelay);
		});
	}
};

export function show(text, target, callback) {
	hide();
	dialogInstance = dom.toDOM(`<div class="CodeMirror-prompt">
		<div class="CodeMirror-prompt__title">${text}</div>
		<input type="text" name="prompt" class="CodeMirror-prompt__input" readonly="readonly" />
		</div>`);
	bgInstance = dom.toDOM('<div class="CodeMirror-prompt__shade"></div>');
	
	target.appendChild(dialogInstance);
	target.appendChild(bgInstance);
	
	animateShow(dialogInstance, bgInstance, {complete: callback});
}

export function hide(callback) {
	if (dialogInstance) {
		if (lastTween) {
			lastTween.stop();
			lastTween = null;
		}
		animateHide(dialogInstance, bgInstance, {complete: callback});
		dialogInstance = bgInstance = null;
	} else if (callback) {
		callback();
	}
}

/**
 * @param {Element} dialog
 * @param {Element} bg
 * @param {Object} options 
 */
function animateShow(dialog, bg, options={}) {
	var cssTransform = prefixed('transform');
	var dialogStyle = dialog.style;
	var bgStyle = bg.style;
	var height = dialog.offsetHeight;
	var tmpl = template(has3d ? 'translate3d(0, <%= pos %>, 0)' : 'translate(0, <%= pos %>)');

	bgStyle.opacity = 0;
	tween({
		duration: 200,
		step(pos) {
			bgStyle.opacity = pos;
		}
	});
	
	dialogStyle[cssTransform] = tmpl({pos: -height});
	
	return lastTween = tween({
		duration: 400,
		easing: 'outCubic',
		step(pos) {
			dialogStyle[cssTransform] = tmpl({pos: (-height * (1 - pos)) + 'px'});
		},
		complete: function() {
			lastTween = null;
			options.complete && options.complete(dialog, bg);
		}
	});
}

/**
 * @param {Element} dialog
 * @param {Element} bg
 * @param {Object} options
 */
function animateHide(dialog, bg, options) {
	var dialogStyle = dialog.style;
	var bgStyle = bg.style;
	var height = dialog.offsetHeight;
	var cssTransform = prefixed('transform');
	var tmpl = template(has3d ? 'translate3d(0, <%= pos %>, 0)' : 'translate(0, <%= pos %>)');

	return tween({
		duration: 200,
		step(pos) {
			dialogStyle[cssTransform] = tmpl({pos: (-height * pos) + 'px'});
			bgStyle.opacity = 1 - pos;
		},
		complete() {
			dom.remove([dialog, bg]);
			options.complete && options.complete(dialog, bg);
		}
	});
}

function typeText(target, options, timer, next) {
	var chars = options.text.split('');
	timer(function perform() {
		target.value += chars.shift();
		if (chars.length) {
			timer(perform, options.delay);
		} else {
			next();
		}
	}, options.delay);
}

function wrap(key, value) {
	return typeof value === 'object' ? value : {[key]: value};
}