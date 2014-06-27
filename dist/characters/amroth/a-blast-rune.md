#### **Blast Rune** (Sp)

As a standard action, you can create a blast rune in any adjacent square.
Any creature entering this square takes 1d6+{{Math.floor(c.info.levels.priest/2)}} points of damage.
This rune deals either acid, cold, electricity, or fire damage, decided when you create the rune.
The rune is invisible and lasts {{c.info.levels.priest}} rounds or until discharged.
You cannot create a blast rune in a square occupied by another creature.
This rune counts as a 1st-level spell for the purposes of dispelling.
It can be discovered with a DC 26 Perception skill check and disarmed with a DC 26 Disable Device skill check.
You can use this ability {{3 + c.stats.scores.wis.modifier()}} times per day.