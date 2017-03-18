asanaModule.run(['AsanaConstants', function (AsanaConstants) {
    chrome.browserAction.setBadgeText({text: "NG"});
    chrome.browserAction.setBadgeBackgroundColor({color: "#FC636B"});

    chrome.cookies.get({
        url: AsanaConstants.getBaseApiUrl(),
        name: AsanaConstants.ASANA_LOGIN_COOKIE_NAME
    }, function (cookie) {
        var loggedIn = !!(cookie && cookie.value);
        AsanaConstants.setLoggedIn(loggedIn);
    });

    chrome.cookies.onChanged.addListener(function (changeInfo) {
        if (AsanaConstants.isAsanaDomain(changeInfo.cookie.domain) && AsanaConstants.isAsanaLoginCookie(changeInfo.cookie.name)) {
            AsanaConstants.setLoggedIn(!changeInfo.removed);
        }
    });

    chrome.commands.onCommand.addListener(function (command) {
        if(command === "_execute_browser_action")
            chrome.browserAction.enable();
    });

    chrome.runtime.onInstalled.addListener(function(details){
        //chrome.tabs.create({url: "info.html"});
    });
}]);