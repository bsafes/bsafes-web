function loadPage(){
	var $totpSecret = $('#totpSecret');
	if($totpSecret.length) $('#extraMFAEnabled').removeClass('hidden');

	$("#verifyToken").click(function(event) {
		event.preventDefault();
		var token = $("#token1").val();
		$.post('/safeAPI/verifyMFASetupToken', {
			token: token,
			antiCSRF: bSafesCommonUIObj.antiCSRF 
		}, function(data, textStatus, jQxhr) {
      if(data.status === 'ok') {
      	$('#setupExtraMFA').addClass('hidden');
				$('#extraMFAEnabled').removeClass('hidden');	
			} else {
        alert(data.err);
      }
    }, 'json');
	});

  var goDeleteEnabled = false;
  function showLoadingInDeleteModal() {
    var $thisModal = $("#deleteModal").find(".modal-content");
    $thisModal.LoadingOverlay("show", {
      image       : "",
      fontawesome : "fa fa-circle-o-notch fa-spin",
      maxSize     : "38px",
      minSize      : "36px",
      background: "rgba(255, 255, 255, 0.0)"
    });
  };

  function hideLoadingInDeleteModal() {
    $("#deleteModal").find(".modal-content").LoadingOverlay("hide");
  };

  function showDeleteModal() {
    $('#deleteModal').modal('show');
    $('#deleteInput').val("");
    var $thisBtn = $('#goDeleteBtn');
    $thisBtn.addClass('disabled');

    $thisBtn.off();
    $thisBtn.click(function(e) {
      if(!goDeleteEnabled) return false;
      showLoadingInDeleteModal();
      $.post('/safeAPI/deleteExtraMFA', {
				antiCSRF: bSafesCommonUIObj.antiCSRF
      }, function(data, textStatus, jQxhr) {
        hideLoadingInDeleteModal();
        $('#deleteModal').modal('hide');
        if(data.status === 'ok') {
					location.reload();
        } else {
          alert(data.err);
        }
      }, 'json');
      return false;
    }); 

    $('#deleteInput').on('input', function() {
      var thisInput = $(this).val();
      if(thisInput === 'Yes') {
        $thisBtn.removeClass('disabled');
        goDeleteEnabled = true;
      } else {
        $thisBtn.addClass('disabled');
        goDeleteEnabled = false;
      }
    });
  }

	$('#deleteExtraMFA').click(function(event) {
		event.preventDefault();
		showDeleteModal();
	});
	
}
