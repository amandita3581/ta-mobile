angular.module('app').controller('ConfigServerController',['$scope','ws','config','$rootScope','toast','$location', '$timeout',ConfigServerController]);


function ConfigServerController ($scope,ws,config,$rootScope,toast,$location, $timeout){
    var vm = this;
    vm.caminho = '';
    vm.apiOk = false;
    vm.save = function(){
        localStorage.setItem('serverPath',vm.caminho);
        config.apiUrl=vm.caminho;
         if($rootScope.wizardMode){
            $location.url('/config');
        }else{
            $location.url('/home');
        }
    };


    vm.testUrl = function(){
        if(!vm.caminho) return false;
        if(vm.caminho.trim() !== ""){
            ws.ObterRespostaWebService(vm.caminho)
            .then(
                function(data){
					$timeout(function(){
						var json = angular.fromJson($(data).find('ObterRespostaWebServiceResult').text());
						toast.showCustomToast(json.Mensagem);
						vm.apiOk = json.FlagMensagem;
					});
                },
                function(error){
                    vm.apiOk = false;
					if(error.status === 0){
						toast.showCustomToast("Servidor indisponível.");
						return;
					}
                    toast.showCustomToast(error.statusText);
                }
            );
        }
    };
	
	$rootScope.$watch('$root.ip',function(newValue,oldValue,scope){
		vm.ip = newValue;
	});
    vm.caminho = localStorage.getItem('serverPath');
	
}