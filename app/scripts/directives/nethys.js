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
				if (scope.item.indexOf('custom:') > -1) {
					var split = scope.item.split('||')[1].split(':');
					if (split[1].indexOf('http') > -1) {
						scope.uri = split[1] + ':' + split[2];
					} else {
						scope.uri = split[1];
					}
				} else {
					scope.uri = 'http://www.archivesofnethys.com/' + scope.type + 'Display.aspx?ItemName=' + encodeURIComponent(scope.item);
				}
			}
		};
	}
);