'use strict';

var global = typeof window === 'undefined' ? self : window;
var root = typeof window === 'undefined' ? '../' : '';

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
        mem: 100*1024,
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

