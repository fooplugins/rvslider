/*!
* Responsive Video Gallery - A jQuery plugin that provides a slider with horizontal and vertical thumb layouts for video galleries.
* @version 1.0.2
* @link http://fooplugins.github.io/rvslider/
* @copyright Steven Usher & Brad Vincent 2015
* @license Released under the MIT license.
*/
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
(function($, FP){

	FP.RVSliderItems = function(rvs){
		if (!(this instanceof FP.RVSliderItems)) return new FP.RVSliderItems(rvs);
		this.rvs = rvs;
		var self = this;
		this.$ = {
			container: self.rvs.$.el.find('.rvs-item-container'),
			stage: self.rvs.$.el.find('.rvs-item-stage').on('touchstart.rvs', {self: self}, self.onTouchStart),
			items: self.rvs.$.el.find('.rvs-item')
		};
		this.count = self.$.items.length;
		this.touched = false;
		this.start = [0,0];
		this.diff = [0,0];
		this.width = 0;
		this.height = 0;
	};

	FP.RVSliderItems.prototype.destroy = function(){
		this.$.stage.off('touchstart.rvs', self.onTouchStart)
			.off('touchmove.rvs', self.onTouchMove)
			.off('touchend.rvs', self.onTouchEnd);
		this.$.stage.css({width: '', transform: ''});
		this.$.items.css({width: '', left: ''}).removeClass('rvs-active');
	};

	FP.RVSliderItems.prototype.resize = function(){
		var self = this;
		self.width = self.$.container.width();
		self.height = self.$.container.height();
		self.$.items.each(function(i){
			$(this).css({
				'width': self.width,
				'left': i * self.width
			});
		});
		self.$.stage.css({
			width: self.width * self.count,
			transform: 'translateX(-'+(self.rvs.index * self.width)+'px)'
		});
	};

	FP.RVSliderItems.prototype.setActive = function(index){
		if (index >= 0 && index < this.count){
			this.$.stage.css('transform', 'translateX(-'+(index * this.width)+'px)');
			this.$.items.removeClass('rvs-active').eq(index).addClass('rvs-active');
		} else {
			this.$.stage.css('transform', 'translateX(-'+(this.rvs.index * this.width)+'px)');
		}
	};

	FP.RVSliderItems.prototype.onTouchStart = function(e){
		var self = e.data.self, touches = e.originalEvent.touches || e.touches;
		if (touches.length == self.rvs.o.swipe.touches){
			self.touched = true;
			self.start = [touches[0].pageX,touches[0].pageY];
			self.$.stage.on('touchmove.rvs', {self: self}, self.onTouchMove)
				.on('touchend.rvs', {self: self}, self.onTouchEnd);
		}
	};

	FP.RVSliderItems.prototype.onTouchMove = function(e){
		var self = e.data.self, touches = e.originalEvent.touches || e.touches;
		if (self.touched && touches.length == self.rvs.o.swipe.touches){
			self.diff = [self.start[0]-touches[0].pageX,self.start[1]-touches[0].pageY];
			if (Math.abs(self.diff[0]) > self.rvs.o.swipe.deadzone) e.preventDefault();
		}
	};

	FP.RVSliderItems.prototype.onTouchEnd = function(e){
		var self = e.data.self;
		self.$.stage.off('touchmove.rvs touchend.rvs');
		if (Math.abs(self.diff[0]) > self.width * self.rvs.o.swipe.items){
			if (self.diff[0] > 0){ // swipe left
				self.rvs.setActive(self.rvs.index+1);
			} else if (self.diff[0] < 0){ // swipe right
				self.rvs.setActive(self.rvs.index-1);
			}
		}
		self.diff = [0,0];
		self.start = [0,0];
		self.touched = false;
	};

})(jQuery, window.FooPlugins = window.FooPlugins || {});
(function($, FP){

	FP.RVSliderNav = function(rvs){
		if (!(this instanceof FP.RVSliderNav)) return new FP.RVSliderNav(rvs);
		this.rvs = rvs;
		var self = this;
		this.$ = {
			container: self.rvs.$.el.find('.rvs-nav-container'),
			stage: self.rvs.$.el.find('.rvs-nav-stage').on('touchstart.rvs', {self: self}, self.onTouchStart)
				.on('DOMMouseScroll.rvs mousewheel.rvs', {self: self}, self.onMouseWheel),
			items: self.rvs.$.el.find('.rvs-nav-item').on('click.rvs', {self: self}, self.onItemClick),
			prev: self.rvs.$.el.find('.rvs-nav-prev').on('click.rvs', {self: self}, self.onPrevClick),
			next: self.rvs.$.el.find('.rvs-nav-next').on('click.rvs', {self: self}, self.onNextClick)
		};
		this.horizontal = self.rvs.$.el.hasClass('rvs-horizontal');
		this.thumbPlay = self.rvs.$.el.hasClass('rvs-thumb-play');
		this.touchable = 'ontouchstart' in document.documentElement;
		this.count = self.$.items.length;
		this.touched = false;
		this.start = [0,0];
		this.diff = [0,0];
		this.height = 0;
		this.width = 0;
		this.visible = {
			max: 0,
			first: 0,
			last: 0
		};
		this.breakpoints = '[object Array]' === Object.prototype.toString.call(self.rvs.o.breakpoints) ? self.rvs.o.breakpoints : [ // number of items to display at various widths
			[320, 2], // Width less than 320 equals 2 items
			[480, 3], // W > 320 && W < 480 = 3 items
			[768, 4], // W > 480 && W < 768 = 4 items
			[992, 4], // W > 768 && W < 992 = 4 items
			[1200, 5] // Effectively anything greater than 992 will equal 5 items as this last value is used for anything larger.
		];
	};

	FP.RVSliderNav.prototype.destroy = function(){
		this.$.stage.off('touchstart.rvs', self.onTouchStart)
			.off('touchmove.rvs', self.onTouchMove)
			.off('touchend.rvs', self.onTouchEnd)
			.off('DOMMouseScroll.rvs mousewheel.rvs', self.onMouseWheel);
		this.$.items.off('click.rvs', self.onItemClick);
		this.$.prev.off('click.rvs', self.onPrevClick);
		this.$.next.off('click.rvs', self.onNextClick);
		this.$.stage.css({width: '', transform: ''});
		this.$.items.css({width: '', left: ''}).removeClass('rvs-active');
	};

	FP.RVSliderNav.prototype._maximum = function(){
		var ratio = 'devicePixelRatio' in window && typeof window.devicePixelRatio === 'number' ? window.devicePixelRatio : 1,
			ww = (window.innerWidth || document.documentElement.clientWidth || (document.body ? document.body.offsetWidth : 0)) / ratio,
			i = 0, len = this.breakpoints.length, current;
		this.breakpoints.sort(function(a,b){ return a[0] - b[0]; });
		for (; i < len; i++){
			if (this.breakpoints[i][0] > ww){
				current = this.breakpoints[i][1];
				break;
			}
		}
		if (!current) current = this.breakpoints[len - 1][1];
		return current;
	};

	FP.RVSliderNav.prototype.resize = function(){
		var self = this;
		if (self.horizontal){
			self.visible.max = self._maximum();
			self.width = Math.floor(self.rvs.items.width / self.visible.max) + 1;
			self.$.stage.css('width', self.width * self.count);
			self.$.items.each(function(i){
				$(this).css({
					'width': self.width,
					'left': i * self.width
				});
			});
		} else {
			self.height = self.$.items.first().outerHeight();
			self.visible.max = Math.ceil(self.rvs.items.height / self.height);
		}
		self.setVisible(self.visible.first);
	};

	FP.RVSliderNav.prototype.setVisible = function(index, last){
		index = index < 0 ? 0 : (index >= this.count ? this.count - 1 : index);
		if (last) index = index - (this.visible.max - 1);
		if (index >= 0 && index + (this.visible.max - 1) < this.count){
			var translate = this.horizontal ? 'translateX(-'+((index * this.width) + 1)+'px) translateY(-1px)' : 'translateX(0px) translateY(-'+((index * this.height) + 1)+'px)';
			this.$.stage.css('transform', translate); // +1 extra to hide border
			this.visible.first = index;
			this.visible.last = index + (this.visible.max - 1);
		}
		if (this.touchable || this.visible.first == 0) this.$.prev.detach();
		else if (this.$.prev.parent().length == 0) this.$.container.prepend(this.$.prev);

		if (this.touchable || this.visible.last == this.count - 1 || this.visible.max > this.count - 1) this.$.next.detach();
		else if (this.$.next.parent().length == 0) this.$.container.append(this.$.next);
	};

	FP.RVSliderNav.prototype.setActive = function(index){
		if (index >= 0 && index < this.count){
			this.$.items.removeClass('rvs-active').eq(index).addClass('rvs-active');
			if (index <= this.visible.first) this.setVisible(index - 1);
			else if (index >= this.visible.last) this.setVisible(index + 1, true);
		}
	};

	FP.RVSliderNav.prototype.onItemClick = function(e){
		e.preventDefault();
		var self = e.data.self, $this = $(this), $thumb = $this.find('.rvs-nav-item-thumb');
		self.rvs.setActive($this.index());
		if (self.thumbPlay && ($thumb.length && ($thumb.is(e.target) || $.contains($thumb[0], e.target)))){
			self.rvs.player.toggle();
		}
	};

	FP.RVSliderNav.prototype.onPrevClick = function(e){
		e.preventDefault();
		e.data.self.setVisible(e.data.self.visible.first - Math.floor(e.data.self.visible.max / 2));
	};

	FP.RVSliderNav.prototype.onNextClick = function(e){
		e.preventDefault();
		e.data.self.setVisible(e.data.self.visible.last + Math.floor(e.data.self.visible.max / 2), true);
	};

	FP.RVSliderNav.prototype.onMouseWheel = function(e){
		e.preventDefault();
		if (e.originalEvent.wheelDelta > 0 || e.originalEvent.detail < 0) e.data.self.setVisible(e.data.self.visible.first-1);
		else e.data.self.setVisible(e.data.self.visible.first+1);
	};

	FP.RVSliderNav.prototype.onTouchStart = function(e){
		var self = e.data.self, touches = e.originalEvent.touches || e.touches;
		if (touches.length == self.rvs.o.swipe.touches) {
			self.touched = true;
			self.start = [touches[0].pageX,touches[0].pageY];
			self.$.stage.on('touchmove.rvs', {self: self}, self.onTouchMove)
				.on('touchend.rvs', {self: self}, self.onTouchEnd);
		}
	};

	FP.RVSliderNav.prototype.onTouchMove = function(e){
		var self = e.data.self, touches = e.originalEvent.touches || e.touches;
		if (self.touched && touches.length == self.rvs.o.swipe.touches){
			self.diff = [self.start[0]-touches[0].pageX,self.start[1]-touches[0].pageY];
			if (!this.horizontal) e.preventDefault();
		}
	};

	FP.RVSliderNav.prototype.onTouchEnd = function(e){
		var self = e.data.self, adx = Math.abs(self.diff[0]), ady = Math.abs(self.diff[1]);
		self.$.stage.off('touchmove.rvs touchend.rvs');
		if (self.horizontal){
			if (adx > self.width * self.rvs.o.swipe.nav){
				if (self.diff[0] > 0){ // swipe left
					self.setVisible(self.visible.last + Math.ceil(adx/self.width), true);
				} else if (self.diff[0] < 0){ // swipe right
					self.setVisible(self.visible.first - Math.ceil(adx/self.width));
				}
			}
		} else {
			if (ady >= self.height * self.rvs.o.swipe.nav){
				if (self.diff[1] > 0){ // swipe up
					self.setVisible(self.visible.last + Math.ceil(ady/self.width), true);
				} else if (self.diff[1] < 0){ // swipe down
					self.setVisible(self.visible.first - Math.ceil(ady/self.width));
				}
			}
		}
		self.diff = [0,0];
		self.start = [0,0];
		self.touched = false;
	};

})(jQuery, window.FooPlugins = window.FooPlugins || {});
(function($, FP){

	FP.RVSliderVideoUrl = function(url){
		if (!(this instanceof FP.RVSliderVideoUrl)) return new FP.RVSliderVideoUrl(url);
		var parts = url.split('#');
		this.hash = parts.length == 2 ? '#'+parts[1] : '';
		parts = parts[0].split('?');
		this.url = parts[0];
		var match = this.url.match(/.*\/(.*)$/);
		this.id = match && match.length >= 2 ? match[1] : null;
		this.protocol = url.substring(0,5) == 'https' ? 'https:' : 'http:';
		this.params = [];
		var params = (parts.length == 2 ? parts[1] : '').split(/[&;]/g);
		for (var i = 0, len = params.length, pair; i < len; i++){
			pair = params[i].split('=');
			if (pair.length != 2) continue;
			this.params.push({key: decodeURIComponent(pair[0]), value: decodeURIComponent(pair[1])});
		}

		this.mimeTypes = { // list of supported mimeTypes and the regex used to test a url
			'video/youtube': /(www.)?youtube|youtu\.be/i,
			'video/vimeo': /(player.)?vimeo\.com/i,
			'video/wistia': /(.+)?(wistia\.(com|net)|wi\.st)\/.*/i,
			'video/daily': /(www.)?dailymotion\.com|dai\.ly/i,
			'video/mp4': /\.mp4/i,
			'video/webm': /\.webm/i,
			'video/wmv': /\.wmv/i,
			'video/ogg': /\.ogv/i
		};
		this.mimeType = null;
		for (var name in this.mimeTypes){
			if (this.mimeTypes.hasOwnProperty(name) && this.mimeTypes[name].test(url))
				this.mimeType = name;
		}

		if (this.mimeType == 'video/youtube'){
			this.id = /embed\//i.test(this.url)
				? this.url.split(/embed\//i)[1].split(/[?&]/)[0]
				: url.split(/v\/|v=|youtu\.be\//i)[1].split(/[?&]/)[0];
			this.url = this.protocol + '//www.youtube.com/embed/' + this.id;
			this.param('autoplay', '1');
			this.param('modestbranding', '1');
			this.param('rel', '0');
			this.param('wmode', 'transparent');
			this.param('showinfo', '0');
		} else if (this.mimeType == 'video/vimeo'){
			this.id = this.url.substr(this.url.lastIndexOf('/')+1);
			this.url = this.protocol + '//player.vimeo.com/video/' + this.id;
			this.param('autoplay', '1');
			this.param('badge', '0');
			this.param('portrait', '0');
		} else if (this.mimeType == 'video/wistia'){
			this.id = /embed\//i.test(this.url)
				? this.url.split(/embed\/.*?\//i)[1].split(/[?&]/)[0]
				: this.url.split(/medias\//)[1].split(/[?&]/)[0];
			var playlist = /playlists\//i.test(this.url);
			this.url = this.protocol + '//fast.wistia.net/embed/'+(playlist ? 'playlists' : 'iframe')+'/'+this.id;
			if (playlist) this.param('media_0_0[autoPlay]', '1');
			else this.param('autoPlay', '1');
			this.param('theme', '');
		} else if (this.mimeType == 'video/daily'){
			this.id = /\/video\//i.test(this.url)
				? this.url.split(/\/video\//i)[1].split(/[?&]/)[0].split(/[_]/)[0]
				: url.split(/dai\.ly/i)[1].split(/[?&]/)[0];
			this.url = this.protocol + '//www.dailymotion.com/embed/video/' + this.id;
			this.param('autoplay', '1');
			this.param('wmode', 'opaque');
			this.param('info', '0');
			this.param('logo', '0');
			this.param('related', '0');
		}
	};

	FP.RVSliderVideoUrl.prototype.param = function(key, value){
		var GET = typeof value === 'undefined', DELETE = typeof value === 'string' && value === '';
		for (var i = this.params.length; i-- > 0;) {
			if (this.params[i].key == key) {
				if (GET) return this.params[i].value;
				if (DELETE) this.params.splice(i, 1);
				else this.params[i].value = value;
				return;
			}
		}
		if (!GET && !DELETE) this.params.push({key: key, value: value});
	};

	FP.RVSliderVideoUrl.prototype.toString = function(){
		var params = this.params.length > 0 ? '?' : '';
		for (var i = 0, len = this.params.length; i < len; i++){
			if (i != 0) params += '&';
			params += encodeURIComponent(this.params[i].key) + '=' + encodeURIComponent(this.params[i].value);
		}
		return this.url + params + this.hash;
	};

})(jQuery, window.FooPlugins = window.FooPlugins || {});
(function($, FP){

	FP.RVSliderPlayer = function(rvs){
		if (!(this instanceof FP.RVSliderPlayer)) return new FP.RVSliderPlayer(rvs);
		var self = this;
		this.rvs = rvs;
		this.rvs.items.$.stage.on('click.rvs', '.rvs-play-video', {self: self}, self.onPlayClick);
		this.$ = {
			container: $('<div/>', {'class': 'rvs-player'}),
			close: $('<a/>', {'class': 'rvs-close'}).on('click.rvs', {self: self}, self.onCloseClick),
			iframe: null
		};
		this.$.close.appendTo(self.$.container);
		this.continuousPlay = self.rvs.$.el.hasClass('rvs-continuous-play');
		this.attached = false;
		this.mejs = new FP.RVSliderMediaElement(rvs, this);
	};

	FP.RVSliderPlayer.prototype.destroy = function(){
		this.rvs.items.$.stage.off('click.rvs', '.rvs-play-video', self.onPlayClick);
		this.rvs.items.$.items.add(this.rvs.nav.$.items).removeClass('rvs-video-active');
		this.$.close.off('click.rvs', self.onCloseClick);
		this.$.container.remove();
	};

	FP.RVSliderPlayer.prototype._parse = function(urls){
		if (typeof urls === 'string'){
			urls = urls.split(',');
			for (var i = 0, len = urls.length; i < len; i++){
				urls[i] = new FP.RVSliderVideoUrl($.trim(urls[i]));
			}
			return urls;
		}
		return [];
	};

	FP.RVSliderPlayer.prototype._play = function(url){
		this.$.player = $('<iframe/>', {
			src: url, frameborder: 'no',
			width: this.rvs.items.width, height: this.rvs.items.height,
			webkitallowfullscreen: true, mozallowfullscreen: true, allowfullscreen: true
		}).css({ width: '100%', height: '100%' });
		this.$.container.append(this.$.player).appendTo(this.rvs.items.$.items.filter('.rvs-active'));
	};

	FP.RVSliderPlayer.prototype.setActive = function(index){
		if (!this.continuousPlay && this.rvs.index != index && this.attached) this.close();
	};

	FP.RVSliderPlayer.prototype.play = function(urls, options){
		if (!urls.length) return;
		if (this.attached) this.close();
		if (this.mejs.handles(urls)){
			this.mejs.play(urls, options);
		} else {
			// the iframe method used to display YouTube and Vimeo only supports a single url so we only use the url at index 0
			this._play(urls[0]);
		}
		this.rvs.items.$.items.add(this.rvs.nav.$.items).filter('.rvs-active').addClass('rvs-video-active');
		this.attached = true;
	};

	FP.RVSliderPlayer.prototype.close = function(){
		if (!this.attached) return;
		this.$.close.detach();
		this.$.container.empty().detach();
		this.$.close.appendTo(this.$.container);
		this.rvs.items.$.items.add(this.rvs.nav.$.items).removeClass('rvs-video-active');
		this.attached = false;
	};

	FP.RVSliderPlayer.prototype.toggle = function(){
		var $active = this.rvs.items.$.items.filter('.rvs-active'), $play = $active.find('.rvs-play-video');
		if ($active.length && !$active.hasClass('rvs-video-active')){
			this.play(this._parse($play.attr('href')), $play.data('options') || {});
		} else {
			this.close();
		}
	};

	FP.RVSliderPlayer.prototype.onPlayClick = function(e){
		e.preventDefault();
		var $this = $(this), self = e.data.self;
		self.play(self._parse($this.attr('href')), $this.data('options') || {});
	};

	FP.RVSliderPlayer.prototype.onCloseClick = function(e){
		e.preventDefault();
		e.data.self.close();
	};

})(jQuery, window.FooPlugins = window.FooPlugins || {});
(function($, FP){

	FP.RVSliderMediaElement = function(rvs, player){
		if (!(this instanceof FP.RVSliderMediaElement)) return new FP.RVSliderMediaElement(rvs, player);
		this.rvs = rvs;
		this.player = player;
		this.enabled = 'MediaElementPlayer' in window && this.rvs.o.mejs.enabled;
	};

	FP.RVSliderMediaElement.prototype.handles = function(urls){
		for (var i = 0, len = urls.length; i < len; i++){
			if (this.enabled && !(
				!this.rvs.o.mejs.youtube && urls[i].mimeType === 'video/youtube'
				|| !this.rvs.o.mejs.vimeo && urls[i].mimeType === 'video/vimeo'
				|| urls[i].mimeType === 'video/wistia'
				|| urls[i].mimeType === 'video/daily'
				)) return true;
		}
		return false;
	};

	FP.RVSliderMediaElement.prototype.play = function(urls, options){
		this.player.$.player = $('<video/>', {
			width: this.rvs.items.width, height: this.rvs.items.height,
			controls: true, preload: 'none'
		}).css({ width: '100%', height: '100%' });

		for (var i = 0, len = urls.length; i < len; i++){
			if (this.enabled && !(!this.rvs.o.mejs.youtube && urls[i].mimeType === 'video/youtube' || !this.rvs.o.mejs.vimeo && urls[i].mimeType === 'video/vimeo' || urls[i].mimeType === 'video/wistia' || urls[i].mimeType === 'video/daily')){
				this.player.$.player.append($('<source/>',{ type: urls[i].mimeType, src: urls[i] }));
			}
		}

		if (this.player.$.player.find('source').length > 0){
			this.player.$.container.append(this.player.$.player).appendTo(this.rvs.items.$.items.filter('.rvs-active').addClass('rvs-video-active'));
			var self = this;
			this.player.$.player.mediaelementplayer($.extend(true, {}, this.o, options, {
				videoWidth: this.rvs.items.width,
				videoHeight: this.rvs.items.height,
				success: function(mediaElement, domObject){
					// the below is to enable MediaElement.js to autoplay any video once it is loaded
					function canplay(){
						mediaElement.play();
						mediaElement.removeEventListener('canplay', canplay, false);
					}
					function playing(){
						mediaElement.removeEventListener('canplay', canplay, false);
						mediaElement.removeEventListener('playing', playing, false);
					}
					mediaElement.addEventListener('canplay', canplay, false);
					mediaElement.addEventListener('playing', playing, false);
					mediaElement.load();
					mediaElement.play();
					// in case we have overridden a supplied function call it
					if ($.isFunction(options.success)) options.success(mediaElement, domObject);
				},
				error: function(err, a, b, c, d){
					console.log('The video ' + urls + ' is not supported.', err, a, b, c, d);
					self.player.close();
					// in case we have overridden a supplied function call it
					if ($.isFunction(options.error)) options.error(err);
				}
			}));
		}
	};

})(jQuery, window.FooPlugins = window.FooPlugins || {});