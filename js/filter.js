asanaModule.filter("nameInitials", function () {
    return function (input, base) {
        var words = input.split(" ");
        return words.reduce(function (total, value) {
            return total += value.charAt(0);
        }, "");
    };
});