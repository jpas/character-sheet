'use strict';

angular.module('charactersApp')
.directive('md', [
	'$http',
	'$routeParams',
	function ($http, $routeParams) {
		return {
			restrict: 'E',
			transclude: true,
			scope: {
				md: '='
			},
			templateUrl: 'views/directives/md.html',
			link: function(scope) {
				var url = 'characters/' + $routeParams.characterId + '/' + scope.md + '.md';
				$http.get(url).success(function (data) {
					scope.html = marked(data);
				});
			}
		};
	}
]);