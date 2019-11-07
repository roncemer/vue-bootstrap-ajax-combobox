import t from"axios";var e=function(t,e,i,o,a,s,n,r,l,d){"boolean"!=typeof n&&(l=r,r=n,n=!1);var h,c="function"==typeof i?i.options:i;if(t&&t.render&&(c.render=t.render,c.staticRenderFns=t.staticRenderFns,c._compiled=!0,a&&(c.functional=!0)),o&&(c._scopeId=o),s?(h=function(t){(t=t||this.$vnode&&this.$vnode.ssrContext||this.parent&&this.parent.$vnode&&this.parent.$vnode.ssrContext)||"undefined"==typeof __VUE_SSR_CONTEXT__||(t=__VUE_SSR_CONTEXT__),e&&e.call(this,l(t)),t&&t._registeredComponents&&t._registeredComponents.add(s)},c._ssrRegister=h):e&&(h=n?function(t){e.call(this,d(t,this.$root.$options.shadowRoot))}:function(t){e.call(this,r(t))}),h)if(c.functional){var p=c.render;c.render=function(t,e){return h.call(e),p(t,e)}}else{var u=c.beforeCreate;c.beforeCreate=u?[].concat(u,h):[h]}return i}({render:function(){var t=this,e=t.$createElement,i=t._self._c||e;return i("div",{staticClass:"ajax-combobox",staticStyle:{padding:"0",border:"none"}},[i("div",{staticClass:"input-group",staticStyle:{margin:"0",padding:"0"}},[i("input",{directives:[{name:"model",rawName:"v-model.trim",value:t.search_computed,expression:"search_computed",modifiers:{trim:!0}}],ref:"search",staticClass:"ajax-combobox-search-input form-control",staticStyle:{margin:"0",padding:"0"},attrs:{type:"text",placeholder:t.label,readonly:t.my_readonly,disabled:t.my_disabled,autocomplete:"off",autocorrect:"off",autocapitalize:"none"},domProps:{value:t.search_computed},on:{focus:t.searchFocused,blur:[t.searchBlurred,function(e){return t.$forceUpdate()}],keydown:t.searchKeyDown,input:function(e){e.target.composing||(t.search_computed=e.target.value.trim())}}}),t._v(" "),!t.my_options.allow_clear||t.my_readonly||t.my_disabled||t.isPlaceholderId()?t._e():i("div",{staticClass:"ajax-combobox-clear-button-container input-group-append"},[i("button",{staticClass:"ajax-combobox-clear-button btn btn-default",attrs:{tabindex:"-1"},on:{click:function(e){return e.stopPropagation(),e.preventDefault(),t.clearButtonClicked()}}},[i("i",{staticClass:"fa fa-times-circle-o"})])]),t._v(" "),i("div",{staticClass:"input-group-append ajax-combobox-toggle-button-container"},[i("button",{staticClass:"ajax-combobox-toggle-button btn btn-default",attrs:{tabindex:"-1",disabled:t.my_readonly||t.my_disabled},on:{click:function(e){return e.stopPropagation(),e.preventDefault(),t.chevronDownClicked()}}},[i("i",{staticClass:"fa fa-chevron-down"})])])]),t._v(" "),t.my_options.debug?i("div",{domProps:{innerHTML:t._s(t.printAttrs())}}):t._e(),t._v(" "),i("div",{staticClass:"ajax-combobox-dropdown dropdown",class:t.matches.length>0?"show":""},[i("div",{staticClass:"ajax-combobox-dropdown-menu dropdown-menu",class:t.matches.length>0?"show":""},t._l(t.matches,(function(e,o){return i("a",{key:o,staticClass:"ajax-combobox-dropdown-item dropdown-item",class:o==t.activeMatchIdx?"active bg-primary text-light":"",attrs:{tabindex:"-1",href:"#"},on:{click:function(e){return e.stopPropagation(),e.preventDefault(),t.itemSelected(o)}}},[t._v("\n          "+t._s(e.label)+"\n        ")])})),0)])])},staticRenderFns:[]},void 0,{name:"AjaxCombobox",props:["value","options","readonly","disabled"],data:function(){return{my_options:{debug:!1,ajax_url:null,id_type:null,alt_id_type:null,allow_clear:null,placeholder_label:null},my_readonly:!1,my_disabled:!1,placeholder_id:null,placeholder_alt_id:null,localValue:this.value,skipLookupByIdFromValueChange:!1,search:"",label:"",inSearchMode:!1,matches:[],activeMatchIdx:-1,ajaxTimeout:null}},computed:{search_computed:{get:function(){return this.inSearchMode?this.search:this.label},set:function(t){this.inSearchMode&&(this.search=t)}},id:{get:function(){return this.localValue},set:function(t){this.localValue=t,this.$emit("input",t)}}},watch:{search:function(){""!=this.search&&this.triggerSearch()},value:function(){this.localValue=this.value},localValue:function(){this.skipLookupByIdFromValueChange?this.skipLookupByIdFromValueChange=!1:this.triggerLookupById()},options:{handler:function(){var t=this.updateMyOptionsFromParentOptions();t.indexOf("id_type")>=0&&("string"==this.my_options.id_type?"string"!=typeof this.id&&this.setIdWithoutTriggeringLookupById(0!=this.id?String(this.id):""):"number"!=typeof this.id&&this.setIdWithoutTriggeringLookupById(Number(this.id)||0)),(t.indexOf("id_type")>=0||t.indexOf("allow_clear")>=0||t.indexOf("placeholder_label")>=0)&&this.isPlaceholderId(!0)&&(this.enterIdleState(),this.label=this.my_options.placeholder_label)},deep:!0},readonly:function(){this.updateMyReadonlyFromProp(),this.my_readonly&&this.enterIdleState()},disabled:function(){this.updateMyDisabledFromProp(),this.enterIdleState()}},created:function(){this.updateMyOptionsFromParentOptions(),this.updateMyReadonlyFromProp(),this.updateMyDisabledFromProp(),this.triggerLookupById()},methods:{searchFocused:function(){this.inSearchMode=!0},searchBlurred:function(t){t&&t.relatedTarget&&(t.relatedTarget.classList.contains("ajax-combobox")||t.relatedTarget.classList.contains("ajax-combobox-clear-button")||t.relatedTarget.classList.contains("ajax-combobox-toggle-button")||t.relatedTarget.classList.contains("ajax-combobox-dropdown-item"))||(""!=this.my_options.alt_id_type&&this.inSearchMode&&""!=this.search?(this.clearTrigger(),this.doLookupByAltId()):setTimeout(function(){this.enterIdleState()}.bind(this),300))},searchKeyDown:function(t){if(!this.my_readonly&&!this.my_disabled&&!(t.shiftKey||t.ctrlKey||t.altKey||t.metaKey))switch(t.key){case"ArrowUp":t.preventDefault(),t.stopPropagation(),this.matches.length>0?(this.activeMatchIdx--,this.activeMatchIdx<0&&(this.activeMatchIdx=this.matches.length-1)):this.activeMatchIdx=-1;break;case"ArrowDown":t.preventDefault(),t.stopPropagation(),this.matches.length>0?(this.activeMatchIdx++,this.activeMatchIdx>=this.matches.length&&(this.activeMatchIdx=0)):this.activeMatchIdx=-1;break;case"Enter":this.inSearchMode&&(this.activeMatchIdx>=0&&this.activeMatchIdx<this.matches.length?(t.preventDefault(),t.stopPropagation(),this.itemSelected(this.activeMatchIdx)):""!=this.my_options.alt_id_type&&""!=this.search&&(this.clearTrigger(),this.doLookupByAltId()),this.inSearchMode=!0);break;case"Escape":t.preventDefault(),t.stopPropagation(),this.inSearchMode?(this.enterIdleState(),this.inSearchMode=!0):this.enterIdleState()}},clearButtonClicked:function(){this.my_readonly||this.my_disabled||(this.setIdWithoutTriggeringLookupById(this.placeholder_id),this.label=this.my_options.placeholder_label,this.search="",this.clearMatches()),this.$refs.search.focus()},chevronDownClicked:function(){this.inSearchMode&&0!=this.matches.length?this.enterIdleState():this.my_readonly||this.my_disabled||(this.inSearchMode=!0,this.triggerSearch()),this.$refs.search.focus()},triggerSearch:function(){this.clearTrigger(),this.inSearchMode&&(this.ajaxTimeout=setTimeout(function(){this.doSearch()}.bind(this),300))},triggerLookupById:function(){this.clearTrigger(),this.ajaxTimeout=setTimeout(function(){this.doLookupById()}.bind(this),20)},clearTrigger:function(){null!==this.ajaxTimeout&&(clearTimeout(this.ajaxTimeout),this.ajaxTimeout=null)},itemSelected:function(t){if(t>=0&&t<this.matches.length){var e=this.matches[t];this.setIdWithoutTriggeringLookupById(this.marshalId(e.id)),this.label=e.label,this.enterIdleState()}},doSearch:function(){this.clearTrigger(),this.inSearchMode&&t.get(this.buildURL("q="+encodeURIComponent(this.search)),{responseType:"json"}).then(function(t){this.matches=t.data.matches,this.activeMatchIdx=-1}.bind(this)).catch(function(t){console.error(t)}.bind(this))},doLookupById:function(){if(this.isPlaceholderId(!0))return this.enterIdleState(),void(this.label=this.my_options.placeholder_label);t.get(this.buildURL("id="+encodeURIComponent(this.id)),{responseType:"json"}).then(function(t){this.isPlaceholderId()||t.data.id!=this.id&&t.data.id!=this.placeholder_id||(this.label=t.data.label)}.bind(this)).catch(function(t){console.error(t)}.bind(this))},doLookupByAltId:function(){var e=this.search;this.enterIdleState(),this.setIdWithoutTriggeringLookupById(this.placeholder_id),this.label=this.my_options.placeholder_label,t.get(this.buildURL("alt_id="+encodeURIComponent(e)),{responseType:"json"}).then(function(t){void 0!==t.data.id&&void 0!==t.data.label&&(this.setIdWithoutTriggeringLookupById(this.marshalId(t.data.id)),this.label=t.data.label,this.clearTrigger(),this.inSearchMode=!1)}.bind(this)).catch(function(t){console.error(t)}.bind(this))},enterIdleState:function(){this.inSearchMode=!1,this.search="",this.clearMatches(),this.clearTrigger(),this.isPlaceholderId(!0)&&(this.label=this.my_options.placeholder_label)},isPlaceholderId:function(t){return void 0===t&&(t=!1),(t||this.my_options.allow_clear)&&(this.id==this.placeholder_id||null===this.id)},clearMatches:function(){this.matches=[],this.activeMatchIdx=-1},setIdWithoutTriggeringLookupById:function(t){this.id!==t&&(this.skipLookupByIdFromValueChange=!0,this.id=t)},getParentOption:function(t){if("object"==typeof this.options)switch(t){case"debug":return"boolean"==typeof this.options.debug&&this.options.debug;case"ajax_url":return"string"==typeof this.options.ajax_url?this.options.ajax_url:"";case"id_type":return"string"!=typeof this.options.id_type||"number"!=this.options.id_type&&"string"!=this.options.id_type?"string"==typeof this.value?"string":"number":this.options.id_type;case"alt_id_type":return"string"!=typeof this.options.id_type||""!=this.options.id_type&&"number"!=this.options.id_type&&"string"!=this.options.id_type?"number":this.options.alt_id_type;case"allow_clear":return"boolean"==typeof this.options.allow_clear&&this.options.allow_clear;case"placeholder_label":return"string"==typeof this.options.placeholder_label?this.options.placeholder_label:""}return null},updateMyOptionsFromParentOptions:function(){var t=[];for(var e in this.my_options){var i=this.getParentOption(e);this.my_options[e]!=i&&(this.my_options[e]=i,t.push(e))}return this.placeholder_id="string"==this.my_options.id_type?"":0,""==this.my_options.alt_id_type?this.placeholder_alt_id=null:"string"==this.my_options.alt_id_type?this.placeholder_alt_id="":this.placeholder_alt_id=0,t},updateMyReadonlyFromProp:function(){this.my_readonly=this.calcReadonlyOrDisabledFromProp("readonly")},updateMyDisabledFromProp:function(){this.my_disabled=this.calcReadonlyOrDisabledFromProp("disabled")},calcReadonlyOrDisabledFromProp:function(t){switch(typeof this[t]){case"undefined":return!1;case"boolean":return this[t];case"string":return!0}},buildURL:function(t){var e=this.my_options.ajax_url.indexOf("?")>=0?"&":"?";return this.my_options.ajax_url+e+t},marshalId:function(t){return"string"==this.my_options.id_type?"string"==typeof t?t:String(t):"number"==typeof t?t:Number(t)||0},printAttrs:function(){var t=function(t){return String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")},e="<ul>";return e+="<li>my_options:<ul>",e+="<li>debug: "+t(this.my_options.debug)+"</li>",e+="<li>ajax_url: "+t(this.my_options.ajax_url)+"</li>",e+="<li>id_type: "+t(this.my_options.id_type)+"</li>",e+="<li>alt_id_type: "+t(this.my_options.alt_id_type)+"</li>",e+="<li>allow_clear: "+t(this.my_options.allow_clear)+"</li>",e+="<li>placeholder_label: "+t(this.my_options.placeholder_label)+"</li>",e+="</ul></li>",e+="<li>placeholder_id: "+t(this.placeholder_id)+"</li>",e+="<li>placeholder_alt_id: "+t(this.placeholder_alt_id)+"</li>",e+="<li>search: "+t(this.search)+"</li>",e+="<li>label: "+t(this.label)+"</li>",e+="<li>inSearchMode: "+t(this.inSearchMode)+"</li>",e+="<li>matches.length: "+t(this.matches.length)+"</li>",e+="<li>activeMatchIdx: "+t(this.activeMatchIdx)+"</li>",e+="</ul>"}}},void 0,!1,void 0,!1,void 0,void 0,void 0);function i(t){i.installed||(i.installed=!0,t.component("AjaxCombobox",e))}var o={install:i},a=null;"undefined"!=typeof window?a=window.Vue:"undefined"!=typeof global&&(a=global.Vue),a&&a.use(o),e.install=i;export default e;
