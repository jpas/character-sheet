'use strict';

angular.module('charactersApp').directive('srd',
	function () {
		return {
			restrict: 'E',
			scope: {
				link: '@',
				text: '@'
			},
			templateUrl: 'views/partial/srdDirective.html'
		};
	}
);