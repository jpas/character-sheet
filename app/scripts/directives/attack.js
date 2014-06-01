'use strict';


angular.module('charactersApp')
.directive('attack', [
	function () {
		return {
			restrict: 'E',
			scope: {
				data: '='
			},
			templateUrl: 'views/partial/attackDirective.html',
			link: function(scope) {
				scope.name = scope.data.name;
				scope.dice = scope.data.rolls();
			}
		};
	}
]);