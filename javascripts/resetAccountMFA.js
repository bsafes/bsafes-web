function loadPage() {
  var memberId = $('.loginUserId').text();

  $("#reset").click(function(event) {
    event.preventDefault();
    var pin = $("#resetPIN").val();
    $.post('/verifyAndResetAccountMFA', {
      pin: pin,
      antiCSRF: bSafesCommonUIObj.antiCSRF
    }, function(data, textStatus, jQxhr) {
      if (data.status === 'ok') {
        window.location.href = '/member';
      } else {
        alert(data.err);
        $("#resetPIN").val("");
      }
    }, 'json');
  });
}