<script setup>
import { computed } from 'vue'
import { HugeiconsIcon } from '@hugeicons/vue'
import { icons, iconStrokeWidth } from './icons.js'

const props = defineProps({ name: { type: String, default: 'spark' } })
// Unknown names (including inherited Object keys) always render a safe fallback.
const icon = computed(() => Object.hasOwn(icons, props.name) ? icons[props.name] : icons.spark)
</script>

<template>
  <HugeiconsIcon class="ui-icon" :icon="icon" :size="24" color="currentColor"
    :stroke-width="iconStrokeWidth" aria-hidden="true" focusable="false" />
</template>
