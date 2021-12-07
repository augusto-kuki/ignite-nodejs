const express = require("express");
const { v4: uuidV4 } = require("uuid");

const app = express();
app.use(express.json());

const customers = [];

function verifyIfExistsAccountCPF(request, response, next) {
  const { cpf } = request.headers;

  const customer = customers.find((customer) => customer.cpf === cpf);

  if (!customer) {
    return response.status(400).json({ error: "Customer not found!" });
  }

  request.customer = customer;
  return next();
}

function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    if (operation.type === "credit") {
      return acc + operation.amount;
    } else {
      return acc - operation.amount;
    }
  }, 0);

  return balance;
}

app.post("/account", (request, response) => {
  const { cpf, name } = request.body;

  const customerAlreadyExists = customers.some(
    (customer) => customer.cpf === cpf
  );

  if (customerAlreadyExists) {
    return response.status(400).json({ error: "Customer already exists!" });
  }

  customers.push({
    cpf,
    name,
    id: uuidV4(),
    statement: [],
  });

  return response.status(201).send();
});

app.use(verifyIfExistsAccountCPF);
app.get("/statement", (request, response) => {
  const { customer } = request;

  return response.json(customer.statement);
});

app.post("/deposit", (request, response) => {
  const { description, amount } = request.body;

  const { customer } = request;

  const statement = {
    description,
    amount,
    createdAt: new Date(),
    type: "credit",
  };

  customer.statement.push(statement);

  return response.status(201).send();
});

app.post("/withdraw", (request, response) => {
  const { amount } = request.body;
  const { customer } = request;

  const balance = getBalance(customer.statement);

  if (balance < amount) {
    return response.status(400).json({ error: "Insufficient funds!" });
  }

  const statement = {
    description: "Saque",
    amount,
    createdAt: new Date(),
    type: "debit",
  };

  customer.statement.push(statement);

  return response.status(201).send();
});
app.get("/statement/date", (request, response) => {
  const { customer } = request;
  const { date } = request.query;

  const dateFormat = new Date(date + " 00:00");
  const statement = customer.statement.filter(
    (statement) =>
      statement.createdAt.toDateString() === dateFormat.toDateString()
  );

  return response.json(statement);
});

app.put("/account", (request, response) => {
  const { name } = request.body;
  const { customer } = request;

  customer.name = name;

  return response.send();
});

app.get("/account", (request, response) => {
  return response.json(request.customer);
});

app.delete("/account", (request, response) => {
  const { customer } = request;

  const indexCustomer = customers.findIndex(
    (item) => item.cpf === customer.cpf
  );

  customers.splice(indexCustomer, 1);

  return response.status(200).json(customers);
});

app.listen(3333, function () {
  console.log("Server started at http://localhost:3333/");
});
