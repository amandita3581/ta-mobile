angular.module('app').factory('ws',['config','md5','$rootScope','$location','toast', '$timeout', '$window', '$filter', '$q','log', ws]);


function ws(config, md5, $rootScope, $location, toast, $timeout, $window, $filter, $q, logSvc){

    var objWs = {};
	
	var metodosSemLoading = ['ObterListaMesa'];
	var regexContemLetras = /\D/;

    objWs.BloqueiaDesbloqueiaMesa = function(numeroMesa,flagBloqueia,flagBloqueadaLancamento,operador, bloqueiaPedidoParaUso){
        var dados = {
            NumeroMesa:numeroMesa,
            flagBloqueia : flagBloqueia,
            FlagBloqueadaLancamento:flagBloqueadaLancamento,
            Operador:operador,
			BloqueiaPedidoParaUso: bloqueiaPedidoParaUso || false
        };
        return post('BloqueiaDesBloqueiaMesa',dados);
    };
	
	objWs.DesbloqueiaAtendimentosMesa = function(mesa, idOperador, strSenha){
		strSenha = regexContemLetras.test(strSenha) ? strSenha : md5.createHash(strSenha);
		var dados = {
			idMesa : mesa,
			IDOperador : idOperador,
			senha: strSenha
		};
		return post('DesbloqueiaAtendimentosMesa',dados);
	};

    objWs.ExcluirItensDaComanda = function (comanda, stItens, idOperador, strSenha, flagMesa) {
        strSenha = regexContemLetras.test(strSenha) ? strSenha : md5.createHash(strSenha);
        var dados = {
            Comanda: comanda,
            Itens: stItens,
            IDOperador: idOperador,
            Senha: strSenha,
            flagMesa: flagMesa
        };
        return post('ExcluirItensDaComanda',dados);
    };

    objWs.EmitirConta = function(nrMesa, arrComanda, operador, microterminal){
        var dados = {
          Mesa : nrMesa,
          Comandas: arrComanda,
          IdOperador: operador,
          MicroTerminal: microterminal
        };
        return post('EmitirConta',dados);
    };

    objWs.ExcluirMesaComanda = function (strComandas, idOperador, strSenha, strImpressora, strImpressoraPorta) {
        strSenha = regexContemLetras.test(strSenha) ? strSenha : md5.createHash(strSenha);
        var dados = {
          Comandas: strComandas,
            IDOperador : idOperador,
            Senha: strSenha,
            Impressora:strImpressora,
            ImpressoraPorta:strImpressoraPorta
        };

        return post('ExcluirMesaComanda',dados);
    };
	
	objWs.ImprimirNovosMesaComanda = function(mesa){
		var dados = {
          IdMesa: mesa
        };

        return post('ImprimirNovosMesaComanda',dados);
	};

    objWs.LiberandoAtendimento = function () {
        var dados = {
            IdComandaNaoLibera: ''
        };

        return post('LiberandoAtendimento', dados);
    };

    objWs.ObterComandaDisponivel = function () {
        return post('ObterComandaDisponivel', {});
    };

    objWs.ObterCategoria = function(){
        return post('ObterCategoria');
    };

    objWs.ObterConfiguracao = function(){
        return post('ObterConfiguracao');
    };

    objWs.ObterImpressoraFiscal = function(){
        return post('ObterImpressoraFiscal');
    };

    objWs.ObterListaMesa = function(){
		if(config.localConfig.utilizaRangeMesa === '1')
		{
			var range = {};
			range.nrInicioRange = config.localConfig.MesaInicial;
			range.nrFimRange = config.localConfig.MesaFinal;
			range = angular.toJson(range);
			var dados = {
				range : range
			};
			return post('ObterListaMesa', dados);
		}
        return post('ObterListaMesa');
    };

    objWs.ObterMesa = function(NumeroMesa){
        var dados = {
            NumeroMesa:NumeroMesa
        };
        return post('ObterMesa',dados);
    };

    objWs.ObterMesaComanda = function(idMesa,strComanda,operador, flValidarDv){
        var dados = {
            idMesa:idMesa,
            codComanda:strComanda.toString(),
            Operador: operador,
			FlValidarDv: flValidarDv
        };
        return post('ObterMesaComanda',dados);
    };
	
	objWs.ObterMicroTerminal = function(idMicroTerminal){
        var dados = {
            microTerminal : idMicroTerminal
        };
        return post('ObterMicroTerminal', dados);
    };

    objWs.ObterOperador = function(idOperador){
        var dados = {
            IDOperador: idOperador
        };

        return post('ObterOperador',dados);
    };

    objWs.ObterOperadorValida = function (idOperador, strSenha, idPermissao) {
        strSenha = regexContemLetras.test(strSenha) ? strSenha : md5.createHash(strSenha);
        var dados = {
            IDOperador:idOperador,
            Senha: strSenha,
            IDPermissao:idPermissao
        };

        return post('ObterOperadorValida',dados);
    };

    objWs.ObterPedido = function(NumeroMesa,Comanda){
        var dados = {
            NumeroMesa:NumeroMesa,
            Comanda: Comanda
        };
        return post('ObterPedido',dados);
    };

    objWs.ObterPreco = function(idProduto){
        var dados = {
            IDProduto:idProduto
        };

        return post('ObterPreco',dados);
    };

    objWs.ObterProduto = function(strProduto,idCodigo,idCategoria,idSubCategoria,fracionado, nroRegistro, flagProcuraInicioOuNoMeio){
        var dados = {
           ProdutoAbreviado:strProduto,
           IDCodigo:idCodigo || 0,
           IDCategoria: idCategoria || 0,
           IDSubCategoria:idSubCategoria || 0,
           nroRegisto: nroRegistro,
           flagProcuraInicioOuNoMeio: flagProcuraInicioOuNoMeio
        };
        if(fracionado){
            return post('ObterProdutoFracionado',dados);
        }else{
            return post('ObterProdutoReduzindo',dados);
        }

    };

    objWs.ObterProdutoArray = function (lista) {
        var dados = {
            lista : lista
        };
        return post('ObterProdutoArray', dados);
    };

    objWs.ObterProdutoAdicional = function(idGrupo){
        var dados ={
            IdGrupoAdicional:idGrupo
        };
        return post('ObterProdutoAdicional',dados);
    };

    objWs.ObterRespostaWebService = function(caminho){
        return post('ObterRespostaWebService',null,caminho);
    };

    objWs.ObterSubCategoria = function(idCategoria){
        var dados = {
            IDCategoria:idCategoria
        };
        return post('ObterSubCategoria',dados);
    };

    objWs.ReImprimirPedido = function (idComanda, mesa, itens, idOperador, strSenha) {
        strSenha = regexContemLetras.test(strSenha) ? strSenha : md5.createHash(strSenha);
        var dados = {
            Comanda : idComanda,
			Mesa : mesa,
            Itens: itens,
            IdOperador: idOperador,
            Senha: strSenha
        };
        return post('ReImprimirPedido', dados);
    };

    objWs.Salvar = function(stringJson, imprimir, imprimirTodosMesa){
        var dados = {
          stringJSon:stringJson,
          flagImprimir: imprimir,
          flagImprimirTodosMesa: imprimirTodosMesa
        };
        return post('Salvar',dados);
    };
	
	objWs.SalvarArquivoDeLog = function(idMicroterminal, conteudo){
        var dados = {
			IdMicroterminal: idMicroterminal,
			Conteudo: conteudo
        };
        return post('SalvarArquivoDeLog',dados);
    };	

    objWs.TesteImpressao = function(strTexto,strImpressora, strPorta){
        var dados = {
            TextoQualquer:strTexto,
            impressora:strImpressora,
            impressoraPorta:strPorta
        };
        return post('TesteImpressao',dados);
    };

    objWs.TransferirComanda = function (idComandaOrigem, idComandaDestino, idOperador, strSenha) {
        strSenha = regexContemLetras.test(strSenha) ? strSenha : md5.createHash(strSenha);
        var dados = {
            IdComandaOrigem:idComandaOrigem,
            IdComandaDestino: idComandaDestino,
            IdOperador:idOperador,
            Senha:strSenha
        };
        return post('TransferirComanda',dados);
    };

    objWs.TransferirComandaMesa = function (arrOrigem, destino, usuario, strSenha) {
        strSenha = regexContemLetras.test(strSenha) ? strSenha : md5.createHash(strSenha);
        var dados = {
            idMesaDestino: destino,
            listaComandas: arrOrigem,
            IdOperador:usuario,
            Senha:strSenha
        };
        return post('TransferirComandaMesa',dados);
    };
	
	objWs.TransferirComandaMesaSemValidacao = function(arrOrigem, destino){
		var dados = {
			idMesaDestino: destino,
			listaComandas : arrOrigem
		};
		return post('TransferirComandaMesaSemValidacao',dados);
	};

    objWs.TransferirMesa = function (idMesaOrigem, idMesaDestino, idOperador, strSenha) {
        strSenha = regexContemLetras.test(strSenha) ? strSenha : md5.createHash(strSenha);
        var dados = {
            IdMesaOrigem:idMesaOrigem,
            IdMesaDestino:idMesaDestino,
            IdOperador:idOperador,
            Senha:strSenha
        };
        return post('TransferirMesa',dados);
    };

    objWs.TransferirComandaParaMesa = function (idComandaOrigem, idMesaDestino, idOperador, strSenha) {
        strSenha = regexContemLetras.test(strSenha) ? strSenha : md5.createHash(strSenha);
        var dados = {
            IdMesaDestino: idMesaDestino,
            IdComandaOrigem: idComandaOrigem,
            IdOperador: idOperador,
            Senha: strSenha
        };
        return post('TransferirComandaParaMesa', dados);
    };
	
	objWs.ValidaComanda = function(idComanda, flValidarDv){
		var dados = {
			IdComanda : idComanda,
			FlValidarDv: flValidarDv
		};
		return post("ValidaComanda", dados);
    };

    objWs.AdicionarFavorito = function (idProduto, idOperador) {
        var dados = {
            idProduto: idProduto,
            idOperador: idOperador
        };
        return post("AdicionarFavorito", dados);
    };

    objWs.RemoverFavorito = function (idProduto, idOperador) {
        var dados = {
            idProduto: idProduto,
            idOperador: idOperador
        };
        return post("RemoverFavorito", dados);
    };

    objWs.ObterFavoritos = function (idOperador) {
        var dados = {
            idOperador: idOperador
        };
        return post("ObterFavoritos", dados);
    };


    function post(metodo,dados, caminho, timeout){
		var url = (caminho || config.apiUrl);
        var log = {request: {}, response: {}};
		if(url){
			var req = $.soap({
				url: 'http://' + url ,
				method: metodo,
				data: dados || {},
				appendMethodToURL:false,
				timeout: timeout || 60000,
				namespaceURL:'http://tempuri.org/',
				SOAPAction:'http://tempuri.org/' + metodo,
				beforeSend:function(soapRequest){
					log.request.metodo = metodo;
					log.request.request = soapRequest.toString();
					if(!_.contains(metodosSemLoading,metodo))
						IniciaLoading();
					$timeout.cancel($window.sessionTimeout);
				},
				success:function(soapResponse){
					var xml = soapResponse.toXML();
					if(!xml) {
						alert('Sem resposta do servidor.');
						$(document).trigger('exitApp',[false]);
					}
					var json = angular.fromJson($(xml).find(metodo + 'Result').text());
					json = json.length ? json[0] : json;
					if(json.FlagLicenca === false){
                        $rootScope.$broadcast('licencaExpirada');
                        return;
					}
					$rootScope.$broadcast('versaoRemota', json.versaoApp, json.versaoWs);
				},
				statusCode: {                 
					200: function(){
						FinalizarLoading();
					},
					503: function () {
						alert('Servidor Indisponível.');
						$(document).trigger('exitApp',[false]);
					},
				}
			});

			req.complete(function(response){
				var json = angular.fromJson($(response.responseXML).find(metodo + 'Result').text());
				log.response.metodo = metodo;
				log.response.response = $filter('filterItensLog')(angular.toJson(json));
				if(metodo !== 'SalvarArquivoDeLog')
					logSvc.GerarLogDeObjeto(log);
				FinalizarLoading();
				IniciarTimeoutDeSessao();
			});
			req.error(function(error){
				console.log(error);
				log.response.metodo = metodo;
				log.response.response = error;
				if(metodo !== 'SalvarArquivoDeLog')
					logSvc.GerarLogDeObjeto(log);
				FinalizarLoading();
				IniciarTimeoutDeSessao();
			});
			return req;
		}
		else
		{
			alert('Caminho do servidor não configurado.');
			var deferred = $q.defer();
			deferred.reject({customError:true, msg:'Caminho do servidor não configurado.'});	
			$location.url('/configServer');
			return deferred.promise;
		}
    }

    function FinalizarLoading() {
        $rootScope.$broadcast('finalizaLoading');
    }
	
	function IniciaLoading(){
		$rootScope.$broadcast('iniciaLoading');
	}

    function IniciarTimeoutDeSessao() {
        $window.sessionTimeout = $timeout(function () {
           /* if ($rootScope.pageTitle != 'Home') {
                alert('Sua sessão expirou, faça login novamente');
                $location.url('/');
                $rootScope.$apply();
            }*/
        }, config.minutosSessao * 60000);
    }
    return objWs;

}

