'use strict';

app.controller('CharacterCtrl', [
	'$http',
	'$routeParams',
	'$scope',
	'$window',
	function ($http, $routeParams, $scope, $window) {
		$scope.characters = [];

		$http
			.get('characters/' + $routeParams.characterId + '/_data.json')
			.success(function (data) {
				_.each(data, function(characterData, index) {
					this[index] = new Character(characterData);
				}, $scope.characters);

				$window.document.title = $scope.characters[0].name + ' - Character Sheet';
			});
	}
]);