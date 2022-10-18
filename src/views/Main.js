import screenfull from "screenfull";
// request
import axios from "axios";
// vuex
import { mapState } from "vuex";
import utils from "@/utils/index.js";
import dayjs from "dayjs";
import WebSocketService from "@/utils/WebSocket";

export default {
  name: "Main",
  data() {
    return {
      proxy: null,
      timer: "",
      isFullscreen: false,
      isOnline: true,
      delrouteVisible: false,
      settingVisible: false,
      labelPosition: "top",
      formData: {
        stationCode: "",
        routeCodeArr: [],
        screenNo: "1",
        // routeCode1: "",
        // routeCode2: "",
        // routeCode3: "",
      },
      routeCodeInput: "",
      routeCodeInputVisible: false,
      // 靜態公共資源
      globalAssets: null,
      // 更新圖片資源timer
      ASSETS_TIMER: null,
      // 輪播廣告
      Ads: null,
      // Ad輪播
      AD_TIMER: null,
      // Ad輪播 index
      AD_IDX: 0,
      // 視頻播放器
      VideoPlayer: null,
    };
  },
  async mounted() {
    let that = this;
    let webSocketService = new WebSocketService();

    // 更新資源路徑
    that.updateAssets();
    // 註冊按鍵監聽
    that.registerEvents();

    // 鏈接websocket
    if (window.MoWebSocket == null && that.XFL_SCREEN_ID) {
      await webSocketService.init(that.XFL_SCREEN_ID);
      if (window.MoWebSocket) window.MoWebSocket.onmessage = that.renderRoutes;
    }

    // 定時更新靜態資源
    that.updateAssetsLoop();

    // 檢測時間，重置數據
    that.resetRoutes();

    // 測試用
    if (
      config.appMode == "dev" ||
      config.appMode == "localdev" ||
      config.appMode == "sit"
    ) {
      // v2 测试代码
      // 5分钟前上屏
      // window.renderRoutes({action:'first_departure',screen:'78@1A|17S|39',"route_code":"1A","bus_code":"","bus_plate":"","cur_plan_time":"2021-07-03 06:30:00","next_plan_time":"2021-07-03 06:45:00"})
      // 即将发车
      // window.renderRoutes({action:'start_departure',screen:'78@1A|17S|39',"route_code":"1A","bus_code":"R270","bus_plate":"MK4060","cur_plan_time":"2021-07-03 06:30:00","next_plan_time":"2021-07-03 06:45:00"})
      // 取消發車
      // window.renderRoutes({action:'cancel_departure',screen:'78@1A|17S|39',"route_code":"1A","bus_code":"R270","bus_plate":"MK4060","cur_plan_time":"2021-07-03 06:30:00","next_plan_time":"2021-07-03 06:45:00"})
      // 出站
      // window.renderRoutes({action:'end_departure',screen:'78@1A|17S|39',"route_code":"1A","bus_code":"R270","bus_plate":"MK4060","cur_plan_time":"2021-07-03 06:30:00","next_plan_time":"2021-07-03 06:45:00"})
      // 收車
      // window.renderRoutes({action:'recovery',screen:'78@1A|17S|39',"route_code":"1A","bus_code":"R270","bus_plate":"MK4060","cur_plan_time":"2021-07-03 06:30:00","next_plan_time":""})
      window.renderRoutes = that.renderRoutes;
      window.resetRoutes = that.resetRoutes;
    }
  },
  watch: {
    isWaiting: function (newVal, oldVal) {
      let that = this;
      if (newVal == false) {
        // 獲取Ads
        // that.getAds();
        that.AdModuleSlider();
      } else {
        // 清空AdModule定時器，停止輪播
        that.ClearAdModuleSlider();
      }
    },
  },
  computed: {
    ...mapState([
      "XFL_SCREEN_ID",
      "XFL_SCREEN_CINNECTIONID",
      "XFL_ROUTE_CODE_LIST",
      "XFL_ROUTE_LIST",
      "XFL_ROUTE_COUNT",
    ]),
    // 是否有班次待發車
    isWaiting() {
      let that = this;
      let XFL_ROUTE_LIST = that.XFL_ROUTE_LIST;
      // console.log("computed isWaiting", XFL_ROUTE_LIST.length);
      // 檢測是否存在待發車班次
      let count = 0;
      for (let index = 0; index < XFL_ROUTE_LIST.length; index++) {
        const element = XFL_ROUTE_LIST[index];
        if (element) {
          count += element.length;
        }
      }
      // console.log("computed isWaiting count", count);
      if (count > 0) {
        return true;
      } else {
        return false;
      }
    },
    routeList() {
      let that = this;
      let XFL_ROUTE_LIST = that.XFL_ROUTE_LIST;
      let arr = [];
      for (let i = 0; i < XFL_ROUTE_LIST.length; i++) {
        const ele = XFL_ROUTE_LIST[i];
        if (ele.length > 0) {
          for (let k = 0; k < ele.length; k++) {
            const subEle = ele[k];
            arr.push(subEle);
          }
        }
      }
      return arr;
    },
  },
  beforeDestroy() {
    let that = this;
    let webSocketService = new WebSocketService();
    webSocketService.webSocketClose();
    clearTimeout(that.timer);
  },
  methods: {
    handleRouteCodeDel(idx) {
      let that = this;
      that.formData.routeCodeArr.splice(idx, 1);
    },

    showRouteCodeInput() {
      let that = this;
      that.routeCodeInputVisible = true;
      that.$nextTick((_) => {
        that.$refs.saveTagInput.$refs.input.focus();
      });
    },

    handleRouteCodeInputConfirm() {
      let that = this;
      let routeCodeInput = that.routeCodeInput.replace(/ /g, "");
      if (String(routeCodeInput).length > 0) {
        let fidx = that.formData.routeCodeArr.findIndex((item) => {
          return (
            String(item).toLocaleUpperCase() ==
            String(routeCodeInput).toLocaleUpperCase()
          );
        });
        if (fidx != -1) {
          that.$message({
            message: `存在重複路線 ${routeCodeInput}`,
            type: "warning",
          });
          return;
        }
        that.formData.routeCodeArr.push(
          String(routeCodeInput).toLocaleUpperCase()
        );
      }
      that.routeCodeInputVisible = false;
      that.routeCodeInput = "";
    },
    // 清除 AdModule 輪播
    ClearAdModuleSlider() {
      let that = this;
      clearTimeout(that.AD_TIMER);
      that.AD_TIMER = null;
      that.AD_IDX = 0;
      that.$refs["AdsCarousel"].setActiveItem(0);
      console.log("ClearAdModuleSlider");
      //   停止視頻播放
      if (that.VideoPlayer) {
        that.VideoPlayer.pause();
        that.VideoPlayer = null;
      }
    },
    // AdModule 輪播
    AdModuleSlider() {
      let that = this;
      if (that.isWaiting) return;
      if (that.AD_TIMER) return;
      // 視頻控制
      that.VideoCtrl();
      // 輪播時間
      let timeout = that.Ads[that.AD_IDX].playSec * 1000;
      // console.log("AdModuleSlider timeout", timeout);
      that.AD_TIMER = setTimeout(() => {
        // console.log("AdModuleSlider Run");
        if (that.$refs["AdsCarousel"]) {
          that.$refs["AdsCarousel"].next();
        }
        clearTimeout(that.AD_TIMER);
        that.AD_TIMER = null;
      }, timeout);
    },
    // AdModule change
    AdModuleChangeAction(e) {
      let that = this;
      console.log("AdModuleChangeAction：", e);
      that.AD_IDX = e;
      // AdModule 輪播
      that.AdModuleSlider();
    },
    // 視頻控制
    VideoCtrl() {
      let that = this;
      let item = that.Ads[that.AD_IDX];
      if (that.VideoPlayer) {
        that.VideoPlayer.pause();
        that.VideoPlayer.currentTime = 0;
        that.VideoPlayer = null;
      }
      if (item.type == "video") {
        that.$nextTick(() => {
          that.VideoPlayer = that.$refs[item.refName][0];
          //   延時操作視頻播放
          setTimeout(() => {
            that.VideoPlayer.currentTime = 0;
            let playPromise = that.VideoPlayer.play();
            that.VideoPlayer.muted = true;
            /**
             * 根據配置文件，如果設置靜音則不會播放聲音
             * fixed 播放視頻默認開啟聲音會被屏蔽，先設置靜音等待視頻播放後再打開音頻
             */
            if (item.muted == false && playPromise) {
              playPromise
                .then(() => {
                  that.VideoPlayer.muted = false;
                })
                .catch((err) => {});
            }
          }, 1000);
        });
      }
    },
    // 更新靜態資源
    updateAssets() {
      let that = this;
      that.globalAssets = {
        baseUrl: `${config.BASE_URL}`,
        ads: `${config.BASE_URL}/ads/ads.json`,
      };
      // 獲取Ads
      that.getAds();
    },
    // 定時更新靜態資源循環方法
    updateAssetsLoop() {
      let that = this;
      that.ASSETS_TIMER = setTimeout(() => {
        that.updateAssets();
        clearTimeout(that.ASSETS_TIMER);
        that.ASSETS_TIMER = null;
        that.updateAssetsLoop();
      }, config.ASSETS_UPDATE_TIME * 1000);
    },
    // 註冊按鍵監聽
    registerEvents() {
      let that = this;
      $(document).on("keydown", (e) => {
        //var e = event || window.event || arguments.callee.caller.arguments[0];
        if (e && e.keyCode == 113) {
          that.clickDelroute();
        }
        if (e && e.keyCode === 121) {
          that.settingVisible = true;
        }
        if (e && e.keyCode == 122) {
          e.preventDefault();
          var el = document.documentElement;
          var rfs =
            el.requestFullScreen ||
            el.webkitRequestFullScreen ||
            el.mozRequestFullScreen ||
            el.msRequestFullScreen; //定义不同浏览器的全屏API
          if (typeof rfs != "undefined" && rfs) {
            rfs.call(el);
          } else if (typeof window.ActiveXObject != "undefined") {
            var wscript = new ActiveXObject("WScript.Shell");
            if (wscript != null) {
              wscript.SendKeys("{F11}");
            }
          }
        }
      });
      document.addEventListener(
        "fullscreenchange",
        () => {
          console.log(
            "fullscreenchange",
            document.fullscreen ? "true" : "false"
          );
          that.isFullscreen = document.fullscreen;
        },
        false
      );

      document.addEventListener(
        "mozfullscreenchange",
        () => {
          console.log(
            "mozfullscreenchange",
            document.mozFullScreen ? "true" : "false"
          );
          that.isFullscreen = document.mozFullScreen;
        },
        false
      );

      document.addEventListener(
        "webkitfullscreenchange",
        () => {
          console.log(
            "webkitfullscreenchange",
            document.webkitIsFullScreen ? "true" : "false"
          );
          that.isFullscreen = document.webkitIsFullScreen;
        },
        false
      );

      document.addEventListener(
        "msfullscreenchange",
        () => {
          console.log(
            "msfullscreenchange",
            document.msFullscreenElement ? "true" : "false"
          );
          that.isFullscreen = document.webkitIsFullScreen;
        },
        false
      );

      //网络由异常到正常时触发
      window.addEventListener("online", () => {
        console.log(
          "network online",
          utils.dateFormat("YYYY-mm-dd HH:MM:SS", new Date())
        );
        that.isOnline = true;
        that.connectSingalR();
      });

      //网络由正常常到异常时触发
      window.addEventListener("offline", () => {
        console.log(
          "network offline",
          utils.dateFormat("YYYY-mm-dd HH:MM:SS", new Date())
        );
        that.isOnline = false;
      });
    },

    // 班次刪除
    clickDelroute() {
      let that = this;
      let local_routes = that.XFL_ROUTE_LIST;
      if (local_routes == null || local_routes.length == 0) {
        that.$message({
          message: "暫無待發車班次",
          type: "warning",
        });
        return;
      }
      //   顯示班次刪除彈出層
      that.delrouteVisible = true;
    },
    // 設置
    clickSetting() {
      let that = this;
      that.settingVisible = true;
    },
    // 全屏
    clickFullscreen() {
      if (screenfull.isEnabled) {
        screenfull.request();
      }
    },
    setStationRoutes(screen_id) {
      let that = this;
      let station_code = screen_id.split("@")[0];
      let route_codes = [];
      let screenNo = "1";
      if (screen_id.split("@")[1].indexOf("_") != -1) {
        route_codes = screen_id.split("@")[1].split("_")[0].split("|");
        screenNo = screen_id.split("@")[1].split("_")[1];
      } else {
        route_codes = screen_id.split("@")[1].split("|");
      }

      that.formData.stationCode = station_code;
      that.formData.routeCodeArr = route_codes;
      that.formData.screenNo = screenNo;
    },
    // setConnectionId(connectionId) {
    //   let that = this;
    //   that.$store.commit("UPDATE_XFL_SCREEN_CINNECTIONID", connectionId);
    // },
    async saveScreenId() {
      let that = this;
      if (that.formData.stationCode.trim() == "") {
        that.$message({
          message: "請填寫站頭編號",
          type: "warning",
        });
        return;
      }
      if (that.formData.routeCodeArr.length == 0) {
        that.$message({
          message: "至少填寫一個路線編號",
          type: "warning",
        });
        return;
      }

      // 清除空格
      that.formData.routeCodeArr.map((item) => {
        item = String(item).trim();
        return item;
      });
      that.formData.stationCode = String(that.formData.stationCode).trim();
      that.formData.screenNo = String(that.formData.screenNo).trim();

      let screenId = `${
        that.formData.stationCode
      }@${that.formData.routeCodeArr.join("|")}_${that.formData.screenNo}`;

      that.$message({
        message: "保存成功",
        type: "success",
      });
      that.$store.commit("UPDATE_XFL_SCREEN_ID", screenId);
      that.settingVisible = false;

      // 鏈接websocket
      let webSocketService = new WebSocketService();
      webSocketService.webSocketClose();
      if (window.MoWebSocket == null) {
        await webSocketService.init(screenId);
        if (window.MoWebSocket) {
          window.MoWebSocket.onmessage = that.renderRoutes;
        }
      }
    },
    // 渲染發車班次
    async renderRoutes(e) {
      let that = this;
      let webSocketService = new WebSocketService();
      let res = JSON.parse(e.data);
      console.log(
        "renderRoutes",
        utils.dateFormat("YYYY-mm-dd HH:MM:SS", new Date()),
        res
      );
      if (res.code != 200 && res.code != 1) {
        // 處理token過期
        if (res.code == 500) {
          // reconnect websocket
          await webSocketService.reConnect();
          window.MoWebSocket.onmessage = that.renderRoutes;
          return;
        }
        console.log(res.msg);
        return;
      }

      if (
        res.code == 200 &&
        res.hasOwnProperty("data") &&
        res.hasOwnProperty("evenType") &&
        res.evenType == "routeScreen"
      ) {
        let json = res.data.message;
        let { stop_id, route_code } = json;
        let localStopId = that.XFL_SCREEN_ID.split("@")[0];
        if (
          localStopId == stop_id &&
          that.XFL_SCREEN_ID.indexOf(route_code) > -1
        ) {
          // 增減邏輯在 store實現
          that.$store.commit("UPDATE_XFL_ROUTE_LIST", json);
        }
      }
    },
    dialogOpened() {
      let that = this;
      let screen_id = that.XFL_SCREEN_ID;
      if (
        screen_id != null &&
        screen_id != undefined &&
        screen_id != "" &&
        screen_id.indexOf("@") > -1
      ) {
        that.setStationRoutes(screen_id);
      }
    },
    handleDelete(index, row) {
      let that = this;
      //console.log(index,row)
      let route_code = row[0].route_code;
      let bus_code = row[0].bus_code;
      let bus_plate = row[0].bus_plate;
      let message = `是否將路線：${route_code}， 車牌：${bus_plate}的班次刪除？`;
      that
        .$confirm(message, "提示", {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          customClass: "del-confirm",
          type: "",
        })
        .then(() => {
          let local_routes = that.XFL_ROUTE_LIST;
          if (local_routes != null && local_routes.length > 0) {
            // 更新store
            that.$store.commit("UPDATE_XFL_ROUTE_LIST", {
              action: "recovery",
              bus_code: bus_code,
              route_code: route_code,
            });
            that.delrouteVisible = false;
            that.$message({
              type: "success",
              message: "刪除成功!",
            });
          } else {
            that.$message({
              type: "warning",
              message: "暫無待發車班次!",
            });
          }
        })
        .catch((err) => {
          console.log(
            "班次刪除 error:",
            utils.dateFormat("YYYY-mm-dd HH:MM:SS", new Date()),
            err
          );
        });
    },
    // 獲取廣告ads數據
    async getAds() {
      let that = this;
      // console.log("getAds");
      let res = await axios.request({
        method: "get",
        url: `${that.globalAssets.ads}?t=${new Date().getTime()}`,
      });
      if (res.status == 200) {
        that.Ads = res.data.map((item, idx) => {
          // 調整靜態資源路徑
          item.name = `${config.BASE_URL}${item.name}`;
          // 添加ref name
          item.refName = "video_" + idx;
          return item;
        });
      }

      // AdModule 輪播
      if (that.isWaiting == false) {
        that.AdModuleSlider();
      }
    },
    /**
     * 重置數據
     * 包含701字符串的路線是00:00清除，其他路線都是04:00清除
     */
    resetRoutes() {
      let that = this;
      let nowHour = dayjs().hour();
      if (nowHour == 0) {
        console.log(
          "當前時間為0點，清空包含701路線以及班次",
          utils.dateFormat("YYYY-mm-dd HH:MM:SS", new Date())
        );
        // 清除包含701字符串的路線
        that.$store.commit("REMOVE_701");
      }
      if (nowHour == 4) {
        console.log(
          "當前時間為4點，清空其他路線",
          utils.dateFormat("YYYY-mm-dd HH:MM:SS", new Date())
        );
        that.$store.commit("REMOVE_NOT_701");
      }
      clearTimeout(that.timer);
      that.timer = setTimeout(() => {
        that.resetRoutes();
      }, config.CHECK_TIMEOUT * 1000);
    },
  },
};
