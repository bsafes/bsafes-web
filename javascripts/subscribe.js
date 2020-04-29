(function(){
		var $body = $("body");
		showLoadingIn($body);
    var button = document.querySelector('#submit-button');
		var clientToken = $('#clientToken').text();
    braintree.dropin.create({
      authorization: clientToken,
      container: '#dropin-container'
    }, function (createErr, instance) {
			hideLoadingIn($body);
			$('#submit-button').removeClass('hidden');
      button.addEventListener('click', function () {
				var plan = $('input[name="plan"]:checked').val();
				$('#submit-button').addClass('hidden');
        instance.requestPaymentMethod(function (err, payload) {
					if(err) {
						$('#payAgain').removeClass('hidden');
						$('#submit-button').removeClass('hidden');
					} else {
						showLoadingIn($body);
          	// Submit payload.nonce to your server
          	console.log(payload.nonce);
          	$.post('/memberAPI/subscribe', {
							plan: plan,
            	paymentMethodNonce: payload.nonce
          	}, function(data, textStatus, jQxhr) {
							if(data.status === "error") {
								$('#payAgain').removeClass('hidden');
            		$('#submit-button').removeClass('hidden');
							} else {
								$('#subscribe').addClass('hidden');
								$('#thankYouForSubscription').removeClass('hidden');
							}
							hideLoadingIn($body);
          	});
					}
        });
      });
    });

		//**** PayPal ****
		braintree.client.create({
  		authorization: clientToken 
		}, function (clientErr, clientInstance) {

  		// Stop if there was a problem creating the client.
  		// This could happen if there is a network error or if the authorization
  		// is invalid.
  		if (clientErr) {
    		console.error('Error creating client:', clientErr);
    		return;
  		}

  		// Create a PayPal Checkout component.
  		braintree.paypalCheckout.create({
    		client: clientInstance
  		}, function (paypalCheckoutErr, paypalCheckoutInstance) {

    		// Stop if there was a problem creating PayPal Checkout.
    		// This could happen if there was a network error or if it's incorrectly
    		// configured.
    		if (paypalCheckoutErr) {
      		console.error('Error creating PayPal Checkout:', paypalCheckoutErr);
      		return;
    		}

    		// Set up PayPal with the checkout.js library
    		paypal.Button.render({
      		env: 'sandbox', // or 'sandbox' or 'production'

      		payment: function () {
        		return paypalCheckoutInstance.createPayment({
          		// Your PayPal options here. For available options, see
          		// http://braintree.github.io/braintree-web/current/PayPalCheckout.html#createPayment
          		flow: 'vault'
        		});
      		},

      		onAuthorize: function (data, actions) {
        		return paypalCheckoutInstance.tokenizePayment(data, function (err, payload) {
						var plan = $('input[name="plan"]:checked').val();
            showLoadingIn($body);
            	// Submit payload.nonce to your server
            	console.log(payload.nonce);
            	$.post('/memberAPI/subscribe', {
              	plan: plan,
              	paymentMethodNonce: payload.nonce
            	}, function(data, textStatus, jQxhr) {
              	if(data.status === "error") {
                	$('#payAgain').removeClass('hidden');
                	$('#submit-button').removeClass('hidden');
              	} else {
                	$('#subscribe').addClass('hidden');
                	$('#thankYouForSubscription').removeClass('hidden');
              	}
              	hideLoadingIn($body);
            	});
        		});
      		},

      		onCancel: function (data) {
        		console.log('checkout.js payment cancelled', JSON.stringify(data, 0, 2));
      		},

      		onError: function (err) {
        		console.error('checkout.js error', err);
      		}
    		}, '#paypal-button').then(function () {
      		// The PayPal button will be rendered in an html element with the id
      		// `paypal-button`. This function will be called when the PayPal button
      		// is set up and ready to be used.
					console.log("Ready for PayPal");
    		});
  		});
	});
}())
