asanaModule.run(['AsanaConstants', 'AsanaGateway', "ChromeExtensionService", "$timeout", "$q", function (AsanaConstants, AsanaGateway, ChromeExtensionService, $timeout, $q) {
    chrome.browserAction.setBadgeText({text: "  NG"});
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
        if(details.reason === "install")
            ChromeExtensionService.openLink("info.html");
    });

    function resetDefaultSuggestion() {
        chrome.omnibox.setDefaultSuggestion({
            description: "AsanaNG: Search your Asana task/section/project/user/tag"
        });
    }
    resetDefaultSuggestion();

    var workspaces;
    var workspacePromise;
    chrome.omnibox.onInputStarted.addListener(function (){
        console.log("On input started");
        workspacePromise = AsanaGateway.getWorkspaces().then(function (response) {
            workspaces = response;
            console.log("workspaces: " + JSON.stringify(workspaces));
        });
    });

    function extracted(text, suggestions, callback) {
        var promises = [];
        workspacePromise.then(function () {
            workspaces.forEach(function (workspace) {
                var categories = ["task", "project", "user", "tag"];
                categories.forEach(function (type) {
                    var options = {
                        type: type,
                        search_text: text,
                        workspace_id: workspace.id
                    };
                    console.log("Searching criteria: " + JSON.stringify(options));
                    var promise = AsanaGateway.search(options).then(function (response) {
                        console.log("Search API response: " + type + " - " + JSON.stringify(response));
                        if (response && response.length) {
                            response.forEach(function (task) {
                                var suggestion = {};
                                if(type === "task" && task.name.endsWith(":")){
                                    //task is a section - task ending in ":" are sections
                                    type = "section";
                                    task.name = task.name.replace(":", "");
                                }
                                suggestion.description = type.toUpperCase() + " - " + task.name;
                                if (task.projects && task.projects.length) {
                                    suggestion.content = AsanaConstants.getAsanaDomain() + "0/" + task.projects[0].id + "/" + task.id;
                                } else {
                                    //@todo - task without project - what should be the url?
                                    suggestion.content = AsanaConstants.getAsanaDomain() + "0/" + task.id + "/list";
                                }
                                suggestions.push(suggestion);
                                console.log("Next suggestion: " + JSON.stringify(suggestion));
                            });
                        }
                    });
                    promises.push(promise);
                });
            });
        }).then(function () {
            $q.all(promises).then(function () {
                console.log("All suggestions: " + JSON.stringify(suggestions));
                resetDefaultSuggestion();
                callback(suggestions);
            });
        });
    }

    var filterTextTimeout;
    chrome.omnibox.onInputChanged.addListener(function(text, suggest){
        console.log("omnibox text: " + text);
        console.log("scheduling search at: " + Date.now());
        var suggestions = [];

        if (filterTextTimeout)
            $timeout.cancel(filterTextTimeout);

        filterTextTimeout = $timeout(function() {
            console.log("Searching at: " + Date.now());
            extracted(text, suggestions, suggest);
        }, 500);
    });

    chrome.omnibox.onInputEntered.addListener(function (url, disposition){
        console.log("text: " + url);
        console.log("disposition: " + JSON.stringify(disposition));
        ChromeExtensionService.getCurrentTab(function (tab) {
            console.log("Opening in tab: " + JSON.stringify(tab));
            ChromeExtensionService.openLinkInTab(url, tab);
        });
    });

    chrome.omnibox.onInputCancelled.addListener(function (){
        resetDefaultSuggestion();
    });
}]);