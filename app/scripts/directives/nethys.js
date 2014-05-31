'use strict';

angular.module('charactersApp').directive('nethys',
	function () {
		return {
			restrict: 'E',
			transclude: true,
			scope: {
				type: '=',
				item: '='
			},
			templateUrl: 'views/partial/nethysDirective.html',
			link: function (scope) {
				scope.item = encodeURIComponent(scope.item);
			}
		};
	}
);