/* global $, window */
window.fbAsyncInit = function() {
  FB.init({
    appId: '768520003317802',
    cookie: true, // This is important, it's not enabled by default
    version: 'v2.8'
  });

  $('#signUp').click(function(e) {
		
    return false;
  });

	$('#tryMe').click(function(e) {
		var $target = $('#tryMe');
		showV5LoadingIn($target);
		$('.errorMessage').addClass('hidden');
		$.post('/tryWithoutSignUp', {
		}, function(data, textStatus, jQxhr ){
			hideV5LoadingIn($target);
			$('#tryWithoutSignUpModal').modal('show');
			if(data.status === 'ok') {
				$('#goBtn').attr('disabled', false);
				$('#goBtn').click(function(e) {
					window.location.href = "/member/";
					return false;
				});
			} else {
				$('.errorMessage').removeClass('hidden');
			}
		}, 'json');
    return false;
	});

//$("#slideshow > div:gt(0)").hide();

setInterval(function() {
  $('#slideshow > div:first')
    .fadeOut(1000)
    .next()
    .fadeIn(1000)
    .end()
    .appendTo('#slideshow');
}, 3000);

};

$(function (d, s, id) {
    'use strict';

    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) {return;}
    js = d.createElement(s); js.id = id;
    js.src = "//connect.facebook.net/en_US/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);

}(document, 'script', 'facebook-jssdk'));

