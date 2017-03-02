asanaModule.run(["AsanaConstants", "AsanaGateway", "$interval", function (AsanaConstants, AsanaGateway, $interval) {
    $interval(checkNewEvents, 30000);
    this.syncKeys = {};

    function checkNewEvents(){
        console.log("checking new events: " + new Date());
        var enabled = AsanaConstants.getNotificationsEnabled();
        if(!enabled)
            return;
        AsanaGateway.getWorkspaces(function (workspaces) {
            if(angular.isDefined(workspaces) && workspaces.length > 0){
                var workspace = workspaces[0];
                AsanaGateway.getWorkspaceProjects(function (projects) {
                    if(angular.isDefined(projects) && projects.length > 0){
                        var project = projects[0];
                        var key = syncKeys[project.id];
                        key = key?key:1;
                        AsanaGateway.getEvents( handle(project), handle(project),
                            {"resource": project.id, "sync":key})
                    }
                }, null, {workspace_id: workspace.id});
            }
        }, null)
    }

    function handle(project){
        var id = project.id;
        return function (events) {
            console.log(events);
            var newkey = events.message.sync;
            console.log("new key: " + newkey);
            //console.log(project);
            syncKeys[project.id]=newkey
        }
    }
}]);