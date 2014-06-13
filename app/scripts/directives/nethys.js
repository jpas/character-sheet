'use strict';

angular.module('charactersApp').directive('nethys',
	function () {
		return {
			restrict: 'E',
			transclude: true,
			scope: {
				type: '@',
				item: '=',
				uri: '@'
			},
			templateUrl: 'views/directives/nethys.html',
			link: function (scope) {
				var temp = scope.item.split('||url:') || [];
				scope.uri = temp[1] || 'http://www.archivesofnethys.com/' + scope.type + 'Display.aspx?ItemName=' + encodeURIComponent(scope.item);
			}
		};
	}
);