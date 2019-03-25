angular.module("app").directive('atendimentoMesa', [function () {
    return {
        restrict: "E",
        controller: "AtendimentoMesaController",
        controllerAs: "atendCtrl",
        templateUrl:"templates/atendimentoMesa.html"
    };
}]);