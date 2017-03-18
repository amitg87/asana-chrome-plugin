asanaModule.directive("datetime", function () {
    return {
        restrict: 'E',
        scope: {
            value: "=value",
            type: "=type",
            date: "=date"
        },
        controller: ["$scope", "$filter", function ($scope, $filter) {
            $scope.type = "due_on";

            var datetimeCtrl = this;

            //datetimeCtrl
            datetimeCtrl.dueDate = {
                open: false
            };

            datetimeCtrl.dateSet = function () {
                if(datetimeCtrl.dueDate.date === null){
                    $scope.date = undefined;
                    $scope.value = undefined;
                    return;
                }
                console.log("date set");

                $scope.date = new Date();
                $scope.date.setDate(datetimeCtrl.dueDate.date.getDate());
                $scope.date.setMonth(datetimeCtrl.dueDate.date.getMonth());
                $scope.date.setYear(datetimeCtrl.dueDate.date.getFullYear());
                $scope.type = "due_on";
                $scope.value = $filter('date')($scope.date, "dd MMM yyyy");
                datetimeCtrl.dueTime = {
                    date: $scope.date,
                    open: false
                };
            };

            datetimeCtrl.timeSet = function () {
                console.log("time set");
                console.log("New date: " + datetimeCtrl.dueTime.date);

                if(datetimeCtrl.dueTime.date === null){
                    datetimeCtrl.dueTime.date = new Date();
                    $scope.type = "due_on";
                    $scope.value = $filter('date')($scope.date, "dd MMM yyyy");
                } else {
                    $scope.type = "due_at";
                    $scope.date = datetimeCtrl.dueTime.date;
                    $scope.value = $filter('date')($scope.date, "dd MMM yyyy hh:mm a");
                }
            };

            datetimeCtrl.timeClick = function () {
                console.log("time click");
                if(angular.isDefined($scope.date)){
                    //if date set - open time calendar
                    datetimeCtrl.dueTime.open=!datetimeCtrl.dueTime.open;
                } else {
                    //if date not set open date calendar
                    datetimeCtrl.dueDate.open = !datetimeCtrl.dueDate.open;
                }
            };
        }],
        controllerAs: "datetimeCtrl",
        templateUrl: "../pages/datetime.tmpl.html"
    };
});