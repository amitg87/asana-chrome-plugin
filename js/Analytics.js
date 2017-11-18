angular.module("AsanaAnalytics", ["Asana", "chart.js"]
).controller("AsanaAnalyticsController",
    ["$scope", "AsanaGateway", "$location",
        function ($scope, AsanaGateway, $location) {
            var analyticsCtrl = this;
            analyticsCtrl.projectId = $location.search().projectId;

            analyticsCtrl.options = {
                project_id: analyticsCtrl.projectId
            };

            $scope.$on("task:fetching", function (event, data) {
                console.log("fetching tasks: " + JSON.stringify(data));
            });

            $scope.$on("task:fetched", function (event, data) {
                console.log("fetched tasks: " + JSON.stringify(data));
            });

            $scope.$on("analytics:done", function (event, data) {
                console.log("analytics done: " + JSON.stringify(data));

                analyticsCtrl.chartCompleted = {
                    data: [analyticsCtrl.completed, analyticsCtrl.incomplete],
                    labels: ["Complete", "Incomplete"],
                    colors: ["rgb(204,37,41)", "rgb(218,124,48)"]
                };

                analyticsCtrl.chartAssigned = {
                    data: [analyticsCtrl.assigned, analyticsCtrl.unassigned],
                    labels: ["Assigned", "Unassigned"],
                    colors: ["rgb(204,37,41)", "rgb(218,124,48)"]
                };

                analyticsCtrl.chartScheduled = {
                    data: [analyticsCtrl.scheduled, analyticsCtrl.unscheduled],
                    labels: ["Scheduled", "Unscheduled"],
                    colors: ["rgb(204,37,41)", "rgb(218,124,48)"]
                };

                analyticsCtrl.chartsDone = true;
            });

            analyticsCtrl.projects = [];

            AsanaGateway.getProject({project_id: analyticsCtrl.projectId}).then(function (project) {
                analyticsCtrl.projectDetails = project;
            });

            analyticsCtrl.getProjectTasks = function () {
                $scope.$emit("task:fetching", {task: analyticsCtrl.projects.length});
                return analyticsCtrl.getNext100().then(function () {
                    if(angular.isDefined(analyticsCtrl.options.offset))
                        return analyticsCtrl.getProjectTasks();
                    else
                        $scope.$emit("task:fetched", {task: analyticsCtrl.projects.length});
                })
            };

            analyticsCtrl.getNext100 = function () {
                return AsanaGateway.getProjectTasks(analyticsCtrl.options).then(function ([tasks, next_page]) {
                    analyticsCtrl.projects = analyticsCtrl.projects.concat(tasks);
                    if(next_page!=null && angular.isDefined(next_page)){
                        analyticsCtrl.options.offset = next_page.offset;
                    } else {
                        analyticsCtrl.options.offset = undefined;
                    }
                });
            };
            analyticsCtrl.completed = 0;
            analyticsCtrl.incomplete = 0;
            analyticsCtrl.assigned = 0;
            analyticsCtrl.unassigned = 0;
            analyticsCtrl.scheduled = 0;
            analyticsCtrl.unscheduled = 0;
            analyticsCtrl.getProjectTasks().then(function () {
                console.log("done fetching task: " + analyticsCtrl.projects.length);
                analyticsCtrl.projects.forEach(function (project) {
                    //"{"id":480282915464284,"assignee":null,"completed":false,"completed_at":null,"created_at":"2017-11-15T15:09:05.904Z","due_at":null,"due_on":null,"followers":[{"id":42783910289791,"name":"Amit Gangrade"}],"hearts":[],"name":"Batch199","tags":[]}"
                    if(project.completed){
                        analyticsCtrl.completed++;
                    } else {
                        analyticsCtrl.incomplete++;
                    }
                    if(project.assignee==null){
                        analyticsCtrl.unassigned++;
                    } else {
                        analyticsCtrl.assigned++;
                    }
                    if(project.due_on == null && project.due_at == null){
                        analyticsCtrl.unscheduled++;
                    } else {
                        analyticsCtrl.scheduled++;
                    }
                    //overdue -
                    //possible - difference between due_on/due_at vs completed_at. ask for timezone
                    //count of due today and due in next 1-week
                });
                $scope.$emit("analytics:done", {});
            });
    }]
).config([
        "$compileProvider",
        function ($compileProvider) {
            $compileProvider.imgSrcSanitizationWhitelist(/^\s*((https?|chrome-extension):|data:image\/)/);
            $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|chrome-extension):/);
        }
    ]
).config(['$locationProvider', function($locationProvider){
    $locationProvider.html5Mode(true);
}]
).config(['ChartJsProvider', function (ChartJsProvider) {
        ChartJsProvider.setOptions({
            responsive: false
        });
    }
    ]
);