
import TurbolinksAdapter from 'vue-turbolinks'
import Vue from 'vue/dist/vue.esm'
import Step from '../../vue/steps/step.vue'

Vue.use(TurbolinksAdapter)

document.addEventListener('turbolinks:load', () => {
  var url = $('#steps').data('url')
  const app = new Vue({
    data: () => {
      return {
        steps: []
      }
    },
    el: '#steps',
    components: { Step },
    methods: {
      reorder: function() {
        this.steps.sort((a,b) => a.position - b.position);
      }
    }
  })


  $.get(url, function(data) {
    app.steps = data
  })
})
