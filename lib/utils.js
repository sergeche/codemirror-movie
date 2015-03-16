var propCache = {};

// detect CSS 3D Transforms for smoother animations 
export var has3d = (function() {
	var el = document.createElement('div');
	var cssTransform = prefixed('transform');
	if (cssTransform) {
		el.style[cssTransform] = 'translateZ(0)';
		return (/translatez/i).test(el.style[cssTransform]); 
	}
	
	return false;
})();

export function extend(obj, ...args) {
	args.forEach(a => {
		if (typeof a === 'object') {
			Object.keys(a).forEach(key => obj[key] = a[key]);
		}
	});
	return obj;
}

export function toArray(obj, ix=0) {
	return Array.prototype.slice.call(obj, ix);
}

/**
 * Returns prefixed (if required) CSS property name
 * @param  {String} prop
 * @return {String}
 */
export function prefixed(prop) {
	if (prop in propCache) {
		return propCache[prop];
	}

	var el = document.createElement('div');
	var style = el.style;

	var prefixes = ['o', 'ms', 'moz', 'webkit'];
	var props = [prop];
	var capitalize = function(str) {
		return str.charAt(0).toUpperCase() + str.substr(1);
	};

	prop = prop.replace(/\-([a-z])/g, function(str, ch) {
		return ch.toUpperCase();
	});

	var capProp = capitalize(prop);
	prefixes.forEach(function(prefix) {
		props.push(prefix + capProp, capitalize(prefix) + capProp);
	});

	for (var i = 0, il = props.length; i < il; i++) {
		if (props[i] in style) {
			return propCache[prop] = props[i];
		}
	}

	return propCache[prop] = null;
}

export function posObj(obj) {
	return {
		line: obj.line,
		ch: obj.ch
	};
}

export function getCursor(editor, start='from') {
	return posObj(editor.getCursor(start));
}

/**
 * Helper function that produces <code>{line, ch}</code> object from
 * passed argument
 * @param {Object} pos
 * @param {CodeMirror} editor
 * @returns {Object}
 */
export function makePos(pos, editor) {
	if (pos === 'caret') {
		return getCursor(editor);
	}

	if (typeof pos === 'string') {
		if (~pos.indexOf(':')) {
			let parts = pos.split(':');
			return {
				line: +parts[0],
				ch: +parts[1]
			};
		}
		
		pos = +pos;
	}
	
	if (typeof pos === 'number') {
		return posObj(editor.posFromIndex(pos));
	}
	
	return posObj(pos);
}

export function template(tmpl, data) {
	var fn = data => tmpl.replace(/<%([-=])?\s*([\w\-]+)\s*%>/g, (str, op, key) => data[key.trim()]);
	return data ? fn(data) : fn;
}

export function find(arr, iter) {
	var found;
	arr.some((item, i, arr) => {
		if (iter(item, i, arr)) {
			return found = item;
		}
	});
	return found;
}

/**
 * Relaxed JSON parser.
 * @param {String} text
 * @returns {Object} 
 */
export function parseJSON(text) {
	try {
		return (new Function('return ' + text))();
	} catch(e) {
		return {};
	}
}