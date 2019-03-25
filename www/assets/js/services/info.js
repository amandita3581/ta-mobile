angular.module('app').factory('info',['$rootScope', '$cordovaDevice', function($rootScope, $cordovaDevice){
	var info = {};
	document.addEventListener("deviceready", function () {
		info.cordova = $cordovaDevice.getCordova();
		info.model = $cordovaDevice.getModel();
		info.platform = $cordovaDevice.getPlatform();
		info.uuid = $cordovaDevice.getUUID();
		info.version = $cordovaDevice.getVersion();
		info.manufacturer = $cordovaDevice.getManufacturer();
		info.name = $cordovaDevice.getName();
		deviceReport.getDeviceReport(
			function(data){
				info.architecture = data.architecture;
				info.cpuSummary = data.cpuSummary;
				info.cpuabi = data.cpuabi;
				info.cpuabi2 = data.cpuabi2;
				$rootScope.$broadcast('getInfoSuccess');
			},
			function(err){
				console.log(err);
			}
		);
	}, false);
	return info;
}]);