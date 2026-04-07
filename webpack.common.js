const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin'); // 引入插件

module.exports = {
  // ✅ 1. 入口文件路径已修正为 pages 目录
  entry: {
    app: './js/pages/app.js',
  },

  // ✅ 2. 输出配置保持不变，或者为了规范可以改名
  output: {
    path: path.resolve(__dirname, 'dist'),
    clean: true,
    // 建议输出到 dist/js/ 目录下，并且叫 bundle.js 或者保持 app.js
    filename: 'js/app.js',
  },

  // ✅ 3. 新增插件配置：负责把 assets 文件夹完整复制到 dist 目录
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        // 把根目录下的 assets 文件夹复制到 dist/assets
        { from: 'assets', to: 'assets' },
        // 把根目录下的 html 文件复制到 dist 根目录
        { from: '*.html', to: '[name][ext]' }
      ],
    }),
  ],

  // (可选) 如果你需要处理 CSS/图片打包
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
    ],
  },
};
