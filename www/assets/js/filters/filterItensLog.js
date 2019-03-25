angular.module('app').filter('filterItensLog',[function(){
	return function(itens){
		var json = angular.fromJson(itens);
		json = _.map(json,function(item){
			if(json.length){
				_.each(json,function(item){
					if(item.liProdutoPrint){
						item.liProdutoPrint = [];
					}
				});
			}
			JSON.stringify(json);
			return item;
		});

		/*itens = _.map(itens,function(item){
			
			if(json.length){
				_.each(json,function(item){
					if(item.liProdutoPrint){
						item.liProdutoPrint = [];
					}
				});
			}
			JSON.stringify(json);
			return item;
		});*/
		return itens;
	};
}]);