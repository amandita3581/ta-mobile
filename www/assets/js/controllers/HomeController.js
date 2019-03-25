angular.module('app').controller('HomeController', ['$scope', '$location', 'config', '$timeout', 'atendimento', 'pedido', 'ws', 'toast', 'funcoes', '$rootScope', '$routeParams', HomeController]);

function HomeController($scope, $location, config, $timeout, atendimento, pedido, ws, toast, funcoes, $rootScope, $routeParams) {
    var vm = this;
    vm.operador = '';
    vm.configuracaoObtida = false;
    var verificarConfiguracoesApp = function () {
        if (config.apiUrl) {
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
                                    $timeout(function () {
                                        vm.config = config;
                                        vm.configuracaoObtida = true;
                                        vm.ativarModoTablet = parseInt(config.localConfig.ativarModoTablet);
                                    });                                    
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
    };
    verificarConfiguracoesApp();

    vm.transferir = function (ev) {
        if (ev)
            ev.preventDefault();
        operador.setOperador(null);
        $rootScope.idOperador = null;
        $rootScope.stApelidoOperador = null;
        var configAtendimento = config.tipoAtendimento;
        if (configAtendimento == 'comanda' || configAtendimento == 'mesa') {
            if (pedido.getItensConsumidos().length < 1) {
                toast.showCustomToast('Não existem itens para transferir.');
                return false;
            }
        }

        if (configAtendimento == "comanda")
            $location.url('/transferirComanda/origem/' + pedido.getComanda());
        else if (configAtendimento == "mesa")
            $location.url('/transferirMesa/origem/' + pedido.getMesa());
        else if (configAtendimento == "mesa-comanda")
            $location.path('/transferirMesaComanda');
    };

    $scope.$on('transfer', function () {
        $timeout(function () { 
            vm.transferir();
        });
    });
}
