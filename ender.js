/*!
  * =============================================================
  * Ender: open module JavaScript framework (https://enderjs.com)
  * Build: ender add kizzy
  * Packages: ender-core@2.0.0 ender-commonjs@1.0.8 kizzy@0.0.5
  * =============================================================
  */

(function () {

  /*!
    * Ender: open module JavaScript framework (client-lib)
    * http://enderjs.com
    * License MIT
    */
  
  /**
   * @constructor
   * @param  {*=}      item      selector|node|collection|callback|anything
   * @param  {Object=} root      node(s) from which to base selector queries
   */
  function Ender(item, root) {
    var i
    this.length = 0 // Ensure that instance owns length
  
    if (typeof item == 'string')
      // start with strings so the result parlays into the other checks
      // the .selector prop only applies to strings
      item = ender._select(this['selector'] = item, root)
  
    if (null == item) return this // Do not wrap null|undefined
  
    if (typeof item == 'function') ender._closure(item, root)
  
    // DOM node | scalar | not array-like
    else if (typeof item != 'object' || item.nodeType || (i = item.length) !== +i || item == item.window)
      this[this.length++] = item
  
    // array-like - bitwise ensures integer length
    else for (this.length = i = (i > 0 ? ~~i : 0); i--;)
      this[i] = item[i]
  }
  
  /**
   * @param  {*=}      item   selector|node|collection|callback|anything
   * @param  {Object=} root   node(s) from which to base selector queries
   * @return {Ender}
   */
  function ender(item, root) {
    return new Ender(item, root)
  }
  
  
  /**
   * @expose
   * sync the prototypes for jQuery compatibility
   */
  ender.fn = ender.prototype = Ender.prototype
  
  /**
   * @enum {number}  protects local symbols from being overwritten
   */
  ender._reserved = {
    reserved: 1,
    ender: 1,
    expose: 1,
    noConflict: 1,
    fn: 1
  }
  
  /**
   * @expose
   * handy reference to self
   */
  Ender.prototype.$ = ender
  
  /**
   * @expose
   * make webkit dev tools pretty-print ender instances like arrays
   */
  Ender.prototype.splice = function () { throw new Error('Not implemented') }
  
  /**
   * @expose
   * @param   {function(*, number, Ender)}  fn
   * @param   {object=}                     scope
   * @return  {Ender}
   */
  Ender.prototype.forEach = function (fn, scope) {
    var i, l
    // opt out of native forEach so we can intentionally call our own scope
    // defaulting to the current item and be able to return self
    for (i = 0, l = this.length; i < l; ++i) i in this && fn.call(scope || this[i], this[i], i, this)
    // return self for chaining
    return this
  }
  
  /**
   * @expose
   * @param {object|function} o
   * @param {boolean=}        chain
   */
  ender.ender = function (o, chain) {
    var o2 = chain ? Ender.prototype : ender
    for (var k in o) !(k in ender._reserved) && (o2[k] = o[k])
    return o2
  }
  
  /**
   * @expose
   * @param {string}  s
   * @param {Node=}   r
   */
  ender._select = function (s, r) {
    return s ? (r || document).querySelectorAll(s) : []
  }
  
  /**
   * @expose
   * @param {function} fn
   */
  ender._closure = function (fn) {
    fn.call(document, ender)
  }
  
  if (typeof module !== 'undefined' && module['exports']) module['exports'] = ender
  var $ = ender
  
  /**
   * @expose
   * @param {string} name
   * @param {*}      value
   */
  ender.expose = function (name, value) {
    ender.expose.old[name] = window[name]
    window[name] = value
  }
  
  /**
   * @expose
   */
  ender.expose.old = {}
  
  /**
   * @expose
   * @param {boolean} all   restore only $ or all ender globals
   */
  ender.noConflict = function (all) {
    window['$'] = ender.expose.old['$']
    if (all) for (var k in ender.expose.old) window[k] = ender.expose.old[k]
    return this
  }
  
  ender.expose('$', ender)
  ender.expose('ender', ender); // uglify needs this semi-colon between concating files
  
  /*!
    * Ender: open module JavaScript framework (module-lib)
    * http://enderjs.com
    * License MIT
    */
  
  var global = this
  
  /**
   * @param  {string}  id   module id to load
   * @return {object}
   */
  function require(id) {
    if ('$' + id in require._cache)
      return require._cache['$' + id]
    if ('$' + id in require._modules)
      return (require._cache['$' + id] = require._modules['$' + id]._load())
    if (id in window)
      return window[id]
  
    throw new Error('Requested module "' + id + '" has not been defined.')
  }
  
  /**
   * @param  {string}  id       module id to provide to require calls
   * @param  {object}  exports  the exports object to be returned
   */
  function provide(id, exports) {
    return (require._cache['$' + id] = exports)
  }
  
  /**
   * @expose
   * @dict
   */
  require._cache = {}
  
  /**
   * @expose
   * @dict
   */
  require._modules = {}
  
  /**
   * @constructor
   * @param  {string}                                          id   module id for this module
   * @param  {function(Module, object, function(id), object)}  fn   module definition
   */
  function Module(id, fn) {
    this.id = id
    this.fn = fn
    require._modules['$' + id] = this
  }
  
  /**
   * @expose
   * @param  {string}  id   module id to load from the local module context
   * @return {object}
   */
  Module.prototype.require = function (id) {
    var parts, i
  
    if (id.charAt(0) == '.') {
      parts = (this.id.replace(/\/.*?$/, '/') + id.replace(/\.js$/, '')).split('/')
  
      while (~(i = parts.indexOf('.')))
        parts.splice(i, 1)
  
      while ((i = parts.lastIndexOf('..')) > 0)
        parts.splice(i - 1, 2)
  
      id = parts.join('/')
    }
  
    return require(id)
  }
  
  /**
   * @expose
   * @return {object}
   */
   Module.prototype._load = function () {
     var m = this
     var dotdotslash = /^\.\.\//g
     var dotslash = /^\.\/[^\/]+$/g
     if (!m._loaded) {
       m._loaded = true
  
       /**
        * @expose
        */
       m.exports = {}
       m.fn.call(global, m, m.exports, function (id) {
         if (id.match(dotdotslash)) {
           id = m.id.replace(/[^\/]+\/[^\/]+$/, '') + id.replace(dotdotslash, '')
         }
         else if (id.match(dotslash)) {
           id = m.id.replace(/\/[^\/]+$/, '') + id.replace('.', '')
         }
         return m.require(id)
       }, global)
     }
  
     return m.exports
   }
  
  /**
   * @expose
   * @param  {string}                     id        main module id
   * @param  {Object.<string, function>}  modules   mapping of module ids to definitions
   * @param  {string}                     main      the id of the main module
   */
  Module.createPackage = function (id, modules, main) {
    var path, m
  
    for (path in modules) {
      new Module(id + '/' + path, modules[path])
      if (m = path.match(/^(.+)\/index$/)) new Module(id + '/' + m[1], modules[path])
    }
  
    if (main) require._modules['$' + id] = require._modules['$' + id + '/' + main]
  }
  
  if (ender && ender.expose) {
    /*global global,require,provide,Module */
    ender.expose('global', global)
    ender.expose('require', require)
    ender.expose('provide', provide)
    ender.expose('Module', Module)
  }
  
  Module.createPackage('kizzy', {
    'kizzy': function (module, exports, require, global) {
      /*!
        * Kizzy - a cross-browser LocalStorage API
        * Copyright: Dustin Diaz 2012
        * https://github.com/ded/kizzy
        * License: MIT
        */
      !function (name, definition) {
        if (typeof module != 'undefined') module.exports = definition()
        else if (typeof define == 'function' && typeof define.amd == 'object') define(definition)
        else this[name] = definition()
      }('kizzy', function () {
      
        function noop() {}
        var hasLocalStorage
          , doc = document
          , store = doc.domain
          , html5 = 0
          , writeThrough = function () {
              return 1
            }
      
      
        try {
          // HTML5 local storage
          hasLocalStorage = !!localStorage || !!globalStorage
          if (!localStorage) {
            localStorage = globalStorage[store]
          }
          html5 = 1
        } catch (ex1) {
          html5 = 0
          // IE local storage
          try {
            // this try / if is required. trust me
            if (doc.documentElement.addBehavior) {
              html5 = 0
              hasLocalStorage = 1
              var dataStore = doc.documentElement
              dataStore.addBehavior('#default#userData')
              dataStore.load(store)
              var xmlDoc = dataStore.xmlDocument
                , xmlDocEl = xmlDoc.documentElement
            }
          } catch (ex2) {
            hasLocalStorage = false
          }
        }
      
        var setLocalStorage = noop
          , getLocalStorage = noop
          , removeLocalStorage = noop
          , clearLocalStorage = noop
      
        if (hasLocalStorage) {
          setLocalStorage = html5 ? html5setLocalStorage : setUserData
          getLocalStorage = html5 ? html5getLocalStorage : getUserData
          removeLocalStorage = html5 ? html5removeLocalStorage : removeUserData
          clearLocalStorage = html5 ? html5clearLocalStorage : clearUserData
      
          writeThrough = function (inst) {
            try {
              var v = JSON.stringify(inst._)
              if( v == '{}' ) {
                removeLocalStorage(inst.ns)
              } else {
                setLocalStorage(inst.ns, v)
              }
              return 1
            } catch (x) {
              return 0
            }
          }
        }
      
      
        function time() {
          return +new Date()
        }
      
        function checkExpiry(inst, k) {
          if (inst._[k] && inst._[k].e && inst._[k].e < time()) {
            inst.remove(k)
          }
        }
      
        function isNumber(n) {
          return typeof n === 'number' && isFinite(n)
        }
      
        function html5getLocalStorage(k) {
          return localStorage[k]
        }
      
        function html5setLocalStorage(k, v) {
          localStorage[k] = v
          return v
        }
      
        function html5removeLocalStorage(k) {
          delete localStorage[k]
        }
      
        function html5clearLocalStorage() {
          localStorage.clear()
        }
      
        function getNodeByName(name) {
          var childNodes = xmlDocEl.childNodes
            , node
            , returnVal = null
      
          for (var i = 0, len = childNodes.length; i < len; i++) {
            node = childNodes.item(i)
            if (node.getAttribute("key") == name) {
              returnVal = node
              break
            }
          }
          return returnVal
        }
      
        function getUserData(name) {
          var node = getNodeByName(name)
          var returnVal = null
          if (node) {
            returnVal = node.getAttribute("value")
          }
          return returnVal
        }
      
        function setUserData(name, value) {
          var node = getNodeByName(name)
          if (!node) {
            node = xmlDoc.createNode(1, "item", "")
            node.setAttribute("key", name)
            node.setAttribute("value", value)
            xmlDocEl.appendChild(node)
          }
          else {
            node.setAttribute("value", value)
          }
          dataStore.save(store)
          return value
        }
      
        function removeUserData(name) {
          getNodeByName(name) && xmlDocEl.removeChild(node)
          dataStore.save(store)
        }
      
        function clearUserData() {
          while (xmlDocEl.firstChild) {
            xmlDocEl.removeChild(xmlDocEl.firstChild)
          }
          dataStore.save(store)
        }
      
        function _Kizzy() {
          this._ = {}
        }
      
        _Kizzy.prototype = {
      
          set: function (k, v, optTtl) {
            this._[k] = {
              value: v,
              e: isNumber(optTtl) ? time() + optTtl : 0
            }
            writeThrough(this) || this.remove(k)
            return v
          },
      
          get: function (k) {
            checkExpiry(this, k)
            return this._[k] ? this._[k].value : undefined
          },
      
          remove: function (k) {
            delete this._[k];
            writeThrough(this)
          },
      
          clear: function () {
            this._ = {}
            writeThrough(this)
          },
      
          clearExpireds: function() {
            for (var k in this._) {
              checkExpiry(this, k)
            }
            writeThrough(this)
          }
        }
      
        function Kizzy(ns) {
          this.ns = ns
          this._ = JSON.parse(getLocalStorage(ns) || '{}')
        }
      
        Kizzy.prototype = _Kizzy.prototype
      
        function kizzy(ns) {
          return new Kizzy(ns)
        }
      
        kizzy.remove = removeLocalStorage
        kizzy.clear = clearLocalStorage
      
        return kizzy
      })
      
    },
    'src\ender': function (module, exports, require, global) {
      !function ($) {
          var kizzy = require('kizzy');
          $.ender({cache: kizzy});
      }(ender);
    }
  }, 'kizzy');

  require('kizzy');
  require('kizzy/src\ender');

}.call(window));
//# sourceMappingURL=ender.js.map
