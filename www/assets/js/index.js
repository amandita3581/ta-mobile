/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var str = '';
var readingTimeout;

var app = {
    serialPortIsOpen: false,
    initialize: function() {
        app.bindEvents();
    },
    bindEvents: function() {
        document.addEventListener('deviceready', app.onDeviceReady, false);
    },
    onDeviceReady: function () {
        angular.bootstrap(document, ['app']);
		$(document).on('exitApp',ExitApp);
        $(document).on('backbutton', function (e) {
            e.preventDefault();
            $(document).trigger('exitApp',[true]);
		});
    }
};

app.initialize();


function ExitApp(event, flConfirmar) {
    var $rootScope = angular.element(document.body).injector().get('$rootScope');
    if ($rootScope.BarcodeScanerOpen)
        return false;

    var exit = true;
    if (flConfirmar)
        exit = confirm('Deseja sair do aplicativo?');

    if(exit){
        var pedido = angular.element(document.body).injector().get('pedido');
        var ws = angular.element(document.body).injector().get('ws');
        var toast = angular.element(document.body).injector().get('toast');
        var $location = angular.element(document.body).injector().get('$location');
        var config = angular.element(document.body).injector().get('config');
        if (config.apiUrl)
            ws.LiberandoAtendimento();
		pedido.limparPedido();
		if(window.cordova)
			navigator.app.exitApp();
		else
			$location.url('/');
    }
}


$(function(){
    moment.locale('pt-br');
    $(document).on('hide.bs.modal', '#modalAuth', function (e) {
        setTimeout(function () {
            angular.element("#txtUsuarioAuth").val('');
            angular.element("#txtSenhaAuth").val('');
            var $rootScope = angular.element(document.body).injector().get('$rootScope');
            $rootScope.modalAberta = false;
            $('#modalAuth #entrar').unbind('click');
        }, 500);
       
    }).on('shown.bs.modal', '#modalAuth', function (e) {
		var funcoes = angular.element(document.body).injector().get('funcoes');
		funcoes.SetFocus($("#txtUsuarioAuth"));
		var $rootScope = angular.element(document.body).injector().get('$rootScope');
		$rootScope.modalAberta = true;
    });
	
	$(document).on('hide.bs.modal', '#modalInformarValor', function (e) {
        setTimeout(function () {
            angular.element("#vrProduto").val('');
            var $rootScope = angular.element(document.body).injector().get('$rootScope');
            $rootScope.modalAberta = false;
        }, 500);
       
    }).on('shown.bs.modal', '#modalInformarValor', function (e) {
			var funcoes = angular.element(document.body).injector().get('funcoes');
			funcoes.SetFocus($('#vrProduto'));
			var $rootScope = angular.element(document.body).injector().get('$rootScope');
			$rootScope.modalAberta = true;
    });
});