(function() {
    var defaultPlaceholderLabel = '(Select a State)';

    var vm = new Vue({
        el:'#ajax-combobox-demo-app',

        data:{
            state_id:0,
            ajax_combobox_options:{
                debug:false,
                ajax_url:'state-autocomplete.php',
                allow_clear:true,
                id_type:'number',
                alt_id_type:'string',
                placeholder_label:defaultPlaceholderLabel,
            }
        },

        methods:{
            toggle_id_type:function() {
                if (this.ajax_combobox_options.id_type == 'number') {
                    this.ajax_combobox_options.id_type = 'string';
                } else {
                    this.ajax_combobox_options.id_type = 'number';
                }
            },

            toggle_allow_clear:function() {
                this.ajax_combobox_options.allow_clear = !this.ajax_combobox_options.allow_clear;
            },

            toggle_placeholder_label:function() {
                this.ajax_combobox_options.placeholder_label = (this.ajax_combobox_options.placeholder_label == defaultPlaceholderLabel) ? 'BLEH!' : defaultPlaceholderLabel;
            },

            toggle_debug:function() {
                this.ajax_combobox_options.debug = !this.ajax_combobox_options.debug;
            },

        },
    });
})();
