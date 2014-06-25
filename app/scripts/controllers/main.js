'use strict';

angular.module('charactersApp')
.controller('MainCtrl', ['$scope', '$http',
	function ($scope, $http) {
		$http.get('characters/_list.json')
		.success(function (data) {
			// testing
			console.log(data);
			$scope.characters = data;
		});
	}]);