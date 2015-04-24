'use strict';

app.controller('CharacterCtrl', [
	'$http',
	'$routeParams',
	'$scope',
	'$window',
	'$location',
	function ($http, $routeParams, $scope, $window, $location) {
		$scope.characters = [];

		function decompress(data) {
			return JSON.parse(LZString.decompressFromEncodedURIComponent(data));
		}

		function apply(data) {
			_.each(data, function(characterData, index) {
				this[index] = new pf.Character(characterData);
			}, $scope.characters);

			$window.document.title = $scope.characters[0].name + ' - Character Sheet';
		}

		if($routeParams.characterId) {
			$http.get('characters/' + $routeParams.characterId + '/_data.json').success(apply);
		} else {
			apply(decompress($location.search().d));
			$scope.canEdit = true;
		}

		$scope.edit = function() {
			$location.path('/edit');
		};
	}
]);