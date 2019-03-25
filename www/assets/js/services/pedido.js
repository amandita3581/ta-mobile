angular.module('app').factory('pedido', ['$q', 'produtos', 'toast', 'ws', 'config', '$rootScope', '$timeout', 'funcoes', 'operador', 'autenticacao',
function ($q, produtosSvc, toast, ws, config, $rootScope, $timeout, funcoes, operador, auth) {
	var pedido = {};
	pedido.comandas = [];
	pedido.itensConsumidos = [];
    pedido.comanda = null;
	pedido.comandaLeitor = '';
    pedido.getConfigAtendimento = function () {
		var configMesa = '';
        if (config.tipoAtendimento === 'mesa') {
            if (config.configuracao.mesaComMultiplasComandas) {
                configMesa = 'mesa-comanda';
            } else {
                configMesa = 'mesa';
            }
        } else {
            configMesa = 'comanda';
        }
        return configMesa;
    };

    pedido.setMesaAtual = function(mesa){
        pedido.mesaAtual = mesa;
    };

    pedido.getMesaAtual = function(){
        return pedido.mesaAtual;
    };

    pedido.setComandaAtual = function (nrComanda) {
        pedido.comandaAtual = nrComanda;
	};

	pedido.getComandaAtual = function(){
		return pedido.comandaAtual;
	};

	pedido.setComanda = function(comanda){
		pedido.comanda = comanda;
	};

	pedido.getComanda = function(){
		return pedido.comanda;
	};
	
	pedido.setComandaLeitor = function(comanda){
		pedido.comandaLeitor = comanda;
	};
	
	pedido.getComandaLeitor = function(){
		return pedido.comandaLeitor;
	};
	
	pedido.setComandas = function(arrComandas){
		pedido.comandas = arrComandas;
	};
	
	pedido.getComandas = function(){
		return pedido.comandas;
	};

	pedido.setMesa = function(nrMesa,localizada){
		pedido.mesa = nrMesa;
	};

	pedido.setPessoas = function(nrPessoas){
		pedido.pessoas = nrPessoas;
	};
	
	pedido.getPessoas = function(){
		return pedido.pessoas;
	};

	pedido.getMesa = function(){
		return pedido.mesa;
	};

	pedido.setItensConsumidos = function (itens) {
        $timeout(function () {
            pedido.itensConsumidos = itens;
            $rootScope.$broadcast("itensConsumidosObtidos");
        }, 50);
	};

	pedido.getItensConsumidos = function(){
		return pedido.itensConsumidos;
	};

	pedido.removeItemConsumido = function(itemConsumido){
		return _.filter(pedido.itensConsumidos,function(item){
			return item === itemConsumido;
		});
	};

	pedido.abrirTelaComanda = function(){
        var deferred = $q.defer();
        $('#modalAddComanda').modal('show');
        
        $('#modalAddComanda #addComanda').click(function(){
            var numComanda = $("#numComandaAdd").val();
            deferred.resolve(numComanda);
            $('#modalAddComanda').modal('hide');
        });
        
        return deferred.promise;
	};

	pedido.setComandas = function(comandas){
		pedido.comandas = comandas;
	};

	pedido.getComandas = function(){
		return pedido.comandas;
	};

	pedido.addComanda = function (comanda) {
        var comandas = pedido.getComandas();
        if (!_.contains(comandas, comanda)) {
            pedido.comandas.push(comanda);
        }
        $rootScope.$broadcast("comandaAdicionada");
	};

	pedido.removerComandaPorIdComanda = function(idComanda){

	};
	
	pedido.criarObjetoAtendimento = function () {
        var tipoAtendimento = config.tipoAtendimento;
        var mesa = tipoAtendimento === 'comanda' ? 0 : pedido.getMesa();
        var comanda = tipoAtendimento === 'mesa' ? pedido.getMesa() : pedido.getComanda();
        if (!comanda)
            comanda = "";
        var pessoas = pedido.getPessoas();
        var listaProdutos = produtosSvc.getProdutos();
        var terminal = config.ip;
        
        
        var atendimento = {};
        atendimento.idComanda = comanda;//mesa.mesa;
        atendimento.idMesa = mesa || 0;
        atendimento.flBloqueada = 0;
        atendimento.nrPessoas = pessoas || 1;
        atendimento.stOperador = operador.getOperador().stApelido || "";
        atendimento.itens = [];
        
        _.each(listaProdutos, function (element) {
            var prod = {
                idComanda: comanda, //mesa.mesa,
                nrItem: 0,
                idPessoa: 1,
                idProduto: element.idCodigo,
                stOperador: atendimento.stOperador,
                nrQuantidade: parseFloat(element.qt.toString().replace(',', '.')),
                stIncremento: element.observacoes,
                idMicroTerminal: terminal,
                flItemAdicional: 0,
                flSem: 0,
                nrItemVinculado: 0,
                vrUnitario: element.vrUnitario || 0
            };
            if (element.flRequererItemAdicional) {
                var arrAdicionais = _.filter(element.adicionais, function (item) {
                    return item.flAdicionado !== 2;
                });
                arrAdicionais = _.map(arrAdicionais, function (item) {
                    return {
                        idComanda: comanda, //mesa.mesa,
                        idProduto: item.IdCodigo,
                        nrQuantidade: 1,
                        stIncremento: '',
                        idMicroTerminal: terminal,
                        flItemAdicional: 1,
                        flSem: item.flAdicionado,
                        nrItemVinculado: element.idCodigo,
                        vrUnitario: item.vrUnitario
                    };
                });
                prod.adicionais = arrAdicionais;
            }
        
            if (element.idTipoProduto === 3) {
                var arrFracionados = _.map(element.fracionados, function (item) {
                    return {
                        idComanda: comanda, //mesa.mesa,
                        idProduto: item.idCodigo,
                        nrQuantidade: 1,
                        stIncremento: '',
                        idMicroTerminal: terminal,
                        flItemAdicional: 0,
                        flSem: 0,
                        nrItemVinculado: element.idCodigo
                    };
                });
                prod.fracionados = arrFracionados;
            }
            atendimento.itens.push(prod);
        });
        return atendimento;
	};

	pedido.emitirConta = function(mesa, comandas, operador, microterminal){
		var deferred = $q.defer();

		ws.EmitirConta(mesa, comandas, operador, microterminal).then(
			function(data){
				deferred.resolve(data);
			},
			function(error){
				deferred.reject(error);
			}
		);

		return deferred.promise;
	};

	pedido.limparPedido = function(){
        produtosSvc.limparProdutos();
        produtosSvc.limparBuscaProdutos();
        pedido.setMesa(null, false);
        pedido.setPessoas(null);
        pedido.comandaAtual = null;
        pedido.comandas = [];
        pedido.comandaTexto = null;
        pedido.itensConsumidos = [];
        pedido.comanda = null;
        comandaTexto = null;
        pedido.mesaAtual = null;
        pedido.mesaString = null;
        pedido.comandaLeitor = null;
	};

	pedido.salvarPedido = function (imprimir, imprimirTodosMesa, mostrarMensagemSucesso) {
        var deferred = $q.defer();
        var tipoAtendimento = config.tipoAtendimento;
        if (tipoAtendimento === 'mesa' || tipoAtendimento === 'mesa-comanda') {
            ws.BloqueiaDesbloqueiaMesa(pedido.getMesa(), 1, 0, operador.getOperador().idOperador)
            .then(
                function (data) {
                    if (tipoAtendimento === 'mesa-comanda') {
                        imprimir = imprimirTodosMesa;
                    }
                    Salvar(imprimir, imprimirTodosMesa).then(
                        function (data) {
                            if (mostrarMensagemSucesso)
                                toast.showCustomToast(data.Mensagem);
                            $rootScope.$broadcast("limparListaItens");
                            deferred.resolve();
                        },
                        function (data) {
                            toast.showCustomToast(data.Mensagem);
                            deferred.reject();
                        });                
                },
                function (error) {
                    toast.showCustomToast('N&atilde;o foi poss&iacute;vel bloquear a mesa antes de salvar');
                    deferred.reject();
                }
            );
        } else {
            Salvar(imprimir, imprimirTodosMesa).then(
                function (data) {
                    if (mostrarMensagemSucesso)
                        toast.showCustomToast(data.Mensagem);
                    deferred.resolve(data);
                },
                function (data) {
                    toast.showCustomToast(data.Mensagem);
                    deferred.reject();
                }
            );
        }
        
        return deferred.promise;
    };
    pedido.solicitaUsuarioParaExclusaoSeNecessario = function(idComanda, itensPedido){
        var deferred = $q.defer();
        if(funcoes.TemItemJaImpresso(itensPedido)){
            auth.solicitarUsuarioSenha(1).then(
                function (data) {
                    deferred.resolve({idComanda: idComanda, itens: itensPedido, usuario: data.usuario, senha: data.senha});  
                }
            );              
        }else{
            var op = operador.getOperador();
            deferred.resolve({idComanda: idComanda, itens: itensPedido, usuario: op.idOperador, senha: op.stSenha});
        }
        return deferred.promise;
    };
    /*
    objExclusao = {idComanda: idComanda, itens: itensPedido, usuario: op.idOperador, senha: op.stSenha}
    */
	pedido.excluirItens = function (objExclusao) {
        var deferred = $q.defer();
        var itensExclusao = funcoes.ArrayToString(funcoes.FiltrarNrItem(objExclusao.itens));
        if (itensExclusao.length > 0) {
            excluirItens(objExclusao.idComanda, itensExclusao, objExclusao.usuario, objExclusao.senha)
            .then(function(){
                deferred.resolve("Itens excluídos com sucesso!");
            },
            function(error){
                deferred.reject(error);
            });
        }else{
            deferred.reject("Não foi selecionado nenhum item para exclusão.");
        }
        return deferred.promise;
    };
    
    var excluirItens = function(idComanda, itensExclusao, usuario, senha){
        var deferred = $q.defer();
        ws.ExcluirItensDaComanda(idComanda, itensExclusao, usuario, senha, config.tipoAtendimento === 'mesa')
        .then(
            function (data) {
                 var json = angular.fromJson($(data).find('ExcluirItensDaComandaResult').text());
                 if (json.flagRetorno) {
                     deferred.resolve(json.Mensagem);
                 } else {
                     deferred.reject(json.Mensagem);                               
                 }
            },
            function (error) {
                deferred.reject("Server - Não foi possível realizar a exclusão");
            }
        );
        return deferred.promise;
    };


	function Salvar(imprimir, imprimirTodosMesa) {
        var deferred = $q.defer();
        var atendimento = pedido.criarObjetoAtendimento();
        ws.Salvar(angular.toJson(atendimento), imprimir, imprimirTodosMesa)
        .then(
            function (data) {
                var json = angular.fromJson($(data).find('SalvarResult').text());
                if (json.flagRetorno) 
                    deferred.resolve(json);
                else 
                    deferred.reject(json);
            },
            function (error) {
                toast.showServerErrorToast();
                deferred.reject(error);
            }
        );
        return deferred.promise;
    }
    
	pedido.reimprimirItens = function (itens, usuario, senha) {
        var mesa = "";
        var comanda = "";
        var tipoAtendimento = config.tipoAtendimento;
        if (tipoAtendimento === "mesa") {
            comanda = 0;
            mesa = pedido.getMesa();
        } else {
            comanda = pedido.getComanda();
            mesa = 0;
        }
        var itensSelecionados = funcoes.ArrayToString(funcoes.FiltrarNrItem(itens), false);
        ws.ReImprimirPedido(comanda, mesa, itensSelecionados, usuario, senha).then(
            function (data) {
                $timeout(function () {
                    var json = angular.fromJson($(data).find('ReImprimirPedidoResult').text());
                    if (json.flagRetorno) {
                        toast.showCustomToast('Pedido reimpresso com sucesso!');
                    } else {
                        toast.showCustomToast(json.Mensagem);
                    }
                });
            },
            function (erro) {
                console.log(erro);
            }
        );
	};

	return pedido;
}]);

