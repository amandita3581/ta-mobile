angular.module("app").directive("botoesAcao", [function () {
    return {
        restrict: "E",
        controller: "BotoesAcaoController",
        controllerAs: "acaoCtrl",
        templateUrl: "templates/botoesAcao.html"
    };
}]);