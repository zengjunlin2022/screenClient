const path = require("path");
const utils = {
  assetsPath: function(_path) {
    const assetsSubDirectory =
      process.env.NODE_ENV === "production" // 生产环境下的 static 路径
        ? "static" // 开发环境下的 static 路径
        : "static";

    return path.posix.join(assetsSubDirectory, _path);
  },
  resolve: function(dir) {
    return path.join(__dirname, "..", dir);
  },
  proxy: function(mode) {
    switch (mode) {
      case "sit":
        return {
          "/": {
            // SIT
            target: "http://14.29.69.182:40223",
            ws: false,
            changeOrigin: true,
            pathRewrite: { "^/": "" },
          },
        };
      case "dev":
        return {
          "/": {
            // dev
            target: "http://10.0.101.2:8080",
            ws: false,
            changeOrigin: true,
            pathRewrite: { "^/": "" },
          },
        };
      case "localdev":
        return {
          "/": {
            // YAPI
            target: "http://10.3.3.6:5000/mock/35",
            ws: false,
            changeOrigin: true,
            pathRewrite: { "^/wechat/lottery": "" },
          },
        };
    }
  },
};

// UglifyJsPlugin 不支持ES6语法 弃用
// const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const CompressionWebpackPlugin = require("compression-webpack-plugin");
// 可加入需要的其他文件类型，比如json
// 图片不要压缩，体积会比原来还大
const productionGzipExtensions = ["js", "css", "json"];
module.exports = {
  /**
   * 多页面配置
   */
  pages: {
    index: {
      // page 的入口
      entry: "src/entry/index/main.js",
      // 模板来源
      template: "public/index.html",
      // 当使用 title 选项时，
      // template 中的 title 标签需要是 <title><%= htmlWebpackPlugin.options.title %></title>
      title: `${process.env.VUE_APP_title}`,
      chunks: [
        "chunk-commons",
        "vue",
        "vue-router",
        "vendors",
        "manifest",
        "index",
      ],
    },
  },
  /**
   * 修復舊安卓白屏的問題 transpileDependencies
   * https://juejin.im/post/5cb1dc4c5188251b1f4d95ed
   */
  transpileDependencies: ["webpack-dev-server/client"],

  configureWebpack: (config) => {
    return {
      externals: {},
      optimization: {
        minimizer: [
          new TerserPlugin({
            extractComments: false,
            terserOptions: {
              compress: {
                drop_console:
                  process.env.NODE_ENV == "development" ? false : true,
              },
            },
          }),
        ],
        splitChunks: {
          chunks: "all",
          minSize: 30000,
          maxAsyncRequests: 5,
          maxInitialRequests: 5,
          cacheGroups: {
            commons: {
              name: "chunk-commons",
              test: utils.resolve("src/components"), // can customize your rules
              minChunks: 3, //  minimum common number
              priority: 5,
              reuseExistingChunk: true,
            },
            vue: {
              test: /[\\/]node_modules[\\/](vue)[\\/]/,
              name: "vue",
              priority: 2,
            },
            router: {
              test: /[\\/]node_modules[\\/](vue-router)[\\/]/,
              name: "vue-router",
              priority: 2,
            },
            vendors: {
              test: /[\\/]node_modules[\\/]/,
              name: "vendors",
              priority: 1,
              reuseExistingChunk: true,
            },
          },
        },
        runtimeChunk: {
          name: "manifest",
        },
      },
      plugins: [
        new CompressionWebpackPlugin({
          // filename: '[path].gz[query]',
          algorithm: "gzip",
          test: new RegExp("\\.(" + productionGzipExtensions.join("|") + ")$"),
          threshold: 10240, //对超过10k的数据进行压缩
          minRatio: 0.6, // 压缩比例，值为0 ~ 1
        }),
      ],
    };
  },

  chainWebpack: (config) => {
    // 这里是对环境的配置，不同环境对应不同的BASE_API，以便axios的请求地址不同
    config.plugin("define").tap((args) => {
      const argv = process.argv;
      const mode = argv[argv.indexOf("--mode") + 1];
      args[0]["process.env"].MODE = `"${mode}"`;
      return args;
    });

    // 移除 prefetch 插件
    config.plugins.delete("prefetch-index");
    // 移除 preload 插件
    config.plugins.delete("preload-index");
    // 打包后index.html，靜態資源引用路徑保留引號
    config.plugin("html-index").tap((args) => {
      console.log("args", args);
      if (args[0].minify) {
        args[0].minify.removeAttributeQuotes = false;
      }
      return args;
    });

    // 配置输出的js增加hash，防止缓存
    config.output.filename("[name].[hash].js").end();
    config.module
      .rule("svg-sprite")
      .use("svgo-loader")
      .loader("svgo-loader");
  },

  pluginOptions: {},

  publicPath: `${process.env.VUE_APP_publicPath}`,
  outputDir: `dist/${process.env.VUE_APP_MODE}/`,
  assetsDir: "static",
  runtimeCompiler: undefined,
  productionSourceMap: process.env.NODE_ENV == "development" ? true : false,
  parallel: undefined,

  css: {
    // 是否使用css分离插件 ExtractTextPlugin
    extract: false,
    // 开启 CSS source maps?
    sourceMap: process.env.NODE_ENV == "development" ? true : false,
    // css预设器配置项
    loaderOptions: {
      // pass options to sass-loader
      // sass: {
      //     // 引入全局变量样式
      //     data: `
      //         @import "@/stylePath/theme.scss;
      //     `
      // }
    },
    // 启用 CSS modules for all css / pre-processor files.
    modules: false,
  },

  devServer: {
    // port: "10000",
  },

  lintOnSave: true,
};
