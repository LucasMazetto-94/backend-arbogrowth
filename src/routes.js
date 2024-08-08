const express = require("express");
const router = express.Router();
const arboController = require("./controllers/arboControllers");
const upload = require("../src/uploadConfig");
const { verifyToken } = require("./services/Functions");

router.get("/produtos", arboController.buscarTodosProdutos);
router.get("/pedidos", verifyToken, arboController.buscarTodosPedidos);
router.get("/tipo_produto", arboController.buscarTipoProduto);
router.post("/cadastro_venda", arboController.cadastrarVenda);
router.post(
  "/cadastro_produtos",
  verifyToken,
  upload.single("photo"),
  arboController.criarProduto
);
router.post("/calcular_frete", arboController.calcularFrete);
router.post("/gerar_pix", arboController.gerarPix);
router.post("/create_preference", arboController.processPayment);
router.post("/update_rastreio", arboController.enviarRastreio);
router.post("/register", arboController.registerAdmin);
router.post("/login", arboController.loginAdmin);

module.exports = router;
