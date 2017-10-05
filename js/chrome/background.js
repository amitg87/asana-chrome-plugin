asanaModule.run(['AsanaConstants', 'AsanaGateway', "ChromeExtensionService", "$timeout", "$q", function (AsanaConstants, AsanaGateway, ChromeExtensionService, $timeout, $q) {
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
        if(details.reason === "install")
            ChromeExtensionService.openLink("info.html");
    });

    function resetDefaultSuggestion() {
        chrome.omnibox.setDefaultSuggestion({
            description: "AsanaNG: Search your Asana task/section/project/user/tag"
        });
    }

    var workspaces;
    var workspacePromise;
    chrome.omnibox.onInputStarted.addListener(function (){
        resetDefaultSuggestion();
        workspacePromise = AsanaGateway.getWorkspaces().then(function (response) {
            workspaces = response;
        });
    });

    function extracted(text, suggestions, callback) {
        var promises = [];
        workspacePromise.then(function () {
            workspaces.forEach(function (workspace) {
                //@todo "user" - not supported due to Asana limitation
                //https://community.asana.com/t/direct-link-to-users-tasks/9198/2
                var categories = ["task", "project", "tag"];
                categories.forEach(function (type) {
                    var options = {
                        type: type,
                        search_text: text,
                        workspace_id: workspace.id
                    };
                    var promise = AsanaGateway.search(options).then(function (response) {
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
                                    //@todo task without project not supported - what should be the url?
                                    suggestion.content = AsanaConstants.getAsanaDomain() + "0/" + task.id + "/list";
                                }
                                suggestions.push(suggestion);
                            });
                        }
                    });
                    promises.push(promise);
                });
            });
        }).then(function () {
            $q.all(promises).then(function () {
                resetDefaultSuggestion();
                callback(suggestions);
            });
        });
    }

    var filterTextTimeout;
    chrome.omnibox.onInputChanged.addListener(function(text, suggest){
        var suggestions = [];

        if (filterTextTimeout)
            $timeout.cancel(filterTextTimeout);

        filterTextTimeout = $timeout(function() {
            extracted(text, suggestions, suggest);
        }, 500);
    });

    chrome.omnibox.onInputEntered.addListener(function (url, disposition){
        ChromeExtensionService.getCurrentTab(function (tab) {
            ChromeExtensionService.openLinkInTab(url, tab);
        });
    });

    chrome.omnibox.onInputCancelled.addListener(function (){
        resetDefaultSuggestion();
    });
}]);