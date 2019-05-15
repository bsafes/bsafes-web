function loadPage(){
  var pki = forge.pki;
  var rsa = forge.pki.rsa;

	var expandedKey;
	var teamKey;
	var teamSearchKey;
  var publicKeyPem;
  var privateKeyPem;
	var searchKey;

	var itemId = $('#itemId').text();
	var isATeamItem = false;
	var folderId;
	var itemPosition;
	var isBlankPage = false;

	var addAction;

	setTimeout(checkUploadDownlodQueue, 1000);

	function setIsATeamItem(thisTeamKey ,thisTeamSearchKey) {
		isATeamItem = true;
		teamKey = thisTeamKey;
		teamSearchKey = thisTeamSearchKey;
	};

	function setupContainerPageKeyValue(key, value) {
		switch(key) {
			case 'itemId':
				itemId = value;
				break;
			case 'itemPosition':
				itemPosition = value;
				break;
			default:
		}
	};

	var handleEditorStateChanged = function(event){
    console.log(event);
    if(event === 'Editor is initialized') {
      $('.pageNavigation').addClass('hidden');
    } else if(event === 'Editor is destroyed'){
     $('.pageNavigation').removeClass('hidden');
    }
  };

	var pkiDecrypt = function(encryptedData) {
    var privateKeyFromPem = pki.privateKeyFromPem(privateKeyPem);
    var decryptedData = privateKeyFromPem.decrypt(encryptedData);
    var decodedData = forge.util.decodeUtf8(decryptedData);
    return decodedData;
  };
	
	initializePageControlsCallback({
		handleEditorStateChanged:handleEditorStateChanged, 
		setupContainerPageKeyValue: setupContainerPageKeyValue,
    pkiDecrypt: pkiDecrypt,
		setIsATeamItem: setIsATeamItem
	});
	
  var handleAddAction = function(e) {
    var $addTargetItem = $(e.target).closest('.resultItem');

    if($(e.target).hasClass('addBefore')) {
      addAction = 'addAnItemBefore';
    } else if($(e.target).hasClass('addAfter')) {
      addAction = 'addAnItemAfter';
    }
    console.log(addAction);
		$('.titleModal').modal('toggle');
  }

	$('.addAction').click(function(e) {
		handleAddAction(e);
	});

	function createANewFolderPage(e) {
  	$('.titleModal').modal('toggle');
  	var titleStr = $('.titleInput').val();
  	var title = '<h2>' + $('.titleInput').val() + '</h2>';
  	var encodedTitle = forge.util.encodeUtf8(title);

  	var salt = forge.random.getBytesSync(128);
  	var randomKey = forge.random.getBytesSync(32);
  	var itemKey = forge.pkcs5.pbkdf2(randomKey, salt, 10000, 32);
  	var itemIV = forge.random.getBytesSync(16);

  	var envelopeIV = forge.random.getBytesSync(16);
		var ivEnvelopeIV = forge.random.getBytesSync(16);
		var envelopeKey = isATeamItem ? teamKey:expandedKey;

  	var keyEnvelope = encryptBinaryString(itemKey, envelopeKey, envelopeIV);
  	var ivEnvelope = encryptBinaryString(itemIV, envelopeKey, ivEnvelopeIV);
  	var encryptedTitle = encryptBinaryString(encodedTitle, itemKey, itemIV);

		var thisSearchKey = isATeamItem ? teamSearchKey:searchKey;
  	var titleTokens = stringToEncryptedTokens(titleStr, thisSearchKey);

  	$('.titleInput').val('');

  	var addActionOptions;
    var targetItem = itemId;
    var targetContainer = folderId;
    var targetPosition = itemPosition;

    addActionOptions = {
      "targetContainer" : targetContainer,
      "targetItem": targetItem,
      "targetPosition": targetPosition,
      "type": "Page",
      "keyEnvelope": keyEnvelope,
      "ivEnvelope": ivEnvelope,
      "envelopeIV": envelopeIV,
			"ivEnvelopeIV": ivEnvelopeIV,
      "title": encryptedTitle,
      "titleTokens": JSON.stringify(titleTokens)
    };		
		
		var thisAddAction = addAction;
		$.post('/memberAPI/' + addAction,
      addActionOptions,
      function(data, textStatus, jQxhr) {
        if(data.status === 'ok') {
					var item = data.item;
					window.location.href = '/folder/p/' + item.id;
        }
      }, 'json');
	};

  $('#createAnItem').click(function(e) {
    e.preventDefault();
		createANewFolderPage(e);	
		return false;
  });

	function getFolderPageItem(thisItemId, thisPrivateKey, thisSearchKey) {
		history.pushState({},"","/folder/p/"+thisItemId);
    getPageItem(thisItemId, expandedKey, thisPrivateKey, thisSearchKey, function(err, item){
      if(err) {
        alert(err);
      } else {
				itemId = thisItemId;
				itemPosition = item.position;
				folderId = item.container;

				
      }
    });
	}
  $('#gotoCoverBtn').click(function(e){
  	e.preventDefault();
    window.location.href = '/folder/' + folderId + '?initialDisplay=cover';
    return false;
  });

	$('#gotoContentsBtn').click(function(e){
    e.preventDefault();
    window.location.href = '/folder/' + folderId + '?initialDisplay=contents';
    return false;
  });

  $('#gotoFirstItemBtn').click(function(e){
    $('#gotoFirstItemBtn').trigger('blur');
    getFirstItemInContainer(folderId, function(err, itemId) {
      if(err) {

      } else {
        if(itemId) {
          getFolderPageItem(itemId, privateKeyPem, searchKey);
        }
      }
    });
    return false;
  });

  $('#gotoLastItemBtn').click(function(e){
    $('#gotoLastItemBtn').trigger('blur');
    getLastItemInContainer(folderId, function(err, itemId) {
      if(err) {

      } else {
        if(itemId) {
          getFolderPageItem(itemId, privateKeyPem, searchKey);
        }
      }
    });
    return false;
  });

	function addBlankPage(preposition, targetPosition) {
		if(preposition === 'before') {


		} else if(preposition === 'after') {
			cleanPageItem();
			isBlankPage = true;
			setupNewItemKey();
			setupPageControlsKeyValue('isBlankPageItem', true);
      initializePageControls();
		} 
	}

	$('#nextPageBtn').click(function(e){
		e.preventDefault();

		$.post('/memberAPI/getNextFolderPage', {
			folderId: folderId,
			itemId: itemId,
			itemPosition: itemPosition
		}, function(data, textStatus, jQxhr) {
      if(data.status === 'ok') {
				var itemId = data.itemId;
				if(itemId !== 'EndOfFolder'){
					getFolderPageItem(itemId, privateKeyPem, searchKey);
				} else {
					addBlankPage('after', itemPosition);
					itemId = 'TBD';
					itemPosition = 0;	
					$('#nextPageBtn').addClass('hidden');
				}	
      }
    }, 'json');

		$(e.target).trigger('blur');
		return false;
	});

	$('#previousPageBtn').click(function(e){
    e.preventDefault();

    $.post('/memberAPI/getPreviousFolderPage', {
      folderId: folderId,
      itemId: itemId,
      itemPosition: itemPosition
    }, function(data, textStatus, jQxhr) {
      if(data.status === 'ok') {
        var itemId = data.itemId;
        if(itemId !== 'EndOfFolder'){
					getFolderPageItem(itemId, privateKeyPem, searchKey);
        } else {
					window.location.href = '/folder/' + folderId + '?initialDisplay=contents';
				}
      }
    }, 'json');  
 
		$(e.target).trigger('blur');
		return false;
  });

	bSafesPreflight(function(err, key, thisPublicKey, thisPrivateKey, thisSearchKey) {
			if(err) {
				alert(err);
			} else {
				expandedKey = key;
				publicKeyPem = thisPublicKey;
        privateKeyPem = thisPrivateKey;
				searchKey = thisSearchKey;
				getFolderPageItem(itemId, thisPrivateKey, thisSearchKey); 
				positionPageNavigationControls();
			}
	});
};
