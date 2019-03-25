angular.module('app').factory('autenticacao', ['ws', '$q', 'toast', 'log', 'operador','config',autenticacao]);

function autenticacao(ws, $q, toast, log, operador, config) {
    var permissoesApp = [];
    permissoesApp[1] = "Estornar Item";
    permissoesApp[11] = "M&#243;dulo Microterminal";
    permissoesApp[54] = "Acesso Remoto";
    permissoesApp[31] = "Des/Bloquear Comanda";
    permissoesApp[133] = "Transferir Vendas";
    permissoesApp[149] = "Permite ReImprimir Ficha";
    permissoesApp[151] = "Transferir Mesa";
    permissoesApp[144] = "Configurar MT";
    permissoesApp[159] = "Reabrir Mesa Fechando Conta";
    permissoesApp[160] = "Informar comanda sem informar mesa";


    return {
        loginUsuario: function (usuario, senha) {
            return "";
        },
        loginOperador: function (operador) {
            return "";
        },
        
        solicitarUsuarioSenha: function (permissao) {
            var deferred = $q.defer();
            if (operador.temPermissao(permissao) && config.localConfig.ativarModoTablet === 0) {
                deferred.resolve({ usuario: operador.getOperador().idOperador, senha: operador.getOperador().stSenha });
            } else {
                $("#modalAuthLabel").html("Permiss&#227;o: " + permissao + " - " + permissoesApp[permissao]);
                $('#modalAuth').modal('show');
                $('#modalAuth #entrar').click(function () {
                    var usuario = angular.element("#txtUsuarioAuth").val();
                    var senha = angular.element('#txtSenhaAuth').val();
                    var req = ws.ObterOperadorValida(usuario, senha, permissao);
                    req.done(function (data) {
                        var result = $(data).find('ObterOperadorValidaResult');
                        var json = JSON.parse(result.text());
                        if (!json.FlagMensagem) {
                            toast.showCustomToast(json.Mensagem);
                            deferred.reject();
                        } else {
                            deferred.resolve({ usuario: usuario, senha: senha });
                        }
                        $('#modalAuth').modal('hide');
                    });

					req.fail(function (error) {
						log.GerarLogDeString(error.toString());
                        toast.showCustomToast("O servidor se comportou de maneira inesperada, entre em contato com o suporte.");
                        deferred.reject();
                        $('#modalAuth').modal('hide');
					});
				});
			}
            return deferred.promise;
        }
    };
}
