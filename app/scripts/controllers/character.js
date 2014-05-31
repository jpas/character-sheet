'use strict';

var characters = [];

function prependToString(pre, value) {
	if (value >= 0) {
		return '' + pre + '+' + value;
	}
	return '' + pre + value;
}

function AbilityScore(name, score) {
	this.name = name;
	this.sname = name.slice(0, 3);

	this.score = function () {
		return parseInt(score, 10) || 10;
	};

	this.modifier = function () {
		return Math.floor((this.score() - 10) / 2);
	};

	this.toString = function () {
		return prependToString(
			this.name + ' ' + this.score + ': ',
			this.total()
		);
	};

	this.roll = function () {
		return prependToString('1d20', this.modifier());
	};

	return this;
}

function Skill(_name, _skill, statList) {
	var skills = {
		'Acrobatics': 'dex',
		'Appraise': 'int',
		'Bluff': 'cha',
		'Climb': 'str',
		'Craft': 'int',
		'Diplomacy': 'cha',
		'Disable Device': 'dex',
		'Disguise': 'cha',
		'Escape Artist': 'dex',
		'Fly': 'dex',
		'Handle Animal': 'cha',
		'Heal': 'wis',
		'Intimidate': 'cha',
		'Knowledge': 'int',
		'Linguistics': 'int',
		'Perception': 'wis',
		'Perform': 'cha',
		'Profession': 'wis',
		'Ride': 'dex',
		'Sense Motive': 'wis',
		'Sleight of Hand': 'dex',
		'Spellcraft': 'int',
		'Stealth': 'dex',
		'Survival': 'wis',
		'Swim': 'str',
		'Use Magic Device': 'cha'
	};

	var re = /\s\(|\)/;
	this.name = (_name.split(re).length > 1 ? _name.split(re)[1] : _name);
	this.baseName = (_name.split(re).length > 1 ? _name.split(re)[0] : _name);
	var ranks = (_skill.ranks >= 0 ? _skill.ranks : 0);
	var classSkill = (_skill.classSkill ? 3 : 0);
	var stat = (_skill.override ? statList[_skill.override] : statList[skills[this.baseName]]);
	var other = _skill.other || [0];

	this.total = function () {
		var t = 0;
		for (var i = other.length - 1; i >= 0; i--) {
			t += (typeof other[i] === 'number') ? other[i] : parseInt(other[i].split('||')[1], 10);
		}
		return ranks + stat.modifier() + classSkill + t;
	};

	this.hasRanks = function () {
		return ranks > 0;
	};

	this.toString = function () {
		return prependToString(_name + ': ', this.total());
	};

	this.roll = function () {
		return prependToString('1d20', this.total());
	};

	this.icon = function () {
		var icons = {
			'Craft': 'fa fa-gavel',
			'Knowledge': 'fa fa-graduation-cap',
			'Perform': 'fa fa-music',
			'Profession': 'fa fa-flask'
		};
		return icons[this.baseName];
	};

	return this;
}


function Caster(_caster, statList) {
	angular.extend(this, _caster);

	var stat = statList[_caster.stat];
	var concentrationBonus = _caster.concentrationBonus;

	this.concentration = function () {
		return stat.modifier() + concentrationBonus + this.casterLevel;
	};

	return this;
}

function SLA(_sla, statList) {
	angular.extend(this, _sla);

	var stat = statList[_sla.stat];
	var concentrationBonus = _sla.concentrationBonus;

	this.concentration = function () {
		return stat.modifier() + concentrationBonus + this.casterLevel;
	};

	this.textFix = function (index) {
		return this.list[index].text.split('||');
	};

	return this;
}

angular.module('charactersApp').controller('CharacterCtrl', [
	'$scope',
	'$http',
	'$routeParams',
	function ($scope, $http, $routeParams) {
		var characterUrl = 'characters/' + $routeParams.characterId + '.json';
		$scope.prependToString = prependToString;
		$http.get(characterUrl).success(function (data) {
			characters = data;
			angular.forEach(characters, function (character) {
				character.statistics.abilities = {
					str: new AbilityScore(
						'Strength',
						character.statistics.abilities.str
					),
					dex: new AbilityScore(
						'Dexterity',
						character.statistics.abilities.dex
					),
					con: new AbilityScore(
						'Constitution',
						character.statistics.abilities.con
					),
					int: new AbilityScore(
						'Intelligence',
						character.statistics.abilities.int
					),
					wis: new AbilityScore(
						'Wisdom',
						character.statistics.abilities.wis
					),
					cha: new AbilityScore(
						'Charisma',
						character.statistics.abilities.cha
					)
				};
				angular.forEach(character.skills, function (skill, name) {
					character.skills[name] = new Skill(
						name,
						skill,
						character.statistics.abilities
					);
					if (character.skills[name].name === 'Perception') {
						character.perception = character.skills[name];
					}
				});
				angular.forEach(character.offense.spells, function (caster, key) {
					character.offense.spells[key] = new Caster(
						caster,
						character.statistics.abilities
					);
				});
				angular.forEach(character.offense.slas, function (sla, key) {
					character.offense.slas[key] = new SLA(
						sla,
						character.statistics.abilities
					);
				});
			});
			$scope.characters = characters;
		});
	}
]);