'use strict';
/*exported app*/

var app = angular.module('charactersApp', [
	'ngResource',
	'ngRoute',
	'ngSanitize',
	'ui.bootstrap'
]);

app.config([
	'$compileProvider',
	'$routeProvider',
	function ($compileProvider, $routeProvider) {
		$compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|file|blob):|data:image\//);

		$routeProvider
		.when('/', {
			templateUrl: 'views/main.html',
			controller: 'MainCtrl',
			reloadOnSearch: false
		})
		.when('/:characterId', {
			templateUrl: 'views/character.html',
			controller: 'CharacterCtrl',
			reloadOnSearch: false
		})
		.otherwise({
			redirectTo: '/',
			reloadOnSearch: false
		});
	}
]);

app.run([
	function() {
		FastClick.attach(document.body);
	}
]);