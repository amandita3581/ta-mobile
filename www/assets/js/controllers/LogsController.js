angular.module('app').controller('LogsController',['$location', '$anchorScroll', 'log', 'ws', 'config', 'funcoes', '$q', 'toast', LogsController]);

function LogsController($location, $anchorScroll, log, ws, config, funcoes, $q, toast){
	var vm = this;

	vm.limparLogs = function(){
		localStorage.setItem('logs',[]);
		vm.logs = [];
	};
	
	vm.exportar = function(){
		var promisses = [];
		if(window.cordova)
			promisses.push(log.ExportarLogDeRequisicoesArquivo());
		
		var logs = log.ObterLogs();
		promisses.push(funcoes.SalvarArquivoDeLog(config.ip, logs));
		
		$q.all(promisses)
		.then(
			function(values){
				toast.showCustomToast(values.join('<br />'));
			},
			function(erros){
				toast.showCustomToast(erros.join('<br />'));
			}
		);
		
		
	};
	
	function Replacer(key, value){
		if(value) value.liProdutoPrint = [];
  		return value;
	}
	
	var arrLogs = localStorage.getItem('logs');
	vm.logs = arrLogs ? angular.fromJson(arrLogs) : [];
	var logs = [];
	_.each(vm.logs,function(item){
		logs.push(angular.fromJson(item));
	});
	vm.logs = logs;
}