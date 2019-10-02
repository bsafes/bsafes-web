(function(){
	console.log("Please enter your key");

	var keySalt;

	$.post('/memberAPI/keyEnterPreflight', {
		}, function(data, textStatus, jQxhr ){
			if(data.status === 'ok') {
				keySalt = data.keySalt;	
			} else {
				alert("System Error: Please reload this page and try again!");
			}
		}, 'json');	

	$('#enterKey').on('input', function(){
		$('.reEnterHint').addClass('hidden');
	});

	function testRSA() {
			var pki = forge.pki;
			var rsa = forge.pki.rsa;
			
			rsa.generateKeyPair({bits:2048, workers:-1}, function(err, keypair){
				var publicKey = keypair.publicKey;
				var privateKey = keypair.privateKey;
				var publicKeyPem = pki.publicKeyToPem(publicKey);
				var publicKeyFromPem = pki.publicKeyFromPem(publicKeyPem);
				var privatePem = pki.privateKeyToPem(privateKey);
				var privateKeyFromPem = pki.privateKeyFromPem(privatePem);
			
				var data = "ABCDEFGHIJKLMNOPQRSTUVabcdefghijklmnopqrstuv123456";
				var encrypted = publicKeyFromPem.encrypt(data);
				var decrypted = privateKeyFromPem.decrypt(encrypted);
			});
	};

	$('#enterDoneButton').click(function(e) {
		e.preventDefault();
		var goldenKey = $('#enterKey').val();

		testRSA();
		return 0;
		var expandedKey = forge.pkcs5.pbkdf2(goldenKey, keySalt, 10000, 32);
	
		var md = forge.md.sha256.create();
		md.update(expandedKey);
		var keyHash = md.digest().toHex();
		$.post('/memberAPI/verifyKeyHash', {
				"keyHash": keyHash
			},function(data, textStatus, jQxhr ){
				console.log(data);
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
					var thisDiscovery = localStorage.getItem("encodedGold");
					var decoded = forge.util.decode64(thisDiscovery);

          var thisBuffer = forge.util.createBuffer();
          thisBuffer.putBytes(decoded);

          var decipher = forge.cipher.createDecipher('AES-CBC', sessionKey);
          decipher.start({iv: sessionIV});
          decipher.update(thisBuffer);
          decipher.finish();
          var decrypted = decipher.output;
					

					window.location.replace('/safe/'); 
				} else {
					console.log(data.error);
					$('.reEnterHint').removeClass('hidden');
					$('#enterKey').val('');
				}
			}, 'json'); 
	});
}());
