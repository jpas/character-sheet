'use strict';

app.controller('ListCtrl', [
	'$http',
	'$scope',
	'$window',
	function ($http, $scope, $window) {
		$window.document.title = 'Character Sheets';
		$http
			.get('characters/_list.json')
			.success(function (data) {
				$scope.characters = data;
			});
	}
]);