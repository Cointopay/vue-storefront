import { apiStatus } from '../../../lib/util';
import { Router } from 'express';
const Magento2Client = require('magento2-rest-client').Magento2Client;
const request = require('request');

module.exports = ({ config, db }) => {
  let api = Router();
  api.get('/supported-coins', (req, res) => {
    const merchantId = config.extensions.cointopay.merchantId;
    request.get(`https://cointopay.com/CloneMasterTransaction?MerchantID=${merchantId}&output=json`, (error, response, body) => {
      let currencies = [];
      if (!error) {
        body = JSON.parse(body);
        for (let i = 0; i < body.length; i++) {
          if (i % 2 === 0) {
            currencies.push({
              id: Number(body[i + 1]),
              name: body[i]
            })
          }
        }
      }
      apiStatus(res, currencies, 200);
    });
  });

  api.get('/orders/:id', (req, res) => {
    const client = Magento2Client(config.magento2.api);
    client.addMethods('orders', (restClient) => {
      var module = {};
      module.getOrderDetail = function () {
        return restClient.get('/orders/' + req.params.id);
      };
      return module;
    });
    client.orders.getOrderDetail().then(result => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiStatus(res, err, 500);
    });
  });

  api.get('/transactions/:id', (req, res) => {
    if (req.params.id) {
      const client = Magento2Client(config.magento2.api);
      client.addMethods('orders', (restClient) => {
        var module = {};
        module.getTransactionDetail = function () {
          return restClient.get('/cointopay-paymentGateway/transactions/' + req.params.id);
        };
        return module;
      });
      client.orders.getTransactionDetail().then(result => {
        apiStatus(res, result[0].data, 200);
      }).catch(err => {
        apiStatus(res, err, 500);
      });
    }
  });
  return api;
}
