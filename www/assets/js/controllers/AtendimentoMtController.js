angular.module('app')
.controller('AtendimentoMtController', [
    '$scope',
    'atendimentoMtService',
    'operador',
    'pedido',
    'seletorBalanca',
    'atendimento',
    '$timeout',
    '$rootScope',
    'produtos',
    'toast',
    'config',
    '$location',
    'funcoes',
    '$window',
    '$q',
    'autenticacao',
    '$routeParams',
    'numericKeyboardService',
    'ModalService',
    AtendimentoMtController]);

function AtendimentoMtController($scope, atendimentoMtService, operador, pedido, seletorBalanca, atendimento, $timeout, $rootScope, produtos, toast, config, $location, funcoes, $window, $q, auth, $routeParams, numericKeyboardService, ModalService) {
    var vm = this;
    vm.atendimentoMtService = atendimentoMtService;
    vm.temItemConsumidoSelecionado = false;
    vm.temItemAdicionadoSelecionado = false;
    vm.selecionarTodosParaReimpressao = false;
    vm.comanda = {};

    // #region Eventos de Broadcast
    $scope.$on('search', function () {
        $location.url('/busca');
    });

    $scope.$on('favorites', function () {
        $location.url('/favoritos');
    });

    $scope.$on('enter', function () {
        if (parseInt(vm.valor) === 0) {
            vm.valor = '';
            return;
        }
        switch (atendimentoMtService.getPassoAtual()) {
            case atendimentoMtService.passoAtendimento.operador:
                obterOperador();
                break;
            case atendimentoMtService.passoAtendimento.comanda:
                obterComanda();
                break;
            case atendimentoMtService.passoAtendimento.mesa:
                selecionarMesa();
                break;
            case atendimentoMtService.passoAtendimento.itens:
                obterProduto();
                break;
        }

        if (atendimentoMtService.getPassoAtual() !== atendimentoMtService.passoAtendimento.itens) {
            vm.ultimoProduto = null;
        }
    });

    $scope.$on('back', function () {
        switch (atendimentoMtService.getPassoAtual()) {
            case atendimentoMtService.passoAtendimento.operador:
                passoAnteriorDoAtendimento();
                vm.comanda = {};
                break;
            case atendimentoMtService.passoAtendimento.comanda:
                if (config.tipoAtendimento === 'mesa-comanda') {
                    salvarComanda(true, true);
                    vm.comanda = {};
                }
                else
                    passoAnteriorDoAtendimento();
                break;
            case atendimentoMtService.passoAtendimento.mesa:
                passoAnteriorDoAtendimento();
                break;
            case atendimentoMtService.passoAtendimento.itens:
                salvarComanda(true, false);
                break;
        }
        vm.valor = '';
    });

    $scope.$on('limparAtendimento', function () {
        reiniciarAtendimento();
    });

    $scope.$on('$destroy', function () {
        $rootScope.mostraBotaoVoltar = true;
        $(document).unbind('keyup keydown');
        $rootScope.exibirTecladoVirtual = false;
    });

    $scope.$on("atualizarListaDeProdutos", function () {
        $timeout(function () {
            vm.itens = produtos.getProdutos();
            vm.ultimoProduto = produtos.getUltimoProdutoSelecionado();
        });
    });
    // #endregion

    // #region Watchers
    $scope.$watch('atendMtCtrl.passoAtendimento', function (newValue, oldValue, scope) {
        atendimentoMtService.setPassoAtual(newValue);
        if (newValue === atendimentoMtService.passoAtendimento.operador) {
            $rootScope.idOperador = null;
            $rootScope.stApelidoOperador = null;
        }
    });

    $scope.$watch('atendMtCtrl.selecionarTodosParaReimpressao', function (newValue, oldValue, scope) {
        _.each(vm.itensConsumidos, function (item) {
            item.selecionado = newValue;
            vm.temItemConsumidoSelecionado = newValue;
        });
    });

    $scope.$watch('atendMtCtrl.tab', function (newValue, oldValue, scope) {
        if (newValue === 'lancamento') {
            adicionaFocoNoLancamento();
            $rootScope.exibirTecladoVirtual = true;
        } else {
            $rootScope.exibirTecladoVirtual = false;
        }
        atendimentoMtService.setTab(newValue);
    });
    // #endregion    

    // #region Metodos do Escopo
    vm.itemConsumidoSelecionado = function () {
        var temItensSelecionados = _.find(vm.itensConsumidos, function (item) { return item.selecionado; });
        if ($rootScope)
            $rootScope.$broadcast("itensConsumidosSelecionados", temItensSelecionados);
    };

    vm.itensAdicionadosSelecionados = function () {
        var temItensAdicionadosSelecionados = _.find(vm.itens, function (item) { return item.selecionado; });
        if ($rootScope)
            $rootScope.$broadcast("itensAdicionadosSelecionados", temItensAdicionadosSelecionados);
    };

    vm.abrirOpcoes = function (item) {
        $location.url('/opcoes/IdProduto/' + item.idProduto + '/Origem/editar');
    };

    vm.selecionaItemAdicionado = function (item) {
        item.selecionado = !item.selecionado;
        vm.temItemAdicionadoSelecionado = listaTemItemSelecionado(vm.itens);
    };

    vm.selecionaItemConsumido = function (item) {
        item.selecionado = !item.selecionado;
        vm.temItemConsumidoSelecionado = listaTemItemSelecionado(vm.itensConsumidos);
    };

    vm.selecionarTodos = function (listaItens) {
        vm.selecionarTodosParaReimpressao = !vm.selecionarTodosParaReimpressao;
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

    vm.excluirItens = function () {
        if (vm.tab === "adicionados") {
            produtos.removerSelecionados();
            vm.itens = produtos.getProdutos();
            vm.itensAdicionadosSelecionados();
        } else if (vm.tab === "consumidos") {
            var idComanda = vm.itensConsumidos[0].idComanda;
            pedido.solicitaUsuarioParaExclusaoSeNecessario(idComanda, vm.itensConsumidos)
            .then(pedido.excluirItens)
            .then(funcoes.mostraMensagem)
            .then(excluirItensDaLista)
            .catch(funcoes.MostraMensagem);
        }

    };

    var excluirItensDaLista = function(){
        vm.itensConsumidos = _.filter(vm.itensConsumidos, function (item) {
            return !item.selecionado;
        });
        vm.itemConsumidoSelecionado();
        $rootScope.$broadcast("marcarItensConsumidos", false);
    }

    vm.obterQuantideProduto = function (item) {
        if (item.flFracionado) {
            return item.qt / 100;
        }
        return item.qt;
    };
    // #endregion

    // #region Metodos Privados
    var obterProduto = function () {
        var arrProduto, codigo, quantidade;
        var retorno = true;
        if (vm.valor.indexOf('*') >= 1) {
            arrProduto = vm.valor.split('*');
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
            codigo = parseInt(vm.valor);
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
                    vm.valor = '';
                } else {
                    prod[0].qt = quantidade;
                    produtos.setUltimoProdutoSelecionado(prod[0]);
                    produtos.adicionarProduto(prod[0]).then(function (produtoAdicionado) {                                             
                        vm.itens = produtos.getProdutos();
                        MostrarSelecaoDeAdicionais(produtoAdicionado);   
                        vm.ultimoProduto = prod[0];
                        vm.valor = '';
                        produtos.obterQuantidadeParaItemFracionado(produtos.getUltimoProdutoSelecionado());
                    },
                    function (reason) {
                        toast.showCustomToast("Não foi possível adicionar o produto. Razão: " + reason);
                        vm.valor = '';
                    });
                }
            }, function (error) {
                toast.showCustomToast(error);
                vm.valor = '';
            });
        } else {
            vm.valor = '';
        }
    };

    var MostrarSelecaoDeAdicionais = function (prod) {
        if (prod.flRequererItemAdicional) {
            ModalService.showModal({
                templateUrl: "templates/modalAdicionais.html",
                controller: "ModalAdicionaisController",
                inputs: {
                    produto: prod
                }
            }).then(function (modal) {
                modal.element.modal();
            });
        }
    };

    var onComandaError = function (mensagem) {
        if (mensagem) {
            toast.showCustomToast(mensagem);
        }
        vm.valor = '';
        pedido.setComanda(null);
    };
    var obterComanda = function () {
        pedido.setComanda(vm.valor);
        atendimento.ObterComanda().then(
            function (json) {
                var objValidacao = funcoes.ValidaComandaEmMesaDiferente(json, vm.comanda.idMesa);
                if (!objValidacao.ehValida) {
                    onComandaError(objValidacao.mensagem);
                    return;
                }
                if (vm.comanda.idMesa) {
                    transfereComandaParaMesa(vm.comanda.idMesa).then(
                        function () {
                            json.idMesa = vm.comanda.idMesa || 0;
                            vm.comanda = json;
                            atendimentoMtService.setComanda(vm.comanda);
                            passoPosteriorDoAtendimento();
                            $timeout(function () {
                                vm.itensConsumidos = pedido.getItensConsumidos();
                            }, 200);
                            vm.valor = '';
                        },
                        function () {
                            onComandaError("Não foi possível transferir a comanda para a mesa informada.");
                        });
                } else {
                    vm.comanda = json;
                    atendimentoMtService.setComanda(vm.comanda);
                    passoPosteriorDoAtendimento();
                    $timeout(function () {
                        vm.itensConsumidos = pedido.getItensConsumidos();
                    }, 200);
                    vm.valor = '';
                }
            }, function (error) {
                onComandaError();
            });
    };

    var obterOperador = function () {
        operador.obterOperador(vm.valor).then(
               function (json) {
                   operador.setOperador(json);
                   $rootScope.idOperador = json.idOperador;
                   $rootScope.stApelidoOperador = json.stApelido;
                   seletorBalanca.iniciarBalanca();
                   passoPosteriorDoAtendimento();
                   vm.valor = '';
               }, function () {
                   vm.valor = '';
               });
    };

    var selecionarMesa = function () {
        switch (config.tipoAtendimento) {
            case 'mesa':
                obterMesa(true, true);
                break;
            case 'comanda':
                transfereComandaParaMesa(vm.valor).then(function () {
                    passoPosteriorDoAtendimento();
                    vm.valor = '';
                }, function () {
                    vm.valor = '';
                });
                break;
            case 'mesa-comanda':
                obterMesa(false, false);
                break;
        }
    };

    var obterMesa = function (validarMesaComMultiplasComandas, salvarAtendimento) {
        atendimento.obterMesa(vm.valor, validarMesaComMultiplasComandas, salvarAtendimento).then(
           function () {
               passoPosteriorDoAtendimento();
               vm.comanda.idMesa = pedido.getMesa();
               atendimentoMtService.setComanda(vm.comanda);
               $timeout(function () {
                   vm.itensConsumidos = pedido.getItensConsumidos();
               }, 200);
               vm.valor = '';
           },
           function (error) {
               toast.showCustomToast(error);
               vm.valor = '';
           });
    };

    var transfereComandaParaMesa = function (idMesa) {
        var deferred = $q.defer();
        if (!idMesa || idMesa === 0) {
            deferred.reject();
        } else if (Number.isInteger(parseInt(idMesa))) {
            atendimento.transferirComandaParaMesaSemValidacao(pedido.getComanda(), idMesa)
              .then(function (msg) {
                  vm.comanda.idMesa = idMesa;
                  deferred.resolve();
              }, function (error) {
                  deferred.reject();
                  toast.showCustomToast(error);
              });
        } else {
            deferred.resolve();
        }
        return deferred.promise;
    };

    var passoPosteriorDoAtendimento = function () {
        var passo;
        switch (atendimentoMtService.getPassoAtual()) {
            case atendimentoMtService.passoAtendimento.operador:
                passo = config.tipoAtendimento === 'comanda' ? atendimentoMtService.passoAtendimento.comanda : atendimentoMtService.passoAtendimento.mesa;
                break;
            case atendimentoMtService.passoAtendimento.comanda:
                passo = atendimentoMtService.passoAtendimento.itens;
                break;
            case atendimentoMtService.passoAtendimento.mesa:
                passo = config.tipoAtendimento === 'mesa-comanda' ? atendimentoMtService.passoAtendimento.comanda : atendimentoMtService.passoAtendimento.itens;
                break;
        }
        vm.passoAtendimento = passo;
    };

    var passoAnteriorDoAtendimento = function () {
        var passo;
        switch (atendimentoMtService.getPassoAtual()) {
            case atendimentoMtService.passoAtendimento.itens:
                passo = config.tipoAtendimento === 'mesa-comanda' ? atendimentoMtService.passoAtendimento.comanda : obterPassoAnteriorComandaOuMesa();
                break;
            case atendimentoMtService.passoAtendimento.comanda:
                passo = obterPassoAnteriorParaComanda();
                break;
            case atendimentoMtService.passoAtendimento.mesa:
                passo = atendimentoMtService.passoAtendimento.operador;
                break;
            case atendimentoMtService.passoAtendimento.operador:
                passo = atendimentoMtService.passoAtendimento.operador;
                break;
        }
        vm.passoAtendimento = passo;
        liberaAtendimentoSeNecessario();
    };

    var obterPassoAnteriorComandaOuMesa = function () {
        var passo = config.tipoAtendimento === 'comanda' ? atendimentoMtService.passoAtendimento.comanda : atendimentoMtService.passoAtendimento.mesa;
        if (!config.microterminal.flFixarOperador){
            passo = atendimentoMtService.passoAtendimento.operador;
            vm.comanda = {};
        }

        return passo;
    };

    var obterPassoAnteriorParaComanda = function () {
        var passo;
        switch (config.tipoAtendimento) {
            case 'comanda':
                passo = atendimentoMtService.passoAtendimento.operador;
                break;
            case 'mesa-comanda':
                if (!config.microterminal.flFixarOperador)
                    passo = atendimentoMtService.passoAtendimento.operador;
                else
                    passo = atendimentoMtService.passoAtendimento.mesa;
                break;
        }
        return passo;
    };

    var obterUltimoPassoDoAtendimento = function () {
        vm.passoAtendimento = atendimentoMtService.getPassoAtual();
        vm.comanda = atendimentoMtService.getComanda() || {};
        vm.itensConsumidos = pedido.getItensConsumidos();
        vm.itens = produtos.getProdutos();
        produtos.setProdutosBusca([]);
        $rootScope.mostraBotaoVoltar = false;
        atendimento.setTipoAtendimentoOriginal(config.tipoAtendimento);
        adicionaFocoNoLancamento();
        $rootScope.exibirTecladoVirtual = true;
        $timeout(function () {
            funcoes.SetImmersiveMode();
        });
    };

    var obterUltimaAbaSelecionada = function () {
        vm.tab = atendimentoMtService.getTab() || 'lancamento';
        if (vm.tab != 'lancamento')
            $rootScope.exibirTecladoVirtual = false;

    };

    var listaTemItemSelecionado = function (arrItens) {
        var temItemSelecionado = false;
        _.each(arrItens, function (item) {
            if (item.selecionado) {
                temItemSelecionado = true;
            }
        });
        return temItemSelecionado;
    };

    var salvarComanda = function (imprimirPedido, imprimirTodasComandas) {
        pedido.salvarPedido(imprimirPedido, imprimirTodasComandas, true).then(
                function () {
                    limparItensDoAtendimento();
                },
                function () {
                    //ResetPedido();
                }
            );
    };

    var salvarMesa = function () {
        pedido.salvarPedido(true, true, true).then(
           function () {
               limparItensDoAtendimento();
           },
           function () {
               //ResetPedido();
           }
       );
    };

    var limparItensDoAtendimento = function () {
        vm.itens = [];
        vm.itensConsumidos = [];
        vm.ultimoProduto = null;
        produtos.limparProdutos();
        produtos.limparBuscaProdutos();
        atendimento.LiberarAtendimento();
        vm.comanda.idComanda = null;
        pedido.setComanda(null);
        passoAnteriorDoAtendimento();
    };

    var liberaAtendimentoSeNecessario = function () {
        var flLiberarAtendimento = false;
        switch (vm.passoAtendimento) {
            case atendimentoMtService.passoAtendimento.comanda:
                if (config.tipoAtendimento === 'comanda')
                    flLiberarAtendimento = true;
                break;
            case atendimentoMtService.passoAtendimento.mesa:
                flLiberarAtendimento = true;
                break;
            case atendimentoMtService.passoAtendimento.operador:
                if (!config.configuracao.flFixarOperador)
                    flLiberarAtendimento = true;
                break;
        }

        if (flLiberarAtendimento) {
            atendimento.LiberarAtendimento();
            pedido.limparPedido();
        }
    };

    var reiniciarAtendimento = function () {
        vm.temItemConsumidoSelecionado = false;
        vm.temItemAdicionadoSelecionado = false;
        vm.selecionarTodosParaReimpressao = false;
        vm.comanda = {};
        selecionaPassoInicial();
        liberaAtendimentoSeNecessario();        
    };

    var selecionaPassoInicial = function () {
        switch (config.tipoAtendimento) {
            case 'comanda':
                vm.passoAtendimento = atendimentoMtService.passoAtendimento.comanda;
                break;
            case 'mesa':
            case 'mesa-comanda':
                vm.passoAtendimento = atendimentoMtService.passoAtendimento.mesa;
                break;
        }
        if (!config.configuracao.flFixarOperador)
            vm.passoAtendimento = atendimentoMtService.passoAtendimento.operador;
    };

    var adicionaFocoNoLancamento = function () {
        $timeout(function () {
            $("#div-input").click();
        }, 200);
    };

    var enviarCaractere = function (caractere) {
        if (caractere.length > 1)
            return;
        var regex = /[a-zA-Z0-9]|[\@\#\$\%\&\*\+\-\/]/;
        if (caractere && regex.test(caractere.toString())) {
            numericKeyboardService.append(caractere);
        }
    };

    $(document).on('keydown', function (event) {
        if ($rootScope.modalAberta)
            return;

        event.preventDefault();
        switch (event.key) {
            case 'Enter':
                numericKeyboardService.enter();
                break;
            case 'Backspace':
                numericKeyboardService.backSpace();
                break;
            case 'Delete':
                numericKeyboardService.clear();
                break;
            default:
                enviarCaractere(event.key);
                break;
        }

        $scope.$apply();
    });
    // #endregion

    // #region Chamada de metodos para inicialização do controller
    obterUltimoPassoDoAtendimento();    
    obterUltimaAbaSelecionada();
    $timeout(function(){
        $rootScope.atendimentoIniciado = true;
    });   
    
    if ($routeParams.flLimpar) {
        reiniciarAtendimento();
    }
    $rootScope.$on('$routeChangeSuccess', function (event, current, previous) {
        var rotasSemMenu = ['/config', '/configServer', '/logs'];
        if (_.contains(rotasSemMenu, previous.$$route.originalPath)) {
            $timeout(function(){
                reiniciarAtendimento();
            });
        }
    });
    // #endregion    
}