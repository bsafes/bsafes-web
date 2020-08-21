var global = typeof window === 'undefined' ? self : window;
var root = typeof window === 'undefined' ? '../' : '';

if (typeof TextEncoder === "undefined") {
  TextEncoder = function TextEncoder() {};
  TextEncoder.prototype.encode = function encode(str) {
    "use strict";
    var Len = str.length,
      resPos = -1;
    // The Uint8Array's length must be at least 3x the length of the string because an invalid UTF-16
    //  takes up the equivelent space of 3 UTF-8 characters to encode it properly. However, Array's
    //  have an auto expanding length and 1.5x should be just the right balance for most uses.
    var resArr = typeof Uint8Array === "undefined" ? new Array(Len * 1.5) : new Uint8Array(Len * 3);
    for (var point = 0, nextcode = 0, i = 0; i !== Len;) {
      point = str.charCodeAt(i), i += 1;
      if (point >= 0xD800 && point <= 0xDBFF) {
        if (i === Len) {
          resArr[resPos += 1] = 0xef /*0b11101111*/ ;
          resArr[resPos += 1] = 0xbf /*0b10111111*/ ;
          resArr[resPos += 1] = 0xbd /*0b10111101*/ ;
          break;
        }
        // https://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
        nextcode = str.charCodeAt(i);
        if (nextcode >= 0xDC00 && nextcode <= 0xDFFF) {
          point = (point - 0xD800) * 0x400 + nextcode - 0xDC00 + 0x10000;
          i += 1;
          if (point > 0xffff) {
            resArr[resPos += 1] = (0x1e /*0b11110*/ << 3) | (point >>> 18);
            resArr[resPos += 1] = (0x2 /*0b10*/ << 6) | ((point >>> 12) & 0x3f /*0b00111111*/ );
            resArr[resPos += 1] = (0x2 /*0b10*/ << 6) | ((point >>> 6) & 0x3f /*0b00111111*/ );
            resArr[resPos += 1] = (0x2 /*0b10*/ << 6) | (point & 0x3f /*0b00111111*/ );
            continue;
          }
        } else {
          resArr[resPos += 1] = 0xef /*0b11101111*/ ;
          resArr[resPos += 1] = 0xbf /*0b10111111*/ ;
          resArr[resPos += 1] = 0xbd /*0b10111101*/ ;
          continue;
        }
      }
      if (point <= 0x007f) {
        resArr[resPos += 1] = (0x0 /*0b0*/ << 7) | point;
      } else if (point <= 0x07ff) {
        resArr[resPos += 1] = (0x6 /*0b110*/ << 5) | (point >>> 6);
        resArr[resPos += 1] = (0x2 /*0b10*/ << 6) | (point & 0x3f /*0b00111111*/ );
      } else {
        resArr[resPos += 1] = (0xe /*0b1110*/ << 4) | (point >>> 12);
        resArr[resPos += 1] = (0x2 /*0b10*/ << 6) | ((point >>> 6) & 0x3f /*0b00111111*/ );
        resArr[resPos += 1] = (0x2 /*0b10*/ << 6) | (point & 0x3f /*0b00111111*/ );
      }
    }
    if (typeof Uint8Array !== "undefined") return resArr.subarray(0, resPos + 1);
    // else // IE 6-9
    resArr.length = resPos + 1; // trim off extra weight
    return resArr;
  };
  TextEncoder.prototype.toString = function() {
    return "[object TextEncoder]"
  };
  try { // Object.defineProperty only works on DOM prototypes in IE8
    Object.defineProperty(TextEncoder.prototype, "encoding", {
      get: function() {
        if (TextEncoder.prototype.isPrototypeOf(this)) return "utf-8";
        else throw TypeError("Illegal invocation");
      }
    });
  } catch (e) {
    /*IE6-8 fallback*/
    TextEncoder.prototype.encoding = "utf-8";
  }
  if (typeof Symbol !== "undefined") TextEncoder.prototype[Symbol.toStringTag] = "TextEncoder";
}

const supported = (() => {
  try {
    if (typeof WebAssembly === "object" &&
      typeof WebAssembly.instantiate === "function") {
      const module = new WebAssembly.Module(Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00));
      if (module instanceof WebAssembly.Module)
        return new WebAssembly.Instance(module) instanceof WebAssembly.Instance;
    }
  } catch (e) {}
  return false;
})();

console.log(supported ? "WebAssembly is supported" : "WebAssembly is not supported");

function log(msg) {
  console.log(msg);
}

function loadScript(src, onload, onerror) {
  var el = document.createElement('script');
  el.src = src;
  el.integrity = "sha384-8O/7krm+x+3VwSBXE1bKGYUG/jBATJcatMiTPRJgBb3wCbrnZqmjBPMyn5FilK2J";
  el.setAttribute("crossorigin", "anonymous");
  el.onload = onload;
  el.onerror = onerror;
  document.body.appendChild(el);
}
var argon2Functions = {
  isBrowserSupported: function() {
    return supported;
  },
  loadArgon2: function(method) {
    const mem = 100 * 1024;

    const KB = 1024 * 1024;
    const MB = 1024 * KB;
    const GB = 1024 * MB;
    const WASM_PAGE_SIZE = 64 * 1024;

    const totalMemory = (2 * GB - 64 * KB) / 1024 / WASM_PAGE_SIZE;
    const initialMemory = Math.min(
      Math.max(Math.ceil((mem * 1024) / WASM_PAGE_SIZE), 256) + 256,
      totalMemory
    );
    console.log(
      'Memory: ' +
      initialMemory +
      ' pages (' +
      Math.round(initialMemory * 64) +
      ' KB)',
      totalMemory
    );
    const wasmMemory = new WebAssembly.Memory({
      initial: initialMemory,
      maximum: totalMemory
    });

    global.Module = {
      print: log,
      printErr: log,
      setStatus: log,
      wasmBinary: null,
      wasmJSMethod: method,
      asmjsCodeFile: root + '',
      wasmBinaryFile: root + '',
      wasmTextFile: root + '',
      wasmMemory: wasmMemory,
      buffer: wasmMemory.buffer,
      TOTAL_MEMORY: initialMemory * WASM_PAGE_SIZE
    };

    log('Loading wasm...');
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/javascripts/argon2/argon2.wasm', true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = function() {
      global.Module.wasmBinary = xhr.response;
      global.Module.postRun = argon2Loaded;
      log('Wasm loaded, loading script...');
      loadScript(
        '/javascripts/argon2/argon2.js',
        function() {
          log('Script loaded');
        },
        function() {
          log('Error loading script');
        }
      );
    };
    xhr.onerror = function() {
      log('Error loading wasm');
    };
    xhr.send(null);
  },
  deriveKey: function(password, salt) {
    var arg = getArg();
    arg.pass = password;
    arg.salt = salt;
    if (!Module._argon2_hash) {
      return log('Error');
    }
    log(
      'Params: ' +
      Object.keys(arg)
      .map(function(key) {
        return key + '=' + arg[key];
      })
      .join(', ')
    );
    var dt = now();
    var t_cost = (arg && arg.time) || 10;
    var m_cost = (arg && arg.mem) || 1024;
    var parallelism = (arg && arg.parallelism) || 1;
    var passEncoded = encodeUtf8(arg.pass);
    var pwd = allocateArray(passEncoded);
    var pwdlen = passEncoded.length;
    var saltEncoded = encodeUtf8(arg.salt);
    var salt = allocateArray(saltEncoded);
    var saltlen = saltEncoded.length;
    var hash = Module.allocate(
      new Array((arg && arg.hashLen) || 32),
      'i8',
      Module.ALLOC_NORMAL
    );
    var hashlen = (arg && arg.hashLen) || 32;
    var encoded = Module.allocate(new Array(512), 'i8', Module.ALLOC_NORMAL);
    var encodedlen = 512;
    var argon2_type = (arg && arg.type) || 0;
    var version = 0x13;
    var err;
    try {
      var res = Module._argon2_hash(
        t_cost,
        m_cost,
        parallelism,
        pwd,
        pwdlen,
        salt,
        saltlen,
        hash,
        hashlen,
        encoded,
        encodedlen,
        argon2_type,
        version
      );
    } catch (e) {
      err = e;
    }
    var elapsed = now() - dt;
    if (res === 0 && !err) {
      var hashArr = [];
      for (var i = hash; i < hash + hashlen; i++) {
        hashArr.push(Module.HEAP8[i]);
      }
      log('Encoded: ' + Module.UTF8ToString(encoded));
      var keyHex = hashArr
        .map(function(b) {
          var number = b;
          return ('0' + (0xff & b).toString(16)).slice(-2);
        })
        .join('');
      var keyBytes = forge.util.hexToBytes(keyHex);
      log('Elapsed: ' + Math.round(elapsed) + 'ms');

    } else {
      try {
        if (!err) {
          err = Module.UTF8ToString(Module._argon2_error_message(res));
        }
      } catch (e) {}
      log('Error: ' + res + (err ? ': ' + err : ''));
      key = "error";
    }
    try {
      Module._free(pwd);
      Module._free(salt);
      Module._free(hash);
      Module._free(encoded);
    } catch (e) {}
    return keyBytes;
  }
}

function argon2Loaded() {
  return;
}

function getArg() {
  return {
    time: 2,
    mem: 100 * 1024,
    hashLen: 32,
    parallelism: 2,
    type: 2
  };
}



function encodeUtf8(str) {
  return new TextEncoder().encode(str);
}

function allocateArray(arr) {
  return Module.allocate(arr, 'i8', Module.ALLOC_NORMAL);
}

function now() {
  return global.performance ? performance.now() : Date.now();
}