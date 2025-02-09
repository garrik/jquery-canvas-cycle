/*!
 * jQuery Canvas Cycle Plugin
 * Examples and documentation at: http://www.brokenseal.it/it/blog/2009/10/19/jquery-canvas-cycle-plugin/
 * Copyright (c) 2007-2009 Davide Callegari
 * Version: 0.2 (2009-09-18)
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 * Requires: jQuery v1.2.6 or later
 *
 * Inspired by:
 *	1) M. Alsup http://jquery.malsup.com/cycle/
 *
 */
(function($) {
	var isWindowLoaded= false;
	$(window).load(function(){
		isWindowLoaded= true;
	});
	
	$.fn.canvasCycle = function(options) {
		if(!$('<canvas> </canvas>')[0].getContext) {
			return this;
		}
		
		return this.each(function() {
			var _this= $(this);
			if(_this.find('.canvas_cycle').length) {
				_this.find('.canvas_cycle').remove();
			}
			_this.width(_this.find('img:first').width());
			_this.height(_this.find('img:first').height());
			
			var opts = handleArguments(_this, options),
				context= $.fn.extend(opts, {
					max_width: _this.width(),
					max_height: _this.height(),
					width: {
						index: $(this).width(),
						next_slide: $(this).width()
					},
					height: {
						index: $(this).height(),
						next_slide: $(this).height()
					},
					items: $(this).find('img'),
					canvas_context: opts.canvas[0].getContext('2d'),
					fx: $.fn.canvasCycle.fx[opts.fx],
					next_slide: opts.index,
					timeout_id: null,
					interval_id: null,
					invert: false,
					firstRound: true
				});
			
			if(context.items.length < 2) {
				return this;
			}
			_this.children(':not(canvas)').hide();
			
			var loader_opacity= 100,
				inverter= 1,
				loader_step= 5,
				loader_interval= setInterval(function(){
					var opacity= 255 * loader_opacity / 100;
					context.canvas_context.fillStyle= "rgb(" +opacity+ "," +opacity+ "," +opacity+ ")";
					context.canvas_context.fillText(context.loader_text, (context.max_width / 2) - (context.canvas_context.measureText(context.loader_text).width / 2), 15);
					
					loader_opacity= loader_opacity - inverter * loader_step;
					if(loader_opacity <= 0) {
						inverter= -1;
					}
					else if(loader_opacity >= 100){
						inverter= 1;
					}
				}, 20);
			
			var load_canvas_cycle= function(){
				context.canvas.bind('canvas_cycle.start', function(){
					if(!context.stretch) {
						context.width= {
							index: context.items[context.index].width,
							next_slide: context.items[context.next_slide].width
						}
						context.height= {
							index: context.items[context.index].height,
							next_slide: context.items[context.next_slide].height
						}
					}
					
					var cycle_start= function(effect){
						if (!$.isFunction(effect)) {
							effect = context.fx;
						}
						if($.isFunction(context.before)) {
							context.before();
						}
						effect.call(_this, context);
						if($.isFunction(context.after)) {
							context.after();
						}
					};
					if(!context.firstRound) {
						context.timeout_id= setTimeout(cycle_start, context.timeout);
						_this.children(':visible:not(canvas)').hide();
					}
					else {
						cycle_start($.fn.canvasCycle.fx.noEffect);
					}
				}).bind('canvas_cycle.next', function(){
					if($.isFunction(context.end)) {
						context.end();
					}
					
					if (context.firstRound) {
						context.firstRound= false;
					}
					context.index= context.next_slide;
					context.next_slide++;
					// arithmetic clock
					context.next_slide %= context.items.length;
					context.canvas.trigger('canvas_cycle.start');
				}).bind('canvas_cycle.previous', function(){
					if($.isFunction(context.end)) {
						context.end();
					}
					
					if (context.firstRound) {
						context.firstRound= false;
					}
					context.index= context.next_slide;
					// counter-clockwise arithmetic clock
					context.next_slide = (context.next_slide + (context.items.length - 1)) % context.items.length;
					context.canvas.trigger('canvas_cycle.start');
				}).bind('canvas_cycle.stop', function(){
					log('stop!!');
				});
				
				if(loader_interval) {
					context.canvas_context.clearRect(0, 0, context.max_width, context.max_height);
					clearInterval(loader_interval);
				}
				context.canvas.trigger('canvas_cycle.start');
			}
			
			if(isWindowLoaded) {
				load_canvas_cycle();
			}
			else {
				$(window).load(load_canvas_cycle);
			}
		});
	};
	function log(string) {
		if (window.console && window.console.log) {
			window.console.log('[CANVAS CYCLE] : ' + string);
		}
	}
	function handleArguments(_this, opts) {
		opts= $.extend({}, $.fn.canvasCycle.defaults, opts);
		opts.no_canvas= opts.no_canvas.constructor === Object ? opts.no_canvas.html() : opts.no_canvas;
		opts.canvas= opts.canvas || $('<canvas>' + opts.no_canvas + '</canvas>')
			.attr('width', _this.width())
			.attr('height', _this.height())
			.appendTo(_this);
		
		opts.canvas.addClass('canvas_cycle');
		return opts;
	}
	
	$.fn.canvasCycle.fx = {
		noEffect: function(context){
			context.canvas_context.clearRect(0, 0, context.max_width, context.max_height);
			context.canvas_context.drawImage(context.items[context.index], 0, 0, context.width.index, context.height.index);
			context.canvas.trigger('canvas_cycle.next');
		},
		fade: function(context){
			var _this= this,
				opacity_step= 1,
				opacity= 100 - opacity_step,
				speed= context.speed / (opacity / opacity_step);
			
			context.interval_id= setInterval(function(){
					context.canvas_context.clearRect(0, 0, context.max_width, context.max_height);
					context.canvas_context.globalAlpha= (opacity) / 100;
					context.canvas_context.drawImage(context.items[context.index], 0, 0, context.width.index, context.height.index);
					context.canvas_context.globalAlpha= (100 - opacity) / 100;
					context.canvas_context.drawImage(context.items[context.next_slide], 0, 0, context.width.next_slide, context.height.next_slide);
					
					if(!opacity){
						clearInterval(context.interval_id);
						context.canvas.trigger('canvas_cycle.next');
					}
					opacity-= opacity_step;
				}, speed);
		},
		scroll: function(context){
			var _this= this,
				axis= 0,
				dimension= {x: context.width.index, y: context.height.index}[context.axis],
				inverter= context.invert ? -1: 1,
				speed= context.speed / (dimension / context.step);
			
			context.interval_id= setInterval(function(){
					var x_first= {x: axis* inverter, y: 0}[context.axis],
						y_first= {x: 0, y: axis * inverter}[context.axis],
						x_next= {x: (context.width.index + axis) * inverter, y: 0}[context.axis],
						y_next= {x: 0, y: (context.height.next_slide + axis) * inverter}[context.axis];
					
					if(!context.stretch) {
						context.canvas_context.clearRect(0, 0, context.max_width, context.max_height);
					}
					context.canvas_context.drawImage(context.items[context.index], x_first, y_first, context.width.index, context.height.index);
					context.canvas_context.drawImage(context.items[context.next_slide], x_next, y_next, context.width.next_slide, context.height.next_slide);
					
					axis-= context.step;
					if(dimension <= Math.abs(axis)){
						if(!context.stretch) {
							context.canvas_context.clearRect(0, 0, context.max_width, context.max_height);
						}
						context.canvas_context.drawImage(context.items[context.next_slide], 0, 0, context.width.next_slide, context.height.next_slide);
						clearInterval(context.interval_id);
						context.canvas.trigger('canvas_cycle.next');
					}
				}, speed);
		},
		scrollLeft: function(context){
			context.axis= 'x';
			return $.fn.canvasCycle.fx.scroll.call(this, context);
		},
		scrollRight: function(context){
			context.invert= true;
			context.axis= 'x';
			return $.fn.canvasCycle.fx.scroll.call(this, context);
		},
		scrollDown: function(context){
			context.invert= true;
			context.axis= 'y';
			return $.fn.canvasCycle.fx.scroll.call(this, context);
		},
		scrollUp: function(context){
			context.axis= 'y';
			return $.fn.canvasCycle.fx.scroll.call(this, context);
		},
		cover: function(context){
			var _this= this,
				axis= 0,
				inverter= context.invert ? -1: 1,
				dimension= {x: context.max_width, y: context.max_height}[context.axis],
				speed= context.speed / (dimension / context.step);
			
			context.interval_id= setInterval(function(){
				var x= {x: (dimension + axis) * inverter, y: 0}[context.axis],
					y= {x: 0, y: (dimension + axis) * inverter}[context.axis];
				
				if(!context.stretch) {
					context.canvas_context.drawImage(context.items[context.index], 0, 0, context.width.index, context.height.index);
				}
				context.canvas_context.drawImage(context.items[context.next_slide], x, y, context.width.next_slide, context.height.next_slide);
				
				axis-= context.step;
				if(dimension <= Math.abs(axis)){
					context.canvas_context.drawImage(context.items[context.next_slide], 0, 0, context.width.next_slide, context.height.next_slide);
					clearInterval(context.interval_id);
					context.canvas.trigger('canvas_cycle.next');
				}
			}, speed);
		},
		coverUp: function(context){
			context.axis= 'y';
			return $.fn.canvasCycle.fx.cover.call(this, context);
		},
		coverDown: function(context){
			context.axis= 'y';
			context.invert= true;
			return $.fn.canvasCycle.fx.cover.call(this, context);
		},
		coverLeft: function(context){
			context.axis= 'x';
			return $.fn.canvasCycle.fx.cover.call(this, context);
		},
		coverRight: function(context){
			context.axis= 'x';
			context.invert= true;
			return $.fn.canvasCycle.fx.cover.call(this, context);
		},
		flip: function(context){
			var _this= this,
				dimension= {x: context.max_width, y: context.max_height}[context.axis],
				originale_dimension= dimension,
				speed= context.speed / (dimension / context.step),
				//step= context.speed / (context.max_width / context.step),
				min_x= {x: context.max_width / 2, y: 0}[context.axis],
				min_y= {x: 0, y: context.max_height / 2}[context.axis],
				inverter= 1,
				slide= context.items[context.index];
			
			context.interval_id= setInterval(function(){
				var width= {x: dimension, y: context.max_width}[context.axis],
					height= {x: context.max_height, y: dimension}[context.axis],
					x= {x: min_x - (dimension/2), y: 0}[context.axis],
					y= {x: 0, y: min_y - (dimension/2)}[context.axis];
				
				context.canvas_context.clearRect(0, 0, context.max_width, context.max_height);
				context.canvas_context.drawImage(slide, x, y, width, height);
				
				dimension= dimension - (context.step * inverter);
				if(dimension <= 0){
					slide= context.items[context.next_slide];
					inverter= -1;
					dimension= dimension - (context.step * inverter);
				}
				if(dimension >= originale_dimension) {
					context.canvas_context.drawImage(slide, 0, 0, context.max_width, context.max_height);
					clearInterval(context.interval_id);
					context.canvas.trigger('canvas_cycle.next');
				}
			}, speed / 2);
		},
		flipX: function(context){
			context.axis= 'x';
			return $.fn.canvasCycle.fx.flip.call(this, context);
		},
		flipY: function(context){
			context.axis= 'y';
			return $.fn.canvasCycle.fx.flip.call(this, context);
		},
		mask: function(context){
			var _this= this,
				mask= $(context.mask)[0],
				speed= context.speed / (mask.height / context.step),
				mask_y= context.max_height;
			
			context.interval_id= setInterval(function(){
				context.canvas_context.clearRect(0, 0, context.max_width, context.max_height);
				
				context.canvas_context.globalCompositeOperation= 'source-over';
				context.canvas_context.drawImage(mask, 0, mask_y);
				
				context.canvas_context.globalCompositeOperation= 'source-atop';
				context.canvas_context.drawImage(context.items[context.next_slide], 0, 0, context.width.next_slide, context.height.next_slide);
				
				context.canvas_context.globalCompositeOperation= 'destination-over';
				context.canvas_context.drawImage(context.items[context.index], 0, 0, context.width.index, context.height.index);
				
				if(mask_y <= ((mask.height / 2) * -1)){
					clearInterval(context.interval_id);
					context.canvas.trigger('canvas_cycle.next');
				}
				mask_y-= context.step;
			}, speed);
		},
		zoom: function(context){
			var _this= this,
				dimension= context.max_width,
				axis_step= dimension,
				speed= context.speed / (dimension / context.step);
			
			context.interval_id= setInterval(function(){
				var percentage= (axis_step / dimension),
					inverted_percentage= 1 - percentage;
					
				if(context.invert) {
					var width= context.max_width * inverted_percentage,
					height= context.max_height * inverted_percentage,
					x_next= 0,
					x= axis_step,
					width_next= context.max_width * percentage,
					height_next= context.max_height * percentage;
				}
				else {
					var width= context.max_width * inverted_percentage,
					height= context.max_height * inverted_percentage,
					x_next= dimension - axis_step,
					x= 0,
					width_next= context.max_width * percentage,
					height_next= context.max_height * percentage;
				}
				
				context.canvas_context.clearRect(0, 0, context.max_width, context.max_height);
				context.canvas_context.drawImage(context.items[context.next_slide], x, 0, width, height);
				context.canvas_context.drawImage(context.items[context.index], x_next, 0, width_next, height_next);
				
				axis_step-= context.step;
				if(axis_step <= 0){
					context.canvas_context.drawImage(context.items[context.next_slide], 0, 0, context.max_width, context.max_height);
					clearInterval(context.interval_id);
					context.canvas.trigger('canvas_cycle.next');
				}
			}, speed);
		},
		zoomRight: function(context){
			return $.fn.canvasCycle.fx.zoom.call(this, context);
		},
		zoomLeft: function(context){
			context.invert= true;
			return $.fn.canvasCycle.fx.zoom.call(this, context);
		},
		zoomZ: function(context){
			var _this= this,
				dimension= context.max_width,
				axis_step= dimension,
				speed= context.speed / (dimension / context.step);
			
			context.interval_id= setInterval(function(){
				var percentage= (axis_step / dimension),
					inverted_percentage= 1 - percentage,
					width= context.max_width * inverted_percentage,
					height= context.max_height * inverted_percentage,
					width_next= context.max_width * percentage,
					height_next= context.max_height * percentage,
					x= (context.max_width / 2) * inverted_percentage,
					x_next= (context.max_width / 2) * percentage;
					y= (context.max_height / 2) * inverted_percentage,
					y_next= (context.max_height / 2) * percentage;
				
				context.canvas_context.clearRect(0, 0, context.max_width, context.max_height);
				context.canvas_context.drawImage(context.items[context.next_slide], x_next, y_next, width, height);
				context.canvas_context.drawImage(context.items[context.index], x, y, width_next, height_next);
				
				axis_step-= context.step;
				if(axis_step <= 0){
					context.canvas_context.drawImage(context.items[context.next_slide], 0, 0, context.max_width, context.max_height);
					clearInterval(context.interval_id);
					context.canvas.trigger('canvas_cycle.next');
				}
			}, speed);
		},
		toss: function(context){
			var _this= this,
				dimension= context.max_width,
				axis_step= dimension,
				speed= context.speed / (dimension / context.step);
			
			context.interval_id= setInterval(function(){
				var percentage= 1- (axis_step / dimension),
					x= context.max_width * percentage,
					y= context.max_height* percentage * -1;
				
				if(!context.stretch) {
					context.canvas_context.clearRect(0, 0, context.max_width, context.max_height);
				}
				context.canvas_context.globalAlpha= 1;
				context.canvas_context.drawImage(context.items[context.next_slide], 0, 0, context.width.next_slide, context.height.next_slide);
				context.canvas_context.globalAlpha= 1- percentage;
				context.canvas_context.drawImage(context.items[context.index], x, y, context.width.index, context.height.index);
				
				axis_step-= context.step;
				if(axis_step <= 0){
					context.canvas_context.globalAlpha= 1;
					context.canvas_context.drawImage(context.items[context.next_slide], 0, 0, context.width.next_slide, context.height.next_slide);
					
					clearInterval(context.interval_id);
					context.canvas.trigger('canvas_cycle.next');
				}
			}, speed);
		},
		fadeZoom: function(context){
			var _this= this,
				dimension= context.max_width,
				axis_step= dimension,
				speed= context.speed / (dimension / context.step);
			
			context.interval_id= setInterval(function(){
				var percentage= (axis_step / dimension),
					inverted_percentage= 1 - percentage,
					width_next= context.max_width * inverted_percentage,
					height_next= context.max_height * inverted_percentage,
					x_next= (context.max_width / 2) * percentage,
					y_next= (context.max_height / 2) * percentage;
				
				context.canvas_context.clearRect(0, 0, context.max_width, context.max_height);
				context.canvas_context.globalAlpha= percentage;
				context.canvas_context.drawImage(context.items[context.index], 0, 0, context.max_width, context.max_height);
				context.canvas_context.globalAlpha= 1;
				context.canvas_context.drawImage(context.items[context.next_slide], x_next, y_next, width_next, height_next);
				
				axis_step-= context.step;
				if(axis_step <= 0){
					context.canvas_context.globalAlpha= 1;
					context.canvas_context.drawImage(context.items[context.next_slide], 0, 0, context.max_width, context.max_height);
					clearInterval(context.interval_id);
					context.canvas.trigger('canvas_cycle.next');
				}
			}, speed);
		}
	};
	
	// defaults
	$.fn.canvasCycle.defaults = {
		canvas: null,				// set this to a selected canvas element or leave it empty and let the plugin create it
		fx: 'fade',					// possible values: fade, scroll[Left, Right, Up, Down], cover[Left, Right, Up, Down], mask, flip[X, Y], fadeZoom, toss,
									//zoom[Right, Left, Z]
		timeout: 2000,				// image timeout, e.g. how long will the image last on the canvas
		speed: 1500,				// transition speed
		no_canvas: "Your browser does not support canvas, sorry. Try to download the latest Firefox Browser at http://firefox.org/",
									// text swapped by the browser if it doesn't support the canvas tag
		index: 0,					// zero based index from which your images will start
		step: 5,					// transition pixels step
		loader_text: 'Loading, please wait...',
									// loading text
		stretch: true,				// set this to false if you do not want the images to be stretched on the whole canvas
									// (careful though, some effects do not work properly if this option is set to false)
		mask: '',					// css selector for the image to be used as the mask on the "mask" effect
		before: null,				// callback function called before the transition takes place
		after: null,				// callback function called after the transition takes place
		//executing: null,
		end: null					// callback function called at the end of the transition
	};
})(jQuery);
