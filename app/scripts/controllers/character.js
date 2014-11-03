'use strict';

var Character = function(data) {
	var that = this;

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
			'natural armor',
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

	var defaultValue = function(value, param) {
		if(_.isObject(value)) {
			return _.extend(value, param);
		}
		if (_.isUndefined(param)) {
			return value;
		} else {
			return param;
		}
	};

	function Bonus(data) {
		data = defaultValue({
			value: 0,
			type: 'untyped',
			target: 'none'
		}, data);

		this.value = data.value;
		this.type = data.type;
		this.target = data.target;

		this.toString = function() {
			return _.sprintf('%+d%s%s', this.value);
		};
	}

	function BonusSet(data) {
		data = defaultValue({
			name: 'Unnamed',
			bonuses: []
		}, data);

		_.each(data.bonuses, function(bonus, index) {
			this[index] = new Bonus(bonus);
		}, data.bonuses);

		this.getTargetting = function(targetID) {
			if (data.active === false) { return {}; }

			var found = _.filter(data.bonuses, function(bonus) {
				return bonus.target === targetID;
			});

			if (!_.isEmpty(found)) {
				return _.max(found, function(bonus)  {
					return bonus.value;
				});
			}

			return {};
		};

		this.getBonusString = function(targetID) {
			var bonus = this.getTargetting(targetID);

			if (!_.isUndefined(bonus.value)) {
				if (bonus.value !== 0) {
					return _.sprintf('%+d:%s', bonus.value, data.name.toLowerCase()); }
			}

			return '';
		};
	}

	var bonusHandler = {
		data: _.map(data.bonuses, function(bonus) {
			return new BonusSet(bonus);
		}),

		getBonuses: function(targetID, exempt) {
			if (!_.isArray(exempt)) { exempt = []; }
			var total = 0;

			var bonuses = _.map(this.data, function(bonusSet) {
				return bonusSet.getTargetting(targetID);
			});

			var types = _.groupBy(bonuses, function(bonus) {
				return bonus.type;
			});

			_.each(types, function(type, typeName) {
				if (isValidBonusType(typeName, exempt)) {
					if (bonusHandler.canStack(typeName)) {
						_.each(type, function(bonus) {
							total += bonus.value;
						});
					} else {
						var values = _.map(type, function(bonus) {
							if (bonus.value >= 0) {
								return bonus.value;
							}
							return 0;
						});

						if (!_.isEmpty(values)) {
							total += _.max(values);
						}

						values = _.map(type, function(bonus) {
							if (bonus.value < 0) {
								return bonus.value;
							}
							return 0;
						});

						total += _.reduce(values, function(sum, x) {
							return sum + x;
						}, 0);
					}
				}
			});

			return total;
		},

		getBonusesStrings: function(targetID) {
			return _.compactMap(this.data, function(bonusSet) {
				return bonusSet.getBonusString(targetID);
			});
		},

		canStack: function(type) {
			var stackable = [
				'circumstance',
				'dodge',
				'racial',
				'untyped'
			];
			return stackable.indexOf(type) > -1;
		},
	};

	function Score(data) {
		this.name = data.name;
		this.id = _(this.name).underscored();

		this.exemptTypes = [];

		this._exemptTypes = function() {
			_.each(data.exemptTypes, function(type) {
				if (type.indexOf('-') === 0) {
					var toRemoveIndex = this.exemptTypes.indexOf(type.slice(1));
					if (!_.isUndefined(toRemoveIndex)) {
						this.exemptTypes.splice(toRemoveIndex, 1);
					}
				} else if (isValidBonusType(type, this.exemptTypes)) {
					this.exemptTypes.push(type);
				}
			}, this);
		};

		this.stats = data.stats;
		if (data.stat) {
			this.stats = [data.stat]; }

		this.getTotal = function() {
			var total;

			if (_.isNumber(data.base)) { total = data.base; }
			total += bonusHandler.getBonuses(this.id, this.exemptTypes);

			return total;
		};

		this.getRoll = function() {
			return _.sprintf('%+d', this.getTotal());
		};
	}

	function AbilityScore(data) {
		Score.call(this, data);

		this.exemptTypes = [
			'armor',
			'deflection',
			'dodge',
			'natural armor',
			'shield'
		];
		this._exemptTypes();

		this.getTotal = function() {
			return data.base + bonusHandler.getBonuses(this.id, this.exemptTypes);
		};

		this.getModifier = function() {
			return Math.floor((this.getTotal()-10)/2);
		};

		this.getRoll = function() {
			return _.sprintf('%+d', this.getModifier());
		};
	}

	function Attack(data) {
		Score.call(this, data);

		this.exemptTypes = [
			'armor',
			'deflection',
			'dodge',
			'natural armor',
			'shield'
		];
		this._exemptTypes();

		this.getToHit = function() {
			var bab = defaultValue(0, data.bab);
			var bonusTotal = this.getTotal();

			bonusTotal += abilityScores.getModifiers(data.stats);
			bonusTotal += bonusHandler.getBonuses(
				_.sprintf('%s-to-hit', this.id),
				this.exemptTypes);
			bonusTotal += bonusHandler.getBonuses(
				_.sprintf('%s-to-hit', data.range),
				this.exemptTypes);
			bonusTotal += bonusHandler.getBonuses(
				_.sprintf('%s-%s-to-hit', data.range, this.id),
				this.exemptTypes);

			var rolls = _.sprintf('%+d', bab + bonusTotal);

			if(data.type === 'natural') { return rolls; }

			for (var itterative = bab - 5; itterative > 0; itterative -= 5) {
				rolls += _.sprintf('/%+d', itterative + bonusTotal);
			}

			return rolls;
		};

		this.getDamage = function() {
			if (data.noDamage) { return false; }
			var damageDice = defaultValue('', data.damageDice);
			var total = defaultValue(0, data.damageBase);

			total += abilityScores.getModifiers(data.damageStats);
			total += bonusHandler.getBonuses(
				_.sprintf('%s-damage-mult', this.id),
				this.exemptTypes);
			total += bonusHandler.getBonuses(
				_.sprintf('%s-damage-mult', data.range),
				this.exemptTypes);
			total += bonusHandler.getBonuses(
				_.sprintf('%s-%s-damage-mult', data.range, this.id),
				this.exemptTypes);

			if (data.twoHanded) { total += Math.floor(total*0.5); }

			total += bonusHandler.getBonuses(
				_.sprintf('%s-damage', this.id),
				this.exemptTypes);
			total += bonusHandler.getBonuses(
				_.sprintf('%s-damage', data.range),
				this.exemptTypes);
			total += bonusHandler.getBonuses(
				_.sprintf('%s-%s-damage', data.range, this.id),
				this.exemptTypes);

			if (total === 0) { return damageDice; }

			total = _.sprintf('%+d', total);

			var slashIndex = damageDice.indexOf('/');
			if (slashIndex > -1) { return _(damageDice).insert(slashIndex, total); }
			return damageDice + total;
		};
	}

	function Defense(data) {
		Score.call(this, data);

		this.exemptTypes = [
			'alchemical',
			'circumstance',
			'competence',
			'inherent',
			'morale',
			'resistance'
		];
		this._exemptTypes();

		data.base = defaultValue(10, data.base) + defaultValue(0, data.bab);

		data.touch = defaultValue({
			id: 'touch-',
			stats: ['dex'],
			exemptTypes: [
				'armor',
				'shield',
				'natural armor'
			]
		}, data.touch);

		data.flatfooted = defaultValue({
			id: 'flat-footed-',
			stats: ['str'],
			exemptTypes: []
		}, data.flatfooted);

		this.getTotal = function() {
			var total = data.base;

			total += abilityScores.getModifiers(data.stats);
			total += bonusHandler.getBonuses(this.id, this.exemptTypes);

			return total;
		};

		this._getSpecialDefense = function(specialData) {
			var total = data.base;
			var stats = _.flatten(_.intersection(data.stats, specialData.stats));
			var exemptTypes = _.flatten([this.exemptTypes, specialData.exemptTypes]);

			total += abilityScores.getModifiers(stats);
			total += bonusHandler.getBonuses(this.id, exemptTypes);
			total += bonusHandler.getBonuses(specialData.id + this.id, exemptTypes);

			return total;
		};

		this.getTouch = function() {
			return this._getSpecialDefense(data.touch);
		};


		this.getFlatFooted = function() {
			return this._getSpecialDefense(data.flatfooted);
		};

		this.toString = function() {
			var strings = bonusHandler.getBonusesStrings(this.id);

			_.each(data.stats, function(statName) {
				var roll = abilityScores.getRoll(statName, ':');
				if (roll !== '+0') { strings.push(roll + ':' + statName); }
			});

			if (_.isNumber(data.bab)) {
				strings.push(_.sprintf('%+d', data.bab) + ':bab');
			}

			strings = _.sortBy(strings, function(string) {
				var name = string.split(':')[1];
				return name;
			});

			_.each(strings, function(string, index) {
				this[index] = string.replace(':', ' ');
			}, strings);

			return strings.join(', ');
		};
	}

	function Save(data) {
		Score.call(this, data);

		this.exemptTypes = [
			'armor',
			'circumstance',
			'deflection',
			'dodge',
			'inherent',
			'natural armor',
			'shield',
			'size'
		];
		this._exemptTypes();

		this.getTotal = function() {
			var total = data.base;
			total += abilityScores.getModifiers(data.stats);
			total += bonusHandler.getBonuses(this.id, this.exemptTypes);
			total += bonusHandler.getBonuses('saves', this.exemptTypes);
			return total;
		};
	}

	function Skill(data) {
		Score.call(this, data);

		if(data.name.indexOf(' (') > -1) {
			data.baseID = _.underscored(data.name.slice(0, data.name.indexOf(' ('))); }

		this.getTotal = function() {
			var total = abilityScores.getModifiers(this.stats);

			total += bonusHandler.getBonuses(this.id, this.exemptTypes);
			if(data.baseID) { total += bonusHandler.getBonuses(data.baseID, this.exemptTypes); }
			if(data.ranks) { total += data.ranks; }
			if(data.classSkill && data.ranks > 0) { total += 3; }
			return total;
		};

		this.isTrained = function() {
			return data.ranks > 0;
		};
	}

	function Caster(data) {
		this.md = data.markdown;

		this.name = data.name;
		this.type = _.capitalize(data.type);
		this.level = _.sprintf('%+d', that.levels[data.name]);
		this.stats = data.stats;

		this.concentration = new Skill(defaultValue({
			name: _.sprintf('%s Concentration', data.name),
			ranks: that.levels[data.name],
			stats: data.stats || ['cha']
		}, data.concentration));

		this.spellResistance = new Skill(defaultValue({
			name: _.sprintf('%s Overcome Spell Resistance', data.name),
			ranks: that.levels[data.name],
			stats: data.stats || ['cha']
		}));
	}

	// info
	var info = data.info;
	this.id = _(info.name).underscored();
	this.portrait = info.portrait;

	this.name = info.name;

	if (info.cr && info.mr) {
		this.difficulty = _.sprintf('CR %d / MR %d', info.cr, info.mr);
	} else if (info.cr) {
		this.difficulty = _.sprintf('CR %d', info.cr);
	} else if (info.mr) {
		this.difficulty = _.sprintf('MR %d', info.mr);
	}

	if (info.xp.awarded) {
		this.xp = _.numberFormat(info.xp.awarded);
	} else {
		this.xp = _.sprintf(
			'%s / %s XP',
			_.numberFormat(info.xp.current),
			_.numberFormat(info.xp.nextLevel));
	}

	this.levels = info.levels;


	info.templates = defaultValue([], info.templates);
	info.race = defaultValue('', info.race);
	info.levels = _.map(info.levels, function(level, className) {
		return _.sprintf('%s %d', _(className).titleize(), level);
	}).join(', ');
	this.infoText = [
		_.join(' ', info.templates.join(' '), info.race, info.levels),
		_.join(' ', info.alignment, info.size, info.type)
	];

	this.senses = info.senses.join(', ');

	info.initiative = info.initiative || {};
	this.initiative = new Skill({
		name: 'Initiative',
		base: info.initiative.base,
		stats: info.initiative.stats || ['dex']
	});

	this.hp = _.sprintf('%d (%s)', info.hp, info.hd);
	if(info.hpSpecials) {
		this.hp += _.sprintf('; %s', info.hpSpecials.join(', ')); }

	function makeLink(thing) {
		if (_.isString(thing)) { return thing; }
		if (thing.link) {
			return _.sprintf('[%(name)s](%(link)s)', thing);
		} else {
			return thing.name;
		}
	}

	this.feats = _.map(data.feats, makeLink).join(', ');
	this.traits = _.map(data.traits, makeLink).join(', ');
	this.languages = data.info.languages.join(', ');

	this.speed = info.speed;
	this.space = info.space;
	this.reach = info.reach;

	this.specials = _.compactMap(data.specials, function(special) {
		if (special.indexOf('@') > 0) { return null; }
		return special;
	});
	this.gear = data.gear;

	// ability scores
	var abilityScores = {
		str: new AbilityScore({
			name: 'Strength',
			base: data.stats.scores.str
		}),
		dex: new AbilityScore({
			name: 'Dexterity',
			base: data.stats.scores.dex
		}),
		con: new AbilityScore({
			name: 'Constitution',
			base: data.stats.scores.con
		}),
		int: new AbilityScore({
			name: 'Intelligence',
			base: data.stats.scores.int
		}),
		wis: new AbilityScore({
			name: 'Wisdom',
			base: data.stats.scores.wis
		}),
		cha: new AbilityScore({
			name: 'Charisma',
			base: data.stats.scores.cha
		})
	};

	abilityScores.getModifier = function(scoreID) {
		return this[scoreID].getModifier(); };
	abilityScores.getRoll = function(scoreID) {
		return this[scoreID].getRoll(); };

	abilityScores.getModifiers = function(scoreIDs) {
		var modifiers = [];

		_.each(scoreIDs, function(scoreID, index) {
			this[index] = abilityScores.getModifier(scoreID);
		}, modifiers);

		return _.reduce(modifiers, function(a, b) {
			return a + b;
		}, 0);
	};

	this.abilityScores = function() {
		return [
			abilityScores.str,
			abilityScores.dex,
			abilityScores.con,
			abilityScores.int,
			abilityScores.wis,
			abilityScores.cha
		];
	};

	// offense
	this.bab = new Attack({
		name: 'Base Attack Bonus',
		base: data.stats.bab
	});

	this.cmb = new Attack(defaultValue({
		name: 'Combat Maneuver Bonus',
		bab: this.bab.getTotal(),
		base: 0,
		stats: ['str']
	}));

	this.meleeAttacks = _.map(data.attacks.melee, function (attack) {
		return new Attack(defaultValue({
			range: 'melee',
			type: 'weapon',
			bab: that.bab.getTotal(),
			base: 0,
			stats: ['str'],
			damageStats: ['str']
		}, attack));
	});

	this.rangedAttacks = _.map(data.attacks.ranged, function (attack) {
		return new Attack(defaultValue({
			range: 'ranged',
			type: 'weapon',
			bab: that.bab.getTotal(),
			base: 0,
			stats: ['dex']
		}, attack));
	});

	this.spells = _.map(data.spells, function(caster) {
		return new Caster(caster);
	});

	// defense
	var defense = data.defense;

	this.ac = new Defense(
		defaultValue({
			name: 'Armor Class',
			stats: ['dex'],
			exemptTypes: []
		}, defense.ac)
	);

	this.cmd = new Defense(
		defaultValue({
			name: 'Combat Maneuver Defense',
			stats: ['str', 'dex'],
			bab: this.bab.getTotal(),
			exemptTypes: [
				'armor',
				'shield',
				'natural armor'
			]
		}, defense.cmd)
	);

	this.saves = {
		fortitude: new Save(defaultValue({
			name: 'Fortitude',
			stats: ['con'],
			base: 0
		}, data.defense.fortitude)),
		reflex: new Save(defaultValue({
			name: 'Reflex',
			stats: ['dex'],
			base: 0
		}, data.defense.reflex)),
		will: new Save(defaultValue({
			name: 'Will',
			stats: ['wis'],
			base: 0
		}, data.defense.will))
	};

	this.specialDefenses = '';
	if (defense.dr) { this.specialDefenses += _.sprintf('**Damage Reduction** %s;', defense.dr); }
	if (defense.immune) { this.specialDefenses += _.sprintf('**Immune** %s;', defense.immune); }
	if (defense.resist) { this.specialDefenses += _.sprintf('**Resist** %s;', defense.resist); }
	if (defense.sr) { this.specialDefenses += _.sprintf('**Spell Resistance** %s;', defense.sr); }
	this.specialDefenses = _.trim(this.specialDefenses, ';');

	this.otherDefenses = defaultValue([], defense.otherDefenses).join(', ');

	// skills
	_.each(data.skills, function(skill, skillIndex) {
		this[skillIndex] = new Skill(skill);
	}, data.skills);

	this.skills = {};
	this.skills.trained = _.filter(data.skills, function(skill) {
		return skill.isTrained(); });
	this.skills.untrained = _.filter(data.skills, function(skill) {
		return !skill.isTrained(); });

	this.skills.get = function(skillID) {
		var trained = _.findWhere(this.trained, {id: skillID});
		var untrained = _.findWhere(this.untrained, {id: skillID});
		return trained || untrained;
	};

	// markdown extentions
	this.pf = {
		level: function(className, factor) {
			factor = factor || 1;
			return Math.floor(that.levels[className] * factor);
		},
		modifier: function(stat) {
			return abilityScores.getModifier(stat);
		},
		spellDC: function(className, level) {
			var caster = _.findWhere(that.spells, function(caster) {
				return caster.name === className;
			});

			return _.sprintf('DC %d', 10 + level + abilityScores.getModifiers(caster.stats));
		},
		classDC: function(className, stat, factor, min) {
			factor = factor || 0.5;
			min = min || 1;
			var classLevel = Math.floor(that.levels[className] * factor) || min;
			return _.sprintf('DC %d', 10 + classLevel + abilityScores.getModifier(stat));
		}
	};
};

app.controller('CharacterCtrl', [
	'$http',
	'$routeParams',
	'$scope',
	'$window',
	function ($http, $routeParams, $scope, $window) {
		$scope.Math = Math;
		$scope.characters = [];

		$http.get('characters/' + $routeParams.characterId + '/_data.json').success(function (data) {
			_.every(data, function(characterData, index) {
				$scope.characters[index] = new Character(characterData);
			});

			$window.document.title = $scope.characters[0].name + ' - Character Sheet';
		});
	}
]);