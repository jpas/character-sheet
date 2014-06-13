'use strict';

angular.module('charactersApp').directive('spell',
	function () {
		return {
			restrict: 'E',
			scope: {
				name: '='
			},
			templateUrl: 'views/directives/spell.html',
			link: function (scope) {
				var temp = scope.name.split('||');
				scope.spellName = temp[0].toLowerCase();
				if (scope.spellName === 'unprepared') {
					scope.unprepared = true;
				}
				scope.url = temp[0];
				for (var i = temp.length - 1; i >= 0; i--) {
					var split = temp[i].split(':');
					switch (split[0]) {
						case 'dc':
							scope.dc = split[1];
							break;
						case 'type':
							scope.sup = split[1];
							break;
						case 'meta':
							scope.meta = split[1];
							break;
						case 'cast':
							scope.cast = 'cast';
							break;
						case 'count':
							scope.count = parseInt(split[1], 10);
							break;
						case 'url':
							scope.url = split[1];
							break;
					}
				}
				scope.countDC = function () {
					if (scope.count && scope.dc) {
						return scope.count + ', DC ' + scope.dc;
					} else if (scope.count) {
						return scope.count;
					} else if (scope.dc) {
						return 'DC ' + scope.dc;
					}
				};
			}
		};
	}
);