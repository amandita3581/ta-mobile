angular.module('app').controller('InicioAtendimentoMesaController',['$scope', '$location', 'ws', 'toast', 'pedido', '$rootScope', 'funcoes', '$interval', '$timeout', 'autenticacao', 'atendimento', 'config', '$routeParams', 'operador', InicioAtendimentoMesaController]);

function InicioAtendimentoMesaController($scope, $location, ws, toast, pedido, $rootScope, funcoes, $interval, $timeout, auth, atendimento, config, $routeParams, operador){
	var vm = this;
	var arrMesas = [];
	vm.config = config;
	vm.digitacaoPermitida = operador.temPermissao(160);
	vm.selecionaMesa = function(mesa){
		if(!mesa.FlagAtivo){
			toast.showCustomToast("Mesa inativa.");
			return false;
		}

		if(mesa.FlagBloqueadaLancamento){
            if (confirm('Mesa bloqueada para lançamentos.\n Deseja desbloquear?')) {
                auth.solicitarUsuarioSenha(159).then(
					function(data){
						ws.DesbloqueiaAtendimentosMesa(mesa.NumeroMesa,data.usuario, data.senha).then(
							function(result){
								var json = angular.fromJson($(result).find('DesbloqueiaAtendimentosMesaResult').text());
								if (json.FlagMensagem)
                                {
                                    atendimento.setTipoAtendimentoOriginal(config.tipoAtendimento);
                                    $location.url('/atendimento/NumeroMesa/' + mesa.NumeroMesa);
								}								    
								else
									toast.showCustomToast(json.Mensagem);
								
							}, 
							function(erro){
								toast.showCustomToast(erro);
							}
						);
					}
				);
			}
		}
		else
		{
			$location.url('/atendimento/NumeroMesa/' + mesa.NumeroMesa);
		}
	};

	vm.selecionarComanda = function () {
        ObterMesaComanda();
	};

	vm.openBarCodeScanner = function (ev) {
        funcoes.ScanBarCode(function (code) {
            if (!code)
                return false;
            vm.comanda = code;
            ObterMesaComanda();
        });
	};
	
	vm.validarLeitor = function (event) {
		event.stopPropagation();
        if (vm.config.microterminal.flLeitor && !vm.config.localConfig.utilizaLeitorUsb) {
            vm.openBarCodeScanner();
        } else {
            if (!vm.digitacaoPermitida) {
                auth.solicitarUsuarioSenha(160)
                    .then(
                        function () {
                            vm.digitacaoPermitida = true;
                            $("#txtComanda").focus();
                        },
                        function () {
                            vm.digitacaoPermitida = false;
                        }
                    );
            }
        }
    };

	vm.onComandaKeypress = function (ev) {
        if (!vm.digitacaoPermitida)
            ev.preventDefault();

        if (ev.which === 13) {
            ObterMesaComanda();
        }
	};
    
	$scope.$on('$destroy',function(){
		if(angular.isDefined(intervalObterMesa)){
			$interval.cancel(intervalObterMesa);
			intervalObterMesa = null;
		}
	});

	var ObterMesaComanda = function () {
        var mesa = 0;
        var comanda = vm.comanda;
        var pessoas = 1;
        var comandaValida = false;
        vm.flValidaDv = false;
        if (!comanda) {
            toast.showCustomToast("Comanda n&atilde;o informada.");
            return;
        }

        ws.ObterMesaComanda(mesa, comanda, operador.getOperador().idOperador, vm.flValidaDv)
        .then(
            function (data) {
                var json = angular.fromJson($(data).find('ObterMesaComandaResult').text());
                if (json.length > 0) {
                    json = json[0];
                } else {
                    toast.showCustomToast("Houve um evento inesperado no web service. Entre em contato com o suporte.");
                    return;
                }
                comandaValida = funcoes.ValidarComanda(json, true);
                if (!comandaValida) 
                    return;
                //grava o tipo de atendimento inicializado
                atendimento.setTipoAtendimentoOriginal(config.tipoAtendimento);
                config.tipoAtendimento = 'comanda';
                $location.url('/atendimento/NumeroComanda/' + comanda);                
            },
            function (error) {
                toast.showCustomToast(error, 'zmdi zmdi-info-circle', 'info');
                $rootScope.$digest();
            }
        );
	};
	
	var ObterListaMesa = function () {
        if (window.cordova) {
            if (!$rootScope.onlineState)
                return;
        }
        ws.ObterListaMesa().then(
            function (data) {
                var json = angular.fromJson($(data).find('ObterListaMesaResult').text());
                var arr = _.map(json, function (item) {
                    return {
                        FlagAtivo: item.FlagAtivo,
                        FlagBloqueada: item.FlagBloqueada,
                        FlagBloqueadaLancamento: item.FlagBloqueadaLancamento,
                        NumeroMesa: item.NumeroMesa
                    };
                });
                
                var isEqual = angular.toJson(arr) === angular.toJson(arrMesas);
                if (!isEqual) {
                    vm.mesas = json;
                    $timeout(function () {
                        arrMesas = arr;
                        $scope.$apply();
                    });
                }
            },
            function (error) {
            
            }
        );
	};
    
    //Chama a função para listar as mesas
	ObterListaMesa();

    //inicia a atualização continua de mesas
	var intervalObterMesa = $interval(ObterListaMesa, 1000);

	if ($routeParams.retornoComanda) {
        config.tipoAtendimento = atendimento.getTipoAtendimentoOriginal();
	}

    var liberarAtendimento = function () {
        atendimento.LiberarAtendimento().then(
            function (resp) {
                pedido.limparPedido();
            },
            function (resp) {
                pedido.limparPedido();
            }
        );
    };

    //tratamento para quando o usuario sai do atendimento por mesa comanda pelo botão da barra superior, 
    //sem pressionar o botão de salvar a mesa (botão verde da barra inferior)
    if (config.tipoAtendimento === "mesa-comanda" && pedido.getMesa() && pedido.pressionadoSalvarTodos === false) {
        pedido.salvarPedido(true, true, false).then(
            function () {
                liberarAtendimento();
            },
            function () {
                toast.showCustomToast("Ocorreu um problema ao salvar o pedido.");
            }
        );
        pedido.pressionadoSalvarTodos = true;
    } else {
        liberarAtendimento();
    }   
}