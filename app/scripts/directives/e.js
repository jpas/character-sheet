'use strict';

angular.module('charactersApp')
.directive('e', [
	function () {
		return {
			restrict: 'E',
			transclude: true,
			scope: {
				d: '='
			},
			templateUrl: 'views/directives/e.html',
			link: function(scope) {
				if (typeof scope.d === 'string' || typeof scope.d === 'number') {
					scope.d = {
						'type': 'string',
						'text': scope.d
					};
				}
			}
		};
	}
]);