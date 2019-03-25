angular.module("app").directive('atendimentoMesaComanda', [function () {
    return {
        restrict: "E",
        controller: "AtendimentoMesaComandaController",
        controllerAs: "atendCtrl",
        templateUrl: "templates/atendimentoMesaComanda.html"
    };
}]);