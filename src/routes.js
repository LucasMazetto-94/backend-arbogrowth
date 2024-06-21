const express = require('express');
const router = express.Router();

const arboController = require('./controllers/arboControllers');

router.get('/clientes', arboController.buscarTodos);
router.get('/produtos', arboController.buscarTodosProdutos); 

module.exports = router;