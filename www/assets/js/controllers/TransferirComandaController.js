angular.module("app").controller("TransferirComandaController", ['autenticacao', '$routeParams', 'atendimento', 'funcoes', 'config', 'operador',
    function (auth, $routeParams, atendimento, funcoes, config, operador) {
        var vm = this;
        vm.comandaOrigem = $routeParams.origem;
        vm.config = config;
		vm.digitacaoPermitida = operador.temPermissao(160);
        vm.autenticar = function (comanda) {
            auth.solicitarUsuarioSenha(151).then(
                function (data) {
                    if (vm.tab == 'comanda-mesa'){
                        atendimento.transferirComandaParaMesa(vm.comandaOrigem, vm.mesaDestino, data.usuario, data.senha)
                            .then(
                                function (success) {
                                    atendimento.getUrlRetornoComanda();
                                },
                                function (error) {

                                });
					}
                    else if (vm.tab == 'comanda-comanda'){
                        atendimento.transferirComanda(vm.comandaOrigem, comanda, data.usuario, data.senha)
                            .then(
                                function (success) {
                                    atendimento.getUrlRetornoComanda();
                                },
                                function (error) {

                                });
					}
                }
            );
        };

        vm.openBarCodeScanner = function () {
            funcoes.ScanBarCode(function (code) {
                if (!code)
                    return false;
                vm.autenticar(code);
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
                                $("#comandaDestino").focus();
                            },
                            function () {
                                vm.digitacaoPermitida = false;
                            }
                        );
                }
            }
        };

    }]);