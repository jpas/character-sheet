### **Channel Negative Energy** (Su)

Channeling negative energy causes a burst that affects all creatures of one type (either undead or living) in a 30-foot radius centered on the cleric. The amount of damage dealt or healed is equal to {{pf.level('Cleric') == 1 ? 1 : pf.level('Cleric', 0.5)}}d6 points of damage. Creatures that take damage from channeled energy receive a Will save to halve the damage. The DC of this save is {{10 + pf.modifier('charisma') + pf.level('Cleric', 0.5)}}. Creatures healed by channel energy cannot exceed their maximum hit point total-all excess healing is lost. A cleric may channel energy {{3 + pf.modifier('charisma')}} times per day. This is a standard action that does not provoke an attack of opportunity. A cleric can choose whether or not to include herself in this effect.

## **Inevitable Domain**
### **Command** (Su)
As a standard action, you can give a creature an emotionless yet undeniable order, as per the spell *[command]*. A Will save DC {{10 + pf.level('!Cleric', 0.5) + pf.modifier('wisdom')}} negates this effect. You cannot target a creature more than once per day with this ability. You can use this ability {{3 + pf.modifier('wisdom')}} times per day.

Domain Spells: 1st *[protection from chaos]*, 2nd *[align weapon]* (law only), 3rd *[command undead]*, 4th *[order's wrath]*, 5th *[command, greater]*, 6th *[planar binding]* (inevitables only), 7th *[dictum]*, 8th *[shield of law]*, 9th *[summon monster IX]* (law spell only).

## **Travel Domain**
### **Agile Feet** (Su)
As a free action, you can gain increased mobility for 1 round. For the next round, you ignore all difficult terrain and do not take any penalties for moving through it. {{3 + pf.modifier('wisdom')}} times per day.

Domain Spells: 1st *[longstrider]*, 2nd *[locate object]*, 3rd *[fly]*, 4th *[dimension door]*, 5th *[teleport]*, 6th *[find the path]*, 7th *[greater teleport]*, 8th *[phase door]*, 9th *[astral projection]*.