(function(){
'use strict';
angular.module('numericKeyboard', []);
angular.module('numericKeyboard').directive('numericKeyboard', ['numericKeyboardService', '$rootScope', numericKeyboard]);

function numericKeyboard(numericKeyboardService, $rootScope){
	return{
		restrict: 'E',
		require: '',
		scope: {},
		templateUrl: 'templates/tecladoVirtual.html',
		link: function(scope){
			scope.numericService = numericKeyboardService;

			scope.append = function(key){
				scope.numericService.append(key);
			};

			scope.done = function(){
				scope.numericService.done();
			};
			
			scope.close = function(){
				scope.numericService.done();
				scope.isOpen = false;
			};
			scope.stopPropagation = function(event){
				event.stopPropagation();
			};  
			scope.backSpace = function () {
				scope.numericService.backSpace();
			};
			scope.clear = function () {
			    scope.numericService.clear();
			};
			scope.enter = function () {
			    scope.numericService.enter();
			};
			scope.back = function (event) {
			    scope.numericService.back();
			};
			scope.search = function (event) {
			    event.preventDefault();
			    scope.numericService.search();
			};					
			scope.favorites = function (event) {
			    event.preventDefault();
			    scope.numericService.favorites();
			};
			scope.transfer = function (event) {
			    event.preventDefault();
			    scope.numericService.transfer();
			};
			scope.getAccount = function (event) {
			    event.preventDefault();
			    scope.numericService.getAccount();
			};
			scope.$watch('numericService.isOpened()', function(){
				scope.isOpen = scope.numericService.isOpened();
			}, true);
		}
	};
}
})();

