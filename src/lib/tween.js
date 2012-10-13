/**
 * requestAnimationFrame polyfill by Erik Möller
 * fixes from Paul Irish and Tino Zijdel
 * http://paulirish.com/2011/requestanimationframe-for-smart-animating/
 * http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
 */
(function() {
	var lastTime = 0;
	var vendors = [ 'ms', 'moz', 'webkit', 'o' ];
	for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
		window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
		window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame']
				|| window[vendors[x] + 'CancelRequestAnimationFrame'];
	}

	if (!window.requestAnimationFrame)
		window.requestAnimationFrame = function(callback, element) {
			var currTime = (new Date()).getTime();
			var timeToCall = Math.max(0, 16 - (currTime - lastTime));
			var id = window.setTimeout(function() {
				callback(currTime + timeToCall);
			}, timeToCall);
			lastTime = currTime + timeToCall;
			return id;
		};

	if (!window.cancelAnimationFrame)
		window.cancelAnimationFrame = function(id) {
			clearTimeout(id);
		};
}());

(function(global) {
	var dummyFn = function() {};
	var anims = [];
	
	var defaults = {
		duration: 500, // ms
		easing: 'linear',
		step: dummyFn,
		complete: dummyFn,
		autostart: true
	};
	
	var easings = {
		linear: function(t, b, c, d) {
			return c * t / d + b;
		},
		easeInQuad: function(t, b, c, d) {
			return c*(t/=d)*t + b;
		},
		easeOutQuad: function(t, b, c, d) {
			return -c *(t/=d)*(t-2) + b;
		},
		easeInOutQuad: function(t, b, c, d) {
			if((t/=d/2) < 1) return c/2*t*t + b;
			return -c/2 *((--t)*(t-2) - 1) + b;
		},
		easeInCubic: function(t, b, c, d) {
			return c*(t/=d)*t*t + b;
		},
		easeOutCubic: function(t, b, c, d) {
			return c*((t=t/d-1)*t*t + 1) + b;
		},
		easeInOutCubic: function(t, b, c, d) {
			if((t/=d/2) < 1) return c/2*t*t*t + b;
			return c/2*((t-=2)*t*t + 2) + b;
		},
		
		easeInExpo: function(t, b, c, d) {
			return(t==0) ? b : c * Math.pow(2, 10 *(t/d - 1)) + b - c * 0.001;
		},
		easeOutExpo: function(t, b, c, d) {
			return(t==d) ? b+c : c * 1.001 *(-Math.pow(2, -10 * t/d) + 1) + b;
		},
		easeInOutExpo: function(t, b, c, d) {
			if(t==0) return b;
			if(t==d) return b+c;
			if((t/=d/2) < 1) return c/2 * Math.pow(2, 10 *(t - 1)) + b - c * 0.0005;
			return c/2 * 1.0005 *(-Math.pow(2, -10 * --t) + 2) + b;
		},
		
		easeInElastic: function(t, b, c, d, a, p) {
			var s;
			if(t==0) return b;  if((t/=d)==1) return b+c;  if(!p) p=d*.3;
			if(!a || a < Math.abs(c)) { a=c; s=p/4; } else s = p/(2*Math.PI) * Math.asin(c/a);
			return -(a*Math.pow(2,10*(t-=1)) * Math.sin((t*d-s)*(2*Math.PI)/p )) + b;
		},
		easeOutElastic: function(t, b, c, d, a, p) {
			var s;
			if(t==0) return b;  if((t/=d)==1) return b+c;  if(!p) p=d*.3;
			if(!a || a < Math.abs(c)) { a=c; s=p/4; } else s = p/(2*Math.PI) * Math.asin(c/a);
			return(a*Math.pow(2,-10*t) * Math.sin((t*d-s)*(2*Math.PI)/p ) + c + b);
		},
		easeInOutElastic: function(t, b, c, d, a, p) {
			var s;
			if(t==0) return b; 
			if((t/=d/2)==2) return b+c;
			if(!p) p=d*(.3*1.5);
			if(!a || a < Math.abs(c)) { a=c; s=p/4; }       else s = p/(2*Math.PI) * Math.asin(c/a);
			if(t < 1) return -.5*(a*Math.pow(2,10*(t-=1)) * Math.sin((t*d-s)*(2*Math.PI)/p )) + b;
			return a*Math.pow(2,-10*(t-=1)) * Math.sin((t*d-s)*(2*Math.PI)/p )*.5 + c + b;
		},
		easeInBack: function(t, b, c, d, s) {
			if(s == undefined) s = 1.70158;
			return c*(t/=d)*t*((s+1)*t - s) + b;
		},
		easeOutBack: function(t, b, c, d, s) {
			if(s == undefined) s = 1.70158;
			return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
		},
		easeInOutBack: function(t, b, c, d, s) {
			if(s == undefined) s = 1.70158;
			if((t/=d/2) < 1) return c/2*(t*t*(((s*=(1.525))+1)*t - s)) + b;
			return c/2*((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2) + b;
		},
		easeInBounce: function(t, b, c, d) {
			return c - $.easing.easeOutBounce(x, d-t, 0, c, d) + b;
		},
		easeOutBounce: function(t, b, c, d) {
			if((t/=d) <(1/2.75)) {
				return c*(7.5625*t*t) + b;
			} else if(t <(2/2.75)) {
				return c*(7.5625*(t-=(1.5/2.75))*t + .75) + b;
			} else if(t <(2.5/2.75)) {
				return c*(7.5625*(t-=(2.25/2.75))*t + .9375) + b;
			} else {
				return c*(7.5625*(t-=(2.625/2.75))*t + .984375) + b;
			}
		},
		easeInOutBounce: function(t, b, c, d) {
			if(t < d/2) return $.easing.easeInBounce(x, t*2, 0, c, d) * .5 + b;
			return $.easing.easeOutBounce(x, t*2-d, 0, c, d) * .5 + c*.5 + b;
		}
	};
	
	function mainLoop() {
		if (!anims.length) {
			// no animations left, stop polling
			return;
		}
		
		var now = +new Date;
		var filtered = [], tween, opt;

		// do not use Array.filter() of _.filter() function
		// since tween’s callbacks can add new animations
		// in runtime. In this case, filter function will loose
		// newly created animation
		for (var i = 0; i < anims.length; i++) {
			tween = anims[i];
			var opt = tween.options;
			if (tween.pos === 1 || tween.endTime <= now) {
				opt.step.call(tween, tween.pos = 1);
				tween.stop();
			} else {
				tween.pos = opt.easing(now - tween.startTime, 0, 1, opt.duration);
				opt.step.call(tween, tween.pos);
				filtered.push(tween);
			}			
		};
	
		anims = filtered;

		if (anims.length) {
			requestAnimationFrame(mainLoop);
		}
	}
	
	function addToQueue(tween) {
		if (_.indexOf(anims, tween) == -1) {
			anims.push(tween);
			if (anims.length == 1)
				mainLoop();
		}
	}
	
	function Tween(options) {
		this.options = _.extend({}, defaults, options || {});
		
		var e = this.options.easing;
		if (_.isString(e)) {
			if (!easings[e])
				throw 'Unknown "' + e + '" easing function';
			this.options.easing = easings[e];
		}
		
		if (!_.isFunction(this.options.easing))
			throw 'Easing should be a function';

		this._id = _.uniqueId('tw');
		
		if (this.options.autostart)
			this.start();
	}
	
	Tween.prototype = {
		/**
		 * Start animation from the beginning
		 */
		start: function() {
			this.pos = 0;
			this.startTime = +new Date;
			this.endTime = this.startTime + this.options.duration;
			this.animating = true;
			addToQueue(this);
		},
		
		/**
		 * Stop animation
		 */
		stop: function() {
			this.animating = false;
			this.options.complete();
		}
	};

	Tween.__getAnims = function() {
		return anims;
	};
	
	global.Tween = Tween;
})(this);