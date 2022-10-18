import Vue from "vue";
import Vuex from "vuex";
// 持久化
import createPersistedState from "vuex-persistedstate";
// dayjs
import dayjs from "dayjs";

import utils from "@/utils/index.js";

Vue.use(Vuex);

export default new Vuex.Store({
  // 持久化插件
  plugins: [
    createPersistedState({
      storage: window.localStorage,
      // 選擇需要持久化的數據
      reducer: (val) => {
        return {
          XFL_SCREEN_ID: val.XFL_SCREEN_ID,
          XFL_SCREEN_CINNECTIONID: val.XFL_SCREEN_CINNECTIONID,
          XFL_ROUTE_CODE_LIST: val.XFL_ROUTE_CODE_LIST,
          XFL_ROUTE_LIST: val.XFL_ROUTE_LIST,
          XFL_ROUTE_COUNT: val.XFL_ROUTE_COUNT,
          socketToken: val.socketToken,
        };
      },
    }),
  ],
  state: {
    XFL_SCREEN_ID: null,
    XFL_SCREEN_CINNECTIONID: null,
    // 當前設置的路線總數
    XFL_ROUTE_COUNT: 0,
    // 路線
    XFL_ROUTE_CODE_LIST: [],
    // 班次
    XFL_ROUTE_LIST: [],
    // socket token
    socketToken: null,
  },
  mutations: {
    UPDATE_SOCKET_TOKEN(state, socketToken) {
      state.socketToken = socketToken;
    },
    UPDATE_XFL_SCREEN_ID(state, XFL_SCREEN_ID) {
      state.XFL_SCREEN_ID = XFL_SCREEN_ID;
      let routeArr = XFL_SCREEN_ID.split("@")[1].split("|");
      state.XFL_ROUTE_COUNT = routeArr.length;
    },
    UPDATE_XFL_SCREEN_CINNECTIONID(state, XFL_SCREEN_CINNECTIONID) {
      state.XFL_SCREEN_CINNECTIONID = XFL_SCREEN_CINNECTIONID;
    },
    UPDATE_XFL_ROUTE_LIST(state, socketRes) {
      /**
       * {
          "screen":"78@1A|17S|39",                //屏幕ID
          "action":"first_departure",                 //操作，first_trip:首班車提前5分鐘推送
          "route_code":"1A",                        //路線編號
          "bus_code":"",                            //車號,車號為空
          "bus_plate":"",                            //車牌號，車牌號為空
          "cur_plan_time":"2021-07-03 06:30:00",   //單前班次計劃發車時間
          "next_plan_time":"2021-07-03 06:45:00"   //下一班次計劃發車時間
        } 
       */
      let XFL_ROUTE_CODE_LIST = state.XFL_ROUTE_CODE_LIST;
      let XFL_ROUTE_LIST = state.XFL_ROUTE_LIST;
      let { route_code, bus_code, bus_plate, cur_plan_time, next_plan_time } =
        socketRes;

      let routeCode_idx = XFL_ROUTE_CODE_LIST.indexOf(route_code);
      if (socketRes.action == "first_departure") {
        // 首班車提前5分鐘後台【自動上屏】
        if (routeCode_idx == -1) {
          XFL_ROUTE_CODE_LIST.push(route_code);
          if (!XFL_ROUTE_LIST[routeCode_idx]) {
            XFL_ROUTE_LIST.push([]);
          }
        }
      } else if (socketRes.action == "start_departure") {
        // 電子更紙站長點擊【即將發車】
        if (routeCode_idx != -1) {
          if (!XFL_ROUTE_LIST[routeCode_idx]) {
            XFL_ROUTE_LIST.push([]);
          }
          // 檢測是否存在相同bus_code班次，如果有則更新，如果無則添加
          let start_busIdx = -1;
          // 根據車牌搜索班次的索引
          for (
            let start_index = 0;
            start_index < XFL_ROUTE_LIST[routeCode_idx].length;
            start_index++
          ) {
            const element = XFL_ROUTE_LIST[routeCode_idx][start_index];
            if (element.bus_code == bus_code) {
              start_busIdx = start_index;
              break;
            }
          }
          if (start_busIdx == -1) {
            // 如果存在路線，肯定存在 XFL_ROUTE_LIST 子數組
            XFL_ROUTE_LIST[routeCode_idx].push({
              route_code,
              bus_code,
              bus_plate,
              cur_plan_time,
              next_plan_time,
            });
          } else {
            Vue.set(XFL_ROUTE_LIST[routeCode_idx], start_busIdx, {
              route_code,
              bus_code,
              bus_plate,
              cur_plan_time,
              next_plan_time,
            });
          }
        } else {
          // 如果不存在路線
          // 增加路線
          XFL_ROUTE_CODE_LIST.push(route_code);
          XFL_ROUTE_LIST.push([
            {
              route_code,
              bus_code,
              bus_plate,
              cur_plan_time,
              next_plan_time,
            },
          ]);
        }

        // 排序
        this.commit("XFL_ROUTE_LIST_SORT");
      } else if (socketRes.action == "cancel_departure") {
        // 電子更紙站長點擊【取消發車】
        if (!XFL_ROUTE_LIST[routeCode_idx]) return;
        let cancel_busIdx = -1;
        // 根據車牌搜索班次的索引
        for (
          let cancel_index = 0;
          cancel_index < XFL_ROUTE_LIST[routeCode_idx].length;
          cancel_index++
        ) {
          const element = XFL_ROUTE_LIST[routeCode_idx][cancel_index];
          if (element.bus_code == bus_code) {
            cancel_busIdx = cancel_index;
            break;
          }
        }
        // 刪除查找到的對應班次
        if (cancel_busIdx != -1) {
          XFL_ROUTE_LIST[routeCode_idx].splice(cancel_busIdx, 1);
        }
        /**
         * 如果班次為0，路線則調整顯示位置，置底
         * 2021-08-19 保持與H5的路線排序一致， from 小明
         */
        // if (XFL_ROUTE_LIST[routeCode_idx].length == 0) {
        //   XFL_ROUTE_LIST.splice(routeCode_idx, 1);
        //   XFL_ROUTE_LIST.push([]);
        //   XFL_ROUTE_CODE_LIST.splice(routeCode_idx, 1);
        //   XFL_ROUTE_CODE_LIST.push(route_code);
        // }

        // 排序
        this.commit("XFL_ROUTE_LIST_SORT");
      } else if (socketRes.action == "end_departure") {
        // 電子更紙站長點擊【出站】
        if (!XFL_ROUTE_LIST[routeCode_idx]) return;
        // 如果出站班次與下一班次相隔>=30分鐘，刪除班次，刪除路線
        let end_busIdx = -1;
        // 根據車牌搜索班次的索引
        for (
          let end_index = 0;
          end_index < XFL_ROUTE_LIST[routeCode_idx].length;
          end_index++
        ) {
          const element = XFL_ROUTE_LIST[routeCode_idx][end_index];
          if (element.bus_code == bus_code) {
            end_busIdx = end_index;
            break;
          }
        }

        // 時間差
        let cur_plan_time = dayjs(socketRes.cur_plan_time);
        let next_plan_time = dayjs(socketRes.next_plan_time);
        let diffTime = next_plan_time.diff(cur_plan_time, "second");
        console.log(
          "diffTime++++++",
          diffTime,
          Number(config.CLEAR_TIMEOUT),
          Number(diffTime) >= Number(config.CLEAR_TIMEOUT)
        );
        // 如果當前班次與下一班次計劃發車時間>=1800秒(30分鐘)，刪除班次，刪除路線，否則只刪除班次
        if (Number(diffTime) >= Number(config.CLEAR_TIMEOUT)) {
          // 如果当前路线包含多辆即将发车的班次，则删除符合条件的班次
          if (XFL_ROUTE_LIST[routeCode_idx].length > 1) {
            XFL_ROUTE_LIST[routeCode_idx].splice(end_busIdx, 1);
          } else {
            // 刪除路線
            XFL_ROUTE_CODE_LIST.splice(routeCode_idx, 1);
            XFL_ROUTE_LIST.splice(routeCode_idx, 1);
          }
        } else {
          // 刪除查找到的對應班次
          if (end_busIdx != -1) {
            XFL_ROUTE_LIST[routeCode_idx].splice(end_busIdx, 1);
          }
          /**
           * 如果班次為0，路線則調整顯示位置，置底
           * 2021-08-19 保持與H5的路線排序一致， from Marcus
           */
          // if (XFL_ROUTE_LIST[routeCode_idx].length == 0) {
          //   XFL_ROUTE_LIST.splice(routeCode_idx, 1);
          //   XFL_ROUTE_LIST.push([]);
          //   XFL_ROUTE_CODE_LIST.splice(routeCode_idx, 1);
          //   XFL_ROUTE_CODE_LIST.push(route_code);
          // }
        }

        // 排序
        this.commit("XFL_ROUTE_LIST_SORT");
      } else if (socketRes.action == "recovery") {
        // console.log(XFL_ROUTE_LIST[routeCode_idx].length);
        // 如果查找的数据为 -1 return 避免报错
        if (!XFL_ROUTE_LIST[routeCode_idx]) return;
        // 電子更紙站長點擊【收車】 刪除班次，刪除路線
        if (XFL_ROUTE_LIST[routeCode_idx].length == 0) {
          // 如果班次長度為0，刪除路線
          XFL_ROUTE_CODE_LIST.splice(routeCode_idx, 1);
          XFL_ROUTE_LIST.splice(routeCode_idx, 1);
        } else if (XFL_ROUTE_LIST[routeCode_idx].length == 1) {
          // 如果班次長度為1，並且找到對應收車班次，刪除路線，刪除班次，否則不做處理
          let recovery_busIdx = -1;
          // 根據車牌搜索班次的索引
          for (
            let recovery_index = 0;
            recovery_index < XFL_ROUTE_LIST[routeCode_idx].length;
            recovery_index++
          ) {
            const element = XFL_ROUTE_LIST[routeCode_idx][recovery_index];
            if (element.bus_code == bus_code) {
              recovery_busIdx = recovery_index;
              break;
            }
          }
          if (recovery_busIdx != -1) {
            XFL_ROUTE_LIST.splice(routeCode_idx, 1);
            XFL_ROUTE_CODE_LIST.splice(routeCode_idx, 1);
          }
        } else if (XFL_ROUTE_LIST[routeCode_idx].length >= 1) {
          // 如果班次長度大於1，刪除對應班次
          let recovery_busIdx_2 = -1;
          // 根據車牌搜索班次的索引
          for (
            let recovery_index_2 = 0;
            recovery_index_2 < XFL_ROUTE_LIST[routeCode_idx].length;
            recovery_index_2++
          ) {
            const element = XFL_ROUTE_LIST[routeCode_idx][recovery_index_2];
            if (element.bus_code == bus_code) {
              recovery_busIdx_2 = recovery_index_2;
              break;
            }
          }
          // 刪除查找到的對應班次
          if (recovery_busIdx_2 != -1) {
            XFL_ROUTE_LIST[routeCode_idx].splice(recovery_busIdx_2, 1);
          }
        }
      }
    },
    // 排序
    XFL_ROUTE_LIST_SORT(state) {
      let XFL_ROUTE_CODE_LIST = JSON.parse(
        JSON.stringify(state.XFL_ROUTE_CODE_LIST)
      );
      let XFL_ROUTE_LIST = JSON.parse(JSON.stringify(state.XFL_ROUTE_LIST));
      // 初步處理數據
      XFL_ROUTE_LIST.map((item, idx) => {
        let cur_plan_time_stmp = new Date("0001-01-01 00:00:00").getTime();
        if (item.length > 0) {
          // 處理班次計劃時間
          if (item[0] && item[0].hasOwnProperty("cur_plan_time")) {
            cur_plan_time_stmp = new Date(item[0].cur_plan_time).getTime();
          }
          item[0].cur_plan_time_stmp = cur_plan_time_stmp;
          // 處理route_code_forsort 字段，僅用於排序
          item[0].route_code_forsort =
            XFL_ROUTE_CODE_LIST[idx] != null ? XFL_ROUTE_CODE_LIST[idx] : "";
        } else {
          item.push({
            cur_plan_time_stmp: cur_plan_time_stmp,
            route_code_forsort:
              XFL_ROUTE_CODE_LIST[idx] != null ? XFL_ROUTE_CODE_LIST[idx] : "",
          });
        }
        return item;
      });
      /**
       * 排序 與H5保持一致
       * 2021-08-19 按 計劃發車時間 倒序
       */
      XFL_ROUTE_LIST.sort((a, b) => {
        // 2021-08-24 调整排序
        if (a[0].cur_plan_time_stmp != b[0].cur_plan_time_stmp) {
          return b[0].cur_plan_time_stmp - a[0].cur_plan_time_stmp;
        } else {
          console.log(
            `b[0].route_code_forsort:${
              b[0].route_code_forsort
            }  a[0].route_code_forsort:${
              a[0].route_code_forsort
            }  ${b[0].route_code_forsort.localeCompare(
              a[0].route_code_forsort
            )}`
          );
          return b[0].route_code_forsort.localeCompare(a[0].route_code_forsort);
        }
      });

      // console.log(`XFL_ROUTE_LIST:::::::`, JSON.stringify(XFL_ROUTE_LIST));

      // 更新 XFL_ROUTE_CODE_LIST
      let update_xfl_route_code_list = [];
      for (let i = 0; i < XFL_ROUTE_LIST.length; i++) {
        let item = XFL_ROUTE_LIST[i];
        if (item[0]) {
          let _idx = XFL_ROUTE_CODE_LIST.indexOf(item[0].route_code_forsort);
          if (_idx != -1) {
            // 如果找到,XFL_ROUTE_CODE_LIST中刪除
            XFL_ROUTE_CODE_LIST.splice(_idx, 1);
          }
          // 新數組push記錄
          if (
            item[0].route_code_forsort != null &&
            item[0].route_code_forsort != ""
          ) {
            update_xfl_route_code_list.push(item[0].route_code_forsort);
          }

          // if (item[0].route_code != XFL_ROUTE_CODE_LIST[i]) {
          //   Vue.set(XFL_ROUTE_CODE_LIST, i, item[0].route_code);
          // }
        }
      }
      // 新數據與原數據合併
      update_xfl_route_code_list =
        update_xfl_route_code_list.concat(XFL_ROUTE_CODE_LIST);
      state.XFL_ROUTE_CODE_LIST = JSON.parse(
        JSON.stringify(update_xfl_route_code_list)
      );

      // 刪除 XFL_ROUTE_LIST 只包含 route_code_forsort 的元素
      XFL_ROUTE_LIST.map((item) => {
        item.map((subItem, idx) => {
          if (!subItem.hasOwnProperty("bus_code")) {
            item.splice(idx, 1);
          }
        });
        return item;
      });
      state.XFL_ROUTE_LIST = JSON.parse(JSON.stringify(XFL_ROUTE_LIST));
    },
    // 刪除包含701的路線
    REMOVE_701(state) {
      let XFL_ROUTE_CODE_LIST = state.XFL_ROUTE_CODE_LIST;
      let XFL_ROUTE_LIST = state.XFL_ROUTE_LIST;
      for (let i = XFL_ROUTE_CODE_LIST.length - 1; i >= 0; i--) {
        if (XFL_ROUTE_CODE_LIST[i].indexOf("701") != -1) {
          XFL_ROUTE_CODE_LIST.splice(i, 1);
          XFL_ROUTE_LIST.splice(i, 1);
        }
      }
    },
    // 刪除不包含701的路線
    REMOVE_NOT_701(state) {
      let XFL_ROUTE_CODE_LIST = state.XFL_ROUTE_CODE_LIST;
      let XFL_ROUTE_LIST = state.XFL_ROUTE_LIST;
      for (let i = XFL_ROUTE_CODE_LIST.length - 1; i >= 0; i--) {
        if (XFL_ROUTE_CODE_LIST[i].indexOf("701") == -1) {
          XFL_ROUTE_CODE_LIST.splice(i, 1);
          XFL_ROUTE_LIST.splice(i, 1);
        }
      }
    },
    // 刪除所有班次
    CLEAR_ALL_ROUTES(state) {
      state.XFL_ROUTE_CODE_LIST.splice(0, state.XFL_ROUTE_CODE_LIST.length);
      state.XFL_ROUTE_LIST.splice(0, state.XFL_ROUTE_LIST.length);
    },
  },
  actions: {},
});
