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
		this.$.stage.off('touchstart.rvs', this.onTouchStart)
			.off('touchmove.rvs', this.onTouchMove)
			.off('touchend.rvs', this.onTouchEnd);
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

	var $elem = $('<div/>').css({position: 'absolute',top: -9999,left: -9999,visibility: 'hidden'}),
		matrix = function(index, width){
			$elem.appendTo('body').css('transform', 'translateX(-'+(index * width)+'px)');
			return $elem.css('transform');
		};

	FP.RVSliderItems.prototype.setActive = function(index){
		if (index >= 0 && index < this.count){
			var self = this, before = this.$.stage.css('transform'), after = matrix(index, this.width);
			this.$.stage.one('transitionend', function(){
				self.$.items.removeClass('rvs-active').eq(index).addClass('rvs-active');
			}).css('transform', 'translateX(-'+(index * this.width)+'px)');
			if (!FP.RVSlider.supportsTransitions || before === after){
				this.$.stage.trigger('transitionend');
			}
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