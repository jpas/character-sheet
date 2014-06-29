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
			transclude: true,
			scope: {
				md: '=',
				c: '='
			},
			templateUrl: 'views/directives/md.html',
			link: function(scope, elem) {
				if (scope.md === undefined && scope.md === undefined) {
					return;
				}

				scope.pf = pf;
				scope.Math = Math;
				if (typeof scope.md !== 'string') {
					scope.md = scope.md.toString();
				}

				function parse(data, isText) {
					var markdown = data;

					var pre = [
						{ re: /\{\{/g, text: '`<ng-bind>'},
						{ re: /\}\}/g, text: '</ng-bind>`'}
					];

					angular.forEach(pre, function(r) {
						markdown = markdown.replace(r.re, r.text);
					});

					var html = marked(markdown);

					var post = [
						{ re: /<code>&lt;ng-bind&gt;/g, text: '{{'},
						{ re: /&lt;\/ng-bind&gt;<\/code>/g, text: '}}'},
						{ re: /\^([^\^]*)\^/g, text: '<sup>$1</sup>' },
						{ re: /\$([^\$]*)\$/g, text: '<small>$1</small>' },
						{ re: /<a/g, text: '<a target="_blank"'},
						{ re: /target="_blank" href="#/g, text: 'href="#/' + $routeParams.characterId + '#' },
						// link shortcuts
						{ re: /:d20-spell:([a-z])/g, text: 'http://www.d20pfsrd.com/magic/all-spells/$1/$1' },
						{ re: /:d20-feat-([^\:]*):/g, text: 'http://www.d20pfsrd.com/feats/$1-feats/' },
						{ re: /:d20-trait-([^\:]*):/g, text: 'http://www.d20pfsrd.com/traits/$1-traits/' },
						{ re: /:d20-wop-effect:/g, text: 'http://www.d20pfsrd.com/magic/variant-magic-rules/words-of-power/effect-words/' },
						{ re: /:d20-wop-meta:/g, text: 'http://www.d20pfsrd.com/magic/variant-magic-rules/words-of-power/meta-words/' },
						{ re: /:d20-wop-target:/g, text: 'http://www.d20pfsrd.com/magic/variant-magic-rules/words-of-power/target-words/' },
						{ re: /:nethys-([^\:]*):/g, text: 'http://www.archivesofnethys.com/$1Display.aspx?ItemName=' }
					];

					if (isText === true) {
						post = post.concat([
							{ re: /<p/g, text: '<span'},
							{ re: /<\/p>/g, text: '</span>'}
						]);
					}

					angular.forEach(post, function(r) {
						html = html.replace(r.re, r.text);
					});

					var el = angular.element(html);
					$compile(el)(scope);
					elem.prepend(el);
				}

				if (scope.md.indexOf('.md') !== -1) {
					if (scope.md.indexOf('@') === -1) {
						var mdUrl = 'characters/' + $routeParams.characterId + '/' + scope.md;
						$http.get(mdUrl).success(parse);
					}
				} else if(scope.md) {
					parse(scope.md, true);
				}
			}
		};
	}
]);