angular.module('app')
.factory('atendimentoMtService', [function () {
    var passoAtual;
    var comandaSelecionada;
    var tab;
    return {
        passoAtendimento: {
            operador: 'OPERADOR:',
            comanda: 'COMANDA:',
            mesa : 'MESA:',
            itens: 'COD. PRODUTO:'
        },
        setPassoAtual: function (passo) {
            passoAtual = passo;
        },
        getPassoAtual: function () {
            return passoAtual ? passoAtual : this.passoAtendimento.operador;
        },
        getComanda: function () {
            return comandaSelecionada;
        },
        setComanda: function (comanda) {
            comandaSelecionada = comanda;
        },
        setTab: function (tabSelecionada) {
            tab = tabSelecionada;
        },
        getTab: function () {
            return tab;
        }
    };
}]);