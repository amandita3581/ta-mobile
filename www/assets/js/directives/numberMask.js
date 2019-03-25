angular.module('app').directive('numberMask',[function(){
	return {
		require: 'ngModel',
		restrict: 'A',
		link: function(scope, elem, attrs, ngModel){
			  var toView = function (val) {
				if(val){
					val = val.replace(/\D\W\S/g,'*');
				}
				return val;
			  };
			  
			  var toModel = function (val) {
				return val;
			  };
			  
			  ngModel.$formatters.push(toView);
			  ngModel.$parsers.push(toModel);
		}
	};
}]);