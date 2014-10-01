function Bonus(value, type, targets, canStackOverride) {
	// private properties
	var BONUS_TYPES = {
		'UNTYPED': true,
		'ALCHEMICAL': false,
		'ARMOR': false,
		'CIRCUMSTANCE': true,
		'COMPETENCE': false,
		'DEFLECTION': false,
		'DODGE': true,
		'ENHANCEMENT': false,
		'INSIGHT': false,
		'LUCK': false,
		'MORALE': false,
		'NATURAL ARMOR': false,
		'PROFANE': false,
		'RACIAL': true,
		'RESISTANCE': false,
		'SACRED': false,
		'SHIELD': false,
		'SIZE': false,
		'TRAIT': false
	}

	// public properties
	this.value   = value;
	this.targets = targets;
	this.type    = BONUS_TYPES.hasOwnProperty(type) ? type : 'UNTYPED';

	// public methods
	this.hasTarget = function(target) {
		return targets.indexOf(target) > -1;
	}

	this.canStack = function() {
		return canStackOverride || BONUS_TYPES[this.type];
	}

	this.toString = function() {
		return this.value.toString() + ' ' + this.type + 'bonus to ' + this.targets.join(', ')
	}
}

function BonusSource(name, initialBonuses, canToggle) {
	// private properties
	var buffs = [];
	var nerfs = [];
	var active = true;

	// public properties
	this.name = name;
	this.canToggle = canToggle;

	// public methods
	this.addBonus = function(bonus) {
		if (bonus instanceof Bonus) {
			if (bonus.value < 0)
				nerfs.push(bonus);
			else
				buffs.push(bonus);
		} else {
			throw bonus.toString() + ' is not an instance of Bonus.'
		}
	};

	this.hasTarget = function(target) {
		function matchesTarget(bonus) {
			return bonus.hasTarget(target);
		}
		return buffs.some(matchesTarget) || nerfs.some(matchesTarget);
	};

	this.getBonusesFor = function(target) {
		if (this.isActive()) {
			function matchesTarget(bonus) {
				return bonus.hasTarget(target);
			}
			return {
				buffs: buffs.filter(matchesTarget),
				nerfs: nerfs.filter(matchesTarget)
			};
		}
	}

	this.isActive = function() {
		return active;
	}

	this.activate = function() {
		active = true;
	}

	this.deactivate = function() {
		active = false;
	}

	// initialization
	if (typeof initialBonuses !== 'undefined') {
		for (var i = initialBonuses.length - 1; i >= 0; i--) {
			this.addBonus(initialBonuses[i]);
		}
	}
}

function Character(name, abilityScores, initalSources) {
	// private methods
	function AbilityScore(name, base) {
		this.name = name;
		this.id = 'ABILITY.' + this.name.splice(0, 2).toUpperCase()
		this.score = function() {

		}
	}
	// public parameters
	this.name = name;

	sources = initalSources || [];
	this.addSource = function (source) {
		sources.push(source);
	};

	this.bonuses = {
		getBonusesFor: function(target) {
			var nerfs = [];
			var buffs = [];
			var sourceBonuses;
			var total = 0;

			for (var i = sources.length - 1; i >= 0; i--) {
				sourceBonuses = sources[i].getBonusesFor(target);
				if (typeof sourceBonuses !== 'undefined') {
					nerfs = nerfs.concat(sourceBonuses.nerfs);
					buffs = buffs.concat(sourceBonuses.buffs);
				}
			}

			if (nerfs.length > 0) {
				total = nerfs.reduce(function(runningTotal, bonus) {
					return runningTotal + bonus.value;
				}, total);	
			}

			if (buffs.length > 0) {
				buffs.sort(function(a, b) {
					if (a.type > b.type)
						return 1;
					else if (b.type > a.type)
						return -1;
					return 0;
				}).sort(function(a, b) {
					if (a.type === b.type) {
						return b.value - a.value;
					}
					return 0;
				});
			}

			var currentType;
			var currentBuff;
			while(buffs.length > 0) {
				currentBuff = buffs.shift();
				if (currentType !== currentBuff.type || currentBuff.canStack()) {
					currentType = currentBuff.type;
					total += currentBuff.value;
				}
			}

			return total;
		},
	};
}

var testValue = [
	new Bonus( 3, 'UNTYPED', ['ABILITY.STR']),
	new Bonus( 5, 'ENHANCEMENT', ['ABILITY.DEX']),
	new Bonus( 1, 'ENHANCEMENT', ['ABILITY.STR']),
	new Bonus(-2, 'MORALE', ['ABILITY.STR']),
	new Bonus(-2, 'ARMOR', ['ABILITY.STR']),
]

var testData2 = [
	{"value": 0, "type": "SIZE", "target": ["ABILITY.CON", "ABILITY.STR", "ABILITY.DEX", "ABILITY.WIS", "ABILITY.CHA"]},
	{"value": 5, "type": "CIRCUMSTANCE", "target": [""]},
	{"value": 8, "type": "ARMOR", "target": ["ABILITY.WIS", "ABILITY.CHA", "ABILITY.CON", "ABILITY.DEX"]},
	{"value": -5, "type": "RACIAL", "target": ["ABILITY.INT"]},
	{"value": -8, "type": "PROFANE", "target": ["ABILITY.INT", "ABILITY.CHA", "ABILITY.WIS", "ABILITY.STR"]},
	{"value": 8, "type": "ENHANCEMENT", "target": ["ABILITY.WIS", "ABILITY.CON"]},
	{"value": -3, "type": "NATURAL ARMOR", "target": ["ABILITY.STR", "ABILITY.INT", "ABILITY.DEX", "ABILITY.CHA", "ABILITY.CON"]},
	{"value": -1, "type": "DODGE", "target": ["ABILITY.CON", "ABILITY.INT", "ABILITY.WIS"]},
	{"value": -8, "type": "ARMOR", "target": ["ABILITY.CHA", "ABILITY.INT"]},
	{"value": -10, "type": "COMPETENCE", "target": ["ABILITY.CHA", "ABILITY.WIS", "ABILITY.STR", "ABILITY.DEX", "ABILITY.INT", "ABILITY.CON"]},
	{"value": 6, "type": "PROFANE", "target": ["ABILITY.DEX", "ABILITY.WIS"]},
	{"value": 5, "type": "SACRED", "target": ["ABILITY.CHA", "ABILITY.INT", "ABILITY.STR", "ABILITY.DEX"]},
	{"value": 10, "type": "CIRCUMSTANCE", "target": ["ABILITY.STR", "ABILITY.CHA", "ABILITY.DEX"]},
	{"value": -5, "type": "PROFANE", "target": ["ABILITY.CHA", "ABILITY.STR", "ABILITY.CON", "ABILITY.DEX"]},
	{"value": -5, "type": "UNTYPED", "target": ["ABILITY.CON", "ABILITY.DEX", "ABILITY.INT"]},
	{"value": 4, "type": "CIRCUMSTANCE", "target": ["ABILITY.CON", "ABILITY.INT", "ABILITY.STR"]},
	{"value": 8, "type": "CIRCUMSTANCE", "target": ["ABILITY.STR", "ABILITY.WIS", "ABILITY.CHA", "ABILITY.DEX", "ABILITY.INT"]},
	{"value": -9, "type": "DODGE", "target": [""]},
	{"value": -4, "type": "UNTYPED", "target": ["ABILITY.STR", "ABILITY.DEX", "ABILITY.CON", "ABILITY.WIS"]},
	{"value": 6, "type": "ALCHEMICAL", "target": ["ABILITY.WIS"]},
	{"value": -5, "type": "NATURAL ARMOR", "target": ["ABILITY.DEX", "ABILITY.CON", "ABILITY.STR"]},
	{"value": 0, "type": "RACIAL", "target": ["ABILITY.WIS", "ABILITY.INT", "ABILITY.CON", "ABILITY.DEX", "ABILITY.CHA", "ABILITY.STR"]},
	{"value": 10, "type": "SHIELD", "target": [""]},
	{"value": 2, "type": "RACIAL", "target": ["ABILITY.CHA", "ABILITY.STR", "ABILITY.INT", "ABILITY.WIS", "ABILITY.CON", "ABILITY.DEX"]},
	{"value": 4, "type": "DODGE", "target": ["ABILITY.WIS", "ABILITY.CHA", "ABILITY.CON", "ABILITY.STR", "ABILITY.INT", "ABILITY.DEX"]},
	{"value": -8, "type": "DODGE", "target": ["ABILITY.INT", "ABILITY.CON", "ABILITY.CHA"]},
	{"value": 4, "type": "TRAIT", "target": ["ABILITY.DEX", "ABILITY.CON", "ABILITY.CHA", "ABILITY.WIS", "ABILITY.INT"]},
	{"value": 10, "type": "RACIAL", "target": ["ABILITY.STR", "ABILITY.CHA", "ABILITY.DEX", "ABILITY.WIS", "ABILITY.CON", "ABILITY.INT"]},
	{"value": -9, "type": "SHIELD", "target": ["ABILITY.CON", "ABILITY.INT", "ABILITY.STR", "ABILITY.CHA", "ABILITY.WIS", "ABILITY.DEX"]},
	{"value": 5, "type": "SIZE", "target": ["ABILITY.STR", "ABILITY.WIS", "ABILITY.CHA", "ABILITY.CON", "ABILITY.DEX", "ABILITY.INT"]},
	{"value": 7, "type": "UNTYPED", "target": ["ABILITY.INT", "ABILITY.CON", "ABILITY.CHA", "ABILITY.DEX", "ABILITY.STR"]},
	{"value": 6, "type": "NATURAL ARMOR", "target": ["ABILITY.WIS"]},
	{"value": 9, "type": "NATURAL ARMOR", "target": ["ABILITY.DEX", "ABILITY.INT", "ABILITY.WIS", "ABILITY.STR"]},
	{"value": -2, "type": "SHIELD", "target": ["ABILITY.CON", "ABILITY.WIS"]},
	{"value": 9, "type": "NATURAL ARMOR", "target": ["ABILITY.INT", "ABILITY.DEX", "ABILITY.CHA", "ABILITY.CON"]},
	{"value": 1, "type": "LUCK", "target": ["ABILITY.WIS", "ABILITY.STR", "ABILITY.CON"]},
	{"value": -6, "type": "UNTYPED", "target": ["ABILITY.CON"]},
	{"value": -2, "type": "NATURAL ARMOR", "target": ["ABILITY.CHA", "ABILITY.STR"]},
	{"value": -7, "type": "DEFLECTION", "target": ["ABILITY.STR", "ABILITY.CHA", "ABILITY.INT"]},
	{"value": -3, "type": "NATURAL ARMOR", "target": ["ABILITY.WIS", "ABILITY.STR", "ABILITY.CON", "ABILITY.CHA", "ABILITY.DEX"]},
	{"value": -4, "type": "RESISTANCE", "target": ["ABILITY.DEX", "ABILITY.CON", "ABILITY.INT", "ABILITY.STR", "ABILITY.CHA"]},
	{"value": 6, "type": "MORALE", "target": ["ABILITY.DEX", "ABILITY.INT", "ABILITY.CON", "ABILITY.WIS"]},
	{"value": -4, "type": "ARMOR", "target": [""]},
	{"value": 6, "type": "LUCK", "target": ["ABILITY.STR", "ABILITY.CON", "ABILITY.INT", "ABILITY.WIS", "ABILITY.DEX", "ABILITY.CHA"]},
	{"value": 4, "type": "RACIAL", "target": ["ABILITY.STR", "ABILITY.DEX"]},
	{"value": -8, "type": "SHIELD", "target": ["ABILITY.CON"]},
	{"value": -2, "type": "RESISTANCE", "target": ["ABILITY.STR", "ABILITY.DEX", "ABILITY.CHA"]},
	{"value": 0, "type": "RACIAL", "target": ["ABILITY.INT", "ABILITY.CON", "ABILITY.CHA", "ABILITY.WIS", "ABILITY.DEX"]},
	{"value": 1, "type": "INSIGHT", "target": ["ABILITY.CHA", "ABILITY.DEX", "ABILITY.STR", "ABILITY.WIS"]},
	{"value": 3, "type": "DEFLECTION", "target": ["ABILITY.STR", "ABILITY.INT", "ABILITY.CON", "ABILITY.DEX", "ABILITY.CHA", "ABILITY.WIS"]},
	{"value": -6, "type": "RACIAL", "target": ["ABILITY.WIS", "ABILITY.CON", "ABILITY.INT", "ABILITY.CHA", "ABILITY.DEX", "ABILITY.STR"]},
	{"value": 0, "type": "TRAIT", "target": ["ABILITY.STR", "ABILITY.CON", "ABILITY.WIS", "ABILITY.CHA", "ABILITY.DEX", "ABILITY.INT"]},
	{"value": 6, "type": "TRAIT", "target": ["ABILITY.STR", "ABILITY.INT"]},
	{"value": 2, "type": "TRAIT", "target": [""]},
	{"value": 10, "type": "ENHANCEMENT", "target": ["ABILITY.STR"]},
	{"value": 6, "type": "DEFLECTION", "target": [""]},
	{"value": -4, "type": "SACRED", "target": [""]},
	{"value": 2, "type": "UNTYPED", "target": ["ABILITY.CHA", "ABILITY.INT"]},
	{"value": -9, "type": "ENHANCEMENT", "target": ["ABILITY.DEX", "ABILITY.CON", "ABILITY.CHA", "ABILITY.WIS", "ABILITY.INT", "ABILITY.STR"]},
	{"value": -9, "type": "NATURAL ARMOR", "target": [""]},
	{"value": -10, "type": "MORALE", "target": [""]},
	{"value": -3, "type": "ARMOR", "target": ["ABILITY.INT", "ABILITY.STR"]},
	{"value": 2, "type": "MORALE", "target": ["ABILITY.CON"]},
	{"value": -6, "type": "DODGE", "target": [""]},
	{"value": 8, "type": "TRAIT", "target": [""]},
	{"value": 9, "type": "RACIAL", "target": ["ABILITY.STR", "ABILITY.DEX", "ABILITY.CON"]},
	{"value": -8, "type": "DODGE", "target": ["ABILITY.CON", "ABILITY.DEX", "ABILITY.WIS", "ABILITY.INT"]},
	{"value": -4, "type": "MORALE", "target": ["ABILITY.DEX"]},
	{"value": -5, "type": "ALCHEMICAL", "target": ["ABILITY.CHA", "ABILITY.DEX", "ABILITY.WIS", "ABILITY.INT"]},
	{"value": -4, "type": "RACIAL", "target": ["ABILITY.WIS", "ABILITY.DEX", "ABILITY.CON", "ABILITY.INT"]},
	{"value": 8, "type": "COMPETENCE", "target": [""]},
	{"value": -3, "type": "SACRED", "target": ["ABILITY.STR"]},
	{"value": -5, "type": "CIRCUMSTANCE", "target": [""]},
	{"value": 6, "type": "TRAIT", "target": [""]},
	{"value": -5, "type": "INSIGHT", "target": ["ABILITY.CON", "ABILITY.STR"]},
	{"value": 6, "type": "TRAIT", "target": ["ABILITY.STR", "ABILITY.INT", "ABILITY.DEX", "ABILITY.CHA"]},
	{"value": 6, "type": "SACRED", "target": ["ABILITY.STR", "ABILITY.INT"]},
	{"value": 8, "type": "ARMOR", "target": ["ABILITY.DEX", "ABILITY.WIS", "ABILITY.CHA", "ABILITY.INT", "ABILITY.STR", "ABILITY.CON"]},
	{"value": -7, "type": "SACRED", "target": ["ABILITY.CHA", "ABILITY.WIS", "ABILITY.STR", "ABILITY.CON", "ABILITY.INT", "ABILITY.DEX"]},
	{"value": -5, "type": "UNTYPED", "target": ["ABILITY.WIS", "ABILITY.DEX", "ABILITY.CON", "ABILITY.STR", "ABILITY.CHA"]},
	{"value": 6, "type": "SIZE", "target": ["ABILITY.WIS", "ABILITY.DEX", "ABILITY.INT", "ABILITY.CON", "ABILITY.STR"]},
	{"value": -6, "type": "RACIAL", "target": [""]},
	{"value": -7, "type": "DEFLECTION", "target": ["ABILITY.CHA", "ABILITY.STR", "ABILITY.CON", "ABILITY.DEX", "ABILITY.WIS", "ABILITY.INT"]},
	{"value": 3, "type": "INSIGHT", "target": [""]},
	{"value": 4, "type": "LUCK", "target": ["ABILITY.WIS"]},
	{"value": -8, "type": "MORALE", "target": ["ABILITY.DEX", "ABILITY.CHA", "ABILITY.INT", "ABILITY.CON", "ABILITY.WIS"]},
	{"value": 9, "type": "CIRCUMSTANCE", "target": ["ABILITY.DEX", "ABILITY.CHA", "ABILITY.STR", "ABILITY.INT", "ABILITY.WIS", "ABILITY.CON"]},
	{"value": 4, "type": "DODGE", "target": ["ABILITY.WIS", "ABILITY.CON", "ABILITY.CHA", "ABILITY.STR"]},
	{"value": -10, "type": "SIZE", "target": ["ABILITY.CON", "ABILITY.STR", "ABILITY.DEX", "ABILITY.INT", "ABILITY.CHA", "ABILITY.WIS"]},
	{"value": -8, "type": "COMPETENCE", "target": [""]},
	{"value": -9, "type": "ENHANCEMENT", "target": ["ABILITY.CON", "ABILITY.CHA", "ABILITY.INT", "ABILITY.WIS", "ABILITY.DEX"]},
	{"value": -6, "type": "UNTYPED", "target": ["ABILITY.WIS", "ABILITY.CON", "ABILITY.DEX"]},
	{"value": 9, "type": "COMPETENCE", "target": ["ABILITY.CHA", "ABILITY.STR", "ABILITY.INT", "ABILITY.CON"]},
	{"value": 5, "type": "RESISTANCE", "target": ["ABILITY.STR", "ABILITY.CON", "ABILITY.CHA", "ABILITY.INT"]},
	{"value": 1, "type": "CIRCUMSTANCE", "target": ["ABILITY.INT", "ABILITY.CHA"]},
	{"value": 6, "type": "MORALE", "target": ["ABILITY.WIS", "ABILITY.CON", "ABILITY.STR", "ABILITY.INT", "ABILITY.DEX", "ABILITY.CHA"]},
	{"value": -8, "type": "SHIELD", "target": ["ABILITY.CHA"]},
	{"value": -5, "type": "CIRCUMSTANCE", "target": ["ABILITY.CHA", "ABILITY.WIS", "ABILITY.CON"]},
	{"value": 0, "type": "ALCHEMICAL", "target": [""]},
	{"value": -1, "type": "SACRED", "target": [""]}
];

for (var i = testData2.length - 1; i >= 0; i--) {
	testData2[i] = new Bonus(testData2[i].value, testData2[i].type, testData2[i].target);
};


var testCharacter = new Character(
	'Test Character',
	{
		'STR': 10,
		'DEX': 10,
		'CON': 10,
		'INT': 10,
		'WIS': 10,
		'CHA': 10,
	}
)

testCharacter.addSource(new BonusSource('testSouce', testData2));

console.log(testCharacter.bonuses.getBonusesFor('ABILITY.STR'));