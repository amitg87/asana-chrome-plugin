var asanaModule = angular.module("asana", ["ngRoute", "ngSanitize", "ui.select", 'ui.bootstrap', 'ui.bootstrap.datetimepicker']);

// configure our routes
asanaModule.config(function($routeProvider, $locationProvider) {
    $routeProvider
        .when('/', {
            // route for the create task page
            templateUrl : 'pages/createTask.html',
            controller  : 'createTaskController'
        })
       .when('/createTask', {
            // route for the create task page
            templateUrl : 'pages/createTask.html',
            controller  : 'createTaskController'
        })
        .when('/tasks', {
            templateUrl : 'pages/tasks.html',
            controller  : 'tasksController'
        })
        .when('/tasks/:id', {
            templateUrl: 'pages/task.html',
            controller: 'taskController'
        });
});

asanaModule.config([
    '$compileProvider',
    function ($compileProvider) {
        $compileProvider.imgSrcSanitizationWhitelist(/^\s*((https?|chrome-extension):|data:image\/)/);
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|chrome-extension):/);
    }
]);
