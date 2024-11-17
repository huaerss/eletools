<template>
  <router-view></router-view>
</template>

<style>
body {
  margin: 0;
  padding: 0;
  background: transparent;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* 禁用文本选择 */
.header,
.back-button,
.settings-button,
.close-button {
  user-select: none;
}
</style>
