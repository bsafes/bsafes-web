function loadPage(){
  if(!argon2Functions.isBrowserSupported) {
    $(".note").removeClass("hidden");
    $(".keySetup").addClass("hidden");
    return;
  }
	console.log("Please set up your key");
	
	argon2Functions.loadArgon2('native-wasm');

	var goldenKey;
	var keySalt;
	var isKeyVerified = false;
	var isBoxChecked = false;

	function updateDoneButton() {
		if(isKeyVerified && isBoxChecked) {
			$('#setupDoneButton').removeClass('disabled');
		} else {
			$('#setupDoneButton').addClass('disabled');
		}
	}

	function checkKeyStrength(key) {
		console.log("Checking key strength:", key.length);
		strengthLevel = 'Invalid';
		var strongRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})");
		var mediumRegex = new RegExp("^(((?=.*[a-z])(?=.*[A-Z]))|((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(?=.{6,})");
		var isMedium = mediumRegex.test(key);
		if(isMedium){
			strengthLevel = 'Medium';
			var isStrong = strongRegex.test(key);
			if(isStrong) {
				strengthLevel = 'Strong';
			} 
		}
		var strengthProgress = key.length/8 * 100;
		$('#strengthProgress').css("width", strengthProgress + "%"); 
		var progressClass = "progress-bar-danger";
		var strengthColor = "red";
		switch(strengthLevel) {
			case 'Invalid':
				progressClass = "progress-bar-danger";		
				strengthColor = "red";	
				break;
			case 'Medium':
				progressClass = "progress-bar-warning";
				strengthColor = "orange";
				break;
			case 'Strong':
				progressClass = "progress-bar-success";
				strengthColor = "green";
				break;
			default:
		}
		$('#strengthProgress').removeClass("progress-bar-danger progress-bar-warning progress-bar-success");
		$('#strengthProgress').addClass(progressClass);
		$('#strengthText').css("color", strengthColor);
		$('#strengthText').text(strengthLevel);
	}

	$('#createKey').on('input', function(){
		$('.progress, #strengthText').removeClass('hidden');
		isKeyVerified = false;
		$('#setupDoneButton').addClass('disabled'); 
		$('#confirmKey').val('');
		$('#confirmText').text('');
		goldenKey = $(this).val();
		console.log(goldenKey);
		checkKeyStrength(goldenKey);
	});

	$('#confirmKey').on('input', function(){
		var confirmingKey = $(this).val();
		console.log(confirmingKey);
		if(confirmingKey === goldenKey){
			$('#confirmText').text('Ok');
			isKeyVerified = true;
			updateDoneButton();
			$('#keyReminderModal').modal('toggle');	
		} else {
			$('#confirmText').text('');
			isKeyVerified = false;
			updateDoneButton();
		}
	});

	$("#agreeBox").change(function() {
    if(this.checked) {
			isBoxChecked = true;
			updateDoneButton();
    } else {
			isBoxChecked = false;
			updateDoneButton();
		}
	});

	function generateRSAKeyPair (done) {
		var pki = forge.pki;
    var rsa = forge.pki.rsa;
		rsa.generateKeyPair({
			bits:2048, 
			workers:2
		}, function(err, keypair){
    	var publicKey = keypair.publicKey;
     	var privateKey = keypair.privateKey;
     	var publicKeyPem = pki.publicKeyToPem(publicKey);
	    var publicKeyFromPem = pki.publicKeyFromPem(publicKeyPem);
     	var privatePem = pki.privateKeyToPem(privateKey);
      var privateKeyFromPem = pki.privateKeyFromPem(privatePem);
			done(publicKeyPem, privatePem);	
    });
	};

	$('#setupDoneButton').click(function(e) {
		e.preventDefault();
		var keyHint = $('#inputHint').val() || "undefined";

		keySalt =	forge.random.getBytesSync(16);
		var encodedKeySalt = forge.util.encode64(keySalt);
		var time1 = Date.now();
		var expandedKey = argon2Functions.deriveKey(goldenKey, keySalt);
		var time2 = Date.now();
		var diff = time2 - time1;
		console.log("Diff: ", diff);

		var md = forge.md.sha256.create();
		md.update(expandedKey);
		var goldenKeyHash = md.digest().toHex();
		console.log(goldenKeyHash);
		$('.keySetup').addClass('hidden');
		$('.keyEnter').removeClass('hidden');


		var setupKeyHash = function(e) {
			e.preventDefault();
			var enterKey = $('#enterKey').val();

			var expandedKey = argon2Functions.deriveKey(enterKey, keySalt);

			var md = forge.md.sha256.create();
			md.update(expandedKey);
			var enterKeyHash = md.digest().toHex();
			if(enterKeyHash === goldenKeyHash){
				showLoadingIn($('.enterYourKeyRow'));
				generateRSAKeyPair(function(publicKey, privateKey) {

					var envelopeIV = forge.random.getBytesSync(16);
					var privateKeyEnvelope = encryptBinaryString(privateKey, expandedKey, envelopeIV);
					var encodedPrivateKeyEnvelope = forge.util.encode64(privateKeyEnvelope);
					var encodedEnvelopeIV = forge.util.encode64(envelopeIV);

					var salt = forge.random.getBytesSync(32);
  				var randomKey = forge.random.getBytesSync(32);
					var searchKey = forge.pkcs5.pbkdf2(randomKey, salt, 10000, 32);
					var searchKeyIV = forge.random.getBytesSync(16);
					var searchKeyEnvelope = encryptBinaryString(searchKey, expandedKey, searchKeyIV);
					var encodedSearchKeyEnvelope = forge.util.encode64(searchKeyEnvelope);
					var encodedSearchKeyIV = forge.util.encode64(searchKeyIV);

    			$.post('/memberAPI/setupKeyData', {
						"schemeVersion": 1,
        		"keyHash": goldenKeyHash,
						"keyHint": keyHint,
						"keySalt": encodedKeySalt,
						"publicKey": publicKey,
						"privateKeyEnvelope": encodedPrivateKeyEnvelope,
						"envelopeIV": encodedEnvelopeIV,
						"searchKeyEnvelope": encodedSearchKeyEnvelope,
						"searchKeyIV": encodedSearchKeyIV
      		},function(data, textStatus, jQxhr ){
        		console.log(data);
						hideLoadingIn($('.enterYourKeyRow'));
        		if(data.status === 'ok') {
          		var sessionKey = data.sessionKey;
          		var sessionIV = data.sessionIV;
  
          		var cipher = forge.cipher.createCipher('AES-CBC', sessionKey);
          		cipher.start({iv: sessionIV});
          		cipher.update(forge.util.createBuffer(expandedKey));
          		cipher.finish();
          		var encrypted = cipher.output;
							var encoded = forge.util.encode64(encrypted.data);
          		localStorage.setItem("encodedGold", encoded);
							localStorage.setItem("publicKey", publicKey);
							localStorage.setItem("encodedPrivateKeyEnvelope", encodedPrivateKeyEnvelope);
							localStorage.setItem("encodedEnvelopeIV", encodedEnvelopeIV);
							localStorage.setItem("encodedSearchKeyEnvelope", encodedSearchKeyEnvelope);
							localStorage.setItem("encodedSearchKeyIV", encodedSearchKeyIV);
						
							window.location.replace("/teams");
        		} else {
          		console.log(data.error);
							alert(data.error);
        		}
      		}, 'json');
				});
			} else {
				console.log('Wrong key!');
				$('#enterKey').on('input', function() {
					 $('.reCreateHint').addClass('hidden');		
				});
				$('#enterKey').val('');
				$('.reCreateHint').removeClass('hidden');
				$('#reCreateKeyButton').click(function(e) {
					$('#createKey').val('');
					$('#confirmKey').val('');
					$('#setupDoneKey').addClass('disabled');
					$('keySetup').removeClass('hidden');
					$('#enterKey').val('');
					$('.keyEnter').addClass('hidden');
				});
			} 
		};
		$('#enterDoneButton').click(setupKeyHash);
	});
};
