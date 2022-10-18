/*
 * @Author: Ken.Tseng
 * @EMail: ken.zeng@innomactech.com
 * @Date: 2021-03-17 16:39:24
 * @LastEditors: Ken.Tseng
 * @LastEditTime: 2021-04-19 10:29:12
 */

import "babel-polyfill";
import Es6Promise from "es6-promise";
Es6Promise.polyfill();

import Vue from "vue";
import App from "./App.vue";
import router from "./router";
// vuex store
import store from "@/store";

Vue.config.productionTip = false;

/**
 * elementUI
 */
import "@/plugins/elementUI";

import animated from "animate.css";
Vue.use(animated);

// 测试
if (process.env.NODE_ENV == "development") {
  const VConsole = require("vconsole");
  new VConsole();
  console.log("vconsole is ready");
}

new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount("#app");
