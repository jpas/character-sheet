'use strict';
/* exported isValidBonusType, markdownArray, stringify */

var isValidBonusType = function(type, exempt) {
	var types = [
		'alchemical',
		'armor',
		'circumstance',
		'competence',
		'deflection',
		'dodge',
		'enhancement',
		'inherent',
		'insight',
		'luck',
		'morale',
		'natural_armor',
		'profane',
		'racial',
		'resistance',
		'sacred',
		'shield',
		'size',
		'trait',
		'untyped'
	];
	return types.indexOf(type) !== -1 && exempt.indexOf(type) === -1;
};

var markdownArray = function(things) {
	if (!_.isArray(things)) {
		things = [things];
	}
	return _.compactMap(things, function(thing) {
		if(!_.isString(thing)) { return null; }
		if (thing.indexOf('@') > 0) { return null; }
		return thing;
	});
};

var stringify = function(things, separator) {
	if(_.isUndefined(things)) { return undefined; }

	separator = separator || ', ';

	function _stringify(things) {
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
					str += _stringify(thing) + separator;
				}
			});
		}

		else if(_.isObject(things)) {
			if(things.link && things.text) {
				str += _.sprintf('[%s](%s)', things.text, things.link);
			} else {
				str = _stringify(_.map(things, function(thing, thingKey) {
					return _.sprintf('%s %s', thingKey, thing);
				}));
			}
		}

		return str;
	}

	var str = _stringify(things);

	if(str.slice(-separator.length) === separator) {
		return str.slice(0, -separator.length);
	}

	return str;
};

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