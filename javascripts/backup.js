function loadPage(){

	$( "#getCredential" ).click(function(event) {
		event.preventDefault();
		$.post('/safeAPI/getDesktopCredential', {

		}, function(data, textStatus, jQxhr) {
			if(data.status === 'ok') {
				$('#memberName').val(data.memberName);
				$('#password').val(data.password);
				$('#credentialForm').removeClass('hidden');
			} else {
				alert("Could not get a new credential");
			}
		}, 'json');
  });

}
