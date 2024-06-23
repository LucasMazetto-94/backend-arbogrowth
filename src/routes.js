const express = require('express');
const router = express.Router();
const arboController = require('./controllers/arboControllers');
const upload = require('../src/uploadConfig')

router.get('/clientes', arboController.buscarTodos);
router.get('/produtos', arboController.buscarTodosProdutos);
router.get('/pedidos', arboController.buscarTodosPedidos); 
router.post('/cadastro_cliente', arboController.cadastrarCliente);
router.post('/cadastro_produtos', upload.single('photo'), arboController.criarProduto);


module.exports = router;