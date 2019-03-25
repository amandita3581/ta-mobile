angular.module("app").controller("TransferirMesaController", ['autenticacao', '$routeParams', 'atendimento',
    function (auth, $routeParams, atendimento) {
    var vm = this;
    vm.mesaOrigem = $routeParams.origem;

    vm.autenticar = function () {
        auth.solicitarUsuarioSenha(151).then(
            function (data) {
                atendimento.transferirMesa(vm.mesaOrigem, vm.mesaDestino, data.usuario, data.senha)
                    .then(
                        function (data) {

                        },
                        function (error) {

                        }
                    );
            }
        );
    };
}]);