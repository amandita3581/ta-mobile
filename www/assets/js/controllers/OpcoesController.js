angular.module('app').controller('OpcoesController',['$scope','$routeParams','produtos','$location','$rootScope',OpcoesController]);

function OpcoesController($scope,$routeParams,produtosSvc,$location,$rootScope){
    var vm = this;

    vm.fracionados = [];

    vm.adicionais = [];

    vm.selecionados = [];

    vm.origem = $routeParams.origem;

    vm.produto = produtosSvc.getProdutoByHash($routeParams.hash, vm.origem);

    if(vm.produto.idTipoProduto == 3){
        vm.tab="fracionados";
    }

    if(vm.produto.flRequererItemAdicional && vm.produto.idTipoProduto != 3)
    {
        vm.tab = 'adicionais';
    }

    if(!vm.produto.flRequererItemAdicional && vm.produto.idTipoProduto != 3){
        vm.tab = 'observacoes';
    }

     if(vm.produto.flRequererItemAdicional){
        if(!vm.produto.adicionais) {
            produtosSvc.getAdicionais(vm.produto);
        }
    }
    

    vm.abrirBuscaFracionado = function(){
        $location.url('/buscaFracionado/IdProduto/' + vm.produto.idProduto + '/Origem/' + vm.origem + '/Hash/' + vm.produto.$$hashKey);
    };

    vm.selecionaItem = function(item){
        if(item.selecionado){
            vm.selecionados.pop();
        }else{
            vm.selecionados.push(item);
        }
        item.selecionado = !item.selecionado;
    };

    vm.excluirItens = function(){
        produtosSvc.removerFracionadosSelecionados(vm.produto,vm.origem);
        vm.selecionados = [];
    };

     vm.excluirItem = function(item, ev){
        ev.preventDefault();
        item.selecionado = true;
        produtosSvc.removerFracionadosSelecionados(vm.produto,vm.origem);
        vm.selecionados = [];
    };
    if(vm.origem == 'novo'){
       $rootScope.backAction ='/busca';
    }else{
        $rootScope.backAction ='/atendimento';
    }


}
