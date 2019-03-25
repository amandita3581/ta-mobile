angular.module('app').factory('log',['$cordovaFile', 'toast', 'config', '$cordovaFileTransfer', '$q', function($cordovaFile, toast, config, $cordovaFileTransfer, $q){
	return {
		GerarLogDeObjeto:function(objLog){
			var now = moment().format("DD/MM/YYYY - hh:mm:ss");
			var obj = {
				data : now,
				type : 'object',
				text : objLog
			};
			this.GravaLog(angular.toJson(obj));
		},
		ExportarLogDeRequisicoesArquivo: function(){
			var deferred = $q.defer();
			
			var jsonLogs = this.ObterLogs();
			var now = moment().format("DD-MM-YYYY__hh-mm-ss");
			var filename = "log_ta_" + now + ".txt";
			$cordovaFile.writeFile(cordova.file.externalRootDirectory, filename, jsonLogs, true)
			.then(function (success) {
				deferred.resolve('Arquivo gerado com sucesso em ' + cordova.file.externalRootDirectory);
			}, function (error) {
				deferred.reject('Ocorreu um problema ao gerar o arquivo :<br />' + error);
			});
			
			return deferred.promise;
		},
		GerarLogDeString:function(strLog){
			var now = moment().format("DD/MM/YYYY - hh:mm:ss");
			var objLog = {};
			objLog.data = now;
			objLog.type = 'string';
			objLog.text = strLog;
			this.GravaLog(objLog);
		},
		GravaLog: function(log){
			var arrLogs = localStorage.getItem('logs');
			if(arrLogs){
				arrLogs = angular.fromJson(arrLogs);
				if(arrLogs.length >= 20){
					arrLogs.shift();
				}
			}
			else{
				arrLogs = [];
			}
			arrLogs.push(log);
			localStorage.setItem('logs', angular.toJson(arrLogs));
		},
		ObterLogs: function(){
			var jsonLogs = angular.fromJson(localStorage.getItem('logs'));
			jsonLogs = _.map(jsonLogs,function(item){
				item = angular.fromJson(item);
				//se a propriedade response do item não for um json, loga o proprio item.
				var resp = '';
				try{
					resp = angular.fromJson(item.text.response.response);
				}catch (err){
					resp = item.text.response.response;
				}
				item.text.response.response = resp;
				return item;
			});
			return jsonLogs;
		}
	};	
}]);