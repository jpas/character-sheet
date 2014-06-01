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

function AC(_ac, statList) {
	var base = 10;
	var dex = _ac.dexReplace || 'dex';
	var otherStats = _ac.otherStats;

	dex = statList[dex];
	if (otherStats) {
		for (var i = otherStats.length - 1; i >= 0; i--) {
			otherStats[i] = statList[otherStats[i]];
		}
	}

	this.total = function () {
		var t = base, i;
		if (otherStats) {
			for (i = otherStats.length - 1; i >= 0; i--) {
				t += otherStats[i].modifier();
			}
		}
		if (_ac.bonuses.length) {
			for (i = _ac.bonuses.length - 1; i >= 0; i--) {
				t += parseInt(_ac.bonuses[i].split('||')[1], 10) || 0;
			}
		}
		return t + dex.modifier();
	};

	this.touch = function () {
		var t = base, i;
		if (otherStats) {
			for (i = otherStats.length - 1; i >= 0; i--) {
				t += otherStats[i].modifier();
			}
		}
		if (_ac.bonuses.length) {
			for (i = _ac.bonuses.length - 1; i >= 0; i--) {
				var u = _ac.bonuses[i].split('||');
				switch (u[0]) {
					case 'Armor':
						break;
					case 'Mage Armor':
						break;
					case 'Armour':
						break;
					case 'Mage Armour':
						break;
					case 'Natural Armor':
						break;
					case 'Natural Armour':
						break;
					case 'Shield':
						break;
					default:
						t += parseInt(u[1], 10) || 0;
						break;
				}
			}
		}
		return t + dex.modifier();
	};

	this.flatfooted = function () {
		var t = base, i;
		if (otherStats) {
			for (i = otherStats.length - 1; i >= 0; i--) {
				t += otherStats[i].modifier();
			}
		}
		if (_ac.bonuses.length) {
			for (i = _ac.bonuses.length - 1; i >= 0; i--) {
				var u = _ac.bonuses[i].split('||');
				if (u[0] !== 'Dodge') {
					t += parseInt(u[1], 10) || 0;
				}
			}
		}
		return t;
	};

	return this;
}

function CMD(_cmd, _bab, statList) {
	var base = 10;
	var dex = _cmd.dexReplace || 'dex';
	var str = _cmd.strReplace || 'str';
	var otherStats = _cmd.otherStats;

	dex = statList[dex];
	str = statList[str];

	if (otherStats) {
		for (var i = otherStats.length - 1; i >= 0; i--) {
			otherStats[i] = statList[otherStats[i]];
		}
	}

	this.total = function () {
		var t = base, i;
		if (otherStats) {
			for (i = otherStats.length - 1; i >= 0; i--) {
				t += otherStats[i].modifier();
			}
		}
		if (_cmd.bonuses) {
			for (i = _cmd.bonuses.length - 1; i >= 0; i--) {
				t += parseInt(_cmd.bonuses[i].split('||')[1], 10) || 0;
			}
		}
		return t + dex.modifier() + _bab;
	};

	this.flatfooted = function () {
		var t = base, i;
		if (otherStats) {
			for (i = otherStats.length - 1; i >= 0; i--) {
				t += otherStats[i].modifier();
			}
		}
		if (_cmd.bonuses) {
			for (i = _cmd.bonuses.length - 1; i >= 0; i--) {
				var u = _cmd.bonuses[i].split('||');
				if (u[0] !== 'Dodge') {
					t += parseInt(u[1], 10) || 0;
				}
			}
		}
		return t + str.modifier() + _bab;
	};

	return this;
}

function Save(_save, statList) {
	var stat = statList[_save.stat];

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

function Attack(_attack, _bab, statList) {
	angular.extend(this, _attack);

	var stat = statList[_attack.stat];

	this.rolls = function() {
		var bab = _bab;
		var arr = [];
		do {
			var t = bab + stat.modifier();
			if (angular.isArray(_attack.bonuses)) {
				for (var i = _attack.bonuses.length - 1; i >= 0; i--) {
					t += parseInt(_attack.bonuses[i].split('||')[1]);
				}
			}
			arr.push(prependToString('1d20', t));
			bab -= 5;
		} while (bab > 0 && _attack.itterative);
		return arr;
	};
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
				var statList = character.statistics.abilities;
				// Offese
				//console.log(character.offense.attacks);
				angular.forEach(character.offense.attacks, function (type, name) {
					angular.forEach(type, function (attack, index) {
						character.offense.attacks[name][index] = new Attack(
							attack,
							character.statistics.bab,
							statList
						);
					});
				});
				/*
				angular.forEach(character.offense.attacks, function (type) {
					angular.forEach(type, function (attack) {
						attack = new Attack(
							attack,
							character.statistics.bab,
							statList
						);
						console.log(character.offense.attacks[type][attack]);
					});
				});
				*/
				// Defense
				// Armour Class
				character.defense.ac = new AC(
					character.defense.ac,
					statList
				);
				// Combad Maneuver Defence
				character.defense.cmd = new CMD(
					character.defense.cmd,
					character.statistics.bab,
					statList
				);
				// Saves
				character.defense.fort = new Save(
					character.defense.fort,
					statList
				);
				character.defense.refl = new Save(
					character.defense.refl,
					statList
				);
				character.defense.will = new Save(
					character.defense.will,
					statList
				);
				// Skills
				angular.forEach(character.skills, function (skill, name) {
					character.skills[name] = new Skill(
						name,
						skill,
						statList
					);
					if (character.skills[name].name === 'Perception') {
						character.perception = character.skills[name];
					}
				});
				angular.forEach(character.offense.spells, function (caster, key) {
					character.offense.spells[key] = new Caster(
						caster,
						statList
					);
				});
				angular.forEach(character.offense.slas, function (sla, key) {
					character.offense.slas[key] = new SLA(
						sla,
						statList
					);
				});
			});
			$scope.characters = characters;
		});
	}
]);