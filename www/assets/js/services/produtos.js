angular.module('app').factory('produtos', ['ws', '$rootScope', 'toast', '$q', 'funcoes', '$filter', 'config', 'seletorBalanca',
    function (ws, $rootScope, toast, $q, funcoes, $filter, config, seletorBalanca) {
        var _produtos = [];
        var _produtosBusca = [];
        var _produtosFracionados = [];
        var _ultimoProdutoSelecionado;
        produtosFactory = {
            buscar: function (termo, categoria, subcategoria, isFracionado) {
                var term = parseInt(termo);
                var codigo = 0;
                var prod = '';
                if (term) {
                    codigo = termo;
                } else {
                    prod = termo;
                }

                var numeroItens = config.localConfig.itensLista || 20;
                var modoPesquisa = config.localConfig.modoPesquisa || false;

                return ws.ObterProduto(prod, codigo, categoria, subcategoria, isFracionado, numeroItens, modoPesquisa);
            },
            adicionarProduto: function (produto) {
                var deferred = $q.defer();
                var prod = produto;
                if (prod.flRequererItemAdicional) {
                    if (!prod.adicionais) this.getAdicionais(prod);
                }
                if (prod.idTipoProduto === 3) {
                    if (!prod.fracionados) prod.fracionados = [];
                }                

                if (prod.idTipoProduto === 2) {
                    $('#modalInformarValor').modal('show');
                    $('#modalInformarValor #addValor').click(function () {
                        var valor = $("#vrProduto").val();
                        if (valor === null) {
                            deferred.reject("O valor do produto nao pode ser nulo");
                        }
                        else if (!valor.match(/^[0-9]+([\.|\,]([0-9]{1,2})?)?$/)) {
                            deferred.reject("Valor invalido.");
                        } else {
                            valor = valor.replace(/\,/g, '.');
                            valor = parseFloat(valor);
                            prod.vrUnitario = valor;
                            flValorInformado = true;
                            prod.adicionado = produto.adicionado = true;
                            if (!prod.observacoes)
                                prod.observacoes = '';
                            _produtos.push(prod);
                            if (prod.flFracionado) {
                                if (config.microterminal.stBalanca.trim() !== 'SEM BALANCA') {
                                    if (app.serialPortIsOpen) {
                                        serial.writeHex("05",
                                            function (successMessage) {
                                                console.log(successMessage);
                                            },
                                            function (error) {
                                                console.log(error);
                                            }
                                        );
                                    }
                                }
                            }
                            deferred.resolve(prod);
                        }
                        $('#modalInformarValor').modal('hide');
                        $('#modalInformarValor #addValor').off();
                        $("#vrProduto").val('');
                    });

                } else {
                    prod.adicionado = produto.adicionado = true;
                    if (!prod.observacoes)
                        prod.observacoes = '';
                    _produtos.push(prod);
                    deferred.resolve(prod);
                }
                return deferred.promise;
            },
            adicionarFracionado: function (produto, itemFracionado, tipo) {
                var prod = this.getProdutoByHash(produto.$$hashKey, tipo);
                if (!prod.fracionados) prod.fracionados = [];
                prod.fracionados.push(itemFracionado);
            },
            obterQuantidadeParaItemFracionado : function (prod) {
                if (prod.flFracionado) {
                    if (config.microterminal.stBalanca.trim() !== 'SEM BALANCA') {
                        if (app.serialPortIsOpen) {
                            serial.writeHex("05",
                                function (successMessage) {
                                    console.log(successMessage);
                                },
                                function (error) {
                                    console.log(error);
                                }
                            );
                        }
                    }
                }
            },
            limparProdutos: function () {
                _produtos = [];
            },
            limparBuscaProdutos: function () {
                _produtosBusca = [];
            },
            removerProduto: function (produto) {
                _produtos = _produtos.filter(function (item) {
                    if (item.idProduto !== produto.idProduto) {
                        return item;
                    }
                });
                produto.adicionado = false;
            },
            removerSelecionados: function () {
                _produtos = _produtos.filter(function (item) {
                    if (!item.selecionado) {
                        return item;
                    }
                });
            },
            removerFracionado: function (produto, produtoFracionado, origem) {
                var prod = this.getProdutoByHash(produto.$$hashKey, origem);
                prod.fracionados = prod.fracionados.filter(function (item) {
                    if (item.idProduto !== produtoFracionado.idProduto) {
                        return item;
                    }
                });
            },
            removerFracionadosSelecionados: function (produto, tipo) {
                var prod = this.getProdutoByHash(produto.$$hashKey, tipo);
                prod.fracionados = prod.fracionados.filter(function (item) {
                    if (!item.selecionado) {
                        return item;
                    }
                });
            },
            getProdutos: function () {
                return _produtos;
            },
            getProdutoById: function (id, tipo) {
                var prod = tipo === 'editar' ? _produtos : _produtosBusca;
                prod = prod.filter(function (item) {
                    if (item.idProduto === id) {
                        return item;
                    }
                });
                return prod[0];
            },
            getProdutoByHash: function(hash, tipo){
                var prod = tipo === 'editar' ? _produtos : _produtosBusca;
                prod = prod.filter(function (item) {
                    if (item.$$hashKey === hash) {
                        return item;
                    }
                });
                return prod[0];
            },
            getAdicionais: function (produto) {
                ws.ObterProdutoAdicional(produto.idGrupoAdicional)
                .done(function (data) {
                    var adicionais = angular.fromJson($(data).find('ObterProdutoAdicionalResult').text());
                    if (adicionais.length) {
                        produto.adicionais = adicionais;
                        produto.adicionais.map(function (item) {
                            item.flAdicionado = 2;
                            return item;
                        });
                    }
                })
                .fail(function (error) {
                    console.log(error);
                });
            },
            setProdutosBusca: function (produtos) {
                _produtosBusca = produtos;
            },
            getProdutosBusca: function () {
                return _produtosBusca;
            },
            obterProdutosArray: function (array) {
                return ws.ObterProdutoArray(array);
            },
            mapListaProdutos: function (docXml, strResult, quantidade) {
                var prod = angular.fromJson($(docXml).find(strResult).text());
                if (prod.length) {
                    prod = _.map(prod, function (item) {
                        return {
                            "idProduto": item.idProduto,
                            "stProdutoAbreviado": item.stProdutoAbreviado,
                            "vrUnitario": item.vrUnitario,
                            "idTipoProduto": item.idTipoProduto,
                            "flRequererItemAdicional": item.flRequererItemAdicional,
                            "idGrupoAdicional": item.idGrupoAdicional,
                            "flFracionado": item.flFracionado,
                            "stMedida": item.stMedida,
                            "idCodigo": item.idCodigo,
                            "qt": quantidade || 1
                        };
                    });
                    return prod;
                }
                return [];
            },
            obterPesoProduto: function (peso) {
                var stBalanca = config.microterminal.stBalanca;
                var balanca = seletorBalanca.criarBalanca(stBalanca);
                if (balanca === null)
                    peso = 1;
                else
                    peso = balanca.obterPeso(peso);
                return peso;
            },
            enviarPrecoBalanca: function (preco) {
                var stBalanca = config.microterminal.stBalanca;
                var balanca = seletorBalanca.criarBalanca(stBalanca);
                if (balanca !== null)
                    balanca.enviarPreco(preco);
            },
            setUltimoProdutoSelecionado: function(produto){
                _ultimoProdutoSelecionado = produto;
            },
            getUltimoProdutoSelecionado: function(){
                return _ultimoProdutoSelecionado;
            }
        };

        $rootScope.$on("pesoObtido", function (event, peso) {
            peso = produtosFactory.obterPesoProduto(peso);
            produto = produtosFactory.getUltimoProdutoSelecionado();
            produto.qt = parseInt(peso);
            produtosFactory.enviarPrecoBalanca(produto.vrUnitario);
            $rootScope.$broadcast("atualizarListaDeProdutos");
        });
        return produtosFactory;
    }]);
