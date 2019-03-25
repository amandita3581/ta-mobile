angular.module('app').controller('ConfigController',['$scope','config','toast','$location','ws','$rootScope','funcoes',ConfigController]);


function ConfigController($scope,vConfig,toast,$location,ws,$rootScope,funcoes){
    var vm = this;
    vm.config = {};

    vm.SaveConfig = function(){
		if(vm.config.rangeMesa){
			range = vm.config.rangeMesa.split(',');
			vm.config.MesaInicial = range[0];
			vm.config.MesaFinal = range[1];
		}
        var json = JSON.stringify(vm.config);
        localStorage.setItem('config',json);
        vConfig.tipoAtendimento = vm.config.tipoAtendimento;
        vConfig.itensLista = vm.config.itensLista;
        vConfig.modoPesquisa = vm.config.modoPesquisa;
		vConfig.utilizaRangeMesa = vm.config.utilizaRangeMesa;
		vConfig.MesaInicial = vm.config.MesaInicial;
		vConfig.MesaFinal = vm.config.MesaFinal;
		vConfig.utilizaLeitorUsb = vm.config.utilizaLeitorUsb;
		vConfig.ativarModoTablet = vm.config.ativarModoTablet;
        if($rootScope.wizardMode){
            $rootScope.wizardMode = false;
		}
		
		if(vConfig.ativarModoTablet === "1")
			$location.url('/atendimentoMt/limpar/true');
		else
        	$location.url('/');
    };
	
	$rootScope.$watch(function(){ 
			return vm.config.rangeMesa;
		},
		function(newValue,oldValue,scope){
			if(newValue){
				var range = newValue.split(',');
				vm.config.MesaInicial = range[0];
				vm.config.MesaFinal = range[1];
			}
		}
	); 
	
	vm.ResetAppData = function(){
		if(confirm("Você confirma a limpeza das configurações?"))
		{
			localStorage.clear();
			$rootScope.wizardMode = true;
			$location.url('/configServer');
		}
	};

	funcoes.VerificaConfiguracaoMesa().then(
		function (arrConfig) {
		    if (arrConfig[0].flagRetorno) {
		        vm.microterminal = arrConfig[1];
		        vm.configuracao = arrConfig[0];
				arrConfig[0].MesaInicial = parseInt(arrConfig[0].MesaInicial);
				arrConfig[0].MesaFinal = parseInt(arrConfig[0].MesaFinal);
				vm.config.MesaInicial = arrConfig[0].MesaInicial;
				vm.config.MesaFinal = arrConfig[0].MesaFinal;
				vm.config.utilizaLeitorUsb = arrConfig[0].utilizaLeitorUsb;
				vm.config.ativarModoTablet = arrConfig[0].ativarModoTablet;
				var configs = localStorage.getItem('config');
				if(configs){
					vm.config = angular.fromJson(configs);
					if (vm.config.tipoAtendimento === '' || !vm.config.tipoAtendimento)
						vm.config.tipoAtendimento = 'comanda';

					if(vm.config.itensLista === '' || !vm.config.itensLista)
						vm.config.itensLista = '20';

					if(vm.config.modoPesquisa === '' || !vm.config.modoPesquisa)
					    vm.config.modoPesquisa = '1';

					if (!vm.config.utilizaRangeMesa)
					    vm.config.utilizaRangeMesa = '0';

					if (!vm.config.utilizaLeitorUsb)
					    vm.config.utilizaLeitorUsb = '0';

					if (!vm.config.ativarModoTablet)
					    vm.config.ativarModoTablet = '0';
				} else {
					vm.config.tipoAtendimento = 'comanda';
					vm.config.itensLista = '20';
					vm.config.modoPesquisa = '1';
					vm.config.utilizaRangeMesa = '0';
					vm.config.utilizaLeitorUsb = '0';
					vm.config.ativarModoTablet = '0';
				}
				$("#rangeMesa").slider({ min: arrConfig[0].MesaInicial, max: arrConfig[0].MesaFinal, value: [parseInt(vm.config.MesaInicial), parseInt(vm.config.MesaFinal)], focus: true });
				vm.config.rangeMesa = vm.config.MesaInicial + "," + vm.config.MesaFinal;
			} else {
				toast.showCustomToast('Não foi possível obter a configuração local.');
				ExitApp();
			}
		},
		function (error) {
			if(!error.customError)
			{
				toast.showCustomToast('Erro ao obter a configuração da tabela master: <br />' + error);
				ExitApp();
			}
		}
	);
}


