<script setup lang="ts">
import Versions from './components/Versions.vue'
</script>

<template>
  <div id="win">
    <Versions />
  </div>
</template>

<style>
#app {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}
:root {
  height: 100;
  width: 500;
}

#win {
  width: 500px;
  height: 350px;
  text-align: center;
  /* -webkit-app-region: drag; */
}

.draggable {
  /* -webkit-app-region: drag; */
  height: 200;
  width: 500;
}
</style>
