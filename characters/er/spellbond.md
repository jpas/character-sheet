## **Spell Bond** (Su)

As a full-round action, the spellbinder may replace a spell of the same or higher level as one of his bonded spells the chosen bonded spell.
The spellbinder currently has
{{c.info.levels.wizard == 1 ? "1 bonded spell, " : ""}}
{{(c.info.levels.wizard != 1 && c.info.levels.wizard < 17) ? Math.ceil(c.info.levels.wizard/2) + "bonded spells, " : ""}}
{{c.info.levels.wizard >= 17 ? "9 bonded spells, " : ""}}
*[floating disk]*.

[floating disk]: :prd-spell-core:floatingDisk