angular.module("ChromeExtension", [])
    .service("ChromeExtensionService", [function () {
    var ChromeExtension = this;

    ChromeExtension.openLink = function (url) {
        chrome.tabs.create({url: url}, function () {
            window.close();
        });
    };

    ChromeExtension.openLinkInTab = function (url, tab) {
        chrome.tabs.update(tab.id, {url: url});
    };

    ChromeExtension.getCurrentTab = function (callback) {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            callback(tabs[0]);
        });
    };

    ChromeExtension.getClientName = function () {
        // Be polite to Asana API and tell them who we are.
        var manifest = chrome.runtime.getManifest();
        var client_name = [
            "chrome-extension",
            chrome.i18n.getMessage("@@extension_id"),
            manifest.version,
            manifest.name
        ].join(":");
        return client_name;
    };

    ChromeExtension.getCookie = function (url, cookieName, callback) {
        chrome.cookies.get({
            url: url,
            name: cookieName
        }, function (cookie) {
            if(callback)
                callback(cookie);
        });
    };

    ChromeExtension.setBrowserActionBadgeText = function (value) {
        chrome.browserAction.setBadgeText({text: value});
    };

    ChromeExtension.setBrowserActionBadgeBGColor = function (value) {
        chrome.browserAction.setBadgeBackgroundColor({color: value});
    };

    ChromeExtension.onCookieChange = function (callback) {
        chrome.cookies.onChanged.addListener(callback);
    };

    ChromeExtension.onCommand = function (action, callback) {
        chrome.commands.onCommand.addListener(function (command) {
            if(command === action)
                callback();
        });
    };

    ChromeExtension.enableBrowserAction = function () {
        chrome.browserAction.enable();
    };

    ChromeExtension.openPanel = function (url, height, width) {
        if(!angular.isDefined(height)){
            height=screen.height;
        }
        if(!angular.isDefined(width)){
            width=screen.width;
        }
        var left = Math.floor(screen.width/2 - width/2);
        var top = Math.floor(screen.height/2 - height/2);
        chrome.windows.create({
            url: url,
            left: left, top: top, width: width, height: height,
            focused: true, type: "panel"
        });
    };

    ChromeExtension.onInstall = function (callback) {
        chrome.runtime.onInstalled.addListener(function(details){
            if(details.reason === "install")
                callback();
        });
    };

    ChromeExtension.onUpdate = function (callback) {
        chrome.runtime.onInstalled.addListener(function(details){
            if(details.reason === "update")
                callback();
        });
    }
}]);