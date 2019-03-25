angular.module('app').filter('filterMaxValFracionado',[function(){
	return function(input){
		_.each(input,function(item){
			var valores = [];
			valores.push(item.vrUnitario);

			_.each(item.fracionados,function(fracionado){
				valores.push(fracionado.vrUnitario);
			});

			item.vrTotal = _.max(valores);
		});
		return input;
	};
}]);