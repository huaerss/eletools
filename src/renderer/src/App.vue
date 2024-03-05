<script setup lang="ts">
import Versions from './components/Versions.vue'

</script>

<template>
  <div class="draggable">
    <Versions />

  </div>
</template>

<style>
:root {
  height: 100;
  width: 500;
}

.draggable {
  -webkit-app-region: drag;
  height: 100;
  width: 500;
}
</style>
