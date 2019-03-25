angular.module('app').controller('BuscaFracionadosController',['$scope', 'ws', '$rootScope', 'toast', 'produtos', '$routeParams', '$location', '$window', 'funcoes', 'config', BuscaFracionadosController]);

function BuscaFracionadosController($scope, ws, $rootScope, toast, produtosSvc, $routeParams, $location, $window, funcoes, config){
	var vm = this;
	vm.termo = '';
	vm.categorias = [];
	vm.categoria = 0;
	vm.subCategorias = [];
	vm.subCategoria = 0;

	vm.origem = $routeParams.origem;
	vm.idProduto = $routeParams.idproduto;
	vm.hashProduto = $routeParams.hash;
	vm.isLoading = false;
	vm.produto = produtosSvc.getProdutoByHash(vm.hashProduto,vm.origem);
	vm.config = config;
	vm.doSearch = function(ev){
		if(ev.which == 13) {
			$rootScope.isLoading = true;
			produtosSvc.buscar(vm.termo,vm.categoria,vm.subCategoria,true)
			.then(
				function(data){
					var arr = produtosSvc.mapListaProdutos(data,'ObterProdutoFracionadoResponse');

					if(arr.length){
					 arr = _.filter(arr, function (item) {
						return item.idProduto.toString() != vm.idProduto;
					 });

					 vm.produtos = arr;
					 $scope.$apply();
					} else {
						toast.showCustomToast('Produto fracionado não encontrado.');
						vm.produtos = [];
						$scope.$apply();
					}
				},
				function(error){
					toast.showServerErrorToast();
				}
			);
			$('#buscaProduto').blur();
		}
	};

	vm.limpar = function () {
		vm.produtos = [];
		vm.categoria = null;
		vm.subCategorias = [];
		vm.subCategoria = null;
		vm.termo = '';
		funcoes.SetFocus($('#buscaProduto'));

	};

	vm.adicionarProduto = function(produto){
		produtosSvc.adicionarFracionado(vm.produto,produto,vm.origem);
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
		produtosSvc.removerFracionado(vm.produto,produto,vm.origem);
	};

	vm.toggleProduto = function(produto){
		if(produto.adicionado) {
			produto.adicionado = false;
			vm.removerProduto(produto);
		}else{
			produto.adicionado = true;
			vm.adicionarProduto(produto);
		}
	};

	 vm.ObterCategorias = function(){
		ws.ObterCategoria()
			.done(function(data){
				vm.categorias = angular.fromJson($(data).find('ObterCategoriaResult').text());
				vm.subCategoria = 0;
				$scope.$apply();
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
				vm.doSearch({ which: 13 });
				$scope.$apply();
			}).fail(function(error){
				console.log(error);
			});

	};

	vm.openBarCodeScanner = function(ev){
		funcoes.ScanBarCode(function(code){
			if(!code)
				return false;
			
			vm.termo = code;
			vm.doSearch({which:13});
		});
	};

	vm.ObterCategorias();
	$rootScope.backAction = '/opcoes/Hash/'  + vm.produto.$$hashKey + '/Origem/' + vm.origem;
	$rootScope.pageTitle = 'Busca Frac.';
}