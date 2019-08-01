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

    {
        $("<style>")
        .prop("type", "text/css")
        .html("\
            @keyframes aniVertical {\
                0% {\
                    opacity: 0.3;\
                }\
                50% {\
                    opacity: 1;\
                }\
                100% {\
                    opacity: 0.3;\
                }\
            }\
            .loading {\
                height: 30px;\
                border-radius: 20px;\
                background-color: #E2E2E2;\
                animation: aniVertical 3s ease;\
                animation-iteration-count: infinite;\
                animation-fill-mode: forwards;\
                opacity: 0;\
            }\
            .content-loading {\
                height: 20px;\
                margin-top:20px;\
                background-color: #E2E2E2;\
                border-radius: 10px;\
                animation: aniVertical 5s ease;\
                animation-iteration-count: infinite;\
                animation-fill-mode: forwards;\
                opacity: 0;\
            }")
        .appendTo("head");

        $('.froala-editor#title').addClass('loading');
        $('.froala-editor#content').append( "<div class='content-loading' style='width:100%;'></div>" );
        $('.froala-editor#content').append( "<div class='content-loading' style='width:70%;'></div>" );
        $('.froala-editor#content').append( "<div class='content-loading' style='width:80%;'></div>" );
        $('.froala-editor#content').append( "<div class='content-loading' style='width:60%;'></div>" );
        $('.froala-editor#content').append( "<div class='content-loading' style='width:90%;'></div>" );
        $('.commentsSearchResults').addClass('loading col-xs-12 col-xs-offset-0 col-sm-10 col-sm-offset-1 col-md-8 col-md-offset-2');
    }

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