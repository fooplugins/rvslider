(function($, FP){

	$.fn.rvslider = function(options){
		return this.each(function(){
			var rvs = $(this).data('__RVSlider__');
			if (rvs instanceof FP.RVSlider) rvs.destroy();
			FP.RVSlider(this, options);
		});
	};

	FP.RVSlider = function(el, options){
		if (!(this instanceof FP.RVSlider)) return new FP.RVSlider(el, options);
		var $el = $(el);
		this.$ = {
			el: $el,
			empty: $el.find('.rvs-empty')
		};
		this.o = $.extend(true, {}, FP.RVSlider.defaults, options);
		this.index = this.o.selected;
		this.breakpoints = '[object Array]' === Object.prototype.toString.call(this.o.breakpoints) ? this.o.breakpoints : [ // number of items to display at various widths and the classes to apply
			[480, 'rvs-xs', 2], // Width less than 320 equals 2 items
			[768, 'rvs-xs rvs-sm', 3], // W > 320 && W < 768 = 3 items
			[1024, 'rvs-xs rvs-sm rvs-md', 4], // W > 768 && W < 1024 = 4 items
			[1280, 'rvs-xs rvs-sm rvs-md rvs-lg', 5], // W > 1024 && W < 1280 = 5 items
			[1600, 'rvs-xs rvs-sm rvs-md rvs-lg rvs-xl', 6] // Effectively anything greater than 1280 will equal 6 items as this last value is used for anything larger.
		];
		this.breakpoint = null;
		this.useViewport = this.$.el.hasClass('rvs-use-viewport');
		this.items = new FP.RVSliderItems(this);
		this.nav = new FP.RVSliderNav(this);
		this.player = new FP.RVSliderPlayer(this);
		this.resize();
		this.setActive(this.index);
		this.$.el.addClass('rvs-animate').data('__RVSlider__', this);
		$(window).on('resize.rvs', {self: this}, this.onWindowResize);
	};

	FP.RVSlider.defaults = {
		selected: 0,
		swipe: {
			deadzone: 10, // in pixels - the swipe must travel further than this value before it is registered and the plugin takes control of the touch move event
			items: 0.05, // in percent - this is the percent of an items width a swipe must travel before it switches to the next item
			nav: 0.1, // in percent - this is the percent of a nav items height a swipe must travel before it scrolls the nav items.
			touches: 1 // the minimum number of touches that must be registered in order to swipe
		},
		breakpoints: null // number of items to display at various widths when using the horizontal layout
	};

	var prefixes = ['Webkit', 'Moz', 'ms', 'O', 'Khtml'],
		elem = document.createElement('div');

	function supports(name){
		if (typeof elem.style[name] !== 'undefined') return true;
		for (var i = 0, len = prefixes.length; i < len; i++){
			var n = prefixes[i] + name.charAt(0).toUpperCase() + name.substr(1);
			if (typeof elem.style[n] !== 'undefined') return true;
		}
		return false;
	}

	FP.RVSlider.supportsTransitions = supports('transition');

	FP.RVSlider.prototype.destroy = function(){
		$(window).off('resize.rvs', this.onWindowResize);
		this.$.el.removeClass('rvs-animate').removeData('__RVSlider__');
		this.player.destroy();
		this.nav.destroy();
		this.items.destroy();
	};

	FP.RVSlider.prototype._breakpoint = function(){
		var ratio = 'devicePixelRatio' in window && typeof window.devicePixelRatio === 'number' ? window.devicePixelRatio : 1,
			i = 0, len = this.breakpoints.length, current,
			width = this.useViewport
				? (window.innerWidth || document.documentElement.clientWidth || (document.body ? document.body.offsetWidth : 0)) / ratio
				: this.$.el.parent().innerWidth();

		this.breakpoints.sort(function(a,b){ return a[0] - b[0]; });
		for (; i < len; i++){
			if (this.breakpoints[i][0] >= width){
				current = this.breakpoints[i];
				break;
			}
		}
		if (!current) current = this.breakpoints[len - 1];
		return current;
	};

	FP.RVSlider.prototype.preresize = function(){
		this.$.el.removeClass('rvs-animate');
	};

	FP.RVSlider.prototype.resize = function(){
		this.breakpoint = this._breakpoint();
		this.$.el.removeClass(this.breakpoints[this.breakpoints.length - 1][1]).addClass(this.breakpoint[1]);
		this.items.resize();
		this.nav.resize();
		this.$.el.addClass('rvs-animate');
	};

	FP.RVSlider.prototype.setActive = function(index){
		if (this.items.count == 0){
			this.$.empty.show();
		} else {
			this.$.empty.hide();
			this.items.setActive(index);
			this.nav.setActive(index);
			this.player.setActive(index);
			this.index = index;
		}
	};

	FP.RVSlider.prototype.onWindowResize = function(e){
		var self = e.data.self;
		if (self.__resize__) clearTimeout(self.__resize__);
		self.preresize();
		self.__resize__ = setTimeout(function(){
			self.__resize__ = false;
			self.resize();
		}, 50);
	};

})(jQuery, window.FooPlugins = window.FooPlugins || {});