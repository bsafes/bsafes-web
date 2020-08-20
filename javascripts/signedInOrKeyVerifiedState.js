(function() {
  var isKeySetup = localStorage.getItem("encodedSearchKeyIV");
  if (isKeySetup) {
    var memberLockBSafes = false;

    $('.lockBSafes').click(function(e) {
      memberLockBSafes = true;
    });
    var locking = false;

    var lastActiveTime;

    function setLastActiveTime() {
      lastActiveTime = Date.now();
      localStorage.setItem("lastActiveTime", lastActiveTime.toString());
    };

    function checkLastActiveTime() {
      if (locking) return 1;

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

    var handleMemberActiveEvent = function(e) {
      if (!checkLastActiveTime()) setLastActiveTime();
    };
    //Zero the idle timer on mouse movement.
    $(this).mousemove(handleMemberActiveEvent);
    $(this).keyup(handleMemberActiveEvent);
    $(window).scroll(handleMemberActiveEvent);

    setLastActiveTime();

  } else {
    var memberLockBSafes = true;
    var locking = true;
  }
  var memberSignedOut = false;

  $('.signOut').click(function(e) {
    memberSignedOut = true;
  });

  $.post('/isMemberSignedIn', {
    antiCSRF: bSafesCommonUIObj.antiCSRF
  }, function(data, textStatus, jQxhr) {
    if (data.status === 'yes') {
      localStorage.setItem("isSignedIn", "true");
      setTimeout(checkState, 1000);
    } else {
      window.location.reload(true);
    }
  }, 'json');

  function checkState() {
    if (memberSignedOut) {
      localStorage.clear();
      window.location.replace("/signOut");
      return;
    }
    if (isKeySetup && memberLockBSafes) {
      locking = true;
      lockBSafes("manual");
      return;
    }
    if (isKeySetup) {
      checkLastActiveTime();
    }
    var isSignedIn = localStorage.getItem("isSignedIn");
    if (isSignedIn && (isSignedIn === "true")) {
      console.log("signedIn");
      var thisKeySetup = localStorage.getItem("encodedSearchKeyIV");
      if (isKeySetup && !thisKeySetup) {
        lockBSafes("auto");
      }
      setTimeout(checkState, 1000);
    } else {
      window.location.replace("/");
    }
  }
}());