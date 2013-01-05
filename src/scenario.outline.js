/**
 * Module that creates list of action hints and highlights items when specified
 * action is performed
 */
CodeMirror.scenarioOutline = (function() {
	"use strict";
	var defaultOptions = {
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
	return function(hints, scenario, options) {
		options = _.extend({}, defaultOptions, options || {});
		
		var hintKeys = _.keys(hints);
		hintKeys.sort(function(a, b) {
			return parseInt(a, 10) - parseInt(b, 10);
		});
		
		var itemTemplate = _.template(options.itemTemplate);
		var items = _.map(hintKeys, function(key) {
			return itemTemplate({
				title: hints[key],
				id: key
			});
		});
		
		var el = _.dom.toDOM(_.template(options.wrapperTemplate, {
			content: items.join('')
		}));
		
		if (options.target) {
			options.target.appendChild(el);
		}
		
		scenario
			.on('action', function(id) {
				var items = _.dom.getByClass(options.itemClass, el);
				var matchedItem = _.find(items, function(elem) {
					return elem.getAttribute('data-action-id') == id;
				});
				
				if (matchedItem) {
					_.dom.removeClass(items, options.selectedClass);
					_.dom.addClass(matchedItem, options.selectedClass);
				}
			})
			.on('stop', function() {
				_.dom.removeClass(_.dom.getByClass(options.itemClass, el), options.selectedClass);
			});
		
		return el;
	};
})();