(function () {
    console.log("contentscript ready");
    setTimeout(function () {

        $.each($(".SidebarTeamDetailsProjectsList .dropTargetRow.SidebarDraggableItemRowStructure-dropTarget--sidebarItem"), function ( index, project) {
            attachToProject($(project));
        });

        var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
        var target = document.querySelector(".SidebarTeamDetailsProjectsList");

        var observer = new MutationObserver(function(mutations) {
            [].forEach.call(mutations, function(mutation) {
                var addedNodes = mutation.addedNodes;
                //console.log("added node: " + addedNodes.length);
                [].forEach.call( addedNodes, function(addedNode){
                    //console.log("added node: " + addedNode);
                    //var tagname = $(addedNode).prop('tagName');
                    attachToProject($(addedNode));
                    //console.log("added project tag: " + tagname);
                });
            });
        });

        observer.observe(target, {
            childList: true
        });
    }, 10000);

    function attachToProject(project){
        //console.log(project);
        var anchor = project.find("a.NavigationLink.SidebarItemRow.SidebarItemRow--colorNone");
        if(anchor.length){
            var projectLink = anchor.attr("href");
            var last = projectLink.lastIndexOf("/");
            var secondLast = projectLink.lastIndexOf("/", last-1);
            var projectId = projectLink.substring(secondLast+1, last);
            var projectName = anchor.find("span.SidebarItemRow-name");
            var element = '<div class="SidebarItemRow-statusIcon"><a id="amit"><img style="height: 16px; width:16px;vertical-align: middle;" class="asanang-stats"/></a></div>';
            var $element = $(element);
            $element.find("img.asanang-stats").attr("project-id", projectId);
            projectName.after($element);
        }
    }

    $(document).on('click', '#amit', function () {
        var projectId = $(this).find("img").attr("project-id");
        chrome.runtime.sendMessage({ action: 'projectAnalytics', projectId: projectId});
    })
})();