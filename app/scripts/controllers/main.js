'use strict';

angular.module('charactersApp')
.controller('MainCtrl', ['$scope', '$http',
	function ($scope, $http) {
		$http.get('characters/characters.json')
		.success(function (data) {
			$scope.characters = data;
		});
	}]);