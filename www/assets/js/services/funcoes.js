angular.module('app').factory('funcoes', ['$rootScope', 'toast', 'ws', '$q', 'config', '$location', '$timeout', '$cordovaStatusbar', 'produtoPizza',
function ($rootScope, toast, ws, $q, config, $location, $timeout, $cordovaStatusbar, produtoPizza) {
    var funcoes = {
        addQt: function (qt) {
            return qt + 1;
        },
        subQt: function (qt) {
            if (qt > 0) qt = qt - 1;
            if (qt < 0) qt = 0;
            return qt;
        },
        FormataFloat: function (num, verificarFloat) {
            if (verificarFloat) {
                num = funcoes.isFloat(num) ? parseFloat(num, 10).toFixed(3) : num;
            } else {
                num = parseFloat(num, 10).toFixed(3);
            }
            return num;
        },
        isFloat: function (x) {
            var resto = x % 1;
            return (resto !== 0 && !isNaN(resto));
        },
        isInteger: function (x) {
            return Math.floor(x) === x;
        },
        ScanBarCode: function (callback) {
            var code = "";
            $rootScope.BarcodeScanerOpen = true;
            cordova.plugins.barcodeScanner.scan(
                function (result) {
                    code = result.text;
                    callback(code);
                    setTimeout(function () {
                        $rootScope.BarcodeScanerOpen = false;
                    }, 1000);
                },
                function (error) {
                    code = "error";
                    callback(code);
                }
            );
        },
        MapProdutos: function (arrProdutos) {
            var arr = _.map(arrProdutos, function (item) {
                if (item.nrItemVinculado === 0) {
                    var arrAdicionais = [];
                    var arrFracionados = [];
                    item.adicionais = [];
                    item.fracionados = [];
                    arrAdicionais = _.where(
                                arrProdutos,
                                {
                                    nrItemVinculado: item.nrItem,
                                    flItemAdicional: true
                                }
                            );
                    item.adicionais = arrAdicionais;

                    arrFracionados = _.where(
                                arrProdutos,
                                {
                                    nrItemVinculado: item.nrItem,
                                    flItemAdicional: false,
                                }
                            );

                    item.fracionados = arrFracionados;
                    return item;
                }

            });
            arr = _.filter(arr, function (item) {
                return item ? true : false;
            });
            return arr;
        },
        MapComandas: function (itens) {
            var arr = _.uniq(_.pluck(itens, "idComanda"));
            return arr;

        },
        VerificaConfiguracoes: function () {
            var configs = localStorage.getItem('config');
            if (!configs) {
                if (!$rootScope.wizardMode) {
                    alert('O terminal não está configurado.\nVocê será redirecionado para a tela de configurações.');
                }
                $location.url('/config');
            } else {
                var json = angular.fromJson(configs);
                config.tipoAtendimento = json.tipoAtendimento;
                config.localConfig = json;
            }
        },
        VerificaConfiguracaoMesa: function () {
            var deferred = $q.defer();
            ws.ObterConfiguracao()
            .then(
                function (data) {
                    var jsonConfiguracao = angular.fromJson($(data).find('ObterConfiguracaoResult').text());
                    ws.ObterMicroTerminal(config.ip).then(function (dadosMicroTerminal) {
                        var jsonMicroTerminal = angular.fromJson($(dadosMicroTerminal).find('ObterMicroTerminalResult').text());
                        if (!jsonMicroTerminal) {
                            alert("Não foi possível obter as configuração de microterminal\nVerifique se o cadastro deste microterminal está correto.");
                            ExitApp(false);
                        }
                        deferred.resolve([jsonConfiguracao, jsonMicroTerminal]);
                    });
                },
                function (error) {
                    deferred.reject(error);
                }
            );

            return deferred.promise;
        },
        ArrayToString: function (arr, inserirVigula) {
            var out = '';
            if (arr.length === 1) {
                return arr[0].toString();
            }
            _.each(arr, function (item) {
                out += item + ',';
            });
            out = out.substr(0, out.length - 1);
            if (inserirVigula) {
                out += ',';
            }

            return out;
        },
        FiltrarNrItem: function (itens) {
            return _.chain(itens)
					.where({ selecionado: true })
					.pluck('nrItem')
					.value();
        },
        TemItemJaImpresso: function(itens){
            return _.find(itens, function(item){ return item.selecionado && !item.flNovo }) ? true : false;
        },
        FormataValorTotalItem: function (item) {
            if (item.idTipoProduto == 3) {
                produtoPizza.ObterTotalPizza(item);
            }
            var total = ((item.vrPizza || item.vrUnitario) * item.qt);
            if (item.flFracionado) {
                total = funcoes.FormataQuiloParaGramas(total);
            }
            item.vrTotal = total;
            return total;
        },
        FormataQuiloParaGramas: function (val) {
            return val / 1000;
        },
        FormataGramasParaKilo: function (val) {
            return parseFloat(val) * 1000;
        },
        ValidarComanda: function (comanda, validarMensagem) {
            if (!comanda.FlagMensagem) {
                toast.showCustomToast(comanda.Mensagem);
                return false;
            }
            return true;
        },
        ValidarNumeroComanda: function (idComanda, flValidarDv) {
            var deferred = $q.defer();
            if (!idComanda)
                deferred.reject("Comanda não informada.");

            ws.ValidaComanda(idComanda, flValidarDv).then(
                function (data) {
                    var json = angular.fromJson($(data).find('ValidaComandaResult').text());
                    if (!json.FlagMensagem) {
                        deferred.reject(json.Mensagem);
                    } else {
                        deferred.resolve(json.idComanda);
                    }
				},
                function (error) {
                    deferred.reject(error);
				}
			);

            return deferred.promise;
        },
        ValidaCodigoBalanca: function (codigo) {
            var retorno = {};
            var cod = codigo.toString();
            //verifica se é um código de balança
            if (cod.length === 13 && cod[0] === "2") {
                retorno.quantidade = parseInt(cod.substring(7, 12));
                retorno.termo = parseInt(cod.substring(1, 7));
            } else {
                retorno.quantidade = 1;
                retorno.termo = cod;
            }
            return retorno;
        },
        SetFocus: function (element) {
            //element.focus();
            if (window.cordova) {
                $timeout(function () {
                    cordova.plugins.Focus.focus(element);
                    //funcoes.SetImmersiveMode();
                }, 100);
            }
        },
        SetImmersiveMode: function () {
            if (window.cordova) {
                AndroidFullScreen.isImmersiveModeSupported(
                    function (data) {
                        if (data) {
                            AndroidFullScreen.immersiveMode();
                            $cordovaStatusbar.hide();
                        }
					},
                    function (err) {
                        console.log('Erro ao verificar suporte ao modo imersivo:' + err);
					});
            }
        },
        TestaValorZeradoMesaOuComanda: function (num) {
            try {
                num = parseInt(num);
                if (num === 0) {
                    throw "o valor é zero";
                }
            }
            catch (err) {
                toast.showCustomToast('Só são aceitos numeros maiores que 0.');
                return false;
            }
            return true;
        },
        AtualizaIp: function () {
            if (window.networkinterface) {
                networkinterface.getIPAddress(function (ip) {
                    config.ip = $rootScope.ip = ip;
                    funcoes.ObterVersaoApp().then(function (version) {
                        $timeout(function () {
                            $rootScope.appVersion = version;
                        });
                    });
                },
                function (error) {
                    console.log(error);
				});
            } else {
                config.ip = $rootScope.ip = '10.0.0.19';
            }
        },
        SalvarArquivoDeLog: function (idMicroterminal, conteudo) {
            var deferred = $q.defer();
            ws.SalvarArquivoDeLog(idMicroterminal, angular.toJson(conteudo)).then(
                function (data) {
                    var json = angular.fromJson($(data).find('SalvarArquivoDeLogResult').text());
                    deferred.resolve(json.Mensagem);
				},
                function (error) {
                    deferred.reject(error);
				}
			);
            return deferred.promise;
        },
        ObterVersaoApp: function () {
            var deferred = $q.defer();
            $("body").removeClass("modal-open");
            document.addEventListener("deviceready", function () {
                cordova.getAppVersion.getVersionNumber().then(
                    function (versaoApp) {
                        deferred.resolve(versaoApp);
					},
                    function (error) {
                        deferred.reject(error);
					}
				);
            });
            return deferred.promise;
        },
        ValidaDadosParaTransferencia: function (origem, destino) {
            if (!origem || !destino) {
                toast.showCustomToast('Selecione a origem e o destino.');
                return false;
            }
            if (origem === destino) {
                toast.showCustomToast('A origem e o destino são iguais.');
                return false;
            }
            return true;
        },
        ValidaMesaComMultiplasComandas: function (itens) {
            var mesaValida = true;
            _.each(itens, function (item) {
                if (item.idComanda !== item.idMesa) {
                    mesaValida = false;
                }
            });
            return mesaValida;
        },
        ValidaComandaEmMesaDiferente: function (comanda, idMesa) {
            mesaDestino = parseInt(idMesa) || 0;
            mesaDaComanda = parseInt(comanda.idMesa);
            if (!Number.isInteger(mesaDestino) || !Number.isInteger(mesaDaComanda))
                return { ehValida: false, mensagem: 'A mesa da comanda solicitada ou a mesa informada não é valida.' };

            if (mesaDestino > 0 && mesaDaComanda > 0 && mesaDaComanda !== mesaDestino)
                return { ehValida: false, mensagem: 'A comanda está sendo utilizada na mesa ' + mesaDaComanda + '.' };

            return { ehValida: true };
        },
        ValidaMesaSemMultiplasComandas: function (itens) {
            var mesaValida = true;
            _.each(itens, function (item) {
                if (item.idComanda.toString() === item.idMesa.toString()) {
                    mesaValida = false;
                }
            });
            return mesaValida;
        },
        MostraMensagem: function(mensagem){
            var deferred = $q.defer();
            if(mensagem)
                toast.showCustomToast(mensagem);
            deferred.resolve();
            return deferred.promise;
        }
    };

    return funcoes;
}]);