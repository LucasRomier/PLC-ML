import Vue from 'vue'
import App from './App.vue'

import SuiVue from 'semantic-ui-vue'

import { store }  from './store'

Vue.config.productionTip = false

Vue.use(SuiVue)

new Vue({
  components: {App},
  template: '<App/>',
  store,
}).$mount('#app')