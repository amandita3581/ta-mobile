angular.module('app').controller('TransferirMesaComandaController', ['pedido', 'funcoes', '$routeParams', 'autenticacao', 'toast', 'ws', '$location', '$rootScope', 'config', '$timeout', '$scope', 'operador', TransferirMesaComandaController]);

function TransferirMesaComandaController(pedido, funcoes, $routeParams, autenticacao, toast, ws, $location, $rootScope, config, $timeout, $scope, operador) {
    var vm = this;
    vm.mesaOrigem = parseInt(pedido.getMesa());
    vm.comandas = pedido.getComandas();
    vm.microterminal = config.microterminal;
    vm.config = config;
    vm.comandaLeitor = '';
	vm.digitacaoPermitida = operador.temPermissao(160);

    vm.autenticar = function (metodo, destino) {
        if (!validaDadosDeTransferencia(metodo, destino))
            return;

        autenticacao.solicitarUsuarioSenha(151).then(
            function (data) {
                Transferir(metodo, data.usuario, data.senha, destino);
            }
        );
    };

    var validaDadosDeTransferencia = function (metodo, destino) {
        if (metodo == 'mesa') {
            if (!vm.mesaOrigem || !vm.mesaDestino) {
                $timeout(function () {
                    toast.showCustomToast('Selecione a mesa de origem e a mesa de destino.');
                }, 50);
                return false;
            }
        } else if (metodo == 'comanda') {
            if (!vm.comandaOrigem || !destino) {
                $timeout(function () {
                    toast.showCustomToast('Selecione a comanda de origem e a comanda de destino.');
                }, 50);
                return false;
            }
        } else if (metodo == 'comanda-mesa') {
            if (!vm.comandaOrigem2 || !destino) {
                $timeout(function () {
                    toast.showCustomToast('Selecione uma ou mais comandas de origem e a mesa de destino.');
                }, 50);
                return false;
            }
        }
        return true;
    };


    vm.openBarCodeScanner = function (ev) {
        ev.preventDefault();
        funcoes.ScanBarCode(function (code) {
            if (!code)
                return;
            vm.comandaLeitor = code;
            vm.origemComanda = 'leitor';
            vm.autenticar("comanda", code);
        });
    };


    vm.validarLeitor = function (event) {
		event.stopPropagation();
        if (vm.config.microterminal.flLeitor && !vm.config.localConfig.utilizaLeitorUsb) {
            vm.openBarCodeScanner();
        } else {
            if (!vm.digitacaoPermitida) {
                autenticacao.solicitarUsuarioSenha(160)
                    .then(
                        function () {
                            vm.digitacaoPermitida = true;
                            $("#comandaDestino").focus();
                        },
                        function () {
                            vm.digitacaoPermitida = false;
                        }
                    );
            }
        }
    };

    function Transferir(metodo, usuario, senha, destino) {
        if (metodo) {
            switch (metodo) {
                case 'mesa':
                    //vm.TransferirMesa(usuario,senha);
                    vm.TransferirComandaMesa(usuario, senha, funcoes.ArrayToString(pedido.getComandas()), vm.mesaDestino, true);
                    break;
                case 'comanda-mesa':
                    var desbloquearMesa = vm.comandas.length == vm.comandaOrigem2.length;
                    vm.TransferirComandaMesa(usuario, senha, funcoes.ArrayToString(vm.comandaOrigem2), vm.mesaDestino2, desbloquearMesa);
                    break;
                case 'comanda':
                    vm.TransferirComanda(usuario, senha);
                    break;
            }
        }
    }
    vm.TransferirMesa = function (usuario, senha) {
        if (!vm.mesaDestino) {
            toast.showCustomToast('Digite a mesa de destino.');
            return false;
        }

        if (vm.mesaDestino == vm.mesaOrigem) {
            toast.showCustomToast('Transferência para a mesma mesa bloqueada.');
            return;
        }

        if (!funcoes.TestaValorZeradoMesaOuComanda(vm.mesaDestino)) {
            return false;
        }
        ws.ObterMesa(vm.mesaDestino)
        .then(
            function (data) {
                var json = angular.fromJson($(data).find('ObterMesaResult').text());
                if (!json.FlagMensagem) {
                    toast.showCustomToast(json.Mensagem);
                } else {
                    // Se a mesa não estiver bloqueada, bloqueia e transfere.
                    if (!json.FlagBloqueada) {
                        ws.BloqueiaDesbloqueiaMesa(vm.mesaDestino, 1, 0, operador.getOperador().idOperador)
						.then(
							//Se a mesa foi bloqueada com sucesso, é liberado o atendimento para o usuário.
							function (data) {
							    EfetuarTransferencia('TransferirMesa', vm.mesaOrigem, vm.mesaDestino, usuario, senha);
							},
							function (error) {

							}
						);
                    } else {
                        EfetuarTransferencia('TransferirMesa', vm.mesaOrigem, vm.mesaDestino, usuario, senha);
                    }
                }
            },
            function (error) {
                toast.showCustomToast(error);
            }
        );
    };
    vm.TransferirComanda = function (usuario, senha) {
        var comandaDestino = vm.comandaDestino; //= (vm.microterminal.flLeitor || vm.origemComanda == "leitor") ? vm.comandaLeitor : vm.comandaDestino;
        if (vm.origemComanda == "leitor")
            comandaDestino = vm.comandaLeitor;



        if (!comandaDestino || !vm.comandaOrigem) {
            toast.showCustomToast('Selecione a comanda de origem e a comanda de destino.');
            return;
        }

        if (comandaDestino == vm.comandaOrigem) {
            toast.showCustomToast('Transferência para a mesma comanda bloqueada.');
            return;
        }
        ws.ObterMesaComanda(0, comandaDestino, operador.getOperador().idOperador, true).then(
            function (data) {
                var comandaValida = true;
                var json = angular.fromJson($(data).find('ObterMesaComandaResult').text());
                if (json.length > 0) {
                    comandaValida = funcoes.ValidarComanda(json[0], true);
                    if (!comandaValida) {
                        return false;
                    }
                    EfetuarTransferencia('TransferirComanda', vm.comandaOrigem, json[0].idComanda, usuario, senha);
                } else {
                    toast.showCustomToast("Houve um evento inesperado no web service. Entre em contato com o suporte.");
                    return;
                }
            },
			function (error) {
			    toast.showCustomToast(error);
			    $rootScope.$digest();
			}
        );
    };
    vm.TransferirComandaMesa = function (usuario, senha, comandasOrigem, mesaDestino, desbloquearMesa) {
        if (!mesaDestino) {
            toast.showCustomToast('Digite a mesa de destino.');
            return false;
        }

        if (!funcoes.TestaValorZeradoMesaOuComanda(mesaDestino)) {
            return false;
        }

        ws.ObterMesa(mesaDestino)
        .then(
            function (data) {
                var json = angular.fromJson($(data).find('ObterMesaResult').text());
                if (!json.FlagMensagem) {
                    toast.showCustomToast(json.Mensagem);
                } else {
                    // Se a mesa não estiver bloqueada, bloqueia e transfere.
                    if (!json.FlagBloqueada) {
                        ws.BloqueiaDesbloqueiaMesa(mesaDestino, 1, 0, operador.getOperador().idOperador)
						.then(
							//Se a mesa foi bloqueada com sucesso, é liberado o atendimento para o usuário.
							function (data) {
							    EfetuarTransferencia('TransferirComandaMesa', comandasOrigem, mesaDestino, usuario, senha, desbloquearMesa);
							},
							function (error) {

							}
						);
                    } else {
                        EfetuarTransferencia('TransferirComandaMesa', comandasOrigem, mesaDestino, usuario, senha, desbloquearMesa);
                    }
                }
            },
            function (error) {
                toast.showCustomToast(error);
            }
        );
    };
    function EfetuarTransferencia(metodo, origem, destino, usuario, senha, desbloquearMesa) {
        ws[metodo](origem, destino, usuario, senha).then(
            function (data) {
                var json = angular.fromJson($(data).find(metodo + 'Result').text());
                if (json.FlagMensagem) {
                    if (desbloquearMesa) {
                        ws.BloqueiaDesbloqueiaMesa(vm.mesaOrigem, 0, 0, operador.getOperador().idOperador);
                    }
                    toast.showCustomToast('Transferência realizada com sucesso!');
                    if (config.localConfig.ativarModoTablet)
                    {
                        $timeout(function () {
                            $location.url('/atendimentoMt/limpar/true');
                        }, 1000);                        
                    }
                    else
                        $location.url('/inicioAtendimentoMesa');
                    $rootScope.$apply();
                } else {
                    toast.showCustomToast(json.Mensagem);
                }
            },
            function (error) {
                toast.showServerErrorToast();
            }
        );
    }
}