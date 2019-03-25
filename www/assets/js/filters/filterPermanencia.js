//este filtro é utilizado para formatar o tempo de permanencia do cliente na mesa (nas telas de conta);
angular.module('app').filter('filterPermanencia',[function(funcoes){
	return function(input){
		var m = moment(input[0]);
		var now = moment(input[1]);
		var duration = moment.duration(now.diff(m));
		var data = duration._data;
		return data.days + 'd' + data.hours + 'h' + data.minutes + 'm';
	};
}]);