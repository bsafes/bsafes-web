function dataURLToBinaryString(dataURI) {
  var dataURIPattern = /^data:((.*?)(;charset=.*?)?)(;base64)?,/
  var matches,
      mediaType,
      isBase64,
      dataString,
      byteString,
      arrayBuffer,
      intArray,
      i,
      bb;
  // Parse the dataURI components as per RFC 2397
  matches = dataURI.match(dataURIPattern)
  if (!matches) {
    return null;
  }
  // Default to text/plain;charset=US-ASCII
  mediaType = matches[2]? matches[1] : 'text/plain' + (matches[3] || ';charset=US-ASCII');
  isBase64 = !!matches[4];
  dataString = dataURI.slice(matches[0].length);
  console.log('dataString', dataString.length);
  if (isBase64) {
    // Convert base64 to raw binary data held in a string:
    byteString = atob(dataString);
  } else {
    // Convert base64/URLEncoded data component to raw binary:
    byteString = decodeURIComponent(dataString);
  }
	return byteString;
}

function dataURLToBlobAndBinaryString(dataURI, fn) {
	byteString = dataURLToBinaryString(dataURI);

	if(!byteString) fn("dataURLToBinaryString error", null, null);

	console.log('byteString', byteString.length);
	// Write the bytes of the string to an ArrayBuffer:
  arrayBuffer = new ArrayBuffer(byteString.length);
	intArray = new Uint8Array(arrayBuffer);
	for (i = 0; i < byteString.length; i += 1) {
  	intArray[i] = byteString.charCodeAt(i)
  }
	console.log('intArray', intArray.byteLength);
	// Write the ArrayBuffer (or ArrayBufferView) to a blob:
	var blob = new Blob([intArray], {type: 'image/jpeg'});
	console.log('blob', blob.size);
	fn(null, blob, byteString);
};

function rotateImage(link, exifOrientation, callback) {
	var img = new Image();

	img.onload = function(){
		var imgCV = document.createElement('canvas');
		var canvasLimit = 2048;
		
  	if(img.naturalWidth > img.naturalHeight && img.naturalWidth > canvasLimit) {
    	imgCV.width = canvasLimit;
    	imgCV.height = img.naturalHeight/img.naturalWidth * canvasLimit;
  	} else if(img.naturalHeight > img.naturalWidth && img.naturalHeight > canvasLimit) {
    	imgCV.width = img.naturalWidth/img.naturalHeight * canvasLimit;
    	imgCV.height = canvasLimit;
  	} else {
    	imgCV.width = img.naturalWidth;
    	imgCV.height = img.naturalHeight;
  	}

  	var imgCtx;
  	if(exifOrientation && (exifOrientation === 6 || exifOrientation === 8)){
    	var tmp = imgCV.width;
    	imgCV.width = imgCV.height;
    	imgCV.height = tmp;
    	imgCtx = imgCV.getContext('2d');
    	if(exifOrientation === 6) {
      	imgCtx.rotate(90 * Math.PI / 180);
      	imgCtx.drawImage(img, 0, -imgCV.width, imgCV.height, imgCV.width);
    	} else {
      	imgCtx.translate(imgCV.width, 0);
      	imgCtx.rotate(-90 * Math.PI / 180);
      	imgCtx.drawImage(img, -imgCV.height , -imgCV.width, imgCV.height, imgCV.width);
    	}
  	} else if(exifOrientation && exifOrientation === 3 ) {
    	imgCtx = imgCV.getContext('2d');
    	imgCtx.translate(0, imgCV.height);
    	imgCtx.rotate(-180 * Math.PI / 180);
    	imgCtx.drawImage(img, -imgCV.width , 0, imgCV.width, imgCV.height);
  	} else {
    	imgCtx = imgCV.getContext('2d');
    	imgCtx.drawImage(img, 0, 0, imgCV.width, imgCV.height);
  	}
		var dataURL = imgCV.toDataURL("image/jpeg" , 1.0);
		dataURLToBlobAndBinaryString(dataURL, function(err, blob, binaryString) {
			callback(err, blob, binaryString);
		}); 
	};
	img.src = link;
};

function _downScaleImage(img, exifOrientation, size, callback) {
	var imgCV = document.createElement('canvas');
	var imageWidth = parseInt(img.naturalWidth);
  var imageHeight = parseInt(img.naturalHeight);
  imgCV.width = imageWidth;
  imgCV.height = imageHeight;

  var imgCtx;
  imgCtx = imgCV.getContext('2d');
  imgCtx.drawImage(img, 0, 0, imgCV.width, imgCV.height);
	
	var scale;
	if (imageWidth > size || imageHeight > size) {
    if(imgCV.width > imgCV.height) {
      scale = size/imgCV.width;
    } else {
      scale = size/imgCV.height;
    }
  } else {
	  scale = 1;
  }
	
  _downScaleCanvas(imgCV, scale, function(canvas){
		var dataURI = canvas.toDataURL("image/jpeg" , 1.0);
  	var byteString = dataURLToBinaryString(dataURI);
		console.log('byteString', byteString.length);
  	if(!byteString){
			callback("dataURLToBinaryString error", null);
		} else {
			callback(null, byteString);
		} 
	});
};

function _downScaleCanvas(cv, scale, callback) {
  if (!(scale > 0)) throw ('scale must be > 0');
  
	scale = this._normaliseScale(scale);
  var sqScale = scale * scale; // square scale =  area of a source pixel within target
  var sw = cv.width; // source image width
  var sh = cv.height; // source image height
  var tw = Math.floor(sw * scale); // target image width
  var th = Math.floor(sh * scale); // target image height
  var sx = 0, sy = 0, sIndex = 0; // source x,y, index within source array
  var tx = 0, ty = 0, yIndex = 0, tIndex = 0; // target x,y, x,y index within target array
  var tX = 0, tY = 0; // rounded tx, ty
  var w = 0, nw = 0, wx = 0, nwx = 0, wy = 0, nwy = 0; // weight / next weight x / y
  // weight is weight of current source point within target.
  // next weight is weight of current source point within next target's point.
  var crossX = false; // does scaled px cross its current px right border ?
  var crossY = false; // does scaled px cross its current px bottom border ?
  var sBuffer = cv.getContext('2d').
  getImageData(0, 0, sw, sh).data; // source buffer 8 bit rgba
  var tBuffer = new Float32Array(3 * tw * th); // target buffer Float32 rgb
  var sR = 0, sG = 0,  sB = 0; // source's current point r,g,b
  var that = this;
  var thisStart, thisEnd, thisTime;
  var currentTime, previousTime;
  previousTime = new Date().getTime();
	var chunkRuns = 0;
  function doChunk() {
  	// for (sy = 0; sy < sh; sy++)
		console.log('doChunk');
		var uploadProgress = 'doChunk '+ chunkRuns;
	
    while(sy < sh) {
    	thisStart = new Date().getTime();
      ty = sy * scale; // y src position within target
      tY = 0 | ty;     // rounded : target pixel's y
      yIndex = 3 * tY * tw;  // line index within target array
      crossY = (tY !== (0 | ( ty + scale )));
      if (crossY) { // if pixel is crossing botton target pixel
        wy = (tY + 1 - ty); // weight of point within target pixel
        nwy = (ty + scale - tY - 1); // ... within y+1 target pixel
      }
      for (sx = 0; sx < sw; sx++, sIndex += 4) {
        tx = sx * scale; // x src position within target		
        tX = 0 |  tx;    // rounded : target pixel's x
        tIndex = yIndex + tX * 3; // target pixel index within target array
        crossX = (tX !== (0 | (tx + scale)));
        if (crossX) { // if pixel is crossing target pixel's right
          wx = (tX + 1 - tx); // weight of point within target pixel
          nwx = (tx + scale - tX - 1); // ... within x+1 target pixel
        }
        sR = sBuffer[sIndex    ];   // retrieving r,g,b for curr src px.
        sG = sBuffer[sIndex + 1];
        sB = sBuffer[sIndex + 2];
        if (!crossX && !crossY) { // pixel does not cross
          // just add components weighted by squared scale.
          tBuffer[tIndex    ] += sR * sqScale;
          tBuffer[tIndex + 1] += sG * sqScale;
          tBuffer[tIndex + 2] += sB * sqScale;
        } else if (crossX && !crossY) { // cross on X only
          w = wx * scale;
          // add weighted component for current px
          tBuffer[tIndex    ] += sR * w;
          tBuffer[tIndex + 1] += sG * w;
          tBuffer[tIndex + 2] += sB * w;
          // add weighted component for next (tX+1) px
          nw = nwx * scale
          tBuffer[tIndex + 3] += sR * nw;
          tBuffer[tIndex + 4] += sG * nw;
          tBuffer[tIndex + 5] += sB * nw;
        } else if (!crossX && crossY) { // cross on Y only
          w = wy * scale;
          // add weighted component for current px
          tBuffer[tIndex    ] += sR * w;
          tBuffer[tIndex + 1] += sG * w;
          tBuffer[tIndex + 2] += sB * w;
          // add weighted component for next (tY+1) px
          nw = nwy * scale
          tBuffer[tIndex + 3 * tw    ] += sR * nw;
          tBuffer[tIndex + 3 * tw + 1] += sG * nw;
          tBuffer[tIndex + 3 * tw + 2] += sB * nw;
        } else { // crosses both x and y : four target points involved
          // add weighted component for current px
          w = wx * wy;
          tBuffer[tIndex    ] += sR * w;
          tBuffer[tIndex + 1] += sG * w;
          tBuffer[tIndex + 2] += sB * w;
          // for tX + 1; tY px
          nw = nwx * wy;
          tBuffer[tIndex + 3] += sR * nw;
          tBuffer[tIndex + 4] += sG * nw;
          tBuffer[tIndex + 5] += sB * nw;
          // for tX ; tY + 1 px
          nw = wx * nwy;
          tBuffer[tIndex + 3 * tw    ] += sR * nw;
          tBuffer[tIndex + 3 * tw + 1] += sG * nw;
          tBuffer[tIndex + 3 * tw + 2] += sB * nw;
          // for tX + 1 ; tY +1 px
          nw = nwx * nwy;
          tBuffer[tIndex + 3 * tw + 3] += sR * nw;
          tBuffer[tIndex + 3 * tw + 4] += sG * nw;
          tBuffer[tIndex + 3 * tw + 5] += sB * nw;
        }
      } // end for sx
      thisEnd = new Date().getTime();
      thisTime = thisEnd - thisStart;
      sy ++;
      currentTime = new Date().getTime();

      var chunkTime = currentTime - previousTime;
      if((chunkTime > 1000) && (sy < sh)) {
        previousTime = currentTime;

				chunkRuns ++;
       	setTimeout(doChunk, 1);
       	return;
      }
    } // end for sy
    // create result canvas
    var resCV = document.createElement('canvas');
    resCV.width = tw;
    resCV.height = th;
    var resCtx = resCV.getContext('2d');
    var imgRes = resCtx.getImageData(0, 0, tw, th);
    var tByteBuffer = imgRes.data;
    // convert float32 array into a UInt8Clamped Array
    var pxIndex = 0; //
    for (sIndex = 0, tIndex = 0; pxIndex < tw * th; sIndex += 3, tIndex += 4, pxIndex++) {
      tByteBuffer[tIndex] = 0 | ( tBuffer[sIndex]);
      tByteBuffer[tIndex + 1] = 0 | (tBuffer[sIndex + 1]);
      tByteBuffer[tIndex + 2] = 0 | (tBuffer[sIndex + 2]);
      tByteBuffer[tIndex + 3] = 255;
    }
    // writing result to canvas.
    resCtx.putImageData(imgRes, 0, 0);
    var newImg = resCV;

    callback(newImg);
  }
  setTimeout(doChunk, 1000);

	return ;
};

function _log2(v) {
  // taken from http://graphics.stanford.edu/~seander/bithacks.html
  var b =  [ 0x2, 0xC, 0xF0, 0xFF00, 0xFFFF0000 ];
  var S =  [1, 2, 4, 8, 16];
  var i=0, r=0;

  for (i = 4; i >= 0; i--) {
    if (v & b[i])  {
      v >>= S[i];
      r |= S[i];
     }
  }
  return r;
};

// normalize a scale <1 to avoid some rounding issue with js numbers
function _normaliseScale(s) {
  if (s>1) throw('s must be <1');
  
	s = 0 | (1/s);
  var l = _log2(s);
  var mask = 1 << l;
  var accuracy = 4;
	
  while(accuracy && l) { l--; mask |= 1<<l; accuracy--; }

  return 1 / ( s & mask );
};
