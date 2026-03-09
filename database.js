const knex = require('knex')({
  client: 'sqlite3',
  connection: { filename: "./data.sqlite" },
  useNullAsDefault: true
});

async function initDb() {
  // Tabela de Pedidos
  if (!await knex.schema.hasTable('Order')) {
    await knex.schema.createTable('Order', table => {
      table.string('orderId').primary();
      table.decimal('value');
      table.dateTime('creationDate');
    });
  }

  // Tabela de Itens (Relacionada ao Pedido)
  if (!await knex.schema.hasTable('Items')) {
    await knex.schema.createTable('Items', table => {
      table.increments('id');
      table.string('orderId').references('Order.orderId');
      table.string('productId');
      table.integer('quantity');
      table.decimal('price');
    });
  }
}

initDb();
module.exports = knex;