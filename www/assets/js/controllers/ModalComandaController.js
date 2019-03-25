angular.module("app").controller("ModalComandaController", ['$scope', '$element', 'close', 'funcoes', 'config', 'toast', function ($scope, $element, close, funcoes, config, toast) {
    $scope.config = config;
    console.log($scope.config);
    $scope.comanda = "";
    $scope.close = function (code, delay) {
        $element.off('hidden.bs.modal');
        $(".modal-backdrop").off().remove();
        close(code, delay);
    };

    $scope.openBarCodeScanner = function () {
        funcoes.ScanBarCode(function (code) {
            if (!code)
                return false;
            $scope.close(code, 500);
        });
    };

    $scope.addComanda = function () {
        $scope.close($scope.comanda, 500);
    };


    $scope.addComandaKeyUp = function ($event) {
        if ($event.which == 13) {
                $scope.close($scope.comanda, 500);
        }
    };
}]);