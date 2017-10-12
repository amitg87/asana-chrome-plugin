asanaModule.filter("nameInitials", function () {
    return function (input, base) {
        var words = input.split(" ");
        return words.reduce(function (total, value) {
            return total += value.charAt(0);
        }, "");
    };
}).filter('propertyFilter', function() {
    return function(items, props) {
        var out = [];
        if (angular.isArray(items)) {
            items.forEach(function(item) {
                var itemMatches = false;
                var keys = Object.keys(props);
                var optionValue = '';
                for (var i = 0; i < keys.length; i++) {
                    optionValue = item[keys[i]] ? optionValue + item[keys[i]].toString().toLowerCase().replace(/ /g, '') : '';
                }
                for (var j = 0; j < keys.length; j++) {
                    var text = props[keys[j]].toLowerCase().replace(/ /g, '');
                    if (optionValue.indexOf(text) !== -1) {
                        itemMatches = true;
                        break;
                    }
                }
                if (itemMatches) {
                    out.push(item);
                }
            });
        } else {
            // Let the output be the input untouched
            out = items;
        }

        return out;
    };
});