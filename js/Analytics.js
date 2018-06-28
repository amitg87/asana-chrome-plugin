angular.module("AsanaAnalytics", ["Asana", "chart.js"]
).controller("AsanaAnalyticsController",
    ["$scope", "AsanaGateway", "$location", "$filter",
        function ($scope, AsanaGateway, $location, $filter) {
            var analyticsCtrl = this;
            analyticsCtrl.projectId = $location.search().projectId;

            analyticsCtrl.options = {
                project_id: analyticsCtrl.projectId
            };

            $scope.options = {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        boxWidth: 12,

                        generateLabels: function (chart) {
                            var data = chart.data.datasets[0].data;
                            var labels = chart.data.labels;
                            var config = chart.config.data.datasets[0];
                            if (labels.length && data.length) {
                                return labels.map(function (label, i) {
                                    return {
                                        text: label + ": " + data[i] + " (" + $filter('number')(data[i] * 100/analyticsCtrl.tasks.length, 2) + "%)",
                                        index: i,
                                        fillStyle: config.backgroundColor[i]
                                    }
                                })
                            }
                            return [];
                        }
                    }
                }
            };

            $scope.graphColors = [
                { backgroundColor: "rgba(204,37,41,1)", pointBackgroundColor: "rgba(204,37,41,0.9)"},
                { backgroundColor: "rgba(218,124,48,1)", pointBackgroundColor: "rgba(218,124,48,0.9)"},
                { backgroundColor: "rgba(218,124,48,1)", pointBackgroundColor: "rgba(218,124,48,0.9)"}
            ];

            analyticsCtrl.tasks = [];

            AsanaGateway.getProject({project_id: analyticsCtrl.projectId}).then(function (project) {
                analyticsCtrl.projectDetails = project;
                analyticsCtrl.projectDetailsReady = true;
            });

            analyticsCtrl.getProjectTasks = function () {
                return analyticsCtrl.getNext100().then(function () {
                    if(angular.isDefined(analyticsCtrl.options.offset))
                        return analyticsCtrl.getProjectTasks();
                })
            };

            analyticsCtrl.getNext100 = function () {
                return AsanaGateway.getProjectTasks(analyticsCtrl.options).then(function ([tasks, next_page]) {
                    analyticsCtrl.tasks = analyticsCtrl.tasks.concat(tasks);
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
            analyticsCtrl.tagAnalysis = {};
            analyticsCtrl.assigneeAnalysis = {};
            analyticsCtrl.dueAnalysis = {
                overdue: 0,
                due_today: 0,
                due_week: 0
            };
            analyticsCtrl.getProjectTasks().then(function () {
                console.log("done fetching task: " + analyticsCtrl.tasks.length);
                var now = new Date();
                var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

                analyticsCtrl.tasks.forEach(function (task) {
                    if(task.completed){
                        analyticsCtrl.completed++;
                    } else {
                        analyticsCtrl.incomplete++;
                    }
                    if(task.assignee==null){
                        analyticsCtrl.unassigned++;
                    } else {
                        analyticsCtrl.assigned++;
                    }
                    if(task.due_on == null && task.due_at == null){
                        analyticsCtrl.unscheduled++;
                    } else {
                        analyticsCtrl.scheduled++;
                        var date = new Date(task.due_on == null?task.due_at:task.due_on);
                        console.log(task.name);
                        var day = Math.floor((date.getTime()-today.getTime())/(1000*60*60*24));
                        if(day<0){
                            analyticsCtrl.dueAnalysis.overdue++;
                        }
                        if(day<1){
                            analyticsCtrl.dueAnalysis.due_today++;
                        }
                        if(day<=7){
                            analyticsCtrl.dueAnalysis.due_week++;
                        }
                        console.log("overdue: " + (date.getTime()-today.getTime()))
                    }

                    //tag wise distribution
                    if(task.tags != null){
                        task.tags.forEach(function (tag) {
                            if(analyticsCtrl.tagAnalysis.hasOwnProperty(tag.name)){
                                incrComplementaryProperty(task.complete, analyticsCtrl.tagAnalysis[tag.name], "completed", "incomplete");
                                incrComplementaryProperty(task.assignee == null, analyticsCtrl.tagAnalysis[tag.name], "unassigned", "assigned");
                                incrComplementaryProperty(task.due_on == null && task.due_at == null, analyticsCtrl.tagAnalysis[tag.name], "scheduled", "unscheduled");
                            } else {
                                analyticsCtrl.tagAnalysis[tag.name] = {
                                    completed: 0,
                                    incomplete: 0,
                                    assigned: 0,
                                    unassigned: 0,
                                    scheduled: 0,
                                    unscheduled: 0
                                };
                            }
                        });
                    }

                    //assignee wise distribution
                    if(task.assignee != null){
                        var assignee = task.assignee.name;
                        if(analyticsCtrl.assigneeAnalysis.hasOwnProperty(assignee)){
                            incrComplementaryProperty(task.complete, analyticsCtrl.assigneeAnalysis[assignee], "completed", "incomplete")
                        } else {
                            analyticsCtrl.assigneeAnalysis[assignee] = {
                                completed: 0,
                                incomplete: 0
                            }
                        }
                    }

                    analyticsCtrl.chartCompleted = {
                        data: [analyticsCtrl.completed, analyticsCtrl.incomplete],
                        labels: ["Complete", "Incomplete"],
                        colors: $scope.graphColors,
                        options: $scope.options
                    };

                    analyticsCtrl.chartAssigned = {
                        data: [analyticsCtrl.assigned, analyticsCtrl.unassigned],
                        labels: ["Assigned", "Unassigned"],
                        colors: $scope.graphColors,
                        options: $scope.options
                    };

                    analyticsCtrl.chartScheduled = {
                        data: [analyticsCtrl.scheduled, analyticsCtrl.unscheduled],
                        labels: ["Scheduled", "Unscheduled"],
                        colors: $scope.graphColors,
                        options: $scope.options
                    };

                    analyticsCtrl.chartDue = {
                        data: [analyticsCtrl.dueAnalysis.overdue, analyticsCtrl.dueAnalysis.due_today, analyticsCtrl.dueAnalysis.due_week],
                        labels: ["Overdue", "Due Today", "Due this week"],
                        colors: $scope.graphColors,
                        options: $scope.options
                    };

                    analyticsCtrl.chartsDone = true;
                });

                function incrComplementaryProperty(condition, object, property1, property2){
                    if(condition){
                        incrProperty(object, property1);
                    } else {
                        incrProperty(object, property2);
                    }
                }

                function incrProperty(obj, property){
                    if(obj.hasOwnProperty(property)){
                        var count = obj[property];
                        obj[property] = count+1;
                    } else {
                        throw Error("Invalid property")
                    }
                }
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