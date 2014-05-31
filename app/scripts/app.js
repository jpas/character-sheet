'use strict';

var FastClick = FastClick;

angular.module('charactersApp', [
	'ngCookies',
	'ngResource',
	'ngSanitize',
	'ngRoute',
	'ui.bootstrap'
])
.config(function ($routeProvider) {
	$routeProvider
	.when('/', {
		templateUrl: 'views/main.html',
		controller: 'MainCtrl'
	})
	.when('/characters/:characterId', {
		templateUrl: 'views/character.html',
		controller: 'CharacterCtrl'
	})
	.otherwise({
		redirectTo: '/'
	});
});

angular.module('charactersApp').run(function() {
	FastClick.attach(document.body);
});