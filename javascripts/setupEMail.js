/* global $, window */
function loadPage() {
  'use strict';
  var email;
  var password;

  $('#startBtn').click(function(e) {
    email = $('#email').val();

    if (!(email.length && email.includes("@"))) {
      alert("Invalid Email");
      return;
    }

    showLoadingIn($('.emailSignUpForm'));
    $.post('/memberAPI/verifyEMail', {
      email: window.btoa(email),
			antiCSRF: bSafesCommonUIObj.antiCSRF
    }, function(data, textStatus, jQxhr) {
      if (data.status === 'ok') {
        $('.emailSetupForm').addClass('hidden');
        $('.emailVerificationForm').removeClass('hidden');
      } else{
				alert(data.err);
			}
      hideLoadingIn($('.emailSignUpForm'));
    }, 'json');
    return false;
  });

  $('#sendCodeBtn').click(function(e) {
    var verificationCode = $('#verificationCode').val();
    showLoadingIn($('.emailVerificationForm'));
    $.post('/memberAPI/verifySetupEMailCode', {
      verificationCode: verificationCode,
			antiCSRF: bSafesCommonUIObj.antiCSRF
    }, function(data, textStatus, jQxhr) {
      if (data.status === 'ok') {
        $('.emailVerificationForm').addClass('hidden');
        $('.setupEMailDone').removeClass('hidden');
      } else {
        $('.emailSetupForm').removeClass('hidden');
        $('#invalidCode').removeClass('hidden');
        $('.emailVerificationForm').addClass('hidden');
        $('#verificationCode').val("");
				alert(data.err);
      }
      hideLoadingIn($('.emailVerificationForm'));
    }, 'json');
    return false;
  });
};
