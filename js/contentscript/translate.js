$(function () {
    var _DEBUG_ = true;

    var isUndefined = function (param) {
        return typeof param === 'undefined';
    };

    /**
     * Get an element by id.
     * @param  {String} id
     * @return {Object} The found element.
     */
    var id = function (id) {
        var element = document.getElementById(id);
        if (_DEBUG_ && element === null) {
            console.error('ID not found: ' + id);
        }
        return element;
    };

    /**
     * Quick and short function to get an element by selector.
     * @param  {String} cssSelector CSS selector.
     * @param  {Bool} firstElement Options, if true, returns just the first found element.
     * @return {Array} Array of found objects.
     */
    var sel = function (cssSelector, firstElement) {
        var elements;
        if (!isUndefined(firstElement) && firstElement === true) {
            elements = document.querySelector(cssSelector);
        } else {
            elements = document.querySelectorAll(cssSelector);
        }

        if (_DEBUG_ && ( elements === null || elements.length === 0 )) {
            console.error('Selector not found: ' + cssSelector);
        }
        return elements;
    };

    /**
     * Quick function to change text
     * @param  {Object} element The element to process.
     * @param  {String} string String to change.
     * @param  {String} property Property to change (text|placeholder). Text by default.
     * @return {Boolean} If property has been changed correctly or not.
     */
    var stringToElement = function (element, string, property) {
        if (isUndefined(element) || element === null) {
            return false;
        }

        // By default we change text, but we can also change for example placeholders (for inputs).
        if (isUndefined(property)) {
            property = 'text';
        }

        // Put a single element into an array.
        if (element !== null && element instanceof Element) {
            element = [element];
        }

        if (element.length > 0) { // We only update the text if we found the element
            var newValue = chrome.i18n.getMessage(string);
            if (newValue) { // If empty then no change
                for (var i = element.length - 1; i >= 0; i--) {
                    if (property === 'text') {
                        element[i].textContent = newValue;
                    } else if (property === 'placeholder') {
                        element[i].placeholder = newValue;
                    }
                }
            }
            return true;
        }
        return false;
    };

    /**
     * Changes the text of the elements replacing the occurrences of the json data.
     * Use this for multiple strings in the same element or for elements that have children and
     * don't have a good way to refer to the element to change.
     * @param {Object} strings { 'text to find': 'keyword_from_strings_file', ...}
     **/
    var replaceFromElement = function (element, strings) {
        if (isUndefined(element) || element === null) {
            return false;
        }

        if (element !== null && element instanceof Element) {
            element = [element];
        }

        if (element.length > 0) {
            for (var i = element.length - 1; i >= 0; i--) {
                var newHtml = element[i].innerHTML;
                for (var key in strings) {
                    if (strings.hasOwnProperty(key) && newHtml.indexOf(key) !== -1) {
                        newHtml = newHtml.replace(key, chrome.i18n.getMessage(strings[key]));
                    }
                }
                if (newHtml) { // If empty then no change.
                    element[i].innerHTML = newHtml;
                }
            }
            return true;
        }
        return false;
    };

    /**
     * Translates strings
     */
    var translate = function () {
        console.time('Asana translate:');

        stringToElement ( sel('.NavigationLink.topbar-myTasksButton', true), 'MyTasks', undefined);
        stringToElement ( sel('.NavigationLink.topbar-notificationsButton', true), 'INBOX', undefined);
        stringToElement ( sel('.NavigationLink.topbar-myDashboardButton', true), 'DASHBOARD', undefined);
        //stringToElement( sel( '.all-my-tasks-bar .label' ), 'LATER' );
        //replaceFromElement( sel( '.drop-indicator .expandable' ), { 'Today': 'Today', 'Upcoming': 'Upcoming', 'Later': 'Later' } );

        console.timeEnd('Asana translate:');
    };

    // This is the request that sends the background.js
    chrome.extension.onRequest.addListener(function () {
        translate();
    });
});