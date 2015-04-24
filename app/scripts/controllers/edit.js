'use strict';

app.controller('EditCtrl', [
	'$scope',
	'$http',
	'$location',
	function ($scope, $http, $location) {
		function compress(data) {
			return LZString.compressToEncodedURIComponent(JSON.stringify(data));
		}

		function decompress(data) {
			return JSON.parse(LZString.decompressFromEncodedURIComponent(data));
		}

		if (!$location.search().d) {
			$http.get('characters/_default.json').success(function (data) {
				var compressed = compress(data);
				$location.search('d', compressed);
				$scope.characters = data;
			});
		} else {
			$scope.characters = decompress($location.search().d);
		}

		$scope.$watch(function() {
			$location.search('d', compress($scope.characters));
		});

		$scope.$watch('gm', function() {
			$location.search('gm', $scope.gm);
		});

		$scope.gm = $location.search().gm;

		$scope.new = function() {
			if (window.confirm('Are you sure you want to clear?')) {
				$location.path('/new');
			}
		};

		$scope.view = function() {
			$location.path('/view');
		};

		$scope.validTypes = pf.validTypes;
		$scope.alignments = ['LG','NG','CG','LN','TN','CN','LE','NE','CE'];
		$scope.sizes = ['Fine', 'Diminutive', 'Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan', 'Colossal'];
	}
]);