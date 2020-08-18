(function(){
		var $body = $("body");
    var button = document.querySelector('#submit-button');
		var confirmEnabled = false;
		$('#packs').on('input', function(){
			var packs = $(this).val();
			var total = packs * 9.99;
			$('#total').text("pack(s), $" + total + " usd");
		});

		var $thisBtn = $("#confirmBtn");
		$('#buyButton').click(function(e) {
			$("#confirmModal").modal('show');
			$thisBtn.addClass('disabled');
			return false;
		});

		$('#confirmInput').on('input', function() {
			var thisInput = $(this).val();
        if (thisInput === 'Yes') {
            $thisBtn.removeClass('disabled');
            confirmEnabled = true;
        } else {
            $thisBtn.addClass('disabled');
            confirmEnabled = false;
        }	
		});

		$('#confirmBtn').click(function(e) {
			var packs = $('#packs').val();
			$.post('/memberAPI/buyingQuotas', {
				packs: qupacksantity,
				antiCSRF: bSafesCommonUIObj.antiCSRF
			}, function(data, textStatus, jQxhr ){
      	if(data.status === 'ok') {
	
      	} else {

      	}
    	}, 'json');			
		});
}())
