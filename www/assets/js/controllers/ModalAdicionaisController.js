angular.module('app').controller('ModalAdicionaisController', ['$scope', 'produtos', '$element', 'produto', 'close', ModalAdicionaisController]);

function ModalAdicionaisController($scope, produtos, $element, produto, close) {  
    $scope.produto = produto
    if (!$scope.produto.adicionais)
        produtos.getAdicionais($scope.produto);

    $scope.close = function (code, delay) {
        $element.off('hidden.bs.modal');
        $(".modal-backdrop").off().remove();
        close(code, delay);
    };
}