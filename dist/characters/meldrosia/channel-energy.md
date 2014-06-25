#### **Channel Energy** (Su)

Channeling energy causes a burst that affects all creatures of one type (either undead or living) in a 30-foot radius centered on the oracle.
The amount of damage dealt or healed {{Math.ceil(c.info.levels.oracle/2)}}d6 points of damage.
Creatures that take damage from channeled energy receive a Will save to halve the damage.
The DC of this save {{10 + Math.floor(c.info.levels.oracle/2) + c.stats.scores.cha.modifier()}}.
Creatures healed by channel energy cannot exceed their maximum hit point total—all excess healing is lost.
An oracle may channel energy {{1 + c.stats.scores.cha.modifier()}} times per day.
This is a standard action that does not provoke an attack of opportunity.
An oracle can choose whether or not to include herself in this effect.