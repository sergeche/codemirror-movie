/**
 * Small DOM utility library
 */
(function(global) {
	"use strict";
	var w3cCSS = document.defaultView && document.defaultView.getComputedStyle;
	
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
		
		var props = _.map(params, function(v, k) {
			var name = k.replace(/([A-Z])/g, '-$1').toLowerCase();
			return name + ':' + ((_.isNumber(v) && !(name in numProps)) ? v + 'px' : v);
		});

		elem.style.cssText += ';' + props.join(';');
	}
	
	/**
	 * @returns {Array}
	 */
	function ar(obj) {
		if (obj.length === +obj.length) {
			return _.toArray(obj);
		}
		
		return _.isArray(obj) ? obj : [obj];
	}
	
	_.extend(global, {
		/**
		 * Trims whitespace from string
		 * @param {String} str
		 * @returns {String}
		 */
		trim: function(str) {
			if (str && 'trim' in String.prototype) {
				return str.trim();
			}
			
			return str.replace(/^\s+/, '').replace(/\s+$/, '');
		},
		
		/**
		 * Check if element contains given class
		 * @param {Element} elem
		 * @param {String} className
		 * @return {Boolean}
		 */
		hasClass: function(elem, className) {
			return ~(' ' + elem.className + ' ').indexOf(' ' + className + ' ');
		},
		
		/**
		 * Adds class name to given element
		 * @param {Element} elem
		 * @param {String} className
		 * @return {Element}
		 */
		addClass: function(elem, className) {
			_.each(ar(elem), function(el) {
				var classes = _.filter(className.split(/\s+/g), function(c) {
					return c && !this.hasClass(el, c);
				}, this);
				
				if (classes.length) {
					el.className += (el.className ? ' ' : '') + classes.join(' ');
				}
			}, this);
			
			return elem;
		},
		
		/**
		 * Removes given class name from specified element
		 * @param {Element} elem
		 * @param {String} className
		 * @return {Element}
		 */
		removeClass: function(elem, className) {
			var reSplit = /\s+/g;
			_.each(ar(elem), function(el) {
				el.className = _.difference((el.className || '').split(reSplit), className.split(/\s+/g)).join(' ');
			}, this);
			
			return elem;
		},
		
		/**
		 * Toggles given class on specified element
		 * @param {Element} elem
		 * @param {String} className
		 * @param {Boolean} cond
		 * @returns {Element}
		 */
		toggleClass: function(elem, className, cond) {
			_.each(ar(elem), function(el) {
				var c = cond;
				if (_.isUndefined(c)) {
					c = this.hasClass(el, className);
				}
				
				if (c) {
					this.removeClass(el, className);
				} else {
					this.addClass(el, className);
				}
			}, this);
			
			return elem;
		},
		
		/**
		 * Find elements with given class inside specified context element
		 * @param {String} className
		 * @param {Element} context Context element, default is <code>document</code> 
		 * @returns {Array}
		 */
		getByClass: function(className, context) {
			if (document.getElementsByClassName) {
				return (context || document).getElementsByClassName(className);
			}
			 
			return _.filter((context || document).getElementsByTagName('*'), function(elem) {
				return this.hasClass(elem, className);
			}, this);
		},
		
		/**
		 * Removes element from parent
		 * @param {Element} elem
		 * @returns {Element}
		 */
		remove: function(elem) {
			_.each(ar(elem), function(el) {
				if (el.parentNode) {
					el.parentNode.removeChild(el);
				}
			});
			
			return elem;
		},
		
		/**
		 * Renders string into DOM element
		 * @param {String} str
		 * @returns {Element}
		 */
		toDOM: function(str) {
			var div = document.createElement('div');
			div.innerHTML = str;
			return div.firstChild;
		},
		
		/**
		 * Sets or retrieves CSS property value
		 * @param {Element} elem
		 * @param {String} prop
		 * @param {String} val
		 */
		css: function(elem, prop, val) {
			if (_.isString(prop) && _.isUndefined(val)) {
				return getCSS(elem, prop);
			}
			
			if (_.isString(prop)) {
				var obj = {};
				obj[prop] = val;
				prop = obj;
			}
			
			setCSS(elem, prop);
		}
	});
})(_.dom = {});