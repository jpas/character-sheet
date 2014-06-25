'use strict';

angular.module('charactersApp')
.controller('MainCtrl', [
	'$http',
	'$scope',
	'$window',
	function ($http, $scope, $window) {
		$window.document.title = 'Character Sheets';
		$http.get('characters/list.json')
		.success(function (data) {
			$scope.characters = data;
		});
	}
]);