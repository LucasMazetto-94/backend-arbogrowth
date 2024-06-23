const db = require('../db');
const path = require('path');
const uploadDir = path.join(__dirname, '..', 'uploads')

module.exports = {
    buscarTodos: () => {
        console.log('Chamou a função buscarTodos');
        return new Promise((aceito, rejeitado) => {
            console.log('Iniciando a Promise');
            db.query('SELECT id_cliente, nome, email FROM tb_clientes;', (error, results) => {
                console.log('Entrou no callback da query');
                if (error) {
                    console.error('Erro ao executar a query:', error);
                    rejeitado(error);
                    return;
                }
                console.log('Resultados da query:', results);
                aceito(results);
            });
        });
    },
    buscarTodosProdutos: () => {  // Adicione esta função
        console.log('Chamou a função buscarTodosProdutos');
        return new Promise((aceito, rejeitado) => {
            const sql = `
            SELECT 
                tp.id_produto, 
                tp.nome_produto, 
                tp.valor, 
                ttp.descricao 
            FROM 
                tb_produtos tp 
            LEFT JOIN 
                tb_tipo_produto ttp 
            ON 
                tp.id_tipo_produto = ttp.id_tipo_produto
                ;`
            console.log('Iniciando a Promise');
            db.query(sql, (error, results) => {
                console.log('Entrou no callback da query');
                if (error) {
                    console.error('Erro ao executar a query:', error);
                    rejeitado(error);
                    return;
                }
                console.log('Resultados da query:', results);
                aceito(results);
            });
            
        });   
    },
    buscarTodosPedidos: () => {
        console.log('Chamou a função buscarTodos');
        return new Promise((aceito, rejeitado) => {
            console.log('Iniciando a Promise');
            db.query(`SELECT 
                        tv.id_venda, 
                        tp.nome_produto AS nome_produto, 
                        tp.valor, 
                        tv.quantidade, 
                        tc.nome, 
                        (tv.quantidade * tp.valor) AS valor_pagamento
                    FROM 
                        tb_vendas tv
                    LEFT JOIN 
                        tb_produtos tp ON tp.id_produto = tv.id_produto
                    LEFT JOIN 
                        tb_clientes tc ON tc.id_cliente = tv.id_cliente;`, (error, results) => {
                console.log('Entrou no callback da query');
                if (error) {
                    console.error('Erro ao executar a query:', error);
                    rejeitado(error);
                    return;
                }
                console.log('Resultados da query:', results);
                aceito(results);
            });
        });
    },
    cadastrarCliente: async(nome, email, cep, bairro, rua, numero, senha) => {
        const id_tipo_usuario = 2;
        return new Promise((aceito, rejeitado) => {
            const sql = `INSERT INTO tb_clientes (nome, email, cep, bairro, rua, numero, id_tipo_usuario, senha)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?);`
            const values = [nome, email, cep, bairro, rua, numero, id_tipo_usuario, senha];
            db.query(sql, values, (error, results) => {
                if (error) {
                    rejeitado(error);
                    return
                }
                aceito(results)
            })
        })
    },
    criarProduto:(nome_produto, valor, id_tipo_produto, image) => {
        console.log(nome_produto, valor, id_tipo_produto, image)
        return new Promise((aceito, rejeitado) => {
            db.query('INSERT INTO tb_produtos (nome_produto, valor, id_tipo_produto, image) VALUES (?, ?, ?, ?)',
            [nome_produto, valor, id_tipo_produto, image],
            (error, result) => {
                if(error) {
                    rejeitado(error)
                    return
                } 
                aceito(result)
                
            }
        );
    });
}
};
