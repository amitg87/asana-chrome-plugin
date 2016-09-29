chrome.browserAction.setBadgeText({text: "NG"});
chrome.browserAction.setBadgeBackgroundColor({color: "#FC636B"});

chrome.cookies.get({
    url: Asana.getBaseApiUrl(),
    name: Asana.ASANA_LOGIN_COOKIE_NAME
}, function (cookie) {
    var loggedIn = !!(cookie && cookie.value);
    Asana.setLoggedIn(loggedIn);
});

chrome.cookies.onChanged.addListener(function (changeInfo) {
    if (Asana.isAsanaDomain(changeInfo.cookie.domain)
        && Asana.isAsanaLoginCookie(changeInfo.cookie.name)) {
        Asana.setLoggedIn(!changeInfo.removed);
    }
});

chrome.commands.onCommand.addListener(function (command) {
    chrome.browserAction.enable();
});

// Add listener for all ajax request so we can localize the changed strings

chrome.webRequest.onCompleted.addListener(function(details) {
    chrome.tabs.getSelected(null, function(tab) {
        chrome.tabs.sendRequest(tab.id, {}, function(){});
    });
}, {
    urls: [ "*://app.asana.com/*" ]
});