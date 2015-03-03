"use strict";

import {toArray} from './utils';

var w3cCSS = document.defaultView && document.defaultView.getComputedStyle;

export function viewportRect() {
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
 * Removes element from parent
 * @param {Element} elem
 * @returns {Element}
 */
export function remove(elem) {
	ar(elem).forEach(el => el.parentNode && el.parentNode.removeChild(el));
	return elem;
}

/**
 * Renders string into DOM element
 * @param {String} str
 * @returns {Element}
 */
export function toDOM(str) {
	var div = document.createElement('div');
	div.innerHTML = str;
	return div.firstChild;
}

/**
 * Sets or retrieves CSS property value
 * @param {Element} elem
 * @param {String} prop
 * @param {String} val
 */
export function css(elem, prop, val) {
	if (typeof prop === 'string' && val == null) {
		return getCSS(elem, prop);
	}
	
	if (typeof prop === 'string') {
		var obj = {};
		obj[prop] = val;
		prop = obj;
	}
	
	setCSS(elem, prop);
}

function ar(obj) {
	if (obj.length === +obj.length) {
		return toArray(obj);
	}
	
	return Array.isArray(obj) ? obj : [obj];
}

function toCamelCase(name) {
	return name.replace(/\-(\w)/g, function(str, p1) {
		return p1.toUpperCase();
	});
}

/**
 * Returns CSS property value of given element.
 * @author jQuery Team
 * @param {Element} elem
 * @param {String} name CSS property value
 */
function getCSS(elem, name) {
	var rnumpx = /^-?\d+(?:px)?$/i,
		rnum = /^-?\d(?:\.\d+)?/,
		rsuf = /\d$/;
	
	var nameCamel = toCamelCase(name);
	// If the property exists in style[], then it's been set
	// recently (and is current)
	if (elem.style[nameCamel]) {
		return elem.style[nameCamel];
	} 
		
	if (w3cCSS) {
		var cs = window.getComputedStyle(elem, '');
		return cs.getPropertyValue(name);
	}
	
	if (elem.currentStyle) {
		var ret = elem.currentStyle[name] || elem.currentStyle[nameCamel];
		var style = elem.style || elem;
		
		// From the awesome hack by Dean Edwards
		// http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291
		
		// If we're not dealing with a regular pixel number
		// but a number that has a weird ending, we need to convert it to pixels
		if (!rnumpx.test(ret) && rnum.test(ret)) {
			// Remember the original values
			var left = style.left, rsLeft = elem.runtimeStyle.left;
			
			// Put in the new values to get a computed value out
			elem.runtimeStyle.left = elem.currentStyle.left;
			var suffix = rsuf.test(ret) ? 'em' : '';
			style.left = nameCamel === 'fontSize' ? '1em' : (ret + suffix || 0);
			ret = style.pixelLeft + 'px';
			
			// Revert the changed values
			style.left = left;
			elem.runtimeStyle.left = rsLeft;
		}
		
		return ret;
	}
}

/**
 * Sets CSS properties to given element
 * @param {Element} elem
 * @param {Object} params CSS properties to set
 */
function setCSS(elem, params) {
	if (!elem) {
		return;
	}

	var numProps = {'line-height': 1, 'z-index': 1, opacity: 1};
	var props = Object.keys(params).map(k => {
		var v = params[k];
		var name = k.replace(/([A-Z])/g, '-$1').toLowerCase();
		return name + ':' + ((typeof v === 'number' && !(name in numProps)) ? v + 'px' : v);
	});

	elem.style.cssText += ';' + props.join(';');
}