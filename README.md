API de Gerenciamento de Pedidos (Desafio Técnico)
Esta API foi desenvolvida em Node.js para gerenciar pedidos e seus itens, aplicando conceitos de Data Mapping para transformar dados de entrada (JSON em Português) em uma estrutura de banco de dados relacional padronizada (SQL em Inglês).

Tecnologias Utilizadas
Node.js: Ambiente de execução.
Express: Framework web para criação de rotas RESTful.
Knex.js: Query Builder para manipulação estruturada de dados SQL.
SQLite3: Banco de dados relacional (armazenado em arquivo local).

Estrutura do Banco de Dados & Mapping
O sistema realiza a transformação automática dos campos conforme as regras de negócio do desafio:
Campo Entrada (JSON)Coluna Banco (SQL)TabelanumeroPedidoorderId (PK)OrdervalorTotalvalueOrderdataCriacaocreationDateOrderidItemproductIdItemsquantidadeItemquantityItemsvalorItempriceItems

Como Instalar e Rodar
1. Clone o repositório:git clone https://github.com/seu-usuario/desafio-jitterbit.git
cd desafio-jitterbit
2. Instale as dependências: npm install
3. Inicie o servidor:node index.js
A API estará disponível em http://localhost:3000.

Endpoints da API
1. Criar Pedido (POST)
URL: http://localhost:3000/order

curl --location 'http://localhost:3000/order' \
--header 'Content-Type: application/json' \
--data '{
    "numeroPedido": "v10089015vdb-01",
    "valorTotal": 10000,
    "dataCriacao": "2023-07-19T12:24:11.5299601+00:00",
    "items": [
        {
            "idItem": "2434",
            "quantidadeItem": 1,
            "valorItem": 1000
        }
    ]
}'

2. Buscar Pedido por ID (GET)
URL: http://localhost:3000/order/v10089015vdb-01 

3. Listar Todos os Pedidos (GET - Opcional)
URL: http://localhost:3000/order/list

4. Atualizar Pedido (PUT - Opcional)
URL: http://localhost:3000/order/v10089015vdb-01 
Atualiza o valor total do pedido.

5. Deletar Pedido (DELETE - Opcional)
URL: http://localhost:3000/order/v10089015vdb-01

Remove o pedido e todos os seus itens associados (Cascading Delete via código).

O projeto foi estruturado para garantir a integridade dos dados usando transações SQL (Knex Transactions), garantindo que um pedido nunca seja criado sem seus respectivos itens, mantendo a consistência analítica do sistema.