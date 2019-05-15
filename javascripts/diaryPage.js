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
	var diaryId;
	var itemPosition;
	var diaryPageParts = itemId.split(':');
  diaryPageParts.splice(-1, 1);
	var diaryPageMajorPart = diaryPageParts.join(':');
	var isBlankPage = false;

	diaryId = diaryPageMajorPart.replace("dp","d");

  function setIsATeamItem(thisTeamKey ,thisTeamSearchKey) {
    isATeamItem = true;
    teamKey = thisTeamKey;
    teamSearchKey = thisTeamSearchKey;
  };

  $('#datepicker').datepicker({
		dateFormat: "yy-mm-dd",
    onSelect: function(dateText, inst) {
			var intendedItemId = diaryPageMajorPart + ":" + dateText;
			getDiaryPageItem(intendedItemId, privateKeyPem, searchKey);
    }
  });

  $(".datePickerBtn").on('click', function(e) {
    $("#datepicker").datepicker("show");
  });

	function getPageDateDataFromId(thisItemId) {
    var itemIdParts = thisItemId.split(':');
    var lastPart = itemIdParts[itemIdParts.length-1];
    var currentPageDateParts = lastPart.split('-');
		var currentPageTime = new Date(parseInt(currentPageDateParts[0]), parseInt(currentPageDateParts[1])-1, parseInt(currentPageDateParts[2]));	
		var dayOfWeek = currentPageTime.getDay().toString();
		currentPageDateParts.push(dayOfWeek);
		currentPageDateParts.push(currentPageTime);
		return currentPageDateParts;		
	}

	function updatePageDate(thisItemId) {
		var abbreviatedMonths = ["Jan.", "Feb.", "Mar.", "Apr.", "May.", "Jun.", "Jul.", "Aug.", "Sep.", "Oct.", "Nov.", "Dec."];
		var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
		var thisPageItemDate = getPageDateDataFromId(thisItemId);
		var dayText = days[parseInt(thisPageItemDate[3])];
		var monthText = abbreviatedMonths[parseInt(thisPageItemDate[1]) - 1];
		var dateText = thisPageItemDate[2];
		var yearText = thisPageItemDate[0];

		var pageDateText = dayText + ", " + monthText + " " + dateText + ", " + yearText;
		$(".diaryPageDateText").text(pageDateText);	
		var thisPageTime = thisPageItemDate[4];
		var thisPageTime = thisPageTime.getTime();
		var todayTime = new Date();
		var todayTime = new Date(todayTime.getFullYear(), todayTime.getMonth(), todayTime.getDate());
		var todayTime = todayTime.getTime();

		var daysDiff = (thisPageTime - todayTime)/86400000;
		var todayRelative;
		switch(daysDiff) {
			case 1:
				todayRelative = "Tomorrow";
				break;
			case 0:
				todayRelative = "Today";
				break;
			case -1:
				todayRelative = "Yesterday";
				break;
			case -2:
				todayRelative = "2 days ago";
				break;
			default:
				todayRelative = "";
		}
		$("#todayRelative").text(todayRelative);	
		var datapickerDate = thisPageItemDate[0] + '-' + thisPageItemDate[1] + '-' + thisPageItemDate[2];
		$("#datepicker").datepicker("setDate", datapickerDate);	
		history.pushState({},"","/diary/p/"+thisItemId);
	}

	var currentPageDate = getPageDateDataFromId(itemId); 
	var currentPageDayOfMonth = parseInt(currentPageDate[2]);

	$('#pageNumberInput').val(currentPageDayOfMonth);
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

	function getDiaryPageItem(thisItemId, thisPrivateKey, thisSearchKey) {
		updatePageDate(thisItemId);
		
    getPageItem(thisItemId, expandedKey, thisPrivateKey, thisSearchKey, function(err, item){
      if(err) {
				$('#pageNumberInput').val(currentPageNumber);
        alert(err);
      } else {
				itemId = thisItemId;
				currentPageDate = getPageDateDataFromId(itemId);
				var currentPageDayOfMonth = parseInt(currentPageDate[2]);
				if((currentPageDayOfMonth % 2) === 0){
					$('.diaryPagePanel').css('border-radius', '0 20px 20px 0');
				} else {
					$('.diaryPagePanel').css('border-radius', '20px 0 0 20px');
				}
				$('#pageNumberInput').val(currentPageDayOfMonth);	
       	if(!item) {
          console.log('Empty Page');
          isBlankPage = true;
    //      initializePageControls();
        }
      }
    });
	}

	$('#gotoCoverBtn').click(function(e){
    e.preventDefault();
    $('#gotoContentsBtn').trigger('blur');
    window.location.href = '/diary/' + diaryId + '?initialDisplay=cover';
    return false;
  });

  $('#gotoContentsBtn').click(function(e){
  	e.preventDefault();
		$('#gotoContentsBtn').trigger('blur');
    window.location.href = '/diary/' + diaryId;
    return false;
  });

	var goToPage = function(e) {
    e.preventDefault();
    var intendedPageNumber = $('#pageNumberInput').val();
    var intendedItemId = diaryPageMajorPart + ':' + intendedPageNumber;

    getDiaryPageItem(intendedItemId, privateKeyPem, searchKey);

    $('#gotoPageBtn').trigger('blur');
		$('#pageNumberInput').trigger('blur');
    return false;
	};
	
	$('#gotoPageBtn').click(goToPage);
	$('#pageNumberInput').on('change', goToPage);

	function getNextPageItemId() {
		var currentPageTime = new Date(parseInt(currentPageDate[0]), parseInt(currentPageDate[1])-1, parseInt(currentPageDate[2]), 12, 0, 0, 0);
    var nextPageTime = new Date(currentPageTime.getTime() + 86400000);
		var nextPageYear = nextPageTime.getFullYear();
		var nextPageMonth = nextPageTime.getMonth()+1;
		if(nextPageMonth < 10) nextPageMonth = '0'+ nextPageMonth;
		var nextPageDay = nextPageTime.getDate();
		if(nextPageDay < 10) nextPageDay = '0' + nextPageDay;
		var nextPageItemId = diaryPageMajorPart + ":" + nextPageYear + "-" + nextPageMonth + "-" + nextPageDay; 
		return nextPageItemId;
	}

	function getPreviousPageItemId() {
    var currentPageTime = new Date(parseInt(currentPageDate[0]), parseInt(currentPageDate[1])-1, parseInt(currentPageDate[2]), 12, 0, 0, 0);
    var previousPageTime = new Date(currentPageTime.getTime() - 86400000);
    var previousPageYear = previousPageTime.getFullYear();
    var previousPageMonth = previousPageTime.getMonth()+1;
		if(previousPageMonth < 10) previousPageMonth = '0'+ previousPageMonth;
    var previousPageDay = previousPageTime.getDate();
		if(previousPageDay < 10) previousPageDay = '0' + previousPageDay;
    var previousPageItemId = diaryPageMajorPart + ":" + previousPageYear + "-" + previousPageMonth + "-" + previousPageDay;
    return previousPageItemId;

	}

	$('#nextPageBtn').click(function(e){
		e.preventDefault();
		var intendedItemId = getNextPageItemId();

		getDiaryPageItem(intendedItemId, privateKeyPem, searchKey);
 
		$(e.target).trigger('blur');
		return false;
	});

	$('#previousPageBtn').click(function(e){
    e.preventDefault();
		var intendedItemId = getPreviousPageItemId();
	
		getDiaryPageItem(intendedItemId, privateKeyPem, searchKey);
		
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
				getDiaryPageItem(itemId, thisPrivateKey, thisSearchKey);
				positionPageNavigationControls(); 
			}
	});
};

