const db = require('../db');

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
    }
};

