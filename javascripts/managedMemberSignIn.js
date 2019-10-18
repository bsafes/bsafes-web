/* global $, window */
function loadPage(){
	'use strict';

	$('#sendBtn').click(function(e) {
		showLoadingInSignIn();
		$('#invalidMember').addClass('hidden');
    $('#wrongPassword').addClass('hidden');
		var masterId = $('#masterId').text();
		var memberName = forge.util.encodeUtf8($('#memberName').val());
		var password = $('#password').val();

		var username = 'm' + ':' + masterId + ':' + memberName;
		$.post('/authenticateManagedMember', {
			masterId: masterId,
			username: username,
			password: password
    }, function(data, textStatus, jQxhr ){
			hideLoadingInSignIn();
      if(data.status === 'ok') {
				window.location.href = "/member/";
      } else {
				if(data.err === "invalidMember") {
					$('#invalidMember').removeClass('hidden');
				} else if(data.err === "wrongPassword") {
					$('#wrongPassword').removeClass('hidden');
				}
			}
    }, 'json');
		return false;
	});
};

