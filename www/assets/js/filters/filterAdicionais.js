angular.module('app').filter('filterAdicionais',[function(){
	return function(input){
		var out = [];
		_.each(input,function(item){
			if(item.flAdicionado != 2){
				out.push(item);
			}
		});
		return out;
	};
}]);