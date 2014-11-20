'use strict';
/* exported isValidBonusType, markdownArray, stringify, changeDieBySteps */

var changeDieBySteps = function(die, steps) {
	if (!die.match(/\d+d\d+/g)) { return die; }
	die = die.split('d');

	var max = die[0]*die[1];

	function makeDie(max) {
		if (max < 4) {
			switch(max) {
				case 1: return '1';
				case 2: return '1d2';
				case 3: return '1d3';
			}
		}

		var size;

		if (max%6 === 0) { size = 6; }
		else if (max%8 === 0) { size = 8; }
		else if (max%10 === 0) { size = 10; }
		else if (max%4 === 0) { size = 4; }

		return _.sprintf('%dd%d', (max/size), size);
	}

	function moveSteps(max, steps) {
		if (steps === 0) {
			return makeDie(max);
		} else if (steps < 0) {
			if (max === 2) { return '1'; }
			max = Math.ceil(max*2/3);
			steps++;
		} else {
			max = Math.ceil(max*1.5);
			steps--;
		}

		while (max%10 !== 0 && max%8 !== 0 && max%6 !== 0 && max%4 !== 0) {
			max--;
		}

		return moveSteps(max, steps);
	}

	return moveSteps(max, steps);
};

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
	}
});

_.mixin(_.str.exports());