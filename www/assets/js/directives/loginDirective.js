angular.module('app').directive('loginDirective', [function () {
    return {
        restrict: "E",
        controller: "LoginController",
        controllerAs: "loginCtrl",
        templateUrl: "templates/login.html"
    };
}]);