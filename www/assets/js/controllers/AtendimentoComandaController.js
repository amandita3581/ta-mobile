angular.module('app').controller('AtendimentoComandaController', ['$scope', 'config', 'produtos', 'ws', '$rootScope', '$location', 'toast', 'pedido', 'autenticacao', 'funcoes', '$timeout', 'atendimento', '$routeParams', 'operador',
    function ($scope, config, produtosSvc, ws, $rootScope, $location, toast, pedido, auth, funcoes, $timeout, atendimento, $routeParams, operador) {
        var vm = this;
        vm.tipoAtendimento = config.tipoAtendimento;
        vm.microterminal = config.microterminal;
        vm.flValidaDv = false;
        vm.pessoas = 1;
        vm.config = config;
		vm.digitacaoPermitida = operador.temPermissao(160);

        $scope.$on("valorValidado", function (event, comanda) {
            pedido.setComanda(comanda);
            ObterMesaComanda();
        });
        
        var BloqueiaAtendimento = function () {
            atendimento.setMesaLocalizada(false);
        };

        var DesbloqueiaAtendimento = function () {
            atendimento.setMesaLocalizada(true);
            $timeout(function () {
                $rootScope.$broadcast("itensConsumidosObtidos");
            });

        };

        vm.openBarCodeScanner = function () {
            funcoes.ScanBarCode(function (code) {
                if (!code)
                    return false;
                pedido.setComanda(code);
                ObterMesaComanda();
            });
        };

		vm.validarLeitor = function (event) {
			event.stopPropagation();
			if (vm.config.microterminal.flLeitor && !vm.config.localConfig.utilizaLeitorUsb) {				
				vm.openBarCodeScanner();
			} else {
				if (!vm.digitacaoPermitida) {
					auth.solicitarUsuarioSenha(160)
						.then(
							function () {
								vm.digitacaoPermitida = true;
								$("#txtComanda").focus();
							},
							function () {
								vm.digitacaoPermitida = false;
							}
						);
				}
			}
        };
		
        var ResetPedido = function () {
			$timeout(function(){
				vm.pessoas = null;
				vm.digitacaoPermitida = operador.temPermissao(160);
				$rootScope.$broadcast("limparListaItens");
				$rootScope.$broadcast("mostraBotaoExcluir", false);
				$rootScope.$broadcast("mostraBotaoReimpressao", false);
				produtosSvc.limparProdutos();
				pedido.setComanda(null);
				vm.comanda = null;
				BloqueiaAtendimento();
			});
        };

        var VoltarParaSelecaoOperador = function () {
            produtosSvc.limparProdutos();
            if (config.tipoAtendimento != atendimento.getTipoAtendimentoOriginal())
                $location.url('/inicioAtendimentoMesa/' + true);
            else
                ResetPedido();
        };

        //mensagens de broadcast
        $scope.$on("SalvarPedido", function (event, imprimir, imprimirTodosMesa) {
            pedido.salvarPedido(imprimir, imprimirTodosMesa, true).then(
                function () {
                    VoltarParaSelecaoOperador();
                },
                function () {
                    ResetPedido();
                }
            );
        });

        $scope.$on("liberarAtendimento", function (event, mostrarMensagem) {
            atendimento.LiberarAtendimento().then(
                function (mensagem) {
                    if (mostrarMensagem) {
                        toast.showCustomToast(mensagem);
                    }
                    VoltarParaSelecaoOperador();
                },
                function (erro) {
                    if (mostrarMensagem) {
                        toast.showCustomToast(mensagem);
                    }
                    VoltarParaSelecaoOperador();
                });
        });


        //fim mensagens de broadcast

        $scope.$watch('atendCtrl.comanda', function (newValue, oldValue, scope) {
            pedido.setComanda(newValue);
        });

        vm.buscaComanda = function () {
			vm.pessoas = null;
			$rootScope.$broadcast("limparListaItens");
            $rootScope.$broadcast("mostraBotaoExcluir", false);
            $rootScope.$broadcast("mostraBotaoReimpressao", false);
            produtosSvc.limparProdutos();
            pedido.setComanda(null);
			
            if (produtosSvc.getProdutos().length > 0) {
                if (!confirm('Existem itens no pedido. \nDeseja realmente abrir outra comanda?')) {
                    return;
                }
            }
            pedido.setComanda(vm.comanda);
            ObterMesaComanda();
        };

        vm.buscaComandaEnter = function ($event) {
			if(!vm.digitacaoPermitida)
        		$event.preventDefault();
            if ($event.which == 13) {
                vm.buscaComanda();
            }
        };

        var ObterMesaComanda = function () {
            var mesa = 0;
            var comanda = pedido.getComanda();
            var pessoas = 1;
            var comandaValida = false;
            if (!comanda) {
                toast.showCustomToast("Comanda n&#227;o informada.");
                return;
            }

            ws.ObterMesaComanda(mesa, comanda, operador.getOperador().idOperador, vm.flValidaDv)
            .then(
                function (data) {
                    var json = angular.fromJson($(data).find('ObterMesaComandaResult').text());

                    if (json.length > 0) {
                        json = json[0];
                    } else {
                        toast.showCustomToast("Houve um evento inesperado no web service. Entre em contato com o suporte.");
                        return;
                    }

                    comanda = json.idComanda;
                    mesa = 0;
                    comandaValida = funcoes.ValidarComanda(json, true);
                    if (!comandaValida) {
                        BloqueiaAtendimento();
                        return false;
                    }
                    var mesaDaComanda = json.idMesa;
                    pedido.setComanda(comanda);
                    var itens = funcoes.MapProdutos(json.liAtendimentoItem);
                    pedido.setItensConsumidos(itens);
                    vm.comanda = comanda;
                    $rootScope.$broadcast("atualizarValor", vm.comanda);
                    DesbloqueiaAtendimento();
                },
                function (error) {
                    toast.showCustomToast(error, 'zmdi zmdi-info-circle', 'info');
                    $rootScope.$digest();
                }
            );
        };

        if ($routeParams.comanda) {
            vm.flValidaDv = true;
            pedido.setComanda($routeParams.comanda);
            ObterMesaComanda();
        }

        var comanda = pedido.getComanda();
        if (comanda) {
            vm.comanda = comanda;
            vm.pessoas = pedido.getPessoas();
            vm.itensPedido = pedido.getItensConsumidos();
            DesbloqueiaAtendimento();
        } else {
            BloqueiaAtendimento();
        }
    }]);