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
	var notebookId;
	var itemPosition;
	var notebookPageParts = itemId.split(':');
  notebookPageParts.splice(-1, 1);
	var notebookPageMajorPart = notebookPageParts.join(':');
	var isBlankPage = false;

	notebookId = notebookPageMajorPart.replace("np","n");

  function setIsATeamItem(thisTeamKey ,thisTeamSearchKey) {
    isATeamItem = true;
    teamKey = thisTeamKey;
    teamSearchKey = thisTeamSearchKey;
  };

	function getNotebookPageNumberFromId(thisItemId) {
		var itemIdParts = thisItemId.split(':');
		pageNumber = parseInt(itemIdParts[itemIdParts.length-1]);
		return pageNumber;
	}

	var currentPageNumber = getNotebookPageNumberFromId(itemId); 

	$('#pageNumberInput').val(currentPageNumber);
	setTimeout(checkUploadDownlodQueue, 1000);

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

	function getNotebookPageItem(thisItemId, thisPrivateKey, thisSearchKey) {
		history.pushState({},"","/notebook/p/"+thisItemId);
    getPageItem(thisItemId, expandedKey, thisPrivateKey, thisSearchKey, function(err, item){
      if(err) {
				$('#pageNumberInput').val(currentPageNumber);
        alert(err);
      } else {
				itemId = thisItemId;
				currentPageNumber = getNotebookPageNumberFromId(itemId);
				
				if((currentPageNumber % 2) === 0){
					$('.notebookPagePanel').css('border-radius', '0 20px 20px 0');
				} else {
					$('.notebookPagePanel').css('border-radius', '20px 0 0 20px');
				}
				$('#pageNumberInput').val(currentPageNumber);	
       	if(!item) {
          console.log('Empty Page');
          isBlankPage = true;
         // initializePageControls();
        }
      }
    });
	}

  $('#gotoCoverBtn').click(function(e){
    e.preventDefault();
    $('#gotoContentsBtn').trigger('blur');
    window.location.href = '/notebook/' + notebookId + '?initialDisplay=cover';
    return false;
  });

	$('#gotoFirstItemBtn').click(function(e){
		$('#gotoFirstItemBtn').trigger('blur');
		getFirstItemInContainer(notebookId, function(err, itemId) {
			if(err) {

			} else {
				if(itemId) {
					getNotebookPageItem(itemId, privateKeyPem, searchKey);
				}
			}
		});
		return false;
	});

	$('#gotoLastItemBtn').click(function(e){
		$('#gotoLastItemBtn').trigger('blur');
		getLastItemInContainer(notebookId, function(err, itemId) {
      if(err) {

      } else {
        if(itemId) {
          getNotebookPageItem(itemId, privateKeyPem, searchKey);
        }
      }
    });
		return false;
	});

  $('#gotoContentsBtn').click(function(e){
  	e.preventDefault();
		$('#gotoContentsBtn').trigger('blur');
    window.location.href = '/notebook/' + notebookId;
    return false;
  });

	var goToPage = function(e) {
    e.preventDefault();
    var intendedPageNumber = $('#pageNumberInput').val();
    var intendedItemId = notebookPageMajorPart + ':' + intendedPageNumber;

    getNotebookPageItem(intendedItemId, privateKeyPem, searchKey);

    $('#gotoPageBtn').trigger('blur');
		$('#pageNumberInput').trigger('blur');
    return false;
	};
	
	$('#gotoPageBtn').click(goToPage);
	$('#pageNumberInput').on('change', goToPage);

	$('#nextPageBtn').click(function(e){
		e.preventDefault();
		var intendedPageNumber = currentPageNumber + 1;
		var intendedItemId = notebookPageMajorPart + ':' + intendedPageNumber;

		getNotebookPageItem(intendedItemId, privateKeyPem, searchKey);
 
		$(e.target).trigger('blur');
		return false;
	});

	$('#previousPageBtn').click(function(e){
    e.preventDefault();
    var intendedPageNumber = currentPageNumber - 1;
		if(intendedPageNumber > 0) {
    	var intendedItemId = notebookPageMajorPart + ':' + intendedPageNumber;
    	getNotebookPageItem(intendedItemId, privateKeyPem, searchKey);
		} else {
			window.location.href = '/notebook/' + notebookId;
		}
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
				getNotebookPageItem(itemId, thisPrivateKey, thisSearchKey); 
				positionPageNavigationControls();
			}
	});
};

