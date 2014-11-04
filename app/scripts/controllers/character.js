'use strict';

app.controller('CharacterCtrl', [
	'$http',
	'$routeParams',
	'$scope',
	'$window',
	function ($http, $routeParams, $scope, $window) {
		$scope.Math = Math;
		$scope.characters = [];

		$http.get('characters/' + $routeParams.characterId + '/_data.json').success(function (data) {
			_.every(data, function(characterData, index) {
				$scope.characters[index] = new Character(characterData);
			});

			$window.document.title = $scope.characters[0].name + ' - Character Sheet';
		});
	}
]);