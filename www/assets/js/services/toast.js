angular.module('app').factory('toast',['ngToast','$rootScope',function(ngToast, $rootScope){
    return {
      showSuccessToast : function(){
          notificar('Dados gravados com sucesso!','zmdi zmdi-check-circle','success');
      },
      showLoginErrorToast : function(){
          notificar("Usuário ou senha inválido.",'zmdi zmdi-info-circle','info');
      },
      showServerErrorToast:function(){
        notificar('O servidor se comportou de maneira inesperada.','zmdi zmdi-alert-circle','danger');
      },
      showCustomToast:function(mensagem,icon,type){
          notificar(mensagem,icon,type);
      },
      showPedidoGravadoSucesso:function(){
          notificar('Pedido gravado com sucesso!','zmdi zmdi-check-circle','success');
      }
    };

    function notificar(message,icon,type){
      ngToast.create({
        className: 'info',
        content: '<span class="">' + message + '</span>',
        timeout: 2500
      });
    }
}]);
