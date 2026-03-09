const express = require('express');
const db = require('./database');
const swaggerUi = require('swagger-ui-express');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

const SECRET_KEY = "vitor_Jitterbit";

// --- 1. MIDDLEWARE DE AUTENTICAÇÃO ---
function verifyJWT(req, res, next) {
  const token = req.headers['authorization'];

  if (!token) return res.status(401).json({ message: "Token não fornecido" });

  // Remove o prefixo 'Bearer ' caso exista
  const pureToken = token.startsWith('Bearer ') ? token.split(' ')[1] : token;

  jwt.verify(pureToken, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(500).json({ message: "Token inválido ou expirado" });
    
    req.userId = decoded.user;
    next();
  });
}

// --- 2. CONFIGURAÇÃO DO SWAGGER (COM SEGURANÇA) ---
const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "API de Pedidos - Desafio Jitterbit",
    description: "API de pedidos com mapeamento de dados para SQL e Autenticação JWT.",
    version: "1.0.0"
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  },
  security: [{ bearerAuth: [] }],
  paths: {
    "/login": {
      post: {
        summary: "Gera um token de acesso",
        security: [], // Aberto ao público
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  username: { type: "string", example: "admin" },
                  password: { type: "string", example: "1234" }
                }
              }
            }
          }
        },
        responses: { "200": { description: "Token gerado" } }
      }
    },
    "/order": {
      post: {
        summary: "Cria um novo pedido (Protegido)",
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
        responses: { "201": { description: "Sucesso" } }
      }
    },
    "/order/list": {
      get: {
        summary: "Lista todos os pedidos (Protegido)",
        responses: { "200": { description: "Sucesso" } }
      }
    },
    "/order/{id}": {
      get: {
        summary: "Busca pedido por ID (Protegido)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Sucesso" } }
      },
      put: {
        summary: "Atualiza um pedido (Protegido)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          content: { "application/json": { schema: { type: "object", properties: { valorTotal: { type: "number" } } } } }
        },
        responses: { "200": { description: "Atualizado" } }
      },
      delete: {
        summary: "Exclui um pedido (Protegido)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Excluído" } }
      }
    }
  }
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// --- 3. ROTAS DE AUTENTICAÇÃO ---

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Validação simples para o desafio
  if (username === 'admin' && password === '1234') {
    const token = jwt.sign({ user: username }, SECRET_KEY, { expiresIn: '1h' });
    return res.json({ auth: true, token });
  }

  res.status(401).json({ message: "Credenciais inválidas" });
});

// --- 4. ROTAS DA API PROTEGIDAS PELO verifyJWT ---

app.post('/order', verifyJWT, async (req, res) => {
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

app.get('/order/list', verifyJWT, async (req, res) => {
  try {
    const orders = await db('Order').select('*');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao listar pedidos" });
  }
});

app.get('/order/:id', verifyJWT, async (req, res) => {
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

app.put('/order/:id', verifyJWT, async (req, res) => {
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

app.delete('/order/:id', verifyJWT, async (req, res) => {
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

// --- 5. INICIALIZAÇÃO ---
app.listen(3000, () => {
  console.log('==============================================');
  console.log('🚀 API COM JWT ATIVA');
  console.log('📂 Local: http://localhost:3000');
  console.log('📝 Swagger: http://localhost:3000/api-docs');
  console.log('==============================================');
});