/*
 * @Author: Ken.Tseng
 * @EMail: ken.zeng@innomactech.com
 * @Date: 2020-08-19 17:12:02
 * @LastEditors: Ken.Tseng
 * @LastEditTime: 2020-08-26 19:42:22
 * @FilePath: \氣球模板-1\postcss.config.js
 */
module.exports = {
  plugins: {
    "postcss-import": {},
    "postcss-url": {},
    "postcss-aspect-ratio-mini": {},
    "postcss-write-svg": {
      utf8: false,
    },
    "postcss-cssnext": {
      features: {
        customProperties: {
          warnings: false,
        },
      },
    },
    "postcss-px-to-viewport": {
      viewportWidth: 1920, // 视窗的宽度，对应的是我们设计稿的宽度，一般是750（如果我们设置的宽度是300px，那么编译之后的宽度为(300/750*100)=40vw,如果频宽实际为375px，那么该元素的宽度为（375*0.4）= 150px）
      viewportHeight: 1080, // 视窗的高度，根据750设备的宽度来指定，一般指定1334，也可以不配置
      unitPrecision: 3, // 指定`px`转换为视窗单位值的小数位数
      viewportUnit: "vw", //指定需要转换成的视窗单位，建议使用vw
      fontViewportUnit: "vw", // 指定字体需要转换成的视窗单位，默认vw
      selectorBlackList: [".ignore", ".hairlines", "weui"], // 指定不转换为视窗单位的类，可以自定义，可以无限添加,建议定义一至两个通用的类名
      minPixelValue: 1, // 小于或等于`1px`不转换为视窗单位，你也可以设置为你想要的值
      mediaQuery: true, // 允许在媒体查询中转换`px`
    },
    "postcss-viewport-units": {
      silence: true,
    },
    cssnano: {
      // preset: "advanced",
      // autoprefixer: false,
      // "postcss-zindex": false
      "cssnano-preset-advanced": {
        zindex: false,
        autoprefixer: false,
      },
    },
  },
};
