const __sliceLength = 512 * 1024;
const __encryptedDataSliceSize = 524304;
const __GCMOverhead = 8 + 12 + 16; //header + IV + tag 

var isSigningOutFunc;

function setCommonFunctions(funcKey, thisFunc) {
  switch (funcKey) {
    case "isSigningOut":
      isSigningOutFunc = thisFunc;
      break;
    default:
  }
};

function testBSafesCommon() {
  return true;
};

function escapeJQueryIdSelector(id) {
  return "#" + id.replace(/[!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~]/g, "\\$&");
}

function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function convertUint8ArrayToBinaryString(u8Array) {
  var i, len = u8Array.length,
    b_str = "";
  for (i = 0; i < len; i++) {
    b_str += String.fromCharCode(u8Array[i]);
  }
  return b_str;
}

function convertBinaryStringToUint8Array(bStr) {
  var i, len = bStr.length,
    u8_array = new Uint8Array(len);
  for (var i = 0; i < len; i++) {
    u8_array[i] = bStr.charCodeAt(i);
  }
  return u8_array;
}

function bSafesPreflight(fn) {
  var thisDiscovery = localStorage.getItem("encodedGold");
  if (!thisDiscovery) {
    lockBSafes("auto");
    return;
  }
  var sessionResetRequired = false;
  if (thisDiscovery === null) {
    sessionResetRequired = true
  }
  $.post('/memberAPI/preflight', {
    sessionResetRequired: sessionResetRequired,
    antiCSRF: bSafesCommonUIObj.antiCSRF
  }, function(data, textStatus, jQxhr) {
    if (data.status === 'ok') {
      var sessionKey = data.sessionKey;
      var sessionIV = data.sessionIV;

      var thisDiscovery = localStorage.getItem("encodedGold");
      var decoded = forge.util.decode64(thisDiscovery);

      var thisBuffer = forge.util.createBuffer();
      thisBuffer.putBytes(decoded);

      var decipher = forge.cipher.createDecipher('AES-CBC', sessionKey);
      decipher.start({
        iv: sessionIV
      });
      decipher.update(thisBuffer);
      decipher.finish();
      var expandedKey = decipher.output.data;

      var publicKey = localStorage.getItem("publicKey");
      var encodedPrivateKeyEnvelope = localStorage.getItem("encodedPrivateKeyEnvelope");
      var privateKeyEnvelope = forge.util.decode64(encodedPrivateKeyEnvelope);
      var encodedEnvelopeIV = localStorage.getItem("encodedEnvelopeIV");
      var envelopeIV = forge.util.decode64(encodedEnvelopeIV);

      var privateKey = decryptBinaryString(privateKeyEnvelope, expandedKey, envelopeIV);

      var encodedSearchKeyEnvelope = localStorage.getItem("encodedSearchKeyEnvelope");
      var searchKeyEnvelope = forge.util.decode64(encodedSearchKeyEnvelope);
      var encodedSearchKeyIV = localStorage.getItem("encodedSearchKeyIV");
      var searchKeyIV = forge.util.decode64(encodedSearchKeyIV);

      var searchKey = decryptBinaryString(searchKeyEnvelope, expandedKey, searchKeyIV);

      fn(null, expandedKey, publicKey, privateKey, searchKey);
    } else if (data.status === 'locked') {
      lockBSafes("byServer");
    } else if (data.status === 'MFA_required') {
      window.location.replace('/extraMFA');
    } else {
			alert(data.err);
      window.location.replace('/');
    }
  }, 'json');
};

function __estimateEncryptedDataSize(dataSize) {
  var numberOfSlice = Math.floor(dataSize / __sliceLength);
  var lastSliceLength = dataSize % __sliceLength;
  var encryptedDataSize;

  if (lastSliceLength) {
    encryptedDataSize = lastSliceLength + __GCMOverhead + numberOfSlice * (__sliceLength + __GCMOverhead);
  } else {
    encryptedDataSize = numberOfSlice * (__sliceLength + __GCMOverhead);
  }

  return encryptedDataSize;
};

function __estimateDecryptedDataSize(dataSize, mode) {
	var encryptedDataSliceSize = __encryptedDataSliceSize;
	if(mode === "GCMMode") {
		encryptedDataSliceSize = __sliceLength + __GCMOverhead;
	}
  var numberOfSlice = Math.floor(dataSize / encryptedDataSliceSize);
  var lastSliceLength = dataSize % encryptedDataSliceSize;
	if(lastSliceLength) {
		if(mode === "GCMMode") {
			var decryptedDataSize = numberOfSlice * __sliceLength + lastSliceLength - __GCMOverhead;
  	} else {
			var decryptedDataSize = numberOfSlice * __sliceLength + lastSliceLength - 1;
		}
	} else {
		var decryptedDataSize = numberOfSlice * __sliceLength;
	}
  return decryptedDataSize;
};

const GCMTag = "%GCM371%";

function encryptBinaryStringCBC(binaryString, key, iv) {
  var thisBuffer = forge.util.createBuffer();
  thisBuffer.putBytes(binaryString);
  cipher = forge.cipher.createCipher('AES-CBC', key);
  cipher.start({
    iv: iv
  });
  cipher.update(thisBuffer);
  cipher.finish();
  encryptedBinaryString = cipher.output.data;
  return encryptedBinaryString
}

function decryptBinaryStringCBC(binaryString, key, iv) {
  var thisBuffer = forge.util.createBuffer();
  thisBuffer.putBytes(binaryString);
  var decipher = forge.cipher.createDecipher('AES-CBC', key);
  decipher.start({
    iv: iv
  });
  decipher.update(thisBuffer);
  decipher.finish();
  var decryptedBinaryString = decipher.output.data;
  return decryptedBinaryString;
};

function encryptBinaryStringGCM(binaryString, key, iv) {
  var thisBuffer = forge.util.createBuffer();
  thisBuffer.putBytes(binaryString);

	var uniqueIV = forge.random.getBytesSync(12);
  var cipher = forge.cipher.createCipher('AES-GCM', key);
  cipher.start({
    iv: uniqueIV, // should be a 12-byte binary-encoded string or byte buffer
    tagLength: 128 // optional, defaults to 128 bits
  });
  cipher.update(forge.util.createBuffer(binaryString));
  cipher.finish();
  var encrypted = cipher.output;
  var tag = cipher.mode.tag;

  encryptedBinaryString = GCMTag + uniqueIV + cipher.mode.tag.data + cipher.output.data;
  return encryptedBinaryString
}

function decryptBinaryStringGCM(binaryString, key, iv) {
  var thisBuffer = forge.util.createBuffer();
  thisBuffer.putBytes(binaryString.slice(__GCMOverhead));
	var uniqueIV = binaryString.slice(8, 20);
  var tag = forge.util.createBuffer();
  tag.putBytes(binaryString.slice(20, __GCMOverhead));

  var decipher = forge.cipher.createDecipher('AES-GCM', key);
  decipher.start({
    iv: uniqueIV,
    tagLength: 128, // optional, defaults to 128 bits
    tag: tag // authentication tag from encryption
  });
  decipher.update(thisBuffer);
  var pass = decipher.finish();
  // pass is false if there was a failure (eg: authentication tag didn't match)
  var decryptedBinaryString = null;
  if(pass) {
    // outputs decrypted hex
    decryptedBinaryString = decipher.output.data;
  } else {
		alert("Corrupted data.");
	}
  return decryptedBinaryString;
};


function encryptBinaryString(binaryString, key, iv) {
	return encryptBinaryStringGCM(binaryString, key, iv);
}

function decryptBinaryString(binaryString, key, iv) {
	var header = binaryString.slice(0,8);
	if(header === GCMTag) {
		return decryptBinaryStringGCM(binaryString, key, iv);	
	}	else {
		return decryptBinaryStringCBC(binaryString, key, iv);
	}
};

function encryptLargeBinaryString(binaryString, key, iv) {
  var start = 0;
  var sliceLength = __sliceLength;
  var end;
  var encryptedString = "";
  var numberOfSlices = 0;

  while (1) {
    numberOfSlices++;
    end = start + sliceLength;
    if (end >= (binaryString.length)) {
      var sliceStr = binaryString.slice(start, binaryString.length);
      var encryptedSlice = encryptBinaryString(sliceStr, key, iv);
      encryptedString += encryptedSlice;
      console.log(sliceStr.length, encryptedSlice.length, encryptedString.length);
      break;
    } else {
      var sliceStr = binaryString.slice(start, end);
      var encryptedSlice = encryptBinaryString(sliceStr, key, iv);
      encryptedString += encryptedSlice;
      start = end;
      console.log(sliceStr.length, encryptedSlice.length, encryptedString.length);
    }
  }

  return encryptedString;
}

function decryptLargeBinaryString(binaryString, key, iv) {
	var header = binaryString.slice(0, 8);
	var GCMMode = false;
	if(header === GCMTag) {
		GCMMode = true;
	}
  var start = 0;
  var sliceLength = __encryptedDataSliceSize;
	if(GCMMode) {
    sliceLength = __sliceLength + __GCMOverhead;
  }
  var end;
  var decryptedString = "";
  var numberOfSlices = 0;
  while (1) {
    numberOfSlices++;
    end = start + sliceLength;
    if (end >= (binaryString.length)) {
      var sliceStr = binaryString.slice(start, binaryString.length);
      var decryptedSlice = decryptBinaryString(sliceStr, key, iv);
      decryptedString += decryptedSlice;
      console.log(sliceStr.length, decryptedSlice.length, decryptedString.length);
      break;
    } else {
      var sliceStr = binaryString.slice(start, end);
      var decryptedSlice = decryptBinaryString(sliceStr, key, iv);
      decryptedString += decryptedSlice;
      start = end;
      console.log(sliceStr.length, decryptedSlice.length, decryptedString.length);
    }
  }
  return decryptedString;
}

function encryptArrayBuffer(arrayBuffer, key, iv) {
  view = new DataView(arrayBuffer);
  var start = 0;
  var encryptedStart = 0;
  var sliceLength = __sliceLength;
  var end;
  var sliceStr;
  var encryptedSlice;

  var encryptedDataSize = __estimateEncryptedDataSize(arrayBuffer.byteLength);
  console.log("string.length, encryptedDataSize", arrayBuffer.byteLength, encryptedDataSize);

  var encryptedUint8Array = new Uint8Array(encryptedDataSize);
  var numberOfSlices = 0;
  while (1) {
    numberOfSlices++;
    sliceStr = "";
    end = start + sliceLength;
    if (end >= (arrayBuffer.byteLength)) {
      for (var offset = start; offset < arrayBuffer.byteLength; offset++) {
        sliceStr += String.fromCharCode(view.getUint8(offset, false));
      }
      encryptedSlice = encryptBinaryString(sliceStr, key, iv);
      for (var offset = encryptedStart; offset < encryptedStart + encryptedSlice.length; offset++) {
        encryptedUint8Array[offset] = encryptedSlice.charCodeAt(offset - encryptedStart);
      }
      break;
    } else {
      for (var offset = start; offset < end; offset++) {
        sliceStr += String.fromCharCode(view.getUint8(offset, false));
      }
      encryptedSlice = encryptBinaryString(sliceStr, key, iv);
      for (var offset = encryptedStart; offset < encryptedStart + __sliceLength + __GCMOverhead; offset++) {
        encryptedUint8Array[offset] = encryptedSlice.charCodeAt(offset - encryptedStart);
      }
      encryptedStart += __sliceLength + __GCMOverhead;
      start = end;
    }
  }
  return encryptedUint8Array;
}

function encryptArrayBufferAsync(arrayBuffer, key, iv, fn) {
  view = new DataView(arrayBuffer);
  var start = 0;
  var encryptedStart = 0;
  var sliceLength = __sliceLength;
  var end;
  var sliceStr;
  var encryptedSlice;

  var encryptedDataSize = __estimateEncryptedDataSize(arrayBuffer.byteLength);
  console.log("string.length, encryptedDataSize", arrayBuffer.byteLength, encryptedDataSize);

  var encryptedUint8Array = new Uint8Array(encryptedDataSize);
  var numberOfSlices = 0;

  function encryptASlice() {
    numberOfSlices++;
    console.log('encrypting slice:', numberOfSlices);
    sliceStr = ""
    end = start + sliceLength;
    if (end >= (arrayBuffer.byteLength)) {
      for (var offset = start; offset < arrayBuffer.byteLength; offset++) {
        sliceStr += String.fromCharCode(view.getUint8(offset, false));
      }
      encryptedSlice = encryptBinaryString(sliceStr, key, iv);
      console.log('encryptedSlice.length:', encryptedSlice.length);
      //var verifiedSlice = decryptBinaryString(encryptedSlice, key, iv);
      //console.log('verifiedSlice.length:', verifiedSlice.length);
      for (var offset = encryptedStart; offset < encryptedStart + encryptedSlice.length; offset++) {
        encryptedUint8Array[offset] = encryptedSlice.charCodeAt(offset - encryptedStart);
      }
      fn(encryptedUint8Array);
    } else {
      for (var offset = start; offset < end; offset++) {
        sliceStr += String.fromCharCode(view.getUint8(offset, false));
      }
      encryptedSlice = encryptBinaryString(sliceStr, key, iv);
      console.log('encryptedSlice.length:', encryptedSlice.length);
      //var verifiedSlice = decryptBinaryString(encryptedSlice, key, iv);
      //console.log('verifiedSlice.length:', verifiedSlice.length);
      for (var offset = encryptedStart; offset < encryptedStart + __sliceLength + __GCMOverhead; offset++) {
        encryptedUint8Array[offset] = encryptedSlice.charCodeAt(offset - encryptedStart);
      }
      encryptedStart += __sliceLength + __GCMOverhead;
      start = end;
      setTimeout(encryptASlice, 0);
    }
  };

  setTimeout(encryptASlice, 300);
}

function decryptArrayBufferAsync(arrayBuffer, key, iv, fn) {
  var view = new DataView(arrayBuffer);
	var mode = "";
	var header = "";
	for(var i=0; i< 8; i++) {
		header += String.fromCharCode(view.getUint8(i, false));
	}
	if(header === GCMTag) {
		mode = "GCMMode";
	}
  var start = 0;
  var decryptedStart = 0;
  var sliceLength = __encryptedDataSliceSize;
	if(mode === "GCMMode") {
		sliceLength = __sliceLength + __GCMOverhead;
	}
  var end;
  var sliceStr;
  var decryptedSlice;
  var decryptedDataSize = __estimateDecryptedDataSize(arrayBuffer.byteLength, mode);
  var decryptedUint8Array = new Uint8Array(decryptedDataSize);
  var numberOfSlices = 0;
  var decryptedLength = 0;

  function decryptASlice() {
    numberOfSlices++;
    console.log('decrypting slice:', numberOfSlices);
    sliceStr = "";
    end = start + sliceLength;
    if (end >= (arrayBuffer.byteLength)) {
      for (var offset = start; offset < arrayBuffer.byteLength; offset++) {
        sliceStr += String.fromCharCode(view.getUint8(offset, false));
      }
      console.log('sliceStr length:', sliceStr.length);
      decryptedSlice = decryptBinaryString(sliceStr, key, iv);
      decryptedLength += decryptedSlice.length;
      console.log('decryptedSlice length, totalLength:', decryptedSlice.length, decryptedLength);
      for (var offset = decryptedStart; offset < decryptedStart + decryptedSlice.length; offset++) {
        decryptedUint8Array[offset] = decryptedSlice.charCodeAt(offset - decryptedStart);
      }
      var actualDataInUnit8Array = decryptedUint8Array.subarray(0, decryptedLength);
      fn(actualDataInUnit8Array);
    } else {
      for (var offset = start; offset < end; offset++) {
        sliceStr += String.fromCharCode(view.getUint8(offset, false));
      }
      console.log('sliceStr length:', sliceStr.length);
      decryptedSlice = decryptBinaryString(sliceStr, key, iv);
      decryptedLength += decryptedSlice.length;
      console.log('decryptedSlice length, totalLength:', decryptedSlice.length, decryptedLength);
      for (var offset = decryptedStart; offset < decryptedStart + __sliceLength; offset++) {
        decryptedUint8Array[offset] = decryptedSlice.charCodeAt(offset - decryptedStart);
      }
      decryptedStart += __sliceLength;
      start = end;
      setTimeout(decryptASlice, 0);
    }
  }

  setTimeout(decryptASlice, 300);
}

function decryptArrayBuffer(arrayBuffer, key, iv) {
  var view = new DataView(arrayBuffer);
  var mode = "";
  var header = "";
  for(var i=0; i< 8; i++) {
    header += String.fromCharCode(view.getUint8(i, false));
  }
  if(header === GCMTag) {
    mode = "GCMMode";
  }
  var start = 0;
  var decryptedStart = 0;
  var sliceLength = __encryptedDataSliceSize;
  if(mode === "GCMMode") {
    sliceLength = __sliceLength + __GCMOverhead;
  }
  var end;
  var sliceStr;
  var decryptedSlice;
  var decryptedDataSize = __estimateDecryptedDataSize(arrayBuffer.byteLength, mode);
  var decryptedUint8Array = new Uint8Array(decryptedDataSize);
  var numberOfSlices = 0;
  var decryptedLength = 0;

  while (1) {
    numberOfSlices++;
    sliceStr = "";
    end = start + sliceLength;
    if (end >= (arrayBuffer.byteLength)) {
      for (var offset = start; offset < arrayBuffer.byteLength; offset++) {
        sliceStr += String.fromCharCode(view.getUint8(offset, false));
      }
      decryptedSlice = decryptBinaryString(sliceStr, key, iv);
      decryptedLength += decryptedSlice.length;
      for (var offset = decryptedStart; offset < decryptedStart + decryptedSlice.length; offset++) {
        decryptedUint8Array[offset] = decryptedSlice.charCodeAt(offset - decryptedStart);
      }
      break;
    } else {
      for (var offset = start; offset < end; offset++) {
        sliceStr += String.fromCharCode(view.getUint8(offset, false));
      }
      decryptedSlice = decryptBinaryString(sliceStr, key, iv);
      decryptedLength += decryptedSlice.length;
      for (var offset = decryptedStart; offset < decryptedStart + __sliceLength; offset++) {
        decryptedUint8Array[offset] = decryptedSlice.charCodeAt(offset - decryptedStart);
      }
      decryptedStart += __sliceLength;
      start = end;
    }
  }
  var actualDataInUnit8Array = decryptedUint8Array.subarray(0, decryptedLength);
  return actualDataInUnit8Array;
}

function decryptChunkInArrayBufferAsync(arrayBuffer, uint8Array, uint8ArrayStart, key, iv, fn) {
  var view = new DataView(arrayBuffer);
	var mode = "";
	var header = "";
  for(var i=0; i< 8; i++) {
    header += String.fromCharCode(view.getUint8(i, false));
  }
  if(header === GCMTag) {
    mode = "GCMMode";
  }
  var start = 0;
  var decryptedStart = 0;
  var sliceLength = __encryptedDataSliceSize;
  if(mode === "GCMMode") {
    sliceLength = __sliceLength + __GCMOverhead;
  }
  var end;
  var sliceStr;
  var decryptedSlice;
  var decryptedDataSize = __estimateDecryptedDataSize(arrayBuffer.byteLength, mode);
  var numberOfSlices = 0;
  var decryptedLength = 0;

  console.log('Decrypting chunk(arrayBufferSize, uint8ArraySize, uint8ArrayStart):', arrayBuffer.byteLength, uint8Array.byteLength, uint8ArrayStart);

  function decryptASlice() {
    numberOfSlices++;
    console.log('decrypting slice:(index)', numberOfSlices);
    sliceStr = "";
    end = start + sliceLength;
    if (end >= (arrayBuffer.byteLength)) {
      for (var offset = start; offset < arrayBuffer.byteLength; offset++) {
        sliceStr += String.fromCharCode(view.getUint8(offset, false));
      }
      console.log('decrypting slice size', sliceStr.length);
      decryptedSlice = decryptBinaryString(sliceStr, key, iv);
      decryptedLength += decryptedSlice.length;
      console.log('decryptedSlice length, totalLength:', decryptedSlice.length, decryptedLength);
      for (var offset = decryptedStart; offset < decryptedStart + decryptedSlice.length; offset++) {
        var uint8ArrayIndex = uint8ArrayStart + offset;
        if (uint8ArrayIndex === uint8Array.byteLength) {
          fn('Wrong file size');
          return;
        }
        uint8Array[uint8ArrayIndex] = decryptedSlice.charCodeAt(offset - decryptedStart);
      }
      console.log('offset:', offset);
      fn(null, offset);
    } else {
      for (var offset = start; offset < end; offset++) {
        sliceStr += String.fromCharCode(view.getUint8(offset, false));
      }
      console.log('decrypting slice size', sliceStr.length);
      decryptedSlice = decryptBinaryString(sliceStr, key, iv);
      decryptedLength += decryptedSlice.length;
      console.log('decryptedSlice length, totalLength:', decryptedSlice.length, decryptedLength);
      for (var offset = decryptedStart; offset < decryptedStart + __sliceLength; offset++) {
        var uint8ArrayIndex = uint8ArrayStart + offset;
        if (uint8ArrayIndex === uint8Array.byteLength) {
          fn('Wrong file size');
          return;
        }
        uint8Array[uint8ArrayIndex] = decryptedSlice.charCodeAt(offset - decryptedStart);
      }
      decryptedStart += __sliceLength;
      start = end;
      setTimeout(decryptASlice, 0);
    }
  }

  setTimeout(decryptASlice, 300);
};

function ECBEncryptBinaryString(binaryString, key) {
  var thisBuffer = forge.util.createBuffer();
  thisBuffer.putBytes(binaryString);
  cipher = forge.cipher.createCipher('AES-ECB', key);
  cipher.start({
    iv: ""
  });
  cipher.update(thisBuffer);
  cipher.finish();
  encryptedBinaryString = cipher.output.data;
  return encryptedBinaryString
}

function ECBDecryptBinaryString(binaryString, key) {
  var thisBuffer = forge.util.createBuffer();
  thisBuffer.putBytes(binaryString);
  var decipher = forge.cipher.createDecipher('AES-ECB', key);
  decipher.start({
    iv: ""
  });
  decipher.update(thisBuffer);
  decipher.finish();
  var decryptedBinaryString = decipher.output.data;
  return decryptedBinaryString;
}

function stringToEncryptedTokens(str, searchKey) {
  var thisStr = str.toLowerCase();
  var re = /\s*[\s,.;!?]\s*/;
  var slices = thisStr.split(re);
  var encryptedTokens = [];

  for (var i = 0; i < slices.length; i++) {
    if (slices[i].length) {
      var encodedSlice = forge.util.encodeUtf8(slices[i]);
      var encryptedToken = ECBEncryptBinaryString(encodedSlice, searchKey);
      var base64Token = forge.util.encode64(encryptedToken);
      encryptedTokens.push(base64Token);
    }
  }
  return encryptedTokens;
};

function tokenfieldToEncryptedArray(thisArray, key, iv) {
  var encryptedArray = [];

  for (var i = 0; i < thisArray.length; i++) {
    if (thisArray[i].value.length) {
      var encodedElement = forge.util.encodeUtf8(thisArray[i].value);
      var encryptedElement = encryptBinaryString(encodedElement, key, iv);
      encryptedArray.push(forge.util.encode64(encryptedElement));
    }
  }
  return encryptedArray;
}

function tokenfieldToEncryptedTokens(thisArray, searchKey) {
  var encryptedTokens = [];

  for (var i = 0; i < thisArray.length; i++) {
    if (thisArray[i].value.length) {
      var thisStr = thisArray[i].value.toLowerCase();
      var encodedToken = forge.util.encodeUtf8(thisStr);
      var encryptedToken = ECBEncryptBinaryString(encodedToken, searchKey);
      var base64Token = forge.util.encode64(encryptedToken);
      encryptedTokens.push(base64Token);
      var re = /\s*[\s,.;!?]\s*/;
      var slices = thisStr.split(re);
      if (slices.length > 1) {
        for (var j = 0; j < slices.length; j++) {
          if (slices[j].length) {
            var encodedSlice = forge.util.encodeUtf8(slices[j]);
            var encryptedToken = ECBEncryptBinaryString(encodedSlice, searchKey);
            var base64Token = forge.util.encode64(encryptedToken);
            encryptedTokens.push(base64Token);
          }
        }
      }
    }
  }
  return encryptedTokens;
};

function generateRSAKeyPair(done) {
  var pki = forge.pki;
  var rsa = forge.pki.rsa;
  rsa.generateKeyPair({
    bits: 2048,
    workers: 2,
    workerScript: '/javascripts/prime.worker.min.js'
  }, function(err, keypair) {
    var publicKey = keypair.publicKey;
    var privateKey = keypair.privateKey;
    var publicKeyPem = pki.publicKeyToPem(publicKey);
    var publicKeyFromPem = pki.publicKeyFromPem(publicKeyPem);
    var privatePem = pki.privateKeyToPem(privateKey);
    var privateKeyFromPem = pki.privateKeyFromPem(privatePem);
    var data = "ABCDEFGHIJKLMNOPQRSTUVabcdefghijklmnopqrstuv123456";
    var encrypted = publicKeyFromPem.encrypt(data);
    var decrypted = privateKeyFromPem.decrypt(encrypted);
    done(publicKeyPem, privatePem);
  });
};
