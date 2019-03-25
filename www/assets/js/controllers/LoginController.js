angular.module('app').controller('LoginController', ['$scope', '$location', 'config', 'ws', '$rootScope', 'pedido', 'toast', '$timeout', 'funcoes', 'atendimento', 'operador', LoginController]);

function LoginController($scope, $location, config, ws, $rootScope, pedido, toast, $timeout, funcoes, atendimento, operador) {
    var vm = this;
    vm.operador = '';
    vm.Entrar = function (event) {
        if (!vm.operador || !vm.senha) {
            toast.showCustomToast("Digite o número do operador e a senha.");
            return;
        }
        var regex = new RegExp(/\D/);
        if (regex.test(vm.operador)){
            toast.showCustomToast("Somente números são permitidos para Operador.");
            return;
        }

        if (regex.test(vm.senha)) {
            toast.showCustomToast("Somente números são permitidos para Senha.");
            return;
        }

        ws.ObterOperadorValida(vm.operador, vm.senha, 11).then(
        function (dados) {
            $timeout(function () {
                var json = angular.fromJson($(dados).find('ObterOperadorValidaResult').text());
                if (!json) {
                    toast.showCustomToast("Não foi possível obter a resposta do web service.");
                    return;
                }
                if (!json.FlagMensagem) {
                    toast.showCustomToast(json.Mensagem, null, 'info');
                } else {
                    var configs = localStorage.getItem('config');
                    if (configs) {
                        var conf = angular.fromJson(configs);
                        config.localConfig = conf;
                    } else {
                        toast.showCustomToast('Terminal não configurado.');
                        $location.url('/config');
                    }

                    operador.setOperador(json);
                    $rootScope.idOperador = json.idOperador;
                    $rootScope.stApelidoOperador = json.stApelido;
					
                    if (config.localConfig.utilizaLeitorUsb != '1') 
						config.localConfig.utilizaLeitorUsb = 0;
					else
						config.localConfig.utilizaLeitorUsb = 1;
					
                    if (!config.microterminal.flLeitor) config.localConfig.utilizaLeitorUsb = 0;
					
					if(config.localConfig.ativarModoTablet != '1') 
						config.localConfig.ativarModoTablet = 0;
					else
						config.localConfig.ativarModoTablet = 1;
                            
                    atendimento.setTipoAtendimentoOriginal(config.tipoAtendimento);
                    if (config.tipoAtendimento != 'comanda') {
                        $location.url('/inicioAtendimentoMesa');
                    } else {
                        $location.url('/atendimento');
                    }
                    iniciaBalanca();
                }
            });
        },
        function (error) {
            alert("Ocorreu um evento inesperado ao obter o operador.");
        });
    };

    if (config.apiUrl) {
        //Libera o atendimento da ultima comanda utilizada;
        atendimento.LiberarAtendimento().then(
			function (resp) {
			    pedido.limparPedido();
			},
			function (resp) {
			    pedido.limparPedido();
			}
		);

        ws.ObterRespostaWebService(config.apiUrl)
			.then(function (data) {
			    var json = angular.fromJson($(data).find('ObterRespostaWebServiceResult').text());
			    if (!json.flagRetorno) {
			        toast.showCustomToast(json.Mensagem);
			        $location.url('/configServer');
			    } else {
			        funcoes.VerificaConfiguracaoMesa().then(
                        function (arrConfig) {
                            if (arrConfig[0].flagRetorno) {
                                config.configuracao = arrConfig[0];
                                config.microterminal = arrConfig[1];
                                funcoes.VerificaConfiguracoes();
                                config.tipoAtendimento = pedido.getConfigAtendimento();
                                $rootScope.$broadcast('configuracaoObtida');
                            } else {
                                toast.showCustomToast('Não foi possível obter a configuração.');
                                $location.url('/');
                            }
                        },
                        function (error) {
                            if (!error.customError) {
                                toast.showCustomToast(error);
                                $location.url('/');
                            }
                        }
                    );
			    }
			},
			function (error) {
			    alert('O servidor não está respondendo.\nPor favor, verifique se as configurações estão corretas.');
			    $location.url('/configServer');
			}
		);
    }

    function iniciaBalanca() {
        document.addEventListener("deviceready", function () {
            if (!config.microterminal.stBalanca || config.microterminal.stBalanca.trim() == 'SEM BALANCA')
                return;

            var errorCallback = function (error) {
                alert("Não foi possível iniciar a comunicação com a balança configurada.");
            };
            serial.requestPermission(
                 function () {
                     serial.open(
                         { baudRate: 9600 },
                         function () {
                             app.serialPortIsOpen = true;
                             serial.registerReadCallback(
                                 function success(data) {
                                     clearTimeout(readingTimeout);
                                     readingTimeout = setTimeout(function () {
                                         var $rootScope = angular.element(document.body).injector().get('$rootScope');
                                         $rootScope.$broadcast("pesoObtido", str);
                                         str = '';
                                     }, 1000);
                                     var view = new Uint8Array(data);
                                     if (view.length > 0) {
                                         for (i = 0; i < view.length; i++) {
                                             str += String.fromCharCode(view[i]);
                                         }
                                     }
                                 },
                                 errorCallback
                             );
                         },
                         errorCallback
                     );
                 },
                errorCallback
            );

        });
    }
}
