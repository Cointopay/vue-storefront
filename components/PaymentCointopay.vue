<template>
  <div class="vsf-cointopay-container">
    <label for="currency">Select Crypto Currency</label>
    <select class="form_element" v-model="currency" id="currency">
      <option :value="c.id" v-for="(c, index) in currencies" :key="index">{{ c.name }}</option>
    </select>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import EventBus from '@vue-storefront/core/compatibility/plugins/event-bus'
import config from 'config'

export default {
  name: 'PaymentCointopay',
  data () {
    return {
      currencies: [],
      currency: null
    }
  },
  beforeMount () {
    EventBus.$on('order-after-placed', this.onAfterPlaceOrder)
    EventBus.$on('checkout-before-placeOrder', this.onBeforePlaceOrder)
  },
  beforeDestroy () {
    // EventBus.$off('order-after-placed', this.onAfterPlaceOrder)
    EventBus.$off('checkout-before-placeOrder', this.onBeforePlaceOrder)
  },
  mounted () {
    // Load merchant currencies
    this.loadMerchantCurrencies()
    EventBus.$on('checkout-payment-method-changed', (paymentMethodCode) => {
      if (paymentMethodCode !== 'cointopay_gateway') {
        // unregister the extension place order handler
        EventBus.$off('checkout-before-placeOrder', this.onBeforePlaceOrder)
      }
    })
    console.log(this.$store.state)
    this.$store.commit('cointopay/setTransaction', null)
  },
  computed: {
    ...mapGetters({
      transaction: 'cointopay/transaction'
    })
  },
  methods: {
    onAfterPlaceOrder (data) {
      if (data.confirmation.magentoOrderId) {
        this.getTransactionDetail(data.confirmation.magentoOrderId)
      }
    },
    onBeforePlaceOrder () {
      this.appendAltCoinToOrderPayload()
    },
    loadMerchantCurrencies () {
      const url = config.cointopay.endpoint + '/supported-coins'
      fetch(url, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        }
      }).then(response => {
        return response.json()
      }).then(res => {
        this.currencies = res.result
        if (this.currencies.length > 0) {
          this.currency = this.currencies[0].id
        }
      }).catch(error => {
        console.log(error)
      })
    },
    appendAltCoinToOrderPayload () {
      EventBus.$emit('checkout-do-placeOrder', {
        transaction_result: this.currency.toString()
      });
    },
    getTransactionDetail (orderId) {
      let url = config.cointopay.endpoint + '/orders/' + orderId
      fetch(url, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        }
      }).then(response => {
        return response.json()
      }).then(res => {
        if (res.result.ext_order_id) {
          url = config.cointopay.endpoint + '/transactions/' + res.result.ext_order_id
          fetch(url, {
            method: 'GET',
            mode: 'cors',
            headers: {
              'Accept': 'application/json, text/plain, */*',
              'Content-Type': 'application/json'
            }
          }).then(response => {
            return response.json()
          }).then(res => {
            this.$store.commit('cointopay/setTransaction', res.result)
            // Stop display loader
            EventBus.$emit('notification-progress-stop')
          }).catch(error => {
            console.log(error)
            // Stop display loader
            EventBus.$emit('notification-progress-stop')
          })
        }
      }).catch(error => {
        console.log(error)
        // Stop display loader
        EventBus.$emit('notification-progress-stop')
      })
    }
  }
}
</script>

<style scoped lang="scss">
.vsf-cointopay-container {
  label {
    font-weight: 500;
    font-size: 14px;
    display: block;
    margin-bottom: 8px;
    color: #818992;
  }

  .form_element {
    background-color: white;
    padding: 10px 12px;
    border-radius: 4px;
    border: 1px solid transparent;
    box-shadow: 0 1px 3px 0 #e6ebf1;
    -webkit-transition: box-shadow 150ms ease;
    transition: box-shadow 150ms ease;
    min-width: 200px;
  }
}
</style>
