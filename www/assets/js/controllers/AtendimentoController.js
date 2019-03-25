angular.module('app').controller('AtendimentoController', ['$scope', 'pedido', '$routeParams', '$rootScope', 'funcoes', 'toast', 'atendimento', 'config', 'produtos', function ($scope, pedido, $routeParams, $rootScope, funcoes, toast, atendimento, config, produtos) {
    $scope.tipoAtendimento = config.tipoAtendimento;
    if ($scope.tipoAtendimento !== 'comanda') {
        if ($routeParams.mesa) {
            pedido.setMesa(parseInt($routeParams.mesa));
            if ($scope.tipoAtendimento === 'mesa')
                pedido.setComanda($routeParams.mesa);
        }
    }
    
    $rootScope.bottomMenuClass = $scope.tipoAtendimento !== 'comanda' ? 'col-xs-2' : 'col-xs-3';

    if ($routeParams.limpar === 'true') {
        atendimento.setMesaLocalizada(false);
        pedido.limparPedido();
    }


    $scope.$on("mesaLocalizada", function (event, value) {
        $scope.mesaLocalizada = value;
    });

    //No atendimento por mesa, a tela de retorno passa  a ser outra.
    if (config.tipoAtendimento !== 'comanda')
        $rootScope.backAction = '/inicioAtendimentoMesa';    
    else
        if (config.tipoAtendimento !== atendimento.getTipoAtendimentoOriginal())
            $rootScope.backAction = '/inicioAtendimentoMesa/' + true;
        else
            $rootScope.backAction = '/';

    produtos.limparBuscaProdutos();
}]);