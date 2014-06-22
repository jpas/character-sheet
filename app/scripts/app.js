'use strict';

var FastClick = FastClick;
var $ = $;

angular.module('charactersApp', [
	'ngSanitize',
	'ngRoute',
	'ngResource',
	'ui.bootstrap'
])
.config(function ($routeProvider) {
	$routeProvider
	.when('/', {
		templateUrl: 'views/main.html',
		controller: 'MainCtrl'
	})
	.when('/:characterId', {
		templateUrl: 'views/character.html',
		controller: 'CharacterCtrl',
		reloadOnSearch: false
	})
	.otherwise({
		redirectTo: '/'
	});
})
.run([
	'$rootScope',
	'$location',
	'$anchorScroll',
	'$routeParams',
	function($rootScope, $location, $anchorScroll, $routeParams) {
		$rootScope.$on('$routeChangeSuccess', function() {
			$location.hash($routeParams.scrollTo);
			$anchorScroll();
		});
		FastClick.attach(document.body);
		$('body').scrollspy({
			target: '.bs-docs-sidebar',
			offset: 40
		});
	}
]);
