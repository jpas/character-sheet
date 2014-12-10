'use strict';
/* exported pf */

var pf = (function() {
	var pf = {};

	function Character(data) {
		var that = this;

		// *********************************************************************************************
		// Objects
		// *********************************************************************************************

		function Bonus(data) {
			data = _.defaults(data, {
				value: 0,
				type: 'untyped',
				target: 'none'
			});

			this.value = data.value;
			this.type = data.type;
			this.target = data.target;

			this.toString = function() {
				return _.sprintf('%+d%s%s', this.value);
			};
		}

		function BonusSet(data) {
			if (!_.isUndefined(data.bonus)) {
				data.bonuses = [data.bonus];
			}

			data = _.defaults(data, {
				name: 'Unnamed',
				bonuses: []
			});


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

			this.getTotal = function(exemptTemporary) {
				var total = data.base;

				total += bonusHandler.getBonus(this.id, this.exemptTypes);

				if(exemptTemporary !== true) {
					total += bonusHandler.getBonus(this.id + '_temporary', this.exemptTypes);
				}

				if (this.id === 'dexterity') {
					var maxDex = bonusHandler.getMaxDex()*2 + 11;
					if (total > maxDex) {
						return maxDex;
					}
				}

				return total;
			};

			this.getModifier = function(factor, exemptTemporary) {
				factor = factor || 1;
				var modifier = Math.floor((this.getTotal(exemptTemporary)-10)/2);
				return Math.floor(modifier * factor);
			};

			this.getRoll = function() {
				return _.sprintf('%+d', this.getModifier());
			};
		}

		function Attack(data, defaults, damageDefaults) {
			data.damage = _.defaults(data.damage || {}, damageDefaults || {});
			data = _.defaults(data || {}, defaults || {});

			Score.call(this, data);

			this.exemptTypes = [
				'armor',
				'deflection',
				'dodge',
				'natural armor',
				'shield'
			];
			this._exemptTypes();

			var attack = this;
			var damage = data.damage;

			function getBonusIDs(base) {
				var IDs = [
					[base],
					[attack.id, base],
					[data.range, base],
					[data.type, base],
					[attack.id, data.range, base],
				];

				return _.map(IDs, function(id) {
					return id.join('_');
				});
			}

			this.getToHit = function() {
				var bab = data.bab ? data.bab : 0;
				var total = attack.getTotal();
				total += abilityScores.getModifiers(data.stats);
				total += bonusHandler.getBonus(getBonusIDs('to_hit'), attack.exemptTypes);

				var rolls = _.sprintf('%+d', bab + total);

				if(data.type === 'natural') { return rolls; }

				for (var itterative = bab - 5; itterative > 0; itterative -= 5) {
					rolls += _.sprintf('/%+d', itterative + total);
				}

				return rolls;
			};

			function getDice() {
				var dieSteps = 0;

				dieSteps += bonusHandler.getBonus(getBonusIDs('dice_step'));

				if (dieSteps <= 0) { return damage.dice; }

				var dice = damage.dice.split('+');

				dice[0] = changeDieBySteps(dice[0], dieSteps);

				return dice.join('+');
			}

			function getCrit() {
				if (_.isNumber(damage.critical)) {
					return '/x' + damage.critical;
				} else  if (_.isString(damage.critical)) {
					return '/' + damage.critical;
				} else {
					return '';
				}
			}

			function getDamageModifier() {
				var total = 0;
				var factor = damage.factor || 1;

				total += damage.base ? damage.base : 0;


				total += abilityScores.getModifiers(_.without(damage.stats, 'strength'));
				total += bonusHandler.getBonus(getBonusIDs('damage'), attack.exemptTypes);

				if (_.contains(damage.stats, 'strength')) {
					total += abilityScores.getModifier('strength', factor);
				}
				total += bonusHandler.getBonus(getBonusIDs('strength_like_damage'), attack.exemptTypes, factor);

				if (total === 0) {
					return '';
				} else if (total > 0) {
					return '+' + total;
				} else {
					return '' + total;
				}
			}

			this.hasDamage = function() {
				if (!_.isUndefined(damage) && !_.isUndefined(damage.dice)) {
					return true;
				}
				return false;
			};

			this.getDamage = function() {
				return getDice() + getDamageModifier() + getCrit();
			};
		}

		function Defense(data, defaults) {
			data = _.defaults(data, defaults || {});
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

			data.base = (data.base || 10) + (data.bab ? data.bab : 0);

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

			var touch = _.defaults(data.touch || {}, {
				id: 'touch_',
				stats: ['dexterity'],
				exemptTypes: [
					'armor',
					'shield',
					'natural armor'
				]
			});

			this.getTouch = function() {
				return this._getSpecialDefense(touch);
			};

			var flatfooted = _.defaults(data.flatfooted || {}, {
				id: 'flat_footed_',
				stats: ['strength'],
				exemptTypes: ['dodge']
			});

			this.getFlatFooted = function() {
				return this._getSpecialDefense(flatfooted);
			};

			this.getFlatFooted();

			this.toString = function() {
				var strings = bonusHandler.getBonusStrings(this.id);

				_.each(data.stats, function(statName) {
					var roll = abilityScores.getRoll(statName, ':');
					if (roll !== '+0') { strings.push(roll + ':' + statName.slice(0, 3)); }
				});

				if (_.isNumber(data.bab) && data.bab !== 0) {
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

		function Save(data, defaults) {
			data = _.defaults(data, defaults || {});
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
				if(data.ranks) { total += data.ranks; }
				if(data.classSkill && data.ranks > 0) { total += 3; }

				if(data.acp) {
					total += bonusHandler.getBonus('armor_check_penalty', this.exemptTypes);
				}

				return total;
			};

			this.isTrained = function() {
				return data.ranks > 0;
			};
		}

		function Caster(data) {
			this.md = data.markdown;


			this.name = data.name;
			this.id = _(this.name).underscored();

			this.type = _.capitalize(data.type);
			this.baseSpells = data.baseSpells ? data.baseSpells : [];

			if(data.stat) { data.stats = [data.stat]; }
			this.stats = data.stats;

			this.getCasterLevel = function() {
				var casterLevel = 0;

				casterLevel += that.classes[data.name];
				casterLevel += bonusHandler.getBonus('caster_level');
				casterLevel += bonusHandler.getBonus(data.name.toLowerCase() + '_caster_level');

				return casterLevel;
			};

			this.getCasterLevelRoll = function() {
				return _.sprintf('%+d', this.getCasterLevel());
			};

			this.getConcentrationRoll = function() {
				var concentration = 0;

				concentration += this.getCasterLevel();
				concentration += abilityScores.getModifiers(this.stats);
				concentration += bonusHandler.getBonus('concentration');
				concentration += bonusHandler.getBonus(this.id + '_concentration');

				return _.sprintf('%+d', concentration);
			};

			this.getSpellResistanceRoll = function() {
				var spellResistance = 0;

				spellResistance += this.getCasterLevel();
				spellResistance += bonusHandler.getBonus('spell_resistance');
				spellResistance += bonusHandler.getBonus(this.id + '_spell_resistance');

				return _.sprintf('%+d', spellResistance);
			};
		}

		function SLA(data) {
			this.md = data.markdown;

			this.name = data.name;
			this.level = data.level || 1;

			if(data.stat) { data.stats = [data.stat]; }
			this.stats = data.stats;

			this.concentration = new Skill(_.defaults(data.concentration, {
				name: _.sprintf('%s Concentration', data.name),
				ranks: that.classes[data.name],
				stats: data.stats || ['charisma']
			}));

			this.spellResistance = new Skill(_.defaults(data.spellResistance, {
				name: _.sprintf('%s Overcome Spell Resistance', data.name),
				ranks: that.classes[data.name],
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

			getBonus: function(targetIDs, exempt, factor) {
				if (!_.isArray(targetIDs)) { targetIDs = [targetIDs]; }

				var total = 0;
				var types;

				_.each(targetIDs, function(targetID) {
					types = bonusHandler.getTypes(targetID, exempt, factor);
					total += _.reduce(types, function(sum, x) {
						return sum + x;
					}, 0);
				});

				return total;
			},

			getBonusStrings: function(targetID, exempt, factor) {
				var types = this.getTypes(targetID, exempt, factor);

				return _.compactMap(types, function(bonus, type) {
					if (bonus !== 0) {
						return _.sprintf('%+d:%s', bonus, type.replace('_', ' '));
					}
				});
			},

			getMaxDex: function() {
				var bonuses = _.map(this.data, function(bonusSet) {
					return bonusSet.getTargetting('maximum_dexterity');
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
		this.bonuses = bonusHandler.data;

		// *********************************************************************************************
		// Ability Scores
		// *********************************************************************************************

		var abilityScores = _.defaults(data.abilityScores, {
			strength: 10,
			dexterity: 10,
			constitution: 10,
			intelligence: 10,
			wisdom: 10,
			charisma: 10
		});

		abilityScores = {
			strength: new AbilityScore({
				name: 'Strength',
				base: abilityScores.strength
			}),
			dexterity: new AbilityScore({
				name: 'Dexterity',
				base: abilityScores.dexterity
			}),
			constitution: new AbilityScore({
				name: 'Constitution',
				base: abilityScores.constitution
			}),
			intelligence: new AbilityScore({
				name: 'Intelligence',
				base: abilityScores.intelligence
			}),
			wisdom: new AbilityScore({
				name: 'Wisdom',
				base: abilityScores.wisdom
			}),
			charisma: new AbilityScore({
				name: 'Charisma',
				base: abilityScores.charisma
			})
		};

		abilityScores.getModifier = function(scoreID, factor, exemptTemporary) {
			factor = factor || 1;
			var modifier = this[scoreID].getModifier(factor, exemptTemporary);
			if (modifier < 0) { return modifier; }

			return modifier;
		};
		abilityScores.getRoll = function(scoreID) { return this[scoreID].getRoll(); };

		abilityScores.getModifiers = function(scoreIDs, factor, exemptTemporary) {
			var modifiers = [];

			_.each(scoreIDs, function(scoreID, index) {
				this[index] = abilityScores.getModifier(scoreID, factor, exemptTemporary);
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
		// Character Info
		// *********************************************************************************************

		this.name = data.name || 'Unnamed';
		this.id = _(this.name).underscored();

		if (data.cr && data.mr) {
			this.difficulty = _.sprintf('CR %d / MR %d', data.cr, data.mr);
		} else if (data.cr) {
			this.difficulty = _.sprintf('CR %d', data.cr);
		} else if (data.mr) {
			this.difficulty = _.sprintf('MR %d', data.mr);
		}

		if(_.isString(data.xp)) {
			var temp = data.xp.split('/');
			_.each(temp, function(val, index) {
				this[index] = _.numberFormat(parseInt(val));
			}, temp);
			this.xp = _.sprintf('XP %s/%s', temp[0], temp[1]);
		}
		if (_.isNumber(data.xp)) {
			this.xp = 'XP ' + _.numberFormat(data.xp);
		}

		this.classes = data.classes;

		this.initiative = new Skill(_.defaults(data.initiative || {}, {
			name: 'Initiative',
			stats: ['dexterity'],
			base: 0
		}));

		this.senses = stringify(data.senses);
		this.aura = stringify(data.aura);

		data.hp = _.defaults(data.hp, {
			rolls: [],
			stats: ['constitution']
		});
		data.hp.level = data.hp.rolls.length;
		data.hd = data.hd || '0d0+0';

		this.hp = function() {
			var total = _.reduce(data.hp.rolls, function(a, b) {
				return a + b;
			}, 0);

			total += bonusHandler.getBonus('hp');
			total += bonusHandler.getBonus('hp_level') * data.hp.level;
			total += abilityScores.getModifiers(data.hp.stats) * data.hp.level;

			var temporary = bonusHandler.getBonus('hp_temporary');

			if (temporary !== 0) {
				return _.sprintf('%d+%d', total, temporary);
			} else {
				return total;
			}
		};

		this.hd = function() {
			var split = data.hd.split('+');

			var modifier = parseInt(_.last(split));
			if (_.isNumber(modifier)) {
				modifier += bonusHandler.getBonus('hp');
				modifier += bonusHandler.getBonus('hp_level') * data.hp.level;
				modifier += abilityScores.getModifier(data.hp.stats) * data.hp.level;

				if (modifier !== 0) {
					split[split.length-1] = modifier;
				}
			}

			var temporary = bonusHandler.getBonus('hp_temporary');
			if (temporary !== 0) {
				split.push(temporary);
			}

			return split.join('+');
		};

		this.hpSpecial = stringify(data.hpSpecial);

		this.speed = data.speed;
		this.space = data.space;
		this.reach = data.reach;

		this.infoText = [
			stringify([
				data.templates,
				data.race,
				stringify(data.classes, '/')
			], ' '),
			stringify([data.alignment, data.size, data.type], ' ')
		];

		this.feats = stringify(data.feats);
		this.traits = stringify(data.traits);
		this.languages = stringify(data.languages);

		this.specialQualities = markdownArray(data.specialQualities);
		this.environment = markdownArray(data.environment);
		this.organization = markdownArray(data.organization);
		this.specialAbilities = markdownArray(data.specialAbilities);
		this.treasure = markdownArray(data.treasure);

		// *********************************************************************************************
		// Offense
		// *********************************************************************************************

		this.bab = new Attack({
			name: 'Base Attack Bonus',
			bab: 0,
			base: _.defaults(data.baseAttackBonus, 0),
			stats: []
		});

		this.cmb = new Attack(data.combatManeuverBonus || {}, {
			name: 'Combat Maneuver Bonus',
			bab: this.bab.getTotal(),
			base: 0,
			stats: ['strength']
		});

		var attacks = _.defaults(data.attacks || {}, {
			melee: [],
			ranged: [],
			special: []
		});

		this.meleeAttacks = _.map(attacks.melee, function (attack) {
			return new Attack(attack, {
				type: 'weapon',
				range: 'melee',
				bab: that.bab.getTotal(),
				base: 0,
				stats: ['strength']
			}, {
				stats: ['strength']
			});
		});

		this.rangedAttacks = _.map(attacks.ranged, function (attack) {
			return new Attack(attack, {
				type: 'weapon',
				range: 'ranged',
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

		this.spellLikeAbilities = _.map(data.spellLikeAbilities, function(caster) {
			return new SLA(caster);
		});

		// *********************************************************************************************
		// Defense
		// *********************************************************************************************

		var defense = data.defense || {};

		this.ac = new Defense(defense.ac || {}, {
			name: 'Armor Class',
			stats: ['dexterity'],
			exemptTypes: []
		});

		this.cmd = new Defense(defense.cmd || {}, {
			name: 'Combat Maneuver Defense',
			stats: ['strength', 'dexterity'],
			bab: this.bab.getTotal(),
			exemptTypes: [
				'armor',
				'shield',
				'natural armor'
			]
		});

		var saves = _.defaults(data.saves, {
			fortitude: {},
			reflex: {},
			will: {},
			special: undefined
		});

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
			special: stringify(saves.special)
		};

		this.dr = stringify(data.dr);
		this.immune = stringify(data.immune);
		this.resist = stringify(data.resist);
		this.sr = stringify(data.sr);

		this.defensive = stringify(data.defensive);
		this.weaknesses = stringify(data.weaknesses);

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
			return trained || untrained || new Skill({name: 'Dummy Skill'});
		};

		// *********************************************************************************************
		// Markdown Functions
		// *********************************************************************************************

		this.pf = {
			name: this.name,
			level: function(className, factor) {
				factor = factor || 1;

				if (className === 'all') {
					var total =
					_.each(that.classes, function(level) {
						total += level;
					});
					return Math.floor(total * factor);
				}

				return Math.floor(that.classes[className] * factor);
			},
			modifier: function(stat, factor, exemptTemporary) {
				factor = factor || 1;
				return abilityScores.getModifier(stat, factor, exemptTemporary);
			},
			spellDC: function(className, level, bonus) {
				bonus = bonus ? bonus : 0;
				var caster = _.findWhere(that.spells, function(caster) {
					return caster.name === className;
				});

				var dc = 10 + level + abilityScores.getModifiers(caster.stats) + bonus;

				return _.sprintf('DC %d', dc);
			},
			spellsPerDay: function(className, spellLevel) {
				var spells = null;
				var caster = _.findWhere(that.spells, function(caster) {
					return caster.name === className;
				});

				if(!_.isUndefined(caster)) {
					spells = caster.baseSpells[spellLevel];
					if (spellLevel !== 0) {
						var modifier = abilityScores.getModifier(caster.stats);
						spells += Math.ceil((1+modifier-spellLevel)/4);
					}
				}

				return spells;
			},
			classDC: function(className, stat, factor, min) {
				factor = factor || 0.5;
				min = min || 1;
				var classLevel = Math.floor(that.classes[className] * factor) || min;
				return _.sprintf('DC %d', 10 + classLevel + abilityScores.getModifier(stat));
			}
		};

		// *********************************************************************************************
		// Options
		// *********************************************************************************************

		this.options = data.options;
	}

	return pf;
})();
