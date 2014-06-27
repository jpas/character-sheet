character-sheet
---

This is a stat-block format, interractive character sheet for Pathfinder RPG.

All characters have their own directory in `/characters`.

Inside this directory there is `_data.json` which stores all the required character info.
Also in this directory there are all the other `.md` files that the character may require, these are referenced in `_data.json`.

Here is an example _data.json that contains all possible arguments for each field with annotations. Fields that allow markdown will be annotated as `"!md!"` (more info on markdown [here](#mardown)). Most keys are self explanitory.

All keys are optional unless mentioned otherwise.

```javascript
[
	{
		"info": { /* mandatory */
			"name": "!md!", /* mandatory */
			"cr": 1,
			"mr": 1,

			"portrait": "", /* url to an image */

			"templates": "!md!",
			"race": "!md!",
			"classes": "!md!",

			"levels": {
			"hd": 1,
			"className": 1 /* level as an integer for a class */
			},

			"alignment": "!md!",
			"size": "!md!",
			"type": "!md!",
			"subtypes": [
			"!md!"
			],

			"initiative": 1, /* mandatory */
			"senses": [
			"!md!"
			],

			"aura": "!md!"

			"hp": 1, /* mandatory */
			"hd": "!md!", /* mandatory */
			"hpSpecial": "!md!", /* special things that happen to health, e.x. fast healing 5, regeneration 10, etc. */

			"acp": 1

			"languages": [
				"!md!"
			],

			"description": "!md!" /* should be a file of its own */
		},
		"stats": { /* mandatory */
			"scores": {
				"str": 10, /* mandatory */
				"dex": 10, /* mandatory */
				"con": 10, /* mandatory */
				"int": 10, /* mandatory */
				"wis": 10, /* mandatory */
				"cha": 10	/* mandatory */
			},
			"bab": 1 /* mandatory */
		},
		"defense": {
			"ac": {
				"stats": [ /* an array of ability scores (by short names e.x. "str", "int") that will be added to AC ("dex" is automatically included) */
					""
				]
				"ignore": [ /* an array of types for global ignoring for AC */
					""
				]
				"bonuses": [ /* an array of bonuses to be added to AC always formatted in "type:bonus" */
					"armor:+4",
					"natural:+1"
				]
			},
			"cmd": {}, /* exactly the same as AC apart from "str" is automatically included to stats along with dex and "bab" is added in */

			"fort": {
				"base": 1, /* classes's base scores added together */
				"stat": "con", /* main stat for adding to saves */
				"bonuses": [ /* bonuses the are treated the same way as they are for AC and CMD */
					"resistance:+2"
				]
			},
			"refl": {}, /* exactly the same as fort */
			"will": {}, /* exactly the same as fort and refl */

			"dr": "!md!",
			"immune": "!md!"
			"resist": "!md!",
			"sr": "!md!", /* spell resistance */
			"special": [
				"!md!" /* strings for special defences */
			]
		},
		"offense": {
			"attacks": {
			"melee": [ /* an array of attack objects */
				{
				"name": "!md!", /* mandatory */
				"stat": "dex" /* defaults to str */
				"bonuses": [], /* same as other all other "bonuses" arrays */
				"iterative": [ /* if there are multiple attacks, have the penalty for each attack. the following is for a character with two attacks from having a bab of +6 */
					0,
					-5
				]
				"damage": "xdy+z", /* a standard damage dice format */
				"crit": "" /* string for the crit range/multiplier of the weapon */
				"dc": 10, /* the DC of the attack (if any) */
				"quantity": "", /* how many times per day, etc */
				}
			],
			"ranged": [], /* same as melee */
			"special": [] /* same as melee and ranged */
			},
			"cmb": {}, /* treat this like an attack that would be in melee */
			"spells": [ /* array for spells AND spell like abilities in .md files */
			{
				"name": "Abjurer Prepared Spells",
				"casterLevel": 6,
				"concentrationBonus": 0,
				"stat": "int",
				"markdown": "a-abjurer-spells.md" /* reference to the markdown file for the spells */
			}
			],
			"speed": "30 ft.",
			"space": "5 ft.",
			"reach": "5 ft."
		},
		"skills": {
			"Skill Name": {
			"ranks": 0,
			"classSkill": true,
			"acp": true
			"bonuses": []
			}
		},
		"feats": [
			"!md!"
		],
		"traits": [
			"!md!"
		],
		"specials": [ /* all of the special qualities of the character */
			"!md!" /* it is recommended to put each of these in their own file */
		],
		"gear": [
			"!md!" /* own file is recommended for each complicated item */
		]
	}
]
```

## Markdown

Whenever a markdown string has .md in it, it automatically tries to resolve to a file, if it fails it will not show anything. If the string contains `.md` and `@` in it, the compiler assumes you will remove the `@` when the character meets the prerequisites for the said ability, and will not show it until you remove the `@`.

Objects that can be used in the angular.js scope of a markdown file are:

* Math, the math object from javascript
* pf, some pathfinder specific functions
* c, all of the current data for the current character (as there can be multiple character on a single sheet)

In addition to this supoort, there is shortened linking for d20pfsrd.com in the formats of:

* `:d20-feat-(type):` gets turned to `http://www.d20pfsrd.com/feats/(type)-feats/`
* `:d20-spell:(a)` gets turned to `http://www.d20pfsrd.com/magic/all-spells/(a)/`
* `:d20-trait-(type):` gets turned to `http://www.d20pfsrd.com/traits/(type)-traits/`
* `:d20-wop-effect:` gets turned to `http://www.d20pfsrd.com/magic/variant-magic-rules/words-of-power/effect-words/`
* `:d20-wop-meta:` gets turned to `http://www.d20pfsrd.com/magic/variant-magic-rules/words-of-power/meta-words/`
* `:d20-wop-target:` gets turned to `http://www.d20pfsrd.com/magic/variant-magic-rules/words-of-power/target-words/`

Additional mardown syntax:

* `^foo^` is the syntax for <sup>superscript</sup>
* `$bar$` is the syntax for <small>small type</small>
