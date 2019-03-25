angular.module("app").factory("atendimento", ["$rootScope", "ws", "$q", "$timeout", "config", "$location", 'funcoes', 'toast', 'pedido', 'operador',
    function ($rootScope, ws, $q, $timeout, config, $location, funcoes, toast, pedido, operador) {
        var mesaLocalizada = false;
        var tipoAtendimentoOriginal;
    var atendimento = {
        getMesaLocalizada: function () {
            return mesaLocalizada;
        },
        setMesaLocalizada: function (value) {
            $timeout(function () {
                mesaLocalizada = value;
                $rootScope.$broadcast("mesaLocalizada", value);
            }, 50);
            
        },
        setTipoAtendimentoOriginal: function (value) {
            tipoAtendimentoOriginal = value;
        },
        getTipoAtendimentoOriginal: function () {
            return tipoAtendimentoOriginal;
        },
        getUrlRetornoComanda: function () {
            if (config.tipoAtendimento != this.getTipoAtendimentoOriginal())
                $location.url('/inicioAtendimentoMesa/' + true);
            else {
                if(config.localConfig.ativarModoTablet)
                    $location.url('/atendimentoMt/limpar/true');
                else{
                    if (config.tipoAtendimento != 'comanda')
                        $location.url('/inicioAtendimentoMesa');
                    else
                        $location.url('/atendimento/true');
				}
            }                
        },
        LiberarAtendimento: function () {
            var deferred = $q.defer();
            ws.LiberandoAtendimento().then(
				function (data) {
				    var json = angular.fromJson($(data).find('LiberandoAtendimentoResult').text());
				    if (json.flagRetorno) {
				        deferred.resolve('Atendimento liberado com sucesso.');
				    } else {
				        deferred.resolve('O atendimento não foi liberado.');
				    }
				},
				function (resp) {
				    deferred.reject('O atendimento não foi liberado.');
				}
			);
            return deferred.promise;
        },
        transferirMesa: function (origem, destino, usuario, senha) {
            var deferred = $q.defer();
			var self = this;
		
            if (!funcoes.ValidaDadosParaTransferencia(origem, destino) || !funcoes.TestaValorZeradoMesaOuComanda(destino)) {
				deferred.reject();
			} 
			else 
			{
				ws.ObterMesa(destino)
				.then(
					function (data) {
						var json = angular.fromJson($(data).find('ObterMesaResult').text());
						if (json.FlagBloqueadaLancamento) {
							toast.showCustomToast('Não é possível fazer a transferência,<br> A mesa encontra-se bloqueada para lançamento.');
							deferred.reject();
						} else {
							if (!json.FlagMensagem) {
								toast.showCustomToast(json.Mensagem);
								deferred.reject();
							} else {
								ws.BloqueiaDesbloqueiaMesa(destino, 1, 0, operador.getOperador().idOperador)
								.then(
									function (data) {
										ws.TransferirMesa(origem, destino, usuario, senha).then(
											function (data) {
												var json = angular.fromJson($(data).find('TransferirMesaResult').text());
												toast.showCustomToast(json.Mensagem);
												atendimento.getUrlRetornoComanda();
												deferred.resolve();
											},
											function (error) {
												toast.showCustomToast(error);
												deferred.reject();
											}
										);
									},
									function (error) {
										toast.showCustomToast(error);
										deferred.reject();
									}
								);
							}
						}
					},
					function (error) {
						toast.showCustomToast(error);
						deferred.reject();
					}
				);
			}
			return deferred.promise;
        },
        transferirComanda: function (origem, destino, usuario, senha) {
            var deferred = $q.defer();
            var self = this;
            if (!funcoes.ValidaDadosParaTransferencia(origem, destino)) {
                deferred.reject();
            } else {
				ws.ObterMesaComanda(0, destino, operador.getOperador().idOperador, true).then(
					function (data) {
						var comandaValida = true;
						var json = angular.fromJson($(data).find('ObterMesaComandaResult').text());
						if (json.length > 0) {
							comandaValida = funcoes.ValidarComanda(json[0], true);
							if (!comandaValida) {
								deferred.reject();
							}else {
								destino = json[0].idComanda;
								ws.TransferirComanda(origem, destino, usuario, senha).then(
									function (data) {
										var json = angular.fromJson($(data).find('TransferirComandaResult').text());
										toast.showCustomToast(json.Mensagem);
										deferred.resolve(true);
									},
									function (error) {
										toast.showCustomToast(error);
										deferred.reject();
									}
								);
							}
						} else {
							toast.showCustomToast("Houve um evento inesperado no web service. Entre em contato com o suporte.");
							deferred.reject();
						}
					},
					function (error) {
						toast.showCustomToast(error);
						$rootScope.$digest();
						deferred.reject();
					}
				);
			}
            return deferred.promise;
        },
        transferirComandaParaMesa: function (origem, destino, usuario, senha) {
            var deferred = $q.defer();
            var self = this;
            if (!funcoes.ValidaDadosParaTransferencia(origem, destino)) {
                deferred.reject();
            } else {
				ws.ObterMesa(destino)
				.then(
					function (data) {
						var json = angular.fromJson($(data).find('ObterMesaResult').text());
						if (json.FlagBloqueadaLancamento) {
							toast.showCustomToast('Não é possível fazer a transferência,<br> A mesa encontra-se bloqueada para lançamento.');
							deferred.reject();
						} else {
							if (!json.FlagMensagem) {
								toast.showCustomToast(json.Mensagem);
								deferred.reject();
							} else {
								ws.BloqueiaDesbloqueiaMesa(destino, 1, 0, operador.getOperador().idOperador)
								.then(
									function (data) {
										ws.TransferirComandaParaMesa(origem, destino, usuario, senha).then(
											function (data) {
												var json = angular.fromJson($(data).find('TransferirComandaParaMesaResult').text());
												toast.showCustomToast(json.Mensagem);
												deferred.resolve(true);
											},
											function (error) {
												toast.showCustomToast(error);
												deferred.reject();
											}
										);
									},
									function (error) {
										toast.showCustomToast(error);
										deferred.reject();
									}
								);
							}
						}
					},
					function (error) {
						toast.showCustomToast(error);
						deferred.reject();
					}
				);
			}
            return deferred.promise;
        },
        transferirComandaParaMesaSemValidacao: function (comandasOrigem, mesaDestino) {
            var deferred = $q.defer();
            ws.TransferirComandaMesaSemValidacao(comandasOrigem, mesaDestino).then(
                function (data) {
                    var json = angular.fromJson($(data).find('TransferirComandaMesaSemValidacaoResult').text());
                    if (json.FlagMensagem)
                        deferred.resolve(json.Mensagem);
                    else
                        deferred.reject(json.Mensagem);
                }, function (error) {
                    deferred.reject('Não foi possível transferir a comanda para a mesa selecionada.' + error);
                });
            return deferred.promise;
        },
        ObterComanda: function () {
            var deferred = $q.defer();
            var mesa = 0;
            var comanda = pedido.getComanda();
            var pessoas = 1;
            var comandaValida = false;
            if (!comanda) {
                toast.showCustomToast("Comanda n&atilde;o informada.");
                deferred.reject();
                return;
            }
            ws.ObterMesaComanda(mesa, comanda,operador.getOperador().idOperador, false)
            .then(
                function (data) {
                    var json = angular.fromJson($(data).find('ObterMesaComandaResult').text());
                    if (json.length > 0) {
                        json = json[0];
                    } else {
                        toast.showCustomToast("Houve um evento inesperado no web service. Entre em contato com o suporte.");
                        deferred.reject();
                        return;
                    }

                    comanda = json.idComanda;
                    mesa = 0;
                    comandaValida = funcoes.ValidarComanda(json, true);
                    if (!comandaValida) {
                        deferred.reject();
                        return;
                    }
                    pedido.setComanda(comanda);
                    var itens = funcoes.MapProdutos(json.liAtendimentoItem);
                    pedido.setItensConsumidos(itens);
                    deferred.resolve(json);
                },
                function (error) {
                    toast.showCustomToast(error, 'zmdi zmdi-info-circle', 'info');
                    deferred.reject();
                }
            );
            return deferred.promise;
        },
        obterMesa: function (idMesa, validarMesaComMultiplasComandas, salvarMesa) {
            var deferred = $q.defer();
            if (!funcoes.TestaValorZeradoMesaOuComanda(idMesa)) {
                deferred.reject();
            }else{
                ws.ObterMesa(idMesa)
                .then(
                    function (data) {
                        var json = angular.fromJson($(data).find('ObterMesaResult').text());
                        if (!json.FlagMensagem) {
                            deferred.reject(json.Mensagem);
                        } else {
                            if (!json.FlagBloqueada) {
                                pedido.setMesa(json.NumeroMesa);
                                ws.BloqueiaDesbloqueiaMesa(idMesa, 1, 0,operador.getOperador().idOperador, true).then(
                                    function (data) {
                                        if (salvarMesa) {
                                            pedido.salvarPedido(false, false, false).then(
                                               function (data) {
                                                   pedido.setMesa(idMesa);
                                                   if(config.tipoAtendimento == 'mesa')
                                                        pedido.setComanda(idMesa);
                                                   pedido.setPessoas(1);
                                                   pedido.setItensConsumidos([]);
                                                   deferred.resolve();
                                               },
                                                function (error) {
                                                    deferred.reject('N&#227;o foi poss&#237;vel salvar a mesa.<br>Erro: ' + error);
                                                }
                                            );
                                        }
                                        else {
                                            pedido.setMesa(idMesa);
                                            pedido.setPessoas(1);
                                            pedido.setItensConsumidos([]);
                                            deferred.resolve();
                                        }
                                    },
                                    function (error) {
                                        deferred.reject('N&#227;o foi poss&#237;vel bloquear a mesa.<br>Erro: ' + error);
                                    }
                                );
                                
                            } else {
                                ws.ObterPedido(idMesa, 0)
                                .then(
                                    function (data) {
                                        $timeout(function () {
                                            var itens = angular.fromJson($(data).find('ObterPedidoResult').text());
                                            if(validarMesaComMultiplasComandas){
                                                if(!funcoes.ValidaMesaComMultiplasComandas(itens)){
                                                    deferred.reject('A mesa selecionada est&#225; no regime de m&#250;ltiplas comandas.');
                                                    return;
                                                }
                                            } else {
                                                if (!funcoes.ValidaMesaSemMultiplasComandas(itens)) {
                                                    deferred.reject('A mesa selecionada n&atilde;o est&aacute; no regime de m&uacute;ltiplas comandas.');
                                                    return;
                                                }
                                            }

                                            pedido.setItensConsumidos([]);
                                            var comandas = [];
                                            if (itens.length) {
                                                if (itens[0].idProduto !== 0) {
                                                    items = funcoes.MapProdutos(itens);
                                                    pedido.setItensConsumidos(items);
                                                }
                                                comandas = funcoes.MapComandas(itens);
                                            }
                                            pedido.setMesa(idMesa);
                                            if (config.tipoAtendimento == 'mesa')
                                                pedido.setComanda(idMesa);
                                            pedido.setPessoas(itens[0].nrPessoas || 1);
                                            pedido.setComandas(comandas);
                                            ws.BloqueiaDesbloqueiaMesa(idMesa, 1, 0,operador.getOperador().idOperador, true);
                                            deferred.resolve();
                                        });
                                    },
                                
                                    function(error){
                                        deferred.reject('N&#227;o foi poss&#237;vel obter o pedido da mesa.<br>Erro: ' + error);
                                    }  
                                );
                            }
                        }
                    },
                    function (error) {
                        deferred.reject('Não foi possível obter a mesa.<br>Erro: ' + error);
                    }
                );
            }
            return deferred.promise;
        }

    };
	
	return atendimento;
}]);