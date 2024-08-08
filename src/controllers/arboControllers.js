const arboService = require("../services/arboService");
const axios = require("axios");
const { QrCodePix } = require("qrcode-pix");
const QRCode = require("qrcode");
const { Payment, MercadoPagoConfig } = require("mercadopago");
const { v4: uuidv4 } = require("uuid");
const { sendEmailCompra, getToken } = require("../services/Functions");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { JWT_SECRET } = process.env;

const ACESS_TOKEN =
  "TEST-4120917113900503-072022-ceb22a25e76564c7fc3dc4d180b2b766-1480467455";

const client = new MercadoPagoConfig({
  accessToken: ACESS_TOKEN,
  options: { timeout: 10000 },
});

module.exports = {
  buscarTodosProdutos: async (req, res) => {
    // Adicione esta função
    try {
      let responseJson = { error: "", result: [] };

      let produtos = await arboService.buscarTodosProdutos();

      produtos.forEach((produto) => {
        responseJson.result.push({
          id: produto.id_produto,
          nome: produto.nome_produto,
          valor: produto.valor,
          categoria: produto.descricao,
          imagem: produto.image,
          largura: produto.largura,
          altura: produto.altura,
          comprimento: produto.comprimento,
          peso: produto.peso,
        });
      });

      res.json(responseJson);
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      res
        .status(500)
        .json({ error: "Erro interno ao buscar produtos", result: [] });
    }
  },
  buscarTipoProduto: async (req, res) => {
    // Adicione esta função
    try {
      let responseJson = { error: "", result: [] };

      let tipoProduto = await arboService.buscarTipoProduto();

      tipoProduto.forEach((item) => {
        responseJson.result.push({
          id: item.id_tipo_produto,
          nome: item.descricao,
        });
      });

      res.json(responseJson);
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      res
        .status(500)
        .json({ error: "Erro interno ao buscar produtos", result: [] });
    }
  },
  buscarTodosPedidos: async (req, res) => {
    try {
      let responseJson = { error: "", result: [] };

      let pedidos = await arboService.buscarTodosPedidos();

      pedidos.forEach((pedido) => {
        responseJson.result.push(pedido);
      });

      res.json(responseJson);
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error);
      res
        .status(500)
        .json({ error: "Erro interno ao buscar pedidos", result: [] });
    }
  },
  cadastrarVenda: async (req, res) => {
    try {
      const { carrinho, total, shipping, nome } = req.body;

      if (!carrinho || !Array.isArray(carrinho) || carrinho.length === 0) {
        return res.status(400).json({ error: "Carrinho vazio ou inválido." });
      }

      const valor_total = total;

      await arboService.cadastrarVenda(carrinho, valor_total, shipping, nome);
      sendEmailCompra(
        shipping.to.email,
        shipping.to.name,
        shipping.to.postal_code,
        valor_total
      );
      res.status(201).json({ message: "Compra realizada com sucesso" });
    } catch (error) {
      console.error("Erro ao finalizar a compra:", error);
      res.status(500).json({ error: "Erro interno ao realizar compra" });
    }
  },
  criarProduto: async (req, res) => {
    try {
      const {
        nome_produto,
        valor,
        id_tipo_produto,
        altura,
        largura,
        comprimento,
        peso,
      } = req.body;
      const fileUrl = `http://localhost:${process.env.PORT}/uploads/${req.file.filename}`;

      // Chama o serviço para criar o produto
      const result = await arboService.criarProduto(
        nome_produto,
        valor,
        id_tipo_produto,
        altura,
        largura,
        comprimento,
        peso,
        fileUrl
      );

      res.status(200).json({
        message: "Produto criado com sucesso",
        produto: result.insertId,
      });
    } catch (error) {
      console.error("Erro ao criar produto:", error);
      res.status(500).json({ error: "Erro ao criar produto" });
    }
  },
  enviarRastreio: async (req, res) => {
    try {
      const { codigo_rastreio, id_entrega } = req.body;

      // Chama o serviço enviar codigo de rastreio
      const result = await arboService.enviar_rastreio(
        codigo_rastreio,
        id_entrega
      );

      res.status(200).json({
        message: "Código de rastreio enviado com sucesso",
        produto: result.insertId,
      });
    } catch (error) {
      console.error("Erro ao enviar código, tente novamente mais tarde", error);
      res
        .status(500)
        .json({ error: "Erro ao enviar código, tente novamente mais tarde" });
    }
  },
  calcularFrete: async (req, res) => {
    const { cepDestino, produtos } = req.body;

    const tokenData = await getToken();
    const accessToken = tokenData.access_token;

    const token = accessToken;
    const cepOrigem = process.env.CEP_ORIGEM;

    let totalDimensions = {
      peso: 0,
      largura: 0,
      altura: 0,
      comprimento: 0,
    };
    produtos.forEach((produto) => {
      totalDimensions.peso += produto.peso * produto.quantity + 0.5;
      totalDimensions.largura += produto.largura * produto.quantity + 5;
      totalDimensions.altura += produto.altura;
      totalDimensions.comprimento += produto.comprimento * produto.quantity + 5;
    });
    const payload = {
      from: {
        postal_code: cepOrigem,
      },
      to: {
        postal_code: cepDestino,
      },
      package: {
        width: totalDimensions.largura,
        height: totalDimensions.altura,
        length: totalDimensions.comprimento,
        weight: totalDimensions.peso,
      },
    };
    try {
      const response = await axios.post(
        "https://sandbox.melhorenvio.com.br/api/v2/me/shipment/calculate",
        payload,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "User-Agent": "arbogrowth (lucas.brabes@terra.com.br)",
          },
        }
      );

      res.status(200).json(response.data);
    } catch (error) {
      console.error(
        "Erro ao calcular frete:",
        error.response ? error.response.data : error.message
      );
      res.status(500).json({ error: "Erro ao calcular frete" });
    }
  },
  gerarPix: async (req, res) => {
    const { nome, valor } = req.body;
    try {
      const pix = QrCodePix({
        version: "01",
        key: "19991939339",
        name: nome,
        city: "São Paulo",
        message: "Pagamento teste",
        value: valor,
      });
      const meuPix = pix.payload();
      const qrCodeBase64 = await QRCode.toDataURL(meuPix);

      res.json({
        qrCode: qrCodeBase64,
        code: meuPix,
      });
    } catch (error) {
      console.error("Erro ao gerar pix:", error);
      res.status(500).json({ error: "Erro interno ao gerar pix", result: [] });
    }
  },
  processPayment: async (req, res) => {
    const payment = new Payment(client);
    const idempotencyKey = uuidv4();

    const body = {
      transaction_amount: req.body.transaction_amount,
      token: req.body.token,
      description: req.body.description,
      installments: req.body.installments,
      payment_method_id: req.body.payment_method_id,
      issuer_id: req.body.issuer_id,
      payer: {
        email: req.body.payer.email,
        identification: {
          type: req.body.payer.identification.type,
          number: req.body.payer.identification.number,
        },
      },
    };
    console.log(body.transaction_amount);

    try {
      const result = await payment.create({
        body,
        requestOptions: { idempotencyKey: String(idempotencyKey) },
      });

      res.status(200).json(result.status); // Enviando o resultado de volta para o frontend
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error", details: error });
    }
  },
  registerAdmin: async (req, res) => {
    try {
      const { email, senha } = req.body;

      if (!email || !senha) {
        return res
          .status(400)
          .json({ error: "Email e senha são obrigatórios" });
      }

      // Chama o serviço para criar o produto
      await arboService.registrarAdmin(email, senha);

      res.status(200).json({
        message: "Administrador adicionado à lista",
      });
    } catch (error) {
      console.error("Erro ao criar um novo administrador:", error);
      res.status(500).json({ error: "Erro ao criar um novo administrador" });
    }
  },
  loginAdmin: async (req, res) => {
    console.log("bateu no backend");
    try {
      const { email, senha } = req.body;

      if (!email || !senha) {
        return res
          .status(400)
          .json({ error: "Email e senha são obrigatórios" });
      }

      // Chama o serviço para buscar o administrador pelo e-mail
      const admin = await arboService.buscarAdminPorEmail(email);

      if (!admin) {
        return res.status(401).json({ error: "Credenciais inválidas" });
      }

      // Compara a senha fornecida com a senha armazenada
      const match = await bcrypt.compare(senha, admin.senha);

      if (!match) {
        return res.status(401).json({ error: "Credenciais inválidas" });
      }
      console.log(JWT_SECRET);
      // Gera um token JWT
      const token = jwt.sign(
        { id: admin.id_admin, email: admin.email },
        JWT_SECRET,
        {
          expiresIn: "1h",
        }
      );
      console.log(token);

      res.status(200).json({
        message: "Login bem-sucedido",
        token,
      });
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      res.status(500).json({ error: "Erro ao fazer login" });
    }
  },
};
