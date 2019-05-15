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
	var itemPosition;

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
	}

  initializePageControlsCallback({
    handleEditorStateChanged:handleEditorStateChanged,
    setupContainerPageKeyValue: setupContainerPageKeyValue,
		pkiDecrypt: pkiDecrypt,
		setIsATeamItem: setIsATeamItem
  });

	$('#nextItemBtn').click(function(e) {
		getNextItemInContainer(itemCopy.container, itemCopy.position, function(err, itemId) {
			if(err) {
			
			} else {
				goGetItem(itemId);				
			}
		});
		return false;
	});

	$('#previousItemBtn').click(function(e) {
		getPreviousItemInContainer(itemCopy.container, itemCopy.position, function(err, itemId) {
      if(err) {
      
      } else {
        goGetItem(itemId);
      }
    });
    return false;
	});

	$('#gotoContainerCoverBtn').click(function(e) {
		goGetItemCover(itemCopy.container);
  });

	$('#gotoContainerContentsBtn').click(function(e) {
		goGetItemContents(itemCopy.container);
  });
	
 	bSafesPreflight(function(err, key, thisPublicKey, thisPrivateKey, thisSearchKey) {
			if(err) {
				alert(err);
			} else {
				expandedKey = key;
				publicKeyPem = thisPublicKey;
        privateKeyPem = thisPrivateKey;
				getPageItem(itemId, expandedKey, thisPrivateKey, thisSearchKey,  function(err, item){
					if(err){
						alert(err);
					} else {
						itemPosition = item.position;
					}
				}); 
				positionItemNavigationControls();
			}
	});
};
