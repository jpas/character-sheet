'use strict';

angular.module('charactersApp').directive('feat',
	function () {
		return {
			restrict: 'E',
			scope: {
				name: '='
			},
			templateUrl: 'views/directives/feat.html',
			link: function (scope) {
				var temp = scope.name.split('||');
				scope.name = temp[0];
				scope.uri = 'http://www.archivesofnethys.com/FeatDisplay.aspx?ItemName=';
				scope.uri = temp[1] || scope.uri + encodeURIComponent(scope.name.split(' (')[0]);
			}
		};
	}
);