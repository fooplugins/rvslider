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