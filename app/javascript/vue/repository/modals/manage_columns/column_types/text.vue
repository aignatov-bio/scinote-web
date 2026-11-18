<template>
  <div class="flex items-center gap-2">
    <span class="sci-checkbox-container">
      <input type="checkbox"
             class="sci-checkbox"
             v-model="enforceUnique"
             data-e2e="e2e-CB-invItems-manageColumns-enforceUniqueEntries" />
      <span class="sci-checkbox-label"></span>
    </span>
    {{ i18n.t('repositories.unique_item_names.enforce_unique_entries') }}
  </div>
</template>

<script>
export default {
  name: 'TextColumnType',
  props: {
    column: { type: Object, default: null }
  },
  data() {
    return {
      enforceUnique: !!this.column?.cellRendererParams?.enforceUnique
    };
  },
  methods: {
    valid() {
      return true;
    },
    payload() {
      return { enforce_unique: this.enforceUnique };
    }
  }
};
</script>
