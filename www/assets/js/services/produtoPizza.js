angular.module('app').factory('produtoPizza', ['config', function (config) {
    var produtoPizza = {
        ObterTotalPizza: function (item) {
            if (config.configuracao.flPizzaMeioMeio)
                produtoPizza.ObterMaiorValorPizza(item);
            else
                produtoPizza.ObterValorPizzaPelaMedia(item);
        },
        ObterMaiorValorPizza: function (item) {
            if (item.fracionados && item.fracionados.length > 0)
            {
                var pizzaMaiorValor = _.max(item.fracionados, function (fracionado) {
                    return fracionado.vrUnitario;
                });
                if (pizzaMaiorValor.vrUnitario > item.vrUnitario)
                    item.vrPizza = pizzaMaiorValor.vrUnitario;
            }
        },
        ObterValorPizzaPelaMedia: function (item) {
            if (item.fracionados && item.fracionados.length > 0)
            {
                var soma = item.vrUnitario;
                _.each(item.fracionados, function (fracionado) {
                    soma += fracionado.vrUnitario;
                });
                var media = soma / (item.fracionados.length + 1) // + 1 porque inclui o item principal
                item.vrPizza = produtoPizza.ObterValorDecimalTruncado(media, 2);
            }
        },
        ObterValorDecimalTruncado: function (valorDecimal, casasDecimais) {
            var strMedia = valorDecimal.toString();
            var strTruncada = '';
            if (strMedia.indexOf('.') > 0) {
                strTruncada = strMedia.substr(0, (strMedia.indexOf('.') + 1) + casasDecimais); // + 1 porque inclui o ponto
            }
            else {
                strTruncada = strMedia;
            }
            return parseFloat(strTruncada);
        }
    };

    return produtoPizza;
}]);