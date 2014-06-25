#### **Legalistic** (Curse)

Whenever you break your word (either purposefully or unintentionally), you become sickened for 24 hours or until you meet your obligation, whichever comes first. However, once per day, you can make a vow to yourself that grants a +4 morale bonus on any one roll you make while trying to fulfill a promise made to another individual.

{{ c.info.levels.oracle >= 5 ? "You gain a +3 competence bonus on Diplomacy, Intimidate, and Sense Motive checks while talking to an individual one-on-one." : ""}}

{{ c.info.levels.oracle >= 10 ? "You can make a new saving throw each minute to resist mind-affecting effects as your subconscious searches for loopholes." : ""}}

{{ c.info.levels.oracle >= 15 ? "You any creature that violates its freely given word to you takes a penalty "+ -1*c.stats.scores.cha.modifier() +" to AC, spell resistance, and on saving throws against your attacks and abilities for 24 hours." : ""}}