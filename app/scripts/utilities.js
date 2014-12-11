'use strict';
/* exported markdownArray, stringify */

_.mixin({
	compactMap: function(list, iteratee, context) {
		return _.compact(_.map(list, iteratee, context));
	}
});

_.mixin(_.str.exports());