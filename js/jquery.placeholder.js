/*!-----------------------------------------------------------------------------
jQuery Placeholder Polyfill
(provides support for HTML5 <input placeholder="xxx"> in IE and older browsers)
Original version copyright (c) 2010 Michael J. Ryan (http://tracker1.info/)

Dual licensed under the MIT and GPL licenses:
	http://www.opensource.org/licenses/mit-license.php
	http://www.gnu.org/licenses/gpl.html

Edited & improved by Simon East for Surface Digital, 24 Sept 2012
Based on MJ Ryan's version 1.1.9, with changes

Requires jQuery 1.7 or above
-----------------------------------------------------------------------------*//*

HOW IT WORKS:

	Browsers that support HTML5 placeholders are left to do their thing
	(which is generally better and more reliable).  But for others, including 
	IE 9 and below: fake placeholder text is created for all input fields that use them.
	
	It inserts a <label> tag immediately after the input tag, the positioning is set absolute, 
	and it's positioned directly over the input tag.  The label inherits the field's font size & styling.

	The plugin automatically activates on DOM-ready using:

	$('input[placeholder],textarea[placeholder]').placeholder();


INSTRUCTIONS:

	In many cases all you have to do is include this JS, and presto everything works.

	BUT...
	
	If the form is being revealed using ANIMATION, you might witness the placeholders
	not animating correctly (because of their absolute positioning).  The solution is 
	simply to wrap the fields in an additional DIV - this new DIV will then become the
	"offset parent" for absolute positioning which should hopefully resolve any animation issues.
	
	If the form fields get their values changed dynamically via script (which doesn't automatically 
	fire the events), you'll need to manually trigger the change() event to occur, like this:

		$('#input_id').val('new value').change(); 		// trigger change event, so placeholder is adjusted


STYLING THE PLACEHOLDERS:

	The fake placeholders take on the style of the text fields themselves, by default (at 40% opacity).  But can 
	be styled using:
	
		label.placeholder {
			color: green !important;			<--- styles the fake placeholders
		}
		.IE_Placeholder_Active {
			border: 2px solid purple;			<--- styles the form fields that have fake placeholders
		}		

	For browsers with native placeholders:

	input:placeholder, textarea:placeholder {
		color: #999999;
	}
	input::-webkit-input-placeholder, textarea::-webkit-input-placeholder {
		color: #999999;
	}

------------------------------------------------------------------------------

Thanks to...
	http://www.alistapart.com/articles/makingcompactformsmoreaccessible
	http://plugins.jquery.com/project/overlabel

	This works similar to the overlabel, but creates the actual label tag
	based on the placeholder attribute on the input tag, instead of 
	relying on the markup to provide it.

------------------------------------------------------------------------------*/
(function($){
	var ph = "IE_Placeholder_Active";		// class applied to <input> fields
	var phl = "IE_Placeholder_Overlay";		// class applied to <label>
	var boundEvents = false;
	var default_options = {
		labelClass: 'placeholder'
	};
	
	// Check for native support for placeholder attribute, if so stub methods and return
	var input = document.createElement("input");
	if ('placeholder' in input) {
		$.fn.placeholder = $.fn.unplaceholder = function(){}; //empty function
		delete input; //cleanup IE memory
		return;
	}
	delete input;

	// Fix placeholders when the page resizes (fields are hidden/displayed, which can change positioning).
	$(window).resize(checkResize);

	// Main jQuery Plugin, called on <input placeholder="..."> elements
	$.fn.placeholder = function(options) {
		bindEvents();

		var opts = $.extend(default_options, options)

		this.each(function(){
			var input = $(this);

			if (!input.attr('placeholder') || input.data(ph) === ph) return; //already watermarked

			// Ensure parent element is non-static so we can get a good positioning
			if (input.parent().css('position') == 'static')
				input.parent().css('position', 'relative');
			
			// Make sure the input tag has an ID assigned, if not, assign a random one
			if (!input.attr('id')) {
				var rnd = Math.random().toString(32).replace(/\./,'');
				input.attr('id', 'input_' + rnd);
			}
			
			var label = $('<label>');
			label
				.attr('id', input.attr('id') + "_placeholder")
			
					.css({
					// Positioning
					'position': 'absolute',
					'display': 'none',
					'top': 0,
					'left': 0,
					
					// Set label CSS to match field CSS
						'font-family': input.css('font-family'),
						'font-size': input.css('font-size'),
					'font-weight': input.css('font-weight'),
					'line-height': input.css('line-height'),
					'text-align': input.css('text-align'),
					'width': input.css('width'),				// this might need adjusting, not perfect when placeholder wider than field
					'color': input.css('color'),
					'padding-top':	parseInt(input.css('padding-top'))
									+ (parseInt(input.css('margin-top')) ? parseInt(input.css('margin-top')) : 0)	// fix for IE 7-8
									+ parseInt(input.css('border-top-width'))
									+ 'px',
					'padding-left':	parseInt(input.css('padding-left')) 
									+ (parseInt(input.css('margin-left')) ? parseInt(input.css('margin-left')) : 0) // fix for IE 7-8
									+ parseInt(input.css('border-left-width'))
									+ 'px',
					
					// Default opacity that Chrome places on its placeholders
						'opacity': 0.4,
						'cursor': 'text'
					})
					
					.data(ph, '#' + input.attr('id'))	//reference to the input tag
					.attr('for', input.attr('id'))
					.addClass(opts.labelClass)
					.addClass(opts.labelClass + '-for-' + this.tagName.toLowerCase()) //ex: watermark-for-textarea
					.addClass(phl)
					.text(input.attr('placeholder'));

			input
				.data(phl, '#' + label.attr('id'))	//set a reference to the label
				.data(ph,ph)		//set that the field is watermarked
				.addClass(ph)		//add the watermark class
				.after(label);		// add the label field to the page

			//setup overlay
			itemFocus.call(this);
			itemBlur.call(this);
		});
	};

	// Unbind placeholder
	$.fn.unplaceholder = function(){
		this.each(function(){
			var	input=$(this),
				label=$(input.data(phl));

			if (input.data(ph) !== ph) return;
				
			label.remove();
			input.removeData(ph).removeData(phl).removeClass(ph).unbind('change',itemChange);
		});
	};

	// prepare live bindings if not already done.
	function bindEvents() {
		if (boundEvents) return;

		$(document)
			.on('reset',		'form', function(){ $(this).find('.' + ph).each(itemBlur);	})
			.on('keydown',		'.' + ph, itemFocus)
			.on('mousedown',	'.' + ph, itemFocus)
			.on('mouseup',		'.' + ph, itemFocus)
			.on('mouseclick',	'.' + ph, itemFocus)
			.on('focus',		'.' + ph, itemFocus)
			.on('focusin',		'.' + ph, itemFocus)
			.on('blur',			'.' + ph, itemBlur)
			.on('focusout',		'.' + ph, itemBlur)
			.on('change',		'.' + ph, itemChange)
			.on('click',		'.' + phl, function(){  $($(this).data(ph)).focus(); })
			.on('mouseup',		'.' + phl, function(){  $($(this).data(ph)).focus(); });
		bound = true;
		boundEvents = true;
	}

	function itemChange() {
		var input = $(this);
		if (!!input.val()) {
			$(input.data(phl)).hide();
			return;
		}
		if (input.data(ph+'FOCUSED') != 1) {
			showPHL(input);
		}
	}

	function itemFocus() {
		$($(this).data(ph+'FOCUSED',1).data(phl)).hide();
	}

	function itemBlur() {
		var that = this;
		showPHL($(this).removeData(ph+'FOCUSED'));

		//use timeout to let other validators/formatters directly bound to blur/focusout work
		setTimeout(function(){
			var input = $(that);

			//if the item wasn't refocused, test the item
			if (input.data(ph+'FOCUSED') != 1) {
				showPHL(input);
			}
		}, 200);
	}

	// Show fake placeholder label and position it on top of field
	function showPHL(input, forced) {
		var hiddenElement,
			label = $(input.data(phl)),
			previousVal;
			
		// if not already shown, and needs to be, show it
		if ((forced || label.css('display') == 'none') && !input.val()) {
		
			// Find the x/y position for the label (relative to its "offset parent")
			// We can't get position() of a hidden element, so do a quick workaround here
			if (input.is(':hidden')) {
				hiddenElement = input.parents(':hidden').last();
				previousVal = hiddenElement[0].style.display;
				hiddenElement.css('display', 'block');
			}			
			var top = input.position().top;
			var left = input.position().left;

			if (hiddenElement)
				hiddenElement.css('display', previousVal);

			// Set the text and position of the element
			label
				.text(input.attr('placeholder'))
				.css('top', top + 'px')
				.css('left', left + 'px')
				.css('display', 'block');

		}
		//console.dir({ 'input': { 'id':input.attr('id'), 'pos': input.position() }});
	}

	var cr;
	function checkResize() {
		
		// NOTE: the lines below used to be called via a setTimeout() but it was looping continuously in IE 7
		//       and I didn't really see the point of it.  Perhaps there's a reason for it that I've missed, 
		//		 in which case I'll leave it commented here for the short term   -- Simon
		
		// if (cr) window.clearTimeout(cr);
		// cr = window.setTimeout(checkResize2, 50);
	// }
	// function checkResize2() {
		$('.' + ph).each(function(){
			var input = $(this);
			var focused = $(this).data(ph+'FOCUSED');
			if (!focused) showPHL(input, true);
		});
	}
	
	// On DOM-ready init plugin
	$(function(){
		$('input[placeholder],textarea[placeholder]').placeholder();
	});

	
}(jQuery));
