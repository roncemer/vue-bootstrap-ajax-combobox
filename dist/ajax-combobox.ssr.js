'use strict';Object.defineProperty(exports,'__esModule',{value:true});function _interopDefault(e){return(e&&(typeof e==='object')&&'default'in e)?e['default']:e}var axios=_interopDefault(require('axios'));//

var script = {
  name: "AjaxCombobox",
  props: ["value", "options", "readonly", "disabled"],

  data: function data() {
    return {
      // Local copy of properties.
      my_options: {
        debug: false,
        ajax_url: null,
        id_type: null,
        alt_id_type: null,
        allow_clear: null,
        placeholder_label: null
      },

      my_readonly: false,
      my_disabled: false,

      // Placeholder id and alternate id, derived from id_type and alt_id_type.
      placeholder_id: null,
      placeholder_alt_id: null,

      localValue: this.value,

      skipLookupByIdFromValueChange: false,
      search: "",
      label: "",
      inSearchMode: false,
      matches: [],
      activeMatchIdx: -1,
      ajaxTimeout: null
    };
  },

  computed: {
    search_computed: {
      get: function get() {
        return this.inSearchMode ? this.search : this.label;
      },
      set: function set(newValue) {
        if (this.inSearchMode) { this.search = newValue; }
      }
    },

    id: {
      get: function get() {
        return this.localValue;
      },

      set: function set(newValue) {
        this.localValue = newValue;
        this.$emit("input", newValue);
      }
    }
  },

  watch: {
    search: function search() {
      if (this.search != "") {
        this.triggerSearch();
      }
    },

    value: function value() {
      this.localValue = this.value;
    },

    localValue: function localValue() {
      if (!this.skipLookupByIdFromValueChange) {
        this.triggerLookupById();
      } else {
        this.skipLookupByIdFromValueChange = false;
      }
    },

    options: {
      handler: function handler() {
        var changed = this.updateMyOptionsFromParentOptions();

        // If id_type changed, marshal the value to the correct type.
        if (changed.indexOf("id_type") >= 0) {
          if (this.my_options.id_type == "string") {
            if (typeof this.id != "string") {
              /* eslint-disable */
              this.setIdWithoutTriggeringLookupById(this.id != 0 ? String(this.id) : "");
              /* eslint-enable */
            }
          } else {
            if (typeof this.id != "number") {
              this.setIdWithoutTriggeringLookupById(Number(this.id) || 0);
            }
          }
        }

        // If id_type, allow_clear or placeholder_label changes, handle changes to the empty label.
        if (
          changed.indexOf("id_type") >= 0 ||
          changed.indexOf("allow_clear") >= 0 ||
          changed.indexOf("placeholder_label") >= 0
        ) {
          if (this.isPlaceholderId(true)) {
            this.enterIdleState();
            this.label = this.my_options.placeholder_label;
          }
        }
      },
      deep: true
    },

    readonly: function readonly() {
      this.updateMyReadonlyFromProp();
      if (this.my_readonly) {
        this.enterIdleState();
      }
    },

    disabled: function disabled() {
      this.updateMyDisabledFromProp();
      this.enterIdleState();
    }
  },

  created: function created() {
    this.updateMyOptionsFromParentOptions();
    this.updateMyReadonlyFromProp();
    this.updateMyDisabledFromProp();
    this.triggerLookupById();
  },

  methods: {
    searchFocused: function searchFocused(/*evt*/) {
      this.inSearchMode = true;
    },

    searchBlurred: function searchBlurred(evt) {
      // Don't do anything if we're losing focus to one of our own components.
      if (
        evt &&
        evt.relatedTarget &&
        (evt.relatedTarget.classList.contains("ajax-combobox") ||
          evt.relatedTarget.classList.contains("ajax-combobox-clear-button") ||
          evt.relatedTarget.classList.contains("ajax-combobox-toggle-button") ||
          evt.relatedTarget.classList.contains("ajax-combobox-dropdown-item"))
      ) {
        return;
      }

      // If the search element loses focus, but not to one of our buttons or one of the the
      // search results, and we have a search string and an alternate id type, do a lookup
      // by alternate id.
      if (
        this.my_options.alt_id_type != "" &&
        this.inSearchMode &&
        this.search != ""
      ) {
        this.clearTrigger();
        this.doLookupByAltId();
      } else {
        setTimeout(
          function() {
            this.enterIdleState();
          }.bind(this),
          300
        );
      }
    },

    searchKeyDown: function searchKeyDown(evt) {
      if (this.my_readonly || this.my_disabled) { return; }

      if (!evt.shiftKey && !evt.ctrlKey && !evt.altKey && !evt.metaKey) {
        switch (evt.key) {
          case "ArrowUp":
            evt.preventDefault();
            evt.stopPropagation();
            if (this.matches.length > 0) {
              this.activeMatchIdx--;
              if (this.activeMatchIdx < 0) {
                this.activeMatchIdx = this.matches.length - 1;
              }
            } else {
              this.activeMatchIdx = -1;
            }
            break;
          case "ArrowDown":
            evt.preventDefault();
            evt.stopPropagation();
            if (this.matches.length > 0) {
              this.activeMatchIdx++;
              if (this.activeMatchIdx >= this.matches.length) {
                this.activeMatchIdx = 0;
              }
            } else {
              this.activeMatchIdx = -1;
            }
            break;
          case "Enter":
            if (this.inSearchMode) {
              if (
                this.activeMatchIdx >= 0 &&
                this.activeMatchIdx < this.matches.length
              ) {
                evt.preventDefault();
                evt.stopPropagation();
                this.itemSelected(this.activeMatchIdx);
              } else if (
                this.my_options.alt_id_type != "" &&
                this.search != ""
              ) {
                this.clearTrigger();
                this.doLookupByAltId();
              }
              this.inSearchMode = true;
            }
            break;
          case "Escape":
            evt.preventDefault();
            evt.stopPropagation();
            if (this.inSearchMode) {
              this.enterIdleState();
              this.inSearchMode = true;
            } else {
              this.enterIdleState();
            }
            break;
        }
      }
    },

    clearButtonClicked: function clearButtonClicked() {
      if (!this.my_readonly && !this.my_disabled) {
        this.setIdWithoutTriggeringLookupById(this.placeholder_id);
        this.label = this.my_options.placeholder_label;
        this.search = "";
        this.clearMatches();
      }
      this.$refs.search.focus();
    },

    chevronDownClicked: function chevronDownClicked() {
      if (!this.inSearchMode || this.matches.length == 0) {
        if (!this.my_readonly && !this.my_disabled) {
          this.inSearchMode = true;
          this.triggerSearch();
        }
      } else {
        this.enterIdleState();
      }
      this.$refs.search.focus();
    },

    triggerSearch: function triggerSearch() {
      this.clearTrigger();
      if (this.inSearchMode) {
        this.ajaxTimeout = setTimeout(
          function() {
            this.doSearch();
          }.bind(this),
          300
        );
      }
    },

    triggerLookupById: function triggerLookupById() {
      this.clearTrigger();
      this.ajaxTimeout = setTimeout(
        function() {
          this.doLookupById();
        }.bind(this),
        20
      );
    },

    clearTrigger: function clearTrigger() {
      if (this.ajaxTimeout !== null) {
        clearTimeout(this.ajaxTimeout);
        this.ajaxTimeout = null;
      }
    },

    itemSelected: function itemSelected(idx) {
      /*if (typeof evt != "undefined") {
        evt.stopPropagation();
      }*/
      if (idx >= 0 && idx < this.matches.length) {
        var match = this.matches[idx];
        this.setIdWithoutTriggeringLookupById(this.marshalId(match.id));
        this.label = match.label;
        this.enterIdleState();
      }
    },

    doSearch: function doSearch() {
      this.clearTrigger();
      if (this.inSearchMode) {
        /* eslint-disable */
        axios.get(
          this.buildURL("q=" + encodeURIComponent(this.search)),
          {responseType:"json"}
        )
        .then(function(response) {
          this.matches = response.data.matches;
          this.activeMatchIdx = -1;
        }.bind(this))
        .catch(function(error) {
          console.error(error);
        }.bind(this));
        /* eslint-enable */
      }
    },

    doLookupById: function doLookupById() {
      if (this.isPlaceholderId(true)) {
        this.enterIdleState();
        this.label = this.my_options.placeholder_label;
        return;
      }

      /* eslint-disable */
      axios.get(
        this.buildURL("id=" + encodeURIComponent(this.id)),
        {responseType:"json"}
      )
      .then(function(response) {
        if (
          !this.isPlaceholderId() &&
          (response.data.id == this.id || response.data.id == this.placeholder_id)
        ) {
          this.label = response.data.label;
        }
      }.bind(this))
      .catch(function(error) {
        console.error(error);
      }.bind(this));
      /* eslint-enable */
    },

    doLookupByAltId: function doLookupByAltId() {
      var search = this.search;

      this.enterIdleState();
      this.setIdWithoutTriggeringLookupById(this.placeholder_id);
      this.label = this.my_options.placeholder_label;

      /* eslint-disable */
      axios.get(
        this.buildURL("alt_id=" + encodeURIComponent(search)),
        {responseType:"json"}
      )
      .then(function(response) {
        if (
          typeof response.data.id != "undefined" &&
          typeof response.data.label != "undefined"
        ) {
          this.setIdWithoutTriggeringLookupById(this.marshalId(response.data.id));
          this.label = response.data.label;
          this.clearTrigger();
          this.inSearchMode = false;
        }
      }.bind(this))
      .catch(function(error) {
        console.error(error);
      }.bind(this));
      /* eslint-enable */
    },

    enterIdleState: function enterIdleState() {
      this.inSearchMode = false;
      this.search = "";
      this.clearMatches();
      this.clearTrigger();
      if (this.isPlaceholderId(true)) {
        this.label = this.my_options.placeholder_label;
      }
    },

    isPlaceholderId: function isPlaceholderId(ignore_allow_clear) {
      if (typeof ignore_allow_clear == "undefined") {
        ignore_allow_clear = false;
      }
      return (
        (ignore_allow_clear || this.my_options.allow_clear) &&
        (this.id == this.placeholder_id || this.id === null)
      );
    },

    clearMatches: function clearMatches() {
      this.matches = [];
      this.activeMatchIdx = -1;
    },

    setIdWithoutTriggeringLookupById: function setIdWithoutTriggeringLookupById(new_id) {
      if (this.id !== new_id) {
        this.skipLookupByIdFromValueChange = true;
        this.id = new_id;
      }
    },

    getParentOption: function getParentOption(optionName) {
      if (typeof this.options == "object") {
        switch (optionName) {
          case "debug":
            if (typeof this.options.debug == "boolean") {
              return this.options.debug;
            }
            return false;
          case "ajax_url":
            if (typeof this.options.ajax_url == "string") {
              return this.options.ajax_url;
            }
            return "";
          case "id_type":
            /* eslint-disable */
            if (
              typeof this.options.id_type == "string" &&
              (this.options.id_type == "number" || this.options.id_type == "string")
            ) {
              return this.options.id_type;
            }
            /* eslint-enable */
            if (typeof this.value == "string") {
              return "string";
            }
            return "number";
          case "alt_id_type":
            /* eslint-disable */
            if (
              typeof this.options.id_type == "string" &&
              (this.options.id_type == "" || this.options.id_type == "number" || this.options.id_type == "string")
            ) {
              return this.options.alt_id_type;
            }
            /* eslint-enable */
            return "number";
          case "allow_clear":
            if (typeof this.options.allow_clear == "boolean") {
              return this.options.allow_clear;
            }
            return false;
          case "placeholder_label":
            if (typeof this.options.placeholder_label == "string") {
              return this.options.placeholder_label;
            }
            return "";
        }
      }
      return null;
    },

    // Returns an array of the options in my_options which were updated from the parent options.
    updateMyOptionsFromParentOptions: function updateMyOptionsFromParentOptions() {
      var changed = [];
      for (var vn in this.my_options) {
        var val = this.getParentOption(vn);
        if (this.my_options[vn] != val) {
          this.my_options[vn] = val;
          changed.push(vn);
        }
      }

      // Calculate placeholder id and alt id based on the type options.
      this.placeholder_id = this.my_options.id_type == "string" ? "" : 0;
      if (this.my_options.alt_id_type == "") {
        this.placeholder_alt_id = null;
      } else if (this.my_options.alt_id_type == "string") {
        this.placeholder_alt_id = "";
      } else {
        this.placeholder_alt_id = 0;
      }

      return changed;
    },

    updateMyReadonlyFromProp: function updateMyReadonlyFromProp() {
      this.my_readonly = this.calcReadonlyOrDisabledFromProp("readonly");
    },

    updateMyDisabledFromProp: function updateMyDisabledFromProp() {
      this.my_disabled = this.calcReadonlyOrDisabledFromProp("disabled");
    },

    calcReadonlyOrDisabledFromProp: function calcReadonlyOrDisabledFromProp(propname) {
      switch (typeof this[propname]) {
        case "undefined":
          return false;
        case "boolean":
          return this[propname];
        case "string":
          return true;
      }
    },

    buildURL: function buildURL(args) {
      var sep = this.my_options.ajax_url.indexOf("?") >= 0 ? "&" : "?";
      var url = this.my_options.ajax_url + sep + args;
      return url;
    },

    marshalId: function marshalId(id) {
      if (this.my_options.id_type == "string") {
        return typeof id == "string" ? id : String(id);
      }
      return typeof id == "number" ? id : Number(id) || 0;
    },

    printAttrs: function printAttrs() {
      var htmlentities = function(str) {
        return String(str)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;");
      };

      /* eslint-disable */
      var html = "<ul>";
      html += "<li>my_options:<ul>";
      html += "<li>debug: " + htmlentities(this.my_options.debug) + "</li>";
      html += "<li>ajax_url: " + htmlentities(this.my_options.ajax_url) + "</li>";
      html += "<li>id_type: " + htmlentities(this.my_options.id_type) + "</li>";
      html += "<li>alt_id_type: " + htmlentities(this.my_options.alt_id_type) + "</li>";
      html += "<li>allow_clear: " + htmlentities(this.my_options.allow_clear) + "</li>";
      html += "<li>placeholder_label: " + htmlentities(this.my_options.placeholder_label) + "</li>";
      html += "</ul></li>";

      html += "<li>placeholder_id: " + htmlentities(this.placeholder_id) + "</li>";
      html += "<li>placeholder_alt_id: " + htmlentities(this.placeholder_alt_id) + "</li>";
      html += "<li>search: " + htmlentities(this.search) + "</li>";
      html += "<li>label: " + htmlentities(this.label) + "</li>";
      html += "<li>inSearchMode: " + htmlentities(this.inSearchMode) + "</li>";
      html += "<li>matches.length: " + htmlentities(this.matches.length) + "</li>";
      html += "<li>activeMatchIdx: " + htmlentities(this.activeMatchIdx) + "</li>";

      html += "</ul>";
      /* eslint-enable */

      return html;
    }
  }
};function normalizeComponent(template, style, script, scopeId, isFunctionalTemplate, moduleIdentifier /* server only */, shadowMode, createInjector, createInjectorSSR, createInjectorShadow) {
    if (typeof shadowMode !== 'boolean') {
        createInjectorSSR = createInjector;
        createInjector = shadowMode;
        shadowMode = false;
    }
    // Vue.extend constructor export interop.
    var options = typeof script === 'function' ? script.options : script;
    // render functions
    if (template && template.render) {
        options.render = template.render;
        options.staticRenderFns = template.staticRenderFns;
        options._compiled = true;
        // functional template
        if (isFunctionalTemplate) {
            options.functional = true;
        }
    }
    // scopedId
    if (scopeId) {
        options._scopeId = scopeId;
    }
    var hook;
    if (moduleIdentifier) {
        // server build
        hook = function (context) {
            // 2.3 injection
            context =
                context || // cached call
                    (this.$vnode && this.$vnode.ssrContext) || // stateful
                    (this.parent && this.parent.$vnode && this.parent.$vnode.ssrContext); // functional
            // 2.2 with runInNewContext: true
            if (!context && typeof __VUE_SSR_CONTEXT__ !== 'undefined') {
                context = __VUE_SSR_CONTEXT__;
            }
            // inject component styles
            if (style) {
                style.call(this, createInjectorSSR(context));
            }
            // register component module identifier for async chunk inference
            if (context && context._registeredComponents) {
                context._registeredComponents.add(moduleIdentifier);
            }
        };
        // used by ssr in case component is cached and beforeCreate
        // never gets called
        options._ssrRegister = hook;
    }
    else if (style) {
        hook = shadowMode
            ? function (context) {
                style.call(this, createInjectorShadow(context, this.$root.$options.shadowRoot));
            }
            : function (context) {
                style.call(this, createInjector(context));
            };
    }
    if (hook) {
        if (options.functional) {
            // register for functional component in vue file
            var originalRender = options.render;
            options.render = function renderWithStyleInjection(h, context) {
                hook.call(context);
                return originalRender(h, context);
            };
        }
        else {
            // inject component registration as beforeCreate hook
            var existing = options.beforeCreate;
            options.beforeCreate = existing ? [].concat(existing, hook) : [hook];
        }
    }
    return script;
}/* script */
var __vue_script__ = script;

/* template */
var __vue_render__ = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"ajax-combobox",staticStyle:{"padding":"0","border":"none"}},[_vm._ssrNode("<div class=\"input-group\" style=\"margin:0; padding:0;\"><input type=\"text\""+(_vm._ssrAttr("placeholder",_vm.label))+(_vm._ssrAttr("readonly",_vm.my_readonly))+(_vm._ssrAttr("disabled",_vm.my_disabled))+" autocomplete=\"off\" autocorrect=\"off\" autocapitalize=\"none\""+(_vm._ssrAttr("value",(_vm.search_computed)))+" class=\"ajax-combobox-search-input form-control\" style=\"margin:0; padding:0;\"> "+((
          _vm.my_options.allow_clear &&
            !_vm.my_readonly &&
            !_vm.my_disabled &&
            !_vm.isPlaceholderId()
        )?("<div class=\"ajax-combobox-clear-button-container input-group-append\"><button tabindex=\"-1\" class=\"ajax-combobox-clear-button btn btn-default\"><i class=\"fa fa-times-circle-o\"></i></button></div>"):"<!---->")+" <div class=\"input-group-append ajax-combobox-toggle-button-container\"><button tabindex=\"-1\""+(_vm._ssrAttr("disabled",_vm.my_readonly || _vm.my_disabled))+" class=\"ajax-combobox-toggle-button btn btn-default\"><i class=\"fa fa-chevron-down\"></i></button></div></div> "+((_vm.my_options.debug)?("<div>"+(_vm._s(_vm.printAttrs()))+"</div>"):"<!---->")+" <div"+(_vm._ssrClass("ajax-combobox-dropdown dropdown",_vm.matches.length > 0 ? 'show' : ''))+"><div"+(_vm._ssrClass("ajax-combobox-dropdown-menu dropdown-menu",_vm.matches.length > 0 ? 'show' : ''))+">"+(_vm._ssrList((_vm.matches),function(item,itemidx){return ("<a tabindex=\"-1\" href=\"#\""+(_vm._ssrClass("ajax-combobox-dropdown-item dropdown-item",itemidx == _vm.activeMatchIdx ? 'active bg-primary text-light' : ''))+">"+_vm._ssrEscape("\n          "+_vm._s(item.label)+"\n        ")+"</a>")}))+"</div></div>")])};
var __vue_staticRenderFns__ = [];

  /* style */
  var __vue_inject_styles__ = undefined;
  /* scoped */
  var __vue_scope_id__ = undefined;
  /* module identifier */
  var __vue_module_identifier__ = "data-v-619522db";
  /* functional template */
  var __vue_is_functional_template__ = false;
  /* style inject */
  
  /* style inject SSR */
  
  /* style inject shadow dom */
  

  
  var component = normalizeComponent(
    { render: __vue_render__, staticRenderFns: __vue_staticRenderFns__ },
    __vue_inject_styles__,
    __vue_script__,
    __vue_scope_id__,
    __vue_is_functional_template__,
    __vue_module_identifier__,
    false,
    undefined,
    undefined,
    undefined
  );// Import vue component

// install function executed by Vue.use()
function install(Vue) {
  if (install.installed) { return; }
  install.installed = true;
  Vue.component('AjaxCombobox', component);
}

// Create module definition for Vue.use()
var plugin = {
  install: install,
};

// To auto-install when vue is found
/* global window global */
var GlobalVue = null;
if (typeof window !== 'undefined') {
  GlobalVue = window.Vue;
} else if (typeof global !== 'undefined') {
  GlobalVue = global.Vue;
}
if (GlobalVue) {
  GlobalVue.use(plugin);
}

// Inject install function into component - allows component
// to be registered via Vue.use() as well as Vue.component()
component.install = install;

// It's possible to expose named exports when writing components that can
// also be used as directives, etc. - eg. import { RollupDemoDirective } from 'rollup-demo';
// export const RollupDemoDirective = component;
exports.default=component;