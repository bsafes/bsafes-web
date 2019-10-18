function loadPage(){
	var pki = forge.pki;
  var rsa = forge.pki.rsa;

	var currentKeyVersion = 1;

	var pki = forge.pki;
	var rsa = forge.pki.rsa;

	var expandedKey;
	var publicKeyPem;
	var privateKePemy;

	var addAction = 'addATeamOnTop';
	var $addTargetTeam;

	var currentContentsPage = 1;
	var teamsPerPage = 10;

	var newManagedMemberPassword = "";
	var newManagedMemberKey = "";

	$('#personalBtn').click(function(e){
		window.location.href = '/safe/';
	});

  function checkInputStrength($input, value, progressId, strengthTextId) {
    console.log("Checking value strength:", value.length);
    strengthLevel = 'Invalid';
    var strongRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})");
    var mediumRegex = new RegExp("^(((?=.*[a-z])(?=.*[A-Z]))|((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(?=.{6,})");
    var isMedium = mediumRegex.test(value);
    if(isMedium){
      strengthLevel = 'Medium';
      var isStrong = strongRegex.test(value);
      if(isStrong) {
        strengthLevel = 'Strong';
      }
    }

		if(newManagedMemberKey === newManagedMemberPassword) {
			$input.val("");
			strengthLevel = "Key and password can't be the same";
		}
		
    var strengthProgress = value.length/8 * 100;
		if(strengthProgress > 100) strengthProgress = 100;
    $(progressId).css("width", strengthProgress + "%");
    var progressClass = "progress-bar-danger";
    var strengthColor = "red";
    switch(strengthLevel) {
      case 'Invalid':
        progressClass = "progress-bar-danger";
        strengthColor = "red";
        break;
			case "Key and password can't be the same":
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
    $(progressId).removeClass("progress-bar-danger progress-bar-warning progress-bar-success");
    $(progressId).addClass(progressClass);
    $(strengthTextId).css("color", strengthColor);
    $(strengthTextId).text(strengthLevel);
  }

/***  Creating a managed member ***/

	$('#addAManagedMemberBtn').click(function(e) {
		e.preventDefault();
		console.log('addAManagedMemberBtn');

		$('.listMode').addClass('hidden');
		$('.addingMode').removeClass('hidden');

		return false;
	});

	$('.CancelAddingBtn').click(function(e) {
		e.preventDefault();

		$('.listMode').removeClass('hidden');
    $('.addingMode').addClass('hidden');

		return false;
	});
	
	function clearMemberForm() {
		newManagedMemberPassword = "";
    newManagedMemberKey = "";

		$('#memberName').val("");
		$('#password').val("");
		$('#passwordStrengthProgress').addClass('hidden');
		$('#passwordStrengthText').text("");
		$('#confirmPassword').val("");
		$('#confirmPasswordText').text("");
		$('#doneAddingBtn').addClass('disabled');
	}

	function checkNewMemberForm() {
		if($('#memberName').val().length === 0) return false;
		if($('#confirmPasswordText').text() !== 'Ok') return false;
		return true;
	}

  $('#password').on('input', function(){
    $('#passwordStrengthProgress, #passwordStrengthText').removeClass('hidden');
    $('#doneAddingBtn').addClass('disabled');
    $('#confirmPassword').val('');
    $('#confirmPasswordText').text('');
    newManagedMemberPassword = $(this).val();
    console.log(newManagedMemberPassword);
    checkInputStrength($(this), newManagedMemberPassword, '#passwordStrengthProgressBar', '#passwordStrengthText');
  });	

  $('#confirmPassword').on('input', function(){
    var confirmingPassword = $(this).val();
    console.log(confirmingPassword);
    if(confirmingPassword === newManagedMemberPassword){
      $('#confirmPasswordText').text('Ok');
			if(checkNewMemberForm()) $('#doneAddingBtn').removeClass('disabled'); 
    } else {
      $('#confirmPasswordText').text('');
      $('#doneAddingBtn').addClass('disabled');
    }
  });

	$('#doneAddingBtn').click(function(e) {
		e.preventDefault();

		function addAManagedMember() {
			showLoadingIn($('.newManagedMemberForm'));
			var thisMember = {};
			thisMember.initialLetter = $('#memberName').val().charAt(0);
			thisMember.memberName = forge.util.encodeUtf8($('#memberName').val());	
  		thisMember.password = newManagedMemberPassword;
	
			$.post('/memberAPI/addAManagedMember',
				thisMember,
				function(data, textStatus, jQxhr) {
					if(data.status === 'ok') {
				    $('.listMode').removeClass('hidden');
    				$('.addingMode').addClass('hidden');
						clearMemberForm();		
						listManagedMembers();
						hideLoadingIn($('.newManagedMemberForm'));
					}	
				}, 'json');
		};

		addAManagedMember();

	})

	
/*** End of creating an managedMember ***/
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

  function showDeleteModal(memberId, $targetMember) { 
    $('#deleteModal').modal('show'); 
    $('#deleteInput').val(""); 
    var $thisBtn = $('#goDeleteBtn'); 
    $thisBtn.addClass('disabled'); 
 
		var memberId = $targetMember.attr('id'); 
		var masterId = $targetMember.data('masterId');
		var memberName = $targetMember.data('memberName'); 
    $thisBtn.off();  
    $thisBtn.click(function(e) { 
      if(!goDeleteEnabled) return false; 
      showLoadingInDeleteModal(); 
      $.post('/memberAPI/deleteAManagedMember', { 
				memberId: memberId,
        masterId: masterId,
				memberName: memberName   
      }, function(data, textStatus, jQxhr) { 
        hideLoadingInDeleteModal(); 
        $('#deleteModal').modal('hide'); 
        if(data.status === 'ok') { 
          $targetMember.remove(); 
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

	var handleAction = function(e) {
    if($(e.target).hasClass('deleteAManagedMember')) {
      var $targetMember = $(e.target).closest('.resultItem');
      var memberId = $targetMember.attr('id');
      showDeleteModal(memberId, $targetMember);
    }
  }
	
	function displayManagedMembers(managedMembers) {
		for(var i=0; i< managedMembers.length; i++) {
      var $resultItem = $('.resultItemTemplate').clone().removeClass('resultItemTemplate hidden').addClass('resultItem');
			var id = managedMembers[i]._id;
			var masterId = managedMembers[i]._source.masterId;
			var memberName = managedMembers[i]._source.memberName;
      $resultItem.attr('id', id);
		
			$resultItem.data('masterId', masterId);
			$resultItem.data('memberName', memberName);
			memberName = DOMPurify.sanitize(memberName);
      $resultItem.find('.displayName').html(memberName);
			
			$resultItem.find('.actionOption').click(function(e) {
				$(e.target).closest('.resultItem').find('.actionsBtn').dropdown('toggle');
				handleAction(e);
				return false;
			});    
 
      $('.resultItems').append($resultItem);
		}
	}

	/* List Section */
	var listManagedMembers = function () {
		showLoadingIn($('#addAManagedMemberBtn'));
		$('.resultItems').empty();
		$.post('/memberAPI/listManagedMembers', {
      size: 20,
      from: 0
    }, function(data, textStatus, jQxhr) {
			if(data.status === 'ok') {
				var total = data.hits.total;
        var hits = data.hits.hits;
				if(hits.length) displayManagedMembers(hits);
			}
			hideLoadingIn($('#addAManagedMemberBtn'));	
		}, 'json'); 
	}

  bSafesPreflight(function(err, key, thisPublicKey, thisPrivateKey) {
      if(err) {
        alert(err);
      } else {
        expandedKey = key;
				publicKeyPem = thisPublicKey;
				privateKeyPem = thisPrivateKey;
				listManagedMembers();
      }
  });
};
