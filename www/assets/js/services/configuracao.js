angular.module('app').factory('configuracao', ['config',function (config) {
	return {
		setConfig:function(key, value){
			config[key] = value;
		},
		getConfig:function(key){
			return config[key];
		},
		saveConfigToLocalStorage:function(key, value){
			localStorage.setItem(key,value);
		},
		getConfigFromLocalStorage: function(key){
			return localStorage.getItem(key);
		}
	};
}]);