<template>
  <div
    v-intersection-observer="[onIntersectionObserver, { rootMargin }]"
    :class="`${className || ''} ${isVisible ? 'in-screen' : 'out-of-screen'} ${
      firstVisible ? 'is-active' : 'is-inactive'
    }`"
    :id="elementId"
  >
    <slot v-if="show" />
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { vIntersectionObserver } from "@vueuse/components";

const isVisible = ref(false);
const rootMargin = "10%";
const firstVisible = ref(false);

function onIntersectionObserver([{ isIntersecting }]) {
  isVisible.value = isIntersecting;
  if (isIntersecting) firstVisible.value = true;
}

const props = defineProps({
  className: String,
  noSsr: Boolean,
  id: String, 
});

const show = computed(() => {
  if (!!props?.noSsr && !firstVisible.value) return false;
  return true;
});

const elementId = computed(() => {
  return props.id || `intersecting-${Math.random().toString(36).substr(2, 9)}`;
});
</script>