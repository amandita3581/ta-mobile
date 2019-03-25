angular.module("app").controller("BotoesAcaoController", ['$rootScope', '$scope', 'pedido', 'config', '$timeout', function ($rootScope, $scope, pedido, config, $timeOut) {
    $scope.$on("mesaLocalizada", function (event, value) {
        $scope.mesaLocalizada = value;
    });

    $scope.tipoAtendimento = config.tipoAtendimento;
    $scope.$on("itensConsumidosSelecionados", function (event, value) {
        $scope.mostraBotaoExcluir = $scope.mostraBotaoReimpressao = value;
    });

    $scope.$on("temNovosItens", function (event, value) {
        $scope.temNovosItens = value;
    });

    $scope.$on("itensAdicionadosSelecionados", function (event, value) {
        $scope.mostraBotaoExcluir = value;
        $scope.mostraBotaoReimpressao = false;
    });

    $scope.SalvarPedido = function (imprimir, imprimirTodosMesa) {      
        $scope.desabilitar = true;
        $timeOut(function () {
            $scope.desabilitar = false;
        },4000);
        $rootScope.$broadcast("SalvarPedido", imprimir, imprimirTodosMesa);
    };

    $scope.excluirItens = function () {
        $rootScope.$broadcast("ExcluirItens");
    };

    $scope.liberarAtendimento = function (mostrarMensagem) {
        $rootScope.$broadcast("liberarAtendimento", mostrarMensagem);
    };

    $scope.reimprimirPedido = function () {
        $rootScope.$broadcast("reimprimir");
    };
}]);