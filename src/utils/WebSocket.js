import axios from "axios";
import WebsocketHeartbeatJs from "websocket-heartbeat-js";
import dayjs from "dayjs";
import store from "../store";
import Vue from "vue";
const v = new Vue();
/**
 *  websocket 服務
 */

window.MoWebSocket = null;

export default class WebSocketService {
  async init(stop_id) {
    let that = this;
    let now = new Date();
    let socketToken = await that.getSocketToken(
      config.WS_USERNAME,
      config.WS_PWD,
      stop_id
    );
    if (socketToken == null) {
      v.$message({
        message: "SocketToken獲取失敗",
        type: "warning",
      });
      return;
    }
    // 啟動websocket鏈接，同時連接mobileOffice與routeScreen服務
    window.MoWebSocket = new WebsocketHeartbeatJs({
      url: `ws://${config.WEBSOCKET_DOMAIN}/websocket/init/${socketToken}`,
      pingMsg: JSON.stringify({
        evenType: "heartbeat",
        data: {
          time: dayjs(now).format("YYYY-MM-DD HH:mm:ss"),
          timeValue: now.getTime(),
        },
        fromUsername: config.WS_USERNAME,
        toUsername: "server",
        token: socketToken,
      }),
      repeatLimit: 10,
      pongTimeout: 60000,
    });

    window.MoWebSocket.onopen = function () {
      console.log("open");
    };

    window.MoWebSocket.onclose = function () {
      console.log("RouteScreen Socket Close");
    };
  }

  // Token過期重新鏈接
  async reConnect() {
    console.log("socketToken過期，重新鏈接");
    this.webSocketClose();
    await this.init(store.state.XFL_SCREEN_ID);
  }
  // 獲取socketToken
  async getSocketToken(userName, password, stop_id) {
    let socketToken = store.state.socketToken;
    if (socketToken) {
      return socketToken.token;
    }
    try {
      let res = await axios.post(
        `http://${config.WEBSOCKET_DOMAIN}/websocket/user/login`,
        {
          username: userName,
          password: password,
          sub: stop_id,
        }
      );
      if (res.data.code == 200) {
        // 保存socketToken
        store.commit("UPDATE_SOCKET_TOKEN", { token: res.data.data });
        return res.data.data;
      } else {
        console.log(res.data.msg);
        store.commit("UPDATE_SOCKET_TOKEN", null);
        return null;
      }
    } catch (error) {
      console.log(error);
      store.commit("UPDATE_SOCKET_TOKEN", null);
      return null;
    }
  }

  // 斷開socket鏈接
  webSocketClose() {
    console.log("關閉socket");
    // close websocket
    if (window.MoWebSocket != null) window.MoWebSocket.close();
    window.MoWebSocket = null;
    // clear socketToken
    store.commit("UPDATE_SOCKET_TOKEN", null);
  }
}
