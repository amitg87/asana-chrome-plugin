chrome.runtime.onInstalled.addListener(function(details){
    if(details.reason == "install"){
        //plugin install initialize
    } else if(details.reason == "update"){
        //plugin update
    }
});

var ASANA_COOKIE_MANAGER = {
    init: function () {
        chrome.cookies.get({
            url: Asana.getBaseApiUrl(),
            name: Asana.ASANA_LOGIN_COOKIE_NAME
        }, function(cookie) {
            //console.log("asana cookie: " + JSON.stringify(cookie));
            var loggedIn = !!(cookie && cookie.value);
            Asana.setLoggedIn(loggedIn);
        });
        chrome.cookies.onChanged.addListener(function (changeInfo) {
            if(Asana.isAsanaDomain(changeInfo.cookie.domain)
                && Asana.isAsanaLoginCookie(changeInfo.cookie.name)){
                //console.log(JSON.stringify(changeInfo));
                Asana.setLoggedIn(!changeInfo.removed);
            }
        });
    }
};

ASANA_COOKIE_MANAGER.init();

chrome.commands.onCommand.addListener(function(command) {
    //console.log("Received command: ", command);
    chrome.browserAction.enable();
});
