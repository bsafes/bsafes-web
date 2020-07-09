/* global $, window */
window.fbAsyncInit = function() {
  FB.init({
    appId: '768520003317802',
    cookie: true, // This is important, it's not enabled by default
    version: 'v2.8'
  });

  let scroll_link = $('.scroll');

  //smooth scrolling -----------------------
  scroll_link.click(function(e){
    e.preventDefault();
    let url = $('body').find($(this).attr('href')).offset().top;
    $('html, body').animate({
       scrollTop : url
    },700);
    $(this).parent().addClass('active');
    $(this).parent().siblings().removeClass('active');
    return false;
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

	$('#sendMessage').click(function(e) {
		var senderName = $("input[name='name']").val();
		senderName = DOMPurify.sanitize(senderName);
		var senderEmail = $("input[name='email']").val();
		senderEmail = DOMPurify.sanitize(senderEmail);
		if(senderName === "" || senderEmail === "" || senderEmail.indexOf("@") === -1) {
			$("#nameAndEmailWarning").removeClass("hidden");
			return false;
		}
		var message = $("textarea[name='message']").val();
		message = DOMPurify.sanitize(message);
		if(message === "") {
			$("#messageWarning").removeClass("hidden");
			return false;
		}
		$.post('/sendGuestMessage', {
			senderName: encodeURI(senderName),
			senderEmail: encodeURI(senderEmail),
			message: encodeURI(message)
		}, function(data, textStatus, jQxhr ){
			if(data.status === 'ok') {
				$("#messageSent").removeClass("hidden");
				$("input[name='name']").val("");
				$("input[name='email']").val("");
				$("textarea[name='message']").val("");
			} else {

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

