function loadPage(){
  var pki = forge.pki;
  var rsa = forge.pki.rsa;

	var currentSpace;
	var teamId;
	var teamName;
	var isATeamSpace = false;
	var currentKeyVersion = 1;
  var currentPath;

	var expandedKey;
	var publicKeyPem;
  var privateKePem;
	var teamKey;


	var currentContentsPage = 1;
	var itemsPerPage = 20;


	currentSpace = $('#space').text();
	currentSpaceParts = currentSpace.split(':');
	currentSpaceParts.splice(-2, 2);

	teamId = currentSpaceParts.join(':');
 
	if(teamId.substring(0, 1) === 'u') {
		$('#teamName').text('Personal');
		$('#teamName').attr('href', '/safe');
	} else {
		isATeamSpace = true;
		$('#teamName').attr('href', '/team/' + teamId)
	} 


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


	function displayActivities(mode, hits, total) {

	}

	var listActivities = function (pageNumber) {
		$.post('/memberAPI/listActivities', {
			space: currentSpace,
			size: itemsPerPage ,
			from: (pageNumber - 1) * itemsPerPage
		}, function(data, textStatus, jQxhr) {
			if(data.status === 'ok') {
				var total = data.hits.total;
				var hits = data.hits.hits;
				for (var i=0; i < hits.length; i++) {
					var $resultItem = $('.resultItemTemplate').clone().removeClass('resultItemTemplate hidden').addClass('resultItem');
					$resultItem.attr('id', hits[i]._source.id);
					var resultItem = hits[i]._source;
					if(resultItem.id.charAt(0) === 't') {
							var title = "Trash Box";
					} else {
						var itemKey = decryptResult(resultItem.keyEnvelope, resultItem.envelopeIV);
						var itemIV = decryptResult(resultItem.ivEnvelope, resultItem.ivEnvelopeIV);
						if(resultItem.title) {
    					try {
      					var encodedTitle = decryptBinaryString(resultItem.title, itemKey, itemIV);
      					var title = forge.util.decodeUtf8(encodedTitle);
      					title = DOMPurify.sanitize(title);
								title = $('<div></div>').html(title).text();
    					} catch(err) {
     						 alert(err);
      					var title = "";
    					}
						} else {
    					var title = "";
  					}
					}
					$resultItem.find('.itemTitle').html(title);
					var updatedText;
					if (hits[i]._source.version === 1) {
            updatedText = "Creation";
          } else if(hits[i]._source.version < 0) {
						updatedText = hits[i]._source.update;	
					} else {
            updatedText = "Updated " + hits[i]._source.update;
          }
					$resultItem.find('.itemVersionUpdate').text(updatedText);
					var updatedBy = hits[i]._source.displayName?hits[i]._source.displayName:hits[i]._source.updatedBy;
					updatedBy = DOMPurify.sanitize(updatedBy);
					$resultItem.find('.itemVersionUpdatedBy').text(updatedBy);
					var updatedTime = formatTimeDisplay(hits[i]._source.createdTime);
					$resultItem.find('.itemVersionUpdatedTime').text(updatedTime);	
					if(updatedTime.charAt(updatedTime.length - 1) === 'o') {
						$resultItem.find('.itemVersionUpdatedTimeStamp').text(timeToString(hits[i]._source.createdTime));	
					}
					$('.resultItems').append($resultItem);
					$resultItem.click(function(e) {
            var $thisItemVersionItem = $(e.target).closest('.resultItem');
            var thisItemId = $thisItemVersionItem.attr('id');
						var itemType = thisItemId.split(':')[0];
						var link = "";
						switch(itemType) {
							case 'p':
								link = '/page/' + thisItemId;
								break;
							case 'f':
								link = '/folder/' + thisItemId;
								break;
							case 'b':
								link = '/box/' + thisItemId;
								break;
							case 'n':
								link = '/notebook/' + thisItemId;
								break;
              case 'np':
                link = '/notebook/p/' + thisItemId;
								break;
              case 'd':
								link = '/diary/' + thisItemId;
                break;
              case 'dp':
								link = '/diary/p/' + thisItemId;
                break;
							default:
								link = '';
						}
						window.location.href = link;
          });
				}
			}
		}, 'json');
	}

	function listAllActivities() {
		listActivities(currentContentsPage);	
	};

	$('#moreItems').click(function(e) {
		currentContentsPage += 1;
		listActivities(currentContentsPage);	
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
							$('#teamName').text(teamName);
							listAllActivities();
						}
					});	
				} else {
					listAllActivities();
				}
      }
  });
};
