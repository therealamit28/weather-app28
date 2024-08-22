
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop$1() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function split_css_unit(value) {
        const split = typeof value === 'string' && value.match(/^\s*(-?[\d.]+)([^\s]*)\s*$/);
        return split ? [parseFloat(split[1]), split[2] || 'px'] : [value, 'px'];
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop$1;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function append(target, node) {
        target.appendChild(node);
    }
    function get_root_for_style(node) {
        if (!node)
            return document;
        const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
        if (root && root.host) {
            return root;
        }
        return node.ownerDocument;
    }
    function append_empty_stylesheet(node) {
        const style_element = element('style');
        append_stylesheet(get_root_for_style(node), style_element);
        return style_element.sheet;
    }
    function append_stylesheet(node, style) {
        append(node.head || node, style);
        return style.sheet;
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    // we need to store the information for multiple documents because a Svelte application could also contain iframes
    // https://github.com/sveltejs/svelte/issues/3624
    const managed_styles = new Map();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_style_information(doc, node) {
        const info = { stylesheet: append_empty_stylesheet(node), rules: {} };
        managed_styles.set(doc, info);
        return info;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = get_root_for_style(node);
        const { stylesheet, rules } = managed_styles.get(doc) || create_style_information(doc, node);
        if (!rules[name]) {
            rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            managed_styles.forEach(info => {
                const { ownerNode } = info.stylesheet;
                // there is no ownerNode if it runs on jsdom.
                if (ownerNode)
                    detach(ownerNode);
            });
            managed_styles.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    /**
     * The `onMount` function schedules a callback to run as soon as the component has been mounted to the DOM.
     * It must be called during the component's initialisation (but doesn't need to live *inside* the component;
     * it can be called from an external module).
     *
     * `onMount` does not run inside a [server-side component](/docs#run-time-server-side-component-api).
     *
     * https://svelte.dev/docs#run-time-svelte-onmount
     */
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    let render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = /* @__PURE__ */ Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    /**
     * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
        targets.forEach((c) => c());
        render_callbacks = filtered;
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        const options = { direction: 'in' };
        let config = fn(node, params, options);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop$1, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                started = true;
                delete_rule(node);
                if (is_function(config)) {
                    config = config(options);
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            flush_render_callbacks($$.after_update);
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop$1,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop$1;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop$1;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.59.2' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation, has_stop_immediate_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        if (has_stop_immediate_propagation)
            modifiers.push('stopImmediatePropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    function construct_svelte_component_dev(component, props) {
        const error_message = 'this={...} of <svelte:component> should specify a Svelte component.';
        try {
            const instance = new component(props);
            if (!instance.$$ || !instance.$set || !instance.$on || !instance.$destroy) {
                throw new Error(error_message);
            }
            return instance;
        }
        catch (err) {
            const { message } = err;
            if (typeof message === 'string' && message.indexOf('is not a constructor') !== -1) {
                throw new Error(error_message);
            }
            else {
                throw err;
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    function bind(fn, thisArg) {
      return function wrap() {
        return fn.apply(thisArg, arguments);
      };
    }

    // utils is a library of generic helper functions non-specific to axios

    const {toString} = Object.prototype;
    const {getPrototypeOf} = Object;

    const kindOf = (cache => thing => {
        const str = toString.call(thing);
        return cache[str] || (cache[str] = str.slice(8, -1).toLowerCase());
    })(Object.create(null));

    const kindOfTest = (type) => {
      type = type.toLowerCase();
      return (thing) => kindOf(thing) === type
    };

    const typeOfTest = type => thing => typeof thing === type;

    /**
     * Determine if a value is an Array
     *
     * @param {Object} val The value to test
     *
     * @returns {boolean} True if value is an Array, otherwise false
     */
    const {isArray} = Array;

    /**
     * Determine if a value is undefined
     *
     * @param {*} val The value to test
     *
     * @returns {boolean} True if the value is undefined, otherwise false
     */
    const isUndefined = typeOfTest('undefined');

    /**
     * Determine if a value is a Buffer
     *
     * @param {*} val The value to test
     *
     * @returns {boolean} True if value is a Buffer, otherwise false
     */
    function isBuffer(val) {
      return val !== null && !isUndefined(val) && val.constructor !== null && !isUndefined(val.constructor)
        && isFunction(val.constructor.isBuffer) && val.constructor.isBuffer(val);
    }

    /**
     * Determine if a value is an ArrayBuffer
     *
     * @param {*} val The value to test
     *
     * @returns {boolean} True if value is an ArrayBuffer, otherwise false
     */
    const isArrayBuffer = kindOfTest('ArrayBuffer');


    /**
     * Determine if a value is a view on an ArrayBuffer
     *
     * @param {*} val The value to test
     *
     * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
     */
    function isArrayBufferView(val) {
      let result;
      if ((typeof ArrayBuffer !== 'undefined') && (ArrayBuffer.isView)) {
        result = ArrayBuffer.isView(val);
      } else {
        result = (val) && (val.buffer) && (isArrayBuffer(val.buffer));
      }
      return result;
    }

    /**
     * Determine if a value is a String
     *
     * @param {*} val The value to test
     *
     * @returns {boolean} True if value is a String, otherwise false
     */
    const isString = typeOfTest('string');

    /**
     * Determine if a value is a Function
     *
     * @param {*} val The value to test
     * @returns {boolean} True if value is a Function, otherwise false
     */
    const isFunction = typeOfTest('function');

    /**
     * Determine if a value is a Number
     *
     * @param {*} val The value to test
     *
     * @returns {boolean} True if value is a Number, otherwise false
     */
    const isNumber = typeOfTest('number');

    /**
     * Determine if a value is an Object
     *
     * @param {*} thing The value to test
     *
     * @returns {boolean} True if value is an Object, otherwise false
     */
    const isObject = (thing) => thing !== null && typeof thing === 'object';

    /**
     * Determine if a value is a Boolean
     *
     * @param {*} thing The value to test
     * @returns {boolean} True if value is a Boolean, otherwise false
     */
    const isBoolean = thing => thing === true || thing === false;

    /**
     * Determine if a value is a plain Object
     *
     * @param {*} val The value to test
     *
     * @returns {boolean} True if value is a plain Object, otherwise false
     */
    const isPlainObject = (val) => {
      if (kindOf(val) !== 'object') {
        return false;
      }

      const prototype = getPrototypeOf(val);
      return (prototype === null || prototype === Object.prototype || Object.getPrototypeOf(prototype) === null) && !(Symbol.toStringTag in val) && !(Symbol.iterator in val);
    };

    /**
     * Determine if a value is a Date
     *
     * @param {*} val The value to test
     *
     * @returns {boolean} True if value is a Date, otherwise false
     */
    const isDate = kindOfTest('Date');

    /**
     * Determine if a value is a File
     *
     * @param {*} val The value to test
     *
     * @returns {boolean} True if value is a File, otherwise false
     */
    const isFile = kindOfTest('File');

    /**
     * Determine if a value is a Blob
     *
     * @param {*} val The value to test
     *
     * @returns {boolean} True if value is a Blob, otherwise false
     */
    const isBlob = kindOfTest('Blob');

    /**
     * Determine if a value is a FileList
     *
     * @param {*} val The value to test
     *
     * @returns {boolean} True if value is a File, otherwise false
     */
    const isFileList = kindOfTest('FileList');

    /**
     * Determine if a value is a Stream
     *
     * @param {*} val The value to test
     *
     * @returns {boolean} True if value is a Stream, otherwise false
     */
    const isStream = (val) => isObject(val) && isFunction(val.pipe);

    /**
     * Determine if a value is a FormData
     *
     * @param {*} thing The value to test
     *
     * @returns {boolean} True if value is an FormData, otherwise false
     */
    const isFormData = (thing) => {
      let kind;
      return thing && (
        (typeof FormData === 'function' && thing instanceof FormData) || (
          isFunction(thing.append) && (
            (kind = kindOf(thing)) === 'formdata' ||
            // detect form-data instance
            (kind === 'object' && isFunction(thing.toString) && thing.toString() === '[object FormData]')
          )
        )
      )
    };

    /**
     * Determine if a value is a URLSearchParams object
     *
     * @param {*} val The value to test
     *
     * @returns {boolean} True if value is a URLSearchParams object, otherwise false
     */
    const isURLSearchParams = kindOfTest('URLSearchParams');

    const [isReadableStream, isRequest, isResponse, isHeaders] = ['ReadableStream', 'Request', 'Response', 'Headers'].map(kindOfTest);

    /**
     * Trim excess whitespace off the beginning and end of a string
     *
     * @param {String} str The String to trim
     *
     * @returns {String} The String freed of excess whitespace
     */
    const trim = (str) => str.trim ?
      str.trim() : str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');

    /**
     * Iterate over an Array or an Object invoking a function for each item.
     *
     * If `obj` is an Array callback will be called passing
     * the value, index, and complete array for each item.
     *
     * If 'obj' is an Object callback will be called passing
     * the value, key, and complete object for each property.
     *
     * @param {Object|Array} obj The object to iterate
     * @param {Function} fn The callback to invoke for each item
     *
     * @param {Boolean} [allOwnKeys = false]
     * @returns {any}
     */
    function forEach(obj, fn, {allOwnKeys = false} = {}) {
      // Don't bother if no value provided
      if (obj === null || typeof obj === 'undefined') {
        return;
      }

      let i;
      let l;

      // Force an array if not already something iterable
      if (typeof obj !== 'object') {
        /*eslint no-param-reassign:0*/
        obj = [obj];
      }

      if (isArray(obj)) {
        // Iterate over array values
        for (i = 0, l = obj.length; i < l; i++) {
          fn.call(null, obj[i], i, obj);
        }
      } else {
        // Iterate over object keys
        const keys = allOwnKeys ? Object.getOwnPropertyNames(obj) : Object.keys(obj);
        const len = keys.length;
        let key;

        for (i = 0; i < len; i++) {
          key = keys[i];
          fn.call(null, obj[key], key, obj);
        }
      }
    }

    function findKey(obj, key) {
      key = key.toLowerCase();
      const keys = Object.keys(obj);
      let i = keys.length;
      let _key;
      while (i-- > 0) {
        _key = keys[i];
        if (key === _key.toLowerCase()) {
          return _key;
        }
      }
      return null;
    }

    const _global = (() => {
      /*eslint no-undef:0*/
      if (typeof globalThis !== "undefined") return globalThis;
      return typeof self !== "undefined" ? self : (typeof window !== 'undefined' ? window : global)
    })();

    const isContextDefined = (context) => !isUndefined(context) && context !== _global;

    /**
     * Accepts varargs expecting each argument to be an object, then
     * immutably merges the properties of each object and returns result.
     *
     * When multiple objects contain the same key the later object in
     * the arguments list will take precedence.
     *
     * Example:
     *
     * ```js
     * var result = merge({foo: 123}, {foo: 456});
     * console.log(result.foo); // outputs 456
     * ```
     *
     * @param {Object} obj1 Object to merge
     *
     * @returns {Object} Result of all merge properties
     */
    function merge(/* obj1, obj2, obj3, ... */) {
      const {caseless} = isContextDefined(this) && this || {};
      const result = {};
      const assignValue = (val, key) => {
        const targetKey = caseless && findKey(result, key) || key;
        if (isPlainObject(result[targetKey]) && isPlainObject(val)) {
          result[targetKey] = merge(result[targetKey], val);
        } else if (isPlainObject(val)) {
          result[targetKey] = merge({}, val);
        } else if (isArray(val)) {
          result[targetKey] = val.slice();
        } else {
          result[targetKey] = val;
        }
      };

      for (let i = 0, l = arguments.length; i < l; i++) {
        arguments[i] && forEach(arguments[i], assignValue);
      }
      return result;
    }

    /**
     * Extends object a by mutably adding to it the properties of object b.
     *
     * @param {Object} a The object to be extended
     * @param {Object} b The object to copy properties from
     * @param {Object} thisArg The object to bind function to
     *
     * @param {Boolean} [allOwnKeys]
     * @returns {Object} The resulting value of object a
     */
    const extend = (a, b, thisArg, {allOwnKeys}= {}) => {
      forEach(b, (val, key) => {
        if (thisArg && isFunction(val)) {
          a[key] = bind(val, thisArg);
        } else {
          a[key] = val;
        }
      }, {allOwnKeys});
      return a;
    };

    /**
     * Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
     *
     * @param {string} content with BOM
     *
     * @returns {string} content value without BOM
     */
    const stripBOM = (content) => {
      if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
      }
      return content;
    };

    /**
     * Inherit the prototype methods from one constructor into another
     * @param {function} constructor
     * @param {function} superConstructor
     * @param {object} [props]
     * @param {object} [descriptors]
     *
     * @returns {void}
     */
    const inherits = (constructor, superConstructor, props, descriptors) => {
      constructor.prototype = Object.create(superConstructor.prototype, descriptors);
      constructor.prototype.constructor = constructor;
      Object.defineProperty(constructor, 'super', {
        value: superConstructor.prototype
      });
      props && Object.assign(constructor.prototype, props);
    };

    /**
     * Resolve object with deep prototype chain to a flat object
     * @param {Object} sourceObj source object
     * @param {Object} [destObj]
     * @param {Function|Boolean} [filter]
     * @param {Function} [propFilter]
     *
     * @returns {Object}
     */
    const toFlatObject = (sourceObj, destObj, filter, propFilter) => {
      let props;
      let i;
      let prop;
      const merged = {};

      destObj = destObj || {};
      // eslint-disable-next-line no-eq-null,eqeqeq
      if (sourceObj == null) return destObj;

      do {
        props = Object.getOwnPropertyNames(sourceObj);
        i = props.length;
        while (i-- > 0) {
          prop = props[i];
          if ((!propFilter || propFilter(prop, sourceObj, destObj)) && !merged[prop]) {
            destObj[prop] = sourceObj[prop];
            merged[prop] = true;
          }
        }
        sourceObj = filter !== false && getPrototypeOf(sourceObj);
      } while (sourceObj && (!filter || filter(sourceObj, destObj)) && sourceObj !== Object.prototype);

      return destObj;
    };

    /**
     * Determines whether a string ends with the characters of a specified string
     *
     * @param {String} str
     * @param {String} searchString
     * @param {Number} [position= 0]
     *
     * @returns {boolean}
     */
    const endsWith = (str, searchString, position) => {
      str = String(str);
      if (position === undefined || position > str.length) {
        position = str.length;
      }
      position -= searchString.length;
      const lastIndex = str.indexOf(searchString, position);
      return lastIndex !== -1 && lastIndex === position;
    };


    /**
     * Returns new array from array like object or null if failed
     *
     * @param {*} [thing]
     *
     * @returns {?Array}
     */
    const toArray = (thing) => {
      if (!thing) return null;
      if (isArray(thing)) return thing;
      let i = thing.length;
      if (!isNumber(i)) return null;
      const arr = new Array(i);
      while (i-- > 0) {
        arr[i] = thing[i];
      }
      return arr;
    };

    /**
     * Checking if the Uint8Array exists and if it does, it returns a function that checks if the
     * thing passed in is an instance of Uint8Array
     *
     * @param {TypedArray}
     *
     * @returns {Array}
     */
    // eslint-disable-next-line func-names
    const isTypedArray = (TypedArray => {
      // eslint-disable-next-line func-names
      return thing => {
        return TypedArray && thing instanceof TypedArray;
      };
    })(typeof Uint8Array !== 'undefined' && getPrototypeOf(Uint8Array));

    /**
     * For each entry in the object, call the function with the key and value.
     *
     * @param {Object<any, any>} obj - The object to iterate over.
     * @param {Function} fn - The function to call for each entry.
     *
     * @returns {void}
     */
    const forEachEntry = (obj, fn) => {
      const generator = obj && obj[Symbol.iterator];

      const iterator = generator.call(obj);

      let result;

      while ((result = iterator.next()) && !result.done) {
        const pair = result.value;
        fn.call(obj, pair[0], pair[1]);
      }
    };

    /**
     * It takes a regular expression and a string, and returns an array of all the matches
     *
     * @param {string} regExp - The regular expression to match against.
     * @param {string} str - The string to search.
     *
     * @returns {Array<boolean>}
     */
    const matchAll = (regExp, str) => {
      let matches;
      const arr = [];

      while ((matches = regExp.exec(str)) !== null) {
        arr.push(matches);
      }

      return arr;
    };

    /* Checking if the kindOfTest function returns true when passed an HTMLFormElement. */
    const isHTMLForm = kindOfTest('HTMLFormElement');

    const toCamelCase = str => {
      return str.toLowerCase().replace(/[-_\s]([a-z\d])(\w*)/g,
        function replacer(m, p1, p2) {
          return p1.toUpperCase() + p2;
        }
      );
    };

    /* Creating a function that will check if an object has a property. */
    const hasOwnProperty = (({hasOwnProperty}) => (obj, prop) => hasOwnProperty.call(obj, prop))(Object.prototype);

    /**
     * Determine if a value is a RegExp object
     *
     * @param {*} val The value to test
     *
     * @returns {boolean} True if value is a RegExp object, otherwise false
     */
    const isRegExp = kindOfTest('RegExp');

    const reduceDescriptors = (obj, reducer) => {
      const descriptors = Object.getOwnPropertyDescriptors(obj);
      const reducedDescriptors = {};

      forEach(descriptors, (descriptor, name) => {
        let ret;
        if ((ret = reducer(descriptor, name, obj)) !== false) {
          reducedDescriptors[name] = ret || descriptor;
        }
      });

      Object.defineProperties(obj, reducedDescriptors);
    };

    /**
     * Makes all methods read-only
     * @param {Object} obj
     */

    const freezeMethods = (obj) => {
      reduceDescriptors(obj, (descriptor, name) => {
        // skip restricted props in strict mode
        if (isFunction(obj) && ['arguments', 'caller', 'callee'].indexOf(name) !== -1) {
          return false;
        }

        const value = obj[name];

        if (!isFunction(value)) return;

        descriptor.enumerable = false;

        if ('writable' in descriptor) {
          descriptor.writable = false;
          return;
        }

        if (!descriptor.set) {
          descriptor.set = () => {
            throw Error('Can not rewrite read-only method \'' + name + '\'');
          };
        }
      });
    };

    const toObjectSet = (arrayOrString, delimiter) => {
      const obj = {};

      const define = (arr) => {
        arr.forEach(value => {
          obj[value] = true;
        });
      };

      isArray(arrayOrString) ? define(arrayOrString) : define(String(arrayOrString).split(delimiter));

      return obj;
    };

    const noop = () => {};

    const toFiniteNumber = (value, defaultValue) => {
      return value != null && Number.isFinite(value = +value) ? value : defaultValue;
    };

    const ALPHA = 'abcdefghijklmnopqrstuvwxyz';

    const DIGIT = '0123456789';

    const ALPHABET = {
      DIGIT,
      ALPHA,
      ALPHA_DIGIT: ALPHA + ALPHA.toUpperCase() + DIGIT
    };

    const generateString = (size = 16, alphabet = ALPHABET.ALPHA_DIGIT) => {
      let str = '';
      const {length} = alphabet;
      while (size--) {
        str += alphabet[Math.random() * length|0];
      }

      return str;
    };

    /**
     * If the thing is a FormData object, return true, otherwise return false.
     *
     * @param {unknown} thing - The thing to check.
     *
     * @returns {boolean}
     */
    function isSpecCompliantForm(thing) {
      return !!(thing && isFunction(thing.append) && thing[Symbol.toStringTag] === 'FormData' && thing[Symbol.iterator]);
    }

    const toJSONObject = (obj) => {
      const stack = new Array(10);

      const visit = (source, i) => {

        if (isObject(source)) {
          if (stack.indexOf(source) >= 0) {
            return;
          }

          if(!('toJSON' in source)) {
            stack[i] = source;
            const target = isArray(source) ? [] : {};

            forEach(source, (value, key) => {
              const reducedValue = visit(value, i + 1);
              !isUndefined(reducedValue) && (target[key] = reducedValue);
            });

            stack[i] = undefined;

            return target;
          }
        }

        return source;
      };

      return visit(obj, 0);
    };

    const isAsyncFn = kindOfTest('AsyncFunction');

    const isThenable = (thing) =>
      thing && (isObject(thing) || isFunction(thing)) && isFunction(thing.then) && isFunction(thing.catch);

    // original code
    // https://github.com/DigitalBrainJS/AxiosPromise/blob/16deab13710ec09779922131f3fa5954320f83ab/lib/utils.js#L11-L34

    const _setImmediate = ((setImmediateSupported, postMessageSupported) => {
      if (setImmediateSupported) {
        return setImmediate;
      }

      return postMessageSupported ? ((token, callbacks) => {
        _global.addEventListener("message", ({source, data}) => {
          if (source === _global && data === token) {
            callbacks.length && callbacks.shift()();
          }
        }, false);

        return (cb) => {
          callbacks.push(cb);
          _global.postMessage(token, "*");
        }
      })(`axios@${Math.random()}`, []) : (cb) => setTimeout(cb);
    })(
      typeof setImmediate === 'function',
      isFunction(_global.postMessage)
    );

    const asap = typeof queueMicrotask !== 'undefined' ?
      queueMicrotask.bind(_global) : ( typeof process !== 'undefined' && process.nextTick || _setImmediate);

    // *********************

    var utils$1 = {
      isArray,
      isArrayBuffer,
      isBuffer,
      isFormData,
      isArrayBufferView,
      isString,
      isNumber,
      isBoolean,
      isObject,
      isPlainObject,
      isReadableStream,
      isRequest,
      isResponse,
      isHeaders,
      isUndefined,
      isDate,
      isFile,
      isBlob,
      isRegExp,
      isFunction,
      isStream,
      isURLSearchParams,
      isTypedArray,
      isFileList,
      forEach,
      merge,
      extend,
      trim,
      stripBOM,
      inherits,
      toFlatObject,
      kindOf,
      kindOfTest,
      endsWith,
      toArray,
      forEachEntry,
      matchAll,
      isHTMLForm,
      hasOwnProperty,
      hasOwnProp: hasOwnProperty, // an alias to avoid ESLint no-prototype-builtins detection
      reduceDescriptors,
      freezeMethods,
      toObjectSet,
      toCamelCase,
      noop,
      toFiniteNumber,
      findKey,
      global: _global,
      isContextDefined,
      ALPHABET,
      generateString,
      isSpecCompliantForm,
      toJSONObject,
      isAsyncFn,
      isThenable,
      setImmediate: _setImmediate,
      asap
    };

    /**
     * Create an Error with the specified message, config, error code, request and response.
     *
     * @param {string} message The error message.
     * @param {string} [code] The error code (for example, 'ECONNABORTED').
     * @param {Object} [config] The config.
     * @param {Object} [request] The request.
     * @param {Object} [response] The response.
     *
     * @returns {Error} The created error.
     */
    function AxiosError(message, code, config, request, response) {
      Error.call(this);

      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, this.constructor);
      } else {
        this.stack = (new Error()).stack;
      }

      this.message = message;
      this.name = 'AxiosError';
      code && (this.code = code);
      config && (this.config = config);
      request && (this.request = request);
      response && (this.response = response);
    }

    utils$1.inherits(AxiosError, Error, {
      toJSON: function toJSON() {
        return {
          // Standard
          message: this.message,
          name: this.name,
          // Microsoft
          description: this.description,
          number: this.number,
          // Mozilla
          fileName: this.fileName,
          lineNumber: this.lineNumber,
          columnNumber: this.columnNumber,
          stack: this.stack,
          // Axios
          config: utils$1.toJSONObject(this.config),
          code: this.code,
          status: this.response && this.response.status ? this.response.status : null
        };
      }
    });

    const prototype$1 = AxiosError.prototype;
    const descriptors = {};

    [
      'ERR_BAD_OPTION_VALUE',
      'ERR_BAD_OPTION',
      'ECONNABORTED',
      'ETIMEDOUT',
      'ERR_NETWORK',
      'ERR_FR_TOO_MANY_REDIRECTS',
      'ERR_DEPRECATED',
      'ERR_BAD_RESPONSE',
      'ERR_BAD_REQUEST',
      'ERR_CANCELED',
      'ERR_NOT_SUPPORT',
      'ERR_INVALID_URL'
    // eslint-disable-next-line func-names
    ].forEach(code => {
      descriptors[code] = {value: code};
    });

    Object.defineProperties(AxiosError, descriptors);
    Object.defineProperty(prototype$1, 'isAxiosError', {value: true});

    // eslint-disable-next-line func-names
    AxiosError.from = (error, code, config, request, response, customProps) => {
      const axiosError = Object.create(prototype$1);

      utils$1.toFlatObject(error, axiosError, function filter(obj) {
        return obj !== Error.prototype;
      }, prop => {
        return prop !== 'isAxiosError';
      });

      AxiosError.call(axiosError, error.message, code, config, request, response);

      axiosError.cause = error;

      axiosError.name = error.name;

      customProps && Object.assign(axiosError, customProps);

      return axiosError;
    };

    // eslint-disable-next-line strict
    var httpAdapter = null;

    /**
     * Determines if the given thing is a array or js object.
     *
     * @param {string} thing - The object or array to be visited.
     *
     * @returns {boolean}
     */
    function isVisitable(thing) {
      return utils$1.isPlainObject(thing) || utils$1.isArray(thing);
    }

    /**
     * It removes the brackets from the end of a string
     *
     * @param {string} key - The key of the parameter.
     *
     * @returns {string} the key without the brackets.
     */
    function removeBrackets(key) {
      return utils$1.endsWith(key, '[]') ? key.slice(0, -2) : key;
    }

    /**
     * It takes a path, a key, and a boolean, and returns a string
     *
     * @param {string} path - The path to the current key.
     * @param {string} key - The key of the current object being iterated over.
     * @param {string} dots - If true, the key will be rendered with dots instead of brackets.
     *
     * @returns {string} The path to the current key.
     */
    function renderKey(path, key, dots) {
      if (!path) return key;
      return path.concat(key).map(function each(token, i) {
        // eslint-disable-next-line no-param-reassign
        token = removeBrackets(token);
        return !dots && i ? '[' + token + ']' : token;
      }).join(dots ? '.' : '');
    }

    /**
     * If the array is an array and none of its elements are visitable, then it's a flat array.
     *
     * @param {Array<any>} arr - The array to check
     *
     * @returns {boolean}
     */
    function isFlatArray(arr) {
      return utils$1.isArray(arr) && !arr.some(isVisitable);
    }

    const predicates = utils$1.toFlatObject(utils$1, {}, null, function filter(prop) {
      return /^is[A-Z]/.test(prop);
    });

    /**
     * Convert a data object to FormData
     *
     * @param {Object} obj
     * @param {?Object} [formData]
     * @param {?Object} [options]
     * @param {Function} [options.visitor]
     * @param {Boolean} [options.metaTokens = true]
     * @param {Boolean} [options.dots = false]
     * @param {?Boolean} [options.indexes = false]
     *
     * @returns {Object}
     **/

    /**
     * It converts an object into a FormData object
     *
     * @param {Object<any, any>} obj - The object to convert to form data.
     * @param {string} formData - The FormData object to append to.
     * @param {Object<string, any>} options
     *
     * @returns
     */
    function toFormData(obj, formData, options) {
      if (!utils$1.isObject(obj)) {
        throw new TypeError('target must be an object');
      }

      // eslint-disable-next-line no-param-reassign
      formData = formData || new (FormData)();

      // eslint-disable-next-line no-param-reassign
      options = utils$1.toFlatObject(options, {
        metaTokens: true,
        dots: false,
        indexes: false
      }, false, function defined(option, source) {
        // eslint-disable-next-line no-eq-null,eqeqeq
        return !utils$1.isUndefined(source[option]);
      });

      const metaTokens = options.metaTokens;
      // eslint-disable-next-line no-use-before-define
      const visitor = options.visitor || defaultVisitor;
      const dots = options.dots;
      const indexes = options.indexes;
      const _Blob = options.Blob || typeof Blob !== 'undefined' && Blob;
      const useBlob = _Blob && utils$1.isSpecCompliantForm(formData);

      if (!utils$1.isFunction(visitor)) {
        throw new TypeError('visitor must be a function');
      }

      function convertValue(value) {
        if (value === null) return '';

        if (utils$1.isDate(value)) {
          return value.toISOString();
        }

        if (!useBlob && utils$1.isBlob(value)) {
          throw new AxiosError('Blob is not supported. Use a Buffer instead.');
        }

        if (utils$1.isArrayBuffer(value) || utils$1.isTypedArray(value)) {
          return useBlob && typeof Blob === 'function' ? new Blob([value]) : Buffer.from(value);
        }

        return value;
      }

      /**
       * Default visitor.
       *
       * @param {*} value
       * @param {String|Number} key
       * @param {Array<String|Number>} path
       * @this {FormData}
       *
       * @returns {boolean} return true to visit the each prop of the value recursively
       */
      function defaultVisitor(value, key, path) {
        let arr = value;

        if (value && !path && typeof value === 'object') {
          if (utils$1.endsWith(key, '{}')) {
            // eslint-disable-next-line no-param-reassign
            key = metaTokens ? key : key.slice(0, -2);
            // eslint-disable-next-line no-param-reassign
            value = JSON.stringify(value);
          } else if (
            (utils$1.isArray(value) && isFlatArray(value)) ||
            ((utils$1.isFileList(value) || utils$1.endsWith(key, '[]')) && (arr = utils$1.toArray(value))
            )) {
            // eslint-disable-next-line no-param-reassign
            key = removeBrackets(key);

            arr.forEach(function each(el, index) {
              !(utils$1.isUndefined(el) || el === null) && formData.append(
                // eslint-disable-next-line no-nested-ternary
                indexes === true ? renderKey([key], index, dots) : (indexes === null ? key : key + '[]'),
                convertValue(el)
              );
            });
            return false;
          }
        }

        if (isVisitable(value)) {
          return true;
        }

        formData.append(renderKey(path, key, dots), convertValue(value));

        return false;
      }

      const stack = [];

      const exposedHelpers = Object.assign(predicates, {
        defaultVisitor,
        convertValue,
        isVisitable
      });

      function build(value, path) {
        if (utils$1.isUndefined(value)) return;

        if (stack.indexOf(value) !== -1) {
          throw Error('Circular reference detected in ' + path.join('.'));
        }

        stack.push(value);

        utils$1.forEach(value, function each(el, key) {
          const result = !(utils$1.isUndefined(el) || el === null) && visitor.call(
            formData, el, utils$1.isString(key) ? key.trim() : key, path, exposedHelpers
          );

          if (result === true) {
            build(el, path ? path.concat(key) : [key]);
          }
        });

        stack.pop();
      }

      if (!utils$1.isObject(obj)) {
        throw new TypeError('data must be an object');
      }

      build(obj);

      return formData;
    }

    /**
     * It encodes a string by replacing all characters that are not in the unreserved set with
     * their percent-encoded equivalents
     *
     * @param {string} str - The string to encode.
     *
     * @returns {string} The encoded string.
     */
    function encode$1(str) {
      const charMap = {
        '!': '%21',
        "'": '%27',
        '(': '%28',
        ')': '%29',
        '~': '%7E',
        '%20': '+',
        '%00': '\x00'
      };
      return encodeURIComponent(str).replace(/[!'()~]|%20|%00/g, function replacer(match) {
        return charMap[match];
      });
    }

    /**
     * It takes a params object and converts it to a FormData object
     *
     * @param {Object<string, any>} params - The parameters to be converted to a FormData object.
     * @param {Object<string, any>} options - The options object passed to the Axios constructor.
     *
     * @returns {void}
     */
    function AxiosURLSearchParams(params, options) {
      this._pairs = [];

      params && toFormData(params, this, options);
    }

    const prototype = AxiosURLSearchParams.prototype;

    prototype.append = function append(name, value) {
      this._pairs.push([name, value]);
    };

    prototype.toString = function toString(encoder) {
      const _encode = encoder ? function(value) {
        return encoder.call(this, value, encode$1);
      } : encode$1;

      return this._pairs.map(function each(pair) {
        return _encode(pair[0]) + '=' + _encode(pair[1]);
      }, '').join('&');
    };

    /**
     * It replaces all instances of the characters `:`, `$`, `,`, `+`, `[`, and `]` with their
     * URI encoded counterparts
     *
     * @param {string} val The value to be encoded.
     *
     * @returns {string} The encoded value.
     */
    function encode(val) {
      return encodeURIComponent(val).
        replace(/%3A/gi, ':').
        replace(/%24/g, '$').
        replace(/%2C/gi, ',').
        replace(/%20/g, '+').
        replace(/%5B/gi, '[').
        replace(/%5D/gi, ']');
    }

    /**
     * Build a URL by appending params to the end
     *
     * @param {string} url The base of the url (e.g., http://www.google.com)
     * @param {object} [params] The params to be appended
     * @param {?object} options
     *
     * @returns {string} The formatted url
     */
    function buildURL(url, params, options) {
      /*eslint no-param-reassign:0*/
      if (!params) {
        return url;
      }
      
      const _encode = options && options.encode || encode;

      const serializeFn = options && options.serialize;

      let serializedParams;

      if (serializeFn) {
        serializedParams = serializeFn(params, options);
      } else {
        serializedParams = utils$1.isURLSearchParams(params) ?
          params.toString() :
          new AxiosURLSearchParams(params, options).toString(_encode);
      }

      if (serializedParams) {
        const hashmarkIndex = url.indexOf("#");

        if (hashmarkIndex !== -1) {
          url = url.slice(0, hashmarkIndex);
        }
        url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
      }

      return url;
    }

    class InterceptorManager {
      constructor() {
        this.handlers = [];
      }

      /**
       * Add a new interceptor to the stack
       *
       * @param {Function} fulfilled The function to handle `then` for a `Promise`
       * @param {Function} rejected The function to handle `reject` for a `Promise`
       *
       * @return {Number} An ID used to remove interceptor later
       */
      use(fulfilled, rejected, options) {
        this.handlers.push({
          fulfilled,
          rejected,
          synchronous: options ? options.synchronous : false,
          runWhen: options ? options.runWhen : null
        });
        return this.handlers.length - 1;
      }

      /**
       * Remove an interceptor from the stack
       *
       * @param {Number} id The ID that was returned by `use`
       *
       * @returns {Boolean} `true` if the interceptor was removed, `false` otherwise
       */
      eject(id) {
        if (this.handlers[id]) {
          this.handlers[id] = null;
        }
      }

      /**
       * Clear all interceptors from the stack
       *
       * @returns {void}
       */
      clear() {
        if (this.handlers) {
          this.handlers = [];
        }
      }

      /**
       * Iterate over all the registered interceptors
       *
       * This method is particularly useful for skipping over any
       * interceptors that may have become `null` calling `eject`.
       *
       * @param {Function} fn The function to call for each interceptor
       *
       * @returns {void}
       */
      forEach(fn) {
        utils$1.forEach(this.handlers, function forEachHandler(h) {
          if (h !== null) {
            fn(h);
          }
        });
      }
    }

    var InterceptorManager$1 = InterceptorManager;

    var transitionalDefaults = {
      silentJSONParsing: true,
      forcedJSONParsing: true,
      clarifyTimeoutError: false
    };

    var URLSearchParams$1 = typeof URLSearchParams !== 'undefined' ? URLSearchParams : AxiosURLSearchParams;

    var FormData$1 = typeof FormData !== 'undefined' ? FormData : null;

    var Blob$1 = typeof Blob !== 'undefined' ? Blob : null;

    var platform$1 = {
      isBrowser: true,
      classes: {
        URLSearchParams: URLSearchParams$1,
        FormData: FormData$1,
        Blob: Blob$1
      },
      protocols: ['http', 'https', 'file', 'blob', 'url', 'data']
    };

    const hasBrowserEnv = typeof window !== 'undefined' && typeof document !== 'undefined';

    /**
     * Determine if we're running in a standard browser environment
     *
     * This allows axios to run in a web worker, and react-native.
     * Both environments support XMLHttpRequest, but not fully standard globals.
     *
     * web workers:
     *  typeof window -> undefined
     *  typeof document -> undefined
     *
     * react-native:
     *  navigator.product -> 'ReactNative'
     * nativescript
     *  navigator.product -> 'NativeScript' or 'NS'
     *
     * @returns {boolean}
     */
    const hasStandardBrowserEnv = (
      (product) => {
        return hasBrowserEnv && ['ReactNative', 'NativeScript', 'NS'].indexOf(product) < 0
      })(typeof navigator !== 'undefined' && navigator.product);

    /**
     * Determine if we're running in a standard browser webWorker environment
     *
     * Although the `isStandardBrowserEnv` method indicates that
     * `allows axios to run in a web worker`, the WebWorker will still be
     * filtered out due to its judgment standard
     * `typeof window !== 'undefined' && typeof document !== 'undefined'`.
     * This leads to a problem when axios post `FormData` in webWorker
     */
    const hasStandardBrowserWebWorkerEnv = (() => {
      return (
        typeof WorkerGlobalScope !== 'undefined' &&
        // eslint-disable-next-line no-undef
        self instanceof WorkerGlobalScope &&
        typeof self.importScripts === 'function'
      );
    })();

    const origin = hasBrowserEnv && window.location.href || 'http://localhost';

    var utils = /*#__PURE__*/Object.freeze({
        __proto__: null,
        hasBrowserEnv: hasBrowserEnv,
        hasStandardBrowserEnv: hasStandardBrowserEnv,
        hasStandardBrowserWebWorkerEnv: hasStandardBrowserWebWorkerEnv,
        origin: origin
    });

    var platform = {
      ...utils,
      ...platform$1
    };

    function toURLEncodedForm(data, options) {
      return toFormData(data, new platform.classes.URLSearchParams(), Object.assign({
        visitor: function(value, key, path, helpers) {
          if (platform.isNode && utils$1.isBuffer(value)) {
            this.append(key, value.toString('base64'));
            return false;
          }

          return helpers.defaultVisitor.apply(this, arguments);
        }
      }, options));
    }

    /**
     * It takes a string like `foo[x][y][z]` and returns an array like `['foo', 'x', 'y', 'z']
     *
     * @param {string} name - The name of the property to get.
     *
     * @returns An array of strings.
     */
    function parsePropPath(name) {
      // foo[x][y][z]
      // foo.x.y.z
      // foo-x-y-z
      // foo x y z
      return utils$1.matchAll(/\w+|\[(\w*)]/g, name).map(match => {
        return match[0] === '[]' ? '' : match[1] || match[0];
      });
    }

    /**
     * Convert an array to an object.
     *
     * @param {Array<any>} arr - The array to convert to an object.
     *
     * @returns An object with the same keys and values as the array.
     */
    function arrayToObject(arr) {
      const obj = {};
      const keys = Object.keys(arr);
      let i;
      const len = keys.length;
      let key;
      for (i = 0; i < len; i++) {
        key = keys[i];
        obj[key] = arr[key];
      }
      return obj;
    }

    /**
     * It takes a FormData object and returns a JavaScript object
     *
     * @param {string} formData The FormData object to convert to JSON.
     *
     * @returns {Object<string, any> | null} The converted object.
     */
    function formDataToJSON(formData) {
      function buildPath(path, value, target, index) {
        let name = path[index++];

        if (name === '__proto__') return true;

        const isNumericKey = Number.isFinite(+name);
        const isLast = index >= path.length;
        name = !name && utils$1.isArray(target) ? target.length : name;

        if (isLast) {
          if (utils$1.hasOwnProp(target, name)) {
            target[name] = [target[name], value];
          } else {
            target[name] = value;
          }

          return !isNumericKey;
        }

        if (!target[name] || !utils$1.isObject(target[name])) {
          target[name] = [];
        }

        const result = buildPath(path, value, target[name], index);

        if (result && utils$1.isArray(target[name])) {
          target[name] = arrayToObject(target[name]);
        }

        return !isNumericKey;
      }

      if (utils$1.isFormData(formData) && utils$1.isFunction(formData.entries)) {
        const obj = {};

        utils$1.forEachEntry(formData, (name, value) => {
          buildPath(parsePropPath(name), value, obj, 0);
        });

        return obj;
      }

      return null;
    }

    /**
     * It takes a string, tries to parse it, and if it fails, it returns the stringified version
     * of the input
     *
     * @param {any} rawValue - The value to be stringified.
     * @param {Function} parser - A function that parses a string into a JavaScript object.
     * @param {Function} encoder - A function that takes a value and returns a string.
     *
     * @returns {string} A stringified version of the rawValue.
     */
    function stringifySafely(rawValue, parser, encoder) {
      if (utils$1.isString(rawValue)) {
        try {
          (parser || JSON.parse)(rawValue);
          return utils$1.trim(rawValue);
        } catch (e) {
          if (e.name !== 'SyntaxError') {
            throw e;
          }
        }
      }

      return (encoder || JSON.stringify)(rawValue);
    }

    const defaults = {

      transitional: transitionalDefaults,

      adapter: ['xhr', 'http', 'fetch'],

      transformRequest: [function transformRequest(data, headers) {
        const contentType = headers.getContentType() || '';
        const hasJSONContentType = contentType.indexOf('application/json') > -1;
        const isObjectPayload = utils$1.isObject(data);

        if (isObjectPayload && utils$1.isHTMLForm(data)) {
          data = new FormData(data);
        }

        const isFormData = utils$1.isFormData(data);

        if (isFormData) {
          return hasJSONContentType ? JSON.stringify(formDataToJSON(data)) : data;
        }

        if (utils$1.isArrayBuffer(data) ||
          utils$1.isBuffer(data) ||
          utils$1.isStream(data) ||
          utils$1.isFile(data) ||
          utils$1.isBlob(data) ||
          utils$1.isReadableStream(data)
        ) {
          return data;
        }
        if (utils$1.isArrayBufferView(data)) {
          return data.buffer;
        }
        if (utils$1.isURLSearchParams(data)) {
          headers.setContentType('application/x-www-form-urlencoded;charset=utf-8', false);
          return data.toString();
        }

        let isFileList;

        if (isObjectPayload) {
          if (contentType.indexOf('application/x-www-form-urlencoded') > -1) {
            return toURLEncodedForm(data, this.formSerializer).toString();
          }

          if ((isFileList = utils$1.isFileList(data)) || contentType.indexOf('multipart/form-data') > -1) {
            const _FormData = this.env && this.env.FormData;

            return toFormData(
              isFileList ? {'files[]': data} : data,
              _FormData && new _FormData(),
              this.formSerializer
            );
          }
        }

        if (isObjectPayload || hasJSONContentType ) {
          headers.setContentType('application/json', false);
          return stringifySafely(data);
        }

        return data;
      }],

      transformResponse: [function transformResponse(data) {
        const transitional = this.transitional || defaults.transitional;
        const forcedJSONParsing = transitional && transitional.forcedJSONParsing;
        const JSONRequested = this.responseType === 'json';

        if (utils$1.isResponse(data) || utils$1.isReadableStream(data)) {
          return data;
        }

        if (data && utils$1.isString(data) && ((forcedJSONParsing && !this.responseType) || JSONRequested)) {
          const silentJSONParsing = transitional && transitional.silentJSONParsing;
          const strictJSONParsing = !silentJSONParsing && JSONRequested;

          try {
            return JSON.parse(data);
          } catch (e) {
            if (strictJSONParsing) {
              if (e.name === 'SyntaxError') {
                throw AxiosError.from(e, AxiosError.ERR_BAD_RESPONSE, this, null, this.response);
              }
              throw e;
            }
          }
        }

        return data;
      }],

      /**
       * A timeout in milliseconds to abort a request. If set to 0 (default) a
       * timeout is not created.
       */
      timeout: 0,

      xsrfCookieName: 'XSRF-TOKEN',
      xsrfHeaderName: 'X-XSRF-TOKEN',

      maxContentLength: -1,
      maxBodyLength: -1,

      env: {
        FormData: platform.classes.FormData,
        Blob: platform.classes.Blob
      },

      validateStatus: function validateStatus(status) {
        return status >= 200 && status < 300;
      },

      headers: {
        common: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': undefined
        }
      }
    };

    utils$1.forEach(['delete', 'get', 'head', 'post', 'put', 'patch'], (method) => {
      defaults.headers[method] = {};
    });

    var defaults$1 = defaults;

    // RawAxiosHeaders whose duplicates are ignored by node
    // c.f. https://nodejs.org/api/http.html#http_message_headers
    const ignoreDuplicateOf = utils$1.toObjectSet([
      'age', 'authorization', 'content-length', 'content-type', 'etag',
      'expires', 'from', 'host', 'if-modified-since', 'if-unmodified-since',
      'last-modified', 'location', 'max-forwards', 'proxy-authorization',
      'referer', 'retry-after', 'user-agent'
    ]);

    /**
     * Parse headers into an object
     *
     * ```
     * Date: Wed, 27 Aug 2014 08:58:49 GMT
     * Content-Type: application/json
     * Connection: keep-alive
     * Transfer-Encoding: chunked
     * ```
     *
     * @param {String} rawHeaders Headers needing to be parsed
     *
     * @returns {Object} Headers parsed into an object
     */
    var parseHeaders = rawHeaders => {
      const parsed = {};
      let key;
      let val;
      let i;

      rawHeaders && rawHeaders.split('\n').forEach(function parser(line) {
        i = line.indexOf(':');
        key = line.substring(0, i).trim().toLowerCase();
        val = line.substring(i + 1).trim();

        if (!key || (parsed[key] && ignoreDuplicateOf[key])) {
          return;
        }

        if (key === 'set-cookie') {
          if (parsed[key]) {
            parsed[key].push(val);
          } else {
            parsed[key] = [val];
          }
        } else {
          parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
        }
      });

      return parsed;
    };

    const $internals = Symbol('internals');

    function normalizeHeader(header) {
      return header && String(header).trim().toLowerCase();
    }

    function normalizeValue(value) {
      if (value === false || value == null) {
        return value;
      }

      return utils$1.isArray(value) ? value.map(normalizeValue) : String(value);
    }

    function parseTokens(str) {
      const tokens = Object.create(null);
      const tokensRE = /([^\s,;=]+)\s*(?:=\s*([^,;]+))?/g;
      let match;

      while ((match = tokensRE.exec(str))) {
        tokens[match[1]] = match[2];
      }

      return tokens;
    }

    const isValidHeaderName = (str) => /^[-_a-zA-Z0-9^`|~,!#$%&'*+.]+$/.test(str.trim());

    function matchHeaderValue(context, value, header, filter, isHeaderNameFilter) {
      if (utils$1.isFunction(filter)) {
        return filter.call(this, value, header);
      }

      if (isHeaderNameFilter) {
        value = header;
      }

      if (!utils$1.isString(value)) return;

      if (utils$1.isString(filter)) {
        return value.indexOf(filter) !== -1;
      }

      if (utils$1.isRegExp(filter)) {
        return filter.test(value);
      }
    }

    function formatHeader(header) {
      return header.trim()
        .toLowerCase().replace(/([a-z\d])(\w*)/g, (w, char, str) => {
          return char.toUpperCase() + str;
        });
    }

    function buildAccessors(obj, header) {
      const accessorName = utils$1.toCamelCase(' ' + header);

      ['get', 'set', 'has'].forEach(methodName => {
        Object.defineProperty(obj, methodName + accessorName, {
          value: function(arg1, arg2, arg3) {
            return this[methodName].call(this, header, arg1, arg2, arg3);
          },
          configurable: true
        });
      });
    }

    class AxiosHeaders {
      constructor(headers) {
        headers && this.set(headers);
      }

      set(header, valueOrRewrite, rewrite) {
        const self = this;

        function setHeader(_value, _header, _rewrite) {
          const lHeader = normalizeHeader(_header);

          if (!lHeader) {
            throw new Error('header name must be a non-empty string');
          }

          const key = utils$1.findKey(self, lHeader);

          if(!key || self[key] === undefined || _rewrite === true || (_rewrite === undefined && self[key] !== false)) {
            self[key || _header] = normalizeValue(_value);
          }
        }

        const setHeaders = (headers, _rewrite) =>
          utils$1.forEach(headers, (_value, _header) => setHeader(_value, _header, _rewrite));

        if (utils$1.isPlainObject(header) || header instanceof this.constructor) {
          setHeaders(header, valueOrRewrite);
        } else if(utils$1.isString(header) && (header = header.trim()) && !isValidHeaderName(header)) {
          setHeaders(parseHeaders(header), valueOrRewrite);
        } else if (utils$1.isHeaders(header)) {
          for (const [key, value] of header.entries()) {
            setHeader(value, key, rewrite);
          }
        } else {
          header != null && setHeader(valueOrRewrite, header, rewrite);
        }

        return this;
      }

      get(header, parser) {
        header = normalizeHeader(header);

        if (header) {
          const key = utils$1.findKey(this, header);

          if (key) {
            const value = this[key];

            if (!parser) {
              return value;
            }

            if (parser === true) {
              return parseTokens(value);
            }

            if (utils$1.isFunction(parser)) {
              return parser.call(this, value, key);
            }

            if (utils$1.isRegExp(parser)) {
              return parser.exec(value);
            }

            throw new TypeError('parser must be boolean|regexp|function');
          }
        }
      }

      has(header, matcher) {
        header = normalizeHeader(header);

        if (header) {
          const key = utils$1.findKey(this, header);

          return !!(key && this[key] !== undefined && (!matcher || matchHeaderValue(this, this[key], key, matcher)));
        }

        return false;
      }

      delete(header, matcher) {
        const self = this;
        let deleted = false;

        function deleteHeader(_header) {
          _header = normalizeHeader(_header);

          if (_header) {
            const key = utils$1.findKey(self, _header);

            if (key && (!matcher || matchHeaderValue(self, self[key], key, matcher))) {
              delete self[key];

              deleted = true;
            }
          }
        }

        if (utils$1.isArray(header)) {
          header.forEach(deleteHeader);
        } else {
          deleteHeader(header);
        }

        return deleted;
      }

      clear(matcher) {
        const keys = Object.keys(this);
        let i = keys.length;
        let deleted = false;

        while (i--) {
          const key = keys[i];
          if(!matcher || matchHeaderValue(this, this[key], key, matcher, true)) {
            delete this[key];
            deleted = true;
          }
        }

        return deleted;
      }

      normalize(format) {
        const self = this;
        const headers = {};

        utils$1.forEach(this, (value, header) => {
          const key = utils$1.findKey(headers, header);

          if (key) {
            self[key] = normalizeValue(value);
            delete self[header];
            return;
          }

          const normalized = format ? formatHeader(header) : String(header).trim();

          if (normalized !== header) {
            delete self[header];
          }

          self[normalized] = normalizeValue(value);

          headers[normalized] = true;
        });

        return this;
      }

      concat(...targets) {
        return this.constructor.concat(this, ...targets);
      }

      toJSON(asStrings) {
        const obj = Object.create(null);

        utils$1.forEach(this, (value, header) => {
          value != null && value !== false && (obj[header] = asStrings && utils$1.isArray(value) ? value.join(', ') : value);
        });

        return obj;
      }

      [Symbol.iterator]() {
        return Object.entries(this.toJSON())[Symbol.iterator]();
      }

      toString() {
        return Object.entries(this.toJSON()).map(([header, value]) => header + ': ' + value).join('\n');
      }

      get [Symbol.toStringTag]() {
        return 'AxiosHeaders';
      }

      static from(thing) {
        return thing instanceof this ? thing : new this(thing);
      }

      static concat(first, ...targets) {
        const computed = new this(first);

        targets.forEach((target) => computed.set(target));

        return computed;
      }

      static accessor(header) {
        const internals = this[$internals] = (this[$internals] = {
          accessors: {}
        });

        const accessors = internals.accessors;
        const prototype = this.prototype;

        function defineAccessor(_header) {
          const lHeader = normalizeHeader(_header);

          if (!accessors[lHeader]) {
            buildAccessors(prototype, _header);
            accessors[lHeader] = true;
          }
        }

        utils$1.isArray(header) ? header.forEach(defineAccessor) : defineAccessor(header);

        return this;
      }
    }

    AxiosHeaders.accessor(['Content-Type', 'Content-Length', 'Accept', 'Accept-Encoding', 'User-Agent', 'Authorization']);

    // reserved names hotfix
    utils$1.reduceDescriptors(AxiosHeaders.prototype, ({value}, key) => {
      let mapped = key[0].toUpperCase() + key.slice(1); // map `set` => `Set`
      return {
        get: () => value,
        set(headerValue) {
          this[mapped] = headerValue;
        }
      }
    });

    utils$1.freezeMethods(AxiosHeaders);

    var AxiosHeaders$1 = AxiosHeaders;

    /**
     * Transform the data for a request or a response
     *
     * @param {Array|Function} fns A single function or Array of functions
     * @param {?Object} response The response object
     *
     * @returns {*} The resulting transformed data
     */
    function transformData(fns, response) {
      const config = this || defaults$1;
      const context = response || config;
      const headers = AxiosHeaders$1.from(context.headers);
      let data = context.data;

      utils$1.forEach(fns, function transform(fn) {
        data = fn.call(config, data, headers.normalize(), response ? response.status : undefined);
      });

      headers.normalize();

      return data;
    }

    function isCancel(value) {
      return !!(value && value.__CANCEL__);
    }

    /**
     * A `CanceledError` is an object that is thrown when an operation is canceled.
     *
     * @param {string=} message The message.
     * @param {Object=} config The config.
     * @param {Object=} request The request.
     *
     * @returns {CanceledError} The created error.
     */
    function CanceledError(message, config, request) {
      // eslint-disable-next-line no-eq-null,eqeqeq
      AxiosError.call(this, message == null ? 'canceled' : message, AxiosError.ERR_CANCELED, config, request);
      this.name = 'CanceledError';
    }

    utils$1.inherits(CanceledError, AxiosError, {
      __CANCEL__: true
    });

    /**
     * Resolve or reject a Promise based on response status.
     *
     * @param {Function} resolve A function that resolves the promise.
     * @param {Function} reject A function that rejects the promise.
     * @param {object} response The response.
     *
     * @returns {object} The response.
     */
    function settle(resolve, reject, response) {
      const validateStatus = response.config.validateStatus;
      if (!response.status || !validateStatus || validateStatus(response.status)) {
        resolve(response);
      } else {
        reject(new AxiosError(
          'Request failed with status code ' + response.status,
          [AxiosError.ERR_BAD_REQUEST, AxiosError.ERR_BAD_RESPONSE][Math.floor(response.status / 100) - 4],
          response.config,
          response.request,
          response
        ));
      }
    }

    function parseProtocol(url) {
      const match = /^([-+\w]{1,25})(:?\/\/|:)/.exec(url);
      return match && match[1] || '';
    }

    /**
     * Calculate data maxRate
     * @param {Number} [samplesCount= 10]
     * @param {Number} [min= 1000]
     * @returns {Function}
     */
    function speedometer(samplesCount, min) {
      samplesCount = samplesCount || 10;
      const bytes = new Array(samplesCount);
      const timestamps = new Array(samplesCount);
      let head = 0;
      let tail = 0;
      let firstSampleTS;

      min = min !== undefined ? min : 1000;

      return function push(chunkLength) {
        const now = Date.now();

        const startedAt = timestamps[tail];

        if (!firstSampleTS) {
          firstSampleTS = now;
        }

        bytes[head] = chunkLength;
        timestamps[head] = now;

        let i = tail;
        let bytesCount = 0;

        while (i !== head) {
          bytesCount += bytes[i++];
          i = i % samplesCount;
        }

        head = (head + 1) % samplesCount;

        if (head === tail) {
          tail = (tail + 1) % samplesCount;
        }

        if (now - firstSampleTS < min) {
          return;
        }

        const passed = startedAt && now - startedAt;

        return passed ? Math.round(bytesCount * 1000 / passed) : undefined;
      };
    }

    /**
     * Throttle decorator
     * @param {Function} fn
     * @param {Number} freq
     * @return {Function}
     */
    function throttle(fn, freq) {
      let timestamp = 0;
      let threshold = 1000 / freq;
      let lastArgs;
      let timer;

      const invoke = (args, now = Date.now()) => {
        timestamp = now;
        lastArgs = null;
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
        fn.apply(null, args);
      };

      const throttled = (...args) => {
        const now = Date.now();
        const passed = now - timestamp;
        if ( passed >= threshold) {
          invoke(args, now);
        } else {
          lastArgs = args;
          if (!timer) {
            timer = setTimeout(() => {
              timer = null;
              invoke(lastArgs);
            }, threshold - passed);
          }
        }
      };

      const flush = () => lastArgs && invoke(lastArgs);

      return [throttled, flush];
    }

    const progressEventReducer = (listener, isDownloadStream, freq = 3) => {
      let bytesNotified = 0;
      const _speedometer = speedometer(50, 250);

      return throttle(e => {
        const loaded = e.loaded;
        const total = e.lengthComputable ? e.total : undefined;
        const progressBytes = loaded - bytesNotified;
        const rate = _speedometer(progressBytes);
        const inRange = loaded <= total;

        bytesNotified = loaded;

        const data = {
          loaded,
          total,
          progress: total ? (loaded / total) : undefined,
          bytes: progressBytes,
          rate: rate ? rate : undefined,
          estimated: rate && total && inRange ? (total - loaded) / rate : undefined,
          event: e,
          lengthComputable: total != null,
          [isDownloadStream ? 'download' : 'upload']: true
        };

        listener(data);
      }, freq);
    };

    const progressEventDecorator = (total, throttled) => {
      const lengthComputable = total != null;

      return [(loaded) => throttled[0]({
        lengthComputable,
        total,
        loaded
      }), throttled[1]];
    };

    const asyncDecorator = (fn) => (...args) => utils$1.asap(() => fn(...args));

    var isURLSameOrigin = platform.hasStandardBrowserEnv ?

    // Standard browser envs have full support of the APIs needed to test
    // whether the request URL is of the same origin as current location.
      (function standardBrowserEnv() {
        const msie = /(msie|trident)/i.test(navigator.userAgent);
        const urlParsingNode = document.createElement('a');
        let originURL;

        /**
        * Parse a URL to discover its components
        *
        * @param {String} url The URL to be parsed
        * @returns {Object}
        */
        function resolveURL(url) {
          let href = url;

          if (msie) {
            // IE needs attribute set twice to normalize properties
            urlParsingNode.setAttribute('href', href);
            href = urlParsingNode.href;
          }

          urlParsingNode.setAttribute('href', href);

          // urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils
          return {
            href: urlParsingNode.href,
            protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, '') : '',
            host: urlParsingNode.host,
            search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, '') : '',
            hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, '') : '',
            hostname: urlParsingNode.hostname,
            port: urlParsingNode.port,
            pathname: (urlParsingNode.pathname.charAt(0) === '/') ?
              urlParsingNode.pathname :
              '/' + urlParsingNode.pathname
          };
        }

        originURL = resolveURL(window.location.href);

        /**
        * Determine if a URL shares the same origin as the current location
        *
        * @param {String} requestURL The URL to test
        * @returns {boolean} True if URL shares the same origin, otherwise false
        */
        return function isURLSameOrigin(requestURL) {
          const parsed = (utils$1.isString(requestURL)) ? resolveURL(requestURL) : requestURL;
          return (parsed.protocol === originURL.protocol &&
              parsed.host === originURL.host);
        };
      })() :

      // Non standard browser envs (web workers, react-native) lack needed support.
      (function nonStandardBrowserEnv() {
        return function isURLSameOrigin() {
          return true;
        };
      })();

    var cookies = platform.hasStandardBrowserEnv ?

      // Standard browser envs support document.cookie
      {
        write(name, value, expires, path, domain, secure) {
          const cookie = [name + '=' + encodeURIComponent(value)];

          utils$1.isNumber(expires) && cookie.push('expires=' + new Date(expires).toGMTString());

          utils$1.isString(path) && cookie.push('path=' + path);

          utils$1.isString(domain) && cookie.push('domain=' + domain);

          secure === true && cookie.push('secure');

          document.cookie = cookie.join('; ');
        },

        read(name) {
          const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
          return (match ? decodeURIComponent(match[3]) : null);
        },

        remove(name) {
          this.write(name, '', Date.now() - 86400000);
        }
      }

      :

      // Non-standard browser env (web workers, react-native) lack needed support.
      {
        write() {},
        read() {
          return null;
        },
        remove() {}
      };

    /**
     * Determines whether the specified URL is absolute
     *
     * @param {string} url The URL to test
     *
     * @returns {boolean} True if the specified URL is absolute, otherwise false
     */
    function isAbsoluteURL(url) {
      // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
      // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
      // by any combination of letters, digits, plus, period, or hyphen.
      return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url);
    }

    /**
     * Creates a new URL by combining the specified URLs
     *
     * @param {string} baseURL The base URL
     * @param {string} relativeURL The relative URL
     *
     * @returns {string} The combined URL
     */
    function combineURLs(baseURL, relativeURL) {
      return relativeURL
        ? baseURL.replace(/\/?\/$/, '') + '/' + relativeURL.replace(/^\/+/, '')
        : baseURL;
    }

    /**
     * Creates a new URL by combining the baseURL with the requestedURL,
     * only when the requestedURL is not already an absolute URL.
     * If the requestURL is absolute, this function returns the requestedURL untouched.
     *
     * @param {string} baseURL The base URL
     * @param {string} requestedURL Absolute or relative URL to combine
     *
     * @returns {string} The combined full path
     */
    function buildFullPath(baseURL, requestedURL) {
      if (baseURL && !isAbsoluteURL(requestedURL)) {
        return combineURLs(baseURL, requestedURL);
      }
      return requestedURL;
    }

    const headersToObject = (thing) => thing instanceof AxiosHeaders$1 ? { ...thing } : thing;

    /**
     * Config-specific merge-function which creates a new config-object
     * by merging two configuration objects together.
     *
     * @param {Object} config1
     * @param {Object} config2
     *
     * @returns {Object} New object resulting from merging config2 to config1
     */
    function mergeConfig(config1, config2) {
      // eslint-disable-next-line no-param-reassign
      config2 = config2 || {};
      const config = {};

      function getMergedValue(target, source, caseless) {
        if (utils$1.isPlainObject(target) && utils$1.isPlainObject(source)) {
          return utils$1.merge.call({caseless}, target, source);
        } else if (utils$1.isPlainObject(source)) {
          return utils$1.merge({}, source);
        } else if (utils$1.isArray(source)) {
          return source.slice();
        }
        return source;
      }

      // eslint-disable-next-line consistent-return
      function mergeDeepProperties(a, b, caseless) {
        if (!utils$1.isUndefined(b)) {
          return getMergedValue(a, b, caseless);
        } else if (!utils$1.isUndefined(a)) {
          return getMergedValue(undefined, a, caseless);
        }
      }

      // eslint-disable-next-line consistent-return
      function valueFromConfig2(a, b) {
        if (!utils$1.isUndefined(b)) {
          return getMergedValue(undefined, b);
        }
      }

      // eslint-disable-next-line consistent-return
      function defaultToConfig2(a, b) {
        if (!utils$1.isUndefined(b)) {
          return getMergedValue(undefined, b);
        } else if (!utils$1.isUndefined(a)) {
          return getMergedValue(undefined, a);
        }
      }

      // eslint-disable-next-line consistent-return
      function mergeDirectKeys(a, b, prop) {
        if (prop in config2) {
          return getMergedValue(a, b);
        } else if (prop in config1) {
          return getMergedValue(undefined, a);
        }
      }

      const mergeMap = {
        url: valueFromConfig2,
        method: valueFromConfig2,
        data: valueFromConfig2,
        baseURL: defaultToConfig2,
        transformRequest: defaultToConfig2,
        transformResponse: defaultToConfig2,
        paramsSerializer: defaultToConfig2,
        timeout: defaultToConfig2,
        timeoutMessage: defaultToConfig2,
        withCredentials: defaultToConfig2,
        withXSRFToken: defaultToConfig2,
        adapter: defaultToConfig2,
        responseType: defaultToConfig2,
        xsrfCookieName: defaultToConfig2,
        xsrfHeaderName: defaultToConfig2,
        onUploadProgress: defaultToConfig2,
        onDownloadProgress: defaultToConfig2,
        decompress: defaultToConfig2,
        maxContentLength: defaultToConfig2,
        maxBodyLength: defaultToConfig2,
        beforeRedirect: defaultToConfig2,
        transport: defaultToConfig2,
        httpAgent: defaultToConfig2,
        httpsAgent: defaultToConfig2,
        cancelToken: defaultToConfig2,
        socketPath: defaultToConfig2,
        responseEncoding: defaultToConfig2,
        validateStatus: mergeDirectKeys,
        headers: (a, b) => mergeDeepProperties(headersToObject(a), headersToObject(b), true)
      };

      utils$1.forEach(Object.keys(Object.assign({}, config1, config2)), function computeConfigValue(prop) {
        const merge = mergeMap[prop] || mergeDeepProperties;
        const configValue = merge(config1[prop], config2[prop], prop);
        (utils$1.isUndefined(configValue) && merge !== mergeDirectKeys) || (config[prop] = configValue);
      });

      return config;
    }

    var resolveConfig = (config) => {
      const newConfig = mergeConfig({}, config);

      let {data, withXSRFToken, xsrfHeaderName, xsrfCookieName, headers, auth} = newConfig;

      newConfig.headers = headers = AxiosHeaders$1.from(headers);

      newConfig.url = buildURL(buildFullPath(newConfig.baseURL, newConfig.url), config.params, config.paramsSerializer);

      // HTTP basic authentication
      if (auth) {
        headers.set('Authorization', 'Basic ' +
          btoa((auth.username || '') + ':' + (auth.password ? unescape(encodeURIComponent(auth.password)) : ''))
        );
      }

      let contentType;

      if (utils$1.isFormData(data)) {
        if (platform.hasStandardBrowserEnv || platform.hasStandardBrowserWebWorkerEnv) {
          headers.setContentType(undefined); // Let the browser set it
        } else if ((contentType = headers.getContentType()) !== false) {
          // fix semicolon duplication issue for ReactNative FormData implementation
          const [type, ...tokens] = contentType ? contentType.split(';').map(token => token.trim()).filter(Boolean) : [];
          headers.setContentType([type || 'multipart/form-data', ...tokens].join('; '));
        }
      }

      // Add xsrf header
      // This is only done if running in a standard browser environment.
      // Specifically not if we're in a web worker, or react-native.

      if (platform.hasStandardBrowserEnv) {
        withXSRFToken && utils$1.isFunction(withXSRFToken) && (withXSRFToken = withXSRFToken(newConfig));

        if (withXSRFToken || (withXSRFToken !== false && isURLSameOrigin(newConfig.url))) {
          // Add xsrf header
          const xsrfValue = xsrfHeaderName && xsrfCookieName && cookies.read(xsrfCookieName);

          if (xsrfValue) {
            headers.set(xsrfHeaderName, xsrfValue);
          }
        }
      }

      return newConfig;
    };

    const isXHRAdapterSupported = typeof XMLHttpRequest !== 'undefined';

    var xhrAdapter = isXHRAdapterSupported && function (config) {
      return new Promise(function dispatchXhrRequest(resolve, reject) {
        const _config = resolveConfig(config);
        let requestData = _config.data;
        const requestHeaders = AxiosHeaders$1.from(_config.headers).normalize();
        let {responseType, onUploadProgress, onDownloadProgress} = _config;
        let onCanceled;
        let uploadThrottled, downloadThrottled;
        let flushUpload, flushDownload;

        function done() {
          flushUpload && flushUpload(); // flush events
          flushDownload && flushDownload(); // flush events

          _config.cancelToken && _config.cancelToken.unsubscribe(onCanceled);

          _config.signal && _config.signal.removeEventListener('abort', onCanceled);
        }

        let request = new XMLHttpRequest();

        request.open(_config.method.toUpperCase(), _config.url, true);

        // Set the request timeout in MS
        request.timeout = _config.timeout;

        function onloadend() {
          if (!request) {
            return;
          }
          // Prepare the response
          const responseHeaders = AxiosHeaders$1.from(
            'getAllResponseHeaders' in request && request.getAllResponseHeaders()
          );
          const responseData = !responseType || responseType === 'text' || responseType === 'json' ?
            request.responseText : request.response;
          const response = {
            data: responseData,
            status: request.status,
            statusText: request.statusText,
            headers: responseHeaders,
            config,
            request
          };

          settle(function _resolve(value) {
            resolve(value);
            done();
          }, function _reject(err) {
            reject(err);
            done();
          }, response);

          // Clean up request
          request = null;
        }

        if ('onloadend' in request) {
          // Use onloadend if available
          request.onloadend = onloadend;
        } else {
          // Listen for ready state to emulate onloadend
          request.onreadystatechange = function handleLoad() {
            if (!request || request.readyState !== 4) {
              return;
            }

            // The request errored out and we didn't get a response, this will be
            // handled by onerror instead
            // With one exception: request that using file: protocol, most browsers
            // will return status as 0 even though it's a successful request
            if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
              return;
            }
            // readystate handler is calling before onerror or ontimeout handlers,
            // so we should call onloadend on the next 'tick'
            setTimeout(onloadend);
          };
        }

        // Handle browser request cancellation (as opposed to a manual cancellation)
        request.onabort = function handleAbort() {
          if (!request) {
            return;
          }

          reject(new AxiosError('Request aborted', AxiosError.ECONNABORTED, config, request));

          // Clean up request
          request = null;
        };

        // Handle low level network errors
        request.onerror = function handleError() {
          // Real errors are hidden from us by the browser
          // onerror should only fire if it's a network error
          reject(new AxiosError('Network Error', AxiosError.ERR_NETWORK, config, request));

          // Clean up request
          request = null;
        };

        // Handle timeout
        request.ontimeout = function handleTimeout() {
          let timeoutErrorMessage = _config.timeout ? 'timeout of ' + _config.timeout + 'ms exceeded' : 'timeout exceeded';
          const transitional = _config.transitional || transitionalDefaults;
          if (_config.timeoutErrorMessage) {
            timeoutErrorMessage = _config.timeoutErrorMessage;
          }
          reject(new AxiosError(
            timeoutErrorMessage,
            transitional.clarifyTimeoutError ? AxiosError.ETIMEDOUT : AxiosError.ECONNABORTED,
            config,
            request));

          // Clean up request
          request = null;
        };

        // Remove Content-Type if data is undefined
        requestData === undefined && requestHeaders.setContentType(null);

        // Add headers to the request
        if ('setRequestHeader' in request) {
          utils$1.forEach(requestHeaders.toJSON(), function setRequestHeader(val, key) {
            request.setRequestHeader(key, val);
          });
        }

        // Add withCredentials to request if needed
        if (!utils$1.isUndefined(_config.withCredentials)) {
          request.withCredentials = !!_config.withCredentials;
        }

        // Add responseType to request if needed
        if (responseType && responseType !== 'json') {
          request.responseType = _config.responseType;
        }

        // Handle progress if needed
        if (onDownloadProgress) {
          ([downloadThrottled, flushDownload] = progressEventReducer(onDownloadProgress, true));
          request.addEventListener('progress', downloadThrottled);
        }

        // Not all browsers support upload events
        if (onUploadProgress && request.upload) {
          ([uploadThrottled, flushUpload] = progressEventReducer(onUploadProgress));

          request.upload.addEventListener('progress', uploadThrottled);

          request.upload.addEventListener('loadend', flushUpload);
        }

        if (_config.cancelToken || _config.signal) {
          // Handle cancellation
          // eslint-disable-next-line func-names
          onCanceled = cancel => {
            if (!request) {
              return;
            }
            reject(!cancel || cancel.type ? new CanceledError(null, config, request) : cancel);
            request.abort();
            request = null;
          };

          _config.cancelToken && _config.cancelToken.subscribe(onCanceled);
          if (_config.signal) {
            _config.signal.aborted ? onCanceled() : _config.signal.addEventListener('abort', onCanceled);
          }
        }

        const protocol = parseProtocol(_config.url);

        if (protocol && platform.protocols.indexOf(protocol) === -1) {
          reject(new AxiosError('Unsupported protocol ' + protocol + ':', AxiosError.ERR_BAD_REQUEST, config));
          return;
        }


        // Send the request
        request.send(requestData || null);
      });
    };

    const composeSignals = (signals, timeout) => {
      let controller = new AbortController();

      let aborted;

      const onabort = function (cancel) {
        if (!aborted) {
          aborted = true;
          unsubscribe();
          const err = cancel instanceof Error ? cancel : this.reason;
          controller.abort(err instanceof AxiosError ? err : new CanceledError(err instanceof Error ? err.message : err));
        }
      };

      let timer = timeout && setTimeout(() => {
        onabort(new AxiosError(`timeout ${timeout} of ms exceeded`, AxiosError.ETIMEDOUT));
      }, timeout);

      const unsubscribe = () => {
        if (signals) {
          timer && clearTimeout(timer);
          timer = null;
          signals.forEach(signal => {
            signal &&
            (signal.removeEventListener ? signal.removeEventListener('abort', onabort) : signal.unsubscribe(onabort));
          });
          signals = null;
        }
      };

      signals.forEach((signal) => signal && signal.addEventListener && signal.addEventListener('abort', onabort));

      const {signal} = controller;

      signal.unsubscribe = unsubscribe;

      return [signal, () => {
        timer && clearTimeout(timer);
        timer = null;
      }];
    };

    var composeSignals$1 = composeSignals;

    const streamChunk = function* (chunk, chunkSize) {
      let len = chunk.byteLength;

      if (!chunkSize || len < chunkSize) {
        yield chunk;
        return;
      }

      let pos = 0;
      let end;

      while (pos < len) {
        end = pos + chunkSize;
        yield chunk.slice(pos, end);
        pos = end;
      }
    };

    const readBytes = async function* (iterable, chunkSize, encode) {
      for await (const chunk of iterable) {
        yield* streamChunk(ArrayBuffer.isView(chunk) ? chunk : (await encode(String(chunk))), chunkSize);
      }
    };

    const trackStream = (stream, chunkSize, onProgress, onFinish, encode) => {
      const iterator = readBytes(stream, chunkSize, encode);

      let bytes = 0;
      let done;
      let _onFinish = (e) => {
        if (!done) {
          done = true;
          onFinish && onFinish(e);
        }
      };

      return new ReadableStream({
        async pull(controller) {
          try {
            const {done, value} = await iterator.next();

            if (done) {
             _onFinish();
              controller.close();
              return;
            }

            let len = value.byteLength;
            if (onProgress) {
              let loadedBytes = bytes += len;
              onProgress(loadedBytes);
            }
            controller.enqueue(new Uint8Array(value));
          } catch (err) {
            _onFinish(err);
            throw err;
          }
        },
        cancel(reason) {
          _onFinish(reason);
          return iterator.return();
        }
      }, {
        highWaterMark: 2
      })
    };

    const isFetchSupported = typeof fetch === 'function' && typeof Request === 'function' && typeof Response === 'function';
    const isReadableStreamSupported = isFetchSupported && typeof ReadableStream === 'function';

    // used only inside the fetch adapter
    const encodeText = isFetchSupported && (typeof TextEncoder === 'function' ?
        ((encoder) => (str) => encoder.encode(str))(new TextEncoder()) :
        async (str) => new Uint8Array(await new Response(str).arrayBuffer())
    );

    const test = (fn, ...args) => {
      try {
        return !!fn(...args);
      } catch (e) {
        return false
      }
    };

    const supportsRequestStream = isReadableStreamSupported && test(() => {
      let duplexAccessed = false;

      const hasContentType = new Request(platform.origin, {
        body: new ReadableStream(),
        method: 'POST',
        get duplex() {
          duplexAccessed = true;
          return 'half';
        },
      }).headers.has('Content-Type');

      return duplexAccessed && !hasContentType;
    });

    const DEFAULT_CHUNK_SIZE = 64 * 1024;

    const supportsResponseStream = isReadableStreamSupported &&
      test(() => utils$1.isReadableStream(new Response('').body));


    const resolvers = {
      stream: supportsResponseStream && ((res) => res.body)
    };

    isFetchSupported && (((res) => {
      ['text', 'arrayBuffer', 'blob', 'formData', 'stream'].forEach(type => {
        !resolvers[type] && (resolvers[type] = utils$1.isFunction(res[type]) ? (res) => res[type]() :
          (_, config) => {
            throw new AxiosError(`Response type '${type}' is not supported`, AxiosError.ERR_NOT_SUPPORT, config);
          });
      });
    })(new Response));

    const getBodyLength = async (body) => {
      if (body == null) {
        return 0;
      }

      if(utils$1.isBlob(body)) {
        return body.size;
      }

      if(utils$1.isSpecCompliantForm(body)) {
        return (await new Request(body).arrayBuffer()).byteLength;
      }

      if(utils$1.isArrayBufferView(body) || utils$1.isArrayBuffer(body)) {
        return body.byteLength;
      }

      if(utils$1.isURLSearchParams(body)) {
        body = body + '';
      }

      if(utils$1.isString(body)) {
        return (await encodeText(body)).byteLength;
      }
    };

    const resolveBodyLength = async (headers, body) => {
      const length = utils$1.toFiniteNumber(headers.getContentLength());

      return length == null ? getBodyLength(body) : length;
    };

    var fetchAdapter = isFetchSupported && (async (config) => {
      let {
        url,
        method,
        data,
        signal,
        cancelToken,
        timeout,
        onDownloadProgress,
        onUploadProgress,
        responseType,
        headers,
        withCredentials = 'same-origin',
        fetchOptions
      } = resolveConfig(config);

      responseType = responseType ? (responseType + '').toLowerCase() : 'text';

      let [composedSignal, stopTimeout] = (signal || cancelToken || timeout) ?
        composeSignals$1([signal, cancelToken], timeout) : [];

      let finished, request;

      const onFinish = () => {
        !finished && setTimeout(() => {
          composedSignal && composedSignal.unsubscribe();
        });

        finished = true;
      };

      let requestContentLength;

      try {
        if (
          onUploadProgress && supportsRequestStream && method !== 'get' && method !== 'head' &&
          (requestContentLength = await resolveBodyLength(headers, data)) !== 0
        ) {
          let _request = new Request(url, {
            method: 'POST',
            body: data,
            duplex: "half"
          });

          let contentTypeHeader;

          if (utils$1.isFormData(data) && (contentTypeHeader = _request.headers.get('content-type'))) {
            headers.setContentType(contentTypeHeader);
          }

          if (_request.body) {
            const [onProgress, flush] = progressEventDecorator(
              requestContentLength,
              progressEventReducer(asyncDecorator(onUploadProgress))
            );

            data = trackStream(_request.body, DEFAULT_CHUNK_SIZE, onProgress, flush, encodeText);
          }
        }

        if (!utils$1.isString(withCredentials)) {
          withCredentials = withCredentials ? 'include' : 'omit';
        }

        request = new Request(url, {
          ...fetchOptions,
          signal: composedSignal,
          method: method.toUpperCase(),
          headers: headers.normalize().toJSON(),
          body: data,
          duplex: "half",
          credentials: withCredentials
        });

        let response = await fetch(request);

        const isStreamResponse = supportsResponseStream && (responseType === 'stream' || responseType === 'response');

        if (supportsResponseStream && (onDownloadProgress || isStreamResponse)) {
          const options = {};

          ['status', 'statusText', 'headers'].forEach(prop => {
            options[prop] = response[prop];
          });

          const responseContentLength = utils$1.toFiniteNumber(response.headers.get('content-length'));

          const [onProgress, flush] = onDownloadProgress && progressEventDecorator(
            responseContentLength,
            progressEventReducer(asyncDecorator(onDownloadProgress), true)
          ) || [];

          response = new Response(
            trackStream(response.body, DEFAULT_CHUNK_SIZE, onProgress, () => {
              flush && flush();
              isStreamResponse && onFinish();
            }, encodeText),
            options
          );
        }

        responseType = responseType || 'text';

        let responseData = await resolvers[utils$1.findKey(resolvers, responseType) || 'text'](response, config);

        !isStreamResponse && onFinish();

        stopTimeout && stopTimeout();

        return await new Promise((resolve, reject) => {
          settle(resolve, reject, {
            data: responseData,
            headers: AxiosHeaders$1.from(response.headers),
            status: response.status,
            statusText: response.statusText,
            config,
            request
          });
        })
      } catch (err) {
        onFinish();

        if (err && err.name === 'TypeError' && /fetch/i.test(err.message)) {
          throw Object.assign(
            new AxiosError('Network Error', AxiosError.ERR_NETWORK, config, request),
            {
              cause: err.cause || err
            }
          )
        }

        throw AxiosError.from(err, err && err.code, config, request);
      }
    });

    const knownAdapters = {
      http: httpAdapter,
      xhr: xhrAdapter,
      fetch: fetchAdapter
    };

    utils$1.forEach(knownAdapters, (fn, value) => {
      if (fn) {
        try {
          Object.defineProperty(fn, 'name', {value});
        } catch (e) {
          // eslint-disable-next-line no-empty
        }
        Object.defineProperty(fn, 'adapterName', {value});
      }
    });

    const renderReason = (reason) => `- ${reason}`;

    const isResolvedHandle = (adapter) => utils$1.isFunction(adapter) || adapter === null || adapter === false;

    var adapters = {
      getAdapter: (adapters) => {
        adapters = utils$1.isArray(adapters) ? adapters : [adapters];

        const {length} = adapters;
        let nameOrAdapter;
        let adapter;

        const rejectedReasons = {};

        for (let i = 0; i < length; i++) {
          nameOrAdapter = adapters[i];
          let id;

          adapter = nameOrAdapter;

          if (!isResolvedHandle(nameOrAdapter)) {
            adapter = knownAdapters[(id = String(nameOrAdapter)).toLowerCase()];

            if (adapter === undefined) {
              throw new AxiosError(`Unknown adapter '${id}'`);
            }
          }

          if (adapter) {
            break;
          }

          rejectedReasons[id || '#' + i] = adapter;
        }

        if (!adapter) {

          const reasons = Object.entries(rejectedReasons)
            .map(([id, state]) => `adapter ${id} ` +
              (state === false ? 'is not supported by the environment' : 'is not available in the build')
            );

          let s = length ?
            (reasons.length > 1 ? 'since :\n' + reasons.map(renderReason).join('\n') : ' ' + renderReason(reasons[0])) :
            'as no adapter specified';

          throw new AxiosError(
            `There is no suitable adapter to dispatch the request ` + s,
            'ERR_NOT_SUPPORT'
          );
        }

        return adapter;
      },
      adapters: knownAdapters
    };

    /**
     * Throws a `CanceledError` if cancellation has been requested.
     *
     * @param {Object} config The config that is to be used for the request
     *
     * @returns {void}
     */
    function throwIfCancellationRequested(config) {
      if (config.cancelToken) {
        config.cancelToken.throwIfRequested();
      }

      if (config.signal && config.signal.aborted) {
        throw new CanceledError(null, config);
      }
    }

    /**
     * Dispatch a request to the server using the configured adapter.
     *
     * @param {object} config The config that is to be used for the request
     *
     * @returns {Promise} The Promise to be fulfilled
     */
    function dispatchRequest(config) {
      throwIfCancellationRequested(config);

      config.headers = AxiosHeaders$1.from(config.headers);

      // Transform request data
      config.data = transformData.call(
        config,
        config.transformRequest
      );

      if (['post', 'put', 'patch'].indexOf(config.method) !== -1) {
        config.headers.setContentType('application/x-www-form-urlencoded', false);
      }

      const adapter = adapters.getAdapter(config.adapter || defaults$1.adapter);

      return adapter(config).then(function onAdapterResolution(response) {
        throwIfCancellationRequested(config);

        // Transform response data
        response.data = transformData.call(
          config,
          config.transformResponse,
          response
        );

        response.headers = AxiosHeaders$1.from(response.headers);

        return response;
      }, function onAdapterRejection(reason) {
        if (!isCancel(reason)) {
          throwIfCancellationRequested(config);

          // Transform response data
          if (reason && reason.response) {
            reason.response.data = transformData.call(
              config,
              config.transformResponse,
              reason.response
            );
            reason.response.headers = AxiosHeaders$1.from(reason.response.headers);
          }
        }

        return Promise.reject(reason);
      });
    }

    const VERSION = "1.7.4";

    const validators$1 = {};

    // eslint-disable-next-line func-names
    ['object', 'boolean', 'number', 'function', 'string', 'symbol'].forEach((type, i) => {
      validators$1[type] = function validator(thing) {
        return typeof thing === type || 'a' + (i < 1 ? 'n ' : ' ') + type;
      };
    });

    const deprecatedWarnings = {};

    /**
     * Transitional option validator
     *
     * @param {function|boolean?} validator - set to false if the transitional option has been removed
     * @param {string?} version - deprecated version / removed since version
     * @param {string?} message - some message with additional info
     *
     * @returns {function}
     */
    validators$1.transitional = function transitional(validator, version, message) {
      function formatMessage(opt, desc) {
        return '[Axios v' + VERSION + '] Transitional option \'' + opt + '\'' + desc + (message ? '. ' + message : '');
      }

      // eslint-disable-next-line func-names
      return (value, opt, opts) => {
        if (validator === false) {
          throw new AxiosError(
            formatMessage(opt, ' has been removed' + (version ? ' in ' + version : '')),
            AxiosError.ERR_DEPRECATED
          );
        }

        if (version && !deprecatedWarnings[opt]) {
          deprecatedWarnings[opt] = true;
          // eslint-disable-next-line no-console
          console.warn(
            formatMessage(
              opt,
              ' has been deprecated since v' + version + ' and will be removed in the near future'
            )
          );
        }

        return validator ? validator(value, opt, opts) : true;
      };
    };

    /**
     * Assert object's properties type
     *
     * @param {object} options
     * @param {object} schema
     * @param {boolean?} allowUnknown
     *
     * @returns {object}
     */

    function assertOptions(options, schema, allowUnknown) {
      if (typeof options !== 'object') {
        throw new AxiosError('options must be an object', AxiosError.ERR_BAD_OPTION_VALUE);
      }
      const keys = Object.keys(options);
      let i = keys.length;
      while (i-- > 0) {
        const opt = keys[i];
        const validator = schema[opt];
        if (validator) {
          const value = options[opt];
          const result = value === undefined || validator(value, opt, options);
          if (result !== true) {
            throw new AxiosError('option ' + opt + ' must be ' + result, AxiosError.ERR_BAD_OPTION_VALUE);
          }
          continue;
        }
        if (allowUnknown !== true) {
          throw new AxiosError('Unknown option ' + opt, AxiosError.ERR_BAD_OPTION);
        }
      }
    }

    var validator = {
      assertOptions,
      validators: validators$1
    };

    const validators = validator.validators;

    /**
     * Create a new instance of Axios
     *
     * @param {Object} instanceConfig The default config for the instance
     *
     * @return {Axios} A new instance of Axios
     */
    class Axios {
      constructor(instanceConfig) {
        this.defaults = instanceConfig;
        this.interceptors = {
          request: new InterceptorManager$1(),
          response: new InterceptorManager$1()
        };
      }

      /**
       * Dispatch a request
       *
       * @param {String|Object} configOrUrl The config specific for this request (merged with this.defaults)
       * @param {?Object} config
       *
       * @returns {Promise} The Promise to be fulfilled
       */
      async request(configOrUrl, config) {
        try {
          return await this._request(configOrUrl, config);
        } catch (err) {
          if (err instanceof Error) {
            let dummy;

            Error.captureStackTrace ? Error.captureStackTrace(dummy = {}) : (dummy = new Error());

            // slice off the Error: ... line
            const stack = dummy.stack ? dummy.stack.replace(/^.+\n/, '') : '';
            try {
              if (!err.stack) {
                err.stack = stack;
                // match without the 2 top stack lines
              } else if (stack && !String(err.stack).endsWith(stack.replace(/^.+\n.+\n/, ''))) {
                err.stack += '\n' + stack;
              }
            } catch (e) {
              // ignore the case where "stack" is an un-writable property
            }
          }

          throw err;
        }
      }

      _request(configOrUrl, config) {
        /*eslint no-param-reassign:0*/
        // Allow for axios('example/url'[, config]) a la fetch API
        if (typeof configOrUrl === 'string') {
          config = config || {};
          config.url = configOrUrl;
        } else {
          config = configOrUrl || {};
        }

        config = mergeConfig(this.defaults, config);

        const {transitional, paramsSerializer, headers} = config;

        if (transitional !== undefined) {
          validator.assertOptions(transitional, {
            silentJSONParsing: validators.transitional(validators.boolean),
            forcedJSONParsing: validators.transitional(validators.boolean),
            clarifyTimeoutError: validators.transitional(validators.boolean)
          }, false);
        }

        if (paramsSerializer != null) {
          if (utils$1.isFunction(paramsSerializer)) {
            config.paramsSerializer = {
              serialize: paramsSerializer
            };
          } else {
            validator.assertOptions(paramsSerializer, {
              encode: validators.function,
              serialize: validators.function
            }, true);
          }
        }

        // Set config.method
        config.method = (config.method || this.defaults.method || 'get').toLowerCase();

        // Flatten headers
        let contextHeaders = headers && utils$1.merge(
          headers.common,
          headers[config.method]
        );

        headers && utils$1.forEach(
          ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
          (method) => {
            delete headers[method];
          }
        );

        config.headers = AxiosHeaders$1.concat(contextHeaders, headers);

        // filter out skipped interceptors
        const requestInterceptorChain = [];
        let synchronousRequestInterceptors = true;
        this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
          if (typeof interceptor.runWhen === 'function' && interceptor.runWhen(config) === false) {
            return;
          }

          synchronousRequestInterceptors = synchronousRequestInterceptors && interceptor.synchronous;

          requestInterceptorChain.unshift(interceptor.fulfilled, interceptor.rejected);
        });

        const responseInterceptorChain = [];
        this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
          responseInterceptorChain.push(interceptor.fulfilled, interceptor.rejected);
        });

        let promise;
        let i = 0;
        let len;

        if (!synchronousRequestInterceptors) {
          const chain = [dispatchRequest.bind(this), undefined];
          chain.unshift.apply(chain, requestInterceptorChain);
          chain.push.apply(chain, responseInterceptorChain);
          len = chain.length;

          promise = Promise.resolve(config);

          while (i < len) {
            promise = promise.then(chain[i++], chain[i++]);
          }

          return promise;
        }

        len = requestInterceptorChain.length;

        let newConfig = config;

        i = 0;

        while (i < len) {
          const onFulfilled = requestInterceptorChain[i++];
          const onRejected = requestInterceptorChain[i++];
          try {
            newConfig = onFulfilled(newConfig);
          } catch (error) {
            onRejected.call(this, error);
            break;
          }
        }

        try {
          promise = dispatchRequest.call(this, newConfig);
        } catch (error) {
          return Promise.reject(error);
        }

        i = 0;
        len = responseInterceptorChain.length;

        while (i < len) {
          promise = promise.then(responseInterceptorChain[i++], responseInterceptorChain[i++]);
        }

        return promise;
      }

      getUri(config) {
        config = mergeConfig(this.defaults, config);
        const fullPath = buildFullPath(config.baseURL, config.url);
        return buildURL(fullPath, config.params, config.paramsSerializer);
      }
    }

    // Provide aliases for supported request methods
    utils$1.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
      /*eslint func-names:0*/
      Axios.prototype[method] = function(url, config) {
        return this.request(mergeConfig(config || {}, {
          method,
          url,
          data: (config || {}).data
        }));
      };
    });

    utils$1.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
      /*eslint func-names:0*/

      function generateHTTPMethod(isForm) {
        return function httpMethod(url, data, config) {
          return this.request(mergeConfig(config || {}, {
            method,
            headers: isForm ? {
              'Content-Type': 'multipart/form-data'
            } : {},
            url,
            data
          }));
        };
      }

      Axios.prototype[method] = generateHTTPMethod();

      Axios.prototype[method + 'Form'] = generateHTTPMethod(true);
    });

    var Axios$1 = Axios;

    /**
     * A `CancelToken` is an object that can be used to request cancellation of an operation.
     *
     * @param {Function} executor The executor function.
     *
     * @returns {CancelToken}
     */
    class CancelToken {
      constructor(executor) {
        if (typeof executor !== 'function') {
          throw new TypeError('executor must be a function.');
        }

        let resolvePromise;

        this.promise = new Promise(function promiseExecutor(resolve) {
          resolvePromise = resolve;
        });

        const token = this;

        // eslint-disable-next-line func-names
        this.promise.then(cancel => {
          if (!token._listeners) return;

          let i = token._listeners.length;

          while (i-- > 0) {
            token._listeners[i](cancel);
          }
          token._listeners = null;
        });

        // eslint-disable-next-line func-names
        this.promise.then = onfulfilled => {
          let _resolve;
          // eslint-disable-next-line func-names
          const promise = new Promise(resolve => {
            token.subscribe(resolve);
            _resolve = resolve;
          }).then(onfulfilled);

          promise.cancel = function reject() {
            token.unsubscribe(_resolve);
          };

          return promise;
        };

        executor(function cancel(message, config, request) {
          if (token.reason) {
            // Cancellation has already been requested
            return;
          }

          token.reason = new CanceledError(message, config, request);
          resolvePromise(token.reason);
        });
      }

      /**
       * Throws a `CanceledError` if cancellation has been requested.
       */
      throwIfRequested() {
        if (this.reason) {
          throw this.reason;
        }
      }

      /**
       * Subscribe to the cancel signal
       */

      subscribe(listener) {
        if (this.reason) {
          listener(this.reason);
          return;
        }

        if (this._listeners) {
          this._listeners.push(listener);
        } else {
          this._listeners = [listener];
        }
      }

      /**
       * Unsubscribe from the cancel signal
       */

      unsubscribe(listener) {
        if (!this._listeners) {
          return;
        }
        const index = this._listeners.indexOf(listener);
        if (index !== -1) {
          this._listeners.splice(index, 1);
        }
      }

      /**
       * Returns an object that contains a new `CancelToken` and a function that, when called,
       * cancels the `CancelToken`.
       */
      static source() {
        let cancel;
        const token = new CancelToken(function executor(c) {
          cancel = c;
        });
        return {
          token,
          cancel
        };
      }
    }

    var CancelToken$1 = CancelToken;

    /**
     * Syntactic sugar for invoking a function and expanding an array for arguments.
     *
     * Common use case would be to use `Function.prototype.apply`.
     *
     *  ```js
     *  function f(x, y, z) {}
     *  var args = [1, 2, 3];
     *  f.apply(null, args);
     *  ```
     *
     * With `spread` this example can be re-written.
     *
     *  ```js
     *  spread(function(x, y, z) {})([1, 2, 3]);
     *  ```
     *
     * @param {Function} callback
     *
     * @returns {Function}
     */
    function spread(callback) {
      return function wrap(arr) {
        return callback.apply(null, arr);
      };
    }

    /**
     * Determines whether the payload is an error thrown by Axios
     *
     * @param {*} payload The value to test
     *
     * @returns {boolean} True if the payload is an error thrown by Axios, otherwise false
     */
    function isAxiosError(payload) {
      return utils$1.isObject(payload) && (payload.isAxiosError === true);
    }

    const HttpStatusCode = {
      Continue: 100,
      SwitchingProtocols: 101,
      Processing: 102,
      EarlyHints: 103,
      Ok: 200,
      Created: 201,
      Accepted: 202,
      NonAuthoritativeInformation: 203,
      NoContent: 204,
      ResetContent: 205,
      PartialContent: 206,
      MultiStatus: 207,
      AlreadyReported: 208,
      ImUsed: 226,
      MultipleChoices: 300,
      MovedPermanently: 301,
      Found: 302,
      SeeOther: 303,
      NotModified: 304,
      UseProxy: 305,
      Unused: 306,
      TemporaryRedirect: 307,
      PermanentRedirect: 308,
      BadRequest: 400,
      Unauthorized: 401,
      PaymentRequired: 402,
      Forbidden: 403,
      NotFound: 404,
      MethodNotAllowed: 405,
      NotAcceptable: 406,
      ProxyAuthenticationRequired: 407,
      RequestTimeout: 408,
      Conflict: 409,
      Gone: 410,
      LengthRequired: 411,
      PreconditionFailed: 412,
      PayloadTooLarge: 413,
      UriTooLong: 414,
      UnsupportedMediaType: 415,
      RangeNotSatisfiable: 416,
      ExpectationFailed: 417,
      ImATeapot: 418,
      MisdirectedRequest: 421,
      UnprocessableEntity: 422,
      Locked: 423,
      FailedDependency: 424,
      TooEarly: 425,
      UpgradeRequired: 426,
      PreconditionRequired: 428,
      TooManyRequests: 429,
      RequestHeaderFieldsTooLarge: 431,
      UnavailableForLegalReasons: 451,
      InternalServerError: 500,
      NotImplemented: 501,
      BadGateway: 502,
      ServiceUnavailable: 503,
      GatewayTimeout: 504,
      HttpVersionNotSupported: 505,
      VariantAlsoNegotiates: 506,
      InsufficientStorage: 507,
      LoopDetected: 508,
      NotExtended: 510,
      NetworkAuthenticationRequired: 511,
    };

    Object.entries(HttpStatusCode).forEach(([key, value]) => {
      HttpStatusCode[value] = key;
    });

    var HttpStatusCode$1 = HttpStatusCode;

    /**
     * Create an instance of Axios
     *
     * @param {Object} defaultConfig The default config for the instance
     *
     * @returns {Axios} A new instance of Axios
     */
    function createInstance(defaultConfig) {
      const context = new Axios$1(defaultConfig);
      const instance = bind(Axios$1.prototype.request, context);

      // Copy axios.prototype to instance
      utils$1.extend(instance, Axios$1.prototype, context, {allOwnKeys: true});

      // Copy context to instance
      utils$1.extend(instance, context, null, {allOwnKeys: true});

      // Factory for creating new instances
      instance.create = function create(instanceConfig) {
        return createInstance(mergeConfig(defaultConfig, instanceConfig));
      };

      return instance;
    }

    // Create the default instance to be exported
    const axios = createInstance(defaults$1);

    // Expose Axios class to allow class inheritance
    axios.Axios = Axios$1;

    // Expose Cancel & CancelToken
    axios.CanceledError = CanceledError;
    axios.CancelToken = CancelToken$1;
    axios.isCancel = isCancel;
    axios.VERSION = VERSION;
    axios.toFormData = toFormData;

    // Expose AxiosError class
    axios.AxiosError = AxiosError;

    // alias for CanceledError for backward compatibility
    axios.Cancel = axios.CanceledError;

    // Expose all/spread
    axios.all = function all(promises) {
      return Promise.all(promises);
    };

    axios.spread = spread;

    // Expose isAxiosError
    axios.isAxiosError = isAxiosError;

    // Expose mergeConfig
    axios.mergeConfig = mergeConfig;

    axios.AxiosHeaders = AxiosHeaders$1;

    axios.formToJSON = thing => formDataToJSON(utils$1.isHTMLForm(thing) ? new FormData(thing) : thing);

    axios.getAdapter = adapters.getAdapter;

    axios.HttpStatusCode = HttpStatusCode$1;

    axios.default = axios;

    // this module should only have a default export
    var axios$1 = axios;

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }
    function elasticOut(t) {
        return (Math.sin((-13.0 * (t + 1.0) * Math.PI) / 2) * Math.pow(2.0, -10.0 * t) + 1.0);
    }

    function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }
    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 } = {}) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        const [xValue, xUnit] = split_css_unit(x);
        const [yValue, yUnit] = split_css_unit(y);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * xValue}${xUnit}, ${(1 - t) * yValue}${yUnit});
			opacity: ${target_opacity - (od * u)}`
        };
    }
    function scale(node, { delay = 0, duration = 400, easing = cubicOut, start = 0, opacity = 0 } = {}) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const sd = 1 - start;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (_t, u) => `
			transform: ${transform} scale(${1 - (sd * u)});
			opacity: ${target_opacity - (od * u)}
		`
        };
    }

    /* src/components/CurrentWeather.svelte generated by Svelte v3.59.2 */
    const file$8 = "src/components/CurrentWeather.svelte";

    function create_fragment$8(ctx) {
    	let div1;
    	let h2;
    	let t0_value = /*weatherData*/ ctx[0].location.name + "";
    	let t0;
    	let t1;
    	let t2_value = /*weatherData*/ ctx[0].location.country + "";
    	let t2;
    	let h2_intro;
    	let t3;
    	let div0;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t4;
    	let span;
    	let t5;
    	let t6;
    	let div0_intro;
    	let t7;
    	let p0;
    	let t8_value = /*current*/ ctx[1].condition.text + "";
    	let t8;
    	let p0_intro;
    	let t9;
    	let p1;
    	let t10;
    	let t11;
    	let t12;
    	let p1_intro;
    	let div1_intro;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			h2 = element("h2");
    			t0 = text(t0_value);
    			t1 = text(", ");
    			t2 = text(t2_value);
    			t3 = space();
    			div0 = element("div");
    			img = element("img");
    			t4 = space();
    			span = element("span");
    			t5 = text(/*temp*/ ctx[4]);
    			t6 = text(/*unit*/ ctx[2]);
    			t7 = space();
    			p0 = element("p");
    			t8 = text(t8_value);
    			t9 = space();
    			p1 = element("p");
    			t10 = text("Feels like: ");
    			t11 = text(/*feelsLike*/ ctx[3]);
    			t12 = text(/*unit*/ ctx[2]);
    			add_location(h2, file$8, 12, 4, 408);
    			if (!src_url_equal(img.src, img_src_value = /*current*/ ctx[1].condition.icon)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*current*/ ctx[1].condition.text);
    			attr_dev(img, "class", "weather-icon svelte-fyyqfg");
    			add_location(img, file$8, 14, 6, 607);
    			attr_dev(span, "class", "temp svelte-fyyqfg");
    			add_location(span, file$8, 15, 6, 700);
    			attr_dev(div0, "class", "temperature svelte-fyyqfg");
    			add_location(div0, file$8, 13, 4, 528);
    			add_location(p0, file$8, 17, 4, 754);
    			add_location(p1, file$8, 18, 4, 836);
    			attr_dev(div1, "class", "current-weather svelte-fyyqfg");
    			add_location(div1, file$8, 11, 2, 346);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h2);
    			append_dev(h2, t0);
    			append_dev(h2, t1);
    			append_dev(h2, t2);
    			append_dev(div1, t3);
    			append_dev(div1, div0);
    			append_dev(div0, img);
    			append_dev(div0, t4);
    			append_dev(div0, span);
    			append_dev(span, t5);
    			append_dev(span, t6);
    			append_dev(div1, t7);
    			append_dev(div1, p0);
    			append_dev(p0, t8);
    			append_dev(div1, t9);
    			append_dev(div1, p1);
    			append_dev(p1, t10);
    			append_dev(p1, t11);
    			append_dev(p1, t12);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*weatherData*/ 1 && t0_value !== (t0_value = /*weatherData*/ ctx[0].location.name + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*weatherData*/ 1 && t2_value !== (t2_value = /*weatherData*/ ctx[0].location.country + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*current*/ 2 && !src_url_equal(img.src, img_src_value = /*current*/ ctx[1].condition.icon)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*current*/ 2 && img_alt_value !== (img_alt_value = /*current*/ ctx[1].condition.text)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (dirty & /*temp*/ 16) set_data_dev(t5, /*temp*/ ctx[4]);
    			if (dirty & /*unit*/ 4) set_data_dev(t6, /*unit*/ ctx[2]);
    			if (dirty & /*current*/ 2 && t8_value !== (t8_value = /*current*/ ctx[1].condition.text + "")) set_data_dev(t8, t8_value);
    			if (dirty & /*feelsLike*/ 8) set_data_dev(t11, /*feelsLike*/ ctx[3]);
    			if (dirty & /*unit*/ 4) set_data_dev(t12, /*unit*/ ctx[2]);
    		},
    		i: function intro(local) {
    			if (!h2_intro) {
    				add_render_callback(() => {
    					h2_intro = create_in_transition(h2, fly, { y: -20, duration: 500, delay: 200 });
    					h2_intro.start();
    				});
    			}

    			if (!div0_intro) {
    				add_render_callback(() => {
    					div0_intro = create_in_transition(div0, fly, { x: -20, duration: 500, delay: 400 });
    					div0_intro.start();
    				});
    			}

    			if (!p0_intro) {
    				add_render_callback(() => {
    					p0_intro = create_in_transition(p0, fly, { y: 20, duration: 500, delay: 600 });
    					p0_intro.start();
    				});
    			}

    			if (!p1_intro) {
    				add_render_callback(() => {
    					p1_intro = create_in_transition(p1, fly, { y: 20, duration: 500, delay: 800 });
    					p1_intro.start();
    				});
    			}

    			if (!div1_intro) {
    				add_render_callback(() => {
    					div1_intro = create_in_transition(div1, fade, { duration: 500 });
    					div1_intro.start();
    				});
    			}
    		},
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let current;
    	let temp;
    	let feelsLike;
    	let unit;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('CurrentWeather', slots, []);
    	let { weatherData } = $$props;
    	let { useMetric } = $$props;

    	$$self.$$.on_mount.push(function () {
    		if (weatherData === undefined && !('weatherData' in $$props || $$self.$$.bound[$$self.$$.props['weatherData']])) {
    			console.warn("<CurrentWeather> was created without expected prop 'weatherData'");
    		}

    		if (useMetric === undefined && !('useMetric' in $$props || $$self.$$.bound[$$self.$$.props['useMetric']])) {
    			console.warn("<CurrentWeather> was created without expected prop 'useMetric'");
    		}
    	});

    	const writable_props = ['weatherData', 'useMetric'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<CurrentWeather> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('weatherData' in $$props) $$invalidate(0, weatherData = $$props.weatherData);
    		if ('useMetric' in $$props) $$invalidate(5, useMetric = $$props.useMetric);
    	};

    	$$self.$capture_state = () => ({
    		fade,
    		fly,
    		weatherData,
    		useMetric,
    		unit,
    		current,
    		feelsLike,
    		temp
    	});

    	$$self.$inject_state = $$props => {
    		if ('weatherData' in $$props) $$invalidate(0, weatherData = $$props.weatherData);
    		if ('useMetric' in $$props) $$invalidate(5, useMetric = $$props.useMetric);
    		if ('unit' in $$props) $$invalidate(2, unit = $$props.unit);
    		if ('current' in $$props) $$invalidate(1, current = $$props.current);
    		if ('feelsLike' in $$props) $$invalidate(3, feelsLike = $$props.feelsLike);
    		if ('temp' in $$props) $$invalidate(4, temp = $$props.temp);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*weatherData*/ 1) {
    			$$invalidate(1, current = weatherData.current);
    		}

    		if ($$self.$$.dirty & /*useMetric, current*/ 34) {
    			$$invalidate(4, temp = useMetric ? current.temp_c : current.temp_f);
    		}

    		if ($$self.$$.dirty & /*useMetric, current*/ 34) {
    			$$invalidate(3, feelsLike = useMetric ? current.feelslike_c : current.feelslike_f);
    		}

    		if ($$self.$$.dirty & /*useMetric*/ 32) {
    			$$invalidate(2, unit = useMetric ? '°C' : '°F');
    		}
    	};

    	return [weatherData, current, unit, feelsLike, temp, useMetric];
    }

    class CurrentWeather extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { weatherData: 0, useMetric: 5 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CurrentWeather",
    			options,
    			id: create_fragment$8.name
    		});
    	}

    	get weatherData() {
    		throw new Error("<CurrentWeather>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set weatherData(value) {
    		throw new Error("<CurrentWeather>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get useMetric() {
    		throw new Error("<CurrentWeather>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set useMetric(value) {
    		throw new Error("<CurrentWeather>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/AirQuality.svelte generated by Svelte v3.59.2 */

    const file$7 = "src/components/AirQuality.svelte";

    function create_fragment$7(ctx) {
    	let div;
    	let h3;
    	let t1;
    	let p0;
    	let t2;
    	let t3_value = Math.round(/*aqi*/ ctx[0]['us-epa-index']) + "";
    	let t3;
    	let t4;
    	let p1;
    	let t5;
    	let t6_value = /*getAQILevel*/ ctx[1](/*aqi*/ ctx[0]['us-epa-index']) + "";
    	let t6;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h3 = element("h3");
    			h3.textContent = "Air Quality";
    			t1 = space();
    			p0 = element("p");
    			t2 = text("AQI: ");
    			t3 = text(t3_value);
    			t4 = space();
    			p1 = element("p");
    			t5 = text("Level: ");
    			t6 = text(t6_value);
    			add_location(h3, file$7, 16, 4, 431);
    			add_location(p0, file$7, 17, 4, 456);
    			add_location(p1, file$7, 18, 4, 506);
    			attr_dev(div, "class", "air-quality svelte-1uykrqv");
    			add_location(div, file$7, 15, 2, 401);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h3);
    			append_dev(div, t1);
    			append_dev(div, p0);
    			append_dev(p0, t2);
    			append_dev(p0, t3);
    			append_dev(div, t4);
    			append_dev(div, p1);
    			append_dev(p1, t5);
    			append_dev(p1, t6);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*aqi*/ 1 && t3_value !== (t3_value = Math.round(/*aqi*/ ctx[0]['us-epa-index']) + "")) set_data_dev(t3, t3_value);
    			if (dirty & /*aqi*/ 1 && t6_value !== (t6_value = /*getAQILevel*/ ctx[1](/*aqi*/ ctx[0]['us-epa-index']) + "")) set_data_dev(t6, t6_value);
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let aqi;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('AirQuality', slots, []);
    	let { weatherData } = $$props;

    	function getAQILevel(aqi) {
    		if (aqi <= 50) return 'Good';
    		if (aqi <= 100) return 'Moderate';
    		if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
    		if (aqi <= 200) return 'Unhealthy';
    		if (aqi <= 300) return 'Very Unhealthy';
    		return 'Hazardous';
    	}

    	$$self.$$.on_mount.push(function () {
    		if (weatherData === undefined && !('weatherData' in $$props || $$self.$$.bound[$$self.$$.props['weatherData']])) {
    			console.warn("<AirQuality> was created without expected prop 'weatherData'");
    		}
    	});

    	const writable_props = ['weatherData'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<AirQuality> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('weatherData' in $$props) $$invalidate(2, weatherData = $$props.weatherData);
    	};

    	$$self.$capture_state = () => ({ weatherData, getAQILevel, aqi });

    	$$self.$inject_state = $$props => {
    		if ('weatherData' in $$props) $$invalidate(2, weatherData = $$props.weatherData);
    		if ('aqi' in $$props) $$invalidate(0, aqi = $$props.aqi);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*weatherData*/ 4) {
    			$$invalidate(0, aqi = weatherData.current.air_quality);
    		}
    	};

    	return [aqi, getAQILevel, weatherData];
    }

    class AirQuality extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { weatherData: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AirQuality",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get weatherData() {
    		throw new Error("<AirQuality>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set weatherData(value) {
    		throw new Error("<AirQuality>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/FiveDayForecast.svelte generated by Svelte v3.59.2 */

    const file$6 = "src/components/FiveDayForecast.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (10:6) {#each forecast as day}
    function create_each_block$3(ctx) {
    	let div;
    	let p0;
    	let t0_value = new Date(/*day*/ ctx[2].date).toLocaleDateString('en-US', { weekday: 'short' }) + "";
    	let t0;
    	let t1;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t2;
    	let p1;
    	let t3_value = /*day*/ ctx[2].day.avgtemp_c + "";
    	let t3;
    	let t4;
    	let t5;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p0 = element("p");
    			t0 = text(t0_value);
    			t1 = space();
    			img = element("img");
    			t2 = space();
    			p1 = element("p");
    			t3 = text(t3_value);
    			t4 = text("°C");
    			t5 = space();
    			add_location(p0, file$6, 11, 10, 283);
    			if (!src_url_equal(img.src, img_src_value = /*day*/ ctx[2].day.condition.icon)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*day*/ ctx[2].day.condition.text);
    			attr_dev(img, "class", "svelte-5oddam");
    			add_location(img, file$6, 12, 10, 371);
    			add_location(p1, file$6, 13, 10, 447);
    			attr_dev(div, "class", "forecast-day svelte-5oddam");
    			add_location(div, file$6, 10, 8, 246);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p0);
    			append_dev(p0, t0);
    			append_dev(div, t1);
    			append_dev(div, img);
    			append_dev(div, t2);
    			append_dev(div, p1);
    			append_dev(p1, t3);
    			append_dev(p1, t4);
    			append_dev(div, t5);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*forecast*/ 1 && t0_value !== (t0_value = new Date(/*day*/ ctx[2].date).toLocaleDateString('en-US', { weekday: 'short' }) + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*forecast*/ 1 && !src_url_equal(img.src, img_src_value = /*day*/ ctx[2].day.condition.icon)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*forecast*/ 1 && img_alt_value !== (img_alt_value = /*day*/ ctx[2].day.condition.text)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (dirty & /*forecast*/ 1 && t3_value !== (t3_value = /*day*/ ctx[2].day.avgtemp_c + "")) set_data_dev(t3, t3_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(10:6) {#each forecast as day}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let div1;
    	let h3;
    	let t1;
    	let div0;
    	let each_value = /*forecast*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			h3 = element("h3");
    			h3.textContent = "5-Day Forecast";
    			t1 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(h3, file$6, 7, 4, 147);
    			attr_dev(div0, "class", "forecast-container svelte-5oddam");
    			add_location(div0, file$6, 8, 4, 175);
    			attr_dev(div1, "class", "five-day-forecast svelte-5oddam");
    			add_location(div1, file$6, 6, 2, 111);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h3);
    			append_dev(div1, t1);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div0, null);
    				}
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*forecast, Date*/ 1) {
    				each_value = /*forecast*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let forecast;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('FiveDayForecast', slots, []);
    	let { weatherData } = $$props;

    	$$self.$$.on_mount.push(function () {
    		if (weatherData === undefined && !('weatherData' in $$props || $$self.$$.bound[$$self.$$.props['weatherData']])) {
    			console.warn("<FiveDayForecast> was created without expected prop 'weatherData'");
    		}
    	});

    	const writable_props = ['weatherData'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<FiveDayForecast> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('weatherData' in $$props) $$invalidate(1, weatherData = $$props.weatherData);
    	};

    	$$self.$capture_state = () => ({ weatherData, forecast });

    	$$self.$inject_state = $$props => {
    		if ('weatherData' in $$props) $$invalidate(1, weatherData = $$props.weatherData);
    		if ('forecast' in $$props) $$invalidate(0, forecast = $$props.forecast);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*weatherData*/ 2) {
    			$$invalidate(0, forecast = weatherData.forecast.forecastday);
    		}
    	};

    	return [forecast, weatherData];
    }

    class FiveDayForecast extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { weatherData: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FiveDayForecast",
    			options,
    			id: create_fragment$6.name
    		});
    	}

    	get weatherData() {
    		throw new Error("<FiveDayForecast>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set weatherData(value) {
    		throw new Error("<FiveDayForecast>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/HourlyForecast.svelte generated by Svelte v3.59.2 */

    const file$5 = "src/components/HourlyForecast.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (15:10) {#if hour.chance_of_rain > 0}
    function create_if_block$1(ctx) {
    	let p;
    	let t0_value = /*hour*/ ctx[2].chance_of_rain + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text(t0_value);
    			t1 = text("% 🌧️");
    			add_location(p, file$5, 15, 12, 537);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*hourlyForecast*/ 1 && t0_value !== (t0_value = /*hour*/ ctx[2].chance_of_rain + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(15:10) {#if hour.chance_of_rain > 0}",
    		ctx
    	});

    	return block;
    }

    // (10:6) {#each hourlyForecast as hour}
    function create_each_block$2(ctx) {
    	let div;
    	let p0;
    	let t0_value = new Date(/*hour*/ ctx[2].time).toLocaleTimeString('en-US', { hour: 'numeric' }) + "";
    	let t0;
    	let t1;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t2;
    	let p1;
    	let t3_value = /*hour*/ ctx[2].temp_c + "";
    	let t3;
    	let t4;
    	let t5;
    	let t6;
    	let if_block = /*hour*/ ctx[2].chance_of_rain > 0 && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			p0 = element("p");
    			t0 = text(t0_value);
    			t1 = space();
    			img = element("img");
    			t2 = space();
    			p1 = element("p");
    			t3 = text(t3_value);
    			t4 = text("°C");
    			t5 = space();
    			if (if_block) if_block.c();
    			t6 = space();
    			add_location(p0, file$5, 11, 10, 304);
    			if (!src_url_equal(img.src, img_src_value = /*hour*/ ctx[2].condition.icon)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*hour*/ ctx[2].condition.text);
    			attr_dev(img, "class", "svelte-3iqnue");
    			add_location(img, file$5, 12, 10, 392);
    			add_location(p1, file$5, 13, 10, 462);
    			attr_dev(div, "class", "forecast-hour svelte-3iqnue");
    			add_location(div, file$5, 10, 8, 266);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p0);
    			append_dev(p0, t0);
    			append_dev(div, t1);
    			append_dev(div, img);
    			append_dev(div, t2);
    			append_dev(div, p1);
    			append_dev(p1, t3);
    			append_dev(p1, t4);
    			append_dev(div, t5);
    			if (if_block) if_block.m(div, null);
    			append_dev(div, t6);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*hourlyForecast*/ 1 && t0_value !== (t0_value = new Date(/*hour*/ ctx[2].time).toLocaleTimeString('en-US', { hour: 'numeric' }) + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*hourlyForecast*/ 1 && !src_url_equal(img.src, img_src_value = /*hour*/ ctx[2].condition.icon)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*hourlyForecast*/ 1 && img_alt_value !== (img_alt_value = /*hour*/ ctx[2].condition.text)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (dirty & /*hourlyForecast*/ 1 && t3_value !== (t3_value = /*hour*/ ctx[2].temp_c + "")) set_data_dev(t3, t3_value);

    			if (/*hour*/ ctx[2].chance_of_rain > 0) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(div, t6);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(10:6) {#each hourlyForecast as hour}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div1;
    	let h3;
    	let t1;
    	let div0;
    	let each_value = /*hourlyForecast*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			h3 = element("h3");
    			h3.textContent = "Hourly Forecast";
    			t1 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(h3, file$5, 7, 4, 159);
    			attr_dev(div0, "class", "forecast-container svelte-3iqnue");
    			add_location(div0, file$5, 8, 4, 188);
    			attr_dev(div1, "class", "hourly-forecast svelte-3iqnue");
    			add_location(div1, file$5, 6, 2, 125);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h3);
    			append_dev(div1, t1);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div0, null);
    				}
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*hourlyForecast, Date*/ 1) {
    				each_value = /*hourlyForecast*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let hourlyForecast;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('HourlyForecast', slots, []);
    	let { weatherData } = $$props;

    	$$self.$$.on_mount.push(function () {
    		if (weatherData === undefined && !('weatherData' in $$props || $$self.$$.bound[$$self.$$.props['weatherData']])) {
    			console.warn("<HourlyForecast> was created without expected prop 'weatherData'");
    		}
    	});

    	const writable_props = ['weatherData'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<HourlyForecast> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('weatherData' in $$props) $$invalidate(1, weatherData = $$props.weatherData);
    	};

    	$$self.$capture_state = () => ({ weatherData, hourlyForecast });

    	$$self.$inject_state = $$props => {
    		if ('weatherData' in $$props) $$invalidate(1, weatherData = $$props.weatherData);
    		if ('hourlyForecast' in $$props) $$invalidate(0, hourlyForecast = $$props.hourlyForecast);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*weatherData*/ 2) {
    			$$invalidate(0, hourlyForecast = weatherData.forecast.forecastday[0].hour);
    		}
    	};

    	return [hourlyForecast, weatherData];
    }

    class HourlyForecast extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { weatherData: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "HourlyForecast",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get weatherData() {
    		throw new Error("<HourlyForecast>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set weatherData(value) {
    		throw new Error("<HourlyForecast>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/WeatherDetails.svelte generated by Svelte v3.59.2 */

    const file$4 = "src/components/WeatherDetails.svelte";

    function create_fragment$4(ctx) {
    	let div6;
    	let h3;
    	let t1;
    	let div5;
    	let div0;
    	let span0;
    	let t3;
    	let p0;
    	let t4;
    	let t5_value = /*current*/ ctx[0].wind_kph + "";
    	let t5;
    	let t6;
    	let t7_value = /*current*/ ctx[0].wind_dir + "";
    	let t7;
    	let t8;
    	let div1;
    	let span1;
    	let t10;
    	let p1;
    	let t11;
    	let t12_value = /*current*/ ctx[0].humidity + "";
    	let t12;
    	let t13;
    	let t14;
    	let div2;
    	let span2;
    	let t16;
    	let p2;
    	let t17;
    	let t18_value = /*current*/ ctx[0].uv + "";
    	let t18;
    	let t19;
    	let div3;
    	let span3;
    	let t21;
    	let p3;
    	let t22;
    	let t23_value = /*current*/ ctx[0].vis_km + "";
    	let t23;
    	let t24;
    	let t25;
    	let div4;
    	let span4;
    	let t27;
    	let p4;
    	let t28;
    	let t29_value = /*current*/ ctx[0].pressure_mb + "";
    	let t29;
    	let t30;

    	const block = {
    		c: function create() {
    			div6 = element("div");
    			h3 = element("h3");
    			h3.textContent = "Weather Details";
    			t1 = space();
    			div5 = element("div");
    			div0 = element("div");
    			span0 = element("span");
    			span0.textContent = "💨";
    			t3 = space();
    			p0 = element("p");
    			t4 = text("Wind: ");
    			t5 = text(t5_value);
    			t6 = text(" km/h ");
    			t7 = text(t7_value);
    			t8 = space();
    			div1 = element("div");
    			span1 = element("span");
    			span1.textContent = "💧";
    			t10 = space();
    			p1 = element("p");
    			t11 = text("Humidity: ");
    			t12 = text(t12_value);
    			t13 = text("%");
    			t14 = space();
    			div2 = element("div");
    			span2 = element("span");
    			span2.textContent = "☀️";
    			t16 = space();
    			p2 = element("p");
    			t17 = text("UV Index: ");
    			t18 = text(t18_value);
    			t19 = space();
    			div3 = element("div");
    			span3 = element("span");
    			span3.textContent = "👁️";
    			t21 = space();
    			p3 = element("p");
    			t22 = text("Visibility: ");
    			t23 = text(t23_value);
    			t24 = text(" km");
    			t25 = space();
    			div4 = element("div");
    			span4 = element("span");
    			span4.textContent = "🌡️";
    			t27 = space();
    			p4 = element("p");
    			t28 = text("Pressure: ");
    			t29 = text(t29_value);
    			t30 = text(" mb");
    			add_location(h3, file$4, 7, 4, 131);
    			attr_dev(span0, "class", "icon svelte-18t6jpj");
    			add_location(span0, file$4, 10, 8, 222);
    			add_location(p0, file$4, 11, 8, 259);
    			attr_dev(div0, "class", "detail svelte-18t6jpj");
    			add_location(div0, file$4, 9, 6, 193);
    			attr_dev(span1, "class", "icon svelte-18t6jpj");
    			add_location(span1, file$4, 14, 8, 363);
    			add_location(p1, file$4, 15, 8, 400);
    			attr_dev(div1, "class", "detail svelte-18t6jpj");
    			add_location(div1, file$4, 13, 6, 334);
    			attr_dev(span2, "class", "icon svelte-18t6jpj");
    			add_location(span2, file$4, 18, 8, 485);
    			add_location(p2, file$4, 19, 8, 522);
    			attr_dev(div2, "class", "detail svelte-18t6jpj");
    			add_location(div2, file$4, 17, 6, 456);
    			attr_dev(span3, "class", "icon svelte-18t6jpj");
    			add_location(span3, file$4, 22, 8, 600);
    			add_location(p3, file$4, 23, 8, 638);
    			attr_dev(div3, "class", "detail svelte-18t6jpj");
    			add_location(div3, file$4, 21, 6, 571);
    			attr_dev(span4, "class", "icon svelte-18t6jpj");
    			add_location(span4, file$4, 26, 8, 725);
    			add_location(p4, file$4, 27, 8, 763);
    			attr_dev(div4, "class", "detail svelte-18t6jpj");
    			add_location(div4, file$4, 25, 6, 696);
    			attr_dev(div5, "class", "details-grid svelte-18t6jpj");
    			add_location(div5, file$4, 8, 4, 160);
    			attr_dev(div6, "class", "weather-details svelte-18t6jpj");
    			add_location(div6, file$4, 6, 2, 97);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div6, anchor);
    			append_dev(div6, h3);
    			append_dev(div6, t1);
    			append_dev(div6, div5);
    			append_dev(div5, div0);
    			append_dev(div0, span0);
    			append_dev(div0, t3);
    			append_dev(div0, p0);
    			append_dev(p0, t4);
    			append_dev(p0, t5);
    			append_dev(p0, t6);
    			append_dev(p0, t7);
    			append_dev(div5, t8);
    			append_dev(div5, div1);
    			append_dev(div1, span1);
    			append_dev(div1, t10);
    			append_dev(div1, p1);
    			append_dev(p1, t11);
    			append_dev(p1, t12);
    			append_dev(p1, t13);
    			append_dev(div5, t14);
    			append_dev(div5, div2);
    			append_dev(div2, span2);
    			append_dev(div2, t16);
    			append_dev(div2, p2);
    			append_dev(p2, t17);
    			append_dev(p2, t18);
    			append_dev(div5, t19);
    			append_dev(div5, div3);
    			append_dev(div3, span3);
    			append_dev(div3, t21);
    			append_dev(div3, p3);
    			append_dev(p3, t22);
    			append_dev(p3, t23);
    			append_dev(p3, t24);
    			append_dev(div5, t25);
    			append_dev(div5, div4);
    			append_dev(div4, span4);
    			append_dev(div4, t27);
    			append_dev(div4, p4);
    			append_dev(p4, t28);
    			append_dev(p4, t29);
    			append_dev(p4, t30);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*current*/ 1 && t5_value !== (t5_value = /*current*/ ctx[0].wind_kph + "")) set_data_dev(t5, t5_value);
    			if (dirty & /*current*/ 1 && t7_value !== (t7_value = /*current*/ ctx[0].wind_dir + "")) set_data_dev(t7, t7_value);
    			if (dirty & /*current*/ 1 && t12_value !== (t12_value = /*current*/ ctx[0].humidity + "")) set_data_dev(t12, t12_value);
    			if (dirty & /*current*/ 1 && t18_value !== (t18_value = /*current*/ ctx[0].uv + "")) set_data_dev(t18, t18_value);
    			if (dirty & /*current*/ 1 && t23_value !== (t23_value = /*current*/ ctx[0].vis_km + "")) set_data_dev(t23, t23_value);
    			if (dirty & /*current*/ 1 && t29_value !== (t29_value = /*current*/ ctx[0].pressure_mb + "")) set_data_dev(t29, t29_value);
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div6);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let current;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('WeatherDetails', slots, []);
    	let { weatherData } = $$props;

    	$$self.$$.on_mount.push(function () {
    		if (weatherData === undefined && !('weatherData' in $$props || $$self.$$.bound[$$self.$$.props['weatherData']])) {
    			console.warn("<WeatherDetails> was created without expected prop 'weatherData'");
    		}
    	});

    	const writable_props = ['weatherData'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<WeatherDetails> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('weatherData' in $$props) $$invalidate(1, weatherData = $$props.weatherData);
    	};

    	$$self.$capture_state = () => ({ weatherData, current });

    	$$self.$inject_state = $$props => {
    		if ('weatherData' in $$props) $$invalidate(1, weatherData = $$props.weatherData);
    		if ('current' in $$props) $$invalidate(0, current = $$props.current);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*weatherData*/ 2) {
    			$$invalidate(0, current = weatherData.current);
    		}
    	};

    	return [current, weatherData];
    }

    class WeatherDetails extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { weatherData: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "WeatherDetails",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get weatherData() {
    		throw new Error("<WeatherDetails>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set weatherData(value) {
    		throw new Error("<WeatherDetails>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/SunriseSunset.svelte generated by Svelte v3.59.2 */

    const file$3 = "src/components/SunriseSunset.svelte";

    function create_fragment$3(ctx) {
    	let div3;
    	let h3;
    	let t1;
    	let div2;
    	let div0;
    	let span0;
    	let t3;
    	let p0;
    	let t4;
    	let t5_value = /*astronomy*/ ctx[0].sunrise + "";
    	let t5;
    	let t6;
    	let div1;
    	let span1;
    	let t8;
    	let p1;
    	let t9;
    	let t10_value = /*astronomy*/ ctx[0].sunset + "";
    	let t10;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			h3 = element("h3");
    			h3.textContent = "Sunrise & Sunset";
    			t1 = space();
    			div2 = element("div");
    			div0 = element("div");
    			span0 = element("span");
    			span0.textContent = "🌅";
    			t3 = space();
    			p0 = element("p");
    			t4 = text("Sunrise: ");
    			t5 = text(t5_value);
    			t6 = space();
    			div1 = element("div");
    			span1 = element("span");
    			span1.textContent = "🌇";
    			t8 = space();
    			p1 = element("p");
    			t9 = text("Sunset: ");
    			t10 = text(t10_value);
    			add_location(h3, file$3, 7, 4, 154);
    			attr_dev(span0, "class", "icon svelte-xkakrj");
    			add_location(span0, file$3, 10, 8, 246);
    			add_location(p0, file$3, 11, 8, 283);
    			attr_dev(div0, "class", "sun-event svelte-xkakrj");
    			add_location(div0, file$3, 9, 6, 214);
    			attr_dev(span1, "class", "icon svelte-xkakrj");
    			add_location(span1, file$3, 14, 8, 370);
    			add_location(p1, file$3, 15, 8, 407);
    			attr_dev(div1, "class", "sun-event svelte-xkakrj");
    			add_location(div1, file$3, 13, 6, 338);
    			attr_dev(div2, "class", "sun-times svelte-xkakrj");
    			add_location(div2, file$3, 8, 4, 184);
    			attr_dev(div3, "class", "sunrise-sunset svelte-xkakrj");
    			add_location(div3, file$3, 6, 2, 121);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, h3);
    			append_dev(div3, t1);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			append_dev(div0, span0);
    			append_dev(div0, t3);
    			append_dev(div0, p0);
    			append_dev(p0, t4);
    			append_dev(p0, t5);
    			append_dev(div2, t6);
    			append_dev(div2, div1);
    			append_dev(div1, span1);
    			append_dev(div1, t8);
    			append_dev(div1, p1);
    			append_dev(p1, t9);
    			append_dev(p1, t10);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*astronomy*/ 1 && t5_value !== (t5_value = /*astronomy*/ ctx[0].sunrise + "")) set_data_dev(t5, t5_value);
    			if (dirty & /*astronomy*/ 1 && t10_value !== (t10_value = /*astronomy*/ ctx[0].sunset + "")) set_data_dev(t10, t10_value);
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let astronomy;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('SunriseSunset', slots, []);
    	let { weatherData } = $$props;

    	$$self.$$.on_mount.push(function () {
    		if (weatherData === undefined && !('weatherData' in $$props || $$self.$$.bound[$$self.$$.props['weatherData']])) {
    			console.warn("<SunriseSunset> was created without expected prop 'weatherData'");
    		}
    	});

    	const writable_props = ['weatherData'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<SunriseSunset> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('weatherData' in $$props) $$invalidate(1, weatherData = $$props.weatherData);
    	};

    	$$self.$capture_state = () => ({ weatherData, astronomy });

    	$$self.$inject_state = $$props => {
    		if ('weatherData' in $$props) $$invalidate(1, weatherData = $$props.weatherData);
    		if ('astronomy' in $$props) $$invalidate(0, astronomy = $$props.astronomy);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*weatherData*/ 2) {
    			$$invalidate(0, astronomy = weatherData.forecast.forecastday[0].astro);
    		}
    	};

    	return [astronomy, weatherData];
    }

    class SunriseSunset extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { weatherData: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SunriseSunset",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get weatherData() {
    		throw new Error("<SunriseSunset>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set weatherData(value) {
    		throw new Error("<SunriseSunset>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Pollution.svelte generated by Svelte v3.59.2 */

    const file$2 = "src/components/Pollution.svelte";

    function create_fragment$2(ctx) {
    	let div7;
    	let h3;
    	let t1;
    	let div6;
    	let div0;
    	let p0;
    	let t2;
    	let t3_value = /*aqi*/ ctx[0].co.toFixed(2) + "";
    	let t3;
    	let t4;
    	let t5;
    	let div1;
    	let p1;
    	let t6;
    	let t7_value = /*aqi*/ ctx[0].no2.toFixed(2) + "";
    	let t7;
    	let t8;
    	let t9;
    	let div2;
    	let p2;
    	let t10;
    	let t11_value = /*aqi*/ ctx[0].o3.toFixed(2) + "";
    	let t11;
    	let t12;
    	let t13;
    	let div3;
    	let p3;
    	let t14;
    	let t15_value = /*aqi*/ ctx[0].pm2_5.toFixed(2) + "";
    	let t15;
    	let t16;
    	let t17;
    	let div4;
    	let p4;
    	let t18;
    	let t19_value = /*aqi*/ ctx[0].pm10.toFixed(2) + "";
    	let t19;
    	let t20;
    	let t21;
    	let div5;
    	let p5;
    	let t22;
    	let t23_value = /*aqi*/ ctx[0].so2.toFixed(2) + "";
    	let t23;
    	let t24;

    	const block = {
    		c: function create() {
    			div7 = element("div");
    			h3 = element("h3");
    			h3.textContent = "Pollution Levels";
    			t1 = space();
    			div6 = element("div");
    			div0 = element("div");
    			p0 = element("p");
    			t2 = text("CO: ");
    			t3 = text(t3_value);
    			t4 = text(" μg/m³");
    			t5 = space();
    			div1 = element("div");
    			p1 = element("p");
    			t6 = text("NO2: ");
    			t7 = text(t7_value);
    			t8 = text(" μg/m³");
    			t9 = space();
    			div2 = element("div");
    			p2 = element("p");
    			t10 = text("O3: ");
    			t11 = text(t11_value);
    			t12 = text(" μg/m³");
    			t13 = space();
    			div3 = element("div");
    			p3 = element("p");
    			t14 = text("PM2.5: ");
    			t15 = text(t15_value);
    			t16 = text(" μg/m³");
    			t17 = space();
    			div4 = element("div");
    			p4 = element("p");
    			t18 = text("PM10: ");
    			t19 = text(t19_value);
    			t20 = text(" μg/m³");
    			t21 = space();
    			div5 = element("div");
    			p5 = element("p");
    			t22 = text("SO2: ");
    			t23 = text(t23_value);
    			t24 = text(" μg/m³");
    			add_location(h3, file$2, 7, 4, 133);
    			add_location(p0, file$2, 10, 8, 230);
    			attr_dev(div0, "class", "pollutant svelte-vrlzxv");
    			add_location(div0, file$2, 9, 6, 198);
    			add_location(p1, file$2, 13, 8, 318);
    			attr_dev(div1, "class", "pollutant svelte-vrlzxv");
    			add_location(div1, file$2, 12, 6, 286);
    			add_location(p2, file$2, 16, 8, 408);
    			attr_dev(div2, "class", "pollutant svelte-vrlzxv");
    			add_location(div2, file$2, 15, 6, 376);
    			add_location(p3, file$2, 19, 8, 496);
    			attr_dev(div3, "class", "pollutant svelte-vrlzxv");
    			add_location(div3, file$2, 18, 6, 464);
    			add_location(p4, file$2, 22, 8, 590);
    			attr_dev(div4, "class", "pollutant svelte-vrlzxv");
    			add_location(div4, file$2, 21, 6, 558);
    			add_location(p5, file$2, 25, 8, 682);
    			attr_dev(div5, "class", "pollutant svelte-vrlzxv");
    			add_location(div5, file$2, 24, 6, 650);
    			attr_dev(div6, "class", "pollution-grid svelte-vrlzxv");
    			add_location(div6, file$2, 8, 4, 163);
    			attr_dev(div7, "class", "pollution svelte-vrlzxv");
    			add_location(div7, file$2, 6, 2, 105);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div7, anchor);
    			append_dev(div7, h3);
    			append_dev(div7, t1);
    			append_dev(div7, div6);
    			append_dev(div6, div0);
    			append_dev(div0, p0);
    			append_dev(p0, t2);
    			append_dev(p0, t3);
    			append_dev(p0, t4);
    			append_dev(div6, t5);
    			append_dev(div6, div1);
    			append_dev(div1, p1);
    			append_dev(p1, t6);
    			append_dev(p1, t7);
    			append_dev(p1, t8);
    			append_dev(div6, t9);
    			append_dev(div6, div2);
    			append_dev(div2, p2);
    			append_dev(p2, t10);
    			append_dev(p2, t11);
    			append_dev(p2, t12);
    			append_dev(div6, t13);
    			append_dev(div6, div3);
    			append_dev(div3, p3);
    			append_dev(p3, t14);
    			append_dev(p3, t15);
    			append_dev(p3, t16);
    			append_dev(div6, t17);
    			append_dev(div6, div4);
    			append_dev(div4, p4);
    			append_dev(p4, t18);
    			append_dev(p4, t19);
    			append_dev(p4, t20);
    			append_dev(div6, t21);
    			append_dev(div6, div5);
    			append_dev(div5, p5);
    			append_dev(p5, t22);
    			append_dev(p5, t23);
    			append_dev(p5, t24);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*aqi*/ 1 && t3_value !== (t3_value = /*aqi*/ ctx[0].co.toFixed(2) + "")) set_data_dev(t3, t3_value);
    			if (dirty & /*aqi*/ 1 && t7_value !== (t7_value = /*aqi*/ ctx[0].no2.toFixed(2) + "")) set_data_dev(t7, t7_value);
    			if (dirty & /*aqi*/ 1 && t11_value !== (t11_value = /*aqi*/ ctx[0].o3.toFixed(2) + "")) set_data_dev(t11, t11_value);
    			if (dirty & /*aqi*/ 1 && t15_value !== (t15_value = /*aqi*/ ctx[0].pm2_5.toFixed(2) + "")) set_data_dev(t15, t15_value);
    			if (dirty & /*aqi*/ 1 && t19_value !== (t19_value = /*aqi*/ ctx[0].pm10.toFixed(2) + "")) set_data_dev(t19, t19_value);
    			if (dirty & /*aqi*/ 1 && t23_value !== (t23_value = /*aqi*/ ctx[0].so2.toFixed(2) + "")) set_data_dev(t23, t23_value);
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div7);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let aqi;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Pollution', slots, []);
    	let { weatherData } = $$props;

    	$$self.$$.on_mount.push(function () {
    		if (weatherData === undefined && !('weatherData' in $$props || $$self.$$.bound[$$self.$$.props['weatherData']])) {
    			console.warn("<Pollution> was created without expected prop 'weatherData'");
    		}
    	});

    	const writable_props = ['weatherData'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Pollution> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('weatherData' in $$props) $$invalidate(1, weatherData = $$props.weatherData);
    	};

    	$$self.$capture_state = () => ({ weatherData, aqi });

    	$$self.$inject_state = $$props => {
    		if ('weatherData' in $$props) $$invalidate(1, weatherData = $$props.weatherData);
    		if ('aqi' in $$props) $$invalidate(0, aqi = $$props.aqi);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*weatherData*/ 2) {
    			$$invalidate(0, aqi = weatherData.current.air_quality);
    		}
    	};

    	return [aqi, weatherData];
    }

    class Pollution extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { weatherData: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Pollution",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get weatherData() {
    		throw new Error("<Pollution>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set weatherData(value) {
    		throw new Error("<Pollution>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/LifestyleTips.svelte generated by Svelte v3.59.2 */

    const file$1 = "src/components/LifestyleTips.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (36:6) {#each lifestyleTips as tip}
    function create_each_block$1(ctx) {
    	let li;
    	let t_value = /*tip*/ ctx[3] + "";
    	let t;

    	const block = {
    		c: function create() {
    			li = element("li");
    			t = text(t_value);
    			attr_dev(li, "class", "svelte-17w2t2q");
    			add_location(li, file$1, 36, 8, 858);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*lifestyleTips*/ 1 && t_value !== (t_value = /*tip*/ ctx[3] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(36:6) {#each lifestyleTips as tip}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div;
    	let h3;
    	let t1;
    	let ul;
    	let each_value = /*lifestyleTips*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			h3 = element("h3");
    			h3.textContent = "Lifestyle Tips";
    			t1 = space();
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(h3, file$1, 33, 4, 782);
    			attr_dev(ul, "class", "svelte-17w2t2q");
    			add_location(ul, file$1, 34, 4, 810);
    			attr_dev(div, "class", "lifestyle-tips svelte-17w2t2q");
    			add_location(div, file$1, 32, 2, 749);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h3);
    			append_dev(div, t1);
    			append_dev(div, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(ul, null);
    				}
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*lifestyleTips*/ 1) {
    				each_value = /*lifestyleTips*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function getLifestyleTips(weather) {
    	let tips = [];

    	if (weather.temp_c > 30) {
    		tips.push("Stay hydrated and seek shade");
    	} else if (weather.temp_c < 10) {
    		tips.push("Dress warmly in layers");
    	}

    	if (weather.precip_mm > 0) {
    		tips.push("Carry an umbrella");
    	}

    	if (weather.uv > 7) {
    		tips.push("Use sunscreen and wear protective clothing");
    	}

    	if (weather.wind_kph > 30) {
    		tips.push("Be cautious of strong winds");
    	}

    	return tips.length > 0 ? tips : ["Enjoy your day!"];
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let current;
    	let lifestyleTips;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('LifestyleTips', slots, []);
    	let { weatherData } = $$props;

    	$$self.$$.on_mount.push(function () {
    		if (weatherData === undefined && !('weatherData' in $$props || $$self.$$.bound[$$self.$$.props['weatherData']])) {
    			console.warn("<LifestyleTips> was created without expected prop 'weatherData'");
    		}
    	});

    	const writable_props = ['weatherData'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<LifestyleTips> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('weatherData' in $$props) $$invalidate(1, weatherData = $$props.weatherData);
    	};

    	$$self.$capture_state = () => ({
    		weatherData,
    		getLifestyleTips,
    		current,
    		lifestyleTips
    	});

    	$$self.$inject_state = $$props => {
    		if ('weatherData' in $$props) $$invalidate(1, weatherData = $$props.weatherData);
    		if ('current' in $$props) $$invalidate(2, current = $$props.current);
    		if ('lifestyleTips' in $$props) $$invalidate(0, lifestyleTips = $$props.lifestyleTips);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*weatherData*/ 2) {
    			$$invalidate(2, current = weatherData.current);
    		}

    		if ($$self.$$.dirty & /*current*/ 4) {
    			$$invalidate(0, lifestyleTips = getLifestyleTips(current));
    		}
    	};

    	return [lifestyleTips, weatherData, current];
    }

    class LifestyleTips extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { weatherData: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "LifestyleTips",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get weatherData() {
    		throw new Error("<LifestyleTips>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set weatherData(value) {
    		throw new Error("<LifestyleTips>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.59.2 */

    const { console: console_1 } = globals;
    const file = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i].component;
    	child_ctx[10] = list[i].props;
    	child_ctx[12] = i;
    	return child_ctx;
    }

    // (72:1) {#if weatherData}
    function create_if_block_3(ctx) {
    	let div;
    	let button;
    	let t0;
    	let t1_value = (/*useMetric*/ ctx[4] ? 'Fahrenheit' : 'Celsius') + "";
    	let t1;
    	let div_intro;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button = element("button");
    			t0 = text("Switch to ");
    			t1 = text(t1_value);
    			attr_dev(button, "class", "animate-bounce svelte-emj54d");
    			add_location(button, file, 73, 2, 2241);
    			attr_dev(div, "class", "unit-toggle svelte-emj54d");
    			add_location(div, file, 72, 3, 2166);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button);
    			append_dev(button, t0);
    			append_dev(button, t1);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*toggleUnits*/ ctx[7], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*useMetric*/ 16 && t1_value !== (t1_value = (/*useMetric*/ ctx[4] ? 'Fahrenheit' : 'Celsius') + "")) set_data_dev(t1, t1_value);
    		},
    		i: function intro(local) {
    			if (!div_intro) {
    				add_render_callback(() => {
    					div_intro = create_in_transition(div, fly, { y: -50, duration: 500, delay: 400 });
    					div_intro.start();
    				});
    			}
    		},
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(72:1) {#if weatherData}",
    		ctx
    	});

    	return block;
    }

    // (105:1) {:else}
    function create_else_block(ctx) {
    	let p;
    	let p_intro;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Enter a city name to get weather information.";
    			add_location(p, file, 105, 3, 3422);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop$1,
    		i: function intro(local) {
    			if (!p_intro) {
    				add_render_callback(() => {
    					p_intro = create_in_transition(p, fade, {});
    					p_intro.start();
    				});
    			}
    		},
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(105:1) {:else}",
    		ctx
    	});

    	return block;
    }

    // (88:23) 
    function create_if_block_2(ctx) {
    	let div;
    	let current;

    	let each_value = [
    		{
    			component: CurrentWeather,
    			props: {
    				weatherData: /*weatherData*/ ctx[0],
    				useMetric: /*useMetric*/ ctx[4]
    			}
    		},
    		{
    			component: AirQuality,
    			props: { weatherData: /*weatherData*/ ctx[0] }
    		},
    		{
    			component: FiveDayForecast,
    			props: {
    				weatherData: /*weatherData*/ ctx[0],
    				useMetric: /*useMetric*/ ctx[4]
    			}
    		},
    		{
    			component: HourlyForecast,
    			props: {
    				weatherData: /*weatherData*/ ctx[0],
    				useMetric: /*useMetric*/ ctx[4]
    			}
    		},
    		{
    			component: WeatherDetails,
    			props: {
    				weatherData: /*weatherData*/ ctx[0],
    				useMetric: /*useMetric*/ ctx[4]
    			}
    		},
    		{
    			component: SunriseSunset,
    			props: { weatherData: /*weatherData*/ ctx[0] }
    		},
    		{
    			component: Pollution,
    			props: { weatherData: /*weatherData*/ ctx[0] }
    		},
    		{
    			component: LifestyleTips,
    			props: {
    				weatherData: /*weatherData*/ ctx[0],
    				useMetric: /*useMetric*/ ctx[4]
    			}
    		}
    	];

    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < 8; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < 8; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "weather-container svelte-emj54d");
    			add_location(div, file, 88, 3, 2676);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < 8; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div, null);
    				}
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*CurrentWeather, weatherData, useMetric, AirQuality, FiveDayForecast, HourlyForecast, WeatherDetails, SunriseSunset, Pollution, LifestyleTips*/ 17) {
    				each_value = [
    					{
    						component: CurrentWeather,
    						props: {
    							weatherData: /*weatherData*/ ctx[0],
    							useMetric: /*useMetric*/ ctx[4]
    						}
    					},
    					{
    						component: AirQuality,
    						props: { weatherData: /*weatherData*/ ctx[0] }
    					},
    					{
    						component: FiveDayForecast,
    						props: {
    							weatherData: /*weatherData*/ ctx[0],
    							useMetric: /*useMetric*/ ctx[4]
    						}
    					},
    					{
    						component: HourlyForecast,
    						props: {
    							weatherData: /*weatherData*/ ctx[0],
    							useMetric: /*useMetric*/ ctx[4]
    						}
    					},
    					{
    						component: WeatherDetails,
    						props: {
    							weatherData: /*weatherData*/ ctx[0],
    							useMetric: /*useMetric*/ ctx[4]
    						}
    					},
    					{
    						component: SunriseSunset,
    						props: { weatherData: /*weatherData*/ ctx[0] }
    					},
    					{
    						component: Pollution,
    						props: { weatherData: /*weatherData*/ ctx[0] }
    					},
    					{
    						component: LifestyleTips,
    						props: {
    							weatherData: /*weatherData*/ ctx[0],
    							useMetric: /*useMetric*/ ctx[4]
    						}
    					}
    				];

    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < 8; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = 8; i < 8; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < 8; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < 8; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(88:23) ",
    		ctx
    	});

    	return block;
    }

    // (82:17) 
    function create_if_block_1(ctx) {
    	let div;
    	let h2;
    	let t1;
    	let p0;
    	let t2;
    	let t3;
    	let p1;
    	let div_intro;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h2 = element("h2");
    			h2.textContent = "Error";
    			t1 = space();
    			p0 = element("p");
    			t2 = text(/*error*/ ctx[2]);
    			t3 = space();
    			p1 = element("p");
    			p1.textContent = "Please check the city name and try again.";
    			add_location(h2, file, 83, 2, 2556);
    			add_location(p0, file, 84, 2, 2573);
    			add_location(p1, file, 85, 2, 2590);
    			attr_dev(div, "class", "error svelte-emj54d");
    			add_location(div, file, 82, 3, 2500);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h2);
    			append_dev(div, t1);
    			append_dev(div, p0);
    			append_dev(p0, t2);
    			append_dev(div, t3);
    			append_dev(div, p1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*error*/ 4) set_data_dev(t2, /*error*/ ctx[2]);
    		},
    		i: function intro(local) {
    			if (!div_intro) {
    				add_render_callback(() => {
    					div_intro = create_in_transition(div, fly, { y: 50, duration: 500 });
    					div_intro.start();
    				});
    			}
    		},
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(82:17) ",
    		ctx
    	});

    	return block;
    }

    // (80:1) {#if loading}
    function create_if_block(ctx) {
    	let p;
    	let p_intro;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Loading weather data...";
    			add_location(p, file, 80, 3, 2399);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		i: function intro(local) {
    			if (!p_intro) {
    				add_render_callback(() => {
    					p_intro = create_in_transition(p, scale, { duration: 300, easing: elasticOut });
    					p_intro.start();
    				});
    			}
    		},
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(80:1) {#if loading}",
    		ctx
    	});

    	return block;
    }

    // (90:2) {#each [     { component: CurrentWeather, props: { weatherData, useMetric } },     { component: AirQuality, props: { weatherData } },     { component: FiveDayForecast, props: { weatherData, useMetric } },     { component: HourlyForecast, props: { weatherData, useMetric } },     { component: WeatherDetails, props: { weatherData, useMetric } },     { component: SunriseSunset, props: { weatherData } },     { component: Pollution, props: { weatherData } },     { component: LifestyleTips, props: { weatherData, useMetric } }   ] as { component, props }
    function create_each_block(ctx) {
    	let div;
    	let switch_instance;
    	let t;
    	let div_intro;
    	let current;
    	const switch_instance_spread_levels = [/*props*/ ctx[10]];
    	var switch_value = /*component*/ ctx[9];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = construct_svelte_component_dev(switch_value, switch_props());
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			t = space();
    			add_location(div, file, 99, 4, 3271);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (switch_instance) mount_component(switch_instance, div, null);
    			append_dev(div, t);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*CurrentWeather, weatherData, useMetric, AirQuality, FiveDayForecast, HourlyForecast, WeatherDetails, SunriseSunset, Pollution, LifestyleTips*/ 17)
    			? get_spread_update(switch_instance_spread_levels, [get_spread_object(/*props*/ ctx[10])])
    			: {};

    			if (dirty & /*weatherData, useMetric*/ 17 && switch_value !== (switch_value = /*component*/ ctx[9])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = construct_svelte_component_dev(switch_value, switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, div, t);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);

    			if (!div_intro) {
    				add_render_callback(() => {
    					div_intro = create_in_transition(div, fly, {
    						y: 50,
    						duration: 500,
    						delay: /*i*/ ctx[12] * 100
    					});

    					div_intro.start();
    				});
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (switch_instance) destroy_component(switch_instance);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(90:2) {#each [     { component: CurrentWeather, props: { weatherData, useMetric } },     { component: AirQuality, props: { weatherData } },     { component: FiveDayForecast, props: { weatherData, useMetric } },     { component: HourlyForecast, props: { weatherData, useMetric } },     { component: WeatherDetails, props: { weatherData, useMetric } },     { component: SunriseSunset, props: { weatherData } },     { component: Pollution, props: { weatherData } },     { component: LifestyleTips, props: { weatherData, useMetric } }   ] as { component, props }",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let div;
    	let input;
    	let t0;
    	let button;
    	let div_intro;
    	let t2;
    	let t3;
    	let current_block_type_index;
    	let if_block1;
    	let main_intro;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*weatherData*/ ctx[0] && create_if_block_3(ctx);
    	const if_block_creators = [create_if_block, create_if_block_1, create_if_block_2, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*loading*/ ctx[1]) return 0;
    		if (/*error*/ ctx[2]) return 1;
    		if (/*weatherData*/ ctx[0]) return 2;
    		return 3;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			div = element("div");
    			input = element("input");
    			t0 = space();
    			button = element("button");
    			button.textContent = "Search";
    			t2 = space();
    			if (if_block0) if_block0.c();
    			t3 = space();
    			if_block1.c();
    			attr_dev(input, "placeholder", "Enter city name");
    			attr_dev(input, "class", "svelte-emj54d");
    			add_location(input, file, 63, 3, 1950);
    			attr_dev(button, "class", "animate-pulse svelte-emj54d");
    			add_location(button, file, 68, 3, 2059);
    			attr_dev(div, "class", "search-container svelte-emj54d");
    			add_location(div, file, 62, 1, 1869);
    			attr_dev(main, "class", "svelte-emj54d");
    			add_location(main, file, 61, 2, 1833);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div);
    			append_dev(div, input);
    			set_input_value(input, /*searchQuery*/ ctx[3]);
    			append_dev(div, t0);
    			append_dev(div, button);
    			append_dev(main, t2);
    			if (if_block0) if_block0.m(main, null);
    			append_dev(main, t3);
    			if_blocks[current_block_type_index].m(main, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[8]),
    					listen_dev(input, "keypress", /*handleKeyPress*/ ctx[6], false, false, false, false),
    					listen_dev(button, "click", /*fetchWeatherData*/ ctx[5], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*searchQuery*/ 8 && input.value !== /*searchQuery*/ ctx[3]) {
    				set_input_value(input, /*searchQuery*/ ctx[3]);
    			}

    			if (/*weatherData*/ ctx[0]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*weatherData*/ 1) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_3(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(main, t3);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block1 = if_blocks[current_block_type_index];

    				if (!if_block1) {
    					if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block1.c();
    				} else {
    					if_block1.p(ctx, dirty);
    				}

    				transition_in(if_block1, 1);
    				if_block1.m(main, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			if (!div_intro) {
    				add_render_callback(() => {
    					div_intro = create_in_transition(div, fly, { y: -50, duration: 500, delay: 300 });
    					div_intro.start();
    				});
    			}

    			transition_in(if_block0);
    			transition_in(if_block1);

    			if (!main_intro) {
    				add_render_callback(() => {
    					main_intro = create_in_transition(main, fade, { duration: 300 });
    					main_intro.start();
    				});
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (if_block0) if_block0.d();
    			if_blocks[current_block_type_index].d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const API_KEY = '075d50d64f0a4d76b80184659242208';

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let weatherData = null;
    	let loading = false;
    	let error = null;
    	let searchQuery = '';
    	let useMetric = true;

    	async function fetchWeatherData() {
    		if (!searchQuery.trim()) {
    			$$invalidate(2, error = "Please enter a city name");
    			return;
    		}

    		$$invalidate(1, loading = true);
    		$$invalidate(2, error = null);

    		try {
    			const url = `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${searchQuery}&days=5&aqi=yes`;
    			console.log('Fetching data from:', url);
    			const response = await axios$1.get(url);
    			$$invalidate(0, weatherData = response.data);
    			console.log('Received data:', weatherData);
    		} catch(err) {
    			console.error('Error fetching weather data:', err);
    			$$invalidate(2, error = `Failed to fetch weather data: ${err.message}`);

    			if (err.response) {
    				console.error('Response data:', err.response.data);
    				console.error('Response status:', err.response.status);
    				$$invalidate(2, error += ` (Status: ${err.response.status})`);
    			}
    		} finally {
    			$$invalidate(1, loading = false);
    		}
    	}

    	function handleKeyPress(event) {
    		if (event.key === 'Enter') {
    			fetchWeatherData();
    		}
    	}

    	function toggleUnits() {
    		$$invalidate(4, useMetric = !useMetric);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		searchQuery = this.value;
    		$$invalidate(3, searchQuery);
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		axios: axios$1,
    		fade,
    		fly,
    		scale,
    		elasticOut,
    		CurrentWeather,
    		AirQuality,
    		FiveDayForecast,
    		HourlyForecast,
    		WeatherDetails,
    		SunriseSunset,
    		Pollution,
    		LifestyleTips,
    		weatherData,
    		loading,
    		error,
    		searchQuery,
    		useMetric,
    		API_KEY,
    		fetchWeatherData,
    		handleKeyPress,
    		toggleUnits
    	});

    	$$self.$inject_state = $$props => {
    		if ('weatherData' in $$props) $$invalidate(0, weatherData = $$props.weatherData);
    		if ('loading' in $$props) $$invalidate(1, loading = $$props.loading);
    		if ('error' in $$props) $$invalidate(2, error = $$props.error);
    		if ('searchQuery' in $$props) $$invalidate(3, searchQuery = $$props.searchQuery);
    		if ('useMetric' in $$props) $$invalidate(4, useMetric = $$props.useMetric);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		weatherData,
    		loading,
    		error,
    		searchQuery,
    		useMetric,
    		fetchWeatherData,
    		handleKeyPress,
    		toggleUnits,
    		input_input_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
