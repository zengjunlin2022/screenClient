var config = {
  appMode: "uat",
  appTitle: "新福利路線發車信息",
  //檢測超時未發車班次頻率，單位：秒
  INTERVAL: 5,
  //定時清理超時未發車班次，單位:秒
  CLEAR_TIMEOUT: 1800,
  // 检测班次间隔
  CHECK_TIMEOUT: 600,
  // 请求地址
  BASE_URL: "https://rsoss-transmac.oss-cn-hongkong.aliyuncs.com/screenClient",
  // 靜態資源更新週期時間，單位秒
  ASSETS_UPDATE_TIME: 600,
  // websocketUrl
  WEBSOCKET_DOMAIN: "10.3.2.111:8555",
  WS_USERNAME: "routeScreen",
  WS_PWD: "123456",
};
