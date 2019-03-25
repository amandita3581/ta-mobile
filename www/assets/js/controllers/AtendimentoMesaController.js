angular.module('app').controller('AtendimentoMesaController', ['$scope', 'config', 'produtos', 'ws', '$rootScope', '$location', 'toast', 'pedido', 'autenticacao', 'funcoes', '$timeout','atendimento', 'operador', AtendimentoMesaController]);

function AtendimentoMesaController($scope, config, produtosSvc, ws, $rootScope, $location, toast, pedido, auth,  funcoes, $timeout, atendimento, operador) {
	var vm = this;
	vm.pessoas = 1;
	vm.tipoAtendimento = config.tipoAtendimento;
	vm.microterminal = config.microterminal;
	vm.flValidaDv = false;
	vm.mesa = pedido.getMesa();
	atendimento.setMesaLocalizada(false);

	function BuscaMesa() {
	    if (!funcoes.TestaValorZeradoMesaOuComanda(vm.mesa)) {
	        vm.ResetPedido();
	        $scope.$digest();
	        return false;
	    }
	    ws.ObterMesa(vm.mesa)
		.then(
			function (data) {
			    var json = angular.fromJson($(data).find('ObterMesaResult').text());
			    if (!json.FlagMensagem) {
			        toast.showCustomToast(json.Mensagem);
			        vm.VoltarSelecaoDeMesas();
			        return false;
			    } else {
			        if (!json.FlagBloqueada) {
			            pedido.salvarPedido(false, false, false).then(
                           function (data) {
                               ws.BloqueiaDesbloqueiaMesa(vm.mesa, 1, 0, operador.getOperador().idOperador, true).then(
				                    function (data) {
				                        $timeout(function () {
				                            pedido.setMesa(vm.mesa);
				                            pedido.setComanda(vm.mesa);
				                            vm.comanda = vm.mesa;
				                            vm.pessoas = 1;
				                            funcoes.SetFocus($("#nrPessoas"));
				                            DesbloqueiaAtendimento();
				                        });
				                    },
				                    BloqueiaAtendimento
			                    );
                           },
                           BloqueiaAtendimento
                        );
			        } else {
			            ws.ObterPedido(vm.mesa, 0)
                        .then(
                            function (data) {
                                $timeout(function () {
                                    vm.itensPedido = [];
                                    var itens = angular.fromJson($(data).find('ObterPedidoResult').text());

                                    var mesaValida = true;
                                    var mesaSendoUtilizada = false;
                                    var terminalUtilizandoMesa = '';
                                    _.each(itens, function (item) {
                                        if (item.idComanda != vm.mesa) {
                                            mesaValida = false;
                                        }
                                        if (item.idMicroterminallock) {
                                            mesaSendoUtilizada = true;
                                            terminalUtilizandoMesa = item.idMicroterminallock;
                                        }
                                    });
                                    if (!mesaValida) {
                                        toast.showCustomToast('A mesa selecionada est&aacute; no regime de m&uacute;ltiplas comandas.');
                                        $location.url('/inicioAtendimentoMesa');
                                        return;
                                    }

                                    if (mesaSendoUtilizada && terminalUtilizandoMesa != config.ip) {
                                        toast.showCustomToast('A mesa est&aacute; sendo utilizada pelo terminal ' + terminalUtilizandoMesa);
                                        $location.url('/inicioAtendimentoMesa');
                                        return;
                                    }

                                    if (itens.length) {
                                        if (itens[0].idProduto !== 0) {
                                            items = funcoes.MapProdutos(itens);
                                            pedido.setItensConsumidos(items);
                                        }
                                        vm.pessoas = itens[0].nrPessoas || 1;
                                        vm.comanda = itens[0].idComanda;
                                    } else {
                                        vm.pessoas = 1;
                                    }
                                    pedido.setMesa(vm.mesa);
                                    pedido.setComanda(vm.mesa);
                                    vm.comanda = vm.mesa;
                                    ws.BloqueiaDesbloqueiaMesa(vm.mesa, 1, 0, operador.getOperador().idOperador, true);
                                    DesbloqueiaAtendimento();
                                });

                            },
                            BloqueiaAtendimento
                        );
			        }
			    }
			},
			function (error) {
			    toast.showCustomToast(error, 'zmdi zmdi-info-circle', 'info');
			    $scope.$digest();
			}
		);
	}

	var BloqueiaAtendimento = function () {
	    $timeout(function () {
	        if (vm.tipoAtendimento == 'mesa-comanda') {
	            pedido.comandaTexto = null;
	            vm.comanda = null;
	        } else {
	            vm.pessoas = null;
	            vm.itensPedido = [];
	        }
	        atendimento.setMesaLocalizada(false);
	    });
	};

	var DesbloqueiaAtendimento = function () {
		atendimento.setMesaLocalizada(true);
		$rootScope.$broadcast('itensConsumidosObtidos');
	};

	vm.ResetPedido = function () {
	    vm.pessoas = null;
	    vm.itensPedido = [];
	    vm.itens = [];
	    vm.selecionados = [];
	    $rootScope.$broadcast("mostraBotaoExcluir", false);
	    $rootScope.$broadcast("mostraBotaoReimpressao", false);
	    vm.selecionarTodosParaReimpressao = false;
	    produtosSvc.limparProdutos();
	    pedido.setComanda(null);
	    atendimento.setMesaLocalizada(false);
	    vm.VoltarSelecaoDeMesas();
	};

	vm.VoltarSelecaoDeMesas = function () {
	    produtosSvc.limparProdutos();
	    $location.url('/inicioAtendimentoMesa');
	};

	function VerificaSeComandaTemItensConsumidos() {
	    if (!vm.itensPedido)
	        return false;
	    if (vm.itensPedido.length > 0) {
	        return true;
	    }
	    return false;
	}

	$scope.$watch('atendCtrl.mesa', function (newValue, oldValue, scope) {
	    pedido.setMesa(newValue);
	});

	$scope.$watch('atendCtrl.pessoas', function (newValue, oldValue, scope) {
	    pedido.setPessoas(newValue);
	});

    //mensagens de broadcast
	$scope.$on("SalvarPedido", function (event, imprimir, imprimirTodosMesa) {
	    pedido.salvarPedido(imprimir, imprimirTodosMesa).then(
            function () {
                vm.VoltarSelecaoDeMesas();
            },
            function () {
                vm.ResetPedido();
            }
        );
	});

	$scope.$on("liberarAtendimento", function (event, mostrarMensagem) {
	    atendimento.LiberarAtendimento().then(
            function (mensagem) {
                if (mostrarMensagem) {
                    toast.showCustomToast(mensagem);
                }
                vm.ResetPedido();
                vm.VoltarSelecaoDeMesas();
            },
            function (erro) {
                if (mostrarMensagem) {
                    toast.showCustomToast(mensagem);
                }
                vm.ResetPedido();
                vm.VoltarSelecaoDeMesas();
            });
	});
    //fim mensagens de broadcast
	BuscaMesa();
}