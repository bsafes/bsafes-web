function loadPage(){
  var pki = forge.pki;
  var rsa = forge.pki.rsa;

	var oldVersion;
	var currentVersion;
	var itemCopy;
	var teamId;
	var teamName;
	var isATeamItem = false;
  var itemSpace;
	var itemId = $('#itemId').text();
	var itemType = itemId.split(':')[0];
  var itemTags=[];


	var expandedKey;
  var publicKeyPem;
  var privateKePem;
	var searchKey;
	var teamKey;
	var teamSearchKey;

	var itemKey;
	var itemIV;

	var isFirstTimeAccessed = true;
  var currentEditorId;
  var currentEditor = null;
  var originalEditorContent;
	var lastAccessedPage;

	var currentMode;
	
	var selectedItemType = 'undefined';
  var addAction = 'addAnItemOnTop';
  var $addTargetItem;

	var currentContentsPage = 1;	
	var itemsPerPage = 20;
	var lastSearchTime;
	var lastSearchTokensStr;

	var initialDispaly = $('#initialDisplay').text();
	var isCover = false;
	if(initialDispaly === "cover") {
		isCover = true;
	} 
	var firstResultItemLink;

  function setOldVersion(version) { 
    oldVersion = version; 
    $('#itemVersion').text("v." + version); 
  }; 
 
  function setCurrentVersion(version) { 
    if(!version) { 
      $('#itemVersion, #itemVersionsHistory').addClass('hidden'); 
      return; 
    } 
    $('#itemVersion, #itemVersionsHistory').removeClass('hidden'); 
    currentVersion = version; 
    $('#itemVersion').text("v." + version); 
    initializeContainerItemVersionsHistory();
  };

  function initializeContainerItemVersionsHistory() {
    initializeItemVersionsHistory(itemId, function(thisItemVersion) {
			if(thisItemVersion !== currentVersion || thisItemVersion !== oldVersion) {
      	getItem(function(err, item){
        	if(err){
          	alert(err);
        	} else {
        	}
      	}, thisItemVersion);
			}
    });
  };

	initializeContainerItemVersionsHistory();

  function createNewItemVersionForContainer() {
    createNewItemVersion(itemId, itemCopy, currentVersion,  0, function(err, data) {
      if(err) {
        alert(err.code);
        return;
      }
      setCurrentVersion(itemCopy.version);
      if((itemCopy.update !== "tags") && currentEditor) doneEditing();
      if((itemCopy.update === "tags") && (!$('.tagsConfirmRow').hasClass('hidden'))) $('.tagsConfirmRow').addClass('hidden');
    });
  };

  var	selectedDiaryContentStartPosition;
  var selectedDiaryContentEndPosition;
	
	function resetSelectedDiaryMonth() {
    var thisDate = new Date();
    var thisYear = thisDate.getFullYear();
    var thisMonth = thisDate.getMonth() + 1;
    if(thisMonth < 10 ) {
      diaryContentMonth = thisYear + "0" + thisMonth;
    } else {
      diaryContentMonth = thisYear.toString() + thisMonth;
    }
    selectedDiaryContentStartPosition = diaryContentMonth + "01";
    selectedDiaryContentEndPosition = diaryContentMonth + "31";	
	}

	if(itemId.substring(0, 2) === "d:") {
		$diaryContentMonth = $('#diaryContentMonth');
		if($diaryContentMonth.length) {
			var diaryContentMonth = $diaryContentMonth.text();
			selectedDiaryContentStartPosition = diaryContentMonth + "01";
			selectedDiaryContentEndPosition = diaryContentMonth + "31";
		} else {
			resetSelectedDiaryMonth();
		}
	}

	$('#gotoCoverBtn').click(function(e){
		isCover = true;

		$('.contentsControlsPanel').addClass("hidden");
		$(".nextPageBtn").removeClass("hidden");
		$('#gotoCoverBtn').trigger('blur');
		$('.containerContentsPanel').addClass('hidden');
		$('.containerCoverPanel').removeClass('hidden');
		$('#gotoCoverBtn').addClass('hidden');
		$('#gotoContentsBtn').removeClass('hidden');
		positionPageNavigationControls();
		if(!itemCopy) {
			showLoadingIn($('.containerCoverPanel'));
			getItem(function() {
				hideLoadingIn($('.containerCoverPanel'));
				setBoxControlsPanel(itemCopy.container);
			});
		} else {
			setBoxControlsPanel(itemCopy.container);
		}
    return false;
  });

  function getItem(done, thisVersion) {
		oldVersion = "undefined";
		var options = {itemId: itemId};
		if(thisVersion) {
      options.oldVersion = thisVersion;
    }	
    $.post('/memberAPI/getItemData',
   		options 
    , function(data, textStatus, jQxhr ){
      if(data.status === 'ok') {
        if(data.item) {	
					itemCopy = data.item;
					if(!thisVersion) {
            setCurrentVersion(itemCopy.version);
          } else {
            setOldVersion(thisVersion);
          }
          console.log(data.item);

          var item = data.item;
					itemSpace = item.space;
					initCurrentSpace(itemSpace);

					function decryptItem(envelopeKey) {
          	itemKey = decryptBinaryString(item.keyEnvelope, envelopeKey, item.envelopeIV);
          	itemIV = decryptBinaryString(item.ivEnvelope, envelopeKey, item.ivEnvelopeIV);

						$('#tagsInput').off();
          	itemTags = [];
          	if(item.tags && item.tags.length>1){
            	var encryptedTags = item.tags;
            	encryptedTags.splice(-1, 1);
            	for(var i=0; i<item.tags.length; i++) {
              	var encryptedTag = encryptedTags[i];
              	var encodedTag = decryptBinaryString(encryptedTag, itemKey, itemIV);
              	var tag = forge.util.decodeUtf8(encodedTag);
              	itemTags.push(tag);
            	}
          	} 

						$('#tagsInput').tokenfield('setTokens', itemTags);
	
          	initializeTagsInput();

          	$('.container').data('itemId', itemId);
          	$('.container').data('itemKey', itemKey);
          	$('.container').data('itemIV', itemIV);

          	var encodedTitle = decryptBinaryString(item.title, itemKey, itemIV);
          	var title = forge.util.decodeUtf8(encodedTitle);
						title = DOMPurify.sanitize(title);
          	$('.froala-editor#title').html(title);
						document.title = $(title).text(); 
          	lastAccessedPage = item.lastAccessedPage | 1;
						getAndShowPath(itemId, envelopeKey, teamName, document.title); 
          
						initializeEditorButtons();


					}
					if(itemSpace.substring(0, 1) === 'u') {
						$('.navbarTeamName').text("Yours");
						decryptItem(expandedKey);
						if(done) {
            	done();
            	return;
          	}
          } else {
            isATeamItem = true;
            var itemSpaceParts = itemSpace.split(':');
            itemSpaceParts.splice(-2, 2);
            teamId = itemSpaceParts.join(':');
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
	
								var teamSearchKeyEnvelope = team.team._source.searchKeyEnvelope;
								var teamSearchKeyIV = team.team._source.searchKeyIV;

								teamSearchKey = decryptBinaryString(teamSearchKeyEnvelope, teamKey, teamSearchKeyIV);
                decryptItem(teamKey);
							  if(done) {
              		done();
              		return;
            		}
              }
            });
          }
        }
      }
    }, 'json');
  };

  function initializeTagsInput() {
    $('#tagsInput').on('tokenfield:createtoken', function (e) {
      console.log('tokenfield:createtoken'); 
      var data = e.attrs.value.split('|')
    })
    .on('tokenfield:createdtoken', function (e) {
      console.log('tokenfield:createdtoken');
      $('.tagsConfirmRow').removeClass('hidden');
    })
    .on('tokenfield:edittoken', function (e) {
      console.log('tokenfield:edittoken');
    })
    .on('tokenfield:removedtoken', function (e) {
      console.log('tokenfield:removedtoken');
      $('.tagsConfirmRow').removeClass('hidden');
    })
    $('#confirmTagsInputBtn').off();  
    $('#confirmTagsInputBtn').click(function(e){
      e.preventDefault();
      console.log('confirmTagsInputBtn');
      var tags = $('#tagsInput').tokenfield('getTokens');
      var encryptedTags = tokenfieldToEncryptedArray(tags, itemKey, itemIV);
      encryptedTags.push('null');
			var thisSearchKey = isATeamItem ? teamSearchKey:searchKey;
      var tagsTokens = tokenfieldToEncryptedTokens(tags, thisSearchKey);
      
			itemCopy.tags = encryptedTags;
      itemCopy.tagsTokens = tagsTokens;   
			itemCopy.update = "tags";
			createNewItemVersionForContainer();
 
      return false;
    });
   	$('#cancelTagsInputBtn').off(); 
    $('#cancelTagsInputBtn').click(function(e){
      e.preventDefault();
      console.log('cancelTagsInputBtn');
      $('#tagsInput').tokenfield('setTokens', itemTags);
      $('.tagsConfirmRow').addClass('hidden');
      return false;
    });
  }

  function initializeTitleEditor(editor) {
    editor.froalaEditor({key:'1ZSZGUSXYSMZb1JGZ==',
                         toolbarButtons:['align', 'paragraphFormat','undo', 'redo'],
                         toolbarButtonsMD:['align', 'paragraphFormat', 'undo', 'redo'],
                         toolbarButtonsSM:['align', 'paragraphFormat', 'undo', 'redo'],
                         toolbarButtonsXS:['align', 'paragraphFormat', 'undo', 'redo']
                        });
    editorInitialized();
  };

  function editorInitialized() {
    $('.btnSave, .btnCancel').removeClass('hidden');
  }

  function handleBtnWriteClicked(e) {
    e.preventDefault();
    var downloadingImageContainers = $('.downloadingImageContainer');
    downloadingImageContainers.each(function(){
      var imageElement = $(this).find('img');
      $(this).replaceWith(imageElement);
    });
    
    var $downloadingVideoContainers = $('.downloadingVideoContainer');
    $downloadingVideoContainers.each(function(){
      var $downloadVideo = $(this).find('img');
      $(this).replaceWith($downloadVideo);
    });
    
    var id = e.target.id;
    currentEditorId = id; 
    $('.navbar-fixed-top, .btnWrite, .pathRow').addClass('hidden');
    
    var selector = '.froala-editor#' + id;
    currentEditor = $(selector);
    originalEditorContent = currentEditor.html();
    switch(id) {
      case 'title':
        initializeTitleEditor(currentEditor);
        break;    
      case 'content':
        initializeContentEditor(currentEditor);
        break;
      default:
    };
  };

  function doneEditing() {
		currentEditor.LoadingOverlay('hide');
    currentEditor.froalaEditor('destroy');
    
    currentEditor = null;
    $('.btnSave, .btnCancel').addClass('hidden');
    $('.navbar-fixed-top, .btnWrite, .pathRow').removeClass('hidden');
  }

  function handleBtnCancelClicked(e) {
    e.preventDefault();
    var tempOriginalElement = $('<div></div>');
    tempOriginalElement.html(originalEditorContent);
    var displayedImages = $('.bSafesDisplayed');
    displayedImages.each(function(){
      var id = $(this).attr('id');
      var selector = escapeJQueryIdSelector(id);
      var src = $(this).attr('src');
      var imageInOriginal = tempOriginalElement.find(selector);;
      if(imageInOriginal) {
        $(imageInOriginal).attr('src', src);
        $(imageInOriginal).removeClass('bSafesDownloading');
        $(imageInOriginal).addClass('bSafesDisplayed');
      }
    });
    originalEditorContent = tempOriginalElement.html();
    currentEditor.on('froalaEditor.html.set', function (e, editor) {
      doneEditing();
    });
    currentEditor.froalaEditor('html.set', originalEditorContent);
    return false;
  };
	
  function handleBtnSaveClicked(e) {
    e.preventDefault();
  
		$('.btnCancel').addClass('hide');
		$('.btnSave').LoadingOverlay('show', {background: "rgba(255, 255, 255, 0.0)"}); 
    switch(currentEditorId) {
      case 'title':
        saveTitle();
        break;
      case 'content':
        saveContent();
        break;
      default:
    };
    return false;
  };

  function saveTitle() {
    var title = currentEditor.froalaEditor('html.get');
    var titleText = title.replace(/<(?:.|\n)*?>/gm, ' ');;
    var encodedTitle = forge.util.encodeUtf8(title);
    var encryptedTitle = encryptBinaryString(encodedTitle, itemKey, itemIV);

		var thisSearchKey = isATeamItem ? teamSearchKey:searchKey;
    var titleTokens = stringToEncryptedTokens(titleText, thisSearchKey);
		
		itemCopy.title = encryptedTitle;
    itemCopy.titleTokens = titleTokens;
		itemCopy.update = "title";
		createNewItemVersionForContainer();
  };

	function saveContent() {
		var content = currentEditor.froalaEditor('html.get');
		content = preProcessEditorContentBeforeSaving(content).content;
		var encodedContent = forge.util.encodeUtf8(content);
		var encryptedContent = encryptBinaryString(encodedContent, itemKey, itemIV);
		
		itemCopy.content = encryptedContent;
		itemCopy.update = "content";
		createNewItemVersionForContainer();
	}

  function initializeEditorButtons(){
		$('.btnWrite').off();
    $('.btnWrite').on('click', handleBtnWriteClicked);
		$('.btnSave').off();
    $('.btnSave').on('click', handleBtnSaveClicked);
		$('.btnCancel').off();
    $('.btnCancel').on('click', handleBtnCancelClicked);
  }

  var decryptResult = function(encryptedData, iv) {
		if(isATeamItem) { 
    	var decryptedData = decryptBinaryString(encryptedData, teamKey, iv);
		} else {
			var decryptedData = decryptBinaryString(encryptedData, expandedKey, iv);
		}
    return decryptedData;
  }

  var getEnvelopeKey = function() {
		if(isATeamItem) {
    	return teamKey;
		} else {
			return expandedKey;
		}
  };

	var getSearchKey = function() {
    if(isATeamItem) {
      return teamSearchKey;
    } else {
      return searchKey;
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
		if(currentMode === 'search'){
		 	$('.itemActionBtn').addClass('hidden');
			return;
		}
    if(numberOfSelectedItems) {
			$('#showSearchInputBtn').addClass('hidden');
      $('.itemsActionBtn').removeClass('hidden');
      $('.itemActionBtn').removeClass('hidden disabled');
      $('.addItemBtn').addClass('hidden');
      $checkedItems.each(function(index, element) {
        $(element).closest('.resultItem').find('.itemActionBtn').addClass('disabled');
      });
			$(".itemsToolbar").removeClass('hidden');
    } else {
			$('#showSearchInputBtn').removeClass('hidden');
      $('.itemsActionBtn').addClass('hidden');
      $('.itemActionBtn').addClass('hidden');
      $('.addItemBtn').removeClass('hidden');
			$(".itemsToolbar").addClass('hidden');
    }
  };

  $('#moveItemsBtn').click(function(e) { 
    $(e.target).trigger('blur'); 
    var isModalVisible = $('#moveItemsModal').is(':visible'); 
    if(!isModalVisible) { 
      showMoveItemsModal(itemSpace); 
    }  
     
    return false; 
  });

  $('#trashItemsBtn').click(function(e) {
    $(e.target).trigger('blur');
    var isModalVisible = $('#trashModal').is(':visible');
    if(!isModalVisible) {
      showTrashItemsModal(itemSpace, itemId);
    }
    return false;
  });

/* For notebook */

  var goToPage = function(e) {
    e.preventDefault();
    var intendedPageNumber = $('#pageNumberInput').val();
    var intendedItemId = itemId.replace('n', 'np') + ':' + intendedPageNumber;
		window.location.href = '/notebook/p/' + intendedItemId;	
    return false;
  };

  $('#gotoPageBtn').click(goToPage);
  $('#pageNumberInput').on('change', goToPage);

 
/* End of notebook */

/* For diary */
  $('#datepicker').datepicker({
  	changeMonth: true,
    changeYear: true,
    showButtonPanel: true,
    dateFormat: 'yymm',
    onClose: function(dateText, inst) {
			thisYear = inst.selectedYear;
			thisMonth = inst.selectedMonth + 1;
			var thisMonthText = (thisMonth < 10)? "0"+thisMonth:thisMonth.toString();
			selectedDiaryContentStartPosition = thisYear + thisMonthText + "01";
   		selectedDiaryContentEndPosition = thisYear + thisMonthText + "31";
			listDiaryItems();
    }

  });

  $(".datePickerBtn").on('click', function(e) {
    $("#datepicker").datepicker("show");
		var $datePicker = $('.ui-datepicker-calendar');
		$datePicker.css("display", 'none');
  });

	$("#previousDiaryPageBtn").click(function(e) {
		if(isCover) {
      getPreviousItemInContainer(itemCopy.container, itemCopy.position, function(err, itemId) {
        if(err) {
        
        } else {
          goGetItem(itemId);
        }
      });
			return;
		}
		var thisYear = parseInt(selectedDiaryContentStartPosition.substring(0, 4));
		var thisMonth = parseInt(selectedDiaryContentStartPosition.substring(4, 6)) - 1;
		if(thisMonth === 0) {
			thisMonth = 12;
			thisYear = thisYear - 1;
		}
		var thisMonthText = (thisMonth < 10)? "0"+thisMonth:thisMonth.toString();
		selectedDiaryContentStartPosition = thisYear + thisMonthText + "01";
		selectedDiaryContentEndPosition = thisYear + thisMonthText + "31";
		listDiaryItems();
	});

	$("#nextDiaryPageBtn").click(function(e) {
		if(isCover) {
      getNextItemInContainer(itemCopy.container, itemCopy.position, function(err, itemId) {
        if(err) {
        
        } else {
          goGetItem(itemId);
        }
      });
			return;
		}
    var thisYear = parseInt(selectedDiaryContentStartPosition.substring(0, 4)); 
    var thisMonth = parseInt(selectedDiaryContentStartPosition.substring(4, 6)) + 1;
		if(isCover) {
			resetSelectedDiaryMonth();
		} else {
			var thisYear = parseInt(selectedDiaryContentStartPosition.substring(0, 4));
    	var thisMonth = parseInt(selectedDiaryContentStartPosition.substring(4, 6)) + 1;
    	if(thisMonth === 13) {
      	thisMonth = 1;
      	thisYear = thisYear + 1;
    	}
    	var thisMonthText = (thisMonth < 10)? "0"+thisMonth:thisMonth.toString();
    	selectedDiaryContentStartPosition = thisYear + thisMonthText + "01";
    	selectedDiaryContentEndPosition = thisYear + thisMonthText + "31";
		}
		$('.containerControlsPanel').removeClass('hidden');
		isCover = false;
    listDiaryItems();
	});
/* End of diary*/
	$('#gotoFirstItemBtn').click(function(e){
    $('#gotoFirstItemBtn').trigger('blur');
    getFirstItemInContainer(itemId, function(err, thisId) {
      if(err) {

      } else {
				goGetItem(thisId, itemId);
      }
    });
    return false;
  });

  $('#gotoLastItemBtn').click(function(e){
    $('#gotoLastItemBtn').trigger('blur');
    getLastItemInContainer(itemId, function(err, thisId) {
      if(err) {

      } else {
				goGetItem(thisId, itemId);
      }
    });
    return false;
  });

	$('#showSearchInputBtn').click(function(e){
		e.preventDefault();
		currentMode = "search";
		$('#showSearchInputBtn').trigger('blur');
		$('#showSearchInputBtn').addClass('hidden');	
		$('.resultItems').empty();
		$('#gotoContentsBtn').removeClass('hidden');
	
		$('.containerCoverPanel').addClass('hidden');
		$('.containerContentsPanel').removeClass('hidden');

		$('.containerSearchRow').removeClass('hidden');
		$('#searchInput').focus();	
		return false;
	});

  function searchByTokens(searchTokensStr, pageNumber) {
    $.post('/memberAPI/searchInsideContainer', {
			container: itemId,
      searchTokens: searchTokensStr,
      size: itemsPerPage,
      from: (pageNumber -1) * itemsPerPage
    }, function(data, textStatus, jQxhr) {
      if(data.status === 'ok') {
        currentContentsPage = pageNumber;
        $('.resultItems').empty();
        var total = data.hits.total;
        var hits = data.hits.hits;
        displayHits(currentMode, hits);
				updatePagination(currentMode, currentContentsPage, total, itemsPerPage, lastSearchTokensStr);
      }
    }, 'json');
  }

  var search = function(e) {
		console.log("Search ...");
    if(lastSearchTime) {
      /* Avoiding consecutive search in IE */
      var thisTime = Date.now();
      if((thisTime - lastSearchTime) < 3000) {
        if(e) {
          return false;
        } else {
          return;
        }
      }
    }
    if(e) e.preventDefault();
    currentMode = "search";
    resetPagination();
    $('.resultItems').empty();
    $('#searchInput').off('change');
    var str = $('#searchInput').val();
    $('#searchInput').val('');

		var thisSearchKey = isATeamItem ? teamSearchKey:searchKey;

    var searchTokens = stringToEncryptedTokens(str, thisSearchKey);
    var searchTokensStr = JSON.stringify(searchTokens);
    lastSearchTokensStr = searchTokensStr;

    searchByTokens(searchTokensStr, 1);

		lastSearchTime = Date.now();

    $('#searchInput').on('change', search);
    if(e) return false;
  };

  $('#searchInput').on('change', search);

  $('#searchBtn').on('click', function(e){
    e.preventDefault();
		$('#searchBtn').trigger('blur');
    search();
    return false;
  });

	$('#cancelSearchBtn').on('click', function(e){
		$('#cancelSearchBtn').trigger('blur');
		$('.containerSearchRow').addClass('hidden');

		$('#listAllItems').trigger('click');
		return false;
	});
/***  Creating an item ***/

  $('.safeItemOption').on('click', function(e) {
    if(addAction) {
      e.preventDefault();
	
			safeItemIsSelected(e, addAction, updateKeyValue);    

      return false;
    }
  });

  $('#createAnItem').click(function(e) {
    e.preventDefault();

    createANewItem(itemId, selectedItemType, addAction, $addTargetItem, getEnvelopeKey, getSearchKey);
	
    return false;
  });

  $('.closeTitleModal').click(function(e) {
		e.preventDefault();
		$('.titleModal').modal('toggle');	
    addAction = 'addAnItemOnTop';
    selectedItemType = null;
		return false;
  });

  $('#closeNewItemOptionsModal').on('click', function(e) {
    addAction = 'addAnItemOnTop';
  });

/*** End of creating an item ***/

	var listItems = function (pageNumber) {
		$.post('/memberAPI/getContainerContents',{
			itemId: itemId,
			size: itemsPerPage,
			from:	(pageNumber -1) * itemsPerPage 
		}, function(data, textStatus, jQxhr ){
				hideLoadingContents();
			if(data.status === 'ok') {
				currentContentsPage = pageNumber;
				$('.resultItems').empty();
				if(data.hits) {
					console.log(data.hits);
					var total = data.hits.total;
					if((total === 0) && isFirstTimeAccessed) {
						isFirstTimeAccessed = false;
						$('#gotoCoverBtn').trigger('click');	
					} else {
			    	$('.boxControlsPanel').addClass('hidden');
    				$('.contentsControlsPanel').removeClass("hidden");			 
						if(total === 0) {
							$('#nextPageBtn').addClass('hidden');
						}
						var hits = data.hits.hits;
						$('.containerContentsPanel').removeClass('hidden');
						displayHits(currentMode, hits);
						if(pageNumber === 1) {
							var $firstResultItem = $($('.resultItem')[0]);
							firstResultItemLink = $firstResultItem.find('a').attr('href');
						}
						positionPageNavigationControls();
						updatePagination(currentMode, currentContentsPage, total, itemsPerPage, lastSearchTokensStr);
					}
				}
			}
		}, 'json');
	};

/* For diary */
	function getTodayText() {
		var today = new Date();
		var thisMonth = today.getMonth() + 1;
		var thisMonthText = (thisMonth < 10)?"0"+thisMonth:thisMonth.toString();
		var thisDate = today.getDate();
		var thisDateText = (thisDate< 10)?"0"+thisDate:thisDate.toString();
		var todayText = today.getFullYear().toString() + thisMonthText + thisDateText;
		return todayText;
	}

	function newDiaryContentItem(date, hits) {
		var thisDateValue = parseInt(date);
		var thisYear = parseInt(date.substring(0, 4));
		var thisMonth = parseInt(date.substring(4, 6));
		var thisDayOfMonth = parseInt(date.substring(6, 8));
		var thisDate = new Date(thisYear, thisMonth - 1, thisDayOfMonth);
		var thisDay = thisDate.getDay();
		
		function thisDateInHits() {
			for(var i=0; i < hits.length; i++) {
				if(hits[i]._source.position === thisDateValue) {
					thisDateInHits = true;
					return hits[i];
				}
			}
			return null;
		}
	
		var resultItem = thisDateInHits();
		if(resultItem) {
			console.log(date, "thisDateInHits");
			var $resultItem = newResultItem(resultItem);		
		} else {
			console.log(date);
			var $resultItem = $('.resultItemTemplate').clone().removeClass('resultItemTemplate hidden').addClass('resultItem');
			var id = itemId.replace("d:", "dp:") + ":" + date.substring(0, 4) + "-" + date.substring(4, 6) + "-" + date.substring(6, 8);
			$resultItem.attr('id', id);
			$resultItem.data('position', thisDateValue);
			$resultItem.data('container', itemId);
			var link;
			var title = "";
			link = '/diary/p/' + id;
			$resultItem.find('.itemPage').attr('href', link);	
		}
		var singleLetterDay = getSingleLetterDay(thisDay);
		if(thisDayOfMonth < 10) {
			var dayOfMonthText = "&nbsp&nbsp" + thisDayOfMonth;
		} else {
			var dayOfMonthText = thisDayOfMonth.toString();
		} 
		var dayText = dayOfMonthText + " " + singleLetterDay;
		$resultItem.find('.itemPage').html(dayText);
		if(thisDay === 6 || thisDay === 0) {
			$resultItem.find(".col-xs-3").css("background-color", "#F2F3F4");
		}
		if(date === getTodayText()) {
			$resultItem.find(".col-xs-3").css("background-color", "#EBF5FB");
		}	
		$resultItem.click(function(e) {
			e.preventDefault();
			window.location = $resultItem.find('.itemPage').attr('href');	
		});
		return $resultItem;
	}

	function displayDiaryContents(hits) {
		var thisYear = parseInt(selectedDiaryContentStartPosition.substring(0, 4));
		var thisMonthText = selectedDiaryContentStartPosition.substring(4, 6);
		var thisMonth = parseInt(thisMonthText);

		for(i=1; i<=31; i ++) {
			var dayOfMonth = (i<10)?("0"+i):i;
			thisDateText = thisYear + thisMonthText + dayOfMonth;
			var $resultItem = newDiaryContentItem(thisDateText, hits);
			$('.resultItems').append($resultItem);
			var thisDate = new Date(thisYear, thisMonth - 1, i);
			var thisDateInMilliseconds = thisDate.getTime();
			var nextDateInMillisedonds = thisDateInMilliseconds + 86400000;
			var nextDate = new Date(nextDateInMillisedonds);
			var monthOfNextDate = nextDate.getMonth();
			if(monthOfNextDate+1 !== thisMonth) break;
		}
	}

	var listDiaryItems = function () {
		var thisYYMMDD = selectedDiaryContentStartPosition.toString();
		var thisYear = parseInt(thisYYMMDD.substring(0, 4));
		var thisMonth = parseInt(thisYYMMDD.substring(4, 6));
		var thisMonthText = getAbbreviatedMonth(thisMonth - 1);
		var MMYYText = thisMonthText + " " + thisYear;
		$('#MMYY').text(MMYYText);
    $.post('/memberAPI/getContainerContents',{
      itemId: itemId,
      size: 31,
      from: 0,
			selectedDiaryContentStartPosition: selectedDiaryContentStartPosition,
			selectedDiaryContentEndPosition: selectedDiaryContentEndPosition 
    }, function(data, textStatus, jQxhr ){
			hideLoadingContents();
      if(data.status === 'ok') {
        currentContentsPage = 1;
        $('.resultItems').empty();
        if(data.hits) {
          console.log(data.hits);
          var total = data.hits.total;

          var hits = data.hits.hits;
					$('.boxControlsPanel').addClass('hidden');
          $('.contentsControlsPanel').removeClass("hidden");
					$('.containerCoverPanel').addClass('hidden');
          $('.containerContentsPanel').removeClass('hidden');
					$('.previousPageBtn').removeClass('hidden');
					$('#gotoContentsBtn').addClass('hidden');
					$('#gotoCoverBtn').removeClass('hidden');
					positionPageNavigationControls();
					displayDiaryContents(hits);
        }
      }
    }, 'json');
  };
/*** End of diary ****/

	var listAllItems = function (e) {
	  showLoadingContents(); 
	  e.preventDefault();
    currentMode = "listAll";
    resetPagination();
    var target = $(e.target).closest('li');
    target.addClass('active');
		if(itemId.substring(0, 2) === "d:") {
			listDiaryItems();
		} else {
   		listItems(1);
		}
    return false;
	};

  $('#listAllItems').click(listAllItems);

	$('#gotoContentsBtn').click(function(e) {
  	if(itemId.substring(0, 1) === 'b') {
      //$("#openBtn").addClass("hidden");
    }
		if(!itemId.substring(0, 1) === 'n') {
			//$('.turningPageRow').addClass('hidden');
		}
		isCover = false;
		$('.containerCoverPanel').addClass('hidden');
		$('#previousPageBtn').removeClass('hidden');
		$('#gotoContentsBtn').trigger('blur');
		$('#gotoContentsBtn').addClass('hidden');
		$('#gotoCoverBtn').removeClass('hidden');
		$('.containerContentsPanel').removeClass('hidden');
		$('#showSearchInputBtn').removeClass('hidden');

		$('.containerSearchRow').addClass('hidden');
		$('#listAllItems').trigger('click');		

		return false;
	});

	$('#openBtn').click(function(e) {
    $('#gotoContentsBtn').trigger('click');
	});

 	$('#nextPageBtn').click(function(e) {
		if(isCover) {
			getNextItemInContainer(itemCopy.container, itemCopy.position, function(err, itemId) {
      	if(err) {
      
      	} else {
        	goGetItem(itemId);
      	}
    	});
		} else {
			window.location.href = firstResultItemLink;		
		}
    return false;
  });

  $('#previousPageBtn').click(function(e) {
    if(!isCover) {
			$('#gotoCoverBtn').trigger('click');
    } else {
    	getPreviousItemInContainer(itemCopy.container, itemCopy.position, function(err, itemId) {
      	if(err) {
      
      	} else {
        	goGetItem(itemId);
      	}
   		});
		}
    return false;
  });

  $('#gotoContainerCoverBtn').click(function(e) {
    goGetItemCover(itemCopy.container);
  });

  $('#gotoContainerContentsBtn').click(function(e) {
    goGetItemContents(itemCopy.container);
  });

	initContainerFunctions(listItems, searchByTokens, decryptResult, updateToolbar, updateKeyValue, showLoadingContents, hideLoadingContents);

	$("#deselectItems").click(function(e) {
    deselectItems(e);
  });

	bSafesPreflight(function(err, key, thisPublicKey, thisPrivateKey, thisSearchKey) {
			if(itemId.substring(0, 1) === 'b') {
				//$("#openBtn").addClass("hidden");
			}
			if(err) {
				alert(err);
			} else {
				expandedKey = key;
				publicKeyPem = thisPublicKey;
				privateKeyPem = thisPrivateKey;
				searchKey = thisSearchKey;
				if(isCover) {
					$('#gotoCoverBtn').trigger('click');
				} else {
					showLoadingContents(); 
					getItem(function() {
						hideLoadingContents();
          	$('#listAllItems').trigger('click');
        	});
				}
			}
	});
};
