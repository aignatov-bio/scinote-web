<template>
  <div class="step-container" v-bind:style="`order:${step.position}`">
    <div class="header">
      <div class="position">
        {{ step.position + 1 }}
      </div>
      <div class="name">
        <InlineField
          :initial_value="step.name"
          :url="`/steps/${step.id}/update_name`"
          :item_id="step.id"
          field_to_update="name"
        ></InlineField>
      </div>
      <div class="actions">
        <div v-if="step.position > 0" v-on:click="move_up" class="flex-left btn btn-light icon-btn" >
          <span class="fas fa-arrow-up"></span>
        </div>
        <div v-if="!last_step()" v-on:click="move_down" class="btn btn-light icon-btn flex-right">
          <span class="fas fa-arrow-down"></span>
        </div>
        <div class="btn btn-light icon-btn" v-bind:data-id="step.id" onclick="$.ajax({url: `/steps/${this.dataset.id}`,type: 'DELETE'})">
            <span class="fas fa-trash-alt"></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import InlineField from '../shared/inline_field.vue'

  export default {
    props: {
      step: Object
    },
    components: { InlineField },
    mounted() {
      var component = this
      App.cable.subscriptions.create(
        { channel: "StepChannel", id: this.step.id},
        {
          received(data) {
            component.$emit('update:step', data)
          }
        }
      )
    },
    methods: {
      last_step: function() {
        let steps = this.$parent.steps
        return steps.length - 1 === this.step.position
      },

      move_up: function() {
        $.post(Routes.move_up_step_path(this.step.id))
      },

      move_down: function() {
        $.post(Routes.move_down_step_path(this.step.id))
      }
    }
  }
</script>

<style lang="scss" scoped>
  .step-container {
    border-radius: .5em;
    border: 1px solid #d0d0d8;
    margin-bottom: 2em;

    .header {
      align-items: center;
      display: flex;
      min-height: 3em;
      padding: .5em 1em;

      .position {
        font-size: 20px;
        padding-right: 1em;
      }
      .name {
        flex-grow: 1;
      }

      .actions {
        display: flex;
        flex-shrink: 0;
        width: 8em;

        .flex-right {
          margin-left: auto;
        }

        .flex-left {
          margin-right: auto;
        }
      }
    }
  }
</style>
