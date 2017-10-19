angular.module("asanabg").run(
    ['AsanaConstants', 'AsanaGateway', "ChromeExtension", "$timeout", "$q",
        function (AsanaConstants, AsanaGateway, ChromeExtension, $timeout, $q) {
    ChromeExtension.setBrowserActionBadgeText("NG");
    ChromeExtension.setBrowserActionBadgeBGColor("#FC636B");

    ChromeExtension.getCookie(AsanaConstants.getBaseApiUrl(),
        AsanaConstants.ASANA_LOGIN_COOKIE_NAME,
        function (cookie) {
            var loggedIn = !!(cookie && cookie.value);
            AsanaConstants.setLoggedIn(loggedIn);
        }
    );

    ChromeExtension.onCookieChange(function (changeInfo) {
        if (AsanaConstants.isAsanaDomain(changeInfo.cookie.domain) && AsanaConstants.isAsanaLoginCookie(changeInfo.cookie.name)) {
            AsanaConstants.setLoggedIn(!changeInfo.removed);
        }
    });

    ChromeExtension.onCommand("_execute_browser_action", function () {
        ChromeExtension.enableBrowserAction();
    });

    ChromeExtension.onInstall(function () {
        ChromeExtension.openLink("info.html");
    });

    function resetDefaultSuggestion() {
        chrome.omnibox.setDefaultSuggestion({
            description: "AsanaNG: Search your Asana task/section/project/user/tag"
        });
    }

    function showLoginMessage() {
        chrome.omnibox.setDefaultSuggestion({
            description: "Asana: You are not logged in"
        });
    }

    var workspaces;
    var workspacePromise;
    chrome.omnibox.onInputStarted.addListener(function (){
        if(!AsanaConstants.isLoggedIn()){
            showLoginMessage();
            return;
        }
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
        if(!AsanaConstants.isLoggedIn()){
            showLoginMessage();
            return;
        }
        var suggestions = [];

        if (filterTextTimeout)
            $timeout.cancel(filterTextTimeout);

        filterTextTimeout = $timeout(function() {
            extracted(text, suggestions, suggest);
        }, 500);
    });

    chrome.omnibox.onInputEntered.addListener(function (url){
        ChromeExtension.getCurrentTab(function (tab) {
            ChromeExtension.openLinkInTab(url, tab);
        });
    });

    chrome.omnibox.onInputCancelled.addListener(function (){
        resetDefaultSuggestion();
    });

    function showAnalytics(projectId){
        var analyticsPage = chrome.runtime.getURL("analytics.html");
        var height = 189;
        var width = 411;
        var left = Math.floor(screen.width/2 - width/2);
        var top = Math.floor(screen.height/2 - height/2);
        chrome.windows.create({ url: analyticsPage + "?projectId=" +projectId,
            left: left, top: top, width: width, height: height, focused: true, type: "panel"
        });
    }

    chrome.runtime.onMessage.addListener(
        function (request, sender, sendResponse) {
            if(request.action == "projectAnalytics"){
                showAnalytics(request.projectId);
            }
        }
    );
}]);