'use strict';

angular.module('charactersApp')
.filter('orderAbilityScores', function () {
	return function (abilities) {
		return [
			abilities.str,
			abilities.dex,
			abilities.con,
			abilities.int,
			abilities.wis,
			abilities.cha
		];
	};
})
.filter('filterSkills', function () {
	return function (skills, ranks) {
		var output = {};
		angular.forEach(skills, function(skill, name) {
			if (ranks === 'trained' ? skill.hasRanks() : !skill.hasRanks()) {
				output[name] = skill;
			}
		});
		return output;
	};
})
.filter('reverse', function () {
	return function (items) {
		return items.slice().reverse();
	};
})
.filter('orderObjectBy', function(){
	return function(input, attribute) {
		if (!angular.isObject(input)) {
			return input;
		}

		var array = [];
		for (var objectKey in input) {
			if (input.hasOwnProperty(objectKey)) {
				array.push(input[objectKey]);
			}
		}

		array.sort(function (a, b) {
			var alc = a[attribute].toLowerCase();
			var blc = b[attribute].toLowerCase();
			return alc > blc ? 1 : alc < blc ? -1 : 0;
		});
		return array;
	};
});