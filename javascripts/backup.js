function loadPage(){
	$( "#downloadWin").click(function(event) {
		$(".instructions").addClass("hidden");
		$("#winInstructions").removeClass("hidden");
	});

  $( "#downloadMac").click(function(event) {
		$(".instructions").addClass("hidden");
    $("#macInstructions").removeClass("hidden");
  });

  $( "#downloadLinux").click(function(event) {
		$(".instructions").addClass("hidden");
    $("#linuxInstructions").removeClass("hidden");
  });

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
