(function($, FP){

	FP.RVSliderVideoUrl = function(url){
		if (!(this instanceof FP.RVSliderVideoUrl)) return new FP.RVSliderVideoUrl(url);
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

		this.mimeTypes = { // list of supported mimeTypes and the regex used to test a url
			'video/youtube': /(www.)?youtube|youtu\.be/i,
			'video/vimeo': /(player.)?vimeo\.com/i,
			'video/wistia': /(.+)?(wistia\.(com|net)|wi\.st)\/.*/i,
			'video/mp4': /\.mp4/i,
			'video/webm': /\.webm/i,
			'video/wmv': /\.wmv/i,
			'video/ogg': /\.ogv/i,
			'video/flv': /\.flv/i
		};
		this.mimeType = null;
		for (var name in this.mimeTypes){
			if (this.mimeTypes.hasOwnProperty(name) && this.mimeTypes[name].test(url))
				this.mimeType = name;
		}

		var id;
		if (this.mimeType == 'video/youtube' || this.mimeType == 'video/vimeo'){
			this.param('autoplay', '1');
			if (this.mimeType == 'video/youtube'){
				id = /embed\//i.test(this.url)
					? this.url.split(/embed\//i)[1].split(/[?&]/)[0]
					: url.split(/v\/|v=|youtu\.be\//i)[1].split(/[?&]/)[0];
				this.url = this.protocol + '//www.youtube.com/embed/' + id;
				this.param('modestbranding', '1');
				this.param('rel', '0');
				this.param('wmode', 'transparent');
				this.param('showinfo', '0');
			}
			if (this.mimeType == 'video/vimeo'){
				id = this.url.substr(this.url.lastIndexOf('/')+1);
				this.url = this.protocol + '//player.vimeo.com/video/' + id;
				this.param('badge', '0');
				this.param('portrait', '0');
			}
		}
		if (this.mimeType == 'video/wistia'){
			id = /embed\//i.test(this.url) ? this.url.split(/embed\/.*?\//i)[1].split(/[?&]/)[0]
				: this.url.split(/medias\//)[1].split(/[?&]/)[0];

			var playlist = /playlists\//i.test(this.url);
			this.url = this.protocol + '//fast.wistia.net/embed/'+(playlist ? 'playlists' : 'iframe')+'/'+id;
			if (playlist) this.param('media_0_0[autoPlay]', '1');
			else this.param('autoPlay', '1');
			this.param('theme', '');
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