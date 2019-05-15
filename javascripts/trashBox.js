function loadPage(){
	var pki = forge.pki;
	var rsa = forge.pki.rsa;

	var expandedKey;
	var privateKePem;
 	var isATeamItem = false;
	var teamKey;

  var teamSpace = $('#teamSpace').text();
	var teamSpaceParts = teamSpace.split(':');
	teamSpaceParts.splice(-2, 2);
	var teamId = teamSpaceParts.join(':');
	var teamName;
	var trashBoxId = $('#trashBoxId').text();
	var itemsPerPage = 20;	
	var currentSelectedItems;

	function showPath() {
		$('.pathItem, .pathItemName').remove();
    $('.newTab, .newTabHint').remove();
		var pathItemIcon;
		var pathItemLink;

		$pathItem = $('.pathItemTemplate').clone().removeClass('pathItemTemplate hidden').addClass('pathItem');
		if(isATeamItem) {
			pathItemIcon = teamName;
			pathItemLink = '/team/' + teamId;
		} else {
			pathItemIcon = 'Personal';
      pathItemLink = '/';
		}
		pathItemIcon = DOMPurify.sanitize(pathItemIcon);
		$pathItem.find('.itemInSamePage').html(pathItemIcon);
    $pathItem.find('.itemInSamePage').attr('href', pathItemLink);
    $pathItem.addClass('pathSpace');
		var $newTab = $('.newTabTemplate').clone().removeClass('newTabTemplate hidden').addClass('newTab');
    $newTab.find('a').text(pathItemIcon);
    $newTab.find('a').attr('href', pathItemLink);
    $('.newTabDropdownMenu').prepend($newTab);
		$('.pathItemsList').append($pathItem);

		$pathItem = $('.pathItemTemplate').clone().removeClass('pathItemTemplate hidden').addClass('pathItem');
		pathItemIcon = '<i class="fa fa-trash" aria-hidden="true"></i>';
		$pathItem.html(pathItemIcon);
		$pathItem.addClass('active');
		$('.pathItemsList').append($pathItem);

		var $newTab = $('.newTabHintTemplate').clone().addClass('newTabHint').removeClass('hidden');
    $('.newTabDropdownMenu').prepend($newTab);
	}

	function getItem(done) {
		if(teamSpace.substring(0, 1) === 'u') {
			showPath();
			done();		
		} else {
			isATeamItem = true;
			showLoadingInTrashBox();
			getTeamData(teamId, function(err, team) {
				if(err) {
				
				} else {
					var teamKeyEnvelope = team.teamKeyEnvelope;
        	var privateKeyFromPem = pki.privateKeyFromPem(privateKeyPem);
        	var encodedTeamKey = privateKeyFromPem.decrypt(teamKeyEnvelope);
        	teamKey = forge.util.decodeUtf8(encodedTeamKey);
        	var encryptedTeamName = team.team._source.name;
        	var teamIV = team.team._source.IV;
        	teamName = forge.util.decodeUtf8(decryptBinaryString(encryptedTeamName, teamKey, teamIV));
					teamName = DOMPurify.sanitize(teamName);
        	if(teamName.length>20) {
          	var displayTeamName = teamName.substr(0, 20);
        	} else {
          	var displayTeamName = teamName;
        	}
        	$('.navbarTeamName').text(displayTeamName);
					showPath();
					done();
				}
				hideLoadingInTrashBox();
			}); 
		}
	}

  var listItems = function (pageNumber) {
		showLoadingInTrashBox(); 
    $.post('/memberAPI/getContainerContents',{ 
      itemId: trashBoxId, 
      size: itemsPerPage, 
      from: (pageNumber -1) * itemsPerPage  
    }, function(data, textStatus, jQxhr ){ 
      if(data.status === 'ok') { 
				deselectItems(null);
        currentContentsPage = pageNumber; 
				
        $('.resultItems').empty(); 
        if(data.hits) { 
          console.log(data.hits); 
          var total = data.hits.total; 
           
          var hits = data.hits.hits; 
          $('.containerContentsPanel').removeClass('hidden'); 
          displayHits("listAll", hits, {inTrash:true, disableLink:true}); 
          updatePagination("listAll", currentContentsPage, total, itemsPerPage, null); 
        } 
      }
			hideLoadingInTrashBox(); 
    }, 'json'); 
  };

  var decryptResult = function(encryptedData, iv) { 
    if(isATeamItem) {  
      var decryptedData = decryptBinaryString(encryptedData, teamKey, iv); 
    } else { 
      var decryptedData = decryptBinaryString(encryptedData, expandedKey, iv); 
    } 
    return decryptedData; 
  } 

	var updateToolbar = function(selectedItems) {
		currentSelectedItems = selectedItems;
		if(selectedItems.length) {
			$('.actionsOnSelectedRow').removeClass('hidden');
			$('.actionsOnAllRow').addClass('hidden');
		} else {
			$('.actionsOnSelectedRow').addClass('hidden');
      $('.actionsOnAllRow').removeClass('hidden');
		}	
	};

	initContainerFunctions(listItems, null, decryptResult, updateToolbar, null, showLoadingContents, hideLoadingContents);

	$('#restoreAll').click(function(e) {
		var selectedItems = [];
		showLoadingInTrashBox();

		$resultItems = $('.resultItem');
		for(var i=0; i < $resultItems.length; i++) {
			$resultItem = $($resultItems[i]);
			var itemPosition = $resultItem.data('position');
    	var itemId = $resultItem.attr('id');
    	var itemContainer = $resultItem.data('container');
			var itemOriginalContainer = $resultItem.data('originalContainer');
			var itemOriginalPosition = $resultItem.data('originalPosition');
    	var item = {id:itemId, container:itemContainer, position:itemPosition, originalContainer: itemOriginalContainer, originalPosition: itemOriginalPosition};	
			selectedItems.push(item);
		}
		if(selectedItems.lengthi === 0) {
			hideLoadingInTrashBox();
		} else {
			$.post('/memberAPI/restoreItemsFromTrash', {
				teamSpace: teamSpace,
				selectedItems:JSON.stringify(selectedItems)
			}, function(data, textStatus, jQxhr) {
				if(data.status === 'ok') {
					setTimeout(function() {
						hideLoadingInTrashBox();	
						listItems(1);
        	}, 1500);
				} 
			}, 'json');
		}
		return false;
	});

	$('#restoreSelected').click(function(e) {
		var $checkedItems = $('input:checked');
		var selectedItems = [];
		showLoadingInTrashBox();
	
		for(var i=0; i < $checkedItems.length; i++) {
			var $resultItem = $($checkedItems[i]).closest('.resultItem');		
			var itemPosition = $resultItem.data('position');
      var itemId = $resultItem.attr('id');
      var itemContainer = $resultItem.data('container');
      var itemOriginalContainer = $resultItem.data('originalContainer');
      var itemOriginalPosition = $resultItem.data('originalPosition');
      var item = {id:itemId, container:itemContainer, position:itemPosition, originalContainer: itemOriginalContainer, originalPosition: itemOriginalPosition};
      selectedItems.push(item);
		}		

		$.post('/memberAPI/restoreItemsFromTrash', {
      teamSpace: teamSpace,
      selectedItems:JSON.stringify(selectedItems)
    }, function(data, textStatus, jQxhr) {
      if(data.status === 'ok') {
        setTimeout(function() {
          hideLoadingInTrashBox();
          listItems(1);
        }, 1500);
      } 
    }, 'json');
		
		return false;
	});

	$('#emptyAll').click(function(e) {
		showLoadingInTrashBox();
		var selectedItems = [];
		var trashedItem = {id: trashBoxId};	
		selectedItems.push(trashedItem);
		$.post('/memberAPI/emptyTrashBoxItems', {
			teamSpace: teamSpace,
			selectedItems:JSON.stringify(selectedItems)
		}, function(data, textStatus, jQxhr) {
      if(data.status === 'ok') {
        setTimeout(function() {
          hideLoadingInTrashBox();
					var url = '/trashBox/' + teamSpace;
					window.location.href = url;
        }, 1500);
      }
    }, 'json');

		return false;
	});

	$('#emptySelected').click(function(e) {
		showLoadingInTrashBox();
		$.post('/memberAPI/emptyTrashBoxItems', {
      teamSpace: teamSpace,
      selectedItems:JSON.stringify(currentSelectedItems)
    }, function(data, textStatus, jQxhr) {
      if(data.status === 'ok') {
        setTimeout(function() {
          hideLoadingInTrashBox();
          listItems(1);
        }, 1500);
      }
    }, 'json');	

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
				getItem(function() {
					if(trashBoxId !== "") {
						listItems(1);
  				}
				});
      }
  });
};
