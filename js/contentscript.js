$(function () {
    console.log("Initializing Asana Translate");

    var notifyChanges = function (target, callback) {
        var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

        var observer = new MutationObserver(function(mutations) {
            [].forEach.call(mutations, function(mutation) {
                var addedNodes = mutation.addedNodes;
                //console.log("added node: " + addedNodes.length);
                [].forEach.call( addedNodes,function(addedNode){
                    callback(addedNode);
                });
            });
        });

        target.each(function () {
            observer.observe(this, {
                childList: true,
                subtree: true
            });
        });
    };

    //task editor - div id #right_pane_container
    //task list - div id #center_pane__contents
    //left gray area - div id #greyable-area-container
    //top bar - div class .remix-topbar

    var replaceHTML = function (baseNode, identifier, translate_id) {
        var element = $(baseNode).find(identifier);
        if(element.length > 0){
            var newMessage = chrome.i18n.getMessage(translate_id);
            console.trace("Replace " + element.html() + " by " + newMessage);
            if(newMessage !== ""){
                element.html(newMessage);
            }
        }
    };

    var replaceAttribute = function (baseNode, identifier, property, translate_id) {
        var element = $(baseNode).find(identifier);
        if(element.length > 0){
            var newMessage = chrome.i18n.getMessage(translate_id);
            console.trace("Replace attribute: "+ property + "  value from " + element.attr(property) + " to " + newMessage);
            if(newMessage !== ""){
                element.attr(property, newMessage);
            }
        }
    };

    var bodyContainerReplace = function (basenode) {
        var base = $(basenode);
        if(base.length == 0){
            return;
        }
        replaceHTML(basenode, "div.gridToolbar-button--addTask span.new-button-text", "add_task");
        replaceHTML(basenode, "a.GridHeader-addTaskButton", "add_task");

        replaceHTML(basenode, "div.gridToolbar-button--addSection span.new-button-text", "add_section");
        replaceHTML(basenode, "a.GridHeader-addSectionButton", "add_section");

        replaceHTML(basenode, "span.floatingSelectView-label span", "view_task_by_due_date");

        replaceHTML(basenode, "div.detailsFollowersLabel", "followers");
        replaceHTML(basenode, "span.selfFollowToggleView-text", "following");

        replaceHTML(basenode, "span.taskCommentsView-autogrowHypertext div.placeholder-content", "write_comment")
    };

    var leftNavigation = function (basenode) {
        var base = $(basenode);
        if(base.length == 0){
            return;
        }
        replaceHTML(basenode, "a.NavigationLink.SidebarItemRow span[title='Team Conversations']", "navigation_team_conversation");
        replaceHTML(basenode, "a.NavigationLink.SidebarItemRow span[title='Team Calendar']", "navigation_team_calendar");
        replaceHTML(basenode, "span.SidebarRecentsAndFavorites-showMoreOrLessText", "navigation_show_recent");
    };

    var topBarNavigation = function (basenode) {
        var base = $(basenode);
        if(base.length == 0){
            return;
        }

        replaceHTML(basenode, "a.topbar-myTasksButton", "my_tasks");
        replaceHTML(basenode, "a.topbar-notificationsButton", "inbox");
        replaceHTML(basenode, "a.topbar-myDashboardButton", "dashboard");
        replaceAttribute(basenode, "#nav_search_input", "placeholder", "search")
    };

    var headerNavigation = function (basenode) {
        var base = $(basenode);
        if(base.length == 0){
            return;
        }

        replaceHTML(basenode, "ul.tab-nav-bar.tab-nav-bar-center li.tab-nav:nth-child(1) a.tab-nav-button", "list");
        replaceHTML(basenode, "ul.tab-nav-bar.tab-nav-bar-center li.tab-nav:nth-child(2) a.tab-nav-button", "calendar");
        replaceHTML(basenode, "ul.tab-nav-bar.tab-nav-bar-center li.tab-nav:nth-child(3) a.tab-nav-button", "files");
    };

    for(var i=1; i<=5; i++){
        setTimeout(function () {
            bodyContainerReplace($(".asanaView-bodyContainer"));
            leftNavigation($(".sidebar-mountNode"));
            topBarNavigation($(".remix-topbar"));
            headerNavigation($(".full-width-header"));
            console.log("body scan at: " + new Date());
        }, i*i*1000)
    }

    setTimeout(function () {
        var body_container = $(".asanaView-bodyContainer");
        console.log("setup mutation listener at: " + new Date());
        notifyChanges(body_container, function (addedNode) {
            bodyContainerReplace(addedNode);
        });
    }, 26000);
});