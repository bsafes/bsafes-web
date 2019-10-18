function loadPage(){
	
	var activitiesFunctions = {
		$this: this,
		createSingleActivity: function(source, parentElement) {
		  if (!source) return;
			var $resultItem = $('.resultItemTemplate').clone().removeClass('resultItemTemplate hidden').addClass('resultItem');
			$resultItem.attr('id', source.id);
			var resultItem = source;
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
			if (source.version === 1) {
				updatedText = "Creation";
			} else if(source.version < 0) {
				updatedText = source.update;
			} else {
				updatedText = "Updated " + source.update;
			}
			$resultItem.find('.itemVersionUpdate').text(updatedText);
			var updatedBy = source.displayName?source.displayName:source.updatedBy;
			updatedBy = DOMPurify.sanitize(updatedBy);
			$resultItem.find('.itemVersionUpdatedBy').text(updatedBy);
			var updatedTime = formatTimeDisplay(source.createdTime);
			$resultItem.find('.itemVersionUpdatedTime').text(updatedTime);
			if(updatedTime.charAt(updatedTime.length - 1) === 'o') {
				$resultItem.find('.itemVersionUpdatedTimeStamp').text(timeToString(source.createdTime));
			}
			if (parentElement) {
				parentElement.append($resultItem);
				$('.resultItems').append(parentElement);
			} else {
				$('.resultItems').append($resultItem);
			}
			
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
		},
		groupAcitivities: function(hits) {
			var $this = this;
			var groups = $this.separateActivities(hits);
			$this.createGroupActivities(groups);
			$this.makeGroupsCollapsable();
		},
		separateActivities: function(activities) {
			// var $this = this;
			var previousId;
			return activities.reduce((acc, activity) => {
				if (previousId !== activity._source.id) {
					previousId = activity._source.id;
					acc.push([activity]);
				} else {
					acc[acc.length - 1].push(activity)
				}
				return acc;
			}, []);
		},
		createGroupActivities: function(groups) {
			var $this = this;
			// create a single listing with arrow and attach the event with that arrow
			
			//  check if there are more than one groups
			if (groups.length > 1) {
				groups.forEach(function(group) {
					// check if this group has more than one items
					if (group.length > 1) {
						var $container = $("<div></div>").addClass('groupContainer');
						// yes group has more than one item
						group.forEach(function(item) {
							// create item for each item
							$this.createSingleActivity(item._source, $container);
						});
					} else {
						// no group has only one item
						var item = group[0];
						$this.createSingleActivity(item._source, null);
					}
				});
			} else {
				// there is only one group
				
				// check if group has more than 1 items
				if (groups[0] && groups[0].length > 1) {
					// group has more than 1 items, need to create a group activity.
					var $container = $("<div></div>").addClass('groupContainer');
					groups[0].forEach(function(item) {
						// create item for each item
						$this.createSingleActivity(item._source, $container);
					})
				} else {
					var source = groups[0] && groups[0]._source;
					if (!source) {
						source = groups[0][0]._source;
					}
					// group does not have more than 1 item. create a single activity
					if (source) {
						$this.createSingleActivity(source, null);
					}
				}
			}
			
			// create other activities normally.
		},
		makeGroupsCollapsable: function() {
			var $this = this;
			var arrowUp = $("<div class='text-center up-arrow hidden'><i class='fa fa-caret-up'></i></div>");
			var arrowDown = $("<div class='text-center down-arrow'><i class='fa fa-caret-down'></i></div>");
			arrowUp.off().on('click', $this.hideGroupContainer);
			arrowDown.off().on('click', $this.showGroupContainer);
			$('.up-arrow').remove();
			$('.down-arrow').remove();
			var $firstElements = $('.groupContainer a:first-child');
			$firstElements.after(arrowUp, arrowDown);
			$this.hideAllCollapsibles();
		},
		hideGroupContainer: function(e) {
			e.preventDefault();
			var $this = $(this);
			// $this.closest('.groupContainer').slideUp();
			var collapsible = $this.closest('.groupContainer');
			collapsible.find('a').slice(1).hide();
			$this.addClass('hidden');
			$this.closest('.groupContainer').find('.down-arrow').removeClass('hidden');
		},
		showGroupContainer: function(e) {
			e.preventDefault();
			var $this = $(this);
			// $this.closest('.groupContainer').slideUp();
			var collapsible = $this.closest('.groupContainer');
			collapsible.find('a').slice(1).show();
			$this.addClass('hidden');
			$this.closest('.groupContainer').find('.up-arrow').removeClass('hidden');
		},
		hideAllCollapsibles: function() {
			$('.groupContainer a:not(:first-child)').hide();
		}
	};
	
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
				activitiesFunctions.groupAcitivities(hits);
			}
		}, 'json');
	};

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