/**
 * Module that creates list of action hints and highlights items when specified
 * action is performed
 */
"use strict";

import * as dom from '../dom';
import {template, find, toArray, extend} from '../utils';

export var defaultOptions = {
	wrapperTemplate: '<ul class="CodeMirror-outline"><%= content %></ul>',
	itemTemplate: '<li data-action-id="<%= id %>" class="CodeMirror-outline__item"><%= title %></li>',
	itemClass: 'CodeMirror-outline__item',
	selectedClass: 'CodeMirror-outline__item_selected'
};
	
/**
 * @param {Object} hints
 * @param {Scenario} scenario
 * @param {Object} options
 */
export default function(hints, scenario, options={}) {
	options = extend({}, defaultOptions, options);
	
	var hintKeys = Object.keys(hints).sort(function(a, b) {
		return a - b;
	});
	
	var itemTemplate = template(options.itemTemplate);
	var items = hintKeys.map(key => itemTemplate({title: hints[key], id: key}));
	
	var el = dom.toDOM(template(options.wrapperTemplate, {
		content: items.join('')
	}));
	
	if (options.target) {
		options.target.appendChild(el);
	}
	
	scenario
		.on('action', function(id) {
			var items = toArray(el.querySelectorAll('.' + options.itemClass));
			var matchedItem = find(items, elem => elem.getAttribute('data-action-id') == id);
			
			if (matchedItem) {
				items.forEach(item => item.classList.remove(options.selectedClass));
				matchedItem.classList.add(options.selectedClass);
			}
		})
		.on('stop', function() {
			toArray(el.querySelectorAll('.' + options.itemClass))
			.forEach(item => item.classList.remove(options.selectedClass));
		});
	
	return el;
};