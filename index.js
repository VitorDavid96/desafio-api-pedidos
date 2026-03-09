const express = require('express');
const db = require('./database');
const swaggerUi = require('swagger-ui-express');

const app = express();
app.use(express.json());

// --- 1. CONFIGURAÇÃO DO SWAGGER ---
const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "API de Pedidos - Desafio Jitterbit",
    description: "Documentação da API de pedidos com mapeamento de dados para SQL.",
    version: "1.0.0"
  },
  paths: {
    "/order": {
      post: {
        summary: "Cria um novo pedido",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  numeroPedido: { type: "string" },
                  valorTotal: { type: "number" },
                  dataCriacao: { type: "string" },
                  items: { type: "array", items: { type: "object" } }
                }
              }
            }
          }
        },
        responses: { "201": { description: "Pedido criado com sucesso" } }
      }
    },
    "/order/list": {
      get: {
        summary: "Lista todos os pedidos",
        responses: { "200": { description: "Sucesso" } }
      }
    },
    "/order/{id}": {
      get: {
        summary: "Busca pedido por ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Sucesso" }, "404": { description: "Não encontrado" } }
      },
      put: {
        summary: "Atualiza um pedido",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          content: { "application/json": { schema: { type: "object", properties: { valorTotal: { type: "number" } } } } }
        },
        responses: { "200": { description: "Atualizado" } }
      },
      delete: {
        summary: "Exclui um pedido",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Excluído" } }
      }
    }
  }
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// --- 2. ROTAS DA API ---

app.post('/order', async (req, res) => {
  try {
    const data = req.body;
    const orderData = {
      orderId: data.numeroPedido,
      value: data.valorTotal,
      creationDate: data.dataCriacao
    };

    const itemsData = data.items.map(item => ({
      orderId: data.numeroPedido,
      productId: item.idItem,
      quantity: item.quantidadeItem,
      price: item.valorItem
    }));

    await db.transaction(async tr => {
      await tr('Order').insert(orderData);
      await tr('Items').insert(itemsData);
    });

    res.status(201).json({ message: "Pedido criado com sucesso!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/order/list', async (req, res) => {
  try {
    const orders = await db('Order').select('*');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao listar pedidos" });
  }
});

app.get('/order/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const order = await db('Order').where({ orderId: id }).first();
    const items = await db('Items').where({ orderId: id });

    if (order) {
      res.json({ ...order, items });
    } else {
      res.status(404).json({ message: "Pedido não encontrado" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/order/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { valorTotal } = req.body;
    const updated = await db('Order').where({ orderId: id }).update({ value: valorTotal });

    if (updated) {
      res.json({ message: "Pedido atualizado com sucesso" });
    } else {
      res.status(404).json({ message: "Pedido não encontrado" });
    }
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

app.delete('/order/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.transaction(async tr => {
      await tr('Items').where({ orderId: id }).del();
      await tr('Order').where({ orderId: id }).del();
    });
    res.json({ message: "Pedido e itens excluídos com sucesso" });
  } catch (error) {
    res.status(500).json({ erro: "Erro ao excluir: " + error.message });
  }
});

// --- 3. INICIALIZAÇÃO (Apenas um app.listen ao final) ---
app.listen(3000, () => {
  console.log('==============================================');
  console.log('🚀 API DE PEDIDOS ATIVA');
  console.log('📂 Local: http://localhost:3000');
  console.log('📝 Swagger: http://localhost:3000/api-docs');
  console.log('==============================================');
});