angular.module("app").factory("seletorBalanca", ['toast', '$rootScope', 'config', function (toast, $rootScope, config) {
    var balancaSelecionada;
    return {
        criarBalanca: criarBalanca,
        iniciarBalanca: iniciarBalanca
    };
    //operacoes
    function criarBalanca(stBalanca) {
        switch (stBalanca) {
            case "FILIZOLA":
            case "FILIZOLA_NOVA":
                return new BalancaFilizola();
            case "TOLEDO":
            case "TOLEDOPRT5":
            case "TOLEDO_PRIX3":
                return new BalancaToledo();
            case "ELGIN":
                return new BalancaElgin();
            case "URANO_UDC202POP":
                return new BalancaUranoUdc20_2Pop();
            case "URANO_POPZ":
            case "URANO_US_POPS":
                return new BalancaUranoPopz();
            default:
                return null;
        }
    }
    function iniciarBalanca() {
        var self = this;
        document.addEventListener("deviceready", function () {
            if (config.microterminal.stBalanca.trim() == 'SEM BALANCA')
                return;

            balancaSelecionada = self.criarBalanca(config.microterminal.stBalanca.trim());
            var errorCallback = function (error) {
                alert("Não foi possível iniciar a comunicação com a balança configurada.");
            };
            serial.requestPermission(
                 function () {
                     serial.open(
                         { baudRate: 9600 },
                         function () {
                             app.serialPortIsOpen = true;
                             serial.registerReadCallback(
                                 function success(data) {
                                     clearTimeout(readingTimeout);
                                     readingTimeout = setTimeout(function () {
                                         $rootScope.$broadcast("pesoObtido", str);
                                         str = '';
                                     }, 1000);
                                     var view = new Uint8Array(data);
                                     if (view.length > 0) {
                                         for (i = 0; i < view.length; i++) {
                                             str += String.fromCharCode(view[i]);
                                         }
                                     }
                                 },
                                 errorCallback
                             );
                         },
                         errorCallback
                     );
                 },
                errorCallback
            );

        });
    }
    //classes
    function BalancaElgin() {
        this.obterPeso = function (peso) {
            //balança instável, em sobrecarca ou prato aliviado
            if (isNaN(parseInt(peso[2]))) {
                if (peso[2] == 'I')
                    toast.showCustomToast("Balança instável.");
                else if (peso[2] == 'S')
                    toast.showCustomToast("Balança em sobrecarga.");
                else if (peso[2] == 'N')
                    toast.showCustomToast("Prato sendo aliviado.");
                peso = 1;
            }
            else {
                //balança configurada com o protocolo 1010
                if (peso.length == 7) {
                    peso = parseInt(peso.substring(1, 6));
                }
                    //balança configurada com o protocolo 1410
                else if (peso.length == 22) {
                    peso = parseInt(peso.substring(2, 7));
                } else {
                    peso = 1;
                }
            }
            return peso === 0 ? 1 : peso;
        };

        this.enviarPreco = function (preco) {

        };
    }
    function BalancaToledo() {
        this.obterPeso = function (peso) {
            //balança instável, em sobrecarca ou prato aliviado
            if (isNaN(parseInt(peso[2]))) {
                if (peso[2] == 'I')
                    toast.showCustomToast("Balança instável.");
                else if (peso[2] == 'S')
                    toast.showCustomToast("Balança em sobrecarga.");
                else if (peso[2] == 'N')
                    toast.showCustomToast("Prato sendo aliviado.");
                peso = 1;
            }
            else {
                if (peso.length == 7) {
                    peso = parseInt(peso.substring(1, 6));
                }
            }
            return peso === 0 ? 1 : peso;
        };

        this.enviarPreco = function (preco) {

        };
    }
    function BalancaUranoPopz() {
        this.obterPeso = function (peso) {
            if (peso[2] == '2') {
                peso = parseInt(peso.substring(18, 24).trim().replace(",", ""));
            }
            else if (peso[2] == '3') {
                peso = parseInt(peso.substring(32, 38).trim().replace(",", ""));
            }
            else if (peso[2] == '4') {
                peso = parseInt(peso.substring(42, 48).trim().replace(",", ""));
            }
            return peso === 0 ? 1 : peso;
        };

        this.enviarPreco = function (preco) {
            //configura a string de preço
            var stPreco = preco.toFixed(2).toString().replace(/\D/g, '');
            stPreco = '000000' + stPreco;
            stPreco = stPreco.substring(stPreco.length - 6, stPreco.length);
            //soma os caracteres do preço
            var sum = 0;
            for (i = 0; i < stPreco.length; i++) {
                sum += stPreco.charCodeAt(i);
            }
            var byteMaior = (sum >> 8) & 0xFF;
            var byteMenor = (sum & 0xFF);
            stPreco = String.fromCharCode(7) + stPreco + String.fromCharCode(byteMaior) + String.fromCharCode(byteMenor) + String.fromCharCode(0x0D) + String.fromCharCode(0x0A);
            //envia o preço para a porta serial
            if (app.serialPortIsOpen) {
                serial.write(stPreco,
                    function (successMessage) {
                        console.log(successMessage);
                    },
                    function (error) {
                        console.log(error);
                    }
                );
            }
        };
    }
    function BalancaFilizola() {
        this.obterPeso = function (peso) {
            //balança instável, em sobrecarca ou prato aliviado
            if (isNaN(parseInt(peso[2]))) {
                if (peso[2] == 'I')
                    toast.showCustomToast("Balança instável.");
                else if (peso[2] == 'S')
                    toast.showCustomToast("Balança em sobrecarga.");
                else if (peso[2] == 'N')
                    toast.showCustomToast("Prato sendo aliviado.");
                peso = 1;
            }
            else {
                if (peso.length == 7) {
                    peso = parseInt(peso.substring(1, 6));
                }
            }
            return peso === 0 ? 1 : peso;
        };

        this.enviarPreco = function (preco) {

        };
    }
    function BalancaUranoUdc20_2Pop() {
        this.obterPeso = function (peso) {
            //balança instável, em sobrecarca ou prato aliviado
            if (peso.Length == 46) {
                peso = parseInt(peso.substring(31, 39).trim().replace(",", ""));
            }
            else if (DadosBalanca.Length == 69) {
                peso = parseInt(peso.substring(34, 42).trim().replace(",", ""));
            }
            return peso === 0 ? 1 : peso;
        };

        this.enviarPreco = function (preco) {

        };
    }
}]);