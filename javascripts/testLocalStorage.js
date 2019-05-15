(function(){
	var thisHud = localStorage.getItem("hoNo!@#$");
	
	var thisBuffer = forge.util.createBuffer();
          thisBuffer.putBytes(thisHud);

					$.post('/memberAPI/getContent', {
						}, function(data, textStatus, jQxhr ){
							if(data.status === 'ok') {
								var sessionKey = data.sessionKey;
								var sessionIV = data.sessionIV;

		          	var decipher = forge.cipher.createDecipher('AES-CBC', sessionKey);
    		      	decipher.start({iv: sessionIV});
        		  	decipher.update(thisBuffer);
          			decipher.finish();
          			var decrypted = decipher.output;
          			// outputs decrypted hex
          			console.log("decrypted:", decrypted);
								$('p').text(decrypted.data);
							}
						}, 'json');
}());
