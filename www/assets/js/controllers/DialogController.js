angular.module('app').controller('DialogController',['$scope','$mdDialog','autenticacao','$location','toast','ws',DialogController]);

function DialogController($scope,$mdDialog,autenticacao,$location,toast,ws){
    var vm = this;
    vm.Cancel = function() {
        $mdDialog.cancel();
    };

    vm.Autenticar = function(login){
        var req = ws.ObterOperadorValida(login.usuario,login.senha,148);
        req.done(function(data){
            var result = $(data).find('ObterOperadorValidaResult');
            var json = JSON.parse(result.text());
            if(!json.FlagMensagem){
                toast.showCustomToast(json.Mensagem);
            }else{
                $mdDialog.cancel();
                $location.url('/config');
            }
        });

        req.fail(function(error){
            toast.showCustomToast('Ocorreu um evento inesperado no servidor.');
            $mdDialog.cancel();
        });

    };
}