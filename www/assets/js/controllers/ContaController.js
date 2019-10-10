angular.module('app').controller('ContaController', ['$rootScope', '$scope', 'produtos', 'pedido', 'config', 'ws', 'funcoes', 'toast', '$location', '$routeParams', '$timeout', 'atendimento', 'operador', ContaController]);

function ContaController($rootScope, $scope, produtos, pedido, config, ws, funcoes, toast, $location, $routeParams, $timeout, atendimento, operador) {
    var vm = this;
    vm.mesa = pedido.getMesa();
    vm.comanda = pedido.getComanda();
    vm.operador = operador.getOperador();
    vm.terminal = config.ip;
    vm.valorServico = 0;
    vm.configuracao = config.configuracao;
    vm.microterminal = config.microterminal;
    vm.date = new Date();
    vm.tipoAtendimento = config.tipoAtendimento;
    vm.getTotalComanda = function (itens) {
        return TotalComanda(itens);
    };

    vm.emitirConta = function () {
        var arrayDeComandas = funcoes.MapComandas(vm.comandas);
        var stringComandas = funcoes.ArrayToString(arrayDeComandas, true);
        pedido.emitirConta(vm.mesa, stringComandas, operador.getOperador().idOperador, config.ip)
            .then(
                function (data) {
                    var json = angular.fromJson($(data).find('EmitirContaResult').text());
                    toast.showCustomToast(json.Mensagem);
                    if (json.FlagMensagem) {
                        atendimento.getUrlRetornoComanda();
                        $timeout(function () { $rootScope.$apply(); });
                    }
                },
                function (error) {
                    console.log(error);
                }
            );
    };
    //Se veio a comanda, é emissão de conta por comanda;
    if ($routeParams.comanda) {
        vm.mesa = 0;
        vm.comada = $routeParams.comanda;
    } else {
        vm.comanda = 0;
    }


    ws.ObterMesaComanda(vm.mesa, vm.comanda, vm.operador.idOperador, false).then(
        function (data) {
            var json = angular.fromJson($(data).find('ObterMesaComandaResult').text());
            vm.comandas = json;

            var comandasSelecionadas = [];
            if ($routeParams.comandas) {
                comandasSelecionadas = angular.fromJson($routeParams.comandas);
                vm.comandas = _.filter(vm.comandas, function (item) {
                    var retornar = false;
                    _.each(comandasSelecionadas, function (numComanda) {
                        if (numComanda == item.idComanda) {
                            retornar = true;
                        }
                    });
                    return retornar;
                });
            }

            _.each(vm.comandas, function (item) {
                item.liAtendimentoItem = funcoes.MapProdutos(item.liAtendimentoItem);

            });

            if (vm.comandas.length > 1) {
                vm.pessoas = vm.comandas.length;
            } else {
                vm.pessoas = vm.comandas[0].nrPessoas;
            }

            _.each(vm.comandas, function (comanda) {
                var itens = [];
                _.each(comanda.liAtendimentoItem, function (item) {
                    if (vm.configuracao.flFechamentoAnalitico) {
                        if (item.flFracionado) {
                            itens.push(item);
                        } else {
                            for (var qt = 0; qt < item.nrQuantidade; qt++) {
                                var clone = _.clone(item);
                                clone.nrQuantidade = 1;
                                clone.vrTotal = item.vrUnitario;
                                if (qt == (item.nrQuantidade - 1)) {
                                    _.each(clone.adicionais, function (adicional) {
                                        adicional.vrTotal = adicional.vrUnitario;
                                    });
                                    _.each(clone.fracionados, function (fracionado) {
                                        fracionado.vrTotal = fracionado.vrUnitario;
                                    });
                                } else {
                                    clone.adicionais = [];
                                    clone.fracionados = [];
                                }
                                itens.push(clone);
                            }
                        }
                    } else {
                        var flagExiste = false;
                        var itemLocalizado = _.find(itens, function (i) {
                            return i.idProduto == item.idProduto;
                        });
                        if (itemLocalizado) {
                            itemLocalizado.nrQuantidade += item.nrQuantidade;
                            itemLocalizado.vrTotal += item.vrTotal;
                            SomaAdicionais(itemLocalizado, item);
                        }
                        else {
                            itens.push(item);
                        }
                    }
                });
                comanda.liAtendimentoItem = itens;
            });

            vm.subTotal = TotalMesa(vm.comandas);
            vm.valPessoa = vm.getTotalGeral(vm.comandas) / vm.pessoas;
            vm.stNomeFantasia = config.configuracao.stNomeFantasia;
            $scope.$apply();
        },
        function (error) {

        }
    );

    function SomaAdicionais(itemLocalizado, novoItem) {
        _.each(novoItem.adicionais, function (adicionalNovo) {
            var localizado = _.find(itemLocalizado.adicionais, function (adicionalLocalizado) {
                return adicionalNovo.idProduto == adicionalLocalizado.idProduto;
            });
            if (localizado) {
                localizado.vrTotal += adicionalNovo.vrTotal;
            } else {
                itemLocalizado.adicionais.push(adicionalNovo);
            }
        });
    }

    function TotalMesa(comandas) {
        var total = 0;
        _.each(comandas, function (comanda) {
            total += TotalComanda(comanda.liAtendimentoItem);
        });

        return total;
    }

    function TotalComanda(itens) {
        var total = 0;
        _.each(itens, function (item) {
            total += item.vrTotal;
            if (item.adicionais) {
                if (item.adicionais.length > 0) {
                    _.each(item.adicionais, function (itemAdicional) {
                        total += itemAdicional.vrTotal;
                    });
                }
            }
        });
        return total;
    }

    function TotalComTaxa(comandas) {
        var vrTotalItensComTaxa = 0;
        _.each(comandas, function (comanda) {
            _.each(comanda.liAtendimentoItem, function (item) {
                if (item.flTaxaServico)
                    vrTotalItensComTaxa += item.vrTotal;
            });
        });
        return vrTotalItensComTaxa;
    }

    vm.getTaxaServicoTotal = function (comandas) {
        var totalTaxa = 0;
        var totalParcial = 0;
        _.each(comandas, function (comanda) {
            _.each(comanda.liAtendimentoItem, function (item) {
                if (item.flTaxaServico)
                    totalParcial += item.vrTotal * vm.configuracao.vrTaxaServico
            });
            totalTaxa = vm.truncateDecimals(totalParcial);
        });

        //var totalComTaxa = TotalComTaxa(comandas);
        //totalComTaxa = totalComTaxa * vm.configuracao.vrTaxaServico;
        return totalTaxa;
    };

    vm.getTotalGeral = function (comandas) {
        if (vm.microterminal.fltaxaServico)
            return TotalMesa(comandas) + vm.getTaxaServicoTotal(comandas);
        else
            return TotalMesa(comandas);
    };

    vm.truncateNumber = function (value) {
        return Math.floor(value * 100) / 100;
    }

    vm.truncateDecimals = function (value) {
        return Math.trunc(value * 100) / 100;
    }
}