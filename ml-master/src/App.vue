<template>

  <div class="full">
    <sui-container class="main">
      <AllDevices />
      <DataInput />
      <ActionOutput />
    </sui-container>
  </div>

</template>

<script>
import AllDevices from './components/AllDevices.vue'
import DataInput from './components/DataInput.vue'
import ActionOutput from './components/ActionOutput.vue'

export default {
  name: 'App',

  components: {
    AllDevices,
    DataInput,
    ActionOutput
  }
}
</script>

<style>
.full {
  width: 100%;
  height: 100%;
}

.main {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin-top: 60px !important;
}

.main>.segment:nth-child(n+1) {
  margin-top: 60px !important;
}

.main>.segment:last-child {
  margin-bottom: 60px !important;
}
</style>
