angular.module('app').directive('atendimentoMtDirective', [function () {
    return {
        restrict: "E",
        controller: "AtendimentoMtController",
        controllerAs: "atendMtCtrl",
        templateUrl: "templates/atendimentoMt.html"
    };
}]);