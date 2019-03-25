angular.module('app').controller('FavoritosController', ['$scope','favoritos','pedido','produtos','toast','funcoes','operador', FavoritosController]);

function FavoritosController($scope,favoritos,pedido,produtosSvc,toast,funcoes, operador) {
    var vm = this;

    vm.itens = [];
    vm.temItens = true;
    vm.removerProduto = function (produto) {
        produtosSvc.removerProduto(produto);
    };

    vm.adicionarProduto = function (produto) {
		produtosSvc.adicionarProduto(produto);
    };

    vm.toggleProduto = function (produto) {
        if (produto.adicionado) {
            produto.adicionado = false;
            vm.removerProduto(produto);
        } else {
            produto.adicionado = true;
            vm.adicionarProduto(produto);
        }
    };

    vm.removerFavorito = function (item) {
        favoritos.removerFavorito(operador.getOperador().idOperador, item.idProduto)
            .then(function () {
                toast.showCustomToast('Favorito removido com sucesso!');
                ObterFavoritos();
            });       
    };

    vm.add = function (item) {
        var qt = funcoes.addQt(item.qt);
        item.qt = qt;
    };

    vm.sub = function (item) {
        var qt = funcoes.subQt(item.qt);
        item.qt = qt;
    };


    vm.formataValorTotalItem = function(item){
        return funcoes.FormataValorTotalItem(item);
    };

  

    function ObterFavoritos() {
        favoritos.obterFavoritos(operador.getOperador().idOperador).then(
            function (data) {
                if(data){
                    vm.itens = data;
                } else {
                    vm.itens = [];
                }

                if(vm.itens.length < 1){
                    vm.temItens = false;
                }            
            },
            function (error) {
                console.log(error);
            }
        );
    }

    ObterFavoritos();


}