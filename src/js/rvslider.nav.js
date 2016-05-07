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
	};

	FP.RVSliderNav.prototype.destroy = function(){
		this.$.stage.off('touchstart.rvs', this.onTouchStart)
			.off('touchmove.rvs', this.onTouchMove)
			.off('touchend.rvs', this.onTouchEnd)
			.off('DOMMouseScroll.rvs mousewheel.rvs', this.onMouseWheel);
		this.$.items.off('click.rvs', this.onItemClick);
		this.$.prev.off('click.rvs', this.onPrevClick);
		this.$.next.off('click.rvs', this.onNextClick);
		this.$.stage.css({width: '', transform: ''});
		this.$.items.css({width: '', left: ''}).removeClass('rvs-active');
	};

	FP.RVSliderNav.prototype.resize = function(){
		var self = this;
		if (self.horizontal){
			self.visible.max = self.rvs.breakpoint[2];
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
		var self = e.data.self, index;
		if (self.count > self.visible.max){
			if ((e.originalEvent.wheelDelta > 0 || e.originalEvent.detail < 0) && self.visible.first !== 0) index = self.visible.first-1;
			else if ((e.originalEvent.wheelDelta < 0 || e.originalEvent.detail < 0) && self.visible.last !== self.count - 1) index = self.visible.first+1;
			if (typeof index === 'number' && !isNaN(index)){
				e.preventDefault();
				self.setVisible(index);
			}
		}
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