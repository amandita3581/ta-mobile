angular.module('app').controller('TransferirController', ['$scope', 'pedido', '$routeParams', 'autenticacao', 'ws', 'toast', '$location', 'config', '$rootScope', 'funcoes', '$q', '$timeout', 'operador', TransferirController]);

function TransferirController($scope, pedido, $routeParams, autenticacao, ws, toast, $location, config, $rootScope, funcoes, $q, $timeout, operador) {
    var vm = this;
    vm.comandaOrigemString = $routeParams.origem;
    vm.comandaDestinoString = '';
    vm.tipoAtendimento = config.tipoAtendimento;
	vm.microterminal = config.microterminal;
    vm.transferir = function (usuario, senha, destino, tipoTransferencia) {
        if (vm.tipoAtendimento == 'comanda') {
			TransferirComanda(usuario, senha, vm.comandaOrigemString, destino);
        } else if (vm.tipoAtendimento == 'mesa') {
            TransferirMesa(usuario, senha, vm.comandaOrigemString, destino);
        }
    };

    vm.autenticar = function (tipoTransferencia, origemLeitura) {
        var destino;
		if(vm.tipoAtendimento == 'mesa'){
			destino = vm.comandaDestino;
		}else{
			destino = vm.microterminal.flLeitor ? vm.comandaDestinoString : vm.comandaDestino;
		}
        if(!destino){
			toast.showCustomToast('Destino inválido');
            return false;
        }
        autenticacao.solicitarUsuarioSenha(151).then(
            function (data) {
                vm.transferir(data.usuario, data.senha, destino, tipoTransferencia);
            }
        );
    };

    vm.changeTab = function(tab){
      vm.tab = tab;
    };
	
    vm.openBarCodeScanner = function (ev) {
        ev.preventDefault();
        funcoes.ScanBarCode(function (code) {
			vm.comandaDestinoString = code;
			vm.origemComanda = 'leitor';
			vm.autenticar("comanda", code);
        });
    };

    function TransferirComanda(usuario, senha, origem, destino) {
		if(!origem || !destino){
			toast.showCustomToast('Selecione a comanda de origem e a comanda de destino.');
			return;
		}
		if(origem == destino){
			toast.showCustomToast('Transferência para a mesma comanda bloqueada.');
			return;
		}
		ws.ObterMesaComanda(0, destino, operador.getOperador().idOperador, true).then(
            function (data) {
				var comandaValida = true;
                var json = angular.fromJson($(data).find('ObterMesaComandaResult').text());
				if(json.length > 0){
					comandaValida = funcoes.ValidarComanda(json[0], true);
					if(!comandaValida){
						return false;
					}
					Transferir('TransferirComanda', usuario, senha, origem, json[0].idComanda, function(json){
						ExibirMensagem(json.Mensagem);
					});
				}else{
					toast.showCustomToast("Houve um evento inesperado no web service. Entre em contato com o suporte.");
					return;
				}
            },
			function (error) {
				toast.showCustomToast(error);
				$rootScope.$digest();
			}
        );
    }

    function TransferirMesa(usuario, senha, origem, destino) {
		if(!destino){
		  toast.showCustomToast('Digite a mesa de destino.');
		  return false;
		}
		if(origem == destino){
			toast.showCustomToast('Transferência para a mesma mesa bloqueada.');
			return;
		}
		
		if(!funcoes.TestaValorZeradoMesaOuComanda(destino)){
			return false;
		}
        ws.ObterMesa(destino)
        .then(
            function (data) {
                var json = angular.fromJson($(data).find('ObterMesaResult').text());
                if(json.FlagBloqueadaLancamento){
                  toast.showCustomToast('Não é possível fazer a transferência,<br> A mesa encontra-se bloqueada para lançamento.');
                  return false;
                }
                if (!json.FlagMensagem) {
                    ExibirMensagem(json.Mensagem);
                } else {
                    ws.BloqueiaDesbloqueiaMesa(destino, 1, 0, operador.getOperador().idOperador)
					.then(
						function (data) {
							Transferir('TransferirMesa', usuario, senha, origem, destino, function(json){
								ExibirMensagem(json.Mensagem);
							});
						},
						function (error) {
							ExibirMensagem(error);
						}
					);
                }
            },
            function (error) {
                ExibirMensagem(error);
            }
        );
    }

    function Transferir(metodo, usuario, senha, origem, destino, callback){
        var promisse = EfetuarTransferencia(metodo, usuario, senha, origem, destino);
        promisse.then(
        function(json){
          if(json.FlagMensagem){
            if(callback){
                callback(json);
              }
          }else{
            ExibirMensagem(json.Mensagem);
          }
        }, 
        function(error){
          ExibirMensagem(error);
        });
    }

    function EfetuarTransferencia(metodo,usuario,senha, origem, destino) {
      var deferred = $q.defer();

        ws[metodo](origem, destino, usuario, senha).then(
            function (data) {
                var json = angular.fromJson($(data).find(metodo + 'Result').text());
                deferred.resolve(json);
            },
            function (error) {
                deferred.reject(error);
            }
        );
        return deferred.promise;
    }

    function ExibirMensagem(mensagem){
      toast.showCustomToast(mensagem);
      if(config.tipoAtendimento == 'mesa'){
          $location.url('/inicioAtendimentoMesa');
      }else{
          $location.url('/atendimento/true');
      }
    }
}