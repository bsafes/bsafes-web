function loadPage() {
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

    function setIsATeamItem(thisTeamKey, thisTeamSearchKey) {
        isATeamItem = true;
        teamKey = thisTeamKey;
        teamSearchKey = thisTeamSearchKey;
    };

    function setupContainerPageKeyValue(key, value) {
        switch (key) {
            case 'itemId':
                itemId = value;
                break;
            case 'itemPosition':
                itemPosition = value;
                break;
            default:
        }
    };

    var handleEditorStateChanged = function(event) {
        console.log(event);
        if (event === 'Editor is initialized') {
            $('.pageNavigation').addClass('hidden');
        } else if (event === 'Editor is destroyed') {
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
        handleEditorStateChanged: handleEditorStateChanged,
        setupContainerPageKeyValue: setupContainerPageKeyValue,
        pkiDecrypt: pkiDecrypt,
        setIsATeamItem: setIsATeamItem
    });

    $('#nextItemBtn').click(function(e) {
        getNextItemInContainer(itemCopy.container, itemCopy.position, function(err, itemId) {
            if (err) {

            } else {
                goGetItem(itemId);
            }
        });
        return false;
    });

    $('#previousItemBtn').click(function(e) {
        getPreviousItemInContainer(itemCopy.container, itemCopy.position, function(err, itemId) {
            if (err) {

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

    $('#moreActionsBtn').click(function(e) {
    	$(e.target).trigger('blur');
    	$('.itemBottomToolbar').removeClass('hidden');
    });

    $('#cancelMoreActionsBtn').click(function(e) {
    	$(e.target).trigger('blur');
    	$('.itemBottomToolbar').addClass('hidden');
    });

    $('#moveAnItemBtn').click(function(e) {
    	$(e.target).trigger('blur');
        handleMoveAnItem(e);
    });

    $('#trashAnItemBtn').click(function(e) {
        $(e.target).trigger('blur');
        handleTrashAnItem(e);
    });

    // added by <Said M> for issue #25

    // define div <images> for drag & drop multi files.    
    $('.images').css("border", '2px dashed grey');
    
    $('.images').on('drag dragstart dragend dragover dragenter dragleave drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
    })
    .on('dragover dragenter', function() {
        $('.images').css("background-color", 'aliceblue');
        console.log('edi1');
    })
    .on('dragleave dragend drop', function() {
        $('.images').css("background-color", 'white');
        console.log('edi2');
    })
    .on('drop', function(e) {
        $('.images').css("background-color", 'white');
        droppedFiles = e.originalEvent.dataTransfer.files;
        uploadImages(droppedFiles, 'appendToTheFront');
    });

    // define div <attachments> for drag & drop multi files.
    $('.attachments').css("border", '2px dashed grey');
    
    $('.attachments').on('drag dragstart dragend dragover dragenter dragleave drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
    })
    .on('dragover dragenter', function() {
        $('.attachments').css("background-color", 'blanchedalmond');
    })
    .on('dragleave dragend drop', function() {
        $('.attachments').css("background-color", 'white');
    })
    .on('drop', function(e) {
        $('.attachments').css("background-color", 'white');
        droppedFiles = e.originalEvent.dataTransfer.files;
        for (var i = 0; i < droppedFiles.length; i++) {
            var file = droppedFiles[i];
            var $attachment = showAttachment(file.name, file.size);
            $attachment.data('file', file);
            changeUploadingState($attachment, "Pending");

            queueUploadAttachment($attachment);
        }
    });

    // ended by <Said M> for issue #25
    
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
    initContainerFunctions('', '', decryptResult, '', '', '', '');

    bSafesPreflight(function(err, key, thisPublicKey, thisPrivateKey, thisSearchKey) {
        if (err) {
            alert(err);
        } else {
            expandedKey = key;
            publicKeyPem = thisPublicKey;
            privateKeyPem = thisPrivateKey;
            getPageItem(itemId, expandedKey, thisPrivateKey, thisSearchKey, function(err, item) {
                if (err) {
                    alert(err);
                } else {
                    itemPosition = item.position;
                }
            });
            positionItemNavigationControls();
        }
    });
};