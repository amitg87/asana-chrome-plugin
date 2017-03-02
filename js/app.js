var asanaModule = angular.module("asana", ["ngRoute", "ngSanitize", "ui.select", "ui.bootstrap", "ui.bootstrap.datetimepicker"]);

asanaModule.config(function($routeProvider, $locationProvider) {
    $routeProvider
        .when("/", {
            // route for the create task page
            templateUrl : "pages/createTask.html",
            controller  : "createTaskController"
        })
       .when("/createTask", {
            // route for the create task page
            templateUrl : "pages/createTask.html",
            controller  : "createTaskController"
        })
        .when("/todo", {
            templateUrl : "pages/todo.html",
            controller  : "todoController"
        })
        .when("/settings", {
            templateUrl : "pages/settings.html",
            controller  : "settingsController"
        }).when("/notifications", {
            templateUrl : "pages/notifications.html",
            controller  : "notificationsController"
        });
});

asanaModule.config([
    "$compileProvider",
    function ($compileProvider) {
        $compileProvider.imgSrcSanitizationWhitelist(/^\s*((https?|chrome-extension):|data:image\/)/);
    }
]);
