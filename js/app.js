var asanaModule = angular.module("asana", ["ngRoute", "ngSanitize", "ui.select", 'ui.bootstrap', 'ui.bootstrap.datetimepicker']);

// configure our routes
asanaModule.config(function($routeProvider, $locationProvider) {
    $routeProvider
        .when('/', {
            // route for the create task page
            templateUrl : 'pages/tasks.html',
            controller  : 'tasksController'
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
        //  Default imgSrcSanitizationWhitelist: /^\s*((https?|ftp|file|blob):|data:image\/)/
        //  chrome-extension: will be added to the end of the expression
        $compileProvider.imgSrcSanitizationWhitelist(/^\s*((https?|ftp|file|blob|chrome-extension):|data:image\/)/);
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension):/);
    }
]);
