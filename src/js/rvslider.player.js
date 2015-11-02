(function($, FP){

	FP.RVSliderPlayer = function(rvs){
		if (!(this instanceof FP.RVSliderPlayer)) return new FP.RVSliderPlayer(rvs);
		var self = this;
		this.rvs = rvs;
		this.rvs.items.$.stage.on('click.rvs', '.rvs-play-video', {self: self}, self.onPlayClick);
		this.$ = {
			container: $('<div/>', {'class': 'rvs-player'}),
			close: $('<a/>', {'class': 'rvs-close'}).on('click.rvs', {self: self}, self.onCloseClick),
			player: null
		};
		this.$.close.appendTo(self.$.container);
		this.continuousPlay = self.rvs.$.el.hasClass('rvs-continuous-play');
		this.attached = false;
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

	FP.RVSliderPlayer.prototype._error = function(){
		if (this.$.player instanceof jQuery) this.$.player.remove();
		this.$.player = $('<div/>', {'class': 'rvs-player-error'}).append($('<span/>', {'class': 'rvs-error-icon'}));
		this.$.container.append(this.$.player).appendTo(this.rvs.items.$.items.filter('.rvs-active'));
		this.$.close.detach();
		this.$.container.empty().append(this.$.player);
		this.$.close.appendTo(this.$.container);
	};

	FP.RVSliderPlayer.prototype._direct = function(urls){
		this.$.player = $('<video/>', {
			controls: true,
			preload: false
		}).css({ width: '100%', height: '100%' });

		var self = this, player = this.$.player[0], srcs = [];
		function onerror(){
			for (var i = 0, len = srcs.length; i < len; i++){
				srcs[0].removeEventListener('error', onerror, false);
			}
			player.removeEventListener('error', onerror, false);
			player.removeEventListener('loadeddata', onloadeddata, false);
			self._error();
		}

		for (var i = 0, len = urls.length, $src; i < len; i++){
			if (urls[i].isDirectLink){
				$src = $('<source/>', { type: urls[i].mimeType, src: urls[i].toString() });
				$src[0].addEventListener('error', onerror, false);
				srcs.push($src[0]);
				this.$.player.append($src);
			}
		}

		function onloadeddata(){
			for (var i = 0, len = srcs.length; i < len; i++){
				srcs[0].removeEventListener('error', onerror, false);
			}
			player.removeEventListener('loadeddata', onloadeddata, false);
			player.removeEventListener('error', onerror, false);
			player.play();
		}
		player.addEventListener('error', onerror, false);
		player.addEventListener('loadeddata', onloadeddata, false);

		this.$.container.append(this.$.player).appendTo(this.rvs.items.$.items.filter('.rvs-active'));

		if (player.readyState < 4) player.load();
		else onloadeddata();
	};

	FP.RVSliderPlayer.prototype._embed = function(url){
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

	FP.RVSliderPlayer.prototype.isDirectLink = function(urls){
		if (!document.addEventListener) return false;
		for (var i = 0, len = urls.length; i < len; i++){
			if (urls[i].isDirectLink && urls[i].isBrowserSupported) return true;
		}
		return false;
	};

	FP.RVSliderPlayer.prototype.play = function(urls, options){
		if (!urls.length) return;
		if (this.attached) this.close();
		if (this.isDirectLink(urls)){
			this._direct(urls, options);
		} else if (urls.length > 0 && !urls[0].isDirectLink) {
			// the iframe method used to display YouTube and Vimeo only supports a single url so we only use the url at index 0
			this._embed(urls[0]);
		} else {
			this._error();
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