<template>
  <!--
ajax-combobox.vue

AJAX Combobox autocomplete component for Vue.js >=2.5.16, Axios >=0.18.0, Font Awesome >=4.7.0, and Bootstrap >=4.3.1.

MIT License

Copyright (c) 2019 Ron Cemer

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
  -->
  <div class="ajax-combobox" style="padding:0; border:none;">
    <div class="input-group" style="margin:0; padding:0;">
      <input
        type="text"
        ref="search"
        class="ajax-combobox-search-input form-control"
        v-bind:placeholder="label"
        v-bind:readonly="my_readonly"
        v-bind:disabled="my_disabled"
        v-on:focus="searchFocused"
        v-on:blur="searchBlurred"
        autocomplete="off"
        autocorrect="off"
        autocapitalize="none"
        v-on:keydown="searchKeyDown"
        v-model.trim="search_computed"
        style="margin:0; padding:0;"
      />
      <div
        v-if="
          my_options.allow_clear &&
            !my_readonly &&
            !my_disabled &&
            !isPlaceholderId()
        "
        class="ajax-combobox-clear-button-container input-group-append"
      >
        <button
          class="ajax-combobox-clear-button btn btn-default"
          tabindex="-1"
          v-on:click.stop.prevent="clearButtonClicked()"
        >
          <i class="fa fa-times-circle-o"></i>
        </button>
      </div>
      <div class="input-group-append ajax-combobox-toggle-button-container">
        <button
          class="ajax-combobox-toggle-button btn btn-default"
          tabindex="-1"
          v-bind:disabled="my_readonly || my_disabled"
          v-on:click.stop.prevent="chevronDownClicked()"
        >
          <i class="fa fa-chevron-down"></i>
        </button>
      </div>
    </div>
    <!-- .input-group -->
    <div v-if="my_options.debug" v-html="printAttrs()"></div>
    <div
      class="ajax-combobox-dropdown dropdown"
      v-bind:class="matches.length > 0 ? 'show' : ''"
    >
      <div
        class="ajax-combobox-dropdown-menu dropdown-menu"
        v-bind:class="matches.length > 0 ? 'show' : ''"
      >
        <a
          v-for="(item, itemidx) in matches"
          v-bind:key="itemidx"
          class="ajax-combobox-dropdown-item dropdown-item"
          v-bind:class="
            itemidx == activeMatchIdx ? 'active bg-primary text-light' : ''
          "
          tabindex="-1"
          href="#"
          v-on:click.stop.prevent="itemSelected(itemidx)"
        >
          {{ item.label }}
        </a>
      </div>
      <!-- .dropdown-menu -->
    </div>
    <!-- .dropdown -->
  </div>
  <!-- .ajax-combobox -->
</template>

<script>
import axios from "axios";

export default {
  name: "AjaxComboboxTest",
  props: ["value", "options", "readonly", "disabled"],

  data() {
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
      ajaxTimeout: null,
      ajaxTimeoutTarget: ''
    };
  },

  computed: {
    search_computed: {
      get() {
        return this.inSearchMode ? this.search : this.label;
      },
      set(newValue) {
        if (this.inSearchMode) this.search = newValue;
      }
    },

    id: {
      get() {
        return this.localValue;
      },

      set(newValue) {
        this.localValue = newValue;
        this.$emit("input", newValue);
      }
    }
  },

  watch: {
    search() {
      if (this.search != "") {
        this.triggerSearch();
      }
    },

    value() {
      this.localValue = this.value;
      this.triggerLookupById();
    },

    localValue() {
      if (!this.skipLookupByIdFromValueChange) {
        this.triggerLookupById();
      } else {
        this.skipLookupByIdFromValueChange = false;
      }
    },

    options: {
      handler() {
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

    readonly() {
      this.updateMyReadonlyFromProp();
      if (this.my_readonly) {
        this.enterIdleState();
      }
    },

    disabled() {
      this.updateMyDisabledFromProp();
      this.enterIdleState();
    }
  },

  created() {
    this.updateMyOptionsFromParentOptions();
    this.updateMyReadonlyFromProp();
    this.updateMyDisabledFromProp();
    this.triggerLookupById();
  },

  methods: {
    searchFocused(/*evt*/) {
      this.inSearchMode = true;
    },

    searchBlurred(evt) {
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

    searchKeyDown(evt) {
      if (this.my_readonly || this.my_disabled) return;

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

    clearButtonClicked() {
      if (!this.my_readonly && !this.my_disabled) {
        this.setIdWithoutTriggeringLookupById(this.placeholder_id);
        this.label = this.my_options.placeholder_label;
        this.search = "";
        this.clearMatches();
      }
      this.$refs.search.focus();
    },

    chevronDownClicked() {
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

    triggerSearch() {
      this.clearTrigger();
      if (this.inSearchMode) {
        this.ajaxTimeoutTarget = 'doSearch';
        this.ajaxTimeout = setTimeout(
          function() {
            this.clearTrigger();
            this.doSearch();
          }.bind(this),
          300
        );
      }
    },

    triggerLookupById() {
      this.clearTrigger();
      this.ajaxTimeoutTarget = 'doLookupById';
      this.ajaxTimeout = setTimeout(
        function() {
          this.clearTrigger();
          this.doLookupById();
        }.bind(this),
        20
      );
    },

    clearTrigger() {
      this.ajaxTimeoutTarget = '';
      if (this.ajaxTimeout !== null) {
        clearTimeout(this.ajaxTimeout);
        this.ajaxTimeout = null;
      }
    },

    itemSelected(idx) {
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

    doSearch() {
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

    doLookupById() {
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

    doLookupByAltId() {
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
          this.inSearchMode = (this.$refs.search === document.activeElement);
        }
      }.bind(this))
      .catch(function(error) {
        console.error(error);
      }.bind(this));
      /* eslint-enable */
    },

    enterIdleState() {
      this.inSearchMode = (this.$refs.search === document.activeElement);
      this.search = "";
      this.clearMatches();
      if (this.ajaxTimeoutTarget != 'doLookupById') {
        this.clearTrigger();
      }
      if (this.isPlaceholderId(true)) {
        this.label = this.my_options.placeholder_label;
      }
    },

    isPlaceholderId(ignore_allow_clear) {
      if (typeof ignore_allow_clear == "undefined") {
        ignore_allow_clear = false;
      }
      return (
        (ignore_allow_clear || this.my_options.allow_clear) &&
        (this.id == this.placeholder_id || this.id === null)
      );
    },

    clearMatches() {
      this.matches = [];
      this.activeMatchIdx = -1;
    },

    setIdWithoutTriggeringLookupById(new_id) {
      if (this.id !== new_id) {
        this.skipLookupByIdFromValueChange = true;
        this.id = new_id;
        this.$emit("select", this.id);
      }
    },

    getParentOption(optionName) {
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
    updateMyOptionsFromParentOptions() {
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

    updateMyReadonlyFromProp() {
      this.my_readonly = this.calcReadonlyOrDisabledFromProp("readonly");
    },

    updateMyDisabledFromProp() {
      this.my_disabled = this.calcReadonlyOrDisabledFromProp("disabled");
    },

    calcReadonlyOrDisabledFromProp(propname) {
      switch (typeof this[propname]) {
        case "undefined":
          return false;
        case "boolean":
          return this[propname];
        case "string":
          return true;
      }
    },

    buildURL(args) {
      var sep = this.my_options.ajax_url.indexOf("?") >= 0 ? "&" : "?";
      var url = this.my_options.ajax_url + sep + args;
      return url;
    },

    marshalId(id) {
      if (this.my_options.id_type == "string") {
        return typeof id == "string" ? id : String(id);
      }
      return typeof id == "number" ? id : Number(id) || 0;
    },

    printAttrs() {
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
};
</script>
