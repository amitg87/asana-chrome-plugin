var asanaModule = angular.module("asana", ["ngRoute", "ngSanitize", "ui.select", "ui.bootstrap", "ui.bootstrap.datetimepicker","angular-clipboard"]);

asanaModule.config(function($routeProvider, $locationProvider) {
    $locationProvider.html5Mode(true);
    $routeProvider
        .when("/create", {
            // route for the create task page
            templateUrl : "pages/createTask.html",
            controller  : "createTaskController",
            controllerAs: "createTaskCtrl",
            activeTab   : "create"
        })
        .when("/manage", {
            // task management page
            templateUrl : "pages/tasks.html",
            controller  : "tasksController",
            controllerAs: "tasksCtrl",
            activeTab   : "manage"
        })
        .when("/settings", {
            // settings
            templateUrl : "pages/settings.html",
            controller  : "settingsController",
            controllerAs: "settingsCtrl",
            activeTab   : "settings"
        }).when("/notifications", {
            templateUrl : "pages/notifications.html",
            controller  : "notificationsController",
            controllerAs: "notificationsCtrl",
            activeTab   : "notifications"
        })
        .when("popup.html", {
            redirectTo  : "/create"
        })
        .otherwise({
            //default
            redirectTo  : "/create"
        });
});

asanaModule.config([
    "$compileProvider",
    function ($compileProvider) {
        $compileProvider.imgSrcSanitizationWhitelist(/^\s*((https?|chrome-extension):|data:image\/)/);
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|chrome-extension):/);
    }
]);
