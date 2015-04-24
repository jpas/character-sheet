'use strict';

app.controller('NewCtrl', [
	'$location',
	function ($location) {
		$location.search('d', null);
		$location.path('/edit');
	}
]);