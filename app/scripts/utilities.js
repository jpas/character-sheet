'use strict';

_.mixin({
	compactMap: function(list, iteratee, context) {
		return _.compact(_.map(list, iteratee, context));
	}
});

_.mixin(_.str.exports());

Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};