(function(){
	var memberLockBSafes = false;
	var memberSignedOut = false;

  $('.lockBSafes').click(function(e) {
		memberLockBSafes = true;
  });

	$('.signOut').click(function(e) {
		memberSignedOut = true;
  });

  var locking = false;

  function setLastActiveTime() {
    lastActiveTime = Date.now();
    localStorage.setItem("lastActiveTime", lastActiveTime.toString());
  };

  function checkLastActiveTime() {
    if(locking) return 1;

   	var lastActiveTime = localStorage.getItem("lastActiveTime");

    lastActiveTime = parseInt(lastActiveTime);
    var idleTime = Date.now() - lastActiveTime;

    if (idleTime > 43200000) {
      locking = true;
      lockBSafes("auto");
      return 1;
    }
    return 0;
  };

  var handleMemberActiveEvent = function (e) {
    if(!checkLastActiveTime()) setLastActiveTime();
  };

  //Zero the idle timer on mouse movement.
  $(this).mousemove(handleMemberActiveEvent);
  $(this).keyup(handleMemberActiveEvent);
  $(window).scroll(handleMemberActiveEvent);
  
	setLastActiveTime();

  function checkState() {
		if(memberSignedOut) {
			localStorage.clear();
			window.location.replace("/signOut");
			return;
		}
		if(memberLockBSafes) {
			locking = true;
			lockBSafes("manual");
			return;
		}
		checkLastActiveTime();
    var isSignedIn = localStorage.getItem("isSignedIn");
    if(isSignedIn && (isSignedIn === "true")) {
      console.log("signedIn");
      var isKeySetup = localStorage.getItem("encodedSearchKeyIV");
			if(!isKeySetup) {
				lockBSafes("auto");
			}	
      setTimeout(checkState, 1000);
			return;
    } else {
      window.location.replace("/");
    }
  }
	setTimeout(checkState, 1000);
}());
