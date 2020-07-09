function loadPage(){
	var memberId = $('.loginUserId').text();

	$("#verifyToken").click(function(event) {
		event.preventDefault();
		var token = $("#token1").val();
		$.post('/verifyMFAToken', {
			token: token 
		}, function(data, textStatus, jQxhr) {
      if(data.status === 'ok') {
				window.location.href = '/member';		
			} else {
        alert(data.err);
				$("#token1").val("");
      }
    }, 'json');
	});

	$('#getHelp').click(function(event) {
		event.preventDefault();
		if(memberId.charAt(0) === 'm') {
			$('#memberMFAHelp').removeClass('hidden');
		} else {
			$('#accountMFAHelp').removeClass('hidden');
		}
	});

	$('#emailHelp').click(function(event) {
		event.preventDefault();
		$.post('/accountMFAHelp', {
		}, function(data, textStatus, jQxhr) {
			if(data.status === 'ok') {
				$("#emailSent").removeClass('hidden');
			} else {
				alert(data.err);
			}
		}, 'json');
	});
}
