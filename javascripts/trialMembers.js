(function(){
	var from = 0;
	var size = 10;

	function displayHits(hits) {
		for(var i=0; i<hits.length; i++) {
			var $resultItem = $('.resultItemTemplate').clone().removeClass('resultItemTemplate hidden').addClass('resultItem');
			var memberId = hits[i]._id;
			var lastFour = memberId.substring(memberId.length - 4);
			var link = 'https://www.bsafes.com/T/' + memberId;
			//link = 'http://localhost:3000/T/' + memberId;

			$resultItem.find('.itemLink').attr('href', link);
			$resultItem.find('.lastFour').text(lastFour);
			$resultItem.find('.itemTitle').text(memberId);
			$('.resultItems').append($resultItem);
		}
	};

	function searchTrialMemberByLastFour() {
    var lastFour = $('#searchInput').val();
    $('.resultItems').empty();
    $.post('/searchTrialMemberByLastFour', {
      lastFour: lastFour
    }, function(data, textStatus, jQxhr ){
      if(data.status === 'ok') {
        var hits = data.hits.hits;
        displayHits(hits);
      }
    });
	}

	$('#searchBtn').click(function(e) {
		searchTrialMemberByLastFour();
	});

	$('#searchInput').keyup(function(e){
    if(e.keyCode == 13)
    {
			searchTrialMemberByLastFour();
    }
	});

	$('#moreBtn').click(function(e) {
		from = from + size;
		listTrialMembers();
		return false;
	});

	function listTrialMembers() {
		$.post('/listTrialMembers', {
			from: from,
			size: size
		}, function(data, textStatus, jQxhr ){
			if(data.status === 'ok') {
				var total = data.hits.total;
				var hits = data.hits.hits;
				if(hits.length) {
					displayHits(hits);
				}
				if((from + size) < total) {
					$('.moreRow').removeClass('hidden');
				} else {
					$('.moreRow').addClass('hidden');
				} 
			} else {
			}
		}, 'json');	
	}

	listTrialMembers();
}());
