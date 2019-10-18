function loadPage(){
	var pki = forge.pki;
  var rsa = forge.pki.rsa;

	var currentKeyVersion = 1;

	var pki = forge.pki;
	var rsa = forge.pki.rsa;

	var memberId = $('.loginUserId').text();
	var expandedKey;
	var publicKeyPem;
	var privateKeyPem;
	var searchKey;

	var addAction = 'addATeamOnTop';
	var $addTargetTeam;

	var currentContentsPage = 1;
	var itemsPerPage = 20;

	var selectedTeams = [];

	$('#personalBtn').click(function(e){
		window.location.href = '/safe/';
	});

/***  Creating a team ***/

	function generateTeamKey() {
		var salt = forge.random.getBytesSync(128);
		var randomKey = forge.random.getBytesSync(32);
		var teamKey = forge.pkcs5.pbkdf2(randomKey, salt, 10000, 32);
		console.log("keyLength: ", teamKey.length);
		return teamKey;
	}

	function createANewTeam() {
    console.log('createATeam');

    var teamKey = generateTeamKey();
    var teamIV = forge.random.getBytesSync(16);
    var teamName = $('.nameInput').val();
    var encodedTeamName = forge.util.encodeUtf8(teamName);
    var encryptedTeamName = encryptBinaryString(encodedTeamName, teamKey, teamIV);

    var publicKeyFromPem = pki.publicKeyFromPem(publicKeyPem);
    var encodedTeamKey = forge.util.encodeUtf8(teamKey);
    var encryptedTeamKey = publicKeyFromPem.encrypt(encodedTeamKey);
    var encryptedTeamNameByMemberPublic = publicKeyFromPem.encrypt(encodedTeamName);

    var salt = forge.random.getBytesSync(128);
    var randomKey = forge.random.getBytesSync(32);
    var searchKey = forge.pkcs5.pbkdf2(randomKey, salt, 10000, 32);
    var searchKeyIV = forge.random.getBytesSync(16);
    var searchKeyEnvelope = encryptBinaryString(searchKey, teamKey, searchKeyIV);
   
    $('#nameModal').modal('toggle');
		$('.nameInput').val("");
		showLoading();
		var addActionOptions;
		addActionOptions = {
      name: encryptedTeamName,
      IV: teamIV,
      teamKeyEnvelope: encryptedTeamKey,
      searchKeyIV: searchKeyIV,
      searchKeyEnvelope: searchKeyEnvelope,
      encryptedTeamNameByMemberPublic: encryptedTeamNameByMemberPublic
    };

		if(addAction !== "addATeamOnTop") {
			addActionOptions.targetTeam = $addTargetTeam.attr('id');
			addActionOptions.targetPosition = $addTargetTeam.data('position');
		} 
		addActionOptions.addAction = addAction;
	
    $.post('/memberAPI/createANewTeam',
			addActionOptions, 
     	function(data, textStatus, jQxhr) {
      if(data.status === 'ok') {
        var thisTeamKey = teamKey;
        var team = data.team;
        var decryptedTeamName = decryptBinaryString(team.name, thisTeamKey, team.IV);
				hideLoading();
        listTeams(1);
      }
    }, 'json');
		addAction = "addATeamOnTop";
	};

	$('#createATeam').click(function(e) {
		e.preventDefault();
			createANewTeam();
		return false;
	});

	$('.closeTitleModal').click(function(e) {
		e.preventDefault();
    addAction = 'addATeamOnTop';
		return false;
	});

/*** End of creating an team ***/

  var handleAddAction = function(e) {
    $addTargetTeam = $(e.target).closest('.resultItem');

    if($(e.target).hasClass('addBefore')) {
      addAction = 'addATeamBefore';
    } else if($(e.target).hasClass('addAfter')) {
      addAction = 'addATeamAfter';
    }
    console.log(addAction);
		$('#nameModal').modal('toggle');
  }

  var handleDropAction = function(e) {
    var $targetTeam = $(e.target).closest('.resultItem');
		function showLoadingInTarget() {
    	$targetTeam.LoadingOverlay("show", {
      	image       : "",
      	fontawesome : "fa fa-circle-o-notch fa-spin",
      	maxSize     : "38px",
      	minSize      : "36px",
      	background: "rgba(255, 255, 255, 0.0)"
    	});
		}
		
		function hideLoadingInTarget() {
    	$targetTeam.LoadingOverlay("hide");
  	};

		showLoadingInTarget();
 
    var targetTeamId = $targetTeam.attr('id');
		var targetPosition = $targetTeam.data('position');
    var dropAction;
    if($(e.target).hasClass('dropBefore')) {
      dropAction = 'dropTeamsBefore';
      selectedTeams.sort(function(a,b){
        if(a.position < b.position) return -1;
        if(a.position > b.position) return 1;
        return 0;
      });
    }  else if($(e.target).hasClass('dropAfter')) {
      dropAction = 'dropTeamsAfter';
      selectedTeams.sort(function(a,b){
        if(a.position < b.position) return 1;
        if(a.position > b.position) return -1;
        return 0;
      });
    }
    console.log(dropAction);
    $.post('/memberAPI/dropTeams', {
			dropAction: dropAction,
      teams: JSON.stringify(selectedTeams),
      targetTeam: targetTeamId,
      targetPosition: targetPosition 
    }, function(data, textStatus, jQxhr) {
      if(data.status === 'ok') {
        selectedTeams.length = 0;

        setTimeout(function() {
					hideLoadingInTarget();
         	listTeams(1); 
        }, 1500);
      } else {
				hideLoadingInTarget();
			}
    }, 'json');
  }

	function updateToolbar(selectedTeams) {
    var $checkedItems = $('input:checked');
    var numberOfSelectedItems = selectedTeams.length;
    console.log('Selected Items:', numberOfSelectedItems);
    if(numberOfSelectedItems) {
      $('.itemActionBtn').removeClass('hidden disabled');
      $('.addItemBtn').addClass('hidden');
      $checkedItems.each(function(index, element) {
        $(element).closest('.resultItem').find('.itemActionBtn').addClass('disabled');
      });
    } else {
      $('.itemActionBtn').addClass('hidden');
			$('.addItemBtn').removeClass('hidden');
    }
	}
	
	function displayTeams(teams) {
		var i = 0;
	  function isTeamSelected(teamId) {
    	for(var i=0; i<selectedTeams.length; i++) {
      	if(selectedTeams[i].id === teamId) return true;
    	}
    	return false;
  	}
		function displayATeam() {
			var team = teams[i];
			var teamId = team._source.teamId;
			var teamPosition = team._source.position;

			function appendResult(thisTeamName) {
      	var $resultItem = $('.resultItemTemplate').clone().removeClass('resultItemTemplate hidden').addClass('resultItem');
      	$resultItem.attr('id', teamId);
				$resultItem.data('position', teamPosition);
				thisTeamName = DOMPurify.sanitize(thisTeamName);
      	$resultItem.find('.itemTitle').html(thisTeamName);
      	var link = '/team/' + teamId;
      	$resultItem.find('.itemTitle').attr('href', link);
				if(isTeamSelected(teamId)) {
    			$resultItem.find('.selectItemBox').prop('checked', true);
  			}   
 
  			$resultItem.find('.selectItemBox').click(function(e) {
    			var teamPosition = $(e.target).closest('.resultItem').data('position');
    			var teamId = $(e.target).closest('.resultItem').attr('id');
    			var team = {id:teamId, position:teamPosition};

    			if(e.target.checked){
      			selectedTeams.push(team);
    			} else {
      			for(var i=0; i< selectedItemsInContainer.length; i++)
      			{
        			if(selectedTeams[i].id === itemId) break;
      			}
      			selectedTeams.splice(i, 1);
    			}
    			updateToolbar(selectedTeams);
  			});

 
				$resultItem.find('.addAction').click(function(e) {
    			e.preventDefault();
    			$(e.target).closest('.resultItem').find('.addItemBtn').dropdown('toggle');
    			handleAddAction(e);
    			return false;
  			});

  			$resultItem.find('.dropAction').click(function(e) {
    			e.preventDefault();
    			handleDropAction(e);
    			$(e.target).closest('.resultItem').find('.itemActionBtn').dropdown('toggle');
    			return false;
  			});
 
      	$('.resultItems').append($resultItem);
			}

			if(team._source.encryptedTeamName) {
				if(team._source.cachedTeamName) {
					var encodedTeamName = ECBDecryptBinaryString(team._source.cachedTeamName, searchKey);
					var teamName = "<h2>" + forge.util.decodeUtf8(encodedTeamName) + "</h2>";
          appendResult(teamName);
					i++;
          if(i < teams.length) {
            displayATeam();
          }			
				} else {
					var privateKeyFromPem = pki.privateKeyFromPem(privateKeyPem);
					var encodedTeamName = privateKeyFromPem.decrypt(team._source.encryptedTeamName);
					var teamName = "<h2>" + forge.util.decodeUtf8(encodedTeamName) + "</h2>";
					appendResult(teamName);
			
					var cachedTeamName = ECBEncryptBinaryString(encodedTeamName, searchKey);	
					$.post('/memberAPI/cacheTeamNameForTeamMember', {
          	teamId: teamId,
          	memberId: memberId,
          	cachedTeamName: cachedTeamName
        	}, function(data, textStatus, jQxhr) {
          	if(data.status === 'ok') {
            	i++;
            	if(i < teams.length) {
              	displayATeam();
            	}
          	}
        	}, 'json');	
				}
			} else {
				var teamKeyEnvelope = team._source.teamKeyEnvelope;
				var privateKeyFromPem = pki.privateKeyFromPem(privateKeyPem);
				var encodedTeamKey = privateKeyFromPem.decrypt(teamKeyEnvelope);
				var teamKey = forge.util.decodeUtf8(encodedTeamKey);
				var encryptedTeamName = team.team._source.name;
				var teamIV = team.team._source.IV;
				var encodedTeamName = decryptBinaryString(encryptedTeamName, teamKey, teamIV);
				var teamName = "<h2>" + forge.util.decodeUtf8(encodedTeamName) + "</h2>";
				appendResult(teamName);

				var publicKeyFromPem = pki.publicKeyFromPem(publicKeyPem);
				var encryptedTeamName = publicKeyFromPem.encrypt(encodedTeamName);		
	
				$.post('/memberAPI/updateTeamNameForTeamMember', {
      		teamId: teamId,
      		memberId: memberId,
					encryptedTeamName: encryptedTeamName
    		}, function(data, textStatus, jQxhr) {
      		if(data.status === 'ok') {
						i++;
      			if(i < teams.length) {
        			displayATeam();
      			}	
      		}
    		}, 'json');
			}
		}
		if(i < teams.length) {
			displayATeam();
		}
	}

  function resetPagination() {
    currentContentsPage = 1;
    $('.containerContentsPagination').empty();
    $('.containerContentsPagination').addClass('hidden');
  }

	function updatePagination(currentContentsPage, total, sizePerPage) {
    var $containerContentsPagination = $('.containerContentsPagination');
    if($containerContentsPagination.hasClass('hidden')) {
      var $leftArrowPagingItem = $('<li><a href="#">&laquo;</a></li>');
      var $rightArrowPagingItem = $('<li><a href="#">&raquo;</a></li>');
      var $numberPagingItem = $('<li><a href="#">1</a></li>');

      var numberOfContentsPages;
      var tempNumber = total/sizePerPage;
      if((tempNumber)%1 === 0) {
        numberOfContentsPages = tempNumber;
      } else {
        numberOfContentsPages = Math.floor(tempNumber) + 1;
      }

      for(var i=0; i< numberOfContentsPages; i++) {
        var $newItem = $numberPagingItem.clone();
        $newItem.attr('id', i+1);
        $newItem.find('a').text(i+1);
        $newItem.find('a').click(function(e){
          e.preventDefault();
          var intendedPageNumber = parseInt($(e.target).parent().attr('id'));
          listTeams(intendedPageNumber);
          return false;
        });
        $('.containerContentsPagination').append($newItem);
      }
      $('.containerContentsPagination').removeClass('hidden');
    }
    $('.containerContentsPagination').find('li.disabled').removeClass('disabled');
    $('.containerContentsPagination').find('li#'+ (currentContentsPage)).addClass('disabled');
  }

	/* List Section */
	var listTeams = function (pageNumber) {
		showLoading();
		$('.resultItems').empty();
		$.post('/memberAPI/listTeams', {
			size: itemsPerPage,
			from: (pageNumber -1) * itemsPerPage
    }, function(data, textStatus, jQxhr) {
			if(data.status === 'ok') {
				currentContentsPage = pageNumber;
				var total = data.hits.total;
        var hits = data.hits.hits;
				if(hits.length) displayTeams(hits);
				updatePagination(currentContentsPage, total, itemsPerPage);
			}
			hideLoading();	
		}, 'json'); 
	}

  bSafesPreflight(function(err, key, thisPublicKey, thisPrivateKey, thisSearchKey) {
      if(err) {
        alert(err);
      } else {
        expandedKey = key;
				publicKeyPem = thisPublicKey;
				privateKeyPem = thisPrivateKey;
				searchKey = thisSearchKey;

				resetPagination();

				listTeams(1);
      }
  });
};
