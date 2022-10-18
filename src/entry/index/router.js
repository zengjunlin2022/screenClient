/*
 * @Author: Ken.Tseng
 * @EMail: ken.zeng@innomactech.com
 * @Date: 2020-10-21 10:32:40
 * @LastEditors: Ken.Tseng
 * @LastEditTime: 2021-04-19 10:27:32
 * @FilePath: \20200419BCM\src\entry\index\router.js
 */
import Vue from "vue";
import Router from "vue-router";
// 首页
const Main = () => import(/* webpackChunkName: "index" */ "@/views/Main.vue");

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: "/",
      name: "Main",
      component: Main,
    },
    // {
    //   path: "/MyLottery",
    //   name: "MyLottery",
    //   component: MyLottery,
    // },
    // {
    //   path: "/PrizeIntro",
    //   name: "PrizeIntro",
    //   component: PrizeIntro,
    // },
    // {
    //   path: "/CouponDetail",
    //   name: "CouponDetail",
    //   component: CouponDetail,
    // },
    // {
    //   path: "/CntIntro",
    //   name: "CntIntro",
    //   component: CntIntro,
    // },
  ],
});
