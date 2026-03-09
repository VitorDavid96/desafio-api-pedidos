const express = require('express');
const db = require('./database');
const app = express();

app.use(express.json());

// Rota POST: Criar Pedido com Mapeamento de Dados
app.post('/order', async (req, res) => {
  try {
    const data = req.body;

    // Transformação (Mapping) para o Banco de Dados
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

    // Transação garante que ou salva TUDO ou NADA (Integridade)
    await db.transaction(async tr => {
      await tr('Order').insert(orderData);
      await tr('Items').insert(itemsData);
    });

    res.status(201).json({ message: "Pedido criado com sucesso!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota GET: Buscar Pedido por ID
app.get('/order/:id', async (req, res) => {
  const { id } = req.params;
  const order = await db('Order').where({ orderId: id }).first();
  const items = await db('Items').where({ orderId: id });

  if (order) {
    res.json({ ...order, items });
  } else {
    res.status(404).json({ message: "Pedido não encontrado" });
  }
});

// --- LISTAR TODOS OS PEDIDOS (Opcional) ---
app.get('/order/list', async (req, res) => {
  try {
    const orders = await db('Order').select('*');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao listar pedidos" });
  }
});

// --- ATUALIZAR PEDIDO (Opcional) ---
app.put('/order/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { valorTotal } = req.body; // Exemplo: atualizar apenas o valor

    const updated = await db('Order')
      .where({ orderId: id })
      .update({ value: valorTotal });

    if (updated) {
      res.json({ message: "Pedido atualizado com sucesso" });
    } else {
      res.status(404).json({ message: "Pedido não encontrado" });
    }
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

// --- DELETAR PEDIDO (Opcional) ---
app.delete('/order/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Usamos transação para deletar itens e o pedido juntos
    await db.transaction(async tr => {
      await tr('Items').where({ orderId: id }).del();
      await tr('Order').where({ orderId: id }).del();
    });

    res.json({ message: "Pedido e itens excluídos com sucesso" });
  } catch (error) {
    res.status(500).json({ erro: "Erro ao excluir: " + error.message });
  }
});

app.listen(3000, () => console.log('API rodando em http://localhost:3000'));

