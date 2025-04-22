<template>
  <div ref="modal" class="modal" tabindex="-1" role="dialog">
    <div class="modal-dialog" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <button type="button" class="close" data-dismiss="modal" aria-label="Close">
            <i class="sn-icon sn-icon-close"></i>
          </button>
          <h4 class="modal-title truncate !block" :title="object.name">
            {{ object.name }}
          </h4>
        </div>
        <div class="modal-body">
          <div v-if="object.permissions.manage">
          </div>
          <div v-else v-html="description"></div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-primary" data-dismiss="modal">{{ i18n.t('general.close') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>

import modalMixin from '../../modal_mixin';
import Tinymce from '../../tinymce.vue';

export default {
  name: 'DescriptionModal',
  props: {
    object: Object
  },
  components: {
    Tinymce
  },
  data() {
    return {
      description: this.object.description,
    };
  },
  mixins: [modalMixin],
  methods: {
    updateDescription(newDescription) {
      console.log('Description updated:', newDescription);
      this.description = newDescription;
      this.$emit('update');
      this.$emit('close');
    }
  },
};
</script>
