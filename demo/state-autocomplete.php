<?php

$STATES = [
    (object)['id'=>1, 'abbr'=>'AL', 'name'=>'Alabama'],
    (object)['id'=>2, 'abbr'=>'AK', 'name'=>'Alaska'],
    (object)['id'=>3, 'abbr'=>'AZ', 'name'=>'Arizona'],
    (object)['id'=>4, 'abbr'=>'AR', 'name'=>'Arkansas'],
    (object)['id'=>5, 'abbr'=>'CA', 'name'=>'California'],
    (object)['id'=>6, 'abbr'=>'CO', 'name'=>'Colorado'],
    (object)['id'=>7, 'abbr'=>'CT', 'name'=>'Connecticut'],
    (object)['id'=>8, 'abbr'=>'DE', 'name'=>'Delaware'],
    (object)['id'=>9, 'abbr'=>'DC', 'name'=>'District of Columbia'],
    (object)['id'=>10, 'abbr'=>'FL', 'name'=>'Florida'],
    (object)['id'=>11, 'abbr'=>'GA', 'name'=>'Georgia'],
    (object)['id'=>12, 'abbr'=>'HI', 'name'=>'Hawaii'],
    (object)['id'=>13, 'abbr'=>'ID', 'name'=>'Idaho'],
    (object)['id'=>14, 'abbr'=>'IL', 'name'=>'Illnois'],
    (object)['id'=>15, 'abbr'=>'IN', 'name'=>'Indiana'],
    (object)['id'=>16, 'abbr'=>'IA', 'name'=>'Iowa'],
    (object)['id'=>17, 'abbr'=>'KS', 'name'=>'Kansas'],
    (object)['id'=>18, 'abbr'=>'KY', 'name'=>'Kentucky'],
    (object)['id'=>19, 'abbr'=>'LA', 'name'=>'Louisiana'],
    (object)['id'=>20, 'abbr'=>'ME', 'name'=>'Maine'],
    (object)['id'=>21, 'abbr'=>'MD', 'name'=>'Maryland'],
    (object)['id'=>22, 'abbr'=>'MA', 'name'=>'Massachusetts'],
    (object)['id'=>23, 'abbr'=>'MI', 'name'=>'Michigan'],
    (object)['id'=>24, 'abbr'=>'MN', 'name'=>'Minnesota'],
    (object)['id'=>25, 'abbr'=>'MS', 'name'=>'Mississippi'],
    (object)['id'=>26, 'abbr'=>'MO', 'name'=>'Missouri'],
    (object)['id'=>27, 'abbr'=>'MT', 'name'=>'Montana'],
    (object)['id'=>28, 'abbr'=>'NE', 'name'=>'Nebraska'],
    (object)['id'=>29, 'abbr'=>'NV', 'name'=>'Nevada'],
    (object)['id'=>30, 'abbr'=>'NH', 'name'=>'New Hampshire'],
    (object)['id'=>31, 'abbr'=>'NJ', 'name'=>'New Jersey'],
    (object)['id'=>32, 'abbr'=>'NM', 'name'=>'New Mexico'],
    (object)['id'=>33, 'abbr'=>'NY', 'name'=>'New York'],
    (object)['id'=>34, 'abbr'=>'NC', 'name'=>'North Carolina'],
    (object)['id'=>35, 'abbr'=>'ND', 'name'=>'North Dakota'],
    (object)['id'=>36, 'abbr'=>'OH', 'name'=>'Ohio'],
    (object)['id'=>37, 'abbr'=>'OK', 'name'=>'Oklahoma'],
    (object)['id'=>38, 'abbr'=>'OR', 'name'=>'Oregon'],
    (object)['id'=>39, 'abbr'=>'PA', 'name'=>'Pennsylvania'],
    (object)['id'=>40, 'abbr'=>'PR', 'name'=>'Puerto Rico'],
    (object)['id'=>41, 'abbr'=>'RI', 'name'=>'Rhode Island'],
    (object)['id'=>42, 'abbr'=>'SC', 'name'=>'South Carolina'],
    (object)['id'=>43, 'abbr'=>'SD', 'name'=>'South Dakota'],
    (object)['id'=>44, 'abbr'=>'TN', 'name'=>'Tennessee'],
    (object)['id'=>45, 'abbr'=>'TX', 'name'=>'Texas'],
    (object)['id'=>46, 'abbr'=>'UT', 'name'=>'Utah'],
    (object)['id'=>47, 'abbr'=>'VT', 'name'=>'Vermont'],
    (object)['id'=>48, 'abbr'=>'VI', 'name'=>'Virgin Islands'],
    (object)['id'=>49, 'abbr'=>'VA', 'name'=>'Virginia'],
    (object)['id'=>50, 'abbr'=>'WA', 'name'=>'Washington'],
    (object)['id'=>51, 'abbr'=>'WV', 'name'=>'West Virginia'],
    (object)['id'=>52, 'abbr'=>'WI', 'name'=>'Wisconsin'],
    (object)['id'=>53, 'abbr'=>'WY', 'name'=>'Wyoming']
];

header('Content-Type: application/json');

function buildLabel($state) {
    return sprintf('%s: %s', $state->abbr, $state->name);
}

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

echo json_encode($result);
