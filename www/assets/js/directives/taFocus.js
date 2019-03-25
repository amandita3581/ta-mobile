angular.module('app').directive('taFocus',['$timeout', 'funcoes', '$cordovaStatusbar' ,function($timeout, funcoes, $cordovaStatusbar){
	return {
		restrict: 'AC',
		scope:{
			'inserirFoco': '=inserirFoco'
		},
		link: function(scope, element, attrs, controllers){
			element.focus(function(){
	  			element.val('');
				$cordovaStatusbar.overlaysWebView(false);
				$cordovaStatusbar.style(0);
				$cordovaStatusbar.hide();
	  		});
			
			element.blur(function(){
				if(window.cordova){
					funcoes.SetImmersiveMode();
					$cordovaStatusbar.overlaysWebView(false);
					$cordovaStatusbar.style(0);
					$cordovaStatusbar.hide();
					
				}
			});
			if(scope.inserirFoco) 
			{
			    if (scope.inserirFoco == "false")
			        return;
				$timeout(function(){
					$(function(){
						funcoes.SetFocus(element);
					});
				}, 800);
			
			}				
			
		},
	};
}]);