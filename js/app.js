var asanaModule = angular.module("asana", ["ngRoute", "ngSanitize", "ui.select", "ui.bootstrap", "ui.bootstrap.datetimepicker"]);

asanaModule.config(function($routeProvider, $locationProvider) {
    $locationProvider.html5Mode(true);
    $routeProvider
        .when("/createTask", {
            // route for the create task page
            templateUrl : "pages/createTask.html",
            controller  : "createTaskController",
            controllerAs: "createTaskCtrl"
        })
        .when("/tasks", {
            // task management page
            templateUrl : "pages/tasks.html",
            controller  : "tasksController",
            controllerAs: "tasksCtrl"
        })
        .when("/settings", {
            // settings
            templateUrl : "pages/settings.html",
            controller  : "settingsController",
            controllerAs: "settingsCtrl"
        })
        .otherwise({
            // route for the create task page
            templateUrl : "pages/createTask.html",
            controller  : "createTaskController",
            controllerAs: "createTaskCtrl"
        });
});

asanaModule.config([
    "$compileProvider",
    function ($compileProvider) {
        $compileProvider.imgSrcSanitizationWhitelist(/^\s*((https?|chrome-extension):|data:image\/)/);
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|chrome-extension):/);
    }
]);
