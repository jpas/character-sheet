'use strict';

angular.module('charactersApp').directive('spell',
	function () {
		return {
			restrict: 'E',
			scope: {
				name: '=',
				data: '='
			},
			templateUrl: 'views/partial/spellDirective.html',
			link: function (scope) {
				var split = scope.name.split('|');
				scope.name = split[0];

				if (split[1] && split[1] !== 'cast') {
					scope.meta = split[1];
				}

				if (split.indexOf('cast') > 0) {
					scope.cast = 'cast';
				} else {
					scope.cast = '';
				}

				scope.clean = function() {
					if (scope.name === 'unprepared-sp') {
						return 'unprepared';
					}
					if (scope.meta) {
						return scope.meta  + ' ' + scope.name;
					}
					return scope.name;
				};

				scope.link = function() {
					if (scope.data.link) {
						return true;
					}
					return false;
				};
			}
		};
	}
);