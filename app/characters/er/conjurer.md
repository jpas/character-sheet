## **Teleportaion School**

### **Summoner's Charm** (Su)
Whenever you cast a conjuration (summoning) spell, increase the duration by {{c.info.levels.wizard < 4 ? "1 round" : (Math.floor(c.info.levels.wizard/2) + "rounds")}}. This increase is not doubled by Extend Spell.
{{ c.info.levels.wizard >= 20 ? "You can change the duration of all summon monster spells to permanent. You can have no more than one summon monster spell made permanent in this way at one time. If you designate another summon monster spell as permanent, the previous spell immediately ends." : "" }}

### **Shift** (Su)
You can teleport to a nearby space as a swift action as if using dimension door. This movement does not provoke an attack of opportunity. You must be able to see the space that you are moving into. You cannot take other creatures with you when you use this ability. You can move {{c.info.levels.wizard < 4 ? 5 : Math.floor(c.info.levels.wizard/2)*5 }} feet. You can use this ability {{ 3 + c.stats.scores.int.modifier()}} times per day.