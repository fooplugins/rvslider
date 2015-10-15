(function($, FP){

	$.fn.rvslider = function(options){
		return this.each(function(){
			var rvs = $(this).data('__RVSlider__');
			if (rvs instanceof FP.RVSlider) rvs.destroy();
			FP.RVSlider(this, options);
		});
	};

	var def = {
		selected: 0,
		swipe: {
			deadzone: 10, // in pixels - the swipe must travel further than this value before it is registered and the plugin takes control of the touch move event
			items: 0.05, // in percent - this is the percent of an items width a swipe must travel before it switches to the next item
			nav: 0.1, // in percent - this is the percent of a nav items height a swipe must travel before it scrolls the nav items.
			touches: 1 // the minimum number of touches that must be registered in order to swipe
		},
		breakpoints: null, // number of items to display at various widths when using the horizontal layout
		mejs: { // any base MediaElement.js options
			enabled: true, // when enabled this allows for local files as well as youtube/vimeo to be played
			youtube: false, // set to true to override the default YouTube player
			vimeo: false // vimeo is not currently supported/bugged this is here for when it works
		}
	};

	FP.RVSlider = function(el, options){
		if (!(this instanceof FP.RVSlider)) return new FP.RVSlider(el, options);
		var $el = $(el);
		this.$ = {
			el: $el,
			empty: $el.find('.rvs-empty')
		};
		this.o = $.extend(true, {}, def, options);
		this.index = this.o.selected;
		this.items = new FP.RVSliderItems(this);
		this.nav = new FP.RVSliderNav(this);
		this.player = new FP.RVSliderPlayer(this);
		this.resize();
		this.setActive(this.index);
		this.$.el.addClass('rvs-animate').data('__RVSlider__', this);
		jQuery(window).on('resize.rvs', {self: this}, this.onWindowResize);
	};

	FP.RVSlider.prototype.destroy = function(){
		$(window).off('resize.rvs', this.onWindowResize);
		this.$.el.removeClass('rvs-animate').removeData('__RVSlider__');
		this.player.destroy();
		this.nav.destroy();
		this.items.destroy();
	};

	FP.RVSlider.prototype.preresize = function(){
		this.$.el.removeClass('rvs-animate');
	};

	FP.RVSlider.prototype.resize = function(){
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