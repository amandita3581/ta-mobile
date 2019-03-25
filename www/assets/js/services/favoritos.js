angular.module('app').factory('favoritos',['config','ws','toast','$q','produtos','funcoes',function (config,ws,toast,$q,produtos,funcoes) {
    var fav = {
        adicionarFavorito: function (operador, idProduto) {
            var deferred = $q.defer();
            ws.AdicionarFavorito(idProduto, operador)
                .then(
                function (data) {
                    var json = angular.fromJson($(data).find('AdicionarFavoritoResult').text());
                    if (!json.FlagMensagem) {
                        toast.showCustomToast(json.Mensagem);
                        deferred.reject();
                    } else {
                        deferred.resolve();
                    }
                },
                function (error) {
                    toast.showCustomToast("Não foi possível adicionar o favorito selecionado.");
                    deferred.reject();
                }
                );
            return deferred.promise;
        },
        removerFavorito: function (operador, idProduto) {
            var deferred = $q.defer();
            return ws.RemoverFavorito(idProduto, operador)
                .then(
                    function (data) {
                        var json = angular.fromJson($(data).find('RemoverFavoritoResult').text());
                        if (!json.FlagMensagem) {
                            toast.showCustomToast(json.Mensagem);
                            deferred.reject();
                        } else {
                            deferred.resolve();
                        }
                    },
                    function (error) {
                        toast.showCustomToast("Não foi possível remover o favorito selecionado.");
                        deferred.reject();
                    }
                );
            return deferred.promise;
        },
        obterFavoritos: function (idOperador) {
            var deferred = $q.defer();
            ws.ObterFavoritos(idOperador)
                .then(
                    function (data) {
                        var json = angular.fromJson($(data).find('ObterFavoritosResult').text());
                        if (json.Mensagem) {
                            toast.showCustomToast(json.Mensagem);
                            deferred.reject();
                        }
                        else {
                            deferred.resolve(json);
                        }
                    },
                    function (error) {
                        toast.showCustomToast("Não foi possível obter a lista de favoritos.");
                        deferred.reject();
                    }
                );
            return deferred.promise;
        },
        setListaDeFavoritos: function (favoritos) {
            localStorage.setItem('favoritos', angular.toJson(favoritos));
        },
        obterFavoritosDoServidor: function (operador) {
            var deferred = $q.defer();
            var favoritos = fav.obterListaDeFavoritosPorOperador(operador);
            arrFavoritos = _.map(favoritos,function(item){
                return item.codigo;
            });
            strFavoritos = funcoes.ArrayToString(arrFavoritos);

            if (strFavoritos !== "") {
                produtos.obterProdutosArray(strFavoritos).then(
                    function (data) {
                        deferred.resolve(data);
                    },
                    function (error) {
                        deferred.reject(error);
                    }
                );
            } else {
                deferred.resolve(null);
            }

            return deferred.promise;
        }
    };

    return fav;
}]);