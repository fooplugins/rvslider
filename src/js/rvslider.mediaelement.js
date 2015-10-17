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