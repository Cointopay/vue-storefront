# Vue Storefront Cointopay Payment Extension

## Installation:

```shell
$ git clone git@github.com:Cointopay/vue-storefront.git ./vue-storefront/src/modules/payment-cointopay
```

Register the Cointopay module. Go to ./src/modules/client.ts

```js
...
import { InitialResourcesModule } from '@vue-storefront/core/modules/initial-resources'
import { PaymentCointopay } from 'src/modules/payment-cointopay'

export function registerNewModules () {
  ... 
  registerModule(PaymentCointopay) 
]
```

OR If you use Capybara VS theme. Go to `./src/themes/capybara/config/modules.ts`
```js
...
import { PaymentCashOnDeliveryModule } from 'src/modules/payment-cash-on-delivery'
import { PaymentCointopay } from 'src/modules/payment-cointopay'
...
export function registerClientModules () {
  ...
  registerModule(PaymentCointopay) 
}
```
Add the endpoint to your config
```json
  "cointopay" : {
    "endpoint": "http://localhost:8080/api/ext/cointopay"
  },
```
## Cointopay payment API extension

Install additional extension for `vue-storefront-api`:
```shell
$ cp -f ./api/cointopay ../vue-storefront-api/src/api/extensions/
```
Add the config to your api confg

```json
"extensions":{
   "cointopay": {
      "merchantId": "your-merchant-id" ##must match magento
    },
}
```

And enable Cointopay extension in the config, by adding it to `registeredExtensions` array

```json
"registeredExtensions": [
    "cointopay"
]
```

## Add Cointopay UI to your theme

#### If you use Capybara VS theme:
Under your theme `components/organisms/o-confirm-order.vue` add the following import to your script

```js
import PaymentCointopay from 'src/modules/payment-cointopay/components/PaymentCointopay'

export default {
  components: {
	...,
    PaymentCointopay
  }
}
```

And add the following code before "Place the order" button

```html
<payment-cointopay v-if="paymentDetails.paymentMethod === 'cointopay_gateway'"/>
````

Under your theme `components/organisms/o-order-confirmation.vue` add the following import to your script

```js
import PaymentCointopayTransaction from 'src/modules/payment-cointopay/components/PaymentCointopayTransaction'

export default {
  components: {
	...,
    PaymentCointopayTransaction
  }
}
```

```js
export default {
  computed: {
    ...mapState({
	  ...,
	  transaction: state => state.cointopay.transaction
	}
  }
}
```

And add the following code, where you see fit.

```html
<payment-cointopay-transaction v-if="transaction"/>
````


