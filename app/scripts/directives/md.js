'use strict';

var marked = marked;
marked.setOptions({
	renderer: new marked.Renderer(),
	gfm: true,
	tables: true,
	breaks: false,
	pedantic: false,
	smartLists: true,
	smartypants: false
});

angular.module('charactersApp')
.directive('md', [
	'$http',
	'$routeParams',
	'$compile',
	function ($http, $routeParams, $compile) {
		return {
			restrict: 'E',
			transclude: true,
			scope: {
				md: '=',
				c: '='
			},
			templateUrl: 'views/directives/md.html',
			link: function(scope, elem) {
				scope.Math = Math;
				var url = 'characters/' + $routeParams.characterId + '/' + scope.md + '.md';
				if (scope.md.indexOf('@') === -1) {
					$http.get(url).success(function (data) {
						var html = marked(data);

						html = html.replace('<a', '<a target="_blank"', 'g');
						html = html.replace(/:d20spell:([a-z])/g, 'http://www.d20pfsrd.com/magic/all-spells/$1/$1');

						var el = angular.element(html);
						$compile(el)(scope);
						elem.append(el);
					});
				}
			}
		};
	}
]);