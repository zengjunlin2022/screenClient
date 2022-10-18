module.exports = {
    plugins: [
        "@babel/plugin-syntax-dynamic-import",
        "@babel/plugin-transform-runtime"
    ],
    // presets: ["@vue/app"],
    /**
     * 修復舊安卓白屏的問題
     * https://juejin.im/post/5cb1dc4c5188251b1f4d95ed
     */
    presets: [
        [
            "@vue/app",
            {
                useBuiltIns: "entry",
                polyfills: ["es6.promise", "es6.symbol"]
            }
        ]
    ]
};