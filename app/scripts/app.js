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

Number.prototype.toOrdinal = function() {
	var s = ['th','st','nd','rd'];
	var v = this%100;
	return this + (s[(v-20)%10]||s[v]||s[0]);
};


angular.module('charactersApp').filter('with', function() {
	return function(items, field) {
		var result = {};
		angular.forEach(items, function(value, key) {
			if (!value.hasOwnProperty(field)) {
				result[key] = value;
			}
		});
		return result;
	};
});
 
angular.module('charactersApp').run(function() {
	FastClick.attach(document.body);
});