angular.module('app')
.factory('operador', ['ws', 'toast', '$q', function (ws, toast, $q) {
	var operador;
    return {
        obterOperador: obterOperador,
		getOperador: function () {
            return operador;
        },
        setOperador: function (op) {
            operador = op;
        },
        temPermissao: function (numeroPermissao) {
            if (!operador)
                return false;
            var permissao = _.filter(operador.liAcessos, function (acesso) { return acesso.idPermissao == numeroPermissao; });
            return permissao.length > 0;
        }
    };
    function obterOperador(idOperador) {
        var deferred = $q.defer();

        if (!Number.isInteger(parseInt(idOperador)))
        {
            toast.showCustomToast("Código do operador inválido.");
            deferred.reject();
        }
        else
        {
            ws.ObterOperador(idOperador).then(
                     function (dados) {
                         var json = angular.fromJson($(dados).find('ObterOperadorResult').text());
                         if (!json.FlagMensagem) {
                             toast.showCustomToast(json.Mensagem, null, 'info');
                             deferred.reject();
                         } else {
                             deferred.resolve(json);
                         }
                     }, function (error) {
                         toast.showCustomToast("Houve um problema no web service e não foi possível obter o operador.");
                         deferred.reject();
                     });
        }
        return deferred.promise;
    }
}]);