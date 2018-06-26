angular.module("asanaApp").directive("datetime", function () {
    return {
        restrict: 'E',
        scope: {
            type: "=",
            date: "=",
            onChange: "&"
        },
        controller: ["$scope", "$filter", "AsanaConstants", "$timeout",
            function ($scope, $filter, AsanaConstants, $timeout) {
            //console.log("typeof " + typeof $scope.onChange);
            //console.log("controller");
            $scope.date = undefined;
            $scope.type = AsanaConstants.DEADLINE_TYPE.NONE;
            $scope.dueDate = {
                date: undefined,
                open: false
            };
            $scope.dueTime = {
                date: undefined,
                open: false
            };
            $scope.value = undefined;

            $scope.dateSet = function () {
                //console.log("date set");
                //console.log("New date: " + $scope.dueDate.date);
                if(angular.isDefined($scope.onChange) && typeof $scope.onChange === 'function'){
                    $timeout($scope.onChange);
                }
                if($scope.dueDate.date === null){
                    //clear date - then clear time too
                    $scope.type = AsanaConstants.DEADLINE_TYPE.NONE;
                    $scope.updateValue();
                    return;
                }
                if($scope.type === AsanaConstants.DEADLINE_TYPE.NONE){
                    $scope.type = AsanaConstants.DEADLINE_TYPE.DUE_ON;
                }
                $scope.copyDay();
                $scope.updateValue();
            };

            $scope.timeSet = function () {
                //console.log("time set");
                //console.log("New time: " + $scope.dueTime.date);

                if($scope.dueTime.date === null){
                    $scope.type = AsanaConstants.DEADLINE_TYPE.DUE_ON;
                } else {
                    $scope.type = AsanaConstants.DEADLINE_TYPE.DUE_AT;
                    $scope.copyTime();
                }
                $scope.updateValue();
                if(angular.isDefined($scope.onChange) && typeof $scope.onChange === 'function'){
                    $timeout($scope.onChange);
                }
            };

            $scope.timeClick = function () {
                //console.log("time click");
                if($scope.type !== AsanaConstants.DEADLINE_TYPE.NONE){
                    $scope.dueTime.open=!$scope.dueTime.open; //if date set - open time calendar
                } else {
                    $scope.dueDate.open = !$scope.dueDate.open; //if date not set open date calendar
                }
            };

            /*$scope.$watch("type", function (newValue, oldValue) {
                console.log("type changed from: " + oldValue + " to: " + newValue);
                console.log("Current type: " + $scope.type);
            });*/

            $scope.$watch("date", function (newValue, oldValue) {
                if(angular.isDefined($scope.date)){
                    $scope.dueDate.date = $scope.date;
                    $scope.dueTime.date = $scope.date;
                }
                //console.log("date changed from: " + oldValue + " to: " + newValue);
                //console.log("Current Date: " + $scope.date);
                //console.log("show value: " + $scope.value);
                $scope.updateValue();
            });

            $scope.updateValue = function() {
                if($scope.type === AsanaConstants.DEADLINE_TYPE.DUE_ON){
                    $scope.value = $filter('date')($scope.date, "dd MMM yyyy");
                } else if($scope.type === AsanaConstants.DEADLINE_TYPE.DUE_AT) {
                    $scope.value = $filter('date')($scope.date, "dd MMM yyyy hh:mm a");
                } else {
                    $scope.value = undefined;
                }
            };

            $scope.copyDay = function(){
                if (typeof $scope.date === 'undefined'){
                    $scope.date = new Date();
                }
                $scope.date.setDate($scope.dueDate.date.getDate());
                $scope.date.setMonth($scope.dueDate.date.getMonth());
                $scope.date.setYear($scope.dueDate.date.getFullYear());
            };

            $scope.copyTime = function(){
                if (typeof $scope.date === 'undefined'){
                    $scope.date = new Date();
                }
                $scope.date.setHours($scope.dueTime.date.getHours());
                $scope.date.setMinutes($scope.dueTime.date.getMinutes());
            };
        }],
        templateUrl: "../templates/datetime.tmpl.html"
    };
});

angular.module("asanaApp").directive('uiSelectFocus', ['$timeout', function($timeout){
    return {
        require: 'uiSelect',
        restrict: 'A',
        link: function($scope, el, attrs, uiSelect) {
            var closing = false;

            angular.element(uiSelect.focusser || uiSelect.focusInput).on('focus', function() {
                if(!closing) {
                    uiSelect.activate();
                }
            });

            // Disable the auto open when this select element has been activated.
            $scope.$on('uis:activate', function() {
                autoopen = false;
            });

            // Re-enable the auto open after the select element has been closed
            $scope.$on('uis:close', function() {
                closing = true;
                $timeout(function() { // I'm so sorry
                    closing = false;
                });
            });
        }
    };
}]);

asanaModule.directive('remember', ["StorageService", function(StorageService){
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function(scope, element, attrs, ngModel) {
            var key = attrs.remember;
            var storedValue = StorageService.getString(key) || '';
            ngModel.$setViewValue(storedValue);
            ngModel.$render();

            ngModel.$viewChangeListeners.push(function() {
                var value = ngModel.$viewValue;
                StorageService.setString(key, value);
            });
        }
    }
}]);