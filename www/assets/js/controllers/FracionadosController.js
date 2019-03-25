angular.module('app').controller('FracionadosController',['$scope','$mdDialog','ws','$rootScope','toast','p',FracionadosController]);

function FracionadosController($scope,$mdDialog,ws,$rootScope,toast,p){
    var vm = this;
    vm.termo = '';
    vm.produtos = [];
    vm.produtoOrigem = p;
    vm.close = function(){
        $mdDialog.hide();
    };

    vm.doSearch = function(ev){
        if(ev.which == 13) {
            var term = parseInt(vm.termo);
            var codigo = 0;
            var prod = '';
            if (term) {
                codigo = term;
            } else {
                prod = vm.termo;
            }
            ws.ObterProduto(prod, codigo, 0, 0, true , false)
                .done(function (data) {
                    vm.produtos = angular.fromJson($(data).find('ObterProdutoResult').text());
                    vm.produtos = vm.produtos.filter(function(item){
                        if(item.idProduto != vm.produtoOrigem.idProduto){
                            return item;
                        }
                    });
                })
                .fail(function (erro) {
                    console.log(erro);
                });
            $('#buscaFracionado').blur();
        }
    };

    vm.addProduto = function(produto){
        if(produto.adicionado){
            vm.removeProduto(produto);
        }else{
            //if(produto.IdProduto == vm.produtoOrigem.IdProduto) {
            //    toast.showCustomToast('Este item já foi adicionado.');
            //    return;
            //}
            var prod = vm.produtoOrigem.fracionados[produto];
            if(!prod){
                $rootScope.$broadcast('adicionarItemFracionado', p.idProduto,produto);

            }
        }
    };

    vm.removeProduto = function(produto){
        vm.produtoOrigem.fracionados = vm.produtoOrigem.fracionados.filter(function(item){
            if(item.idProduto != produto.idProduto) {
                return item;
            }else{
                $rootScope.$broadcast('removerItemFracionado', p.idProduto,produto);
            }
        });
    };

    $scope.$on('fracionadoAdicionado',function(event,adicionado,produto){
        if(!adicionado){
            toast.showCustomToast('Este item já foi adicionado.');
        }else{
            var prod = angular.copy(produto);
            prod.adicionado = false;
            vm.produtoOrigem.fracionados.push(prod);
            produto.adicionado = true;
        }
    });

    $scope.$on('fracionadoRemovido',function(event,produto){
        produto.adicionado = false;

        vm.produtos = vm.produtos.filter(function(item){
            if(item.idProduto == produto.idProduto){
                item.adicionado = false;

            }
            return item;
        });
    });

}
