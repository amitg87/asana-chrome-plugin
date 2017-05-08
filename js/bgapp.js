var asanaModule = angular.module("asanabg", []);

asanaModule.run(['AsanaGateway', 'AsanaAlarm', 'AsanaConstants', function(AsanaGateway, AsanaAlarm, AsanaConstants){
    AsanaGateway.getWorkspaces().then(function (response) {
        var userWorkspaces = response;
        chrome.alarms.onAlarm.addListener(function(everyOneMinute){
            if(AsanaConstants.getMyTasksAlarmOn()) {
                AsanaAlarm.checkTasksAndNotify(userWorkspaces);
            }
        });
    });
}]);