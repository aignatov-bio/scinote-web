<template>
  <div class="step-container">
    <div class="header">
      <div class="position">
        {{ step.position + 1 }}
      </div>
      <div class="name">
        {{ step.name }}
      </div>
      <div v-if="step.position != 0" v-on:click="move_up" class="btn btn-secondary" >Up</div>
      <div v-if="!last_step()" v-on:click="move_down" class="btn btn-secondary">Down</div>
    </div>
  </div>
</template>

<script>
  export default {
    props: {
      step: Object
    },
    ready: function() {
      App.cable.subscriptions.create({ channel: "StepChannel", id: this.step.id})
    },
    methods: {
      last_step: function() {
        let steps = this.$parent.steps
        return steps[steps.length - 1].position === this.step.position
      },

      move_up: function() {
        $.post(Routes.move_up_step_path(this.step.id), () => {
          this.step.position -= 1;
          this.$parent.steps[this.step.position].position += 1;
          this.$parent.reorder();
        })
      },

      move_down: function() {
        $.post(Routes.move_down_step_path(this.step.id), () => {
          this.step.position += 1;
          this.$parent.steps[this.step.position].position -= 1;
          this.$parent.reorder();
        })
      }
    }
  }
</script>

<style lang="scss" scoped>
  .step-container {
    border: 1px solid black;
    height: 40px;

    .header {
      display: flex;
      height: 20px;

      .position,
      .name {
        margin-right: 2em
      }
    }
  }
</style>
