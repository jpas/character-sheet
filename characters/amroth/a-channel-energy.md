#### **Channel Energy** (Su)

Channeling energy causes a burst that affects all creatures of one type (either undead or living) in a 30-foot radius centered on the priest.
The amount of damage dealt or healed {{Math.ceil(c.info.levels.priest/2)}}d8 points of damage.
Creatures that take damage from channeled energy receive a Will save to halve the damage.
The DC of this save {{10 + Math.floor(c.info.levels.priest/2) + c.stats.scores.cha.modifier()}}.
Creatures healed by channel energy cannot exceed their maximum hit point total—all excess healing is lost.
A priest may channel energy {{3 + c.stats.scores.cha.modifier()}} times per day.
This is a standard action that does not provoke an attack of opportunity.
A priest can choose whether or not to include herself in this effect.