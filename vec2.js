function vec2(x, y) {
	this.x = x;
	this.y = y;
}

vec2.from = function(object) {
	return new vec2(object.x, object.y);
};

vec2.prototype = {
	plus: function(val) {
		return new vec2(this.x + val.x, this.y + val.y);
	},
	minus: function(val) {
		return new vec2(this.x - val.x, this.y - val.y);
	},
	times: function(s) {
		return new vec2(this.x * s, this.y * s);
	},
	dist: function(to) {
		return this.minus(to).len();
	},
	len: function() {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	},
	norm: function() {
		return this.times(1/this.len());
	},
	lerp: function(to, v) {
		return this.plus(to.minus(this).times(v));
	},
	set: function(val) {
		this.x = val.x;
		this.y = val.y;
	},
	eq: function(to) {
		return this.x == to.x && this.y == to.y;
	},
	rot: function(angle) {
		var result = new vec2(0, 0);
		result.x = this.x * Math.cos(angle) - this.y * Math.sin(angle);
		result.y = this.x * Math.sin(angle) + this.y * Math.cos(angle);
		return result;
	}
};