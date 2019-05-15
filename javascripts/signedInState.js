(function(){
	var memberSignedOut = false;

	$('.signOut').click(function(e) {
    memberSignedOut = true;
  });

	localStorage.clear();	
	$.post('/isMemberSignedIn', {
	}, function(data, textStatus, jQxhr ){
		if(data.status === 'yes') {
			localStorage.setItem("isSignedIn", "true");
			setTimeout(checkState, 1000);	
		} else {
			window.location.reload(true);
		}
	}, 'json');
	
	function checkState() {
		if(memberSignedOut) {
      localStorage.clear();
      window.location.replace("/signOut");
      return;
    }

		var isSignedIn = localStorage.getItem("isSignedIn");
		if(isSignedIn && (isSignedIn === "true")) {
			console.log("signedIn");
			var isKeySetup = localStorage.getItem("encodedSearchKeyIV");
			var redirectURL = $('.redirectURL').text();
			if(redirectURL && (redirectURL !== 'undefined')) {
			
			} else {
				redirectURL = '/';
			}
			if(isKeySetup) {
				window.location.replace(redirectURL);
			}
			setTimeout(checkState, 1000);
		} else {
			window.location.replace("/");
		} 
	}
}());
