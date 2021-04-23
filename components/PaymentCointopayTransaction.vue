<template>
  <div v-if="transaction">
    <div class="text-center">
      <img v-if="transaction.Status === 'waiting'" :src="loaderGif" alt="">
      <h3>Payment Details</h3>
      <img v-if="transaction.Status === 'waiting'" :src="qrCodeImage" alt="">
      <img v-if="transaction.Status === 'paid' || transaction.Status === 'underpaid'"
        :src="successIcon" alt="">
    </div>
    <table class="table">
      <tbody>
        <tr>
          <td class="bold">
            Amount:
          </td>
          <td>
            <div class="flex items-center">
              {{ transaction.Amount }}&emsp;
              <span class="uc">{{ transaction.CoinName }}</span>&emsp;
              <img class="coin-image" :src="coinImage" alt="">
            </div>
          </td>
        </tr>
        <tr>
          <td class="bold">
            Address:
          </td>
          <td>{{ transaction.coinAddress }}</td>
        </tr>
        <tr v-if="transaction.Status !== 'paid' && transaction.Status !== 'underpaid'">
          <td class="bold">
            Expiry:
          </td>
          <td>{{ this.timer }}</td>
        </tr>
        <tr>
          <td class="bold">
            Transaction ID:
          </td>
          <td>{{ transaction.TransactionID }}</td>
        </tr>
        <tr>
          <td class="bold">
            Status:
          </td>
          <td>{{ transaction.Status }}</td>
        </tr>
      </tbody>
    </table>
    <p>Make sure to send enough to cover any coin transaction fees!</p>
    <p>Send an equal amount or more.</p>
    <a :href="transaction.RedirectURL" target="_blank">View Invoice Details</a>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import config from 'config';
const moment = require('moment-timezone/builds/moment-timezone-with-data-2012-2022.min');

export default {
  name: 'PaymentCointopayTransaction',
  data () {
    return {
      interval: null,
      timer: null,
      balanceSocket: null,
      isClosedBalanceSocket: false
    }
  },
  computed: {
    ...mapGetters({
      transaction: 'cointopay/transaction'
    }),
    loaderGif () {
      return require('../assets/cointopay.gif')
    },
    successIcon() {
      return require('../assets/success.png')
    },
    qrCodeImage () {
      return this.transaction.QRCodeURL
    },
    coinImage () {
      return `https://s3-eu-west-1.amazonaws.com/cointopay/img/${this.transaction.CoinName.toLowerCase()}_dash2.png`
    }
  },
  methods: {
    getTransaction (id) {
      const url = config.cointopay.endpoint + '/transactions/' + id
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
        const statuses = ['paid', 'underpaid', 'expired']
        if (statuses.indexOf(this.transaction.Status) !== -1) {
          if (this.interval) {
            clearInterval(this.interval);
          }
          this.timer = this.transaction.Status
        }
      }).catch(error => {
        console.log(error)
      })
    },
    startTimer () {
      if (!this.timer) {
        let date = moment.tz(this.transaction.CreatedOn, 'Europe/Amsterdam')
          .add(Number(this.transaction.ExpiryTime), 'minutes');
        this.interval = setInterval(() => {
          const now = moment().tz('Europe/Amsterdam').valueOf();
          const diff = date.valueOf() - now;
          // Time calculations for days, hours, minutes and seconds
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor(
            (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
          );
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          this.timer = `${days}d ${hours}h ${minutes}m ${seconds}s`;
          if (diff < 0) {
            clearInterval(this.interval);
            this.timer = 'Expired';
          }
        }, 1000);
      }
    },
    initSocket () {
      this.balanceSocket = new WebSocket('wss://wss.cointopay.com/balance');
      const self = this;
      this.balanceSocket.onmessage = function (event) {
        if (event) {
          if (event.data) {
            const parts = event.data.split(':');
            if (parts.length >= 4 && self.transaction) {
              if (self.transaction.TransactionID.toString() === parts[1].toString()) {
                const id = self.transaction.TransactionID;
                self.getTransaction(id);
              }
            }
          }
        }
      };
      this.balanceSocket.onclose = function (event) {
        if (!self.isClosedBalanceSocket) {
          self.initSocket();
        }
      };
    }
  },
  mounted () {
    if (this.transaction) {
      this.startTimer()
      this.initSocket()
    }
  },
  beforeDestroy () {
    if (this.interval) {
      clearInterval(this.interval);
    }
    // Destroy Sockets
    if (this.balanceSocket !== null) {
      this.isClosedBalanceSocket = true;
      this.balanceSocket.close();
    }
    // Remove transaction
    this.$store.commit('cointopay/setTransaction', null)
  }
}
</script>

<style scoped lang="scss">
.text-center {
  text-align: center;
}
.uc {
  text-transform: uppercase;
}
.coin-image {
  width: 24px;
  height: 24px;
}
.table {
  border: 0;
  .bold {
    font-weight: bold;
  }
  tr {
    display: block;
    margin-bottom: 4px;
  }
}

.flex {
  display: flex;
}
.items-center {
  align-items: center;
}
</style>
