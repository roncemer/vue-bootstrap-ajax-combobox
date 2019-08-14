/*
vue-bootstrap-ajax-combobox.js

AJAX Combobox autocomplete component for Vue.js 2.x and Bootstrap 4.


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
*/

Vue.component(
    'ajax-combobox',
    {
        props:['value', 'options', 'readonly', 'disabled'],

        template:
'<div class="ajax-combobox" style="padding:0; border:none;">'+"\n"+
' <div class="input-group" style="margin:0; padding:0;">'+"\n"+
'  <input type="text" ref="search" class="ajax-combobox-search-input form-control" v-bind:placeholder="label" v-bind:readonly="my_readonly" v-bind:disabled="my_disabled" v-on:focus="searchFocused" v-on:blur="searchBlurred" autocomplete="off" autocorrect="off" autocapitalize="none" v-on:keydown="searchKeyDown" v-model.trim="search_computed" style="margin:0; padding:0;"/>'+"\n"+
'  <div v-if="my_options.allow_clear && (!my_readonly) && (!my_disabled) && (!isPlaceholderId())" class="ajax-combobox-clear-button-container input-group-append"><button class="ajax-combobox-clear-button btn btn-default" tabindex="-1" v-on:click.stop.prevent="clearButtonClicked()"><i class="fa fa-times-circle-o"></i></button></div>'+"\n"+
'  <div class="input-group-append ajax-combobox-toggle-button-container"><button class="ajax-combobox-toggle-button btn btn-default" tabindex="-1" v-bind:disabled="my_readonly || my_disabled" v-on:click.stop.prevent="chevronDownClicked()"><i class="fa fa-chevron-down"></i></button></div>'+"\n"+
' </div> <!-- .input-group -->'+"\n"+
' <div v-if="my_options.debug" v-html="printAttrs()"></div>'+"\n"+
' <div class="ajax-combobox-dropdown dropdown" v-bind:class="(matches.length > 0) ? \'show\' : \'\'">'+"\n"+
'  <div class="ajax-combobox-dropdown-menu dropdown-menu" v-bind:class="(matches.length > 0) ? \'show\' : \'\'">'+"\n"+
'   <a v-for="(item, itemidx) in matches" class="ajax-combobox-dropdown-item dropdown-item" v-bind:class="(itemidx == activeMatchIdx) ? \'active\' : \'\'" tabindex="-1" href="#" v-on:click.stop.prevent="itemSelected(itemidx)">{{item.label}}</a>'+"\n"+
'  </div> <!-- .dropdown-menu -->'+"\n"+
' </div> <!-- .dropdown -->'+"\n"+
'</div> <!-- .ajax-combobox -->'+"\n",

        data:function() {
            return {
                // Local copy of properties.
                my_options:{
                    debug:false,
                    ajax_url:null,
                    id_type:null,
                    alt_id_type:null,
                    allow_clear:null,
                    placeholder_label:null,
                },

                my_readonly:false,
                my_disabled:false,

                // Placeholder id and alternate id, derived from id_type and alt_id_type.
                placeholder_id:null,
                placeholder_alt_id:null,

                skipLookupByIdFromValueChange:false,
                search:'',
                label:'',
                inSearchMode:false,
                matches:[],
                activeMatchIdx:-1,
                ajaxTimeout:null,
            };
        },

        computed:{
            search_computed:{
                get:function() {
                    return this.inSearchMode ? this.search : this.label;
                },
                set:function(newValue) {
                    if (this.inSearchMode) this.search = newValue;
                }
            },

            id:{
                get:function() {
                    return this.value;
                },

                set:function(newValue) {
                    this.$emit('input', newValue);
                },
            }
        },

        watch:{
            search:function() {
                if (this.search != '') {
                    this.triggerSearch();
                }
            },

            value:function() {
                if (!this.skipLookupByIdFromValueChange) {
                    this.triggerLookupById();
                } else {
                    this.skipLookupByIdFromValueChange = false;
                }
            },

            options:{
                handler:function() {
                    var changed = this.updateMyOptionsFromParentOptions();

                    // If id_type changed, marshal the value to the correct type.
                    if (changed.indexOf('id_type') >= 0) {
                        if (this.my_options.id_type == 'string') {
                            if (typeof(this.id) != 'string') {
                                this.setIdWithoutTriggeringLookupById((this.id != 0) ? String(this.id) : '');
                            }
                        } else {
                            if (typeof(this.id) != 'number') {
                                this.setIdWithoutTriggeringLookupById(Number(this.id) || 0);
                            }
                        }
                    }

                    // If id_type, allow_clear or placeholder_label changes, handle changes to the empty label.
                    if ((changed.indexOf('id_type') >= 0) ||
                        (changed.indexOf('allow_clear') >= 0) ||
                        (changed.indexOf('placeholder_label') >= 0)) {
                        if (this.isPlaceholderId(true)) {
                            this.enterIdleState();
                            this.label = this.my_options.placeholder_label;
                        }
                    }
                },
                deep:true,
            },

            readonly:function() {
                this.updateMyReadonlyFromProp();
                if (this.my_readonly) {
                    this.enterIdleState();
                }
            },

            disabled:function() {
                this.updateMyDisabledFromProp();
                this.enterIdleState();
                if (this.my_disabled) {
                    this.enterIdleState();
                }
            },
        },

        created:function() {
            this.updateMyOptionsFromParentOptions();
            this.updateMyReadonlyFromProp();
            this.updateMyDisabledFromProp();
            this.triggerLookupById();
        },

        methods:{
            searchFocused:function(evt) {
                this.inSearchMode = true;
            },

            searchBlurred:function(evt) {
                // Don't do anything if we're losing focus to one of our own components.
                if (evt && evt.relatedTarget &&
                    ((evt.relatedTarget.classList.contains('ajax-combobox-clear-button')) ||
                     (evt.relatedTarget.classList.contains('ajax-combobox-toggle-button')) ||
                     (evt.relatedTarget.classList.contains('ajax-combobox-dropdown-item')))) {
                    return;
                }

                // If the search element loses focus, but not to one of our buttons or one of the the
                // search results, and we have a search string and an alternate id type, do a lookup
                // by alternate id.
                if ((this.my_options.alt_id_type != '') && this.inSearchMode && (this.search != '')) {
                    this.clearTrigger();
                    this.doLookupByAltId();
                } else {
                    var thisvm = this;
                    setTimeout(
                        function() {
                            thisvm.enterIdleState();
                        },
                        300
                    );
                }
            },

            searchKeyDown:function(evt) {
                if (this.my_readonly || this.my_disabled) return;

                if ((!evt.shiftKey) && (!evt.ctrlKey) && (!evt.altKey) && (!evt.metaKey)) {
                    switch (evt.key) {
                    case 'ArrowUp':
                        evt.preventDefault();
                        evt.stopPropagation();
                        if (this.matches.length > 0) {
                            this.activeMatchIdx--;
                            if (this.activeMatchIdx < 0) this.activeMatchIdx = this.matches.length-1;
                        } else {
                            this.activeMatchIdx = -1;
                        }
                        break;
                    case 'ArrowDown':
                        evt.preventDefault();
                        evt.stopPropagation();
                        if (this.matches.length > 0) {
                            this.activeMatchIdx++;
                            if (this.activeMatchIdx >= this.matches.length) this.activeMatchIdx = 0;
                        } else {
                            this.activeMatchIdx = -1;
                        }
                        break;
                    case 'Enter':
                        if (this.inSearchMode) {
                            if ((this.activeMatchIdx >= 0) && (this.activeMatchIdx < this.matches.length)) {
                                evt.preventDefault();
                                evt.stopPropagation();
                                this.itemSelected(this.activeMatchIdx);
                            } else if ((this.my_options.alt_id_type != '') && (this.search != '')) {
                                this.clearTrigger();
                                this.doLookupByAltId();
                            }
                        }
                        break;
                    case 'Escape':
                        evt.preventDefault();
                        evt.stopPropagation();
                        this.enterIdleState();
                        break;
                    }
                }
            },

            clearButtonClicked:function() {
                if ((!this.my_readonly) && (!this.my_disabled)) {
                    this.setIdWithoutTriggeringLookupById(this.placeholder_id);
                    this.label = this.my_options.placeholder_label;
                    this.search = '';
                    this.clearMatches();
                }
                this.$refs.search.focus();
            },

            chevronDownClicked:function() {
                if ((!this.inSearchMode) || (this.matches.length == 0)) {
                    if ((!this.my_readonly) && (!this.my_disabled)) {
                        this.inSearchMode = true;
                        this.triggerSearch();
                    }
                } else {
                    this.enterIdleState();
                }
                this.$refs.search.focus();
            },

            triggerSearch:function() {
                this.clearTrigger();
                if (this.inSearchMode) {
                    var thisvm = this;
                    this.ajaxTimeout = setTimeout(
                        function() {
                            thisvm.doSearch();
                        },
                        300
                    );
                }
            },

            triggerLookupById:function() {
                this.clearTrigger();
                var thisvm = this;
                this.ajaxTimeout = setTimeout(
                    function() {
                        thisvm.doLookupById();
                    },
                    20
                );
            },

            clearTrigger:function() {
                if (this.ajaxTimeout !== null) {
                    clearTimeout(this.ajaxTimeout);
                    this.ajaxTimeout = null;
                }
            },

            itemSelected:function(idx) {
                if (typeof(evt) != 'undefined') evt.stopPropagation();
                if ((idx >= 0) && (idx < this.matches.length)) {
                    var match = this.matches[idx];
                    this.setIdWithoutTriggeringLookupById(this.marshalId(match.id));
                    this.label = match.label;
                    this.enterIdleState();
                }
            },

            doSearch:function() {
                this.clearTrigger();
                if (this.inSearchMode) {
                    var thisvm = this;
                    $.ajax({
                        url:this.buildURL('q='+encodeURIComponent(this.search)),
                        success:function(resp) {
                            thisvm.matches = resp.matches;
                            thisvm.activeMatchIdx = -1;
                        },
                        error:function(jqXHR, textStatus, errorThrown) {
                            console.error('HTTP request error; textStatus='+textStatus+'; errorThrown='+errorThrown);
                        },
                    });
                }
            },

            doLookupById:function() {
                if (this.isPlaceholderId(true)) {
                    this.enterIdleState();
                    this.label = this.my_options.placeholder_label;
                    return;
                }

                var thisvm = this;
                $.ajax({
                    url:this.buildURL('id='+encodeURIComponent(this.id)),
                    success:function(resp) {
                        if ((!thisvm.isPlaceholderId()) &&
                            ((resp.id == thisvm.id) || (resp.id == thisvm.placeholder_id))) {
                            thisvm.label = resp.label;
                        }
                    },
                    error:function(jqXHR, textStatus, errorThrown) {
                        thisvm.label = '*** SERVER ERROR ***';
                        console.error('HTTP request error; textStatus='+textStatus+'; errorThrown='+errorThrown);
                    },
                });
            },

            doLookupByAltId:function() {
                var search = this.search;

                this.enterIdleState();
                this.setIdWithoutTriggeringLookupById(this.placeholder_id);
                this.label = this.my_options.placeholder_label;

                var thisvm = this;
                $.ajax({
                    url:this.buildURL('alt_id='+encodeURIComponent(search)),
                    success:function(resp) {
                        thisvm.setIdWithoutTriggeringLookupById(thisvm.marshalId(resp.id));
                        thisvm.label = resp.label;
                        thisvm.clearTrigger();
                        thisvm.inSearchMode = false;
                    },
                    error:function(jqXHR, textStatus, errorThrown) {
                        thisvm.label = '*** SERVER ERROR ***';
                        console.error('HTTP request error; textStatus='+textStatus+'; errorThrown='+errorThrown);
                    },
                });
            },

            enterIdleState:function() {
                this.inSearchMode = false;
                this.search = '';
                this.clearMatches();
                this.clearTrigger();
            },

            isPlaceholderId:function(ignore_allow_clear) {
                if (typeof(ignore_allow_clear) == 'undefined') ignore_allow_clear = false;
                return (ignore_allow_clear || this.my_options.allow_clear) && ((this.id == this.placeholder_id) || (this.id === null));
            },

            clearMatches:function() {
                this.matches = [];
                this.activeMatchIdx = -1;
            },

            setIdWithoutTriggeringLookupById:function(new_id) {
                if (this.id !== new_id) {
                    this.skipLookupByIdFromValueChange = true;
                    this.id = new_id;
                }
            },

            getParentOption:function(optionName) {
                if (typeof(this.options) == 'object') {
                    switch (optionName) {
                    case 'debug':
                        if (typeof(this.options.debug) == 'boolean') {
                            return this.options.debug;
                        }
                        return false;
                    case 'ajax_url':
                        if (typeof(this.options.ajax_url) == 'string') {
                            return this.options.ajax_url;
                        }
                        return '';
                    case 'id_type':
                        if ((typeof(this.options.id_type) == 'string') &&
                            ((this.options.id_type == 'number') || (this.options.id_type == 'string'))) {
                            return this.options.id_type;
                        }
                        if (typeof(this.value) == 'string') {
                            return 'string';
                        }
                        return 'number';
                    case 'alt_id_type':
                        if ((typeof(this.options.id_type) == 'string') &&
                            ((this.options.id_type == '') || (this.options.id_type == 'number') || (this.options.id_type == 'string'))) {
                            return this.options.alt_id_type;
                        }
                        return 'number';
                    case 'allow_clear':
                        if (typeof(this.options.allow_clear) == 'boolean') {
                            return this.options.allow_clear;
                        }
                        return false;
                    case 'placeholder_label':
                        if (typeof(this.options.placeholder_label) == 'string') {
                            return this.options.placeholder_label;
                        }
                        return '';
                    }
                }
                return null;
            },

            // Returns an array of the options in my_options which were updated from the parent options.
            updateMyOptionsFromParentOptions:function() {
                changed = [];
                for (var vn in this.my_options) {
                    var val = this.getParentOption(vn);
                    if (this.my_options[vn] != val) {
                        this.my_options[vn] = val;
                        changed.push(vn);
                    }
                }

                // Calculate placeholder id and alt id based on the type options.
                this.placeholder_id = (this.my_options.id_type == 'string') ? '' : 0;
                if (this.my_options.alt_id_type == '') {
                    this.placeholder_alt_id = null;
                } else if (this.my_options.alt_id_type == 'string') {
                    this.placeholder_alt_id = '';
                } else {
                    this.placeholder_alt_id = 0;
                }

                return changed;
            },

            updateMyReadonlyFromProp:function() {
                this.my_readonly = this.calcReadonlyOrDisabledFromProp('readonly');
            },

            updateMyDisabledFromProp:function() {
                this.my_disabled = this.calcReadonlyOrDisabledFromProp('disabled');
            },

            calcReadonlyOrDisabledFromProp(propname) {
                switch (typeof(this[propname])) {
                case 'undefined': return false;
                case 'boolean': return this[propname];
                case 'string': return true;
                }
            },

            buildURL:function(args) {
                var sep = (this.my_options.ajax_url.indexOf('?') >= 0) ? '&' : '?';
                var url = this.my_options.ajax_url+sep+args;
                return url;
            },

            marshalId:function(id) {
                if (this.my_options.id_type == 'string') {
                    return (typeof(id) == 'string') ? id : String(id);
                }
                return (typeof(id) == 'number') ? id : (Number(id) || 0);
            },

            printAttrs:function() {
                var htmlentities = function(str) {
                    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
                }

                var html = '<ul>';
                html += '<li>my_options:<ul>';
                html += '<li>debug: '+htmlentities(this.my_options.debug)+'</li>';
                html += '<li>ajax_url: '+htmlentities(this.my_options.ajax_url)+'</li>';
                html += '<li>id_type: '+htmlentities(this.my_options.id_type)+'</li>';
                html += '<li>alt_id_type: '+htmlentities(this.my_options.alt_id_type)+'</li>';
                html += '<li>allow_clear: '+htmlentities(this.my_options.allow_clear)+'</li>';
                html += '<li>placeholder_label: '+htmlentities(this.my_options.placeholder_label)+'</li>';
                html += '</ul></li>';

                html += '<li>placeholder_id: '+htmlentities(this.placeholder_id)+'</li>';
                html += '<li>placeholder_alt_id: '+htmlentities(this.placeholder_alt_id)+'</li>';
                html += '<li>search: '+htmlentities(this.search)+'</li>';
                html += '<li>label: '+htmlentities(this.label)+'</li>';
                html += '<li>inSearchMode: '+htmlentities(this.inSearchMode)+'</li>';
                html += '<li>matches.length: '+htmlentities(this.matches.length)+'</li>';
                html += '<li>activeMatchIdx: '+htmlentities(this.activeMatchIdx)+'</li>';

                html += '</ul>';
                return html;
            },
        },
    }
);
