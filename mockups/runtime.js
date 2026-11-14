/*
 * Side C mockup runtime
 * A tiny renderer so the design mockups run as plain web pages.
 * Each page holds its markup in <template id="tpl"> and defines
 * `class Component extends DCLogic { renderVals() { ... } }`.
 *
 * Template syntax:
 *   {{ path }}                     dotted lookup into renderVals() (no expressions)
 *   attr="{{ path }}"              raw value (functions become event handlers for on*)
 *   attr="text {{ path }} text"    interpolated string
 *   <sc-for list="{{ items }}" as="item">   repeat ($index in scope)
 *   <sc-if value="{{ cond }}">     render children when truthy
 */
(function () {
  "use strict";

  var WHOLE = /^\s*\{\{\s*([^}]+?)\s*\}\}\s*$/;
  var HOLE = /\{\{\s*([^}]+?)\s*\}\}/g;
  var PROPS = { checked: 1, disabled: 1, value: 1, selected: 1 };

  function lookup(path, scope) {
    if (path === "true") return true;
    if (path === "false") return false;
    if (path === "null") return null;
    if (/^-?\d+(\.\d+)?$/.test(path)) return Number(path);
    var parts = path.split(".");
    var cur = scope;
    for (var i = 0; i < parts.length; i++) {
      if (cur == null) return undefined;
      cur = cur[parts[i]];
    }
    return cur;
  }

  function interp(str, scope) {
    return str.replace(HOLE, function (_, p) {
      var v = lookup(p, scope);
      return v == null ? "" : String(v);
    });
  }

  function child(scope, extra) {
    var s = Object.create(scope);
    for (var k in extra) s[k] = extra[k];
    return s;
  }

  function build(node, scope, out) {
    if (node.nodeType === 3) {
      out.appendChild(document.createTextNode(interp(node.nodeValue, scope)));
      return;
    }
    if (node.nodeType !== 1) return;
    var tag = node.localName;

    if (tag === "sc-for") {
      var m = WHOLE.exec(node.getAttribute("list") || "");
      var list = m ? lookup(m[1], scope) : [];
      var as = node.getAttribute("as") || "item";
      (list || []).forEach(function (item, i) {
        var extra = { $index: i };
        extra[as] = item;
        var s = child(scope, extra);
        node.childNodes.forEach(function (c) { build(c, s, out); });
      });
      return;
    }
    if (tag === "sc-if") {
      var mv = WHOLE.exec(node.getAttribute("value") || "");
      if (mv && lookup(mv[1], scope)) {
        node.childNodes.forEach(function (c) { build(c, scope, out); });
      }
      return;
    }

    var el = node.cloneNode(false);
    var deferredValue;
    Array.prototype.slice.call(node.attributes).forEach(function (a) {
      var name = a.name;
      if (name.indexOf("hint-") === 0) { el.removeAttribute(name); return; }
      var whole = WHOLE.exec(a.value);
      if (name.indexOf("on") === 0) {
        el.removeAttribute(name);
        if (whole) {
          var fn = lookup(whole[1], scope);
          if (typeof fn === "function") el.addEventListener(name.slice(2), fn);
        }
        return;
      }
      if (whole) {
        var v = lookup(whole[1], scope);
        if (PROPS[name]) {
          el.removeAttribute(name);
          if (name === "value") { deferredValue = v; }
          else if (v) { el.setAttribute(name, ""); el[name] = true; }
        } else if (v === false || v == null) {
          el.removeAttribute(name);
        } else {
          el.setAttribute(name, String(v));
        }
        return;
      }
      if (a.value.indexOf("{{") >= 0) el.setAttribute(name, interp(a.value, scope));
    });

    var target = tag === "template" ? el.content : el;
    node.childNodes.forEach(function (c) { build(c, scope, target); });
    if (deferredValue !== undefined) el.value = deferredValue == null ? "" : deferredValue;
    out.appendChild(el);
  }

  function DCLogic(props) {
    this.props = props || {};
    this.state = {};
  }
  DCLogic.prototype.setState = function (patch) {
    var next = typeof patch === "function" ? patch(this.state, this.props) : patch;
    this.state = Object.assign({}, this.state, next);
    this.__render && this.__render();
  };
  DCLogic.prototype.forceUpdate = function () { this.__render && this.__render(); };
  window.DCLogic = DCLogic;

  window.mountComponent = function (Component) {
    var tpl = document.getElementById("tpl");
    var root = document.getElementById("app");
    var inst = new Component({});
    var queued = false;

    function snapshotScroll() {
      var all = root.querySelectorAll("*"), saved = [];
      for (var i = 0; i < all.length; i++) {
        if (all[i].scrollTop || all[i].scrollLeft) saved.push([i, all[i].scrollTop, all[i].scrollLeft]);
      }
      return saved;
    }
    function restoreScroll(saved) {
      var all = root.querySelectorAll("*");
      saved.forEach(function (s) { if (all[s[0]]) { all[s[0]].scrollTop = s[1]; all[s[0]].scrollLeft = s[2]; } });
    }
    function render() {
      var saved = snapshotScroll();
      var scope = inst.renderVals ? inst.renderVals() : {};
      var frag = document.createDocumentFragment();
      tpl.content.childNodes.forEach(function (c) { build(c, scope, frag); });
      root.replaceChildren(frag);
      restoreScroll(saved);
    }
    inst.__render = function () {
      if (queued) return;
      queued = true;
      Promise.resolve().then(function () { queued = false; render(); });
    };
    render();
    if (inst.componentDidMount) inst.componentDidMount();
  };
})();
