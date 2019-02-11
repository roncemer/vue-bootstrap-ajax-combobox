# vue-bootstrap-ajax-combobox
AJAX Combobox autocomplete component for Vue.js 2.x and Bootstrap 4.

This component is designed and optimized around searching database tables and enabling user-friendly foreign key linkage between rows in a web-based, database-driven application.

# Installing

npm install vue-bootstrap-ajax-combobox


# Usage

```html
<script src="node_modules/vue-bootstrap-ajax-combobox/dist/vue-bootstrap-ajax-combobox.js"></script>

<ajax-combobox v-model="state_id" v-bind:options="{ajax_url:'/state-autocomplete.php', allow_clear:true, id_type:'number', alt_id_type:'string', placeholder_label:'(Select a State)'}"/>
```
The options attribute must be a JavaScript object.  If it is dynamically bound using v-bind, options can be changed externally and the behavior of the combobox will be adjusted accordingly.

The ```html <ajax-combobox>``` element must be inside a Vue.js application or component element which has a Vue instance attached to it.

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

The backend REST API must always emit the following HTTP response header:
> Content-Type: application/json

The body of the response must always be JSON-encoded data.

When searching for matches for a user-entered search string, the **q** query string parameter will be passed to the backend REST API.  The API implementation is expected to find matching rows, and return an object containing an array of matches.  If **q** is empty, the backend REST API should return the first rows in the list or table, up to the maximum number of results the backend REST API is able to return.  A good maximum is somewhere between 10 and 20 rows, since all returned rows will be displayed in a drop-down list below the combobox component.  Each row in the returned array of matches must be an object with the following attributes:
* **id**: The primary key/unique identifier value for the row.
* **label**: The human-readable label/description which will be displayed in the combobox if the row is selected.
* **alt_id**: The optional alternate identifier for the row; only used when the **alt_id_type** option is enabled.

# Demo Page

For convenience, a demo app is included under the **demo** directory.  You need a webserver which is capable of running PHP scripts.  To see it in action, install this package somewhere under the document root of your web server, then point your browser to the **demo** directory (specfically, **demo/index.html**).  There are buttons for changing the various options, so you can get a better idea of how this component works.  The demo page searches a list of US states, by state name or abbreviation.  If the user enters a two-letter state abbreviation into the search box and either presses the **Enter** key, tabs out of the component, or otherwise causes the component to lose focus, it will try to look up the state abbreviation (the alternate id), and if it finds a match, will display the state name.

# Demo Backend REST API

The backend REST API is in **demo/state-autocomplete.php**.  This can be used as a starting point for writing your own REST API in order to use this component for searching database tables, or whatever source of list-based data you have which needs to be searched.  Let's have a look.

## List of states

The backend REST API script starts by listing out the US states, their two-letter abbreviations, and an auto-incrementing numeric Id for each state.
```php
<?php

$STATES = [
    (object)['id'=>1, 'abbr'=>'AL', 'name'=>'Alabama'],
...
    (object)['id'=>53, 'abbr'=>'WY', 'name'=>'Wyoming']
];
```
This is in lieu of an actual database table, and is simply for illustration and demo purposes.

The backend REST API must always return JSON-encoded data.
```php
header('Content-Type: application/json');
```

The **buildLabel()** convenience function simply puts a state abbreviation and state name together to form a human-readable label.
```php
function buildLabel($state) {
    return sprintf('%s: %s', $state->abbr, $state->name);
}
```

Now we get into the actual code which performs searches.  In each case, an object is populated into a PHP variable named **$result**.

First, we handle looking up a single row by its primary key/unique identifier.
```php
if (array_key_exists('id', $_GET)) {
    // Search for single state by id.
    $id = (int)trim($_GET['id']);
    $result = null;
    if ($id > 0) {
        foreach ($STATES as $state) {
            if ($state->id == $id) {
                $result = (object)['id'=>$state->id, 'alt_id'=>$state->abbr, 'label'=>buildLabel($state)];
                break;
            }
        }
    }
    if ($result === null) {
        $result = (object)['id'=>0, 'alt_id'=>'', 'label'=>sprintf('*** INVALID STATE ID: %d ***', $id)];
    }
```
Note that this always returns an object for a single row, with the **id**, **label**, and optional **alt_id** attributes for the matched row, or placeholder **id** and optional **alt_id** values and a "not found" error message for the **label** if the row was not found.

Next, we handle the optional case of looking up a single row by its alternate identifier.  This is only needed if the **alt_id_type** option is enabled.
```php
} else if (array_key_exists('alt_id', $_GET)) {
    // Search for single state by alt_id (state abbreviation).
    $alt_id = strtoupper(trim($_GET['alt_id']));
    $result = null;
    if ($alt_id != '') {
        foreach ($STATES as $state) {
            if ($state->abbr == $alt_id) {
                $result = (object)['id'=>$state->id, 'alt_id'=>$state->abbr, 'label'=>buildLabel($state)];
                break;
            }
        }
    }
    if ($result === null) {
        $result = (object)['id'=>0, 'alt_id'=>'', 'label'=>sprintf('*** INVALID STATE CODE: %s ***', $alt_id)];
    }
```

Finally, we handle the default case, which is searching the data for a list of matching rows, given the user-entered search string, and returning the first matches while limiting the number of rows we return to a reasonable number.
```php
} else {
    // Search for multiple states by id or abbreviation.
    $query = array_key_exists('q', $_GET) ? $_GET['q'] : '';
    $maxResults = 10;
    $result = (object)['matches'=>[]];
    foreach ($STATES as $state) {
        if (($query == '') ||
            (stripos($state->name, $query) !== false) ||
            (stripos($state->abbr, $query) !== false)) {
            $result->matches[] = (object)['id'=>$state->id, 'alt_id'=>$state->abbr, 'label'=>buildLabel($state)];
            if (count($result->matches) >= $maxResults) break;
        }
    }
}
```

In the end, we convert the result object to JSON and write it to the HTTP response body.
```php
echo json_encode($result);
```

That's all there is to creating a backend REST API for the AJAX Combobox autocomplete component.

Good luck, and happy coding!
