function loadPage(){
  var pki = forge.pki;
  var rsa = forge.pki.rsa;

	var teamId;
	var teamName;
	var isATeamSpace = false;
	var currentKeyVersion = 1;
  var currentPath;

	var expandedKey;
	var publicKeyPem;
  var privateKePem;
	var teamKey;

	var currentMode;

	var selectedItemType = null;
	var addAction = 'addAnItemOnTop';
	var $addTargetItem;

	var currentContentsPage = 1;
	var itemsPerPage = 20;
	var lastSearchTokensStr;

	var selectedManagedMembers = [];

	teamId = $('#teamId').text();
	var currentSpace = teamId + ':' + currentKeyVersion + ':' + '0';
	var isNewMembersAdded = false;
	
	if(teamId.substring(0, 1) === 'u') {
		$('#teamName').text('Personal');
	} else {
		isATeamSpace = true;
	} 

	$('#teamsBtn').click(function(e) {
		e.preventDefault();
		window.location.href = '/teams/';	
		return false;
	});

	var decryptResult = function(encryptedData, iv) {
		if(isATeamSpace) {
			var decryptedData = decryptBinaryString(encryptedData, teamKey, iv);
		} else {
			var decryptedData = decryptBinaryString(encryptedData, expandedKey, iv);
		}
		return decryptedData;
	};

	var getExpandedKey = function() {
		if(isATeamSpace) {
			return teamKey;
		} else {
			return expandedKey;
		}
	}; 

	var updateKeyValue = function(key, value) {
		switch(key) {
			case 'addAction':
				addAction = value;
				break;
			case '$addTargetItem':
				$addTargetItem = value;
        break;
			case 'selectedItemType':
				selectedItemType = value;
				break;
			case 'currentContentsPage':
				currentContentsPage =  value;
				break;
			default:
		}
	};

	var updateToolbar = function(selectedItems) {
		var $checkedItems = $('input:checked'); 
    var numberOfSelectedItems = selectedItems.length;
    console.log('Selected Items:', numberOfSelectedItems);
		if(numberOfSelectedItems) {
			$('.itemsActionBtn').removeClass('hidden');
			$('.itemActionBtn').removeClass('hidden disabled');
			$('.addItemBtn').addClass('hidden');
			$checkedItems.each(function(index, element) {
      	$(element).closest('.resultItem').find('.itemActionBtn').addClass('disabled');
    	});
		} else {
			$('.itemsActionBtn').addClass('hidden');
			$('.itemActionBtn').addClass('hidden');
			if(currentMode !== "search") {
				$('.addItemBtn').removeClass('hidden');
			}
		}
	};


	function searchByTokens(searchTokensStr, pageNumber) {
    $.post('/memberAPI/search', {
			teamSpace: currentSpace,
      searchTokens: searchTokensStr,
			size: itemsPerPage,
      from: (pageNumber -1) * itemsPerPage
    }, function(data, textStatus, jQxhr) {
      if(data.status === 'ok') {
				currentContentsPage = pageNumber;
				$('.resultMembers').empty();
				var total = data.hits.total;
        var hits = data.hits.hits;
        displayHits(currentMode, hits);
				updatePagination(currentMode, currentContentsPage, total, itemsPerPage, lastSearchTokensStr);
      }
    }, 'json');
	}

	function addATeamMember(memberId, encryptedTeamKey, encryptedTeamName, done) {
		$.post('/memberAPI/addATeamMember', {
			teamId: teamId,
			memberId: memberId,
			teamKeyEnvelope: encryptedTeamKey,
			encryptedTeamName: encryptedTeamName
		}, function(data, textStatus, jQxhr) {
      if(data.status === 'ok') {
				console.log("A new member is added.");
				isNewMembersAdded = true;
				done(null);
			} else {
				done(data.err);
			}	
		}, 'json');
	};

	function updateAddManagedMembersBtn() {
		if(selectedManagedMembers.length) {
			$("#addManagedMembersBtn").removeClass("disabled");
		} else {
			$("#addManagedMembersBtn").addClass("disabled");
		}
	};

  function displayManagedMembers(managedMembers) {
		var i = 0;
		function displayAManagedMember() {
			if(!managedMembers[i]._source.keyHashVersions) {
				i++;
				if(i < managedMembers.length) displayAManagedMember();
				return;
			}
      var $managedMember = $('.managedMemberTemplate').clone().removeClass('managedMemberTemplate hidden').addClass('managedMember');
      var memberId = managedMembers[i]._id;
      var memberName = managedMembers[i]._source.memberName;
		
			memberName = DOMPurify.sanitize(memberName);
			var currentKeyVersion = parseInt(managedMembers[i]._source.currentKeyVersion);
			var publicKey = managedMembers[i]._source.keyHashVersions[currentKeyVersion - 1].publicKey;
			jsId = memberIdToJSId(memberId);
      $managedMember.attr('id', jsId);
      $managedMember.find('.itemTitle').html(memberName);
			$managedMember.data('memberId', memberId);
			$managedMember.data('publicKey', publicKey);

			$managedMember.find('.managedMemberSelectBox').click(function(e) {
				var $thisManagedMember = $(e.target).closest('.managedMember');
				var memberId = $(e.target).closest('.managedMember').data('memberId');
				var publicKey = $(e.target).closest('.managedMember').data('publicKey');
				var member = {$managedMember: $thisManagedMember,  memberId: memberId, publicKey: publicKey};
				if(e.target.checked){
					selectedManagedMembers.push(member);
				} else {
		    	for(var i=0; i< selectedManagedMembers.length; i++)
      		{
        		if(selectedManagedMembers[i].memberId === memberId) break;
      		}
      		selectedManagedMembers.splice(i, 1);					
				}	
				updateAddManagedMembersBtn();
			});

			$.post("/memberAPI/isAMemberInTeam", {
				teamId: teamId,
				memberId: memberId
			}, function(data, textStatus, jQxhr) {
				if(data.status === 'ok') {
					if(data.result === "true") {
						$managedMember.find('.managedMemberSelectBox').prop('disabled', true);
						$managedMember.find('.managedMemberSelectBox').prop('checked', true);
					}
				} else {
					console.log(data.err);
				}
				$('.managedMembers').append($managedMember);
				i++;
				if(i < managedMembers.length) displayAManagedMember();
			}, 'json');
			
    }
		
		displayAManagedMember();
		
  }

	function addSelectedManagedMembers() 
	{
		function showLoadingInManagedMember($managedMember) {
			$managedMember.LoadingOverlay("show", {
      image       : "",
      fontawesome : "fa fa-circle-o-notch fa-spin",
      maxSize     : "38px",
      minSize      : "36px",
      background: "rgba(255, 255, 255, 0.0)"
    });
	
		}
		
		function hideLoadingInManagedMember($managedMember) {
			$managedMember.LoadingOverlay("hide");
		}

		function addAManagedMember() {
			var managedMember = selectedManagedMembers[0];
			var $managedMember = managedMember.$managedMember;
    	var memberId = managedMember.memberId;
    	var publicKey = managedMember.publicKey;
   
			showLoadingInManagedMember($managedMember);
 
    	var publicKeyFromPem = pki.publicKeyFromPem(publicKey);
    	var encodedTeamKey = forge.util.encodeUtf8(teamKey);
    	var encryptedTeamKey = publicKeyFromPem.encrypt(encodedTeamKey);
			var encodedTeamName = forge.util.encodeUtf8(teamName);
			var encryptedTeamName = publicKeyFromPem.encrypt(encodedTeamName);   
 
    	$.post('/memberAPI/addATeamMember', {
      	teamId: teamId,
      	memberId: memberId,
				encryptedTeamName: encryptedTeamName,
      	teamKeyEnvelope: encryptedTeamKey
    	}, function(data, textStatus, jQxhr) {
      	if(data.status === 'ok') {
					hideLoadingInManagedMember($managedMember);
        	console.log("A new member is added.");
					isNewMembersAdded = true;
        	$managedMember.find('.managedMemberSelectBox').prop("disabled", true);
      	} else {
					alert(data.err);
      	}
				selectedManagedMembers.splice(0, 1);
				if(selectedManagedMembers.length) {
					addAManagedMember();
				}	
    	}, 'json');
  	};

		if(selectedManagedMembers.length) {
			addAManagedMember();
		}
	};

	function listManagedMembers() {
		showLoading();
		$('.managedMembers').empty();
		$.post('/memberAPI/listManagedMembers', {
      size: 20,
      from: 0
    }, function(data, textStatus, jQxhr) {
      if(data.status === 'ok') {
        var total = data.hits.total;
        var hits = data.hits.hits;
        if(hits.length) {
					displayManagedMembers(hits);
					$("#addManagedMembersBtn").click(function(e) {
						console.log("Addind managed members to team", selectedManagedMembers);
						$("#addManagedMembersBtn").addClass("disabled");	
						addSelectedManagedMembers();
						return false;
					});
				}
      }
      hideLoading();
    }, 'json');
	}

	$('#addAMemberBtn').click(function(e) {
		$('.addingMode').removeClass('hidden');
		$('.listMode').addClass('hidden');
		var $managedMembers = $('.managedMember');
		isNewMembersAdded = false;
		if(!$managedMembers.length) {
			listManagedMembers();	
		} 
		return false;
	});

	$('#cancelAddingAMemberBtn').click(function(e) {
		$('.findAMemberResults').empty();
    $('.addingMode').addClass('hidden');
    $('.listMode').removeClass('hidden');

		if(isNewMembersAdded){
			$('.resultMembers').empty();
			listAllMembers();
		}
    return false;
  });


	var addAMember = function(e) {
		e.preventDefault();
		var memberId = $(e.target).closest('.findResult').attr('id');
		var publicKey = $(e.target).closest('.findResult').data('publicKey');

		var publicKeyFromPem = pki.publicKeyFromPem(publicKey);
		var encodedTeamKey = forge.util.encodeUtf8(teamKey);
		var encryptedTeamKey = publicKeyFromPem.encrypt(encodedTeamKey);	
		
		var encodedTeamName = forge.util.encodeUtf8(teamName);
		var encryptedTeamName	= publicKeyFromPem.encrypt(encodedTeamName);
		addATeamMember(memberId, encryptedTeamKey, encryptedTeamName, function(err) {
			if(err) console.log(err);
		});
	
		$('.addingMode').addClass('hidden');
		$('.listMode').removeClass('hidden');	
		return false;
	};

	var search = function(e) {
		e.preventDefault();

		$('#findAMemberInput').off('change');
		var str = $('#findAMemberInput').val();
		var email = str.trim();
		$('#findAMemberInput').val('');

		console.log("finding a  member");
		$.post('/memberAPI/findMemberByEmail', {
			email: email 
		}, function(data, textStatus, jQxhr) {
			if(data.status === 'ok') {
				var total = data.hits.total;
				var hits = data.hits.hits;
					$('.findAMemberResults').empty();
					console.log("clean results");
				for(var i=0; i< total; i++) {
					$findResult = $('.findResultTemplate').clone().removeClass('findResultTemplate hidden').addClass('findResult');
					$findResult.attr('id', hits[i]._id);
					$findResult.data('publicKey', hits[i]._source.publicKey);
					var displayName = hits[i]._source.displayName;
					displayName = DOMPurify.sanitize(displayName);
					var email = hits[i]._source.email;
					email = DOMPurify.sanitize(email);
					$findResult.find('.displayName').text(displayName);
					$findResult.find('.email').text(email);
					$findResult.find('.addAMemberBtn').click(addAMember);
					$('.findAMemberResults').append($findResult);
				}
			}
		}, 'json');

		$('#findAMemberInput').on('change', search);
		return false;
	};

	$('#findAMemberInput').on('change', search); 

	$('#findAMemberBtn').on('click', function(e){
		e.preventDefault();
		console.log("findAMemberBtn clicked");
		return false;
	});

/***  Creating an item ***/

	$('.safeItemOption').on('click', function(e) {
		if(addAction) {
			e.preventDefault();

			safeItemIsSelected(e, addAction); 			
	
			return false;
		}
	});

	$('#createAnItem').click(function(e) {
		e.preventDefault();

		createANewItem(currentSpace, selectedItemType, addAction, $addTargetItem, getExpandedKey);

		return false;
	});

	$('.closeTitleModal').click(function(e) {
		e.preventDefault();
    addAction = 'addAnItemOnTop';
    selectedItemType = null;
		return false;
	});

	$('#closeNewItemOptionsModal').on('click', function(e) {
		addAction = 'addAnItemOnTop';
	});

/*** End of creating an item ***/

	function resetPagination() {
		currentContentsPage = 1;
    $('.membersPagination').empty();
    $('.membersPagination').addClass('hidden');
	}

	/* List Section */
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
	
		$thisBtn.off();	
		$thisBtn.click(function(e) {
			if(!goDeleteEnabled) return false;
			showLoadingInDeleteModal();
			$.post('/memberAPI/deleteATeamMember', {
				teamId: teamId,
				memberId: memberId	
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
		if($(e.target).hasClass('deleteATeamMember')) {
			var $targetMember = $(e.target).closest('.memberResult');
			var memberId = $targetMember.data('memberId');
			showDeleteModal(memberId, $targetMember);
		}
	}

	function displayMembers(mode, hits, total) {
			$('.resultMembers').empty();
    for(var i=0; i< hits.length; i++) {
			if(!hits[i].member) continue;
      $memberResult = $('.memberResultTemplate').clone().removeClass('memberResultTemplate hidden').addClass('memberResult');
      $memberResult.attr('id', hits[i]._id);
			$memberResult.data('memberId', hits[i]._source.memberId);
			if(hits[i].member.id.charAt(0) === 'm') {
				var displayName = hits[i].member.memberName;
				displayName = DOMPurify.sanitize(displayName);
				$memberResult.find('.displayName').text(displayName);
				$memberResult.find('.email').text("");
			} else {
				var displayName = hits[i].member.displayName;
				var email = hits[i].member.email;
				displayName = DOMPurify.sanitize(displayName);
      	$memberResult.find('.displayName').text(displayName);
				email = DOMPurify.sanitize(email);
      	$memberResult.find('.email').text(email);
			}
		
			$memberResult.find('.actionOption').click(function(e) {
				$(e.target).closest('.memberResult').find('.actionsBtn').dropdown('toggle');
				handleAction(e);
				return false;
			});

      $('.resultMembers').append($memberResult);
    }
	}

	var listMembers = function (pageNumber) {
		$('.resultMembers').empty();
		$.post('/memberAPI/listTeamMembers', {
      teamId: teamId,
			size: itemsPerPage,
			from: (pageNumber -1) * itemsPerPage
    }, function(data, textStatus, jQxhr) {
			if(data.status === 'ok') {
				currentContentsPage = pageNumber;
				var total = data.hits.total;
				var members = data.hits.hits;
				displayMembers(currentMode, members, total);
				updatePagination(currentMode, currentContentsPage, total, itemsPerPage, lastSearchTokensStr);
			}	
		}, 'json'); 
	}

  initContainerFunctions(listMembers, searchByTokens, decryptResult, updateToolbar, updateKeyValue);

	function listAllMembers() {
		currentMode = "listAll";
		resetPagination();
		listMembers(1);	
	};

	$('#list').click(function(e) {
		e.preventDefault();
		$('#listAllItems').trigger('click');
		return false;
	});


  bSafesPreflight(function(err, key, thisPublicKey, thisPrivateKey) {
      if(err) {
        alert(err);
      } else {
        expandedKey = key;
				if(teamId.substring(0, 1) === 't') {
					publicKeyPem = thisPublicKey;
        	privateKeyPem = thisPrivateKey;
					getTeamData(teamId, function(err, team) {
						if(err) {
							
						} else {
							var teamKeyEnvelope = team.teamKeyEnvelope;	
							var privateKeyFromPem = pki.privateKeyFromPem(privateKeyPem);
							var encodedTeamKey = privateKeyFromPem.decrypt(teamKeyEnvelope);
							teamKey = forge.util.decodeUtf8(encodedTeamKey);
							var encryptedTeamName = team.team._source.name;
							var teamIV = team.team._source.IV;
							var encodedTeamName = decryptBinaryString(encryptedTeamName, teamKey, teamIV);
							teamName = forge.util.decodeUtf8(encodedTeamName);
							teamName = DOMPurify.sanitize(teamName);
							document.title = teamName;
							$('.teamName').text(teamName);
							listAllMembers();
						}
					});	
				} else {

				}
      }
  });
};
