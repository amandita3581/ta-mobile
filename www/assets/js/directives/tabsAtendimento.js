angular.module("app").directive("tabsAtendimento", [function () {
    return {
        restrict: "E",
        controller: "TabsAtendimentoController",
        controllerAs: "ctrl",
        templateUrl: "templates/tabsAtendimento.html"
    };
}]);