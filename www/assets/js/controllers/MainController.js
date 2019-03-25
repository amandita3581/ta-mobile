angular.module('app').controller('MainController',['$scope','$location','autenticacao','config','ws','$rootScope','produtos','toast','pedido','funcoes', '$window', '$timeout', 'configuracao', '$cordovaNetwork', '$cordovaFileTransfer', 'info', '$cordovaFile', MainController]);

function MainController($scope,$location,auth,config,ws,$rootScope,produtos,toast,pedido,funcoes, $window, $timeout, configuracaoSvc, $cordovaNetwork, $cordovaFileTransfer, info, $cordovaFile){
    var vm = this;
    vm.goToPage = function(page){
        $location.url(page);
    };
	
	vm.flLeitor = false;
	vm.tamanhosDoTexto = [
		{
			'key':'Pequeno',
			'value' : '1'
		},
		{
			'key':'Médio',
			'value' : '1.1'
		},
		{
			'key':'Grande',
			'value' : '1.2'
		}		
	];


    vm.doLogin = function(ev){
        ev.preventDefault();
        $('.navbar-collapse').collapse('hide');
        auth.solicitarUsuarioSenha(144).then(
            function(data){
                $location.url('/config');
            }
        );
    };

    vm.ObterRespostaWebService = function(){
		$timeout(function(){
			config.apiUrl = localStorage.getItem('serverPath');
			if(config.apiUrl){
				ws.ObterRespostaWebService(config.apiUrl)
				.done(function(data){
					funcoes.VerificaConfiguracoes();
				})
				.fail(function(error){
					alert('O servidor não está respondendo.\nPor favor, verifique se as configurações estão corretas.');
					$location.url('/configServer');
				});
			}else{
				$rootScope.wizardMode = true;
				$rootScope.isLoading = false;
				$location.url('/configServer');
			}
		});
    };

    vm.mostrarSobre = function (e) {
        e.preventDefault();
        $('.navbar-collapse').collapse('hide');
        $("#modalSobre").modal('show');
        $rootScope.clicks = 0;
    };

     vm.exitApp = function () {
        $('.navbar-collapse').collapse('hide');
		$(document).trigger('exitApp',[true]);
     };

     vm.voltarParaAtendimento = function () {
         if(config.localConfig.ativarModoTablet)
             $location.url('/');
         else
             $location.url('/atendimento');
     };

     vm.transferir = function (ev) {
         ev.preventDefault();
         var configAtendimento = config.tipoAtendimento;

         if (!verificaItensConsumidos())
             return;

         if (!verificaComadaMesaSelecionada())
             return;

         switch (configAtendimento) {
             case 'mesa':
                 $location.url('/transferirMesa/origem/' + pedido.getMesa());
                 break;
             case 'mesa-comanda':
                 $location.url('/transferirMesaComanda');
                 break;
             case 'comanda':
                 $location.url('/transferirComanda/origem/' + pedido.getComanda());
                 break;
         }
     };


     vm.emitirConta = function (ev) {
         ev.preventDefault();
         var configAtendimento = config.tipoAtendimento;

         if (!verificaItensConsumidos())
             return;

         if (!verificaComadaMesaSelecionada())
             return;

         switch (configAtendimento) {
             case 'mesa':
                 $location.url('/conta');
                 break;
             case 'mesa-comanda':
                 $location.url('/selecionarComandas');
                 break;
             case 'comanda':
                 $location.url('/conta/Comanda/' + pedido.getComanda());
                 break;
         }
     };

     var verificaItensConsumidos = function () {
         var configAtendimento = config.tipoAtendimento;
         if (configAtendimento === 'comanda' || configAtendimento === 'mesa') {
             if (pedido.getItensConsumidos().length < 1) {
                 toast.showCustomToast('Não existem itens no atendimento.');
                 return false;
             }
         }
         return true;
     };

     var verificaComadaMesaSelecionada = function () {
         var configAtendimento = config.tipoAtendimento;
         if (configAtendimento === 'mesa' || configAtendimento === 'mesa-comanda') {
             if (!pedido.getMesa()) {
                 toast.showCustomToast('A mesa não foi selecionada.');
                 return false;
             }
         }
         else
         {
             if (!pedido.getComanda()) {
                 toast.showCustomToast('A comanda não foi selecionada.');
                 return false;
             }
         }
         return true;
     };

     vm.count = function(ev){

        if($rootScope.clicks){
            $rootScope.clicks += 1;
        }else{
            $rootScope.clicks = 1;
        }
        if($rootScope.clicks > 4){
            $location.url('/logs');
            $("#modalSobre").modal('hide');
            $rootScope.clicks = 0;
        }
     };

     vm.irParaPagina = function(page){
		if(page !== 'atendimento' && page !== 'home'){ // verifica se é possível acessar a página
			var configAtendimento = config.tipoAtendimento;
			if(configAtendimento === 'comanda'){
				if(!pedido.getComanda()) {
					toast.showCustomToast('Nenhuma comanda selecionada.');
					return false;
				}
			}else if(configAtendimento === 'mesa'){
				if(!pedido.getMesa()){
					toast.showCustomToast('Nenhuma mesa selecionada.');
					return false;
				}
			}else if(configAtendimento === 'mesa-comanda'){
				if(!pedido.getMesa() || !pedido.getComanda()){
					toast.showCustomToast('Mesa e comanda não foram selecionadas.');
					return false;
				}
			}
		}
		if(page === 'home')
            page = '';

        $location.url('/' + page);
		$('.navbar-collapse').collapse('hide');
     };


    $scope.$on('finalizaLoading',function(){
		$timeout(function(){
			vm.isLoading = false;
		}, 100);
    });
	
	$scope.$on('iniciaLoading', function(){
		$timeout(function(){
			vm.isLoading = true;
		});
	});
	
	$scope.$watch('main.zoom',function(newValue, oldValue, scope){
		configuracaoSvc.setConfig('zoom',newValue);
		configuracaoSvc.saveConfigToLocalStorage('zoom',newValue);
	});
	
	$rootScope.$watch('$root.onlineState',function(newValue,oldValue,scope){
		vm.desBloqueiaTela(newValue);		
		funcoes.AtualizaIp();
	});
	
	vm.desBloqueiaTela = function(flDesbloqueia){
		var desabilitadosPorAtributo = ['button', 'input', 'textarea', 'select'];
		var desabilitadosPorClasse = ['a'];
		var esconderPelaClasse = ['.bottom-toolbar','.container-mesas'];
		
		_.each(desabilitadosPorAtributo,function(inputType){
			var inputs = $(document).find(inputType);
			_.each(inputs,function(item){
				$(item).attr('disabled', !flDesbloqueia);
			});
		});
		
		_.each(desabilitadosPorClasse,function(inputType){
			var inputs = $(document).find(inputType);
			_.each(inputs,function(item){
				if(flDesbloqueia)
					$(item).removeClass('disabled');
				else
					$(item).addClass('disabled');
			});
		});
		
		_.each(esconderPelaClasse,function(inputType){
			var inputs = $(document).find(inputType);
			_.each(inputs,function(item){
				if(flDesbloqueia)
					$(item).removeClass('hidden');
				else
					$(item).addClass('hidden');
			});
		});
	};
	vm.zoom = configuracaoSvc.getConfigFromLocalStorage('zoom') || 1;
	
	vm.setDefaultZoom = function(){
		vm.zoom = 1;
	};
	
	//Verifica se o aparelho perdeu a conexão
	document.addEventListener("deviceready", function () {
		var isOnline = $cordovaNetwork.isOnline();
		if(isOnline){
			if($cordovaNetwork.getNetwork() !== 'wifi'){
				toast.showCustomToast('O dispositivo não está conectado à rede wifi.');
				isOnline = false;
			}
		}else{
			toast.showCustomToast('Dispositivo offline.');
		}
		$rootScope.onlineState = isOnline;
	
		$rootScope.$on('$cordovaNetwork:online', function(event, networkState){
			if(networkState === "wifi"){
				console.log('wifi online');
				$timeout(function(){
					$rootScope.onlineState = true;
					toast.showCustomToast('Dispositivo online.');
				});
			}
		});
		
		$rootScope.$on('$cordovaNetwork:offline', function(event, networkState){
			if(networkState === "wifi"){
				console.log('wifi offline');
				$timeout(function(){
					$rootScope.onlineState = false;
					toast.showCustomToast('Dispositivo offline.');
				});
			}
		});
	}, false);
	
	$rootScope.$on("versaoRemota",function(event, versaoApp, versaoWs){
		if(!configuracaoSvc.getConfigFromLocalStorage('serverPath'))
			return;
		
		funcoes.ObterVersaoApp().then(
            function (versaoLocal) {
                vm.atualizacaoNecessaria = false;
                if (versaoApp) {
                    if (parseInt(versaoApp.replace(/\D/g, '')) > parseInt(versaoLocal.replace(/\D/g, '')))
                        vm.atualizacaoNecessaria = true;

                    if (vm.atualizacaoNecessaria && !vm.downloadIniciado) {
                        vm.desBloqueiaTela(false);
                        alert('ATUALIZAÇÃO DISPONÍVEL!\nClique para iniciar o download.');
                        vm.download();
                        return;
                    }

                    if (versaoWs !== null && !vm.downloadIniciado) {
                        if (versaoLocal !== versaoWs) {
                            alert('Versão do aplicativo diferente da versão do web service. Verifique para continuar.');
                            $(document).trigger('exitApp', [false]);
                            return;
                        }
                    }
                }
			},
			function(error){
				toast.showCustomToast(error);
			}
		);
		
    });

    $rootScope.$on("licencaExpirada", function (event) {
        alert("Não foi possível validar sua licença.\n\n\nO Terminal de Atendimento " + config.ip + " não está licenciado ou a licença do LPG expirou.\n\n\nEntre em contato com o suporte.");
        $(document).trigger('exitApp', [false]);
    });
	
	
	vm.download = function(){
		var url = 'http://' + configuracaoSvc.getConfigFromLocalStorage('serverPath') + "/app/Default.aspx?p=" + info.architecture + "&v=" + info.version ;
		var targetPath = cordova.file.externalCacheDirectory + "atualizacaoTA.apk";
		var trustHosts = true;
		var options = {};
		vm.downloadIniciado = true;
		//download do arquivo
		$cordovaFileTransfer.download(url, targetPath, options, trustHosts)
			.then(function(fileEntry) {
				vm.caminhoArquivo = fileEntry.nativeURL;
			}, 
			function(err) {
				toast.showCustomToast('Não foi possível baixar o arquivo.<br /> Erro: ' + err);
				vm.downloadIniciado = false;
				vm.atualizacaoNecessaria = false;
				vm.desBloqueiaTela(true);
			}, 
			function (progress) {
				$timeout(function(){
					if(progress){
						var percentage = (progress.loaded / progress.total) * 100;
						vm.downloadProgress = Math.round(percentage);
						if(percentage === 100){
							vm.InstallApk();
						}
					}
				});
			});

	};

	$rootScope.$on('configuracaoObtida',function(){
		vm.info = info;
		vm.config = config;	
		vm.microterminal = config.microterminal;
		vm.flLeitor = vm.microterminal.flLeitor;
		vm.ativarModoTablet = parseInt(config.localConfig.ativarModoTablet);
	});
	
	vm.InstallApk = function(){
		//inicia a instalação
		window.plugins.webintent.startActivity({
				action: window.plugins.webintent.ACTION_VIEW,
				url: vm.caminhoArquivo,
				type: 'application/vnd.android.package-archive'
			},
			function(data) {
				vm.downloadIniciado = false;
				vm.atualizacaoNecessaria = false;
				vm.desBloqueiaTela(true);
			},
			function(error) {
				toast.showCustomToast('Falha ao abrir o arquivo: <br />' + vm.caminhoArquivo);
				vm.downloadIniciado = false;
				vm.atualizacaoNecessaria = false;
				vm.desBloqueiaTela(true);
			}
		);
	};
}
