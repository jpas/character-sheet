'use strict';

angular.module('charactersApp').controller('CharacterCtrl', [
	'$scope',
	'$http',
	'$routeParams',
	function ($scope, $http, $routeParams) {
		$http.get('characters/' + $routeParams.characterId + '.json').success(function(data) {
			$scope.character = data;
		});
		$scope.getCheck = function (score) {
			var mod = Math.floor((score-10)/2);
			if (mod >= 0) {
				mod = '+' + mod;
			}
			return '1d20' + mod;
		};
		$scope.isDie = function (dice) {
			dice = dice.replace(/- */,'+ -');
			dice = dice.replace(/D/,'d');
			var items = dice.split(/ *\+ */);
			for (var i=0; i < items.length; i++) {
				if(!/^[ \t]*(-)?(\d+)?(?:(d)(\d+))?[ \t]*$/.test(items[i])) {
					return false;
				}
			}
			return true;
		};
		$scope.findSpell = function(spellList, spellName) {
			return spellList.filter(function(e) {
				return e.name === spellName;
			})[0];
		};
	}
]);


