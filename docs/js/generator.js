(function($, FP){

	function Url(url){
		if (!(this instanceof Url)) return new Url(url);
		var parts = url.split('#');
		this.hash = parts.length == 2 ? '#'+parts[1] : '';
		parts = parts[0].split('?');
		this.url = parts[0];
		this.protocol = url.substring(0,5) == 'https' ? 'https:' : 'http:';
		this.params = [];
		var params = (parts.length == 2 ? parts[1] : '').split(/[&;]/g);
		for (var i = 0, len = params.length, pair; i < len; i++){
			pair = params[i].split('=');
			if (pair.length != 2) continue;
			this.params.push({key: decodeURIComponent(pair[0]), value: decodeURIComponent(pair[1])});
		}
	}

	Url.prototype.param = function(key, value){
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

	Url.prototype.toString = function(){
		var params = this.params.length > 0 ? '?' : '';
		for (var i = 0, len = this.params.length; i < len; i++){
			if (i != 0) params += '&';
			params += encodeURIComponent(this.params[i].key) + '=' + encodeURIComponent(this.params[i].value);
		}
		return this.url + params + this.hash;
	};

	function Generator(){
		if (!(this instanceof Generator)) return new Generator();
		this.regex = {
			vimeo: /(player\.)?vimeo\.com/i,
			youtube: /(www\.)?youtube|youtu\.be/i,
			wistia: /(.+)?(wistia\.(com|net)|wi\.st)\/.*/i,
			daily: /(www.)?dailymotion\.com|dai\.ly/i,
			supported: /.\.mp4|.\.webm|.\.wmv|.\.ogv|.\.flv/i
		};
		this.templates = {
			html: Handlebars.compile($.trim($('#rvs-html-template').html())),
			css: Handlebars.compile($.trim($('#rvs-css-template').html())),
			empty: Handlebars.compile($.trim($('#rvs-empty-template').html())),
			remove: Handlebars.compile($.trim($('#rvs-remove-template').html()))
		};
		this.yt_thumbs = ['default','medium','high','standard','maxres'];
		this.videos = [];
		this._ = {
			video: {
				url: $('#video-url').on('focus', {self: this}, this.onVideoUrlFocus)
					.on('change keypress keyup paste cut', {self: this}, this.onVideoUrlChange),
				add: $('#video-add').prop('disabled', true).on('click', {self: this}, this.onVideoAddClick),
				group: $('#video-group'),
				custom: {
					options: $('.custom-video'),
					title: $('#custom-title'),
					credits: $('#custom-credits'),
					thumb_small: $('#custom-thumbnail'),
					thumb_large: $('#custom-background')
				}
			},
			layout: $('[name="layout"]').on('change', {self: this}, this.onOptionChange),
			large_thumbs: $('#large_thumbs').on('change', {self: this}, this.onOptionChange),
			hide_overlay: $('#hide_overlay').on('change', {self: this}, this.onOptionChange),
			hide_thumb: $('#hide_thumb').on('change', {self: this}, this.onOptionChange),
			hide_credits: $('#hide_credits').on('change', {self: this}, this.onOptionChange),
			use_viewport: $('#use_viewport').on('change', {self: this}, this.onOptionChange),
			thumb_play: $('#thumb_play').on('change', {self: this}, this.onOptionChange),
			continuous_play: $('#continuous_play').on('change', {self: this}, this.onOptionChange),
			theme: {
				radios: $('[name="theme"]').on('change', {self: this}, this.onOptionChange),
				custom: {
					options: $('.custom-theme'),
					text: $('#theme-text-color').on('change', {self: this}, this.onOptionChange),
					muted: $('#theme-muted-color').on('change', {self: this}, this.onOptionChange),
					background: $('#theme-background-color').on('change', {self: this}, this.onOptionChange),
					item: {
						divider: $('#theme-border-color').on('change', {self: this}, this.onOptionChange),
						hover_background: $('#theme-hover-color').on('change', {self: this}, this.onOptionChange)
					}
				}
			},
			highlight: {
				radios: $('[name="highlight"]').on('change', {self: this}, this.onOptionChange),
				custom: {
					options: $('.custom-highlight'),
					text: $('#highlight-text-color').on('change', {self: this}, this.onOptionChange),
					muted: $('#highlight-muted-color').on('change', {self: this}, this.onOptionChange),
					background: $('#highlight-background-color').on('change', {self: this}, this.onOptionChange)
				}
			},
			play_icon: $('[name="play_icon"]').on('change', {self: this}, this.onOptionChange),
			show_play_on_hover: $('#show_play_on_hover').on('change', {self: this}, this.onOptionChange),
			output: {
				preview: $('#output-preview'),
				html: $('#output-html'),
				css: $('#output-css'),
				css_container: $('.example.css'),
				style: $()
			},
			advanced: {
				checkbox: $('#advanced').on('change', {self: this}, this.onOptionChange),
				options: $('.advanced-option')
			}
		};
		this.update();
	}

	Generator.prototype.update = function(){
		// cleanup any current instances of the plugin in the preview
		var $rvs = this._.output.preview.find('.rvs-container'), rvs = $rvs.data('__RVSlider__');
		if ($rvs.length && rvs instanceof FP.RVSlider){
			$rvs.find('.rvs-remove').remove();
			rvs.destroy();
		}
		// remove the live style element if one was used for custom styles
		if (this._.output.style.length > 0){
			this._.output.style.remove();
			this._.output.style = $();
		}

		// handle the generator UI state
		var html_ctx = {
				advanced: this._.advanced.checkbox.prop('checked'),
				layout: this._.layout.filter(':checked').val(),
				large_thumbs: this._.large_thumbs.prop('checked'),
				hide_overlay: this._.hide_overlay.prop('checked'),
				hide_thumb: this._.hide_thumb.prop('checked'),
				hide_credits: this._.hide_credits.prop('checked'),
				use_viewport: this._.use_viewport.prop('checked'),
				thumb_play: this._.thumb_play.prop('checked'),
				continuous_play: this._.continuous_play.prop('checked'),
				theme: this._.theme.radios.filter(':checked').val(),
				highlight: this._.highlight.radios.filter(':checked').val(),
				play_icon: this._.play_icon.filter(':checked').val(),
				show_play_on_hover: this._.show_play_on_hover.prop('checked') ? this._.show_play_on_hover.val() : null,
				videos: JSON.parse(JSON.stringify(this.videos))
			},
			css_ctx = {
				theme: {
					enabled: html_ctx.theme == 'rvs-custom',
					text: this._.theme.custom.text.val(),
					muted: this._.theme.custom.muted.val(),
					background: this._.theme.custom.background.val(),
					item: {
						divider: this._.theme.custom.item.divider.val(),
						hover_background: this._.theme.custom.item.hover_background.val()
					}
				},
				highlight: {
					enabled: html_ctx.highlight == 'rvs-custom-highlight',
					text: this._.highlight.custom.text.val(),
					muted: this._.highlight.custom.muted.val(),
					background: this._.highlight.custom.background.val()
				}
			};
		if (html_ctx.advanced) this._.advanced.options.removeClass('hide');
		else this._.advanced.options.addClass('hide');

		if (html_ctx.advanced && (css_ctx.theme.enabled || css_ctx.highlight.enabled)){
			var css = this.templates.css(css_ctx);
			this._.output.style = $('<style>'+css+'</style>').appendTo('head');
			this._.output.css.text('<style>\n'+css+'</style>');
			this._.output.css_container.removeClass('hide');
			Prism.highlightElement(this._.output.css.get(0));
			if (css_ctx.theme.enabled) this._.theme.custom.options.removeClass('hide');
			if (css_ctx.highlight.enabled) this._.highlight.custom.options.removeClass('hide');
		} else {
			this._.theme.custom.options.addClass('hide');
			this._.highlight.custom.options.addClass('hide');
			this._.output.css_container.addClass('hide');
			this._.output.css.text('');
			if (css_ctx.highlight.enabled) this._.highlight.radios.first().prop('checked', true);
			if (css_ctx.theme.enabled) this._.theme.radios.first().prop('checked', true);
		}

		var html = this.templates.html(html_ctx);
		this._.output.preview.html(html);
		this._.output.html.text(html);
		Prism.highlightElement(this._.output.html.get(0));

		// find the new preview and append our custom generator elements prior to initializing the plugin
		this._.output.preview.find('.rvs-container')
			.append($(this.templates.empty()).on('click', '.btn[data-videos]', {self: this}, this.onExampleVideosClick))
			.find('.rvs-nav-item')
			.append($(this.templates.remove()).on('click', {self: this}, this.onVideoRemoveClick))
			.end()
			.rvslider();
	};

	Generator.prototype.fetch = function(info){
		var self = this, video = {url: info.url, title: false, credits: null, thumb_small: null, thumb_large: null};
		return $.Deferred(function(d){
			if (info.type == 'custom'){
				video.title = self._.video.custom.title.val();
				video.credits = self._.video.custom.credits.val();
				video.thumb_small = self._.video.custom.thumb_small.val();
				video.thumb_large = self._.video.custom.thumb_large.val();
				d.resolve(video);
			} else {
				// IE9 fails without even trying unless dataType is set to JSONP so the $.get or $.getJSON shortcuts are unavailable
				$.ajax({url: info.api_url, type: 'GET', dataType: 'jsonp'}).then(function(response){
					var success = false, tmp;
					if (info.type == 'vimeo' && response.length){
						tmp = response[0];
						video.title = tmp.title;
						video.credits = tmp.user_name;
						video.thumb_small = tmp.thumbnail_small;
						video.thumb_large = tmp.thumbnail_large;
						success = true;
					} else if (info.type == 'youtube' && response.items && response.items.length){
						tmp = response.items[0].snippet;
						video.title = tmp.title;
						video.credits = tmp.channelTitle;
						video.thumb_small = self.yt_thumb(tmp);
						video.thumb_large = self.yt_thumb(tmp, true);
						success = true;
					} else if (info.type == 'wistia' && response){
						tmp = response;
						tmp.thumb_small = new Url(tmp.thumbnail_url);
						tmp.thumb_small.param('image_crop_resized', '100x60');
						tmp.thumb_large = new Url(tmp.thumbnail_url);
						tmp.thumb_large.param('image_crop_resized', '800x480');
						video.title = tmp.title;
						video.credits = tmp.provider_name;
						video.thumb_small = tmp.thumb_small.toString();
						video.thumb_large = tmp.thumb_large.toString();
						success = true;
					} else if (info.type == 'daily' && response){
						video.title = response.title;
						video.credits = response.author_name;
						video.thumb_small = response.thumbnail_url;
						video.thumb_large = response.thumbnail_url;
						success = true;
					}
					if (success){
						d.resolve(video);
					} else {
						d.reject(new Error('Unexpected response from '+info.type+' api.'));
					}
				}, d.reject);
			}
		});
	};

	Generator.prototype.parse = function(url){
		url = url.substring(0, 2) == '//' ? location.protocol + url : url;
		var result = {url: url, id: false, type: null, api_url: null};
		if (this.regex.vimeo.test(url)){
			result.id = url.substr(url.lastIndexOf('/')+1);
			result.type = 'vimeo';
			result.api_url = 'http://vimeo.com/api/v2/video/'+result.id+'.json';
		} else if (this.regex.youtube.test(url)){
			result.id = /embed\//i.test(url)
				? url.split(/embed\//)[1].split('"')[0]
				: url.split(/v\/|v=|youtu\.be\//)[1].split(/[?&]/)[0];
			result.type = 'youtube';
			result.api_url = 'https://www.googleapis.com/youtube/v3/videos?id=' + result.id + '&fields=items(snippet(title,channelTitle,thumbnails))&part=snippet&key=AIzaSyBMT07ftYs1dGnguTdI8I_fXazRyrnZcEA';
		} else if (this.regex.wistia.test(url)){
			result.id = /embed\//i.test(url)
				? url.split(/embed\/.*?\//i)[1].split(/[?&]/)[0]
				: url.split(/medias\//)[1].split(/[?&]/)[0];
			result.type = 'wistia';
			result.api_url = 'http://fast.wistia.net/oembed.json?url=' + result.url;
		} else if (this.regex.daily.test(url)){
			result.id = /\/video\//i.test(url)
				? url.split(/\/video\//i)[1].split(/[?&]/)[0].split(/[_]/)[0]
				: url.split(/dai\.ly/i)[1].split(/[?&]/)[0];
			result.type = 'daily';
			result.api_url = 'http://www.dailymotion.com/services/oembed?url=' + result.url;
		} else if (this.regex.supported.test(url)){
			result.id = result.type = 'custom';
		}
		return result;
	};

	Generator.prototype.addVideo = function(urlOrVideo, noUpdate){
		var has_url = typeof urlOrVideo === 'object' && 'url' in urlOrVideo && typeof urlOrVideo['url'] === 'string';
		if (has_url
				&& 'title' in urlOrVideo
				&& 'credits' in urlOrVideo
				&& ('thumb_small' in urlOrVideo || 'thumbSmall' in urlOrVideo)
				&& ('thumb_large' in urlOrVideo || 'thumbLarge' in urlOrVideo)){
			if (!('thumb_small' in urlOrVideo)) urlOrVideo.thumb_small = urlOrVideo.thumbSmall;
			if (!('thumb_large' in urlOrVideo)) urlOrVideo.thumb_large = urlOrVideo.thumbLarge;
			this.videos.push(urlOrVideo);
			if (!noUpdate) this.update();
		} else if (typeof urlOrVideo === 'string' || has_url){
			var self = this, result = this.parse(has_url ? urlOrVideo.url : urlOrVideo);
			if (result.id){
				return self.fetch(result).then(function(video){
					self.videos.push(video);
					if (!noUpdate) self.update();
				},function(err){
					console.log('Generator Error: ', err);
				});
			}
		}
		return $.when();
	};

	Generator.prototype.removeVideo = function(index){
		if (index >= 0 && index < this.videos.length){
			this.videos.splice(index, 1);
			this.update();
		}
	};

	Generator.prototype.removeAll = function(){
		this.videos = [];
		this.update();
	};

	Generator.prototype.yt_thumb = function(data, largest){
		var test = JSON.parse(JSON.stringify(this.yt_thumbs)), thumbs = data.thumbnails;
		if (largest) test.reverse();
		for (var i = 0, len = test.length; i < len; i++){
			if (thumbs.hasOwnProperty(test[i])) return thumbs[test[i]].url;
		}
		return '';
	};

	Generator.prototype.onOptionChange = function(e){
		var self = e.data.self;
		if (self.__otimer__) clearTimeout(self.__otimer__);
		self.__otimer__ = setTimeout(function(){
			self.__otimer__ = null;
			self.update();
		}, 10);
	};

	Generator.prototype.onExampleVideosClick = function(e){
		e.preventDefault();
		var self = e.data.self, videos = $(this).data('videos'), wait = [];
		for (var i = 0, len = videos.length; i < len; i++){
			wait.push(self.addVideo(videos[i], true));
		}
		$.when.apply($, wait).always(function(){
			self.update();
		});
	};

	Generator.prototype.onVideoUrlChange = function(e){
		var self = e.data.self;
		if (self.__ctimer__) clearTimeout(self.__ctimer__);
		self.__ctimer__ = setTimeout(function(){
			self.__ctimer__ = null;
			var val = self._.video.url.val();
			if (self.regex.vimeo.test(val)
				|| self.regex.youtube.test(val)
				|| self.regex.wistia.test(val)
				|| self.regex.daily.test(val)
				|| self.regex.supported.test(val)){
				self._.video.add.prop('disabled', false);
				if (self.regex.supported.test(val)){
					self._.video.custom.options.removeClass('hide');
				} else {
					self._.video.custom.options.addClass('hide');
				}
			} else {
				self._.video.add.prop('disabled', true);
				self._.video.custom.options.addClass('hide');
			}
		}, 10);
	};

	Generator.prototype.onVideoUrlFocus = function(e){
		e.data.self._.video.group.removeClass('has-error');
	};

	Generator.prototype.onVideoAddClick = function(e){
		e.preventDefault();
		var self = e.data.self, url = self._.video.url.val();
		self.addVideo(url).then(function(){
			self._.video.url.val('');
			self._.video.add.prop('disabled', true);
			self._.video.custom.options.addClass('hide');
			self._.video.custom.title.val('');
			self._.video.custom.credits.val('');
			self._.video.custom.thumb_large.val('');
			self._.video.custom.thumb_small.val('');
		}, function(){
			self._.video.group.addClass('has-error');
		});
	};

	Generator.prototype.onVideoRemoveClick = function(e){
		e.preventDefault();
		e.data.self.removeVideo($(this).closest('.rvs-nav-item').index());
	};

	$(function(){
		window.gen = new Generator();
		// any buttons with a url when clicked will add the url to the preview
		$('button[data-url]').on('click', function(e){
			e.preventDefault();
			window.gen.addVideo($(this).data());
		});
		$('#remove-all-videos').on('click', function(e){
			e.preventDefault();
			window.gen.removeAll();
		});
		// setup the spectrum color pickers
		$('.color').spectrum({
			showInitial: true,
			showInput: true,
			preferredFormat: "hex",
			showPalette: true,
			localStorageKey: "spectrum.generator",
			maxSelectionSize: 4,
			palette: [
				['#FFFFFF','#F9F9F9','#E2E2E2','#767676'],
				['#333333','#2E2E2E','#151515','#000000'],
				['#7816D6','#0087be','#02874A','#FF8E31'],
				['#F12B24']
			]
		});
	});

})(jQuery, window.FooPlugins = window.FooPlugins || {});