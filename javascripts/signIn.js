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
            email: email
        }, function(data, textStatus, jQxhr) {
            if (data.status === 'ok') {
                $('.emailSignInForm, .oauthSignIn, .newSignUp').addClass('hidden');
                $('.passwordForm').removeClass('hidden');
            } else {
                if (data.err === "invalidMember") {
                    $("#invalidMember").removeClass('hidden');
                }
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
            password: password
        }, function(data, textStatus, jQxhr) {
            if (data.status === 'ok') {
                window.location.href = "/member/";
            } else {
                if (data.err === "wrongPassword") {
                    $('#wrongPassword').removeClass('hidden');
                }
            }
            hideV5LoadingIn($('.passwordForm'));
        }, 'json');
        return false;
    });
};

$(function(d, s, id) {
    'use strict';

    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) { return; }
    js = d.createElement(s);
    js.id = id;
    js.src = "//connect.facebook.net/en_US/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);

}(document, 'script', 'facebook-jssdk'));