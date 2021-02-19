/* global $, window */
function loadPage() {
  let scroll_link = $('.scroll');

  //smooth scrolling -----------------------
  scroll_link.click(function(e) {
    e.preventDefault();
    let url = $('body').find($(this).attr('href')).offset().top;
    $('html, body').animate({
      scrollTop: url
    }, 700);
    $(this).parent().addClass('active');
    $(this).parent().siblings().removeClass('active');
    return false;
  });

  $('#signUp').click(function(e) {

    return false;
  });

  $('#sendMessage').click(function(e) {
    var senderName = $("input[name='name']").val();
    senderName = DOMPurify.sanitize(senderName);
    var senderEmail = $("input[name='email']").val();
    senderEmail = DOMPurify.sanitize(senderEmail);
    if (senderName === "" || senderEmail === "" || senderEmail.indexOf("@") === -1) {
      $("#nameAndEmailWarning").removeClass("hidden");
      return false;
    }
    var message = $("textarea[name='message']").val();
    message = DOMPurify.sanitize(message);
    if (message === "") {
      $("#messageWarning").removeClass("hidden");
      return false;
    }
    $.post('/sendGuestMessage', {
      senderName: forge.util.encode64(senderName),
      senderEmail: forge.util.encode64(senderEmail),
      message: forge.util.encode64(message),
			antiCSRF: bSafesCommonUIObj.antiCSRF
    }, function(data, textStatus, jQxhr) {
      if (data.status === 'ok') {
        $("#messageSent").removeClass("hidden");
        $("input[name='name']").val("");
        $("input[name='email']").val("");
        $("textarea[name='message']").val("");
      } else {
				alert(data.err);
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
