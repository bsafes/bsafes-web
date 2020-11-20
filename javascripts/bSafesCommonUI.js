/*-- Commons for all item views */
function timeToString(timeValue) {
  var date = new Date(timeValue);
  var dateParts = date.toString().split('GMT');
  var dateStr = dateParts[0];
  return dateStr;
};

function formatTimeDisplay(timeValue) {
  var msPerMinute = 60 * 1000;
  var msPerHour = msPerMinute * 60;
  var msPerDay = msPerHour * 24;
  var msPerMonth = msPerDay * 30;
  var msPerYear = msPerDay * 365;

  var currentTime = Date.now();

  var date = new Date(timeValue);
  var dateParts = date.toString().split('GMT');
  var dateStr = dateParts[0];

  var elapsed = currentTime - timeValue;

  if (elapsed < msPerMinute) {
    var elapsedStr = Math.round(elapsed / 1000) + ' seconds ago';
  } else if (elapsed < msPerHour) {
    var elapsedStr = Math.round(elapsed / msPerMinute) + ' minutes ago';
  } else if (elapsed < msPerDay) {
    var elapsedStr = Math.round(elapsed / msPerHour) + ' hours ago';
  } else if (elapsed < msPerDay * 7) {
    var elapsedStr = Math.round(elapsed / msPerDay) + ' days ago';
  }

  if (elapsedStr !== undefined) {
    dateStr = elapsedStr;
  }

  return dateStr;
}

function getAntiCSRF() {
  var $antiCSRF = $("#antiCSRF");
  var antiCSRF = null;
  if ($antiCSRF.length) {
    antiCSRF = $antiCSRF.text();
  }
  return antiCSRF;
}

var bSafesCommonUIObj = {
  currentItem: {
    path: []
  },
  antiCSRF: getAntiCSRF()
}

function getPath(itemId, pageId, done) {
  $.post('/memberAPI/getItemPath', {
    itemId: itemId,
    antiCSRF: bSafesCommonUIObj.antiCSRF
  }, function(data, textStatus, jQxhr) {
    if (data.status === 'ok') {
      var path = data.itemPath;
      done(path);
    }
  });
};

function showPath(teamName, itemPath, itemId, envelopeKey, pageId, endItemTitle) {
  var path = itemPath;
  $('.pathItem, .pathItemName').remove();
  $('.newTab, .newTabHint').remove();

  if (pageId) {
    var newItem = {
      _id: pageId
    };
    path.push(newItem);
  };

  bSafesCommonUIObj.currentItem.path = [];

  for (var i = 0; i < path.length; i++) {
    $pathItem = $('.pathItemTemplate').clone().removeClass('pathItemTemplate hidden').addClass('pathItem');
    var pathItemType = path[i]._id.charAt(0);
    if (path[i]._id.substring(0, 2) === 'np') pathItemType = 'np';
    if (path[i]._id.substring(0, 2) === 'dp') pathItemType = 'dp';

    var pathItemIcon;
    var pathItemLink;
    bSafesCommonUIObj.currentItem.path.push(path[i]._id);
    switch (pathItemType) {
      case 'u':
        pathItemIcon = 'Personal';
        pathItemLink = '/';
        break;
      case 't':
        teamName = DOMPurify.sanitize(teamName);
        pathItemIcon = teamName;
        pathItemParts = path[i]._id.split(':');
        pathItemParts.splice(-2, 2);
        var teamId = pathItemParts.join(':');
        pathItemLink = '/team/' + teamId;
        break;
      case 'b':
        pathItemIcon = '<i class="fa fa-archive" aria-hidden="true"></i>';
        pathItemLink = '/box/' + path[i]._id;
        break;
      case 'f':
        pathItemIcon = '<i class="fa fa-folder-o" aria-hidden="true"></i>';
        pathItemLink = '/folder/' + path[i]._id;
        break;
      case 'n':
        pathItemIcon = '<i class="fa fa-book" aria-hidden="true"></i>';
        pathItemLink = '/notebook/' + path[i]._id;
        break;
      case 'd':
        pathItemIcon = '<i class="fa fa-calendar" aria-hidden="true"></i>';
        pathItemLink = '/diary/' + path[i]._id;
        break;
      case 'p':
        pathItemIcon = '<i class="fa fa-file-text-o" aria-hidden="true"></i>';
        pathItemLink = '/page/' + path[i]._id;
        break;
      case 'np':
        pathItemIcon = '<i class="fa fa-file-text-o" aria-hidden="true"></i>';
        pathItemLink = '/notebook/p/' + path[i]._id;
        break;
      case 'dp':
        pathItemIcon = '<i class="fa fa-file-text-o" aria-hidden="true"></i>';
        pathItemLink = '/diary/p/' + path[i]._id;
        break;
      default:
        break;
    }

    var itemTitleText;
    if (i !== 0 && i !== (path.length - 1)) {
      var thisItem = path[i];
      var itemKey = decryptBinaryString(forge.util.decode64(thisItem._source.keyEnvelope), envelopeKey, forge.util.decode64(thisItem._source.envelopeIV));
      var itemIV = decryptBinaryString(forge.util.decode64(thisItem._source.ivEnvelope), envelopeKey, forge.util.decode64(thisItem._source.ivEnvelopeIV));
      var encodedTitle = decryptBinaryString(forge.util.decode64(thisItem._source.title), itemKey, itemIV);
      var title = forge.util.decodeUtf8(encodedTitle);
      title = DOMPurify.sanitize(title);
      itemTitleText = $(title).text();
    }
    var $newTab = $('.newTabTemplate').clone().removeClass('newTabTemplate hidden').addClass('newTab');

    if (i === 0) {
      $pathItem.find('.itemInSamePage').html(pathItemIcon);
      $pathItem.find('.itemInSamePage').attr('href', pathItemLink);
      $pathItem.addClass('pathSpace');
      $newTab.find('a').text(pathItemIcon);
      $newTab.find('a').attr('href', pathItemLink);
      $('.newTabDropdownMenu').prepend($newTab);
    } else if (i === (path.length - 1)) {
      $pathItem.html(pathItemIcon + " " + endItemTitle);
      $pathItem.addClass('active');
    } else {
      $pathItem.find('.itemInSamePage').html(pathItemIcon + " " + itemTitleText);
      $pathItem.find('.itemInSamePage').attr('href', pathItemLink);
      $newTab.find('a').html(pathItemIcon + " " + itemTitleText);
      $newTab.find('a').attr('href', pathItemLink);
      $('.newTabDropdownMenu').prepend($newTab);
    }
    $('.pathItemsList').append($pathItem);
  }
  var $newTab = $('.newTabHintTemplate').clone().addClass('newTabHint').removeClass('hidden');
  $('.newTabDropdownMenu').prepend($newTab);


  $pathItemName = $('.pathItemNameTemplate').clone().removeClass('pathItemNameTemplate hidden').addClass('pathItemName');
  $pathItemName.text("");
  $('.pathItemsList').append($pathItemName);
}

function getAndShowPath(itemId, envelopeKey, teamName, endItemTitle) {
  $.post('/memberAPI/getItemPath', {
    itemId: itemId,
    antiCSRF: bSafesCommonUIObj.antiCSRF
  }, function(data, textStatus, jQxhr) {
    if (data.status === 'ok') {
      showPath(teamName, data.itemPath, itemId, envelopeKey, null, endItemTitle);
    }
  }, 'json');
}

function showLoadingIn($element) {
  $element.LoadingOverlay("show", {
    image: "",
    fontawesome: "fa fa-circle-o-notch fa-spin",
    maxSize: "38px",
    minSize: "36px",
    background: "rgba(255, 255, 255, 0.0)"
  });
};


function hideLoadingIn($element) {
  $element.LoadingOverlay("hide");
}

function showV5LoadingIn($element) {
  $element.LoadingOverlay("show", {
    image: "",
    fontawesome: "fas fa-circle-notch fa-spin",
    maxSize: "38px",
    minSize: "36px",
    background: "rgba(255, 255, 255, 0.0)"
  });
};


function hideV5LoadingIn($element) {
  $element.LoadingOverlay("hide");
}

function showLoading() {
  $(".addAnItemRow").LoadingOverlay("show", {
    image: "",
    fontawesome: "fa fa-circle-o-notch fa-spin",
    maxSize: "38px",
    minSize: "36px",
    background: "rgba(255, 255, 255, 0.0)"
  });
};

function hideLoading() {
  $(".addAnItemRow").LoadingOverlay("hide");
};

function showLoadingInSignIn() {
  $(".signInForm").LoadingOverlay("show", {
    image: "",
    fontawesome: "fa fa-circle-o-notch fa-spin",
    maxSize: "38px",
    minSize: "36px",
    background: "rgba(255, 255, 255, 0.0)"
  });
};

function hideLoadingInSignIn() {
  $(".signInForm").LoadingOverlay("hide");
};

function showLoadingInCreateAnItem() {
  $("#createAnItem").LoadingOverlay("show", {
    image: "",
    fontawesome: "fa fa-circle-o-notch fa-spin",
    maxSize: "38px",
    minSize: "36px",
    background: "rgba(255, 255, 255, 0.0)"
  });
};

function hideLoadingInCreateAnItem() {
  $("#createAnItem").LoadingOverlay("hide");
};

function showLoadingContents() {
  $(".containerControlsPanel").LoadingOverlay("show", {
    image: "",
    fontawesome: "fa fa-circle-o-notch fa-spin",
    maxSize: "38px",
    minSize: "36px",
    background: "rgba(255, 255, 255, 0.0)",
    fontawesomeColor: "rgba(255, 255, 255)"
  });
};

function hideLoadingContents() {
  $(".containerControlsPanel").LoadingOverlay("hide");
};

function showLoadingPage() {
  $(".tagsRow").LoadingOverlay("show", {
    image: "",
    fontawesome: "fa fa-circle-o-notch fa-spin",
    maxSize: "38px",
    minSize: "36px",
    background: "rgba(255, 255, 255, 0.0)"
  });
};

function hideLoadingPage() {
  $(".tagsRow").LoadingOverlay("hide");
};

function showLoadingInMoveItemsModal() {
  var $thisModal = $("#moveItemsModal").find(".modal-content");
  $thisModal.LoadingOverlay("show", {
    image: "",
    fontawesome: "fa fa-circle-o-notch fa-spin",
    maxSize: "38px",
    minSize: "36px",
    background: "rgba(255, 255, 255, 0.0)"
  });
};

function showLoadingInMoveAnItemModal() {
  var $thisModal = $("#moveAnItemModal").find(".modal-content");
  $thisModal.LoadingOverlay("show", {
    image: "",
    fontawesome: "fa fa-circle-o-notch fa-spin",
    maxSize: "38px",
    minSize: "36px",
    background: "rgba(255, 255, 255, 0.0)"
  });
};

function hideLoadingInMoveItemsModal() {
  $("#moveItemsModal").find(".modal-content").LoadingOverlay("hide");
};

function hideLoadingInMoveAnItemModal() {
  $("#moveAnItemModal").find(".modal-content").LoadingOverlay("hide");
};

function showLoadingInTrashModal() {
  var $thisModal = $("#trashModal").find(".modal-content");
  $thisModal.LoadingOverlay("show", {
    image: "",
    fontawesome: "fa fa-circle-o-notch fa-spin",
    maxSize: "38px",
    minSize: "36px",
    background: "rgba(255, 255, 255, 0.0)"
  });
};

function hideLoadingInTrashModal() {
  $("#trashModal").find(".modal-content").LoadingOverlay("hide");
};

function showLoadingInTrashBox() {
  $(".actionsRow").LoadingOverlay("show", {
    image: "",
    fontawesome: "fa fa-circle-o-notch fa-spin",
    maxSize: "38px",
    minSize: "36px",
    background: "rgba(255, 255, 255, 0.0)"
  });
};

function hideLoadingInTrashBox() {
  $(".actionsRow").LoadingOverlay("hide");
};

function getSingleLetterDay(dayValue) {
  var days = ["S", "M", "T", "W", "T", "F", "S"];
  return days[dayValue];
};

function getAbbreviatedMonth(monthValue) {
  var abbreviatedMonths = ["Jan.", "Feb.", "Mar.", "Apr.", "May.", "Jun.", "Jul.", "Aug.", "Sep.", "Oct.", "Nov.", "Dec."];
  return abbreviatedMonths[monthValue];
};

function lockBSafes(why) {
  var thisUrl = encodeURIComponent(window.location.href);
  localStorage.clear();
  localStorage.setItem("isSignedIn", "true");
  window.location.href = "/lockBSafes?redirectURL=" + thisUrl + "&why=" + why;
};

function memberIdToJSId(memberId) {
  var jsId = memberId.replace(/\+/g, '_');
  jsId = jsId.replace(/=/g, '_');
  return jsId;
};

function setBoxControlsPanel(containerId) {
  var containerType = containerId.split(':')[0];
  if (containerType === 'b') {
    $('.boxControlsPanel').removeClass('hidden');
    $('#gotoTeamSpaceBtn').addClass('hidden');
    $('#gotoContainerCoverBtn').removeClass('hidden');
    $('#gotoContainerContentsBtn').removeClass('hidden');
  }
  if (containerType === 't1') {
    var parts = containerId.split(':');
    parts.splice(parts.length - 2, 2);
    var teamId = parts.join(':');
    $('.boxControlsPanel').removeClass('hidden');
    $('#gotoTeamSpaceBtn').removeClass('hidden');
    $('#gotoTeamSpaceBtn').click(function(e) {

      var ifEdited = getIfEdited();
      if (ifEdited) {
        alert("Please save before leaving this page."); 
        return false;
      }
      
      var link = '/team/' + teamId;
      window.location.href = link;
    });

    $('#gotoContainerCoverBtn').addClass('hidden');
    $('#gotoContainerContentsBtn').addClass('hidden');
  }
}

function postGetItemData(item) {
  setBoxControlsPanel(item.container);
}

function isItemAContainer(itemId) {
  var itemType = itemId.split(':')[0];
  if (itemType === 'b' || itemType === 'f' || itemType === 'n' || itemType === 'd') {
    return true;
  }
  return false;
}

function createNewItemVersion(itemId, itemCopy, currentVersion, done) {
  itemCopy.version = currentVersion + 1;

  $.ajax({
    url: "/memberAPI/createNewItemVersion",
    type: 'POST',
    dataType: 'json',
    data: {
      itemId: itemId,
      itemVersion: JSON.stringify(itemCopy),
      antiCSRF: bSafesCommonUIObj.antiCSRF
    },
    error: function(jqXHR, textStatus, errorThrown) {
      done({
        code: textStatus
      });
      console.log("Error: ", textStatus);
    },
    success: function(data) {
      if (data.status === 'ok') {
        done(null, data);
      } else {
        alert(data.err);
        done(data.err);
        console.log("Error: ", data.err);
      }
    },
    timeout: 30000 // sets timeout to 3 seconds      
  });
};


function initializeShareItemButton(itemId){
  $('#shareItem').off(); 
  $("#generatedURL").empty(); 
  $('#shareItem').click(function(e) {
    e.preventDefault(); 
    console.log("Share button clicked"); 
    $('#shareItemModal').modal('show');
    getUrl(itemId);  
    initializeCopyURL(); 
  })
}

function initializeCopyURL(){
  $('#copyURL').off(); 
  $('#copyURL').click(function(e){
    e.preventDefault(); 
    var url = $("#generatedURL");
    var range = document.createRange(); 
    range.selectNode(document.getElementById("generatedURL")); 
    window.getSelection().removeAllRanges(); 
    window.getSelection().addRange(range); 
    document.execCommand("Copy"); 
    window.getSelection().removeAllRanges(); 
    alert("URL Copied to clipboard: " + url.text()); 
  })
}

//tester function
function getURLtester(){
  var URL = "https://www.bsafes.com"; 
  $("#generatedURL").empty().append(URL); 
  return URL; 
}

function getUrl(itemId){
  //post request
  var url; 
  $.post('/memberAPI/getItemUrl', {
    itemId: itemId, 
    antiCSRF: bSafesCommonUIObj.antiCSRF
  }, function(data, textStatus, jQxhr) {
      if(data.status === 'ok'){
        url = data.itemUrl; 
        console.log("Received URl:", url); 
        $("#generatedURL").empty().append(url); 
      } else {
        console.log("Cannot fetch URL with status code: ", data.status, data.err); 
      }
  }); 
  return url; 
}

function initializeItemVersionsHistory(itemId, getItemVersion) {
  $('#itemVersionsHistory').off();
  $('#moreVersions').off(); 
  var latestVersionNumStored = 0;
  var currentVersionNum;
  var startIndex = 0; 

  try {
    currentVersionNum = getCurrentVersionNum();
  } catch (e) {}

  $('#itemVersionsHistory').click(function(e) {
    e.preventDefault();
    console.log("Item Versions list opened"); 

    $('#goToTopBtn').off(); 
    $('#goToTopBtn').click(function(e){
      e.preventDefault(); 
      console.log("GO to top"); 
      $('.modal-body').animate({scrollTop: 0}, 1000);
      return false; 
    })

    if (currentVersionNum == latestVersionNumStored) {
      $('#itemVersionsModal').modal('show');
      $('#moreVersions').addClass("hidden");
    }
    else if(currentVersionNum > latestVersionNumStored && latestVersionNumStored >= 20){
      $('#itemVersionsModal').modal('show');
      $('#moreVersions').off(); 
      $('#moreVersions').on('click', function(e) {
        e.preventDefault();
        getMoreVersions(startIndex);
        return false;
      });
      var totalVersionsNum = getTotalVersionsOfPage(); 
    }else {
      $.post('/memberAPI/getItemVersionsHistory', {
        itemId: itemId,
        size: 20,
        from: 0,
        antiCSRF: bSafesCommonUIObj.antiCSRF
      }, function(data, textStatus, jQxhr) {

        if (data.status === 'ok') {
          var total = data.hits.total;
          var hits = data.hits.hits;

          setTotalVersionsOfPage(total);
          
          $(".itemVersionItemsList").empty();
          console.log("Total Versions: ", total);

          if (total > 20) {
            $("#moreVersions").removeClass('hidden');
            startIndex = 20;
          }
          latestVersionNumStored = hits.length; 
          for (var i = 0; i < hits.length; i++) {
            var $itemVersionItem = $('.itemVersionItemTemplate').clone().removeClass('itemVersionItemTemplate hidden').addClass('itemVersionItem');
            $itemVersionItem.attr('id', hits[i]._source.version);
            $itemVersionItem.find('.itemVersion').html("V." + hits[i]._source.version);
            latestVersion = hits[i]._source.version;
            var updatedText;
            if (hits[i]._source.version === 1) {
              updatedText = "Creation";
            } else {
              updatedText = "Updated " + hits[i]._source.update;
            }
            $itemVersionItem.find('.itemVersionUpdate').text(updatedText);
            var updatedBy = hits[i]._source.displayName ? hits[i]._source.displayName : hits[i]._source.updatedBy;
            updatedBy = DOMPurify.sanitize(updatedBy);
            $itemVersionItem.find('.itemVersionUpdatedBy').text(updatedBy);
            var updatedTime = formatTimeDisplay(hits[i]._source.createdTime);
            $itemVersionItem.find('.itemVersionUpdatedTime').text(updatedTime);
            if (updatedTime.charAt(updatedTime.length - 1) === 'o') {
              $itemVersionItem.find('.itemVersionUpdatedTimeStamp').text(timeToString(hits[i]._source.createdTime));
            }
           
            $itemVersionItem.click(function(e) {
              $('#itemVersionsModal').modal('hide');
              var $thisItemVersionItem = $(e.target).closest('.itemVersionItem');
              var thisItemVersion = parseInt($thisItemVersionItem.attr('id'));
              setIfTimeMachine(true); 
              if(thisItemVersion == currentVersionNum){
                setIfTimeMachine(false); 
              }
              setTMSelectedVersionNum(thisItemVersion); 
              getItemVersion(thisItemVersion);
            });
            $(".itemVersionItemsList").append($itemVersionItem);
          }

          $('#moreVersions').on('click', function(e) {
            e.preventDefault();
            getMoreVersions(startIndex);
            return false;
          });

          $('#itemVersionsModal').modal('show');
        }
      }, 'json');
    }

    function changeStartIndex(value) {
      startIndex += value;
      return false;
    }

    //function that gets more versions on click
    function getMoreVersions(startIndex) {
            $('#moreVersions').addClass('hidden'); 
            console.log("More....");
            $.post('/memberAPI/getItemVersionsHistory', {
              itemId: itemId,
              size: 20,
              from: startIndex,
              antiCSRF: bSafesCommonUIObj.antiCSRF
            }, function(data, textStatus, jQxhr) {
              if (data.status === 'ok') {
                var hits = data.hits.hits;
                for (var i = 0; i < hits.length; i++) {
                  var $itemVersionItem = $('.itemVersionItemTemplate').clone().removeClass('itemVersionItemTemplate hidden').addClass('itemVersionItem');
                  $itemVersionItem.attr('id', hits[i]._source.version);
                  $itemVersionItem.find('.itemVersion').html("V." + hits[i]._source.version);
                  latestVersion = hits[i]._source.version;
                  latestVersionNumStored++;

                  var updatedText;
                  if (hits[i]._source.version === 1) {
                    updatedText = "Creation";
                  } else {
                    updatedText = "Updated " + hits[i]._source.update;
                  }
                  $itemVersionItem.find('.itemVersionUpdate').text(updatedText);
                  var updatedBy = hits[i]._source.displayName ? hits[i]._source.displayName : hits[i]._source.updatedBy;
                  updatedBy = DOMPurify.sanitize(updatedBy);
                  $itemVersionItem.find('.itemVersionUpdatedBy').text(updatedBy);
                  var updatedTime = formatTimeDisplay(hits[i]._source.createdTime);
                  $itemVersionItem.find('.itemVersionUpdatedTime').text(updatedTime);
                  if (updatedTime.charAt(updatedTime.length - 1) === 'o') {
                    $itemVersionItem.find('.itemVersionUpdatedTimeStamp').text(timeToString(hits[i]._source.createdTime));
                  }

                  $itemVersionItem.click(function(e) {
                    $('#itemVersionsModal').modal('hide');
                    var $thisItemVersionItem = $(e.target).closest('.itemVersionItem');
                    var thisItemVersion = parseInt($thisItemVersionItem.attr('id'));
                    setIfTimeMachine(true); 
                    setTMSelectedVersionNum(thisItemVersion); 
                    getItemVersion(thisItemVersion);
                  });

                  $(".itemVersionItemsList").append($itemVersionItem);
                }
                if (hits.length < 20) {
                  $('#moreVersions').addClass("hidden");
                  $('#moreVersions').off();
                  return false;

                } else {
                  changeStartIndex(20);
                }
                $('#moreVersions').removeClass('hidden'); 
              }
            }, 'json');
          }
  });
};


/* End of commons for all item views */
/*-- Commons for container and page views */
var selectedItemsInContainer = [];
var updateContainerKeyValue;
var updateContainerToolbar;
var decryptResultInContainer;
var listContainerItems;
var showLoadingInContainer;
var hideLoadingInConainer;
var currentSpace;
var itemInfo = [];

function initCurrentSpace(thisSpace) {
  currentSpace = thisSpace;
  bSafesCommonUIObj.currentItem.path = [currentSpace];
}

function initContainerOtherFunctions(getCurrentVersion, getIfEdit, getIfTM, setIfTM, getTotalVersions, setTotalVersions, getSelectedVersion, setSelectedVersion){
  getCurrentVersionNum = getCurrentVersion; 
  getIfEdited = getIfEdit; 
  getIfTimeMachine = getIfTM; 
  setIfTimeMachine = setIfTM; 
  getTotalVersionsOfPage = getTotalVersions; 
  setTotalVersionsOfPage = setTotalVersions; 
  getTMSelectedVersionNum = getSelectedVersion; 
  setTMSelectedVersionNum = setSelectedVersion; 
}

function initContainerFunctions(listItems, searchByTokens, decryptResult, updateToolbar, updateKeyValue, showLoading, hideLoading) {
  listContainerItems = listItems;
  searchByTokensInContainer = searchByTokens;
  decryptResultInContainer = decryptResult;
  updateContainerToolbar = updateToolbar;
  updateContainerKeyValue = updateKeyValue;
  showLoadingInContainer = showLoading;
  hideLoadingInContainer = hideLoading;
}

function displayHits(mode, hits, options) {
  if (mode === "search") selectedItemsInContainer.length = 0;

  for (var i = 0; i < hits.length; i++) {
    var resultItem = hits[i];
    if (resultItem._source && resultItem._source.type === 'T') continue;
    var $resultItem = newResultItem(resultItem);
    if (mode === "search") {
      $resultItem.find('.itemControl').addClass('hidden');
    } else {
      $resultItem.find('.itemControl').removeClass('hidden');
    }
    if (options && options.disableLink) {
      $resultItem.find('.itemLink').removeAttr('href');
    }
    if (options && options.inTrash) {
      $resultItem.data('originalContainer', resultItem._source.originalContainer);
      if (resultItem._source.originalPosition) {
        $resultItem.data('originalPosition', resultItem._source.originalPosition);
      } else {
        $resultItem.data('originalPosition', Date.now());
      }
    }
    $('.resultItems').append($resultItem);
  }

  updateContainerToolbar(selectedItemsInContainer);
  window.scrollTo(0, 0);
}

function resetPagination() {
  updateContainerKeyValue('currentContentsPage', 1);
  $('.containerContentsPagination').empty();
  $('.containerContentsPagination').addClass('hidden');
}

function updatePagination(currentMode, currentContentsPage, total, sizePerPage, lastSearchTokensStr) {
  var $containerContentsPagination = $('.containerContentsPagination');
  if ($containerContentsPagination.hasClass('hidden')) {
    var $leftArrowPagingItem = $('<li><a href="#">&laquo;</a></li>');
    var $rightArrowPagingItem = $('<li><a href="#">&raquo;</a></li>');
    var $numberPagingItem = $('<li><a href="#">1</a></li>');

    var numberOfContentsPages;
    var tempNumber = total / sizePerPage;
    if ((tempNumber) % 1 === 0) {
      numberOfContentsPages = tempNumber;
    } else {
      numberOfContentsPages = Math.floor(tempNumber) + 1;
    }

    for (var i = 0; i < numberOfContentsPages; i++) {
      var $newItem = $numberPagingItem.clone();
      $newItem.attr('id', i + 1);
      $newItem.find('a').text(i + 1);
      $newItem.find('a').click(function(e) {
        e.preventDefault();
        var intendedPageNumber = parseInt($(e.target).parent().attr('id'));
        if (currentMode === "search") {
          searchByTokensInContainer(lastSearchTokensStr, intendedPageNumber);
        } else {
          try {
            listContainerItems(intendedPageNumber);
          } catch (e) {}
        }
        return false;
      });
      $('.containerContentsPagination').append($newItem);
    }
    $('.containerContentsPagination').removeClass('hidden');
  }
  $('.containerContentsPagination').find('li.disabled').removeClass('disabled');
  $('.containerContentsPagination').find('li#' + (currentContentsPage)).addClass('disabled');
}

function goGetItem(id, container) {
  if (id === 'EndOfContainer') {
    alert("The End!");
    return;
  };
  var containerType = null;
  if (container) {
    containerType = container.split(':')[0];
  }
  var itemType = id.split(':')[0];
  var link = null;
  switch (itemType) {
    case 'p':
      if (containerType && containerType === 'f') {
        link = '/folder/p/' + id;
      } else {
        link = '/page/' + id;
      }
      break;
    case 'b':
      link = '/box/' + id + '?initialDisplay=cover';
      break;
    case 'f':
      link = '/folder/' + id + '?initialDisplay=cover';
      break;
    case 'n':
      link = '/notebook/' + id + '?initialDisplay=cover';
      break;
    case 'np':
      link = '/notebook/p/' + id;
      break;
    case 'd':
      link = '/diary/' + id + '?initialDisplay=cover';
      break;
    default:
  }
  if (link) {
    window.location.href = link;
  }
}

function getContainerLink(id) {
  var itemType = id.split(':')[0];
  var link;
  switch (itemType) {
    case 'b':
      link = '/box/' + id + '?initialDisplay=cover';
      break;
    case 'f':
      link = '/folder/' + id + '?initialDisplay=cover';
      break;
    case 'n':
      link = '/notebook/' + id + '?initialDisplay=cover';
      break;
    case 'd':
      link = '/diary/' + id + '?initialDisplay=cover';
      break;
    default:
      link = null;
  }
  return link;
};

function goGetItemCover(id) {
  var link = getContainerLink(id);
  if (link) {
    link += '?initialDisplay=cover';
  }
  window.location.href = link;
}

function goGetItemContents(id) {
  var link = getContainerLink(id);
  if (link) {
    link += '?initialDisplay=contents';
  }
  window.location.href = link;
}

function getNextItemInContainer(container, position, done) {
  $.post('/memberAPI/getNextItemInContainer', {
    container: container,
    position: position,
    antiCSRF: bSafesCommonUIObj.antiCSRF
  }, function(data, textStatus, jQxhr) {
    if (data.status === 'ok') {
      var itemId = data.itemId;

      done(null, itemId);
    } else {
      alert(data.err, null);
      done(data.err, null);
    }
  }, 'json');
}

function getPreviousItemInContainer(container, position, done) {
  $.post('/memberAPI/getPreviousItemInContainer', {
    container: container,
    position: position,
    antiCSRF: bSafesCommonUIObj.antiCSRF
  }, function(data, textStatus, jQxhr) {
    if (data.status === 'ok') {
      var itemId = data.itemId;

      done(null, itemId);
    } else {
      alert(data.err);
      done(data.err, null);
    }
  }, 'json');
}

function getFirstItemInContainer(container, done) {
  $.post('/memberAPI/getFirstItemInContainer', {
    container: container,
    antiCSRF: bSafesCommonUIObj.antiCSRF
  }, function(data, textStatus, jQxhr) {
    if (data.status === 'ok') {
      var itemId = null;
      if (data.hits.hits.length) {
        var itemId = data.hits.hits[0]._id;
      }
      done(null, itemId);
    } else {
      alert(data.err);
      done(data.err, null);
    }
  }, 'json');
}

function getLastItemInContainer(container, done) {
  $.post('/memberAPI/getLastItemInContainer', {
    container: container,
    antiCSRF: bSafesCommonUIObj.antiCSRF
  }, function(data, textStatus, jQxhr) {
    if (data.status === 'ok') {
      var itemId = null;
      if (data.hits.hits.length) {
        var itemId = data.hits.hits[0]._id;
      }
      done(null, itemId);
    } else {
      alert(data.err);
      done(data.err, null);
    }
  }, 'json');
}

function listItemsCloseToAndAfterItem($targetItem) {
  var targetContainer = $targetItem.data('container');
  var targetPosition = $targetItem.data('position');
  targetPosition += 1;
  $('.resultItems').empty();
  $.post('/memberAPI/listItemsCloseToAndAfterItem', {
    container: targetContainer,
    position: targetPosition,
    antiCSRF: bSafesCommonUIObj.antiCSRF
  }, function(data, textStatus, jQxhr) {
    if (data.status === 'ok') {
      var hits = data.hits;
      displayHits("listAll", hits, decryptResultInContainer, updateContainerToolbar);
    }
  }, 'json');
}

var handleAddAction = function(e) {
  var $addTargetItem = $(e.target).closest('.resultItem');

  if ($(e.target).hasClass('addBefore')) {
    addAction = 'addAnItemBefore';
  } else if ($(e.target).hasClass('addAfter')) {
    addAction = 'addAnItemAfter';
  }
  console.log(addAction);
  updateContainerKeyValue('addAction', addAction);
  updateContainerKeyValue('$addTargetItem', $addTargetItem);
  $('#addAnItemBtn').trigger('click');

}

function calculateTotalMovingItemsUsage() {
  var totalItemVersions = 0;
  var totalStorage = 0;

  for (var i = 0; i < selectedItemsInContainer.length; i++) {
    if (selectedItemsInContainer[i].totalStorage) {
      totalItemVersions += selectedItemsInContainer[i].totalItemVersions;
      totalStorage += selectedItemsInContainer[i].totalStorage;

    } else {
      totalItemVersions += selectedItemsInContainer[i].version;
      totalStorage += selectedItemsInContainer[i].totalItemSize;
    }
  }
  return {
    totalItemVersions: totalItemVersions,
    totalStorage: totalStorage
  };
}

var handleDropAction = function(e) {
  var $targetItem = $(e.target).closest('.resultItem');
  var targetItemId = $targetItem.attr('id');
  var dropAction;
  if ($(e.target).hasClass('dropBefore')) {
    dropAction = 'dropItemsBefore';
    selectedItemsInContainer.sort(function(a, b) {
      if (a.position < b.position) return -1;
      if (a.position > b.position) return 1;
      return 0;
    });
  } else if ($(e.target).hasClass('dropInside')) {
    dropAction = 'dropItemsInside';
    selectedItemsInContainer.sort(function(a, b) {
      if (a.position < b.position) return -1;
      if (a.position > b.position) return 1;
      return 0;
    });
  } else if ($(e.target).hasClass('dropAfter')) {
    dropAction = 'dropItemsAfter';
    selectedItemsInContainer.sort(function(a, b) {
      if (a.position < b.position) return 1;
      if (a.position > b.position) return -1;
      return 0;
    });
  }
  console.log(dropAction);

  var options = {
    space: currentSpace,
    targetContainer: $targetItem.data('container'),
    items: JSON.stringify(selectedItemsInContainer),
    targetItem: targetItemId,
    targetPosition: $targetItem.data('position')
  };

  if (dropAction === 'dropItemsInside') {
    var totalUsage = calculateTotalMovingItemsUsage();
    var targetContainersPath = bSafesCommonUIObj.currentItem.path.slice(0);
    targetContainersPath.push(targetItemId);
    options.sourceContainersPath = JSON.stringify(bSafesCommonUIObj.currentItem.path);
    options.targetContainersPath = JSON.stringify(targetContainersPath);
    options.totalUsage = JSON.stringify(totalUsage);
  }
  options.antiCSRF = bSafesCommonUIObj.antiCSRF;
  $.post('/memberAPI/' + dropAction,
    options,
    function(data, textStatus, jQxhr) {
      if (data.status === 'ok') {
        selectedItemsInContainer.length = 0;

        setTimeout(function() {
          $('#listAllItems').trigger('click');
          //listItemsCloseToAndAfterItem($targetItem);
        }, 1500);
      }
    }, 'json');
}

function newResultItem(resultItem) {
  if (resultItem._source) {
    var itemId = resultItem._id;
    resultItem = resultItem._source;
  } else {
    var itemId = resultItem.id;
  }
  var id = itemId;
  var container = resultItem.container;
  var position = resultItem.position;

  if ((resultItem.keyEnvelope === undefined) || (resultItem.envelopeIV === undefined) || (resultItem.ivEnvelope === undefined) || (resultItem.ivEnvelopeIV === undefined)) {
    var title = "Error!";
  } else {
    var itemKey = decryptResultInContainer(forge.util.decode64(resultItem.keyEnvelope), forge.util.decode64(resultItem.envelopeIV));
    var itemIV = decryptResultInContainer(forge.util.decode64(resultItem.ivEnvelope), forge.util.decode64(resultItem.ivEnvelopeIV));
    if (resultItem.title) {
      try {
        var encodedTitle = decryptBinaryString(forge.util.decode64(resultItem.title), itemKey, itemIV);
        var title = forge.util.decodeUtf8(encodedTitle);
        title = DOMPurify.sanitize(title);
      } catch (err) {
        alert(err);
        var title = "";
      }
    } else {
      var title = "";
    }
  }

  function isItemSelected(itemId) {
    for (var i = 0; i < selectedItemsInContainer.length; i++) {
      if (selectedItemsInContainer[i].id === itemId) return true;
    }
    return false;
  }

  var $resultItem = $('.resultItemTemplate').clone().removeClass('resultItemTemplate hidden').addClass('resultItem');

  $resultItem.attr('id', id);
  $resultItem.data('position', resultItem.position);
  $resultItem.data('container', resultItem.container);
  $resultItem.data('keyEnvelope', resultItem.keyEnvelope);
  $resultItem.data('envelopeIV', resultItem.envelopeIV);
  $resultItem.data('ivEnvelope', resultItem.ivEnvelope);
  $resultItem.data('ivEnvelopeIV', resultItem.ivEnvelopeIV);
  $resultItem.data('title', resultItem.title);
  if (resultItem.version) {
    var version = resultItem.version;
  } else {
    var version = 1;
  }
  $resultItem.data('version', version);


  if (resultItem.totalItemSize) {
    var totalItemSize = resultItem.totalItemSize;
  } else {
    var totalItemSize = 0;
  }
  $resultItem.data('totalItemSize', totalItemSize);

  if (isItemSelected(id)) {
    $resultItem.find('.selectItemBox').prop('checked', true);
  }
  var itemType = id.split(':')[0];
  if (itemType === 'b' || itemType === 'f' || itemType === 'n' || itemType === 'd') {
    var totalStorage, totalItemVersions;
    if (resultItem.totalStorage) {
      totalStorage = resultItem.totalStorage;
    } else {
      totalStorage = 0;
    }
    if (resultItem.totalItemVersions) {
      totalItemVersions = resultItem.totalItemVersions;
    } else {
      totalItemVersions = 0;
    }
    $resultItem.data('totalStorage', totalStorage);
    $resultItem.data('totalItemVersions', totalItemVersions);
  }
  var link;
  var debugUsage = 0;
  switch (itemType) {
    case 'p':
      if (title.substring(0, 2) === '<h') {
        $title = $(title);
        title = $title.text();
      }
      title = '<i class="fa fa-file-text-o safeItemTypeIcon" aria-hidden="true"></i>' + title;
      if (container.substring(0, 1) === 'f') {
        link = '/folder/p/' + id;
      } else {
        link = '/page/' + id;
      }
      if (debugUsage !== undefined && debugUsage) {
        title = title + '<p> version: ' + version + ' totalItemSize: ' + totalItemSize + '</p>'
      }
      break;
    case 'b':
      title = '<i class="fa fa-archive safeItemTypeIcon" aria-hidden="true"></i>' + title;
      if (debugUsage !== undefined && debugUsage) {
        title = title + '<p> totalItemVersions: ' + totalItemVersions + ' totalStorage: ' + totalStorage + '</p>'
      }
      link = '/box/' + id;
      break;
    case 'f':
      title = '<i class="fa fa-folder-o safeItemTypeIcon" aria-hidden="true"></i>' + title;
      link = '/folder/' + id;
      if (debugUsage !== undefined && debugUsage) {
        title = title + '<p> totalItemVersions: ' + totalItemVersions + ' totalStorage: ' + totalStorage + '</p>'
      }
      break;
    case 'n':
      title = '<i class="fa fa-book safeItemTypeIcon" aria-hidden="true"></i>' + title;
      if (resultItem.lastAccessedPage) {
        link = '/notebook/p/' + resultItem.lastAccessedPage;
      } else {
        link = '/notebook/p/' + itemId.replace('n:', 'np:') + ':' + 1;
      }
      if (debugUsage !== undefined && debugUsage) {
        title = title + '<p> totalItemVersions: ' + totalItemVersions + ' totalStorage: ' + totalStorage + '</p>'
      }
      break;
    case 'np':
      if (title.substring(0, 2) === '<h') {
        $title = $(title);
        title = $title.text();
      }
      //title = '<i class="fa fa-file-text-o safeItemTypeIcon" aria-hidden="true"></i>' + title;
      link = '/notebook/p/' + id;
      break;
    case 'd':
      title = '<i class="fa fa-calendar safeItemTypeIcon" aria-hidden="true"></i>' + title;
      var currentTime = new Date();
      var year = currentTime.getFullYear();
      var month = currentTime.getMonth() + 1;
      if (month < 10) month = '0' + month;
      var date = currentTime.getDate();
      if (date < 10) date = '0' + date;
      var pageIndex = year + '-' + month + '-' + date;
      link = '/diary/p/' + itemId.replace('d:', 'dp:') + ':' + pageIndex;
      if (debugUsage !== undefined && debugUsage) {
        title = title + '<p> totalItemVersions: ' + totalItemVersions + ' totalStorage: ' + totalStorage + '</p>'
      }
      break;
    case 'dp':
      if (title.substring(0, 2) === '<h') {
        $title = $(title);
        title = $title.text();
      }
      link = '/diary/p/' + id;
      break;
    default:
  }

  if (itemType === 'np') {
    $resultItem.find('.itemPage').html(resultItem.pageNumber);
    $resultItem.find('.itemPage').attr('href', link);
  }
  if (itemType === 'dp') {
    $resultItem.find('.itemPage').html(resultItem.position);
    $resultItem.find('.itemPage').attr('href', link);
  }
  $resultItem.find('.itemTitle').html(title);
  $resultItem.find('.itemLink').attr('href', link);

  $resultItem.find('.selectItemBox').click(function(e) {
    var $thisItem = $(e.target).closest('.resultItem');
    var itemPosition = $thisItem.data('position');
    var itemId = $thisItem.attr('id');
    var itemContainer = $thisItem.data('container');

    var keyEnvelope = $thisItem.data('keyEnvelope');
    var envelopeIV = $thisItem.data('envelopeIV');
    var ivEnvelope = $thisItem.data('ivEnvelope');
    var ivEnvelopeIV = $thisItem.data('ivEnvelopeIV');
    var title = $thisItem.data('title');
    var version = $thisItem.data('version');
    var totalItemSize = $thisItem.data('totalItemSize');

    var item = {
      id: itemId,
      version: version,
      container: itemContainer,
      position: itemPosition,
      keyEnvelope: keyEnvelope,
      envelopeIV: envelopeIV,
      ivEnvelope: ivEnvelope,
      ivEnvelopeIV: ivEnvelopeIV,
      title: title,
      totalItemSize: totalItemSize
    };

    var itemType = itemId.split(':')[0];

    if (itemType === 'b' || itemType === 'f' || itemType === 'n' || itemType === 'd') {
      item.totalStorage = $thisItem.data('totalStorage');
      item.totalItemVersions = $thisItem.data('totalItemVersions');
    }

    if (e.target.checked) {
      selectedItemsInContainer.push(item);
    } else {
      for (var i = 0; i < selectedItemsInContainer.length; i++) {
        if (selectedItemsInContainer[i].id === itemId) break;
      }
      selectedItemsInContainer.splice(i, 1);
    }
    updateContainerToolbar(selectedItemsInContainer);
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
  return $resultItem;
};

function deselectItems(e) {
  if (e) e.preventDefault();
  $(".selectItemBox").removeAttr('checked');
  selectedItemsInContainer.length = 0;
  updateContainerToolbar(selectedItemsInContainer);
}

function reset() {
  return true;
}

function safeItemIsSelected(e, addAction) {
  $('#newItemOptionsModal').off();
  selectedItemType = $(e.target).attr('id');
  $('#newItemOptionsModal').on('hidden.bs.modal', function(e) {
    if (selectedItemType) {
      $('.titleModal').modal('toggle');
      $('#newItemOptionsModal').off(); //this line fixes issue 55
    }
  });

  $('#newItemOptionsModal').modal('toggle');
  updateContainerKeyValue('selectedItemType', selectedItemType);
  //$('.titleModal').modal('toggle');
};

function createANewItem(currentContainer, selectedItemType, addAction, $addTargetItem, getEnvelopeKeyFunc, getSearchKeyFunc) {
  var envelopeKey = getEnvelopeKeyFunc();
  var thisSearchKey = getSearchKeyFunc();
  showLoadingInCreateAnItem();
  var titleStr = $('.titleInput').val();
  var title = '<h2>' + $('.titleInput').val() + '</h2>';
  var encodedTitle = forge.util.encodeUtf8(title);

  var salt = forge.random.getBytesSync(32);
  var randomKey = forge.random.getBytesSync(32);
  var itemKey = forge.pkcs5.pbkdf2(randomKey, salt, 10000, 32);
  var itemIV = forge.random.getBytesSync(16);

  var envelopeIV = forge.random.getBytesSync(16);
  var ivEnvelopeIV = forge.random.getBytesSync(16);
  var keyEnvelope = encryptBinaryString(itemKey, envelopeKey, envelopeIV);
  var ivEnvelope = encryptBinaryString(itemIV, envelopeKey, ivEnvelopeIV);
  var encryptedTitle = encryptBinaryString(encodedTitle, itemKey, itemIV);

  var titleTokens = stringToEncryptedTokens(titleStr, thisSearchKey);


  var addActionOptions;
  if (addAction === "addAnItemOnTop") {
    addActionOptions = {
      "targetContainer": currentContainer,
      "type": selectedItemType,
      "keyEnvelope": forge.util.encode64(keyEnvelope),
      "ivEnvelope": forge.util.encode64(ivEnvelope),
      "envelopeIV": forge.util.encode64(envelopeIV),
      "ivEnvelopeIV": forge.util.encode64(ivEnvelopeIV),
      "title": forge.util.encode64(encryptedTitle),
      "titleTokens": JSON.stringify(titleTokens)
    };
  } else {
    var targetItem = $addTargetItem.attr('id');
    var targetContainer = $addTargetItem.data('container');
    var targetPosition = $addTargetItem.data('position');
    addActionOptions = {
      "targetContainer": targetContainer,
      "targetItem": targetItem,
      "targetPosition": targetPosition,
      "type": selectedItemType,
      "keyEnvelope": forge.util.encode64(keyEnvelope),
      "ivEnvelope": forge.util.encode64(ivEnvelope),
      "envelopeIV": forge.util.encode64(envelopeIV),
      "ivEnvelopeIV": forge.util.encode64(ivEnvelopeIV),
      "title": forge.util.encode64(encryptedTitle),
      "titleTokens": JSON.stringify(titleTokens)
    };
  }

  function listAllItems() {
    $('#listAllItems').trigger('click');
  };

  var thisAddAction = addAction;
  addActionOptions.antiCSRF = bSafesCommonUIObj.antiCSRF;
  $.post('/memberAPI/' + addAction,
    addActionOptions,
    function(data, textStatus, jQxhr) {
      hideLoadingInContainer();
      if (data.status === 'ok') {
        var item = data.item;
        var $resultItem = newResultItem(item);
        var $itemLink = $resultItem.find('.itemLink');
        var link = $itemLink.attr('href');
        setTimeout(function() {
          window.location.href = link;
        }, 1500);
        /*
                  if(thisAddAction === "addAnItemOnTop") {
                    setTimeout(listAllItems, 1500);
                  } else if(thisAddAction === "addAnItemBefore") {
                    $addTargetItem.before($resultItem);
                  } else {
                    $addTargetItem.after($resultItem);
                  }
        */
      } else {
        alert(data.err);
      }
    }, 'json');

  updateContainerKeyValue('addAction', 'addAnItemOnTop');
  updateContainerKeyValue('selectedItemType', null);
};

var currentTargetContainer;
var currentTargetContainerName;
var containersPerPage = 20;
var containersPageNumber = 1;

var moveItemsModalObj = {
  targetContainersPath: []
}

function resetContainersList() {
  containersPageNumber = 1;
}

function listContainers(itemId, itemTitle) {
  function updateTargetContainersPath() {
    moveItemsModalObj.targetContainersPath = [];
    var $targetContainersPath = $('.moveItemsPathItemsList').find('.moveItemsPathItem');
    for (i = 0; i < $targetContainersPath.length; i++) {
      $pathItem = $($targetContainersPath[i]);
      var pathItemId = $pathItem.data('itemId');
      moveItemsModalObj.targetContainersPath.push(pathItemId);
    }
  }

  $('#moreContainersBtn').addClass('hidden');
  $.post('/memberAPI/listContainers', {
    container: itemId,
    size: containersPerPage,
    from: (containersPageNumber - 1) * containersPerPage,
    antiCSRF: bSafesCommonUIObj.antiCSRF
  }, function(data, textStatus, jQxhr) {
    if (data.status === 'ok') {
      var containers = data.hits.hits;
      var total = data.hits.total;
      currentTargetContainer = itemId;
      currentTargetContainerName = itemTitle;

      if (containersPageNumber > 1) {
        displayContainers(containers, total, "append");
        return;
      }
      displayContainers(containers, total);
      var $moveItemsPathItem = $('.moveItemsPathItemTemplate').clone().removeClass('moveItemsPathItemTemplate hidden').addClass('moveItemsPathItem');
      $moveItemsPathItem.data("itemId", currentTargetContainer);
      $moveItemsPathItem.data("itemTitle", currentTargetContainerName);
      $moveItemsPathItem.find('a').text(itemTitle);
      $moveItemsPathItem.click(function(e) {
        $('.warningMessage').addClass('hidden');
        $target = $(e.target);
        if ($target.hasClass('moveItemsPathItem')) {
          var thisItemId = $target.data("itemId");
        } else {
          $target = $target.closest('.moveItemsPathItem');
          var thisItemId = $target.data("itemId");
        }

        var thisTitle = $target.data("itemTitle");

        resetContainersList();
        $.post('/memberAPI/listContainers', {
          container: thisItemId,
          size: containersPerPage,
          from: 0,
          antiCSRF: bSafesCommonUIObj.antiCSRF
        }, function(data, textStatus, jQxhr) {
          if (data.status === 'ok') {
            currentTargetContainer = thisItemId;
            currentTargetContainerName = thisTitle;
            var containers = data.hits.hits;
            var total = data.hits.total;
            $target.nextAll().remove();
            updateTargetContainersPath();
            displayContainers(containers, total);
          }
        }, 'json');
      });
      $('.moveItemsPathItemsList').append($moveItemsPathItem);
      updateTargetContainersPath();
    }
  }, 'json');
}

function displayContainers(containers, total, mode) {
  function isContainerSelected(containerId) {
    for (var i = 0; i < selectedItemsInContainer.length; i++) {
      var thisItemId = selectedItemsInContainer[i].id;
      if (thisItemId === containerId) {
        return true;
      }
    }
    return false;
  }

  if (mode && mode === 'append') {
    console.log("appending containers");
  } else {
    $('.containersList').empty();
  }
  if (containers.length) {
    for (var i = 0; i < containers.length; i++) {
      var thisItemId = containers[i]._id;
      if (isContainerSelected(thisItemId)) {
        continue;
      }
      var thisItem = containers[i]._source;
      if (thisItem.type === 'B') {
        var $thisItem = $('.boxTemplate').clone().removeClass("boxTemplate hidden").addClass("box");
      } else if (thisItem.type === 'F') {
        var $thisItem = $('.folderTemplate').clone().removeClass("folderTemplate hidden").addClass("folder");
      }
      var itemKey = decryptResultInContainer(forge.util.decode64(thisItem.keyEnvelope), forge.util.decode64(thisItem.envelopeIV));
      var itemIV = decryptResultInContainer(forge.util.decode64(thisItem.ivEnvelope), forge.util.decode64(thisItem.ivEnvelopeIV));
      if (thisItem.title) {
        try {
          var encodedTitle = decryptBinaryString(forge.util.decode64(thisItem.title), itemKey, itemIV);
          var title = forge.util.decodeUtf8(encodedTitle);
          title = DOMPurify.sanitize(title);
          title = $(title).text();
        } catch (err) {
          alert(err);
          var title = "";
        }
      } else {
        var title = "";
      }
      console.log("itemId:", thisItemId);
      $thisItem.data("itemId", thisItemId);
      $thisItem.data("itemTitle", title);
      $thisItem.find('em').html(title);
      $thisItem.click(function(e) {
        $('.warningMessage').addClass('hidden');
        var $target = $(e.target);
        if ($target.hasClass('list-group-item')) {
          var thisContainer = $target.data("itemId");
        } else {
          $target = $target.closest('.list-group-item');
          var thisContainer = $target.data("itemId");
        }
        var thisTitle = $target.data("itemTitle");

        resetContainersList();
        listContainers(thisContainer, thisTitle);

        return false;
      });
      $(".containersList").append($thisItem);
    }
    if ((containersPageNumber * containersPerPage) < total) {
      $('#moreContainersBtn').removeClass('hidden');
    } else {
      $('#moreContainersBtn').addClass('hidden');
    }
  }
}

function showMoveItemsModal(thisSpace) {
  $('#moveItemsModal').modal('show');

  $('#moreContainersBtn').click(function(e) {
    containersPageNumber += 1;
    listContainers(currentTargetContainer, currentTargetContainerName);
  });

  function canDropItemsInTargetContainer() {
    if (currentTargetContainer.charAt(0) === 'f') {
      for (var i = 0; i < selectedItemsInContainer.length; i++) {
        var thisItem = selectedItemsInContainer[0];
        if (thisItem.id.charAt(0) !== 'p') {
          return false;
        }
      }
      return true;
    } else {
      return true;
    }
  }

  $('#dropItemsBtn').off();
  $('#dropItemsBtn').click(function(e) {
    var movedItems = selectedItemsInContainer.slice(0);
    if (!canDropItemsInTargetContainer()) {
      $(".warningMessage").removeClass('hidden');
      return false;
    }

    var totalUsage = calculateTotalMovingItemsUsage();
    console.log("targetId, targetName", currentTargetContainer, currentTargetContainerName);
    showLoadingInMoveItemsModal();
    $.post('/memberAPI/dropItemsInside', {
      space: currentSpace,
      items: JSON.stringify(selectedItemsInContainer),
      targetItem: currentTargetContainer,
      sourceContainersPath: JSON.stringify(bSafesCommonUIObj.currentItem.path),
      targetContainersPath: JSON.stringify(moveItemsModalObj.targetContainersPath),
      totalUsage: JSON.stringify(totalUsage),
      antiCSRF: bSafesCommonUIObj.antiCSRF
    }, function(data, textStatus, jQxhr) {
      hideLoadingInMoveItemsModal();
      if (data.status === 'ok') {
        var movedItems = selectedItemsInContainer.slice(0);
        selectedItemsInContainer.length = 0;
        $('#moveItemsModal').modal('hide');
        showLoadingInContainer();
        setTimeout(function() {
          hideLoadingInContainer();
          $('#listAllItems').trigger('click');
        }, 1500);
      }
    }, 'json');
  });

  currentTargetContainer = thisSpace;
  currentTargetContainerName = "Top";
  $('.moveItemsPathItemsList').empty();
  listContainers(thisSpace, "Top");

  return false;
}

function showMoveAnItemModal(thisItem, thisSpace) {
  var thisItemId = thisItem.id;
  $('#moveAnItemModal').modal('show');

  $('#moreContainersBtn').click(function(e) {
    containersPageNumber += 1;
    listContainers(currentTargetContainer, currentTargetContainerName);
  });

  function canDropItemsInTargetContainer() {
    if (currentTargetContainer.charAt(0) === 'f') {
      if (thisItemId.charAt(0) !== 'p') {
        return false;
      }
      return true;
    } else {
      return true;
    }
  }
  $('#dropAnItemBtn').off();
  $('#dropAnItemBtn').click(function(e) {

    if (!canDropItemsInTargetContainer()) {
      $(".warningMessage").removeClass('hidden');
      return false;
    }

    console.log("targetId, targetName", currentTargetContainer, currentTargetContainerName);
    showLoadingInMoveAnItemModal();
    var currentItemPath = bSafesCommonUIObj.currentItem.path;
    var sourceContainersPath = currentItemPath.slice(0);
    sourceContainersPath.pop();

    function calculateTotalMovingItemUsage() {
      var totalItemVersions = 0;
      var totalStorage = 0;
      if (isItemAContainer(thisItem.id)) {
        if (thisItem.totalItemVersions) {
          totalItemVersions = thisItem.totalItemVersions;
          totalStorage = thisItem.totalStorage;
        } else {
          totalItemVersions = 0;
          totalStorage = 0;
        }
      } else {
        if (thisItem.usage) {
          totalItemVersions = thisItem.version;
          totalStorage = thisItem.usage.totalItemSize;
        } else {
          totalItemVersions = thisItem.version;
          totalStorage = 0;
        }
      }
      return {
        totalItemVersions: totalItemVersions,
        totalStorage: totalStorage
      };
    }

    var totalUsage = calculateTotalMovingItemUsage();

    $.post('/memberAPI/moveAnItemToTarget', {
      space: currentSpace,
      item: JSON.stringify(thisItem),
      targetItem: currentTargetContainer,
      sourceContainersPath: JSON.stringify(sourceContainersPath),
      targetContainersPath: JSON.stringify(moveItemsModalObj.targetContainersPath),
      totalUsage: JSON.stringify(totalUsage),
      antiCSRF: bSafesCommonUIObj.antiCSRF
    }, function(data, textStatus, jQxhr) {
      hideLoadingInMoveAnItemModal();
      if (data.status === 'ok') {
        var url = data.newItemPath;
        window.location.href = url;
      } else {
        /* prompt a failure */
      }
    }, 'json');
  });

  currentTargetContainer = thisSpace;
  currentTargetContainerName = "Top";

  $('.moveItemsPathItemsList').empty();

  listContainers(thisSpace, "Top");

  return false;

}

var goTrashEnabled = false;

function showTrashItemsModal(thisSpace, originalContainer) {
  $('#trashModal').modal('show');
  $('#trashInput').val("");
  var $thisBtn = $('#goTrashBtn');
  $thisBtn.addClass('disabled');

  var totalUsage = calculateTotalMovingItemsUsage();

  $thisBtn.click(function(e) {
    if (!goTrashEnabled) return;
    showLoadingInTrashModal();
    $.post('/memberAPI/trashItems', {
      items: JSON.stringify(selectedItemsInContainer),
      targetSpace: thisSpace,
      originalContainer: originalContainer,
      sourceContainersPath: JSON.stringify(bSafesCommonUIObj.currentItem.path),
      totalUsage: JSON.stringify(totalUsage),
      antiCSRF: bSafesCommonUIObj.antiCSRF
    }, function(data, textStatus, jQxhr) {
      hideLoadingInTrashModal();
      if (data.status === 'ok') {
        var movedItems = selectedItemsInContainer.slice(0);
        selectedItemsInContainer.length = 0;
        $('#trashModal').modal('hide');
        showLoadingInContainer();
        setTimeout(function() {
          hideLoadingInContainer();
          $('#listAllItems').trigger('click');
        }, 1500);
      }
    }, 'json');
    return false;
  });

  $('#trashInput').on('input', function() {
    var thisInput = $(this).val();
    if (thisInput === 'Yes') {
      $thisBtn.removeClass('disabled');
      goTrashEnabled = true;
    } else {
      $thisBtn.addClass('disabled');
      goTrashEnabled = false;
    }
  });
}

function showTrashAnItemModal(thisSpace, originalContainer) {
  $('#trashAnItemModal').modal('show');
  $('#trashInput').val("");
  var $thisBtn = $('#goTrashAnItemBtn');
  $thisBtn.addClass('disabled');

  var currentItemPath = bSafesCommonUIObj.currentItem.path;
  var sourceContainersPath = currentItemPath.slice(0);
  sourceContainersPath.pop();

  function calculateTotalMovingItemUsage() {
    var totalItemVersions = 0;
    var totalStorage = 0;
    var thisItem = itemInfo[0];
    if (isItemAContainer(thisItem.id)) {
      if (thisItem.totalItemVersions !== undefined) {
        totalItemVersions = thisItem.totalItemVersions;
        totalStorage = thisItem.totalStorage;
      } else {
        totalItemVersions = 0;
        totalStorage = 0;
      }
    } else {
      if (thisItem.totalItemSize !== undefined) {
        totalItemVersions = thisItem.version;
        totalStorage = thisItem.totalItemSize;
      } else {
        totalItemVersions = thisItem.version;
        totalStorage = 0;
      }
    }
    return {
      totalItemVersions: totalItemVersions,
      totalStorage: totalStorage
    };
  }

  var totalUsage = calculateTotalMovingItemUsage();

  $thisBtn.click(function(e) {
    if (!goTrashEnabled) return;
    showLoadingInTrashModal();

    $.post('/memberAPI/trashItems', {
      items: JSON.stringify(itemInfo),
      targetSpace: thisSpace,
      originalContainer: itemInfo[0].container,
      sourceContainersPath: JSON.stringify(sourceContainersPath),
      totalUsage: JSON.stringify(totalUsage),
      antiCSRF: bSafesCommonUIObj.antiCSRF
    }, function(data, textStatus, jQxhr) {
      hideLoadingInTrashModal();
      if (data.status === 'ok') {
        $('#trashAnItemModal').modal('hide');
        //showLoadingInContainer();
        setTimeout(function() {
          //hideLoadingInContainer();
          window.location.href = $('.pathItem:nth-last-child(3) a:first-child').attr('href');
        }, 1500);
      }
    }, 'json');
    return false;
  });

  $('#trashInput').on('input', function() {
    var thisInput = $(this).val();
    if (thisInput === 'Yes') {
      $thisBtn.removeClass('disabled');
      goTrashEnabled = true;
    } else {
      $thisBtn.addClass('disabled');
      goTrashEnabled = false;
    }
  });
}

function hideTrashItemsModal() {
  $('#trashModal').modal('hide');
}
/* End of commons for container view */
/*-- Commons for Team */
function getTeamData(teamId, done) {
  $.post('/memberAPI/getTeamData', {
    teamId: teamId,
    antiCSRF: bSafesCommonUIObj.antiCSRF
  }, function(data, textStatus, jQxhr) {
    if (data.status === 'ok') {
      done(null, data.team);
    } else {
      done(data.err, null);
    }
  }, 'json');
};
/* End of commons for team */
/*-- For scrollable content in modal */
function setModalMaxHeight(element) {
  this.$element = $(element);
  this.$content = this.$element.find('.modal-content');
  var borderWidth = this.$content.outerHeight() - this.$content.innerHeight();
  var dialogMargin = $(window).width() < 768 ? 20 : 60;
  var contentHeight = $(window).height() - (dialogMargin + borderWidth);
  var headerHeight = this.$element.find('.modal-header').outerHeight() || 0;
  var footerHeight = this.$element.find('.modal-footer').outerHeight() || 0;
  var maxHeight = contentHeight - (headerHeight + footerHeight);

  this.$content.css({
    'overflow': 'hidden'
  });

  this.$element
    .find('.modal-body').css({
      'max-height': maxHeight,
      'overflow-y': 'auto'
    });
}

function positionPageNavigationControls() {
  var $containerCoverPanel = $('.containerCoverPanel');
  var $pagePanel = $('.pagePanel');

  containerCoverPanelWidth = $containerCoverPanel.width();
  pagePanelWith = $pagePanel.width();
  if (containerCoverPanelWidth <= 0) {
    panelWidth = pagePanelWith;
  } else {
    panelWidth = containerCoverPanelWidth;
  }
  var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
  var margin = (w - panelWidth) / 2;
  var leftMargin = margin - 30;
  var rightMargin = margin - 30;
  $nextPageBtn = $('.nextPageBtn');
  $nextPageBtn.css("right", rightMargin + "px");
  $previousPageBtn = $('.previousPageBtn');
  $previousPageBtn.css("left", leftMargin + "px");
}

function positionItemNavigationControls() {
  var $pagePanel = $('.pagePanel');

  pagePanelWith = $pagePanel.width();
  panelWidth = pagePanelWith;

  var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
  var margin = (w - panelWidth) / 2;
  var leftMargin = margin - 30;
  var rightMargin = margin - 30;
  $nextItemBtn = $('.nextItemBtn');
  $nextItemBtn.css("right", rightMargin + "px");
  $previousItemBtn = $('.previousItemBtn');
  $previousItemBtn.css("left", leftMargin + "px");
}

function postDownloadS3Object(s3Key) {
  $.post('/memberAPI/postS3Download', {
    s3Key: s3Key,
    antiCSRF: bSafesCommonUIObj.antiCSRF
  }, function(data, textStatus, jQxhr) {
    if (data.status === 'ok') {

    }
  }, 'json');
}

(function() {
  //console.log("Always!");

  function positionPageControls() {
    var $pagePanel = $('.pagePanel');
    if ($pagePanel.length) {
      // if its a page's page
      var $thisPanel = $($pagePanel[0]);
      var pagePanelWidth = $thisPanel.width();

      // if its a folder's page
      var $folderCover = $('.folderCover');
      var folderPageWidth = $folderCover.width();

      // if its a notebook page (notebookPanel)
      var $notebookPanel = $('.notebookPanel');
      var notebookPanelWidth = $notebookPanel.width();

      // if its a diary page (diaryPanel)
      var $diaryPanel = $('.diaryPanel');
      var diaryPanelWidth = $diaryPanel.width();

      // if its a box page (boxPanel)
      var $boxPanel = $('.boxPanel');
      var boxPanelWidth = $boxPanel.width();
      if (
        pagePanelWidth < 1 &&
        folderPageWidth < 1 &&
        notebookPanelWidth < 1 &&
        boxPanelWidth < 1 &&
        diaryPanelWidth < 1
      ) {
        setTimeout(function() {
          positionPageControls();
        }, 1000);
      }
      var panelWidth = Math.max(
        pagePanelWidth,
        folderPageWidth - 25,
        notebookPanelWidth + 25,
        boxPanelWidth,
        diaryPanelWidth + 25,
        0
      );
      var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
      var rightMargin = (w - panelWidth) / 2;
      //$(".btnFloatingWrite, .btnFloatingSave, .btnFloatingCancel, .btnFloatingCanvasSave").css("right", rightMargin + "px");
      $(".btnFloatingWrite, .btnFloatingSave, .btnFloatingCancel").css("right", rightMargin + "px");

      if (typeof pageContentType !== "undefined") {
        if ($.inArray(pageContentType, [null, constContentTypeWrite, constContentTypeDraw]) > -1) {
          $(".btnFloatingCanvasSave").css("right", rightMargin + "px");
        } else {
          $(".btnFloatingCanvasSave").css("right", "20px");
          $(".btnFloatingMinimize").css("right", "20px");
        }
      }

      // var margin = (w - panelWidth) / 2;
      // var leftMargin = margin - 30;
      // var rightMargin = margin - 30;
      //console.log('rightMargin=', rightMargin);
      if ($('.pagePanel').is(':hidden')) {
        $('.btnLock').css('left', '20px');
      } else {
        $('.btnLock').css('left', rightMargin - 30 + 'px');
      }

      //var button_left = parseInt($('.drawCanvas').css('width')) - 70;
      //$('.btnCanvasSave').css('margin-left', button_left + 'px');
      /*
            $nextPageBtn = $('#nextPageBtn');
            rightMargin = margin - 24;  
            $nextPageBtn.css("right", rightMargin + "px");
            
            $previousPageBtn = $('#previousPageBtn');
            var leftMargin = margin - 24 ;
            $previousPageBtn.css("left", leftMargin + "px"); 
      */
      $('#syncfusion_container').css('height', $(window).height() - 40);
      console.log('height', $(window).height() - 40);
    }
  }


  $('.modal').on('show.bs.modal', function() {
    $(this).show();
    setModalMaxHeight(this);
  });

  $(window).resize(function() {
    if ($('.modal.in').length == 1) {
      setModalMaxHeight($('.modal.in'));
    }
    positionPageControls();
    positionPageNavigationControls();
  });

  $(window).scroll(function() {
    //console.log("Window offset(X, Y)", window.pageXOffset, window.pageYOffset);
    if (window.pageYOffset >= 66) {} else {}
  });
  positionPageControls();
})();