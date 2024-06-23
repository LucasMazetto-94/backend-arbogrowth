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
    },
    buscarTodosPedidos: async (req, res) => {  // Adicione esta função
        try {
            console.log('Chamou o controlador buscarTodosProdutos');
            let responseJson = { error: '', result: [] };

            let pedidos = await arboService.buscarTodosPedidos();
            console.log('Resultados obtidos do serviço:', pedidos);

            pedidos.forEach(pedido => {
                responseJson.result.push({
                    id: pedido.id_venda,
                    nome: pedido.nome_produto,
                    descricao: pedido.valor,
                    categoria: pedido.quantidade,
                    cliente: pedido.nome,
                    total:pedido.valor_pagamento
                });
            });

            res.json(responseJson);
        } catch (error) {
            console.error('Erro ao buscar produtos:', error);
            res.status(500).json({ error: 'Erro interno ao buscar produtos', result: [] });
        }
    },
    cadastrarCliente: async (req, res) => {
        try {
            const {nome, email, cep, bairro, rua, numero, senha} = req.body;
            console.log('Dados recebidos:', req.body);

            if(!nome || !email || !cep || !bairro || !rua || !numero || !senha) {
                console.log('Dados faltando:', { nome, email, cep, bairro, rua, numero, senha });
                return res.status(400).json({error: 'Todos os campos são obrigatórios.'})
            }

            console.log('Todos os campos estão presentes.');
            await arboService.cadastrarCliente(nome, email, cep, bairro, rua, numero, senha);
            res.status(201).json({message: 'Cadastro realizado com sucesso'})
        } catch (error) {
            console.error('Erro ao cadastrar cliente:', error);
            res.status(500).json({error:'Erro interno ao cadastrar cliente'});
        }
    },
    criarProduto: async (req, res) => {
        console.log('entrou no controller')
        try {
        
            const { nome_produto, valor, id_tipo_produto } = req.body;
            const fileUrl = `http://localhost:${process.env.PORT}/uploads${req.file.filename}`;
            
            // Chama o serviço para criar o produto
           
            const result = await arboService.criarProduto(nome_produto, valor, id_tipo_produto, fileUrl);

            res.status(200).json({ message: 'Produto criado com sucesso', produto: result.insertId });
        } catch (error) {
            console.error('Erro ao criar produto:', error);
            res.status(500).json({ error: 'Erro ao criar produto' });
        }
    }

};
