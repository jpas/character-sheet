'use strict';
/*exported pf*/

var pf = {
	concat: function () {
		var args = Array.prototype.slice.call(arguments);
		for (var i = args.length - 1; i >= 0; i--) {
			if (typeof args[i] === 'number') {
				args[i] = args[i] < 0 ? args[i].toString() : '+' + args[i].toString();
			}
		}
		return args.join('');
	}
};

String.prototype.capitalize = function () {
	return this.charAt(0).toUpperCase() + this.slice(1);
};

Number.prototype.toOrdinal = function() {
	var s = ['th','st','nd','rd'];
	var v = this%100;
	return this + (s[(v-20)%10]||s[v]||s[0]);
};

String.prototype.toProperCase = function () {
	return this.replace(/\w\S*/g, function (txt) {
		return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
	});
};