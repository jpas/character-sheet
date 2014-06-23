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
		if (score === null) {
			return '\u2013';
		}
		return parseInt(score, 10) || 10;
	};

	this.modifier = function () {
		if (score === null) {
			return 0;
		}
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

function Skill(_name, _skill, scores) {
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
	var classSkill = ((_skill.classSkill && ranks > 0) ? 3 : 0);
	var stat = (_skill.override ? scores[_skill.override] : scores[skills[this.baseName]]);
	var bonuses = _skill.bonuses || [0];

	this.total = function () {
		var t = 0;
		for (var i = bonuses.length - 1; i >= 0; i--) {
			t += (typeof bonuses[i] === 'number') ? bonuses[i] : parseInt(bonuses[i].split('||')[1], 10);
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
			'Knowledge': 'fa fa-book',
			'Perform': 'fa fa-music',
			'Profession': 'fa fa-university'
		};
		return icons[this.baseName];
	};

	return this;
}


function Caster(_caster, scores) {
	angular.extend(this, _caster);

	var stat = scores[_caster.stat];
	var concentrationBonus = _caster.concentrationBonus;

	this.concentration = function () {
		return stat.modifier() + concentrationBonus + this.casterLevel;
	};

	return this;
}

function SLA(_sla, scores) {
	angular.extend(this, _sla);

	var stat = scores[_sla.stat];
	var concentrationBonus = _sla.concentrationBonus;

	this.concentration = function () {
		return stat.modifier() + concentrationBonus + this.casterLevel;
	};

	this.textFix = function (index) {
		return this.list[index].text.split('||');
	};

	return this;
}

function AC(_ac, scores) {
	var _stats = _ac.stats || ['dex'];
	var _bonuses = _ac.bonuses || [];

	var _ignore = {
		total: [],
		touch: [],
		flatfooted: []
	};

	angular.extend(_ignore, _ac.ignore);

	_ignore.touch = _ignore.touch.concat([
		'armor',
		'mage armor',
		'armour',
		'mage armour',
		'natural armor',
		'natural armour',
		'natural',
		'shield'
	]);

	_ignore.flatfooted = _ignore.flatfooted.concat([
		'dodge',
		'dex'
	]);

	angular.forEach(_ignore, function (type, key) {
		type.forEach(function (e, i, a) {
			if (e.slice(0, 1) === '-') {
				a.splice(i, 1);
				var t = e.slice(1);
				_ignore[key] = a.filter(function (e) {
					return e !== t;
				});
			}
		});
	});

	_stats.forEach(function (stat) {
		stat = scores[stat];
		_bonuses.push(prependToString(stat.sname + '||', stat.modifier()));
	});

	_bonuses.forEach(function (stat, index) {
		_bonuses[index] = _bonuses[index].toLowerCase();
	});

	this.total = function (ignore) {
		var total = 10;
		ignore = ignore || [];

		ignore = ignore.concat(_ignore.total || []);

		_bonuses.forEach(function (e) {
			var temp = e.split('||');
			if (ignore.indexOf(temp[0].toLowerCase()) === -1 || parseInt(temp[1], 10) < 0) {
				total += parseInt(temp[1], 10);
			}
		});

		return total;
	};

	this.touch = function () {
		return this.total(_ignore.touch);
	};

	this.flatfooted = function () {
		return this.total(_ignore.flatfooted);
	};

	this.toString = function () {
		return _bonuses.sort().map(function (e) {
			var t = e.split('||');
			return (t[1] + ' ' + t[0]).toLowerCase();
		}).join(', ');
	};

	return this;
}

function Save(_save, scores) {
	var stat = scores[_save.stat];

	this.roll = function() {
		var t = _save.base + stat.modifier();
		if (angular.isArray(_save.bonuses)) {
			for (var i = _save.bonuses.length - 1; i >= 0; i--) {
				t += parseInt(_save.bonuses[i].split('||')[1]);
			}
		}
		return prependToString('1d20', t);
	};

	return this;
}

function Attack(_attack, _bab, scores) {
	angular.extend(this, _attack);

	var stat = scores[_attack.stat || 'str'];

	this.rolls = function() {
		var bab = _bab;
		var arr = [];
		var i;
		var toHit = bab + stat.modifier();
		if (angular.isArray(_attack.bonuses)) {
			for (i = _attack.bonuses.length - 1; i >= 0; i--) {
				toHit += parseInt(_attack.bonuses[i].split('||')[1]);
			}
		}

		if (angular.isArray(_attack.iterative)) {
			for (i = 0; i < _attack.iterative.length; i++) {
				arr.push(prependToString(
					'1d20',
					toHit + _attack.iterative[i]
				));
			}
		} else {
			arr.push(prependToString(
				'1d20',
				toHit
			));
		}

		return arr;
	};
}

angular.module('charactersApp').controller('CharacterCtrl', [
	'$scope',
	'$http',
	'$routeParams',
	function ($scope, $http, $routeParams) {
		var characterUrl = 'characters/' + $routeParams.characterId;
		$scope.characterUrl = characterUrl;
		$scope.makeIdHref = function (idbase, c) {
			return '#/' + $routeParams.characterId + '#' + c.info.name.toLowerCase() + idbase;
		};
		$scope.prependToString = prependToString;
		$http.get(characterUrl + '.json').success(function (data) {
			characters = data;
			angular.forEach(characters, function (character) {
				character.stats.scores = {
					str: new AbilityScore(
						'Strength',
						character.stats.scores.str
						),
					dex: new AbilityScore(
						'Dexterity',
						character.stats.scores.dex
						),
					con: new AbilityScore(
						'Constitution',
						character.stats.scores.con
						),
					int: new AbilityScore(
						'Intelligence',
						character.stats.scores.int
						),
					wis: new AbilityScore(
						'Wisdom',
						character.stats.scores.wis
						),
					cha: new AbilityScore(
						'Charisma',
						character.stats.scores.cha
						)
				};
				var scores = character.stats.scores;
				// Offese
				// Attacks
				angular.forEach(character.offense.attacks, function (type, name) {
					angular.forEach(type, function (attack, index) {
						character.offense.attacks[name][index] = new Attack(
							attack,
							character.stats.bab,
							scores
						);
					});
				});
				// Defense
				// Armour Class
				character.defense.ac = character.defense.ac || {};
				character.defense.ac = new AC(
					character.defense.ac,
					scores
				);
				// Combad Maneuver Defence
				character.defense.cmd = character.defense.cmd || {};
				var cmd = character.defense.cmd;

				cmd.bonuses = cmd.bonuses || [];
				cmd.bab = cmd.bab || character.stats.bab;
				cmd.bonuses.push(prependToString('bab||', cmd.bab));

				cmd.stats = cmd.stats || [];
				cmd.stats.push('str');
				cmd.stats.push('dex');

				character.defense.cmd = new AC(
					character.defense.cmd,
					scores,
					true
				);
				// Saves
				character.defense.fort = new Save(
					character.defense.fort,
					scores
				);
				character.defense.refl = new Save(
					character.defense.refl,
					scores
				);
				character.defense.will = new Save(
					character.defense.will,
					scores
				);
				// Skills
				angular.forEach(character.skills, function (skill, name) {
					character.skills[name] = new Skill(
						name,
						skill,
						scores
					);
					if (character.skills[name].name === 'Perception') {
						character.perception = character.skills[name];
					}
				});
				character.hasTrainedSkills = function () {
					for (var skill in character.skills) {
						if (character.skills[skill].hasRanks()) {
							return true;
						}
					}
				};
				character.hasUntrainedSkills = function () {
					for (var skill in character.skills) {
						if (!character.skills[skill].hasRanks()) {
							return true;
						}
					}
				};
				// Spells/SLAs
				angular.forEach(character.offense.spells, function (caster, key) {
					character.offense.spells[key] = new Caster(
						caster,
						scores
					);
				});
				angular.forEach(character.offense.slas, function (sla, key) {
					character.offense.slas[key] = new SLA(
						sla,
						scores
					);
				});
			});
			$scope.characters = characters;
		});
	}
]);