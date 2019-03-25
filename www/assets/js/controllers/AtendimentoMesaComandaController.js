angular.module('app').controller('AtendimentoMesaComandaController', ['$scope', 'config', 'produtos', 'ws', '$rootScope', '$location', 'toast', 'pedido', 'autenticacao', 'funcoes', '$timeout', 'atendimento', 'ModalService', 'operador',
    function ($scope, config, produtosSvc, ws, $rootScope, $location, toast, pedido, auth, funcoes, $timeout, atendimento, ModalService, operador) {
        var vm = this;
        vm.tipoAtendimento = config.tipoAtendimento;
        vm.microterminal = config.microterminal;
        vm.flValidaDv = false;
        vm.comandas = [];
        vm.itensPedido = [];
        atendimento.setMesaLocalizada(false);

        function BuscaMesa() {
            if (!funcoes.TestaValorZeradoMesaOuComanda(vm.mesa)) {
                ResetPedido();
                VoltarParaSelecaoDaMesa();
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
                            ws.BloqueiaDesbloqueiaMesa(vm.mesa, 1, 0, operador.getOperador().idOperador)
                                .then(
                                function (data) {
                                    pedido.setMesa(vm.mesa);
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
                                        var itensMesa = _.where(itens, { "idComanda": vm.mesa.toString() });
                                        if (itensMesa.length > 0)
                                        {
                                            toast.showCustomToast("A mesa selecionada n&atilde;o est&aacute; no regime de m&uacute;ltiplas comandas.");
                                            ResetPedido();
                                            VoltarParaSelecaoDaMesa();
                                            return;
                                        }
                                        if (itens.length)
                                            vm.comandas = funcoes.MapComandas(itens);
                                        else 
                                            vm.comandas = [];
                                        pedido.setComandas(vm.comandas);
                                        pedido.setMesa(vm.mesa);
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
            atendimento.setMesaLocalizada(false);
        };

        var DesbloqueiaAtendimento = function () {
            atendimento.setMesaLocalizada(true);
            $timeout(function () {
                $rootScope.$broadcast("itensConsumidosObtidos");
            }, 80);
        };

        var ResetPedido = function () {
            $rootScope.$broadcast("limparListaItens");
            pedido.setComanda(null);
            vm.comanda = null;
            BloqueiaAtendimento();
        };

        var VoltarParaSelecaoDaMesa = function () {
            produtosSvc.limparProdutos();
            $location.url('/inicioAtendimentoMesa');
        };

        //mensagens de broadcast
        $scope.$on("SalvarPedido", function (event, imprimir, imprimirTodosMesa) {
            pedido.pressionadoSalvarTodos = imprimirTodosMesa;
            pedido.salvarPedido(imprimir, imprimirTodosMesa, true).then(
                function () {
                    if (imprimirTodosMesa)
                        VoltarParaSelecaoDaMesa();
                    else
                        ResetPedido();
                },
                function () {
                    toast.showCustomToast("Ocorreu um problema ao salvar o pedido.");
                    VoltarParaSelecaoDaMesa();
                }
            );
        });

        $scope.$on("comandaAdicionada", function () {
            vm.comandas = pedido.getComandas();
        });

        $scope.$on("liberarAtendimento", function (event, mostrarMensagem) {
            atendimento.LiberarAtendimento().then(
                function (mensagem) {
                    if (mostrarMensagem) {
                        toast.showCustomToast(mensagem);
                    }
                    ResetPedido();
                    VoltarParaSelecaoDaMesa();
                },
                function (erro) {
                    if (mostrarMensagem) {
                        toast.showCustomToast(mensagem);
                    }
                    ResetPedido();
                    VoltarParaSelecaoDaMesa();
                });
        });

        //fim mensagens de broadcast
        $scope.$watch('atendCtrl.comanda', function (newValue, oldValue, scope) {
            pedido.setComanda(newValue);
        });

        vm.buscaComanda = function () {
            var comanda = angular.copy(vm.comanda);
            if (produtosSvc.getProdutos().length > 0) {
                if (!confirm('Existem itens no pedido. \nDeseja realmente abrir outra comanda?')) {
                    return;
                }
            }
            ResetPedido();
            vm.comanda = comanda;
            pedido.setComanda(vm.comanda);
            ObterMesaComanda();
        };

        vm.buscaComandaEnter = function ($event) {
            if ($event.which === 13) {
                ObterMesaComanda();
            }
        };

        vm.selecionarComanda = function (ev, comanda) {
            if (ev) {
                ev.preventDefault();
            }

            if (vm.microterminal.flLeitor)
            {
                $('.dropdown-toggle').dropdown('toggle');
                toast.showCustomToast("&Eacute; obrigat&oacute;rio a utiliza&ccedil;&atilde;o do leitor.");
                return;
            }

            if (!ConfirmaSaidaComandaComItens()) {
                return;
            }
            ResetPedido();
            pedido.setComanda(comanda);
            ObterMesaComanda();
            //vm.LiberarAtendimento(ObterMesaComanda, false);
            $('.dropdown-toggle').dropdown('toggle');
        };

        vm.abrirTelaComanda = function (ev) {
            ev.preventDefault();
            if (vm.microterminal.flLeitor && !config.localConfig.utilizaLeitorUsb) {
                funcoes.ScanBarCode(function (code) {
                    if (!code)
                        return false;
                    ResetPedido();
                    pedido.setComanda(code);
                    ObterMesaComanda();
                });
            }
            else {
                ModalService.showModal({
                    templateUrl: "templates/modalComanda.html",
                    controller: "ModalComandaController"
                }).then(function (modal) {
                    modal.element.modal();
                    modal.close.then(function (comanda) {
                        if (comanda) {
                            vm.flValidaDv = true;
                            ResetPedido();
                            pedido.setComanda(comanda);
                            ObterMesaComanda();
                        }
                    });
                });
            }       
        };

        var ObterMesaComanda = function () {
            var mesa = 0;
            var comanda = pedido.getComanda();
            var comandaValida = false;

            if (!funcoes.TestaValorZeradoMesaOuComanda(comanda)) {
                BloqueiaAtendimento();
                return false;
            }

            ws.ObterMesaComanda(mesa, comanda, operador.getOperador().idOperador, vm.flValidaDv)
            .then(
                function (data) {
                    var json = angular.fromJson($(data).find('ObterMesaComandaResult').text());
                    if (json.length > 0) {
                        json = json[0];
                    } else {
                        toast.showCustomToast("Houve um evento inesperado no web service. Entre em contato com o suporte.");
                        BloqueiaAtendimento();
                        return;
                    }

                    comanda = json.idComanda;
                    mesa = 0;
                    comandaValida = funcoes.ValidarComanda(json, true);
                    if (comandaValida) {
                        if (json.idMesa !== 0 && json.idMesa !== pedido.getMesa()) {
                            comandaValida = false;
                            toast.showCustomToast("A comanda solicitada est&aacute; sendo utilizada na mesa " + json.idMesa);
                        }
                    }

                    if (!comandaValida) {
                        atendimento.LiberarAtendimento();
                        BloqueiaAtendimento();
                        return false;
                    }
                    atendimento.transferirComandaParaMesaSemValidacao(json.idComanda, pedido.getMesa());
                    pedido.setComanda(comanda);
                    var itens = funcoes.MapProdutos(json.liAtendimentoItem);
                    pedido.setItensConsumidos(itens);
                    vm.comanda = comanda;
                    pedido.addComanda(comanda);
                    DesbloqueiaAtendimento();
                },
                function (error) {
                    toast.showCustomToast(error, 'zmdi zmdi-info-circle', 'info');
                    $rootScope.$digest();
                    BloqueiaAtendimento();
                }
            );
        };

        function AtualizaMesa() {
            var comanda = pedido.getComanda();
            vm.mesa = pedido.getMesa();
            vm.itensPedido = pedido.getItensConsumidos();
            vm.comandas = pedido.getComandas();
            vm.comanda = comanda;
        }

        function ConfirmaSaidaComandaComItens() {
            if (produtosSvc.getProdutos().length > 0) {
                return confirm('Existem itens no pedido. \nDeseja continuar?');
            }
            return true;
        }
        AtualizaMesa();
        if (!vm.comanda) {
            BuscaMesa();
        } else {
            atendimento.setMesaLocalizada(true);
        }
        $timeout(function () {
            $rootScope.$broadcast("itensConsumidosObtidos");
        }, 80);
    }]);