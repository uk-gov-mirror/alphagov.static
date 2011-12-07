jQuery(document).ready(function() { 
	// replace bg images on page boxes with images
	$('.form-download a, .help-notice, .info-notice').each(function(key,item){ 
		image = $(item).css('background-image').match(/^url\((.*?)\)$/)[1];
		$(item).prepend('<img src="'+ image +'" />');                       
		$(item).css('background-image','none');
	});
});