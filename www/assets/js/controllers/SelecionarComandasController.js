angular.module('app').controller('SelecionarComandasController',['$scope','pedido','$location', 'toast', SelecionarComandasController]);


function SelecionarComandasController($scope, pedido, $location, toast){
	var vm = this;
	var comandas = pedido.getComandas();
	
	vm.comandas = _.chain(comandas)
		.map(function(item){ return {selecionado:false, comanda: item}; })
		.sortBy('comanda')
		.value();
		
	vm.todasSelecionadas = false;


	vm.avancar = function(){
		var comandasSelecionadas = _.chain(vm.comandas)
			.filter(function(item){return item.selecionado !== false;})
			.map(function(item){ return item.comanda;})
			.value();
		if (!comandasSelecionadas || !comandasSelecionadas.length)
		    toast.showCustomToast('Nenhuma comanda selecionada para fechamento');
		else
		    $location.url('/conta/Comandas/' + angular.toJson(comandasSelecionadas));		    
	};
	
	vm.selecionarTodas = function(){
		_.each(vm.comandas,function(item){
			vm.comandasSelecionadas.push(item);
		});
	};
	
	$scope.$watch('selComCtrl.todasSelecionadas',function(newValue,oldValue,scope){
		_.each(vm.comandas,function(item){
			item.selecionado = newValue;
		});
	});
}