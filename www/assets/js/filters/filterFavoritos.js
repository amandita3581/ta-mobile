angular.module('app').filter('filterFavoritos',['favoritos','$rootScope','operador',function(favoritos,$rootScope,operador){
    return function (itens) {
        return favoritos.obterFavoritos(operador.getOperador().idOperador)
            .then(
                function (data) {
                    _.each(itens, function (item) {
                        _.each(data, function (f) {
                            if (f.idProduto == item.idProduto) item.favorito = true;
                        });
                    });
                    return itens;
                },
                function () {

                }
            );
	};
}]);