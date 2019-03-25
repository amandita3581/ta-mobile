angular.module('app', ['ngRoute', 'ngMessages', 'angular-md5', 'ngToast', 'ui.bootstrap-slider', 'ngCordova', 'angularModalService', 'ngAnimate', 'numericKeyboard', 'mn']);
angular.module('app').run(['$rootScope', 'ws', 'config', '$location', 'pedido', 'toast', 'funcoes', 'produtos', '$timeout', 'atendimento',
    function ($rootScope, ws, config, $location, pedido, toast, funcoes, produtos, $timeout, atendimento) {
    //configurações de mudança de rotas
    $rootScope.$on('$routeChangeSuccess', function (event, current, previous) {
        if (current.$$route) {
            $rootScope.pageTitle = current.$$route.title;
            $rootScope.backAction = current.$$route.backAction;
            $rootScope.backActionModoTablet = current.$$route.backActionModoTablet ? current.$$route.backActionModoTablet : current.$$route.backAction;
        }

        if (!current.$$route) return false;

        if (current.$$route.originalPath === '/' && config.localConfig && !config.localConfig.ativarModoTablet) {
            $rootScope.idOperador = '';
        }

        var rotasSemMenu = ['/config', '/', '/configServer', '/logs', '/inicioAtendimentoMesa', '/home'];
        if (_.contains(rotasSemMenu, current.$$route.originalPath)) {
            $timeout(function () {
                $rootScope.atendimentoIniciado = false;
            });
        } else {
            $timeout(function () {
                $rootScope.atendimentoIniciado = true;
            });
        }
    });

    // na tela de atendimento, ao clicar no voltar, pede confirmação
    $rootScope.$on('$routeChangeStart', function (event, next, current) {
        if (current) {
            if (current.controller === "AtendimentoController") {
                if (next.controller === 'InicioAtendimentoMesaController' || next.controller === 'HomeController') {
                    if (produtos.getProdutos().length > 0) {
                        var sair = confirm('Existem itens no pedido. \nDeseja realmente sair?');
                        if (!sair) {
                            event.preventDefault();
                        }
                    }
                }

            }
        }

    });

    //Obtem a resposta do servidor   
    config.apiUrl = localStorage.getItem('serverPath');
    if (!config.apiUrl) {
        alert('O servidor não está configurado.\nPor favor, verifique se as configurações estão corretas.');
        $rootScope.wizardMode = true;
        $rootScope.isLoading = false;
        $location.url('/configServer');
    }

    $timeout(function () {
        funcoes.AtualizaIp();
        if (window.cordova) {
            if (!localStorage.getItem('atalho')) {
                window.plugins.Shortcut.CreateShortcut("Terminal de Atendimento",
				function (data) {
                    localStorage.setItem('atalho', true);
				},
				function (error) {
                    console.log(error);
				});
            }
        }

    }, 300);
}]);



angular.module('app').value('config', {
    tipoAtendimento: '',
    configuracao: {},
    minutosSessao: 20
});

angular.module('app').config(['$routeProvider', 'ngToastProvider', function ($routeProvider, ngToastProvider) {
    $routeProvider
        .when('/', {
            templateUrl: 'views/home.html',
            controller: 'HomeController',
            controllerAs: 'homeCtrl',
            title: 'Home',
            backAction: null
        })
        .when('/atendimentoMt/limpar/:flLimpar', {
            templateUrl: 'views/home.html',
            controller: 'HomeController',
            controllerAs: 'homeCtrl',
            title: 'Home',
            backAction: null
        })
        .when('/config', {
            templateUrl: 'views/config.html',
            controller: 'ConfigController',
            controllerAs: 'configCtrl',
            title: 'Configurações',
            backAction: '/',
            backActionModoTablet: '/atendimentoMt/limpar/true' 
        })        
        .when('/atendimento', {
            templateUrl: 'views/atendimento.html',
            controller: 'AtendimentoController',
            title: 'Atendimento',
            backAction: '/'
        })
        .when('/atendimento/NumeroMesa/:mesa', {
            templateUrl: 'views/atendimento.html',
            controller: 'AtendimentoController',
            controllerAs: 'atendCtrl',
            title: 'Atendimento',
            backAction: '/'
        })
        .when('/atendimento/NumeroComanda/:comanda', {
            templateUrl: 'views/atendimento.html',
            controller: 'AtendimentoController',
            controllerAs: 'atendCtrl',
            title: 'Atendimento',
            backAction: '/inicioAtendimentoMesa',
            backActionModoTablet : '/'
        })
        .when('/atendimento/:limpar', {
            templateUrl: 'views/atendimento.html',
            controller: 'AtendimentoController',
            controllerAs: 'atendCtrl',
            title: 'Atendimento',
            backAction: '/'
        })
        .when('/configServer', {
            templateUrl: 'views/configServer.html',
            controller: 'ConfigServerController',
            controllerAs: 'configServerCtrl',
            title: 'Servidor',
            backAction: '/',
            backActionModoTablet: '/atendimentoMt/limpar/true'
        })
        .when('/busca', {
            templateUrl: 'views/busca.html',
            controller: 'BuscaProdutosController',
            controllerAs: 'buscaCtrl',
            title: 'Busca',
            backAction: '/atendimento',
            backActionModoTablet: '/'
        })
        .when('/opcoes/Hash/:hash/Origem/:origem', {
            templateUrl: 'views/opcoes.html',
            controller: 'OpcoesController',
            controllerAs: 'optCtrl',
            title: 'Opcões',
            backAction: '/atendimento',
            backActionModoTablet: '/'
        })
        .when('/buscaFracionado/IdProduto/:idproduto/Origem/:origem/Hash/:hash', {
            templateUrl: 'views/buscaFracionados.html',
            controller: 'BuscaFracionadosController',
            controllerAs: 'buscaFracCtrl',
            title: 'Fracionados',
            backAction: ""
        })
        .when('/favoritos', {
            templateUrl: 'views/favoritos.html',
            controller: 'FavoritosController',
            controllerAs: 'favCtrl',
            title: 'Favoritos',
            backAction: "/atendimento",
            backActionModoTablet: '/'
        })
        .when('/transferirMesa/origem/:origem', {
            templateUrl: 'views/transferirMesa.html',
            controller: 'TransferirMesaController',
            controllerAs: 'transfCtrl',
            title: 'Transferir',
            backAction: "/atendimento",
            backActionModoTablet: '/'
        })
        .when('/transferirComanda/origem/:origem', {
            templateUrl: 'views/transferirComanda.html',
            controller: 'TransferirComandaController',
            controllerAs: 'transfCtrl',
            title: 'Transferir',
            backAction: "/atendimento",
            backActionModoTablet: '/'
        })
        .when('/transferirMesaComanda', {
            templateUrl: 'views/transferirMesaComanda.html',
            controller: 'TransferirMesaComandaController',
            controllerAs: 'transfMC',
            title: 'Transferência',
            backAction: "/atendimento",
            backActionModoTablet: '/'
        })
        .when('/conta', {
            templateUrl: 'views/conta.html',
            controller: 'ContaController',
            controllerAs: 'contaCtrl',
            title: 'Emitir Conta',
            backAction: "/atendimento",
            backActionModoTablet: '/'
        })
        .when('/conta/Comandas/:comandas', {
            templateUrl: 'views/conta.html',
            controller: 'ContaController',
            controllerAs: 'contaCtrl',
            title: 'Emitir Conta',
            backAction: "/atendimento",
            backActionModoTablet: '/'
        })
        .when('/conta/Comanda/:comanda', {
            templateUrl: 'views/conta.html',
            controller: 'ContaController',
            controllerAs: 'contaCtrl',
            title: 'Emitir Conta',
            backAction: "/atendimento",
            backActionModoTablet: '/'
        })
        .when('/inicioAtendimentoMesa', {
            templateUrl: 'views/inicioAtendimentoMesa.html',
            controller: 'InicioAtendimentoMesaController',
            controllerAs: 'inicioCtrl',
            title: 'Mesa',
            backAction: "/"
        })
        .when('/inicioAtendimentoMesa/:retornoComanda', {
            templateUrl: 'views/inicioAtendimentoMesa.html',
            controller: 'InicioAtendimentoMesaController',
            controllerAs: 'inicioCtrl',
            title: 'Mesa',
            backAction: "/"
        })
        .when('/logs', {
            templateUrl: 'views/logs.html',
            controller: 'LogsController',
            controllerAs: 'logsCtrl',
            title: 'Logs',
            backAction: "/"
        })
        .when('/selecionarComandas', {
            templateUrl: 'views/selecionarComandas.html',
            controller: 'SelecionarComandasController',
            controllerAs: 'selComCtrl',
            title: 'Sel. Comandas',
            backAction: "/atendimento",
            backActionModoTablet: '/'
        })
        .otherwise({
            redirectTo: '/'
        });
    ngToastProvider.configure({
        verticalPosition: 'top',
        horizontalPosition: 'center',
        maxNumber: 1
    });



}]);