const arboService = require('../services/arboService');

module.exports = {
    buscarTodos: async (req, res) => {
        try {
            console.log('Chamou o controlador buscarTodos');
            let responseJson = { error: '', result: [] };

            let clientes = await arboService.buscarTodos();
            console.log('Resultados obtidos do serviço:', clientes);

            clientes.forEach(cliente => {
                responseJson.result.push({
                    codigo: cliente.id_cliente,
                    nome: cliente.nome,
                    email: cliente.email
                });
            });

            res.json(responseJson);
        } catch (error) {
            console.error('Erro ao buscar clientes:', error);
            res.status(500).json({ error: 'Erro interno ao buscar clientes', result: [] });
        }
    },

    buscarTodosProdutos: async (req, res) => {  // Adicione esta função
        try {
            console.log('Chamou o controlador buscarTodosProdutos');
            let responseJson = { error: '', result: [] };

            let produtos = await arboService.buscarTodosProdutos();
            console.log('Resultados obtidos do serviço:', produtos);

            produtos.forEach(produto => {
                responseJson.result.push({
                    id: produto.id_produtos,
                    nome: produto.nome_produto,
                    descricao: produto.valor,
                    categoria: produto.descricao
                });
            });

            res.json(responseJson);
        } catch (error) {
            console.error('Erro ao buscar produtos:', error);
            res.status(500).json({ error: 'Erro interno ao buscar produtos', result: [] });
        }
    }
};
