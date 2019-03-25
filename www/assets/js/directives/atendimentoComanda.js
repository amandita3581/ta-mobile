angular.module("app").directive('atendimentoComanda', [function () {
    return {
        restrict: "E",
        controller: "AtendimentoComandaController",
        controllerAs: "atendCtrl",
        templateUrl: "templates/atendimentoComanda.html"
    };
}]);