const express = require('express');
const router = express.Router();

const arboController = require('./controllers/arboControllers');

router.get('/clientes', arboController.buscarTodos);
router.get('/produtos', arboController.buscarTodosProdutos);
router.get('/pedidos', arboController.buscarTodosPedidos); 
router.post('/cadastro_cliente', arboController.cadastrarCliente);


module.exports = router;