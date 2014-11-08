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
	},
	stringify: function(things, separator) {
		if(_.isUndefined(things)) { return undefined; }

		separator = separator || ', ';

		function stringify(things) {
			var str = '';

			if(_.isNumber(things)) {
				str = things.toString();
			}

			else if(_.isString(things)) {
				str = things;
			}

			else if(_.isArray(things)) {
				_.each(things, function(thing) {
					if (!_.isUndefined(thing)) {
						str += _.stringify(thing) + separator;
					}
				});
			}

			else if(_.isObject(things)) {
				if(things.link && things.name) {
					str += _.sprintf('[%s](%s)', things.name, things.link);
				} else {
					str = _.stringify(_.map(things, function(thing, thingKey) {
						return _.sprintf('%s %s', thingKey, thing);
					}));
				}
			}

			return str;
		}

		var str = stringify(things);

		if(str.slice(-2) === ', ') {
			return str.slice(0, -2);
		}

		return str;
	},
});


_.mixin(_.str.exports());