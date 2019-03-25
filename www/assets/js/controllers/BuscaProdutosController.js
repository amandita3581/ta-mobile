angular.module('app').controller('BuscaProdutosController',['$scope', 'ws', '$rootScope', 'toast', 'produtos', '$routeParams', '$location', 'favoritos', 'config', 'pedido', 'funcoes', '$filter', '$timeout', 'operador', BuscaProdutosController]);

function BuscaProdutosController($scope, ws, $rootScope, toast, produtosSvc, $routeParams, $location, favoritos, config, pedido, funcoes, $filter, $timeout, operador){
    var vm = this;
    vm.termo = '';
    vm.categorias = [];
    vm.categoria = '';
    vm.subCategorias = [];
    vm.subCategoria = '';

    vm.origem = $routeParams.origem;
    vm.produtos = produtosSvc.getProdutosBusca();
    vm.isLoading = false;
    vm.config = config;

    $scope.$on("atualizarListaDeProdutos", function () {
        $timeout(function () {
            vm.produtos = produtosSvc.getProdutosBusca();
        }, 50);
    });

    vm.doSearch = function (ev) {
        if($(ev.target)){
            vm.termo = $(ev.target).val();

            if($(ev.target).attr('id') == 'buscaProdutoNumerico'){
                vm.termoString = '';
            }else{
                vm.termoNumerico = null;
            }
        }

        if(ev.termo){
            vm.termo = ev.termo;
        }
		var quantidade = 1;
		if(ev.produto){
			vm.termo = ev.produto.codigoProduto;
			if(ev.produto.quantidade)
				quantidade = ev.produto.quantidade;
		}

        if (ev.which == 13) {
            buscar(vm.termo, vm.categoria, vm.subCategoria, quantidade);
        }
    };

    vm.buscaPorCodigo = function (ev) {
        var flObter = false;
        if (ev.type == "keyup") {
            if (ev.which == 13) {
                flObter = true;
            }
        } else {
            flObter = true;
        }
        if(flObter){
            vm.termo = vm.termoNumerico;
            var produto = criarProduto(vm.termo);//funcoes.ValidaCodigoBalanca(codigo);
            buscar(produto);
            $(ev.currentTarget).blur();
        }
    };

    vm.buscaPorTexto = function (ev) {
        var flObter = false;
        if (ev.type == "keyup") {
            if (ev.which == 13) {
                flObter = true;
            }
        } else {
            flObter = true;
        }
        if (flObter) {
            vm.termo = vm.termoString;
            var produto = criarProduto(vm.termo);
            buscar(produto);
            $(ev.currentTarget).blur();
        }
    };

    var criarProduto = function (termo) {
        var produto = {};
        if (termo)
            produto = funcoes.ValidaCodigoBalanca(termo);

        produto.categoria = vm.categoria;
        produto.subcategoria = vm.subCategoria;
        return produto;
    };

    var buscar = function (produto) {
        $rootScope.isLoading = true;
        produtosSvc.buscar(produto.termo, produto.categoria, produto.subcategoria, false)
        .then(
            function (data) {
                var prod = produtosSvc.mapListaProdutos(data, 'ObterProdutoReduzindoResult', produto.quantidade);
                if (!prod.length) {
                    toast.showCustomToast('Produto não encontrado.');
                    vm.produtos = [];
                    produtosSvc.setProdutosBusca([]);
                } else {
                    vm.produtos = prod;
                    produtosSvc.setProdutosBusca(prod);
                    $filter('filterFavoritos')(vm.produtos);
                    $filter('filterMaxValFracionado')(vm.produtos);
                }
                $timeout(function () {
                    $rootScope.$apply();
                });
            },
            function (erro) {
                console.log(erro);
                vm.produtos = [];
                produtosSvc.setProdutosBusca([]);
            }
        );
        $('#buscaProduto').blur();
    };

    vm.limpar = function(){
        vm.produtos = [];
        vm.categoria = null;
        vm.subCategorias = [];
        vm.subCategoria = null;
        vm.termo = '';
        funcoes.SetFocus($('#buscaProdutoNumerico'));
    };

    vm.adicionarProduto = function (produto) {
        produtosSvc.setUltimoProdutoSelecionado(produto);
		produtosSvc.adicionarProduto(produto).then(function(result){
		    if (produto.flFracionado) {		        
		        produtosSvc.obterQuantidadeParaItemFracionado(produtosSvc.getUltimoProdutoSelecionado());
		    }
		},
		function(reason){
			if(reason !== null)
				alert(reason);
		});
    };

    vm.selecionaItem = function(item){
        if(item.selecionado){
            vm.selecionados.pop();
        }else{
            vm.selecionados.push(item);
        }
        item.selecionado = !item.selecionado;
    };

    vm.removerProduto= function(produto){
        produtosSvc.removerProduto(produto);
    };

    vm.toggleProduto = function(produto){
        if(produto.adicionado) {
            vm.removerProduto(produto);
        }else{
            vm.adicionarProduto(produto);
        }
    };

    vm.ObterCategorias = function(){
        ws.ObterCategoria()
        .done(function(data){
            vm.categorias = angular.fromJson($(data).find('ObterCategoriaResult').text());
            vm.subCategoria = 0;
        }).fail(function(error){
            console.log(error);
        });
    };

    vm.ObterSubCategorias = function(){
		if(!vm.categoria){
			vm.limpar();
			return false;
		}
			
        ws.ObterSubCategoria(vm.categoria)
        .done(function(data){
            vm.subCategorias = angular.fromJson($(data).find('ObterSubCategoriaResult').text());
            vm.subCategoria = 0;
            var termo = vm.termoNumerico || vm.termoString;
            var produto = criarProduto(termo);
            buscar(produto);
            $scope.$digest();
        }).fail(function(error){
            console.log(error);
        });
    };

    vm.selecionarSubcategoria = function () {
        var produto = criarProduto();
        buscar(produto);
    };
    vm.abrirOpcoes = function(produto){
        $location.url('/opcoes/Hash/' + produto.$$hashKey + '/Origem/novo');
    };

    vm.openBarCodeScanner = function(ev){
        funcoes.ScanBarCode(function(code){
			if(!code) 
				return false;
			
            var produto = criarProduto(code);
            buscar(produto);
        });
    };

    vm.adicionarFavorito = function (item) {
        var op = operador.getOperador();
        if (!item.favorito) {
            favoritos.adicionarFavorito(op.idOperador, item.idProduto)
                .then(function () {
                    item.favorito = true;
                });
        } else {
            favoritos.removerFavorito(op.idOperador, item.idProduto)
                .then(function () {
                    item.favorito = false;
                });
        }
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

    vm.ObterCategorias();

}