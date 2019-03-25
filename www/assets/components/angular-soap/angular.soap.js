angular.module('angularSoap', [])

.factory("$soap",['$q',function($q){
	return {
		post: function(url, action, params){
			var defer = $q.defer();
			
			//Create SOAPClientParameters
			var soapParams = new SOAPClientParameters();
			for(var param in params){
				soapParams.add(param, params[param]);
			}
			
			//Create Callback
			var soapCallback = function(e){
				if(e.constructor.toString().indexOf("function Error()") != -1){
					defer.reject("An error has occurred.");
				} else {
					defer.resolve(e);
				}
			}
			
			SOAPClient.invoke(url, action, soapParams, true, soapCallback);

			return defer.promise;
		},
		setCredentials: function(username, password){
			SOAPClient.username = username;
			SOAPClient.password = password;
		}
	}
}]);
