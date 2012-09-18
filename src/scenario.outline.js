/**
 * Module that creates list of action hints and highlights items when specified
 * action is performed
 */
CodeMirror.scenarioOutline = (function() {
	
	var defaultOptions = {
		wrapperTemplate: '<ul class="CodeMirror-outline"><%= content %></ul>',
		itemTemplate: '<li data-action-id="<%= id %>" class="CodeMirror-outline__item"><%= title %></li>',
		itemSelector: '.CodeMirror-outline__item',
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
			return parseInt(a) - parseInt(b);
		});
		
		var itemTemplate = _.template(options.itemTemplate);
		var items = _.map(hintKeys, function(key) {
			return itemTemplate({
				title: hints[key],
				id: key
			});
		});
		
		var $el = $(_.template(options.wrapperTemplate, {
			content: items.join('')
		}));
		
		if (options.target) {
			$(options.target).append($el);
		}
		
		scenario.on('action', function(id) {
			var items = $el.find(options.itemSelector);
			var matchedItem = items.filter('[data-action-id="' + id + '"]');
			if (matchedItem.length) {
				items.removeClass(options.selectedClass);
				matchedItem.addClass(options.selectedClass);
			}
		});
		
		return $el;
	};
})();