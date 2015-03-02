'use strict';

marked.setOptions({
	renderer: new marked.Renderer(),
	gfm: true,
	tables: true,
	breaks: false,
	pedantic: false,
	smartLists: true,
	smartypants: false
});

app.directive('md', [
	'$compile',
	'$http',
	'$routeParams',
	function ($compile, $http, $routeParams) {
		return {
			restrict: 'E',
			scope: {
				pf: '=',
				md: '='
			},
			templateUrl: 'views/directives/md.html',
			link: function($scope, $element) {
				if ($scope.md === undefined) { return undefined; }

				$scope.Math = Math;

				var alias = function(markdown, aliases) {
					_.each(aliases, function(alias) {
						markdown = markdown.replace(alias.re, alias.text);
					});

					return markdown;
				};

				var render = function() {
					var pre = [
						{ re: /\{\{/g, text: '`<ng-bind>'},
						{ re: /\}\}/g, text: '</ng-bind>`'}
					];

					var markdown = alias($scope.md.join('\n\n'), pre);

					var html = marked(markdown);

					var post = [
						{ re: /<code>&lt;ng-bind&gt;/g, text: '{{'},
						{ re: /&lt;\/ng-bind&gt;<\/code>/g, text: '}}'},
						{ re: /unprepared/g, text: '<span class="unprepared">unprepared</span>'},
						{ re: /unknown/g, text: '<span class="unprepared">unknown</span>'},
						{ re: /\^([\w]*)/g, text: '<sup>$1</sup>' },
						{ re: /\$([^\$]*)\$/g, text: '<small>$1</small>' },
						{ re: /\@([^\@]*)\@/g, text: '<roll>$1</roll>' },
						{ re: /<a/g, text: '<a target="_blank"'},
						{ re: /target="_blank" href="#/g, text: 'href="#/' + $routeParams.characterId + '#' },
						// d20pfsrd.com shortcuts
						{ re: /:d20:/g, text: 'http://www.d20pfsrd.com/' },
						{ re: /:d20-spell:([a-z])/g, text: 'http://www.d20pfsrd.com/magic/all-spells/$1/$1' },
						{ re: /:d20-feat-([^\:]*):/g, text: 'http://www.d20pfsrd.com/feats/$1-feats/' },
						{ re: /:d20-trait-([^\:]*):/g, text: 'http://www.d20pfsrd.com/traits/$1-traits/' },
						{ re: /:d20-wop-effect:/g, text: 'http://www.d20pfsrd.com/magic/variant-magic-rules/words-of-power/effect-words/' },
						{ re: /:d20-wop-meta:/g, text: 'http://www.d20pfsrd.com/magic/variant-magic-rules/words-of-power/meta-words/' },
						{ re: /:d20-wop-target:/g, text: 'http://www.d20pfsrd.com/magic/variant-magic-rules/words-of-power/target-words/' },
						{ re: /:d20-special-abilities:/g, text: 'http://www.d20pfsrd.com/gamemastering/special-abilities#TOC-' },
						{ re: /:d20-creature-types:/g, text: 'http://www.d20pfsrd.com/bestiary/rules-for-monsters/creature-types#TOC-' },
						{ re: /:d20-universal-monster-rules:/g, text: 'http://www.d20pfsrd.com/bestiary/rules-for-monsters/universal-monster-rules#TOC-' },
						// archive of nethys shortcuts
						{ re: /:nethys-wondrous:/g, text: 'http://www.archivesofnethys.com/MagicWondrousDisplay.aspx?FinalName=' },
						{ re: /:nethys-([^\:]*):/g, text: 'http://www.archivesofnethys.com/$1Display.aspx?ItemName=' },
						// paizo prd
						{ re: /:prd-spell-crb:([a-zA-Z]+)/g, text: 'http://paizo.com/pathfinderRPG/prd/spells/$1.html'},
						{ re: /:prd-spell-apg:([a-zA-Z]+)/g, text: 'http://paizo.com/pathfinderRPG/prd/advanced/spells/$1.html'},
						{ re: /:prd-spell-uc:([a-zA-Z]+)/g, text: 'http://paizo.com/pathfinderRPG/prd/ultimateCombat/spells/$1.html'},
						{ re: /:prd-spell-um:([a-zA-Z]+)/g, text: 'http://paizo.com/pathfinderRPG/prd/ultimateMagic/spells/$1.html'},
						{ re: /:prd-spell-acg:([a-zA-Z]+)/g, text: 'http://paizo.com/pathfinderRPG/prd/advancedClassGuide/spells/$1.html'}
					];

					if ($scope.isText === true) {
						post = post.concat([
							{ re: /<p/g, text: '<span'},
							{ re: /<\/p>/g, text: '</span>'}
						]);
					} else {
						html = '<div class="no-break">' + html + '</div>';
					}

					html = alias(html, post);

					return html;
				};

				var unbindWatcher = $scope.$watch('isReady', function() {
					if ($scope.isReady === true) {
						var el = angular.element(render());
						$compile(el)($scope);
						$element.prepend(el);

						unbindWatcher();
					}
				});

				if ($scope.md.indexOf('.md') > -1) {
					$scope.md = $scope.md.split('+');
					var remainingMarkdown = $scope.md.length;
					_.each($scope.md, function(uri, index) {
						if (uri.indexOf('@') === -1) {
							$http.get(_.sprintf('characters/%s/%s', $routeParams.characterId, uri))
								.success(function (data) {
									$scope.md[index] = data;
									remainingMarkdown--;
									if (remainingMarkdown === 0) {
										$scope.isReady = true;
									}
								});
						}
					});
				} else {
					$scope.md = [$scope.md];
					$scope.isReady = true;
					$scope.isText = true;
				}
			}
		};
	}
]);