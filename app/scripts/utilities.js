'use strict';

_.mixin({
	compactMap: function(list, iteratee, context) {
		return _.compact(_.map(list, iteratee, context));
	}
});

_.mixin(_.str.exports());