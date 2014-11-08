'use strict';
/* exported Character */

function Character(data) {
	var that = this;

	// *********************************************************************************************
	// Objects
	// *********************************************************************************************

	function Bonus(data) {
		data = _.defaultValue({
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
		data = _.defaultValue({
			name: 'Unnamed',
			bonuses: []
		}, data);

		_.each(data.bonuses, function(bonus, index) {
			this[index] = new Bonus(bonus);
		}, data.bonuses);

		this.name = data.name;
		this.active = data.active;
		this.canToggle = !_.isUndefined(data.active);
		this.locked = data.locked;

		this.getTargetting = function(targetID) {
			if (this.active === false) { return {}; }

			var found = _.filter(data.bonuses, function(bonus) {
				return bonus.target === targetID;
			});

			if (!_.isEmpty(found)) {
				return _.max(found, function(bonus) {
					return bonus.value;
				});
			}

			return {};
		};

		this.getBonusString = function(targetID) {
			var bonus = this.getTargetting(targetID);

			if (!_.isUndefined(bonus.value)) {
				if (bonus.value !== 0) {
					return _.sprintf('%+d:%s', bonus.value, bonus.type); }
			}

			return '';
		};
	}

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
			total += bonusHandler.getBonus(this.id, this.exemptTypes);

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
			var total = data.base + bonusHandler.getBonus(this.id, this.exemptTypes);

			if (this.id === 'dexterity') {
				var maxDex = bonusHandler.getMaxDex()*2 + 11;
				if (total > maxDex) {
					return maxDex;
				}
			}

			return total;
		};

		this.getModifier = function(factor) {
			factor = factor || 1;
			var modifier = Math.floor((this.getTotal()-10)/2);
			return Math.floor(modifier * factor);
		};

		this.getRoll = function() {
			return _.sprintf('%+d', this.getModifier());
		};
	}

	function Attack(data, def) {
		data = _.defaultValue(def || {}, data);
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
			var bab = data.bab;
			var total = this.getTotal();

			total += abilityScores.getModifiers(data.stats);
			total += bonusHandler.getBonus(this.id + '_to_hit', this.exemptTypes);
			total += bonusHandler.getBonus(data.range + '_to_hit', this.exemptTypes);

			var rolls = _.sprintf('%+d', bab + total);

			if(data.type === 'natural') { return rolls; }

			for (var itterative = bab - 5; itterative > 0; itterative -= 5) {
				rolls += _.sprintf('/%+d', itterative + total);
			}

			return rolls;
		};

		this.getDamage = function() {
			if (data.noDamage) { return false; }
			var dice = _.defaultValue('', data.damageDice);

			var total = 0;
			var factor = data.damageFactor || 1;
			var stats = data.damageStats;
			var range = data.range;

			if (data.damageBase) { total += data.damageBase; }
			if (_.contains(stats, 'strength')) {total += abilityScores.getModifier('strength', factor); }
			total += abilityScores.getModifiers(_.without(data.damageStats, 'strength'));

			total += bonusHandler.getBonus('damage', this.exemptTypes);
			total += bonusHandler.getBonus(this.id + '_damage', this.exemptTypes);
			total += bonusHandler.getBonus(range + '_damage', this.exemptTypes);
			total += bonusHandler.getBonus(range + '_strength_like_damage', this.exemptTypes, factor);

			if (total === 0) { return dice; }

			total = _.sprintf('%+d', total);

			if (_.contains(dice, '/')) {
				var index = dice.indexOf('/');
				return _(dice).insert(index, total);
			}

			return dice + total;
		};
	}

	function Defense(data, def) {
		data = _.defaultValue(def || {}, data);
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

		data.base = _.defaultValue(10, data.base) + _.defaultValue(0, data.bab);

		data.touch = _.defaultValue({
			id: 'touch_',
			stats: ['dexterity'],
			exemptTypes: [
				'armor',
				'shield',
				'natural armor'
			]
		}, data.touch);

		data.flatfooted = _.defaultValue({
			id: 'flat_footed_',
			stats: ['strength'],
			exemptTypes: []
		}, data.flatfooted);

		this.getTotal = function() {
			var total = data.base;

			total += abilityScores.getModifiers(data.stats);
			total += bonusHandler.getBonus(this.id, this.exemptTypes);

			return total;
		};

		this._getSpecialDefense = function(specialData) {
			var total = data.base;
			var stats = _.flatten(_.intersection(data.stats, specialData.stats));
			var exemptTypes = _.flatten([this.exemptTypes, specialData.exemptTypes]);

			total += abilityScores.getModifiers(stats);
			total += bonusHandler.getBonus(this.id, exemptTypes);
			total += bonusHandler.getBonus(specialData.id + this.id, exemptTypes);

			return total;
		};

		this.getTouch = function() {
			return this._getSpecialDefense(data.touch);
		};


		this.getFlatFooted = function() {
			return this._getSpecialDefense(data.flatfooted);
		};

		this.toString = function() {
			var strings = bonusHandler.getBonusStrings(this.id);

			_.each(data.stats, function(statName) {
				var roll = abilityScores.getRoll(statName, ':');
				if (roll !== '+0') { strings.push(roll + ':' + statName); }
			});

			if (_.isNumber(data.bab) && data.bab !== 0) {
				strings.push(_.sprintf('%+d', data.bab) + ':base attack bonus');
			}

			strings = _.sortBy(strings, function(string) {
				var name = string.split(':')[1];
				return name;
			});

			_.each(strings, function(string, index) {
				this[index] = string.replace(':', ' ');
			}, strings);

			return _.join(', ', strings);
		};
	}

	function Save(data, def) {
		data = _.defaultValue(def || {}, data);
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
			total += bonusHandler.getBonus(this.id, this.exemptTypes);
			total += bonusHandler.getBonus('saves', this.exemptTypes);
			return total;
		};
	}

	function Skill(data) {
		Score.call(this, data);

		if(data.name.indexOf(' (') > -1) {
			data.baseID = _.underscored(data.name.slice(0, data.name.indexOf(' ('))); }

		this.getTotal = function() {
			var total = abilityScores.getModifiers(this.stats);

			total += bonusHandler.getBonus(this.id, this.exemptTypes);
			if(data.baseID) { total += bonusHandler.getBonus(data.baseID, this.exemptTypes); }
			if(_.contains(data.stats, 'strength') || _.contains(data.stats, 'dexterity')) {
				total += bonusHandler.getBonus('armor-check-penalty', this.exemptTypes);
			}
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

		if(data.stat) { data.stats = [data.stat]; }
		this.stats = data.stats;

		this.concentration = new Skill(_.defaultValue({
			name: _.sprintf('%s Concentration', data.name),
			ranks: that.levels[data.name],
			stats: data.stats || ['charisma']
		}, data.concentration));

		this.spellResistance = new Skill(_.defaultValue({
			name: _.sprintf('%s Overcome Spell Resistance', data.name),
			ranks: that.levels[data.name],
			stats: data.stats || ['charisma']
		}));
	}

	var bonusHandler = {
		data: _.map(data.bonuses, function(bonus) {
			return new BonusSet(bonus);
		}),

		getTypes: function(targetID, exempt, factor) {
			if (!_.isArray(exempt)) { exempt = []; }
			factor = factor || 1;

			var bonuses = _.map(this.data, function(bonusSet) {
				return bonusSet.getTargetting(targetID);
			});

			var types = _.groupBy(bonuses, function(bonus) {
				return bonus.type;
			});

			var typeTotal = {};

			_.each(types, function(type, typeName) {
				if (isValidBonusType(typeName, exempt)) {
					typeTotal[typeName] = 0;
					if (bonusHandler.canStack(typeName)) {
						_.each(type, function(bonus) {
							var value = bonus.value;
							if (value < 0) {
								typeTotal[typeName] += value;
							} else {
								typeTotal[typeName] += Math.floor(bonus.value * factor);
							}
						});
					} else {
						var values = _.map(type, function(bonus) {
							if (bonus.value >= 0) {
								return bonus.value;
							}
							return 0;
						});

						if (!_.isEmpty(values)) {
							typeTotal[typeName] += Math.floor(_.max(values) * factor);
						}

						values = _.map(type, function(bonus) {
							if (bonus.value < 0) {
								return bonus.value;
							}
							return 0;
						});

						typeTotal[typeName] += _.reduce(values, function(sum, x) {
							return sum + x;
						}, 0);
					}
				}
			});

			return typeTotal;
		},

		getBonus: function(targetID, exempt, factor) {
			var types = this.getTypes(targetID, exempt, factor);
			return _.reduce(types, function(sum, x) {
				return sum + x;
			}, 0);
		},

		getBonusStrings: function(targetID, exempt, factor) {
			var types = this.getTypes(targetID, exempt, factor);

			return _.compactMap(types, function(bonus, type) {
				return _.sprintf('%+d:%s', bonus, type);
			});
		},

		getMaxDex: function() {
			var bonuses = _.map(this.data, function(bonusSet) {
				return bonusSet.getTargetting('max_dex');
			});

			return _.min(bonuses, function(bonus) {
				return bonus.value;
			}).value;
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

	// *********************************************************************************************
	// Character Info
	// *********************************************************************************************

	this.name = data.name || '';
	this.id = _(this.name).underscored();
	this.portrait = data.portrait || '';

	this.bonuses = bonusHandler.data;

	if (data.cr && data.mr) {
		this.difficulty = _.sprintf('CR %d / MR %d', data.cr, data.mr);
	} else if (data.cr) {
		this.difficulty = _.sprintf('CR %d', data.cr);
	} else if (data.mr) {
		this.difficulty = _.sprintf('MR %d', data.mr);
	}

	if (data.xp) {
		if (data.xp.awarded) {
			this.xp = _.numberFormat(data.xp.awarded);
		} else {
			this.xp = _.sprintf(
				'%s / %s XP',
				_.numberFormat(data.xp.current),
				_.numberFormat(data.xp.nextLevel));
		}
	}

	this.levels = data.levels;

	this.initiative = new Skill(_.defaultValue({
		name: 'Initiative',
		stats: ['dexterity'],
		base: 0
	}, data.initiative));

	this.senses = _.stringify(data.senses);

	this.hp = _.sprintf('%d (%s)', data.hp, data.hd);
	this.hpSpecial = _.stringify(data.hpSpecial);

	this.speed = _.stringify(data.speed);
	this.space = _.stringify(data.space);
	this.reach = _.stringify(data.reach);

	this.infoText = [
		_.stringify([data.templates, data.race, data.levels], ' '),
		_.stringify([data.alignment, data.size, data.type], ' ')
	];

	this.feats = _.stringify(data.feats);
	this.traits = _.stringify(data.traits);
	this.languages = _.stringify(data.languages);

	this.specials = _.compactMap(data.specials, function(special) {
		if (special.indexOf('@') > 0) { return null; }
		return special;
	});
	this.gear = data.gear;

	// *********************************************************************************************
	// Ability Scores
	// *********************************************************************************************

	var abilityScores = {
		strength: new AbilityScore({
			name: 'Strength',
			base: data.abilityScores.strength
		}),
		dexterity: new AbilityScore({
			name: 'Dexterity',
			base: data.abilityScores.dexterity
		}),
		constitution: new AbilityScore({
			name: 'Constitution',
			base: data.abilityScores.constitution
		}),
		intelligence: new AbilityScore({
			name: 'Intelligence',
			base: data.abilityScores.intelligence
		}),
		wisdom: new AbilityScore({
			name: 'Wisdom',
			base: data.abilityScores.wisdom
		}),
		charisma: new AbilityScore({
			name: 'Charisma',
			base: data.abilityScores.charisma
		})
	};

	abilityScores.getModifier = function(scoreID, factor) {
		factor = factor || 1;
		var modifier = this[scoreID].getModifier(factor);
		if (modifier < 0) { return modifier; }

		return modifier;
	};
	abilityScores.getRoll = function(scoreID) { return this[scoreID].getRoll(); };

	abilityScores.getModifiers = function(scoreIDs, factor) {
		var modifiers = [];

		_.each(scoreIDs, function(scoreID, index) {
			this[index] = abilityScores.getModifier(scoreID, factor);
		}, modifiers);

		return _.reduce(modifiers, function(a, b) {
			return a + b;
		}, 0);
	};

	this.abilityScores = function() {
		return [
			abilityScores.strength,
			abilityScores.dexterity,
			abilityScores.constitution,
			abilityScores.intelligence,
			abilityScores.wisdom,
			abilityScores.charisma
		];
	};

	// *********************************************************************************************
	// Offense
	// *********************************************************************************************

	this.bab = new Attack({
		name: 'Base Attack Bonus',
		base: _.defaultValue(0, data.baseAttackBonus)
	});

	this.cmb = new Attack(data.combatManeuverBonus, {
		name: 'Combat Maneuver Bonus',
		bab: this.bab.getTotal(),
		base: 0,
		stats: ['strength']
	});

	var attacks = _.defaultValue({
		melee: [],
		ranged: [],
		special: []
	}, data.attacks);

	this.meleeAttacks = _.map(attacks.melee, function (attack) {
		return new Attack(attack, {
			range: 'melee',
			type: 'weapon',
			bab: that.bab.getTotal(),
			base: 0,
			stats: ['strength'],
			damageStats: ['strength']
		});
	});

	this.rangedAttacks = _.map(attacks.ranged, function (attack) {
		return new Attack(attack, {
			range: 'ranged',
			type: 'weapon',
			bab: that.bab.getTotal(),
			base: 0,
			stats: ['dexterity']
		});
	});

	this.specialAttacks = _.map(attacks.special, function (attack) {
		return new Attack(attack, {
			range: 'special',
			type: 'special',
			bab: that.bab.getTotal(),
			base: 0,
			stats: []
		});
	});

	this.spells = _.map(data.spells, function(caster) {
		return new Caster(caster);
	});

	// *********************************************************************************************
	// Defense
	// *********************************************************************************************

	var defense = data.defense || {};

	this.ac = new Defense(defense.ac, {
		name: 'Armor Class',
		stats: ['dexterity'],
		exemptTypes: []
	});

	this.cmd = new Defense(defense.cmd, {
		name: 'Combat Maneuver Defense',
		stats: ['strength', 'dexterity'],
		bab: this.bab.getTotal(),
		exemptTypes: [
			'armor',
			'shield',
			'natural armor'
		]
	});

	var saves = _.defaultValue({
		fortitude: {},
		reflex: {},
		will: {},
		special: undefined
	}, data.saves);

	this.saves = {
		fortitude: new Save(saves.fortitude, {
			name: 'Fortitude',
			stats: ['constitution'],
			base: 0
		}),
		reflex: new Save(saves.reflex, {
			name: 'Reflex',
			stats: ['dexterity'],
			base: 0
		}),
		will: new Save(saves.will, {
			name: 'Will',
			stats: ['wisdom'],
			base: 0
		}),
		special: _.stringify(data.saves.special)
	};

	this.defensiveAbilities = _.stringify(data.defense);

	this.dr = _.stringify(data.dr);
	this.immune = _.stringify(data.immune);
	this.resist = _.stringify(data.resist);
	this.sr = _.stringify(data.sr);

	// *********************************************************************************************
	// Skills
	// *********************************************************************************************

	_.each(data.skills, function(skill, skillIndex) {
		this[skillIndex] = new Skill(skill);
	}, data.skills);

	this.skills = {};
	this.skills.trained = _.filter(data.skills, function(skill) {
		return skill.isTrained();
	});
	this.skills.untrained = _.filter(data.skills, function(skill) {
		return !skill.isTrained();
	});

	this.skills.get = function(skillID) {
		var trained = _.findWhere(this.trained, {id: skillID});
		var untrained = _.findWhere(this.untrained, {id: skillID});
		return trained || untrained;
	};

	// *********************************************************************************************
	// Markdown Functions
	// *********************************************************************************************

	this.pf = {
		name: this.name,
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
}