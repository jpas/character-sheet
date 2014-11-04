'use strict';

_.mixin({
	compactMap: function(list, iteratee, context) {
		return _.compact(_.map(list, iteratee, context));
	},
	defaultValue: function(value, param) {
		if(_.isObject(value)) {
			return _.extend(value, param);
		}
		if (_.isUndefined(param)) {
			return value;
		} else {
			return param;
		}
	}
});

_.mixin(_.str.exports());