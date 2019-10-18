function loadPage() {
    var pki = forge.pki;
    var rsa = forge.pki.rsa;

    var teamId;
    var isATeamSpace = false;
    var currentKeyVersion = 1;
    var currentPath;

    var expandedKey;
    var publicKeyPem;
    var privateKeyPem;
    var searchKey;
    var teamKey;
    var teamSearchKey;

    var currentMode;

    var selectedItemType = null;
    var addAction = 'addAnItemOnTop';
    var $addTargetItem;

    var currentContentsPage = 1;
    var itemsPerPage = 20;
    var lastSearchTime;
    var lastSearchTokensStr;

    var memberId = $('.loginUserId').text();
    if (memberId.substring(0, 1) === 'T') {
        $('.accessTrialRow').removeClass('hidden');
        $('.accessTrialRow').click(function(e) {
            $('.fullId').text(memberId);
            lastFour = memberId.substring(memberId.length - 4);
            $('.lastFourOfId').text(lastFour);
            var accessLink = "http://localhost:3000/T/" + memberId;
            $('#copyLinkInput').val(accessLink);
            $('.copyLinkModal').modal('show');
            setTimeout(function() {
                var target = document.getElementById("copyLinkInput");
                target.select();
            }, 300);
            $('#copyLinkBtn').off();
            $('#copyLinkBtn').click(function(e) {
                document.execCommand("copy");
                return false;
            });
        });
    }
    teamId = $('#teamId').text();
    var currentSpace;

    if (teamId.substring(0, 1) === 'u') {
        $('#teamName').text('Personal');
        currentSpace = teamId + ':' + currentKeyVersion + ':' + '0';
    } else {
        isATeamSpace = true;
        currentSpace = teamId + ':' + '1' + ':' + '0';
    }

    $('#activitiesLink').attr('href', '/activities/' + currentSpace);
    initCurrentSpace(currentSpace);
    $('#teamsBtn').click(function(e) {
        e.preventDefault();
        window.location.href = '/teams/';
        return false;
    });

    var decryptResult = function(encryptedData, iv) {
        if (isATeamSpace) {
            var decryptedData = decryptBinaryString(encryptedData, teamKey, iv);
        } else {
            var decryptedData = decryptBinaryString(encryptedData, expandedKey, iv);
        }
        return decryptedData;
    };

    var getEnvelopeKey = function() {
        if (isATeamSpace) {
            return teamKey;
        } else {
            return expandedKey;
        }
    };

    var getSearchKey = function() {
        if (isATeamSpace) {
            return teamSearchKey;
        } else {
            return searchKey;
        }
    };

    var updateKeyValue = function(key, value) {
        switch (key) {
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
                currentContentsPage = value;
                break;
            default:
        }
    };

    var updateToolbar = function(selectedItems) {
        var $checkedItems = $('input:checked');
        var numberOfSelectedItems = selectedItems.length;
        console.log('Selected Items:', numberOfSelectedItems);
        if (numberOfSelectedItems) {
            $('.itemsActionBtn').removeClass('hidden');
            $('.itemActionBtn').removeClass('hidden disabled');
            $('.addItemBtn').addClass('hidden');
            $checkedItems.each(function(index, element) {
                $(element).closest('.resultItem').find('.itemActionBtn').addClass('disabled');
            });
            $(".itemsToolbar").removeClass('hidden');
        } else {
            $('.itemsActionBtn').addClass('hidden');
            $('.itemActionBtn').addClass('hidden');
            if (currentMode !== "search") {
                $('.addItemBtn').removeClass('hidden');
            }
            $(".itemsToolbar").addClass('hidden');
        }
    };

    $('#moveItemsBtn').click(function(e) {
        $(e.target).trigger('blur');
        var isModalVisible = $('#moveItemsModal').is(':visible');
        if (!isModalVisible) {
            showMoveItemsModal(currentSpace);
        }

        return false;
    });

    $('#trashItemsBtn').click(function(e) {
        $(e.target).trigger('blur');
        var isModalVisible = $('#trashModal').is(':visible');
        if (!isModalVisible) {
            showTrashItemsModal(currentSpace, currentSpace);
        }
        return false;
    });

    $('.closeTrashModal').click(function(e) {
        hideTrashItemsModal();
    });

    $('#openTrashBox').click(function(e) {
        var trashBoxLink = "/trashBox/" + currentSpace;
        window.location.href = trashBoxLink;
    });

    function searchByTokens(searchTokensStr, pageNumber) {
        $.post('/memberAPI/search', {
            teamSpace: currentSpace,
            searchTokens: searchTokensStr,
            size: itemsPerPage,
            from: (pageNumber - 1) * itemsPerPage
        }, function(data, textStatus, jQxhr) {
            if (data.status === 'ok') {
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
        $('.cancelSearchRow').removeClass('hidden');
        if (lastSearchTime) {
            /* Avoiding consecutive search in IE */
            var thisTime = Date.now();
            if ((thisTime - lastSearchTime) < 3000) {
                if (e) {
                    return false;
                } else {
                    return;
                }
            }
        }
        if (e) e.preventDefault();
        currentMode = "search";
        resetPagination();
        $('.resultItems').empty();
        $('#searchInput').off('change');
        var str = $('#searchInput').val();
        $('#searchInput').val('');

        var thisSearchKey = isATeamSpace ? teamSearchKey : searchKey;

        var searchTokens = stringToEncryptedTokens(str, thisSearchKey);
        var searchTokensStr = JSON.stringify(searchTokens);
        lastSearchTokensStr = searchTokensStr;

        searchByTokens(searchTokensStr, 1);

        lastSearchTime = Date.now();

        $('#searchInput').on('change', search);
        if (e) return false;
    };

    $('#searchInput').on('change', search);

    $('#searchBtn').on('click', function(e) {
        e.preventDefault();
        $('#searchBtn').trigger('blur');
        search();
        return false;
    });

    $('#cancelSearchBtn').click(function(e) {
        $('#cancelSearchBtn').trigger('blur');
        $('.cancelSearchRow').addClass('hidden');

        $('#listAllItems').trigger('click');
        return false;
    });

    /***  Creating an item ***/

    $('.safeItemOption').on('click', function(e) {
        if (addAction) {
            e.preventDefault();

            safeItemIsSelected(e, addAction);

            return false;
        }
    });

    $('#createAnItem').click(function(e) {
        e.preventDefault();

        createANewItem(currentSpace, selectedItemType, addAction, $addTargetItem, getEnvelopeKey, getSearchKey);

        return false;
    });

    $('.closeTitleModal').click(function(e) {
        e.preventDefault();
        addAction = 'addAnItemOnTop';
        selectedItemType = null;
        return false;
    });

    $('#closeNewItemOptionsModal').on('click', function(e) {
        addAction = 'addAnItemOnTop';
    });

    /*** End of creating an item ***/

    function resetPagination() {
        currentContentsPage = 1;
        $('.containerContentsPagination').empty();
        $('.containerContentsPagination').addClass('hidden');
    }

    /* List Section */
    var listItems = function(pageNumber) {
        $('.resultItems').empty();

        $.post('/memberAPI/listItems', {
            container: currentSpace,
            size: itemsPerPage,
            from: (pageNumber - 1) * itemsPerPage
        }, function(data, textStatus, jQxhr) {
            if (data.status === 'ok') {
                currentContentsPage = pageNumber;
                var total = data.hits.total;
                var hits = data.hits.hits;
                hideLoading();
                if (total === 0) {
                    $(".gettingStartedNotice").removeClass('hidden');
                } else {
                    $(".gettingStartedNotice").addClass('hidden');
                }
                displayHits(currentMode, hits);
                updatePagination(currentMode, currentContentsPage, total, itemsPerPage, lastSearchTokensStr);
            }
        }, 'json');
    }

    initContainerFunctions(listItems, searchByTokens, decryptResult, updateToolbar, updateKeyValue, showLoading, hideLoading);

    $("#deselectItems").click(function(e) {
        deselectItems(e);
    });

    $('#listAllItems').click(function(e) {
        e.preventDefault();
        currentMode = "listAll";
        resetPagination();
        var target = $(e.target).closest('li');
        target.addClass('active');
        listItems(1);
        return false;
    });

    $('#list').click(function(e) {
        e.preventDefault();
        $('#listAllItems').trigger('click');
        return false;
    });

    showLoading();

    bSafesPreflight(function(err, key, thisPublicKey, thisPrivateKey, thisSearchKey) {
        if (err) {
            alert(err);
        } else {
            expandedKey = key;
            searchKey = thisSearchKey;

            if (teamId.substring(0, 1) === 't') {
                publicKeyPem = thisPublicKey;
                privateKeyPem = thisPrivateKey;
                getTeamData(teamId, function(err, team) {
                    if (err) {

                    } else {
                        var teamKeyEnvelope = team.teamKeyEnvelope;
                        var privateKeyFromPem = pki.privateKeyFromPem(privateKeyPem);
                        var encodedTeamKey = privateKeyFromPem.decrypt(teamKeyEnvelope);
                        teamKey = forge.util.decodeUtf8(encodedTeamKey);
                        var encryptedTeamName = team.team._source.name;
                        var teamIV = team.team._source.IV;
                        var encodedTeamName = decryptBinaryString(encryptedTeamName, teamKey, teamIV);
                        var teamName = forge.util.decodeUtf8(encodedTeamName);
                        teamName = DOMPurify.sanitize(teamName);
                        var length = teamName.length;
                        if (teamName.length > 20) {
                            var displayTeamName = teamName.substr(0, 20);
                        } else {
                            var displayTeamName = teamName;
                        }
                        $('.navbarTeamName').text(displayTeamName);

                        var teamSearchKeyEnvelope = team.team._source.searchKeyEnvelope;
                        var teamSearchKeyIV = team.team._source.searchKeyIV;

                        teamSearchKey = decryptBinaryString(teamSearchKeyEnvelope, teamKey, teamSearchKeyIV);


                        document.title = teamName;
                        $('.teamName').text(teamName);
                        $('#listAllItems').trigger('click');

                        var $newTab = $('.newTabTemplate').clone().removeClass('newTabTemplate hidden').addClass('newTab');
                        $newTab.find('a').text(displayTeamName);
                        $newTab.find('a').attr('href', '/team/' + teamId);
                        $newTab.insertAfter($("#newTabHint"));
                    }
                });
            } else {
                $('.navbarTeamName').text("Yours");
                $('#listAllItems').trigger('click');
                var $newTab = $('.newTabTemplate').clone().removeClass('newTabTemplate hidden').addClass('newTab');
                $newTab.find('a').text('Personal');
                $newTab.find('a').attr('href', '/safe');
                $newTab.insertAfter($("#newTabHint"));
            }
        }
    });
};