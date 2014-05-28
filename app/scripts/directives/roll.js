'use strict';

function RollModalCtrl ($scope, $modalInstance, name, dieSpec, result) {
	$scope.name = name;
	$scope.dieSpec = dieSpec;
	$scope.style = 'panel-default';
	$scope.space = ' ';
	if (result !== null) {
		$scope.res = result.res;
		$scope.type = result.type;
		/* check if it is a d20+x and apply crit/fail styling */
		if ($scope.type[0] === 20 && $scope.type.length === 2) {
			if ($scope.res[0] === 20) {
				$scope.style = 'panel-success';
			} else if ($scope.res[0] === 1) {
				$scope.style = 'panel-warning';
			}
		}
		$scope.total = $scope.res.reduce(function(p, c){
			return p + c;
		});
	}
}

angular.module('charactersApp').directive('roll', [
	'$modal',
	function ($modal) {
		return {
			restrict: 'E',
			scope: {
				name: '@',
				die: '@'
			},
			templateUrl: 'views/partial/rollDirective.html',
			link: function(scope , element) {
				scope.space = ' ';
				scope.clean = function() {
					var temp = scope.die.replace('1d20','');
					if (parseInt(temp) === 0) {
						return 0;
					}
					return temp;
				};
				element.bind('click', function() {
					function roll(dice) {
						/* Source: http://jsDice.com/roller/ */
						dice = dice.replace(/- */,'+ -');
						dice = dice.replace(/D/,'d');
						var re = / *\+ */;
						var items = dice.split(re);
						var res = [];
						var type = [];

						for (var i=0; i < items.length; i++) {
							var match = items[i].match(/^[ \t]*(-)?(\d+)?(?:(d)(\d+))?[ \t]*$/);
							if (match) {
								var sign = match[1]?-1:1;
								var num = parseInt(match[2] || '1');
								var max = parseInt(match[4] || '0');
								if (match[3]) {
									for (var j=1; j<=num; j++) {
										res[res.length] = sign * Math.ceil(max*Math.random());
										type[type.length] = max;
									}
								}
								else {
									res[res.length] = sign * num;
									type[type.length] = 0;
								}
							}
							else {
								return null;
							}
						}
						if (res.length === 0) {
							return null;
						}
						res.sort(function(a, b) {
							return b - a;
						});
						for (i = res.indexOf(0); i > -1; i = res.indexOf(0)) {
							res.splice(i, 1);
						}
						return {
							res: res,
							type: type
						};
					}

					var result = roll(scope.die);

					$modal.open({
						templateUrl: 'views/partial/rollModal.html',
						controller: RollModalCtrl,
						resolve: {
							name: function() {
								return scope.name;
							},
							dieSpec: function() {
								return scope.die;
							},
							result: function () {
								return result;
							}
						}
					});
				});
			}
		};
	}
]);