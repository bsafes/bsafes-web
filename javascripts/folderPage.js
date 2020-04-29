function loadPage(){
  var pki = forge.pki;
  var rsa = forge.pki.rsa;

	var expandedKey;
	var teamKey;
	var teamSearchKey;
  var publicKeyPem;
  var privateKeyPem;
	var searchKey;
  var itemSpace;
	var itemId = $('#itemId').text();
	var isATeamItem = false;
	var folderId;
	var itemPosition;
	var isBlankPage = false;

	var addAction;

	setTimeout(checkUploadDownlodQueue, 1000);
  //setTimeout(backupContentsInLocalStorage, 3000);
  console.log('itemId', itemId);

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

  $('#moreActionsBtn').click(function(e) {
    $(e.target).trigger('blur');
    $('.itemBottomToolbar').removeClass('hidden');
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
      "keyEnvelope": forge.util.encode64(keyEnvelope),
      "ivEnvelope": forge.util.encode64(ivEnvelope),
      "envelopeIV": forge.util.encode64(envelopeIV),
			"ivEnvelopeIV": forge.util.encode64(ivEnvelopeIV),
      "title": forge.util.encode64(encryptedTitle),
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
    prepareSkeletonScreen();
    getPageItem(thisItemId, expandedKey, thisPrivateKey, thisSearchKey, function(err, item){
      if(err) {
        alert(err);
      } else {
				itemId = thisItemId;
				itemPosition = item.position;
				folderId = item.container;

        var info = {
            id: item.id,
            container: item.container,
            position: item.position,
            keyEnvelope: item.keyEnvelope,
            envelopeIV: item.envelopeIV,
            ivEnvelope: item.ivEnvelope,
            ivEnvelopeIV: item.ivEnvelopeIV,
            title: item.title,
            version: item.version,
            totalItemSize: item.usage.totalItemSize
        };
        itemInfo.push(info);

        itemSpace = item.space;
				
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

  function addItemBottomToolbar() 
  {
    var htmlItemBottomToolbar = `
      <div class="row itemBottomToolbar hidden">
        <div class="col-xs-12 col-sm-8 col-sm-offset-2">
          <div class="row">
            <div class="col-xs-3 col-xs-offset-3 col-sm-2 col-sm-offset-6">
              <div class="text-center">
                <a href="#" class="btn btn-link btn-xs margin0Px" id="moveAnItemBtn"><i class="fa fa-2x fa-hand-o-right whiteText" aria-hidden="true"></i></a>
              </div>
              <h6 class="text-center margin0Px whiteText">Move</h6>
            </div>
            <div class="col-xs-3 col-sm-2">
              <div class="text-center">
                <a href="#" class="btn btn-link btn-xs margin0Px" id="trashAnItemBtn"><i class="fa fa-2x fa-trash whiteText" aria-hidden="true"></i></a>
              </div>
              <h6 class="text-center margin0Px whiteText">Trash</h6>
            </div>
            <div class="col-xs-3 col-sm-2">
              <div class="text-center">
                <a href="#" class="btn btn-link btn-xs margin0Px" id="cancelMoreActionsBtn"><i class="fa fa-2x fa-remove whiteText" aria-hidden="true"></i></a>
              </div>
              <h6 class="text-center margin0Px whiteText">Cancel</h6>
            </div>  
          </div>
        </div>
      </div>
    `;
    $('.bSafesBody').append(htmlItemBottomToolbar);

    $('#cancelMoreActionsBtn').click(function(e) {
      $(e.target).trigger('blur');
      $('.itemBottomToolbar').addClass('hidden');
    });

    $('#trashAnItemBtn').click(function(e) {
        $(e.target).trigger('blur');
        handleTrashAnItem(e);
    });

    $('#moveAnItemBtn').click(function(e) {
      $(e.target).trigger('blur');
        handleMoveAnItem(e);
    });
  }

  function addTrashAnItemModal()
  {
    var htmlTrashAnItemModal = `
      <div class="modal fade" id="trashAnItemModal" role="dialog">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <button type="button" class="close closeTrashModal" data-dismiss="modal" aria-hidden="true">×</button>
              <h4 class="modal-title">Are your sure?</h4>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <input class="form-control" id="trashInput" type="text" placeholder="Yes" value="No">
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-default closeTrashModal" data-dismiss="modal">Close</button>
              <button type="button" class="btn btn-primary" id="goTrashAnItemBtn">Go</button>
            </div>
          </div>
        </div>
      </div>
    `;

    $('.bSafesBody').append(htmlTrashAnItemModal);
  }

  function addMoveAnItemModal()
  {
    var htmlMoveAnItemModal = `
      <div class="modal fade" id="moveAnItemModal" tabindex="-1" role="dialog" aria-labelledby="moveItemsModalLabel" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <button type="button" class="close" id="closeMoveItemsModal" data-dismiss="modal" aria-hidden="true">×</button>
              <h4 class="modal-title" id="moveItemsModalLabel">Move to</h4>
            </div>
            <div class="modal-body">
              <div class="moveItemsPathRow">
                <ul class="moveItemsPathItemsList breadcrumb">
                </ul>
                <li class="moveItemsPathItemTemplate hidden"><a href="#" class="">Container</a></li>
                <li class="moveItemsPathItemNameTemplate hidden"></li>
              </div>
              <div class="warningMessage hidden">
                <p class="E74C3CText">Oops, you could only drop pages in a folder!</p>
              </div>
              <div class="list-group containersList">
              
              </div>
              <div class="text-center">
                <a href="#" class="hidden" id="moreContainersBtn">More</a>
              </div> 
              <a href="#" class="boxTemplate list-group-item hidden">
                <i class="fa fa-archive safeItemTypeIcon" aria-hidden="true"></i><em class="fontSize18Px">Box</em>
              </a>
              <a href="#" class="folderTemplate list-group-item hidden">
                <i class="fa fa-folder-o safeItemTypeIcon" aria-hidden="true"></i><em class="fontSize18Px">Folder</em>
              </a>
              <div class="text-right">
                <a href="#" class="btn btn-primary btn-sm" id="dropAnItemBtn">Drop</a>
              </div>
            </div>
          </div>
          <!-- /.modal-content -->
        </div>
        <!-- /.modal-dialog -->
      </div>
    `;

    $('.bSafesBody').append(htmlMoveAnItemModal);
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

  var decryptResult = function(encryptedData, iv) {
    var isATeamSpace = true;
      if (isATeamSpace) {
          var decryptedData = decryptBinaryString(encryptedData, teamKey, iv);
      } else {
          var decryptedData = decryptBinaryString(encryptedData, expandedKey, iv);
      }
      return decryptedData;
  };

  //initContainerFunctions(listItems, searchByTokens, decryptResult, updateToolbar, updateKeyValue, showLoading, hideLoading);
  initContainerFunctions('', '', decryptResult, '', '', showLoading, hideLoading);


  prepareSkeletonScreen();

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
        addItemBottomToolbar();
        addTrashAnItemModal();
        addMoveAnItemModal();
			}
	});
};
