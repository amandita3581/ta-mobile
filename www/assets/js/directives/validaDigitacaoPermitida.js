angular.module("app")
.directive("validaDigitacaoPermitida", [
	'autenticacao',
	'config',
	'operador',
	function(auth, config, operador){
		return {
			restrict : 'A',
			link : function (scope, element, attrs, controllers){				
				element.click(function(){
					scope.digitacaoPermitida = operador.temPermissao(160);
					if (config.microterminal.flLeitor && !config.localConfig.utilizaLeitorUsb) {
						scope.callBackLeitor();
					} else {
						if (!scope.digitacaoPermitida) {
							auth.solicitarUsuarioSenha(160)
							.then(
								function () {
									element.focus();
								}
							);
						}
					}					
				});
			}			
		}		
	}
]);