angular.module('app').filter('filterProdutosAdicionados',['favoritos','$rootScope','produtos',function(favoritos,$rootScope,produtosSvc){
    return function (itens) {
        var produtosAdicionados = produtosSvc.getProdutos();
        var out = [];
        if(itens.length){
            out = _.map(itens, function (i) {
                _.each(produtosAdicionados, function (p) {
                    if (p.idCodigo == i.idCodigo) {
                        i.adicionado = true;
                        return false;
                    }
                });
                return i;
            });
        }
        return out;
    };
}]);



