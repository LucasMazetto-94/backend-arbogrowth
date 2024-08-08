const db = require("../db");
const path = require("path");
const uploadDir = path.join(__dirname, "..", "uploads");
const bcrypt = require("bcrypt");
const {
  criarPedidoMelhorEnvio,
  sendRastreio,
  getToken,
} = require("./Functions");

module.exports = {
  buscarTodosProdutos: () => {
    // Adicione esta função
    return new Promise((aceito, rejeitado) => {
      const sql = `
            SELECT 
                tp.id_produto, 
                tp.nome_produto, 
                tp.valor, 
                ttp.descricao,
                tp.image,
                tp.largura,
                tp.altura,
                tp.comprimento,
                tp.peso
            FROM 
                tb_produtos tp 
            LEFT JOIN 
                tb_tipo_produto ttp 
            ON 
                tp.id_tipo_produto = ttp.id_tipo_produto
                ;`;

      db.query(sql, (error, results) => {
        if (error) {
          console.error("Erro ao executar a query:", error);
          rejeitado(error);
          return;
        }
        aceito(results);
      });
    });
  },
  buscarTipoProduto: () => {
    // Adicione esta função
    return new Promise((aceito, rejeitado) => {
      const sql = `
            SELECT 
                *
            FROM 
                tb_tipo_produto tp 
            ;`;

      db.query(sql, (error, results) => {
        if (error) {
          console.error("Erro ao executar a query:", error);
          rejeitado(error);
          return;
        }
        aceito(results);
      });
    });
  },

  buscarTodosPedidos: () => {
    return new Promise((aceito, rejeitado) => {
      db.query(
        `SELECT 
            te.id_entrega, 
            te.valor_total, 
            te.email, 
            te.cep,
            te.rua,
            te.numero,
            te.complemento,
            te.cidade,
            te.estado,
            te.numero_protocolo,
            te.codigo_rastreio,
            GROUP_CONCAT(JSON_OBJECT('nome', tp.nome_produto, 'quantidade', tv.quantidade)) AS produtos
          FROM 
            tb_entregas te
          LEFT JOIN 
            tb_vendas tv ON tv.id_entrega = te.id_entrega
          LEFT JOIN 
            tb_produtos tp ON tp.id_produto = tv.id_produto
          GROUP BY 
            te.id_entrega`,
        (error, results) => {
          if (error) {
            console.error("Erro ao executar a query:", error);
            rejeitado(error);
            return;
          }

          const pedidos = results.map((pedido) => {
            return {
              id_entrega: pedido.id_entrega,
              valor_total: pedido.valor_total,
              email: pedido.email,
              cep: pedido.cep,
              rua: pedido.rua,
              numero: pedido.numero,
              complemento: pedido.complemento,
              cidade: pedido.cidade,
              estado: pedido.estado,
              numero_protocolo: pedido.numero_protocolo,
              codigo_rastreio: pedido.codigo_rastreio,
              produtos: JSON.parse(`[${pedido.produtos}]`),
            };
          });

          aceito(pedidos);
        }
      );
    });
  },
  cadastrarVenda: async (carrinho, valor_total, shipping, nome) => {
    return new Promise((resolve, reject) => {
      db.beginTransaction(async (err) => {
        if (err) {
          reject(err);
          return;
        }

        const melhorEnvioResponse = await criarPedidoMelhorEnvio(
          carrinho,
          shipping,
          valor_total,
          nome
        );
        const { protocol } = melhorEnvioResponse;

        try {
          const sqlEntrega = `INSERT INTO tb_entregas (valor_total, email, cep, rua, numero, complemento, cidade, estado, numero_protocolo ) VALUES (?,?,?,?,?,?,?,?,?);`;
          const resultEntrega = await new Promise((resolve, reject) => {
            db.query(
              sqlEntrega,
              [
                valor_total,
                shipping.to.email,
                shipping.to.postal_code,
                shipping.to.address,
                shipping.to.number,
                shipping.to.complement,
                shipping.to.city,
                shipping.to.state_abbr,
                protocol,
              ],
              (err, result) => {
                if (err) {
                  return db.rollback(() => {
                    reject(err);
                  });
                }
                resolve(result);
              }
            );
          });

          const id_entrega = resultEntrega.insertId;

          let sqlVendas = `INSERT INTO tb_vendas (id_produto, quantidade, id_entrega) VALUES `;
          const values = [];
          carrinho.forEach((item, index) => {
            sqlVendas += `(?, ?, ?)`;
            if (index !== carrinho.length - 1) {
              sqlVendas += `, `;
            }
            values.push(item.id, item.quantity, id_entrega);
          });

          await new Promise((resolve, reject) => {
            db.query(sqlVendas, values, (err, result) => {
              if (err) {
                return db.rollback(() => {
                  reject(err);
                });
              }
              resolve(result);
            });
          });

          db.commit((err) => {
            if (err) {
              return db.rollback(() => {
                reject(err);
              });
            }
            resolve({ melhorEnvioResponse });
          });
        } catch (error) {
          db.rollback(() => {
            reject(error);
          });
        }
      });
    });
  },
  criarProduto: (
    nome_produto,
    valor,
    id_tipo_produto,
    altura,
    largura,
    comprimento,
    peso,
    image
  ) => {
    return new Promise((aceito, rejeitado) => {
      db.query(
        "INSERT INTO tb_produtos (nome_produto, valor, id_tipo_produto, image, altura, largura, comprimento, peso) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          nome_produto,
          valor,
          id_tipo_produto,
          image, // A URL da imagem deve ser passada na posição correta
          altura,
          largura,
          comprimento,
          peso,
        ],
        (error, result) => {
          if (error) {
            rejeitado(error);
            return;
          }
          aceito(result);
        }
      );
    });
  },
  enviar_rastreio: (codigo_rastreio, id_entrega) => {
    return new Promise(async (aceito, rejeitado) => {
      try {
        // Atualiza o código de rastreio no banco de dados
        await new Promise((resolve, reject) => {
          db.query(
            `UPDATE tb_entregas
             SET codigo_rastreio = ?
             WHERE id_entrega = ?`,
            [codigo_rastreio, id_entrega],
            (error, result) => {
              if (error) {
                reject(error);
                return;
              }
              resolve(result);
            }
          );
        });

        // Busca as informações para o email
        const entregaInfo = await new Promise((resolve, reject) => {
          db.query(
            `SELECT email, valor_total, cep, rua, numero, complemento, cidade, estado, numero_protocolo
             FROM tb_entregas
             WHERE id_entrega = ?`,
            [id_entrega],
            (error, results) => {
              if (error) {
                reject(error);
                return;
              }
              resolve(results[0]);
            }
          );
        });

        // Envia o email
        const {
          email,
          valor_total,
          cep,
          rua,
          numero,
          complemento,
          cidade,
          estado,
          numero_protocolo,
        } = entregaInfo;

        await sendRastreio(
          email,
          valor_total,
          cep,
          rua,
          numero,
          complemento,
          cidade,
          estado,
          numero_protocolo,
          codigo_rastreio
        );

        aceito({ success: true });
      } catch (error) {
        rejeitado(error);
      }
    });
  },
  registrarAdmin: async (email, senha) => {
    if (!email || !senha) {
      throw new Error("Email e senha são obrigatórios");
    }

    // Cria o hash da senha
    const hashedPassword = await bcrypt.hash(senha, 10);

    return new Promise((resolve, reject) => {
      db.query(
        "INSERT INTO tb_admin (email, senha) VALUES (?, ?)",
        [email, hashedPassword],
        (error, result) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(result);
        }
      );
    });
  },
  buscarAdminPorEmail: (email) => {
    return new Promise((resolve, reject) => {
      db.query(
        "SELECT * FROM tb_admin WHERE email = ?",
        [email],
        (error, results) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(results[0]); // Retorna o primeiro administrador encontrado
        }
      );
    });
  },
};
