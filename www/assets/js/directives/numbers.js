angular.module('app').directive('numbers',['funcoes', function(funcoes){
	return {
		restrict: 'AC',
		link: function(scope, element, attrs, controllers){
			element.on('keypress',function(e){

				var chars = [ 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 13, 10, 27, 8 ];
	            var charsFloat = [ 44 , 46];
	            if(element.hasClass('decimal')){
	                chars = _.union(chars, charsFloat);
	            }

	            var cod = e.which || e.keycode || 0;
	            var val = element.val().toString();

	            if (!_.contains(chars, cod)) {
	                return false;
	            } else {
	                if (val < 0) {
	                    element.val(0);
	                }
	                return true;
	            }

			}).on('blur', function () {
				val = element.val();
		        if (val < 0.001 || !val || val === '') {
		        	if(element.hasClass('set-default')){
		            	element.val(1);
		            }
		            
		        } else {
		            element.val(val);
		        }

		        element.trigger('input');
		        setTimeout(function () {
		                scope.$apply();
		            }, 100);
		    });
			
		}
	};
}]);