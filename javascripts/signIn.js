/* global $, window */
window.fbAsyncInit = function() {
  FB.init({
    appId: '768520003317802',
    cookie: true, // This is important, it's not enabled by default
    version: 'v2.8'
  });

  $('#nextBtn').click(function(e) {
    $("#invalidMember").addClass('hidden');
    email = $('#email').val();
    if (!(email.length && email.includes("@"))) {
      alert("Invalid Email");
      return;
    }
    showV5LoadingIn($('.emailSignInForm'));
    $.post('/signInWithEmail', {
      email: window.btoa(email),
			antiCSRF: bSafesCommonUIObj.antiCSRF
    }, function(data, textStatus, jQxhr) {
      if (data.status === 'ok') {
        $('.emailSignInForm, .oauthSignIn, .newSignUp').addClass('hidden');
        $('.passwordForm').removeClass('hidden');
      } else {
        alert(data.err);
      }
      hideV5LoadingIn($('.emailSignInForm'));
    }, 'json');
    return false;
  });

  $('#sendBtn').click(function(e) {
    $('#wrongPassword').addClass('hidden');
    showV5LoadingIn($('.passwordForm'));
    password = $('#password').val();
    $.post('/authenticateEmailMember', {
      password: window.btoa(password),
			antiCSRF: bSafesCommonUIObj.antiCSRF
    }, function(data, textStatus, jQxhr) {
      if (data.status === 'ok') {
        window.location.href = "/member/";
      } else {
				alert(data.err);
        $('#invalidMember').removeClass('hidden');
      }
      hideV5LoadingIn($('.passwordForm'));
    }, 'json');
    return false;
  });
};

$(function(d, s, id) {
  function testWebAssembly() {
    try {
      if (typeof WebAssembly === "object" &&
        typeof WebAssembly.instantiate === "function") {
        const module = new WebAssembly.Module(Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00));
        if (module instanceof WebAssembly.Module)
          return new WebAssembly.Instance(module) instanceof WebAssembly.Instance;
      }
    } catch (e) {}
    return false;
  }

  const supported = testWebAssembly();

  $(".signInOption").addClass("hidden");

  if (!supported) {
    $(".note").removeClass("hidden");
    $(".signInOption").addClass("hidden");
    return;
  } else {
    $(".signInOption").removeClass("hidden");
  }

  'use strict';

  var js, fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) {
    return;
  }
  js = d.createElement(s);
  js.id = id;
  js.src = "//connect.facebook.net/en_US/sdk.js";
  fjs.parentNode.insertBefore(js, fjs);

}(document, 'script', 'facebook-jssdk'));
