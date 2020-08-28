function loadPage() {
  var pki = forge.pki;
  var rsa = forge.pki.rsa;

  var currentKeyVersion = 1;

  var pki = forge.pki;
  var rsa = forge.pki.rsa;

  var expandedKey;
  var publicKeyPem;
  var privateKePemy;
  var quotaLastEvaluatedKey = null;
  var paymentLastEvaluatedKey = null;

  $('.viewQuotas').click(function(e) {
    e.preventDefault();
    $('#viewQuotas').addClass('hidden');
    $('#quotasHistory').removeClass('hidden');
    showLoadingIn($('#quotasHistoryTableBody'));
    $.post('/memberAPI/getQuotasHistory', {
      LastEvaluatedKey: JSON.stringify(quotaLastEvaluatedKey),
      antiCSRF: bSafesCommonUIObj.antiCSRF
    }, function(data, textStatus, jQxhr) {
      if (data.status === 'ok') {
        if (data.LastEvaluatedKey) {
          quotaLastEvaluatedKey = data.LastEvaluatedKey;
        }
        if (data.items.length) {
          $('#moreQuotas').removeClass("hidden");
        } else {
          $('#moreQuotas').addClass("hidden");
          $('#endOfQuotas').removeClass("hidden");
        }
        for (var i = 0; i < data.items.length; i++) {
          $quotasHistoryRow = $('.quotasHistoryRowTemplate').clone().removeClass('quotasHistoryRowTemplate hidden').addClass('quotasHistoryRow');
          var date = new Date(data.items[i].date);
          var dateString = date.getMonth() + '/' + date.getDate() + '/' + date.getFullYear();
          $quotasHistoryRow.find('#date').text(dateString);
          $quotasHistoryRow.find('#extraQuotas').text(data.items[i].extraQuotas);
          $quotasHistoryRow.find('#quotasInUse').text(data.items[i].quotasInUse);
          $quotasHistoryRow.find('#event').text(data.items[i].event);
          $quotasHistoryRow.find('#itemQuotasInUse').text(data.items[i].itemQuotasInUse);
          $quotasHistoryRow.find('#storageQuotasInUse').text(data.items[i].storageQuotasInUse);
          $quotasHistoryRow.find('#bandwidthQuotasInUse').text(data.items[i].bandwidthQuotasInUse);
          $quotasHistoryRow.find('#totalItemVersions').text(data.items[i].totalItemVersions);
          $quotasHistoryRow.find('#totalStorage').text(data.items[i].totalStorage);
          $quotasHistoryRow.find('bandwidth').text(data.items[i].bandwidth);
          $('#quotasHistoryTableBody').append($quotasHistoryRow)
        }
      } else {
				alert(data.err);
			}
      hideLoadingIn($('#quotasHistoryTableBody'));
    }, 'json');
    return false;
  });

  $('.viewPayments').click(function(e) {
    e.preventDefault();
    $('#viewPayments').addClass('hidden');
    $('#paymentsHistory').removeClass('hidden');
    showLoadingIn($('#paymentsHistoryTableBody'));
    $.post('/memberAPI/getPaymentsHistory', {
      LastEvaluatedKey: JSON.stringify(paymentLastEvaluatedKey),
      antiCSRF: bSafesCommonUIObj.antiCSRF
    }, function(data, textStatus, jQxhr) {
      if (data.status === 'ok') {
        if (data.LastEvaluatedKey) {
          paymentLastEvaluatedKey = data.LastEvaluatedKey;
        }
        if (data.items.length) {
          $('#morePayments').removeClass("hidden");
        } else {
          $('#morePayments').addClass("hidden");
          $('#endOfPayments').removeClass("hidden");
        }
        for (var i = 0; i < data.items.length; i++) {
          $paymentsHistoryRow = $('.paymentsHistoryRowTemplate').clone().removeClass('paymentsHistoryRowTemplate hidden').addClass('paymentsHistoryRow');
          var date = new Date(data.items[i].date);
          var dateString = date.getMonth() + '/' + date.getDate() + '/' + date.getFullYear();
          $paymentsHistoryRow.find('#date').text(data.items[i].time);
          $paymentsHistoryRow.find('#amount').text(data.items[i].amount);
          $paymentsHistoryRow.find('#event').text(data.items[i].recurring ? "Subscription" : "Bought Quotas");
          $('#paymentsHistoryTableBody').append($paymentsHistoryRow)
        }
      } else {
				alert(data.err);
			}
      hideLoadingIn($('#paymentsHistoryTableBody'));
    }, 'json');
    return false;
  });

};
