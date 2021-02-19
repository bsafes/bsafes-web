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
    $.post('/registerEmail', {
      email: forge.util.encode64(email),
			antiCSRF: bSafesCommonUIObj.antiCSRF
    }, function(data, textStatus, jQxhr) {
      if (data.status === 'ok') {
        $('.emailSignUpForm').addClass('hidden');
        $('.emailVerificationForm').removeClass('hidden');
      } else {
				alert(data.err);
			}
      hideLoadingIn($('.emailSignUpForm'));
    }, 'json');
    return false;
  });

  $('#sendCodeBtn').click(function(e) {
    var verificationCode = $('#verificationCode').val();
    showLoadingIn($('.emailVerificationForm'));
    $.post('/verifyCode', {
      verificationCode: verificationCode,
			antiCSRF: bSafesCommonUIObj.antiCSRF
    }, function(data, textStatus, jQxhr) {
      if (data.status === 'ok') {
        $('.emailVerificationForm').addClass('hidden');
        $('.passwordSetupForm').removeClass('hidden');
      } else {
				alert(data.err);
			}
      hideLoadingIn($('.emailVerificationForm'));
    }, 'json');
    return false;
  });

  function checkPasswordStrength(key) {
    var strengthLevel = 'Invalid';
    var strongRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})");
    var mediumRegex = new RegExp("^(((?=.*[a-z])(?=.*[A-Z]))|((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(?=.{6,})");
    var isMedium = mediumRegex.test(key);
    if (isMedium) {
      strengthLevel = 'Medium';
      var isStrong = strongRegex.test(key);
      if (isStrong) {
        strengthLevel = 'Strong';
      }
    }
    var strengthProgress = key.length / 8 * 100;
    $('#strengthProgress').css("width", strengthProgress + "%");
    var progressClass = "progress-bar-danger";
    var strengthColor = "red";
    switch (strengthLevel) {
      case 'Invalid':
        progressClass = "progress-bar-danger";
        strengthColor = "red";
        break;
      case 'Medium':
        progressClass = "progress-bar-warning";
        strengthColor = "orange";
        break;
      case 'Strong':
        progressClass = "progress-bar-success";
        strengthColor = "green";
        break;
      default:
    }
    $('#strengthProgress').removeClass("progress-bar-danger progress-bar-warning progress-bar-success");
    $('#strengthProgress').addClass(progressClass);
    $('#strengthText').css("color", strengthColor);
    $('#strengthText').text(strengthLevel);
  }

  $('#password').on('input', function() {
    $('.progress, #strengthText').removeClass('hidden');
    $('#sendPasswordBtn').addClass('disabled');
    $('#retypePassword').val('');
    password = $(this).val();
    console.log(password);
    checkPasswordStrength(password);
  });

  $('#retypePassword').on('input', function() {
    var retypePassword = $(this).val();
    console.log(retypePassword);
    if (retypePassword === password) {
      $('#sendPasswordBtn').removeClass('disabled');
    } else {
      $('#sendPasswordBtn').addClass('disabled');
    }
  });

  $('#sendPasswordBtn').click(function(e) {
    var displayName = $('#name').val();
    if (displayName.length < 3) {
      alert("Your name could not be shorter than 3 letters");
    }
    showLoadingIn($('.passwordSetupForm'));
    $.post('/setupPassword', {
      displayName: forge.util.encode64(displayName),
      password: forge.util.encode64(password),
			antiCSRF: bSafesCommonUIObj.antiCSRF
    }, function(data, textStatus, jQxhr) {
      if (data.status === 'ok') {
        window.location.href = "/member/";
      } else {
				alert(data.err);
			}
      hideLoadingIn($('.passwordSetupForm'));
    }, 'json');
    return false;
  });
};
