<template>
  <div class="inline-editing-container inline-init-handler"
    v-bind:data-field-to-update="field_to_update"
    v-bind:data-item-id="item_id"
    v-bind:data-path-to-update="url"
    v-bind:data-original-name="initial_value"
    v-bind:data-placeholder='placeholder'
    data-params-group="inline"
  >
    <div class="view-mode" v-bind:data-placeholder='placeholder'>{{initial_value}}</div>
    <input v-bind:placeholder="placeholder" class="hidden input-field" type="text" v-bind:value="initial_value" disabled/>
    <div class="button-container">
      <span class="save-button"><i class="fas fa-check"></i></span>
      <span class="cancel-button"><i class="fas fa-times"></i></span>
    </div>
    <span class="error-block"></span>
  </div>

</template>

<script>
  export default {
    props: [
        'item_id',
        'field_to_update',
        'url',
        'initial_value',
        'placeholder',
        'edit_mode'
    ]
  }
</script>
