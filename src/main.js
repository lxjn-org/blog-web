import { createApp } from 'vue'
import App from './App.vue'
import 'ant-design-vue/dist/antd.css';
import { Button } from 'ant-design-vue';
let app = createApp(App);
app.use(Button);
app.mount('#app')

// app.use(store).use(router).mount('#app')