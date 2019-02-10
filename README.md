# vue-bootstrap-ajax-combobox
AJAX Combobox autocomplete component for Vue.js 2.x and Bootstrap 4.

# Installing

npm install vue-bootstrap-ajax-combobox


# Usage

```html
<ajax-combobox v-model="state_id" v-bind:options="{ajax_url:'/state-autocomplete.php', allow_clear:true, id_type:'number', alt_id_type:'string', placeholder_label:'(Select a State)'}"/>
```
The options attribute must be a JavaScript object.  If it is dynamically bound using v-bind, options can be changed externally and the behavior of the combobox will be adjusted accordingly.

# Supported properties:
* *v-model*: The model attribute in the parent which will receive the selected Id.  Required.
* *options*: A JavaScript object containing the options which controls how the component operates, and how it interacts with your backend REST API.  Required.

# Supported options:
* **debug**: Boolean, true to turn on a bunch of debugging output in the HTML template; false to turn debugging off.  Optional.  Defaults to false.
* **ajax_url**: The URL to the AJAX autocomplete.  See below.  Required.
* **id_type**: The type for the unique-identifying value (primary key) for the data being queried.  Must be either 'number' or 'string'.  If not specified, this defaults to the initial type of the v-model for this component.  Optional.
* **alt_id_type**: The type for an alternate, unique-identifying value which can be entered directly into the search box to locate a specific record.  For example, for US states, this could be the two-letter state abbreviation; for countries, it could be the two- or three-letter country code; for inventory items, it could be an item number or a UPC code.  The valid options are an empty string for no alternate identifier, 'string' for a string-type alternate identifier, and 'number' for a numeric-type alternate identifier.  Optional.  Defaults to empty (no alternate identifier).
* **allow_clear**: A boolean, true to allow the id value to be cleared (to zero if id_type='number', or to an empty string if id_type='string'); false to always require an Id value and generate an error message if it happens to be zero or empty.  Optional.  Defaults to false.
* **placeholder_label**: A placeholder label to show in the input when the value has been cleared.  Only used if allow_clear=true.

# Backend REST API

The **ajax_url** option points to a backend REST API which you would implement.  It can be called two or three ways, depending on whether you're using **alt_id_type**.  For each call to the backend REST API, one of three query string parameters will be passed:
* **q**: A user-entered search string; passed when we need to search for matching records and return a list of matches.
* **id**: A primary key indentifier for a single record; passed when we need to look up the label (textual description) and optional alternate Id for a single record.
* **alt_id**: An alternate identifier (such as a state abbreviation, a country code, or an inventory item number or UPC code) for a single record; passed when we need to look up a record by a user-entered alternate Id; only used when the **alt_id_type** option is enabled.
