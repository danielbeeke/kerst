const express = require('express')
const app = express()
const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();
const settings = require('../functions/settings.js')
const stripe = require('stripe')(settings.prodKey)

AWS.config.update({
  region: 'eu-central-1',
  endpoint: 'http://localhost:8000'
});

// respond with 'hello world' when a GET request is made to the homepage
app.get('/products', async function (req, res) {
  const products = await stripe.products.list()
  const productIds = products.data.map(product => product.id)



  const data = docClient.get({
    Key: { 'key': { S: 'Acme Band' }},
    TableName: 'kerst'
  })

  res.send('hello world')
})

app.post('/products', async function (req, res) {
  const products = await stripe.products.list()
  const productIds = products.data.map(product => product.id)



  const data = docClient.get({
    Key: { 'key': { S: 'Acme Band' }},
    TableName: 'kerst'
  })

  res.send('hello world')
})

app.listen(3000)
console.log('listening on 3000')
