
import TurbolinksAdapter from 'vue-turbolinks'
import Vue from 'vue/dist/vue.esm'
import Step from '../../vue/steps/step.vue'

Vue.use(TurbolinksAdapter)

var url = $('#steps').data('url');
var createUrl = $('#steps').data('url');

const app = new Vue({
  data: () => {
    return {
      steps: []
    }
  },
  el: '#steps',
  components: { Step }
})


$.get(url, function(data) {
  app.steps = data
})

App.cable.subscriptions.create(
  { channel: "ProtocolChannel", id: $('#steps').data('protocol-id')},
  {
    received(result) {
      if (result.action == 'create') {
        app.steps.push(result.data)
      }
    }
  }
)
