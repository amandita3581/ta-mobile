angular.module("app").controller("TabsAtendimentoController", ['$rootScope', '$scope', 'pedido', 'produtos', 'funcoes', '$location', 'autenticacao', '$timeout', 'toast', function ($rootScope, $scope, pedido, produtos, funcoes, $location, auth, $timeout, toast) {
    var vm = this;

    vm.isToShow = $scope.isToShow;
    vm.selecionados = [];
    var quantidade = 1;

    $scope.$on('itensConsumidosObtidos', function () {
        vm.itensPedido = pedido.getItensConsumidos();
    });

    $rootScope.$on("marcarItensConsumidos", function (event, value) {
        _.each(vm.itensPedido, function (item) {
            item.selecionado = value;
        });
        vm.itemConsumidoSelecionado();
        vm.selecionarTodosParaReimpressao = value;
    });

    $scope.$watch('ctrl.selecionarTodosParaReimpressao', function (newValue, oldValue) {
        $rootScope.$broadcast("marcarItensConsumidos", newValue);
    });

    $scope.$watch('ctrl.tab', function () {
        $rootScope.$broadcast("marcarItensConsumidos", false);
        vm.selecionados = [];
        _.each(vm.itens, function (item) {
            item.selecionado = false;
        });
    });

    vm.openBarCodeScanner = function () {
        funcoes.ScanBarCode(function (code) {
            if (!code)
                return false;            
            vm.codigoProduto = code;
            vm.ObterProduto();
        });
    };

    vm.itemConsumidoSelecionado = function () {
        var temItensSelecionados = _.find(vm.itensPedido, function (item) { return item.selecionado; });
        if ($rootScope)
            $rootScope.$broadcast("itensConsumidosSelecionados", temItensSelecionados);
    };

    vm.itensAdicionadosSelecionados = function () {
        var temItensAdicionadosSelecionados = vm.selecionados.length > 0;
        if ($rootScope)
            $rootScope.$broadcast("itensAdicionadosSelecionados", temItensAdicionadosSelecionados);
    };

    vm.ObterProduto = function () {
        var arrProduto, codigo, quantidade;
        var retorno = true;
        if (vm.codigoProduto.indexOf('.') >= 1) {
            arrProduto = vm.codigoProduto.split('.');
            try {
                quantidade = parseInt(arrProduto[0]);
                codigo = parseInt(arrProduto[1]);
                if (!Number.isInteger(codigo)) {
                    alert("Digite um código válido.");
                    retorno = false;
                }
                if (!Number.isInteger(quantidade)) {
                    quantidade = 1;
                }
            } catch (e) {
                alert(e);
                retorno = false;
            }
        } else {
            quantidade = 1;
            codigo = parseInt(vm.codigoProduto);
            if (!Number.isInteger(codigo)) {
                alert("Digite um código válido.");
                retorno = false;
            }
        }
        if (retorno) {
            produtos.buscar(codigo).then(function (data) {
                var prod = produtos.mapListaProdutos(data, 'ObterProdutoReduzindoResult', quantidade);
                if (!prod.length) {
                    toast.showCustomToast('Produto não encontrado.');
                } else {
                    produtos.setUltimoProdutoSelecionado(prod[0]);
                    produtos.adicionarProduto(prod[0]).then(function (result) {
                        vm.itens = produtos.getProdutos();
                        produtos.obterQuantidadeParaItemFracionado(produtos.getUltimoProdutoSelecionado());
                        $rootScope.$broadcast("temNovosItens", vm.itens.length > 0);
                    },
                    function (reason) {
                        if (reason !== null)
                            toast.showCustomToast('Não foi possível obter o produto');
                    });
                }
            }, function (error) {
                toast.showCustomToast(error);
            });
        }
        vm.codigoProduto = '';
    };
    $scope.$on("atualizarListaDeProdutos", function () {
        $timeout(function () {
            vm.itens = produtos.getProdutos();
        });
    });
    vm.abrirOpcoes = function (item) {
        $location.url('/opcoes/Hash/' + item.$$hashKey + '/Origem/editar');
    };

    vm.selecionaItem = function (item) {
        if (item.selecionado) {
            vm.selecionados.pop();
        } else {
            vm.selecionados.push(item);
        }
        item.selecionado = !item.selecionado;
        vm.itensAdicionadosSelecionados();
    };

    vm.formataValorTotalItem = function (item) {
        return funcoes.FormataValorTotalItem(item);
    };

    vm.formataGramasParaKilo = function (val) {
        return parseFloat(val);
    };

    vm.add = function (item) {
        var qt = funcoes.addQt(item.qt);
        item.qt = qt;
    };

    vm.sub = function (item) {
        var qt = funcoes.subQt(item.qt);
        item.qt = qt;
    };

    $scope.$on("ExcluirItens", function (event) {
        if (vm.tab == "itens") {
            produtos.removerSelecionados();
            vm.itens = produtos.getProdutos();
            $rootScope.$broadcast("temNovosItens", vm.itens.length > 0);
            vm.selecionados = [];
            vm.itensAdicionadosSelecionados();
        } else if (vm.tab == "consumidos") {            
            var idComanda = vm.itensPedido[0].idComanda;
            pedido.solicitaUsuarioParaExclusaoSeNecessario(idComanda, vm.itensPedido)
                .then(pedido.excluirItens)
                .then(funcoes.MostraMensagem)
                .then(excluirItensDaLista)                
                .catch(funcoes.MostraMensagem);
        }
    });

    var excluirItensDaLista = function(){
        vm.itensPedido = _.filter(vm.itensPedido, function (item) {
            return !item.selecionado;
        });
        vm.itemConsumidoSelecionado();
        $rootScope.$broadcast("marcarItensConsumidos", false);
    }

    $scope.$on("reimprimir", function (event) {
        auth.solicitarUsuarioSenha(149).then(
            function (data) {
                pedido.reimprimirItens(vm.itensPedido, data.usuario, data.senha);
                $rootScope.$broadcast("marcarItensConsumidos", false);
            }
        );
    });

    $scope.$on("mesaLocalizada", function (event, value) {
        vm.mesaLocalizada = value;
    });

    $scope.$on("limparListaItens", function () {
        produtos.limparProdutos();
        vm.itens = [];
        $rootScope.$broadcast("itensConsumidosSelecionados", false);
        $rootScope.$broadcast("marcarItensConsumidos", false);
        $rootScope.$broadcast("temNovosItens", false);
    });

    vm.itens = produtos.getProdutos();
    $rootScope.$broadcast("temNovosItens", vm.itens.length > 0);
}]);