'use strict';

var FastClick = FastClick;

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
		controller: 'CharacterCtrl'
	})
	.otherwise({
		redirectTo: '/'
	});
});

angular.module('charactersApp').run(function() {
	FastClick.attach(document.body);
});