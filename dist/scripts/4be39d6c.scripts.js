"use strict";_.mixin({compactMap:function(list,iteratee,context){return _.compact(_.map(list,iteratee,context))}}),_.mixin(_.str.exports());var pf=function(){var pf={},isValidBonusType=function(type,exempt){var types=["alchemical","armor","circumstance","competence","deflection","dodge","enhancement","inherent","insight","luck","morale","natural_armor","profane","racial","resistance","sacred","shield","size","trait","untyped"];return-1!==types.indexOf(type)&&-1===exempt.indexOf(type)},changeDieBySteps=function(die,steps){function makeDie(max){if(4>max)switch(max){case 1:return"1";case 2:return"1d2";case 3:return"1d3"}var size;return max%6===0?size=6:max%8===0?size=8:max%10===0?size=10:max%4===0&&(size=4),_.sprintf("%dd%d",max/size,size)}function moveSteps(max,steps){if(0===steps)return makeDie(max);if(0>steps){if(2===max)return"1";max=Math.ceil(2*max/3),steps++}else max=Math.ceil(1.5*max),steps--;for(;max%10!==0&&max%8!==0&&max%6!==0&&max%4!==0;)max--;return moveSteps(max,steps)}if(!die.match(/\d+d\d+/g))return die;die=die.split("d");var max=die[0]*die[1];return moveSteps(max,steps)},markdownArray=function(things){return _.isArray(things)||(things=[things]),_.compactMap(things,function(thing){return _.isString(thing)?thing.indexOf("@")>0?null:thing:null})},stringify=function(things,separator){function _stringify(things){var str="";return _.isNumber(things)?str=things.toString():_.isString(things)?str=things:_.isArray(things)?_.each(things,function(thing){_.isUndefined(thing)||(str+=_stringify(thing)+separator)}):_.isObject(things)&&(things.link&&things.text?str+=_.sprintf("[%s](%s)",things.text,things.link):str=_stringify(_.map(things,function(thing,thingKey){return _.sprintf("%s %s",thingKey,thing)}))),str}if(_.isUndefined(things))return void 0;separator=separator||", ";var str=_stringify(things);return str.slice(-separator.length)===separator?str.slice(0,-separator.length):str};return pf.Character=function(data){function Bonus(bonus){function BonusString(bonusString){bonusString=bonusString.split(":"),""===bonusString[1]&&(bonusString[1]="untyped"),this.value=parseInt(bonusString[0]),this.type=bonusString[1],this.target=bonusString[2],this.toRaw=function(){return _.sprintf("%d:%s:%s",this.value,this.type,this.target)}}this.name=bonus.name,this.id=_.underscored(this.name),this.active=bonus.active,this.locked=bonus.locked,this.requires=bonus.requires,this.list=_.map(bonus.list,function(b){return new BonusString(b)}),this.list=_.compact(this.list),this.canToggle=function(){return _.isUndefined(this.active)?!1:_.isArray(this.requires)?_.every(this.requires,function(r){return r===this.id?!0:"!"===r[0]?!bonusHandler.bonusIsActiveByID(r.slice(1)):bonusHandler.bonusIsActiveByID(r)},this):!0},this.isActive=function(){return this.active&&this.canToggle()},this.getTargetting=function(targetID){if(this.isActive()===!1)return{};var bonuses=_.filter(this.list,function(b){return b.target===targetID});return _.isEmpty(bonuses)?{}:_.max(bonuses,function(b){return b.value})},this.toString=function(){return _.map(this.list,function(b){return b.toString()})},this.toRaw=function(){var raw={name:this.name};return _.isBoolean(this.active)&&(raw.active=this.active),_.isBoolean(this.locked)&&(raw.locked=this.locked),raw.list=_.map(this.list,function(b){return b.toRaw()}),raw}}function Score(data){this.name=data.name,this.id=_(this.name).underscored(),this.exemptTypes=[],this._exemptTypes=function(){_.each(data.exemptTypes,function(type){if(0===type.indexOf("-")){var toRemoveIndex=this.exemptTypes.indexOf(type.slice(1));_.isUndefined(toRemoveIndex)||this.exemptTypes.splice(toRemoveIndex,1)}else isValidBonusType(type,this.exemptTypes)&&this.exemptTypes.push(type)},this)},this.stats=data.stats,data.stat&&(this.stats=[data.stat]),this.getTotal=function(){var total;return _.isNumber(data.base)&&(total=data.base),total+=bonusHandler.getBonus(this.id,this.exemptTypes)},this.getRoll=function(){return _.sprintf("%+d",this.getTotal())}}function AbilityScore(data){Score.call(this,data),this.exemptTypes=["armor","deflection","dodge","natural armor","shield"],this._exemptTypes(),this.getTotal=function(exemptTemporary){var total=data.base;if(total+=exemptTemporary?bonusHandler.getBonus(this.id,this.exemptTypes):bonusHandler.getBonus([this.id,this.id+"_temporary"],this.exemptTypes),"dexterity"===this.id){var maxDex=2*bonusHandler.getMaxDex()+11;if(total>maxDex)return maxDex}return total},this.getModifier=function(factor,exemptTemporary){factor=factor||1;var modifier=Math.floor((this.getTotal(exemptTemporary)-10)/2);return Math.floor(modifier*factor)},this.getRoll=function(){return _.sprintf("%+d",this.getModifier())}}function Attack(data,defaults,damageDefaults){function getBonusIDs(base){var IDs=[[base],[attack.id,base],[data.range,base],[data.type,base],[attack.id,data.range,base]];return _.map(IDs,function(id){return id.join("_")})}function getDice(){var dieSteps=0;if(dieSteps+=bonusHandler.getBonus(getBonusIDs(["dice_step"])),0===dieSteps)return damage.dice;var dice=damage.dice.split("+");return dice[0]=changeDieBySteps(dice[0],dieSteps),dice.join("+")}function getCrit(){return _.isNumber(damage.critical)?"/x"+damage.critical:_.isString(damage.critical)?"/"+damage.critical:""}function getDamageModifier(){var total=0,factor=damage.factor||1;return total+=damage.base?damage.base:0,total+=abilityScores.getModifiers(_.without(damage.stats,"strength")),total+=bonusHandler.getBonus(getBonusIDs("damage"),attack.exemptTypes),_.contains(damage.stats,"strength")&&(total+=abilityScores.getModifier("strength",factor)),total+=bonusHandler.getBonus(getBonusIDs("strength_like_damage"),attack.exemptTypes,factor),0===total?"":total>0?"+"+total:""+total}data.damage=_.defaults(data.damage||{},damageDefaults||{}),data=_.defaults(data||{},defaults||{}),Score.call(this,data),this.exemptTypes=["armor","deflection","dodge","natural armor","shield"],this._exemptTypes();var attack=this,damage=data.damage;this.info=data.info,this.isRolled=function(){return!data.noToHit},this.getBase=function(){return data.base},this.getBaseToHit=function(){return _.sprintf("%+d",data.base)},this.getToHit=function(){var bab=data.bab?data.bab:0,total=attack.getTotal();total+=abilityScores.getModifiers(data.stats),total+=bonusHandler.getBonus(getBonusIDs("to_hit"),attack.exemptTypes);var rolls=_.sprintf("%+d",bab+total);if("natural"===data.type)return rolls;if(data.itterative)rolls="",_.each(data.itterative,function(i){rolls+=_.sprintf("%+d/",i+bab+total)}),rolls=rolls.slice(0,-1);else for(var itterative=bab-5;itterative>0;itterative-=5)rolls+=_.sprintf("/%+d",itterative+total);return rolls},this.hasDamage=function(){return _.isUndefined(damage)||_.isUndefined(damage.dice)?!1:!0},this.getDamage=function(){var str=getDice()+getDamageModifier()+getCrit();return damage.special?str+" "+damage.special:str}}function Defense(data,defaults){data=_.defaults(data,defaults||{}),Score.call(this,data),this.exemptTypes=["alchemical","circumstance","competence","inherent","morale","resistance"],this._exemptTypes(),data.base=(data.base||10)+(data.bab?data.bab:0),this.getTotal=function(){var total=data.base;return total+=abilityScores.getModifiers(data.stats),total+=bonusHandler.getBonus(this.id,this.exemptTypes)},this._getSpecialDefense=function(specialData){var total=data.base,stats=_.flatten(_.intersection(data.stats,specialData.stats)),exemptTypes=_.flatten([this.exemptTypes,specialData.exemptTypes]);return total+=abilityScores.getModifiers(stats),total+=bonusHandler.getBonus([this.id,specialData.id+this.id],exemptTypes)};var touch=_.defaults(data.touch||{},{id:"touch_",stats:["dexterity"],exemptTypes:["armor","shield","natural armor"]});this.getTouch=function(){return this._getSpecialDefense(touch)};var flatfooted=_.defaults(data.flatfooted||{},{id:"flat_footed_",stats:["strength"],exemptTypes:["dodge"]});this.getFlatFooted=function(){return this._getSpecialDefense(flatfooted)},this.getFlatFooted(),this.toString=function(){var strings=bonusHandler.getBonusStrings(this.id);return _.each(data.stats,function(statName){var roll=abilityScores.getRoll(statName,":");"+0"!==roll&&strings.push(roll+":"+statName.slice(0,3))}),_.isNumber(data.bab)&&0!==data.bab&&strings.push(_.sprintf("%+d",data.bab)+":bab"),strings=_.sortBy(strings,function(string){var name=string.split(":")[1];return name}),_.each(strings,function(string,index){this[index]=string.replace(":"," ")},strings),strings.join(", ")}}function Save(data,defaults){data=_.defaults(data,defaults||{}),Score.call(this,data),this.exemptTypes=["armor","circumstance","deflection","dodge","inherent","natural armor","shield","size"],this._exemptTypes(),this.getTotal=function(){var total=data.base;return total+=abilityScores.getModifiers(data.stats),total+=bonusHandler.getBonus([this.id,"saves"],this.exemptTypes)}}function Skill(data){Score.call(this,data),data.name.indexOf(" (")>-1&&(data.baseID=_.underscored(data.name.slice(0,data.name.indexOf(" (")))),this.getTotal=function(){var total=abilityScores.getModifiers(this.stats);return total+=bonusHandler.getBonus([this.id,data.baseID,"skills"],this.exemptTypes),data.ranks&&(total+=data.ranks),data.classSkill&&data.ranks>0&&(total+=3),data.acp&&(total+=bonusHandler.getBonus("armor_check_penalty",this.exemptTypes)),total},this.isTrained=function(){return data.ranks>0}}function Caster(data){this.md=data.markdown,this.name=data.name,this.id=_(this.name).underscored(),this.type=_.capitalize(data.type),this.spellType=_.capitalize(data.spellType||"Spells"),this.baseSpells=data.baseSpells?data.baseSpells:[],data.stat&&(data.stats=[data.stat]),this.stats=data.stats,this.getCasterLevel=function(){var casterLevel=data.level?data.level:0;return casterLevel+=that.classes[data.name]?that.classes[data.name]:0,casterLevel+=bonusHandler.getBonus(["caster_level",this.id+"_caster_level"])},this.getCasterLevelRoll=function(){return _.sprintf("%+d",this.getCasterLevel())},this.getConcentrationRoll=function(){var concentration=0;return concentration+=this.getCasterLevel(),concentration+=abilityScores.getModifiers(this.stats),concentration+=bonusHandler.getBonus(["concentration",this.id+"_concentration"]),_.sprintf("%+d",concentration)},this.getSpellResistanceRoll=function(){var spellResistance=0;return spellResistance+=this.getCasterLevel(),spellResistance+=bonusHandler.getBonus(["spell_resistance",this.id+"_spell_resistance"]),_.sprintf("%+d",spellResistance)}}var that=this,bonusHandler={data:_.map(data.bonuses,function(bonus){return new Bonus(bonus)}),getTypes:function(targetIDs,exempt,factor){_.isArray(targetIDs)||(targetIDs=[targetIDs]),_.isArray(exempt)||(exempt=[]),factor=factor||1;var bonuses=_.flatten(_.map(targetIDs,function(targetID){return _.map(bonusHandler.data,function(bonusSet){return bonusSet.getTargetting(targetID)})})),types=_.groupBy(bonuses,function(bonus){return bonus.type}),typeTotal={};return _.each(types,function(type,typeName){if(isValidBonusType(typeName,exempt))if(typeTotal[typeName]=0,bonusHandler.canStack(typeName))_.each(type,function(bonus){var value=bonus.value;typeTotal[typeName]+=0>value?value:Math.floor(bonus.value*factor)});else{var values=_.map(type,function(bonus){return bonus.value>=0?bonus.value:0});_.isEmpty(values)||(typeTotal[typeName]+=Math.floor(_.max(values)*factor)),values=_.map(type,function(bonus){return bonus.value<0?bonus.value:0}),typeTotal[typeName]+=_.reduce(values,function(sum,x){return sum+x},0)}}),typeTotal},getBonus:function(targetIDs,exempt,factor){_.isArray(targetIDs)||(targetIDs=[targetIDs]);var types=bonusHandler.getTypes(targetIDs,exempt,factor);return _.reduce(types,function(sum,x){return sum+x},0)},getBonusStrings:function(targetIDs,exempt,factor){var types=this.getTypes(targetIDs,exempt,factor);return _.compactMap(types,function(bonus,type){return 0!==bonus?_.sprintf("%+d:%s",bonus,type.replace("_"," ")):void 0})},getMaxDex:function(){var bonuses=_.map(this.data,function(bonusSet){return bonusSet.getTargetting("maximum_dexterity")});return _.min(bonuses,function(bonus){return bonus.value}).value},bonusIsActiveByID:function(id){return _.some(this.data,function(b){return b.id===id&&b.isActive()})},canStack:function(type){var stackable=["circumstance","dodge","racial","untyped"];return stackable.indexOf(type)>-1}};this.bonuses=bonusHandler.data;var abilityScores=_.defaults(data.abilityScores,{strength:10,dexterity:10,constitution:10,intelligence:10,wisdom:10,charisma:10});if(abilityScores={strength:new AbilityScore({name:"Strength",base:abilityScores.strength}),dexterity:new AbilityScore({name:"Dexterity",base:abilityScores.dexterity}),constitution:new AbilityScore({name:"Constitution",base:abilityScores.constitution}),intelligence:new AbilityScore({name:"Intelligence",base:abilityScores.intelligence}),wisdom:new AbilityScore({name:"Wisdom",base:abilityScores.wisdom}),charisma:new AbilityScore({name:"Charisma",base:abilityScores.charisma})},abilityScores.getModifier=function(scoreID,factor,exemptTemporary){factor=factor||1;var modifier=this[scoreID].getModifier(factor,exemptTemporary);return 0>modifier?modifier:modifier},abilityScores.getRoll=function(scoreID){return this[scoreID].getRoll()},abilityScores.getModifiers=function(scoreIDs,factor,exemptTemporary){var modifiers=[];return _.each(scoreIDs,function(scoreID,index){this[index]=abilityScores.getModifier(scoreID,factor,exemptTemporary)},modifiers),_.reduce(modifiers,function(a,b){return a+b},0)},this.abilityScores=function(){return[abilityScores.strength,abilityScores.dexterity,abilityScores.constitution,abilityScores.intelligence,abilityScores.wisdom,abilityScores.charisma]},this.name=data.name||"Unnamed",this.id=_(this.name).underscored(),data.cr&&data.mr?this.difficulty=_.sprintf("CR %d / MR %d",data.cr,data.mr):data.cr?this.difficulty=_.sprintf("CR %d",data.cr):data.mr&&(this.difficulty=_.sprintf("MR %d",data.mr)),_.isString(data.xp)){var temp=data.xp.split("/");_.each(temp,function(val,index){this[index]=_.numberFormat(parseInt(val))},temp),this.xp=_.sprintf("XP %s/%s",temp[0],temp[1])}_.isNumber(data.xp)&&(this.xp="XP "+_.numberFormat(data.xp)),this.classes=data.classes,this.initiative=new Skill(_.defaults(data.initiative||{},{name:"Initiative",stats:["dexterity"],base:0})),this.senses=stringify(data.senses),this.aura=stringify(data.aura),data.hp=_.defaults(data.hp,{rolls:[],stats:["constitution"]}),data.hp.level=data.hp.rolls.length,this.hp=function(){var total=_.reduce(data.hp.rolls,function(a,b){return a+b},0);total=Math.floor(total),total+=bonusHandler.getBonus("hp"),total+=bonusHandler.getBonus("hp_level")*data.hp.level,_.each(this.classes,function(l,c){total+=bonusHandler.getBonus("hp_level_"+_.underscored(c))*l}),total+=abilityScores.getModifiers(data.hp.stats)*data.hp.level;var temporary=bonusHandler.getBonus("hp_temporary");return 0!==temporary?_.sprintf("%d+%d",total,temporary):total},data.hd=data.hd||"0d0+0",this.hd=function(){var split=data.hd.split("+"),modifier=0;_.last(split).match(/\d+d\d+/g)||(modifier=parseInt(_.last(split))),_.isNumber(modifier)&&(modifier+=bonusHandler.getBonus("hp"),modifier+=bonusHandler.getBonus("hp_level")*data.hp.level,_.each(this.classes,function(l,c){modifier+=bonusHandler.getBonus("hp_level_"+_.underscored(c))*l}),modifier+=abilityScores.getModifier(data.hp.stats)*data.hp.level,0!==modifier&&(split[split.length]=modifier));var temporary=bonusHandler.getBonus("hp_temporary");return 0!==temporary&&(split[split.length]=temporary),split.join("+").replace("+-","-")},this.hpSpecial=stringify(data.hpSpecial),this.speed=data.speed,this.space=data.space,this.reach=data.reach;var visibleClasses=_.compact(_.map(data.classes,function(l,c){return"!"!==c[0]?c+" "+l:""}));this.infoText=[stringify([data.templates,data.race,stringify(visibleClasses,"/")]," "),stringify([data.alignment,data.size,data.type]," ")],this.feats=stringify(data.feats),this.traits=stringify(data.traits),this.languages=stringify(data.languages),this.additionalSections=_.map(data.additionalSections,function(section){return markdownArray(section)}),this.bab=new Attack({name:"Base Attack Bonus",bab:0,base:_.defaults(data.baseAttackBonus,0),stats:[]}),this.cmb=new Attack(data.combatManeuverBonus||{},{name:"Combat Maneuver Bonus",type:"natural",bab:this.bab.getBase(),base:0,stats:["strength"]});var attacks=_.defaults(data.attacks||{},{melee:[],ranged:[],special:[]});this.meleeAttacks=_.map(attacks.melee,function(attack){return new Attack(attack,{type:"weapon",range:"melee",bab:that.bab.getTotal(),base:0,stats:["strength"]},{stats:["strength"]})}),this.rangedAttacks=_.map(attacks.ranged,function(attack){return new Attack(attack,{type:"weapon",range:"ranged",bab:that.bab.getTotal(),base:0,stats:["dexterity"]})}),this.specialAttacks=_.map(attacks.special,function(attack){return new Attack(attack,{range:"special",type:"special",bab:that.bab.getTotal(),base:0,stats:[]})}),this.spells=_.map(data.spells,function(caster){return new Caster(caster)}),this.spellLikeAbilities=_.map(data.spellLikeAbilities,function(caster){return new Caster(caster)});var defense=data.defense||{};this.ac=new Defense(defense.ac||{},{name:"Armor Class",stats:["dexterity"],exemptTypes:[]}),this.cmd=new Defense(defense.cmd||{},{name:"Combat Maneuver Defense",stats:["strength","dexterity"],bab:this.bab.getTotal(),exemptTypes:["armor","shield","natural armor"]});var saves=_.defaults(data.saves,{fortitude:{},reflex:{},will:{},special:void 0});this.saves={fortitude:new Save(saves.fortitude,{name:"Fortitude",stats:["constitution"],base:0}),reflex:new Save(saves.reflex,{name:"Reflex",stats:["dexterity"],base:0}),will:new Save(saves.will,{name:"Will",stats:["wisdom"],base:0}),special:stringify(saves.special)},this.dr=stringify(data.dr),this.immune=stringify(data.immune),this.resist=stringify(data.resist),this.sr=stringify(data.sr),this.defensive=stringify(data.defensive),this.weaknesses=stringify(data.weaknesses),_.each(data.skills,function(skill,skillIndex){this[skillIndex]=new Skill(skill)},data.skills),this.skills={},this.skills.trained=_.filter(data.skills,function(skill){return skill.isTrained()}),this.skills.untrained=_.filter(data.skills,function(skill){return!skill.isTrained()}),this.skills.get=function(skillID){var trained=_.findWhere(this.trained,{id:skillID}),untrained=_.findWhere(this.untrained,{id:skillID});return trained||untrained||new Skill({name:"Dummy Skill"})},this.pf={name:this.name,level:function(className,factor){return factor=factor||1,Math.floor("Hit Dice"===className?data.hp.level*factor:that.classes[className]*factor)},bonusIsActive:function(id){return bonusHandler.bonusIsActiveByID(id)},modifier:function(stat,factor,exemptTemporary){return factor=factor||1,abilityScores.getModifier(stat,factor,exemptTemporary)},spellDC:function(className,level,bonus){bonus=bonus?bonus:0;var caster=_.findWhere(that.spells,function(caster){return caster.name===className});return 10+level+abilityScores.getModifiers(caster.stats)+bonus},spellsPerDay:function(className,spellLevel){var spells=null,caster=_.findWhere(that.spells,{name:className});if(!_.isUndefined(caster)&&(spells=caster.baseSpells[spellLevel],0!==spellLevel)){var modifier=abilityScores.getModifiers(caster.stats);spells+=Math.ceil((1+modifier-spellLevel)/4)}return spells},classDC:function(className,stat,factor,min){factor=factor||.5,min=min||1;var classLevel=Math.floor(that.classes[className]*factor)||min;return 10+classLevel+abilityScores.getModifier(stat)}},this.options=data.options},pf}(),app=angular.module("charactersApp",["ngRoute","ngSanitize"]);app.config(["$compileProvider","$routeProvider",function($compileProvider,$routeProvider){$compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|file|blob):|data:image\//),$routeProvider.when("/",{templateUrl:"views/list.html",controller:"ListCtrl",reloadOnSearch:!1}).when("/:characterId",{templateUrl:"views/character.html",controller:"CharacterCtrl",reloadOnSearch:!1}).otherwise({redirectTo:"/",reloadOnSearch:!1})}]),app.run([function(){FastClick.attach(document.body)}]),app.controller("ListCtrl",["$http","$scope","$window",function($http,$scope,$window){$window.document.title="Character Sheets",$http.get("characters/_list.json").success(function(data){$scope.characters=data})}]),app.controller("CharacterCtrl",["$http","$routeParams","$scope","$window",function($http,$routeParams,$scope,$window){$scope.characters=[],$http.get("characters/"+$routeParams.characterId+"/_data.json").success(function(data){_.each(data,function(characterData,index){this[index]=new pf.Character(characterData)},$scope.characters),$window.document.title=$scope.characters[0].name+" - Character Sheet"})}]),marked.setOptions({renderer:new marked.Renderer,gfm:!0,tables:!0,breaks:!1,pedantic:!1,smartLists:!0,smartypants:!1}),app.directive("md",["$compile","$http","$routeParams",function($compile,$http,$routeParams){return{restrict:"E",scope:{pf:"=",md:"="},templateUrl:"views/directives/md.html",link:function($scope,$element){if(void 0===$scope.md)return void 0;$scope.Math=Math;var alias=function(markdown,aliases){return _.each(aliases,function(alias){markdown=markdown.replace(alias.re,alias.text)}),markdown},render=function(){var pre=[{re:/\{\{/g,text:"`<ng-bind>"},{re:/\}\}/g,text:"</ng-bind>`"}],markdown=alias($scope.md.join("\n\n"),pre),html=marked(markdown),post=[{re:/<code>&lt;ng-bind&gt;/g,text:"{{"},{re:/&lt;\/ng-bind&gt;<\/code>/g,text:"}}"},{re:/unprepared/g,text:'<span class="unprepared">unprepared</span>'},{re:/unknown/g,text:'<span class="unprepared">unknown</span>'},{re:/\^([\w]*)/g,text:"<sup>$1</sup>"},{re:/\$([^\$]*)\$/g,text:"<small>$1</small>"},{re:/\@([^\@]*)\@/g,text:"<roll>$1</roll>"},{re:/<a/g,text:'<a target="_blank"'},{re:/target="_blank" href="#/g,text:'href="#/'+$routeParams.characterId+"#"},{re:/:d20:/g,text:"http://www.d20pfsrd.com/"},{re:/:d20-spell:([a-z])/g,text:"http://www.d20pfsrd.com/magic/all-spells/$1/$1"},{re:/:d20-feat-([^\:]*):/g,text:"http://www.d20pfsrd.com/feats/$1-feats/"},{re:/:d20-trait-([^\:]*):/g,text:"http://www.d20pfsrd.com/traits/$1-traits/"},{re:/:d20-wop-effect:/g,text:"http://www.d20pfsrd.com/magic/variant-magic-rules/words-of-power/effect-words/"},{re:/:d20-wop-meta:/g,text:"http://www.d20pfsrd.com/magic/variant-magic-rules/words-of-power/meta-words/"},{re:/:d20-wop-target:/g,text:"http://www.d20pfsrd.com/magic/variant-magic-rules/words-of-power/target-words/"},{re:/:d20-special-abilities:/g,text:"http://www.d20pfsrd.com/gamemastering/special-abilities#TOC-"},{re:/:d20-creature-types:/g,text:"http://www.d20pfsrd.com/bestiary/rules-for-monsters/creature-types#TOC-"},{re:/:d20-universal-monster-rules:/g,text:"http://www.d20pfsrd.com/bestiary/rules-for-monsters/universal-monster-rules#TOC-"},{re:/:nethys-wondrous:/g,text:"http://www.archivesofnethys.com/MagicWondrousDisplay.aspx?FinalName="},{re:/:nethys-([^\:]*):/g,text:"http://www.archivesofnethys.com/$1Display.aspx?ItemName="},{re:/:prd-spell-crb:([a-zA-Z]+)/g,text:"http://paizo.com/pathfinderRPG/prd/spells/$1.html"},{re:/:prd-spell-apg:([a-zA-Z]+)/g,text:"http://paizo.com/pathfinderRPG/prd/advanced/spells/$1.html"},{re:/:prd-spell-uc:([a-zA-Z]+)/g,text:"http://paizo.com/pathfinderRPG/prd/ultimateCombat/spells/$1.html"},{re:/:prd-spell-um:([a-zA-Z]+)/g,text:"http://paizo.com/pathfinderRPG/prd/ultimateMagic/spells/$1.html"},{re:/:prd-spell-acg:([a-zA-Z]+)/g,text:"http://paizo.com/pathfinderRPG/prd/advancedClassGuide/spells/$1.html"}];return $scope.isText===!0?post=post.concat([{re:/<p/g,text:"<span"},{re:/<\/p>/g,text:"</span>"}]):html='<div class="no-break">'+html+"</div>",html=alias(html,post)},unbindWatcher=$scope.$watch("isReady",function(){if($scope.isReady===!0){var el=angular.element(render());$compile(el)($scope),$element.prepend(el),unbindWatcher()}});if($scope.md.indexOf(".md")>-1){$scope.md=$scope.md.split("+");var remainingMarkdown=$scope.md.length;_.each($scope.md,function(uri,index){-1===uri.indexOf("@")&&$http.get(_.sprintf("characters/%s/%s",$routeParams.characterId,uri)).success(function(data){$scope.md[index]=data,remainingMarkdown--,0===remainingMarkdown&&($scope.isReady=!0)})})}else $scope.md=[$scope.md],$scope.isReady=!0,$scope.isText=!0}}}]);