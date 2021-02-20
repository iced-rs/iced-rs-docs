///
const decoder = new TextDecoder();

function top(stack) {
  return stack[stack.length - 1];
}

function string(mem, pointer, length) {
  const buf = mem.subarray(pointer, pointer + length);
  return decoder.decode(buf);
}

const OP_TABLE = [
  // 0
  function setText(interpreter, mem8, mem32, i) {
    const pointer = mem32[i++];
    const length = mem32[i++];
    const str = string(mem8, pointer, length);
    top(interpreter.stack).textContent = str;
    return i;
  },

  // 1
  function removeSelfAndNextSiblings(interpreter, mem8, mem32, i) {
    const node = interpreter.stack.pop();
    let sibling = node.nextSibling;
    while (sibling) {
      const temp = sibling.nextSibling;
      sibling.remove();
      sibling = temp;
    }
    node.remove();
    return i;
  },

  // 2
  function replaceWith(interpreter, mem8, mem32, i) {
    const newNode = interpreter.stack.pop();
    const oldNode = interpreter.stack.pop();
    oldNode.replaceWith(newNode);
    interpreter.stack.push(newNode);
    return i;
  },

  // 3
  function setAttribute(interpreter, mem8, mem32, i) {
    const nameId = mem32[i++];
    const valueId = mem32[i++];
    const name = interpreter.getCachedString(nameId);
    const value = interpreter.getCachedString(valueId);
    const node = top(interpreter.stack);
    node.setAttribute(name, value);

    // Some attributes are "volatile" and don't work through `setAttribute`.
    if (name === "value") {
      node.value = value;
    }
    if (name === "checked") {
      node.checked = true;
    }
    if (name === "selected") {
      node.selected = true;
    }

    return i;
  },

  // 4
  function removeAttribute(interpreter, mem8, mem32, i) {
    const nameId = mem32[i++];
    const name = interpreter.getCachedString(nameId);
    const node = top(interpreter.stack);
    node.removeAttribute(name);

    // Some attributes are "volatile" and don't work through `removeAttribute`.
    if (name === "value") {
      node.value = null;
    }
    if (name === "checked") {
      node.checked = false;
    }
    if (name === "selected") {
      node.selected = false;
    }

    return i;
  },

  // 5
  function pushReverseChild(interpreter, mem8, mem32, i) {
    const n = mem32[i++];
    const parent = top(interpreter.stack);
    const children = parent.childNodes;
    const child = children[children.length - n - 1];
    interpreter.stack.push(child);
    return i;
  },

  // 6
  function popPushChild(interpreter, mem8, mem32, i) {
    const n = mem32[i++];
    interpreter.stack.pop();
    const parent = top(interpreter.stack);
    const children = parent.childNodes;
    const child = children[n];
    interpreter.stack.push(child);
    return i;
  },

  // 7
  function pop(interpreter, mem8, mem32, i) {
    interpreter.stack.pop();
    return i;
  },

  // 8
  function appendChild(interpreter, mem8, mem32, i) {
    const child = interpreter.stack.pop();
    top(interpreter.stack).appendChild(child);
    return i;
  },

  // 9
  function createTextNode(interpreter, mem8, mem32, i) {
    const pointer = mem32[i++];
    const length = mem32[i++];
    const text = string(mem8, pointer, length);
    interpreter.stack.push(document.createTextNode(text));
    return i;
  },

  // 10
  function createElement(interpreter, mem8, mem32, i) {
    const tagNameId = mem32[i++];
    const tagName = interpreter.getCachedString(tagNameId);
    interpreter.stack.push(document.createElement(tagName));
    return i;
  },

  // 11
  function newEventListener(interpreter, mem8, mem32, i) {
    const eventId = mem32[i++];
    const eventType = interpreter.getCachedString(eventId);
    const a = mem32[i++];
    const b = mem32[i++];
    const el = top(interpreter.stack);
    el.addEventListener(eventType, interpreter.eventHandler);
    el[`dodrio-a-${eventType}`] = a;
    el[`dodrio-b-${eventType}`] = b;
    return i;
  },

  // 12
  function updateEventListener(interpreter, mem8, mem32, i) {
    const eventId = mem32[i++];
    const eventType = interpreter.getCachedString(eventId);
    const el = top(interpreter.stack);
    el[`dodrio-a-${eventType}`] = mem32[i++];
    el[`dodrio-b-${eventType}`] = mem32[i++];
    return i;
  },

  // 13
  function removeEventListener(interpreter, mem8, mem32, i) {
    const eventId = mem32[i++];
    const eventType = interpreter.getCachedString(eventId);
    const el = top(interpreter.stack);
    el.removeEventListener(eventType, interpreter.eventHandler);
    return i;
  },

  // 14
  function addCachedString(interpreter, mem8, mem32, i) {
    const pointer = mem32[i++];
    const length = mem32[i++];
    const id = mem32[i++];
    const str = string(mem8, pointer, length);
    interpreter.addCachedString(str, id);
    return i;
  },

  // 15
  function dropCachedString(interpreter, mem8, mem32, i) {
    const id = mem32[i++];
    interpreter.dropCachedString(id);
    return i;
  },

  // 16
  function createElementNS(interpreter, mem8, mem32, i) {
    const tagNameId = mem32[i++];
    const tagName = interpreter.getCachedString(tagNameId);
    const nsId = mem32[i++];
    const ns = interpreter.getCachedString(nsId);
    interpreter.stack.push(document.createElementNS(ns, tagName));
    return i;
  },

  // 17
  function saveChildrenToTemporaries(interpreter, mem8, mem32, i) {
    let temp = mem32[i++];
    const start = mem32[i++];
    const end = mem32[i++];
    const parent = top(interpreter.stack);
    const children = parent.childNodes;
    for (let i = start; i < end; i++) {
      interpreter.temporaries[temp++] = children[i];
    }
    return i;
  },

  // 18
  function pushChild(interpreter, mem8, mem32, i) {
    const parent = top(interpreter.stack);
    const n = mem32[i++];
    const child = parent.childNodes[n];
    interpreter.stack.push(child);
    return i;
  },

  // 19
  function pushTemporary(interpreter, mem8, mem32, i) {
    const temp = mem32[i++];
    interpreter.stack.push(interpreter.temporaries[temp]);
    return i;
  },

  // 20
  function insertBefore(interpreter, mem8, mem32, i) {
    const before = interpreter.stack.pop();
    const after = interpreter.stack.pop();
    after.parentNode.insertBefore(before, after);
    interpreter.stack.push(before);
    return i;
  },

  // 21
  function popPushReverseChild(interpreter, mem8, mem32, i) {
    const n = mem32[i++];
    interpreter.stack.pop();
    const parent = top(interpreter.stack);
    const children = parent.childNodes;
    const child = children[children.length - n - 1];
    interpreter.stack.push(child);
    return i;
  },

  // 22
  function removeChild(interpreter, mem8, mem32, i) {
    const n = mem32[i++];
    const parent = top(interpreter.stack);
    const child = parent.childNodes[n];
    child.remove();
    return i;
  },

  // 23
  function setClass(interpreter, mem8, mem32, i) {
    const classId = mem32[i++];
    const className = interpreter.getCachedString(classId);
    top(interpreter.stack).className = className;
    return i;
  },

  // 24
  function saveTemplate(interpreter, mem8, mem32, i) {
    const id = mem32[i++];
    const template = top(interpreter.stack);
    interpreter.saveTemplate(id, template.cloneNode(true));
    return i;
  },

  // 25
  function pushTemplate(interpreter, mem8, mem32, i) {
    const id = mem32[i++];
    const template = interpreter.getTemplate(id);
    interpreter.stack.push(template.cloneNode(true));
    return i;
  }
];

export class ChangeListInterpreter {
  constructor(container) {
    this.trampoline = null;
    this.container = container;
    this.ranges = [];
    this.stack = [];
    this.strings = new Map();
    this.temporaries = [];
    this.templates = new Map();
  }

  unmount() {
    this.trampoline.mounted = false;

    // Null out all of our properties just to ensure that if we mistakenly ever
    // call a method on this instance again, it will throw.
    this.trampoline = null;
    this.container = null;
    this.ranges = null;
    this.stack = null;
    this.strings = null;
    this.temporaries = null;
    this.templates = null;
  }

  addChangeListRange(start, len) {
    this.ranges.push(start);
    this.ranges.push(len);
  }

  applyChanges(memory) {
    if (this.ranges.length == 0) {
      return;
    }

    this.stack.push(this.container.firstChild);
    const mem8 = new Uint8Array(memory.buffer);
    const mem32 = new Uint32Array(memory.buffer);

    for (let i = 0; i < this.ranges.length; i += 2) {
      const start = this.ranges[i];
      const len = this.ranges[i + 1];
      this.applyChangeRange(mem8, mem32, start, len);
    }

    this.ranges.length = 0;
    this.stack.length = 0;
    this.temporaries.length = 0;
  }

  applyChangeRange(mem8, mem32, start, len) {
    const end = (start + len) / 4;
    for (let i = start / 4; i < end; ) {
      const op = mem32[i++];
      i = OP_TABLE[op](this, mem8, mem32, i);
    }
  }

  addCachedString(str, id) {
    this.strings.set(id, str);
  }

  dropCachedString(id) {
    this.strings.delete(id);
  }

  getCachedString(id) {
    return this.strings.get(id);
  }

  saveTemplate(id, template) {
    this.templates.set(id, template);
  }

  getTemplate(id) {
    return this.templates.get(id);
  }

  initEventsTrampoline(trampoline) {
    this.trampoline = trampoline;
    trampoline.mounted = true;
    this.eventHandler = function(event) {
      if (!trampoline.mounted) {
        throw new Error("invocation of listener after VDOM has been unmounted");
      }

      // `this` always refers to the element the handler was added to.
      // Since we're adding the handler to all elements our content wants
      // to listen for events on, this ensures that we always get the right
      // values for `a` and `b`.
      const type = event.type;
      const a = this[`dodrio-a-${type}`];
      const b = this[`dodrio-b-${type}`];
      trampoline(event, a, b);
    }
  }
}
///

let wasm;

const heap = new Array(32).fill(undefined);

heap.push(undefined, null, true, false);

function getObject(idx) { return heap[idx]; }

let heap_next = heap.length;

function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];

    heap[idx] = obj;
    return idx;
}

function dropObject(idx) {
    if (idx < 36) return;
    heap[idx] = heap_next;
    heap_next = idx;
}

function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
}

function debugString(val) {
    // primitive types
    const type = typeof val;
    if (type == 'number' || type == 'boolean' || val == null) {
        return  `${val}`;
    }
    if (type == 'string') {
        return `"${val}"`;
    }
    if (type == 'symbol') {
        const description = val.description;
        if (description == null) {
            return 'Symbol';
        } else {
            return `Symbol(${description})`;
        }
    }
    if (type == 'function') {
        const name = val.name;
        if (typeof name == 'string' && name.length > 0) {
            return `Function(${name})`;
        } else {
            return 'Function';
        }
    }
    // objects
    if (Array.isArray(val)) {
        const length = val.length;
        let debug = '[';
        if (length > 0) {
            debug += debugString(val[0]);
        }
        for(let i = 1; i < length; i++) {
            debug += ', ' + debugString(val[i]);
        }
        debug += ']';
        return debug;
    }
    // Test for built-in
    const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
    let className;
    if (builtInMatches.length > 1) {
        className = builtInMatches[1];
    } else {
        // Failed to match the standard '[object ClassName]'
        return toString.call(val);
    }
    if (className == 'Object') {
        // we're a user defined class or Object
        // JSON.stringify avoids problems with cycles, and is generally much
        // easier than looping through ownProperties of `val`.
        try {
            return 'Object(' + JSON.stringify(val) + ')';
        } catch (_) {
            return 'Object';
        }
    }
    // errors
    if (val instanceof Error) {
        return `${val.name}: ${val.message}\n${val.stack}`;
    }
    // TODO we could test for more things here, like `Set`s and `Map`s.
    return className;
}

let WASM_VECTOR_LEN = 0;

let cachegetUint8Memory0 = null;
function getUint8Memory0() {
    if (cachegetUint8Memory0 === null || cachegetUint8Memory0.buffer !== wasm.memory.buffer) {
        cachegetUint8Memory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachegetUint8Memory0;
}

let cachedTextEncoder = new TextEncoder('utf-8');

const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
    ? function (arg, view) {
    return cachedTextEncoder.encodeInto(arg, view);
}
    : function (arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
        read: arg.length,
        written: buf.length
    };
});

function passStringToWasm0(arg, malloc, realloc) {

    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length);
        getUint8Memory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len);

    const mem = getUint8Memory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }

    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3);
        const view = getUint8Memory0().subarray(ptr + offset, ptr + len);
        const ret = encodeString(arg, view);

        offset += ret.written;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

let cachegetInt32Memory0 = null;
function getInt32Memory0() {
    if (cachegetInt32Memory0 === null || cachegetInt32Memory0.buffer !== wasm.memory.buffer) {
        cachegetInt32Memory0 = new Int32Array(wasm.memory.buffer);
    }
    return cachegetInt32Memory0;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });

cachedTextDecoder.decode();

function getStringFromWasm0(ptr, len) {
    return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
}

function makeClosure(arg0, arg1, dtor, f) {
    const state = { a: arg0, b: arg1, cnt: 1, dtor };
    const real = (...args) => {
        // First up with a closure we increment the internal reference
        // count. This ensures that the Rust closure environment won't
        // be deallocated while we're invoking it.
        state.cnt++;
        try {
            return f(state.a, state.b, ...args);
        } finally {
            if (--state.cnt === 0) {
                wasm.__wbindgen_export_2.get(state.dtor)(state.a, state.b);
                state.a = 0;

            }
        }
    };
    real.original = state;

    return real;
}
function __wbg_adapter_16(arg0, arg1, arg2, arg3, arg4) {
    wasm._dyn_core__ops__function__Fn__A_B_C___Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h1b2d34fa518d1c63(arg0, arg1, addHeapObject(arg2), arg3, arg4);
}

function makeMutClosure(arg0, arg1, dtor, f) {
    const state = { a: arg0, b: arg1, cnt: 1, dtor };
    const real = (...args) => {
        // First up with a closure we increment the internal reference
        // count. This ensures that the Rust closure environment won't
        // be deallocated while we're invoking it.
        state.cnt++;
        const a = state.a;
        state.a = 0;
        try {
            return f(a, state.b, ...args);
        } finally {
            if (--state.cnt === 0) {
                wasm.__wbindgen_export_2.get(state.dtor)(a, state.b);

            } else {
                state.a = a;
            }
        }
    };
    real.original = state;

    return real;
}
function __wbg_adapter_19(arg0, arg1) {
    wasm._dyn_core__ops__function__FnMut_____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h865f8314fae12818(arg0, arg1);
}

function __wbg_adapter_22(arg0, arg1, arg2) {
    wasm._dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h8def9f92d8da3f0b(arg0, arg1, addHeapObject(arg2));
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

function handleError(f) {
    return function () {
        try {
            return f.apply(this, arguments);

        } catch (e) {
            wasm.__wbindgen_exn_store(addHeapObject(e));
        }
    };
}
function __wbg_adapter_61(arg0, arg1, arg2, arg3) {
    wasm.wasm_bindgen__convert__closures__invoke2_mut__h6a09d8bda3045c96(arg0, arg1, addHeapObject(arg2), addHeapObject(arg3));
}

async function load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {

        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);

            } catch (e) {
                if (module.headers.get('Content-Type') != 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else {
                    throw e;
                }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);

    } else {

        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };

        } else {
            return instance;
        }
    }
}

async function init(input) {
    if (typeof input === 'undefined') {
        input = import.meta.url.replace(/\.js$/, '_bg.wasm');
    }
    const imports = {};
    imports.wbg = {};
    imports.wbg.__wbindgen_object_clone_ref = function(arg0) {
        var ret = getObject(arg0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_cb_drop = function(arg0) {
        const obj = takeObject(arg0).original;
        if (obj.cnt-- == 1) {
            obj.a = 0;
            return true;
        }
        var ret = false;
        return ret;
    };
    imports.wbg.__wbg_new_2bec4cf82a784eab = function(arg0) {
        var ret = new ChangeListInterpreter(getObject(arg0));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_unmount_76daa031ae559619 = function(arg0) {
        getObject(arg0).unmount();
    };
    imports.wbg.__wbg_addChangeListRange_553ae19aeb229fbc = function(arg0, arg1, arg2) {
        getObject(arg0).addChangeListRange(arg1 >>> 0, arg2 >>> 0);
    };
    imports.wbg.__wbg_applyChanges_ac0289e1ef507660 = function(arg0, arg1) {
        getObject(arg0).applyChanges(takeObject(arg1));
    };
    imports.wbg.__wbg_initEventsTrampoline_22e547fb490f8cfd = function(arg0, arg1) {
        getObject(arg0).initEventsTrampoline(getObject(arg1));
    };
    imports.wbg.__wbg_instanceof_Window_49f532f06a9786ee = function(arg0) {
        var ret = getObject(arg0) instanceof Window;
        return ret;
    };
    imports.wbg.__wbg_document_c0366b39e4f4c89a = function(arg0) {
        var ret = getObject(arg0).document;
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    };
    imports.wbg.__wbg_requestAnimationFrame_ef0e2294dc8b1088 = handleError(function(arg0, arg1) {
        var ret = getObject(arg0).requestAnimationFrame(getObject(arg1));
        return ret;
    });
    imports.wbg.__wbg_keyCode_47f9e9228bc483bf = function(arg0) {
        var ret = getObject(arg0).keyCode;
        return ret;
    };
    imports.wbg.__wbg_settitle_1d1d2e8a6a4cc22c = function(arg0, arg1, arg2) {
        getObject(arg0).title = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_body_c8cb19d760637268 = function(arg0) {
        var ret = getObject(arg0).body;
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    };
    imports.wbg.__wbg_createElement_99351c8bf0efac6e = handleError(function(arg0, arg1, arg2) {
        var ret = getObject(arg0).createElement(getStringFromWasm0(arg1, arg2));
        return addHeapObject(ret);
    });
    imports.wbg.__wbg_setinnerHTML_79084edd97462c07 = function(arg0, arg1, arg2) {
        getObject(arg0).innerHTML = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_instanceof_HtmlInputElement_ad83b145c236a35b = function(arg0) {
        var ret = getObject(arg0) instanceof HTMLInputElement;
        return ret;
    };
    imports.wbg.__wbg_value_97fba2fa96f7251f = function(arg0, arg1) {
        var ret = getObject(arg1).value;
        var ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        getInt32Memory0()[arg0 / 4 + 1] = len0;
        getInt32Memory0()[arg0 / 4 + 0] = ptr0;
    };
    imports.wbg.__wbg_target_4bc4eb28204bcc44 = function(arg0) {
        var ret = getObject(arg0).target;
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    };
    imports.wbg.__wbg_appendChild_7c45aeccd496f2a5 = handleError(function(arg0, arg1) {
        var ret = getObject(arg0).appendChild(getObject(arg1));
        return addHeapObject(ret);
    });
    imports.wbg.__wbg_newnoargs_7c6bd521992b4022 = function(arg0, arg1) {
        var ret = new Function(getStringFromWasm0(arg0, arg1));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_call_951bd0c6d815d6f1 = handleError(function(arg0, arg1) {
        var ret = getObject(arg0).call(getObject(arg1));
        return addHeapObject(ret);
    });
    imports.wbg.__wbg_new_bb4e44ef089e45b4 = function(arg0, arg1) {
        try {
            var state0 = {a: arg0, b: arg1};
            var cb0 = (arg0, arg1) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return __wbg_adapter_61(a, state0.b, arg0, arg1);
                } finally {
                    state0.a = a;
                }
            };
            var ret = new Promise(cb0);
            return addHeapObject(ret);
        } finally {
            state0.a = state0.b = 0;
        }
    };
    imports.wbg.__wbg_resolve_6e61e640925a0db9 = function(arg0) {
        var ret = Promise.resolve(getObject(arg0));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_then_dd3785597974798a = function(arg0, arg1) {
        var ret = getObject(arg0).then(getObject(arg1));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_then_0f957e0f4c3e537a = function(arg0, arg1, arg2) {
        var ret = getObject(arg0).then(getObject(arg1), getObject(arg2));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_globalThis_513fb247e8e4e6d2 = handleError(function() {
        var ret = globalThis.globalThis;
        return addHeapObject(ret);
    });
    imports.wbg.__wbg_self_6baf3a3aa7b63415 = handleError(function() {
        var ret = self.self;
        return addHeapObject(ret);
    });
    imports.wbg.__wbg_window_63fc4027b66c265b = handleError(function() {
        var ret = window.window;
        return addHeapObject(ret);
    });
    imports.wbg.__wbg_global_b87245cd886d7113 = handleError(function() {
        var ret = global.global;
        return addHeapObject(ret);
    });
    imports.wbg.__wbindgen_is_undefined = function(arg0) {
        var ret = getObject(arg0) === undefined;
        return ret;
    };
    imports.wbg.__wbindgen_object_drop_ref = function(arg0) {
        takeObject(arg0);
    };
    imports.wbg.__wbindgen_debug_string = function(arg0, arg1) {
        var ret = debugString(getObject(arg1));
        var ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        getInt32Memory0()[arg0 / 4 + 1] = len0;
        getInt32Memory0()[arg0 / 4 + 0] = ptr0;
    };
    imports.wbg.__wbindgen_throw = function(arg0, arg1) {
        throw new Error(getStringFromWasm0(arg0, arg1));
    };
    imports.wbg.__wbindgen_memory = function() {
        var ret = wasm.memory;
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_closure_wrapper13466 = function(arg0, arg1, arg2) {
        var ret = makeClosure(arg0, arg1, 539, __wbg_adapter_16);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_closure_wrapper13468 = function(arg0, arg1, arg2) {
        var ret = makeMutClosure(arg0, arg1, 537, __wbg_adapter_19);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_closure_wrapper16125 = function(arg0, arg1, arg2) {
        var ret = makeMutClosure(arg0, arg1, 570, __wbg_adapter_22);
        return addHeapObject(ret);
    };

    if (typeof input === 'string' || (typeof Request === 'function' && input instanceof Request) || (typeof URL === 'function' && input instanceof URL)) {
        input = fetch(input);
    }

    const { instance, module } = await load(await input, imports);

    wasm = instance.exports;
    init.__wbindgen_wasm_module = module;
    wasm.__wbindgen_start();
    return wasm;
}

export default init;

