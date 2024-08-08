const axios = require("axios");
const nodemailer = require("nodemailer");
const db = require("../db");
const cron = require("node-cron");
const jwt = require("jsonwebtoken");

async function criarPedidoMelhorEnvio(carrinho, shipping, total, nome) {
  const produtos = carrinho.map((item) => ({
    name: item.name,
    quantity: item.quantity,
    unitary_value: item.valor,
  }));

  console.log(nome);

  const volumes =
    nome === "Correios"
      ? [
          {
            height: carrinho.reduce(
              (acc, item) => acc + item.altura * item.quantity,
              0
            ),
            width: carrinho.reduce(
              (acc, item) => acc + item.largura * item.quantity,
              0
            ),
            length: carrinho.reduce(
              (acc, item) => acc + item.comprimento * item.quantity,
              0
            ),
            weight: carrinho.reduce(
              (acc, item) => acc + item.peso * item.quantity,
              0
            ),
          },
        ]
      : carrinho.map((item) => ({
          height: item.altura,
          width:
            item.quantity > 1 ? item.largura * item.quantity : item.largura,
          length:
            item.quantity > 1
              ? item.comprimento * item.quantity
              : item.comprimento,
          weight: item.quantity > 1 ? item.peso * item.quantity : item.peso,
        }));

  console.log(volumes);
  console.log(carrinho);

  const payload = {
    service: shipping.id,
    from: {
      name: "arbogrowth",
      phone: "19999999999",
      email: "lucas.brabes@terra.com.br",
      address: "Rua Claudio Rossi",
      number: "913",
      district: "Jardim da Gloria",
      city: "São Paulo",
      country_id: "BR",
      postal_code: `${process.env.CEP_ORIGEM}`,
      state_abbr: "SP",
    },
    to: {
      name: shipping.to.name, // Você precisa passar esses dados do frontend
      phone: shipping.to.phone, // Você precisa passar esses dados do frontend
      email: shipping.to.email, // Você precisa passar esses dados do frontend
      address: shipping.to.address, // Você precisa passar esses dados do frontend
      number: shipping.to.number,
      complement: shipping.to.complement, // Você precisa passar esses dados do frontend
      district: shipping.to.district, // Você precisa passar esses dados do frontend
      document: shipping.to.document, // Você precisa passar esses dados do frontend
      city: shipping.to.city, // Você precisa passar esses dados do frontend
      country_id: "BR",
      postal_code: shipping.to.postal_code,
      state_abbr: shipping.to.state_abbr,
    },
    products: produtos,
    volumes: volumes,
    options: {
      insurance_value: total, // valor total da compra em centavos
      receipt: shipping.additional_services.receipt,
      own_hand: shipping.additional_services.own_hand,
      reverse: false,
      non_commercial: false,
    },
  };

  try {
    const tokenData = await getToken();
    const accessToken = tokenData.access_token;
    const response = await axios.post(
      "https://sandbox.melhorenvio.com.br/api/v2/me/cart",
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          Accept: "aplication/json",
          "User-Agent": "arbogrowth lucas.brabes@terra.com.br",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao criar pedido no MelhorEnvio:", error.response.data);
    throw new Error("Erro ao criar pedido no MelhorEnvio");
  }
}

async function sendEmailCompra(destinatario, nome, cep, total) {
  // Configuração do transporter
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true para 465, false para outras portas
    auth: {
      user: "lukinhasmazetto@gmail.com", // Seu email
      pass: process.env.SENHA_EMAIL, // Sua senha
    },
  });

  // Texto fixo do email
  const text = `Olá,${nome}

Obrigado por sua compra na Arbogrowth!

Seu pedido no valor de R$${total} foi realizado com sucesso e estamos processando o envio para o cel ${cep}.

Logo enviaremos seu código de rastreio, Fique Atento!

Atenciosamente,
Equipe Arbogrowth`;

  // HTML fixo do email
  const html = `<p>Olá,${nome}</p>
<p>Obrigado por sua compra na <strong>Arbogrowth</strong>!</p>
<p>Seu pedido no valor de R$${total} foi realizado com sucesso e estamos processando o envio o cel ${cep}.</p>
<p>Atenciosamente,<br>Equipe Arbogrowth</p>`;

  // Opções do email
  let mailOptions = {
    from: '"Arbogrowth" <lukinhasmazetto@gmail.com>', // Remetente
    to: destinatario, // Destinatário
    subject: "Compra Realizada com Sucesso", // Assunto
    text: text, // Texto
    html: html, // HTML (opcional)
  };

  // Enviar email
  try {
    let info = await transporter.sendMail(mailOptions);
    console.log("Email enviado: %s", info.messageId);
    return {
      success: true,
      message: "Verifique a a finalização da compra no seu email",
    };
  } catch (error) {
    console.error("Erro ao enviar email: %s", error);
  }
}
async function sendRastreio(
  email,
  valor_total,
  cep,
  rua,
  numero,
  complemento,
  cidade,
  estado,
  numero_protocolo,
  codigoRastreio
) {
  // Configuração do transporter
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true para 465, false para outras portas
    auth: {
      user: "lukinhasmazetto@gmail.com", // Seu email
      pass: process.env.SENHA_EMAIL, // Sua senha ou app password
    },
  });

  // Texto fixo do email
  const text = `Olá,

Obrigado por sua compra na Arbogrowth!

Seu código de rastreio é: ${codigoRastreio}

Detalhes da entrega:
- Valor Total: R$${valor_total}
- CEP: ${cep}
- Rua: ${rua}
- Número: ${numero}
- Complemento: ${complemento}
- Cidade: ${cidade}
- Estado: ${estado}
- Número do Protocolo: ${numero_protocolo}

Para acompanhar seu pedido, clique no link: https://app.melhorrastreio.com.br/app/melhorenvio/${codigoRastreio}

Atenciosamente,
Equipe Arbogrowth`;

  // HTML do e-mail
  const html = `<p>Olá,</p>
  <p>Obrigado por sua compra na <strong>Arbogrowth</strong>!</p>
  <p>Seu código de rastreio é: <a href="https://app.melhorrastreio.com.br/app/melhorenvio/${codigoRastreio}" target="_blank">${codigoRastreio}</a></p>
  <p><strong>Detalhes da entrega:</strong></p>
  <ul>
    <li>Valor Total: R$${valor_total}</li>
    <li>CEP: ${cep}</li>
    <li>Rua: ${rua}</li>
    <li>Número: ${numero}</li>
    <li>Complemento: ${complemento}</li>
    <li>Cidade: ${cidade}</li>
    <li>Estado: ${estado}</li>
    <li>Número do Protocolo: ${numero_protocolo}</li>
  </ul>
  <p>Para acompanhar seu pedido, clique no link: <a href="https://app.melhorrastreio.com.br/app/melhorenvio/${codigoRastreio}" target="_blank">Rastrear Pedido</a></p>
  <p>Atenciosamente,<br>Equipe Arbogrowth</p>`;

  // Opções do email
  let mailOptions = {
    from: '"Arbogrowth" <lukinhasmazetto@gmail.com>', // Remetente
    to: email, // Destinatário
    subject: "Código de Rastreio da Sua Compra", // Assunto
    text: text, // Texto
    html: html, // HTML (opcional)
  };

  // Enviar email
  try {
    let info = await transporter.sendMail(mailOptions);
    console.log("Email enviado: %s", info.messageId);
    return {
      success: true,
      message: "Código de rastreio enviado com sucesso",
    };
  } catch (error) {
    console.error("Erro ao enviar email: %s", error);
    throw error;
  }
}

async function getToken() {
  return new Promise((aceito, rejeitado) => {
    db.query(
      "SELECT * FROM tokens ORDER BY id DESC LIMIT 1;",
      (error, results) => {
        if (error) {
          console.error("Nenhum token encontrado:", error);
          rejeitado(error);
          return;
        }
        aceito(results[0]);
      }
    );
  });
}

async function refreshAccessToken() {
  try {
    const tokenData = await getToken();
    const refreshToken = tokenData.refresh_token; // Certifique-se de que o campo está correto

    if (!refreshToken) {
      throw new Error("Refresh token não encontrado");
    }

    const payload = {
      grant_type: "refresh_token",
      client_id: process.env.CLIENT_ID_ENVIO,
      client_secret: process.env.CLIENT_SECRET_ENVIO,
      refresh_token: refreshToken,
    };

    const response = await axios.post(
      "https://sandbox.melhorenvio.com.br/oauth/token",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "User-Agent": "arbogrowth lucas.brabes@terra.com.br",
        },
      }
    );

    await updateTokens(
      response.data.access_token,
      response.data.refresh_token,
      response.data.expires_in
    );
    console.log("Access token atualizado:");
  } catch (error) {
    console.error(
      "Erro interno, tente novamente mais tarde",
      error.response ? error.response.data : error.message
    );
    throw new Error("Erro interno, tente novamento mais tarde");
  }
}

async function updateTokens(accessToken, refreshToken, expiresIn) {
  return new Promise((resolve, reject) => {
    db.query(
      "INSERT INTO tokens (access_token, refresh_token, expires_in) VALUES (?, ?, ?)",
      [accessToken, refreshToken, expiresIn],
      (error, results) => {
        if (error) {
          console.error("Erro ao inserir tokens no banco de dados:", error);
          reject(error);
          return;
        }
        resolve(results);
      }
    );
  });
}

async function verifyToken(req, res, next) {
  try {
    // Extrai o token do cabeçalho da requisição
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Token não fornecido" });
    }

    // Verifica o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log(process.env.JWT_SECRET); // Apenas para depuração, remova em produção
    console.log("fez o decode correto");

    // Adiciona os dados decodificados ao req.user
    req.user = decoded;

    // Chama o próximo middleware ou rota
    next();
  } catch (err) {
    console.error("Token inválido:", err);
    return res.status(403).json({ error: "Token inválido" });
  }
}

// Agendamento de job para renovação do token
// cron.schedule("0 0 */28 * *", refreshAccessToken);
// refreshAccessToken();

module.exports = {
  criarPedidoMelhorEnvio,
  sendEmailCompra,
  sendRastreio,
  getToken,
  verifyToken,
};
