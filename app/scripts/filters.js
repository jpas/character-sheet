'use strict';

app.filter('orderAbilityScores', function () {
	return function (scores) {
		return [
			scores.str,
			scores.dex,
			scores.con,
			scores.int,
			scores.wis,
			scores.cha
		];
	};
});

app.filter('filterSkills', function () {
	return function (skills, ranks) {
		var output = {};
		angular.forEach(skills, function(skill, name) {
			if (ranks === 'trained' ? skill.hasRanks() : !skill.hasRanks()) {
				output[name] = skill;
			}
		});
		return output;
	};
});

app.filter('reverse', function () {
	return function (items) {
		return items.slice().reverse();
	};
});

app.filter('spellsFilter', function() {
	return function (spellLevel) {
		var output = [];
		for (var i=0; i < spellLevel.perDay; i++) {
			if (spellLevel.prepared[i])
				output[i] = spellLevel.prepared[i];
			else
				output[i] = "*unprepared*";
		};
		return output;
	}
})

app.filter('orderObjectBy', function(){
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