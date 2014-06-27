'use strict';

app.directive('attack', [
	function () {
		return {
			restrict: 'E',
			scope: {
				data: '='
			},
			templateUrl: 'views/directives/attack.html',
			link: function(scope) {
				scope.dice = scope.data.rolls();
			}
		};
	}
]);