
Markdown
# 数字胡焕庸线 · 沉浸式体验网站

## 📖 项目说明

这是一个将多个独立页面整合成一个无缝体验的沉浸式可视化网站，展示了中国人口地理分布的胡焕庸线相关数据。项目集成了 3D 可视化、手势交互、音频反馈和即时答题系统。

## 🎯 特性

### ✅ 已实现功能

1. **统一导航系统**
   - 顶部固定导航栏
   - 5 个章节按钮，带进度指示
   - 平滑的场景切换动画

2. **视觉主题**
   - 统一的赛博朋克风格
   - 渐变色和光晕效果
   - 响应式设计

3. **转场动画**
   - 场景切换时的淡入淡出
   - 加载提示动画
   - 过渡效果流畅

4. **音频系统**
   - 背景音乐支持
   - 场景切换音效
   - 按钮交互音效
   - 全局静音控制

5. **交互系统**
   - **全局手势识别**：基于 MediaPipe Hands，支持跨页面手势状态共享
   - **键盘快捷键**：支持快速切换场景和控制功能
   - **答题系统**：支持手势选择答案、错题记录与重练

## 🚀 运行方式

### 环境要求
- Node.js (推荐 v14+)
- npm

### 启动步骤

1. **安装依赖**
   ```bash
   npm install
启动开发服务器

bash
npm start
访问主站点 打开浏览器访问：http://localhost:8080/main-site.html

构建生产版本

bash
npm run build
🎮 操作指南
键盘快捷键
← / → - 切换场景
M - 静音/取消静音
H - 显示/隐藏帮助
ESC - 关闭引导面板
手势操作
🖐️ 张开手掌 (1-4指) - 切换选项 / 选择答案 A,B,C,D
✊ 握拳 - 确认提交 / 下一题 / 关闭视图
👌 捏合 - 确认选择 / 缩放交互
📁 项目结构 (Refactored)
Text
group3-2-project/
│
├── assets/                 # [静态资源]
│   ├── css/                # 样式文件 (main-site.css, quiz.css 等)
│   ├── img/                # 图片资源 (icon.png, texture maps)
│   ├── audio/              # 音频资源 (background.mp3)
│   ├── video/              # 视频资源 (earth_video.mp4)
│   └── data/               # 数据文件 (china.json, G7_route.json)
│
├── js/                     # [脚本文件]
│   ├── core/               # 核心通用模块
│   │   ├── global-hand-tracker.js  # 全局手势追踪
│   │   ├── audio-manager.js        # 音频管理
│   │   └── user-manager.js         # 用户状态管理
│   ├── pages/              # 页面特定逻辑
│   │   ├── main-app.js             # 主站逻辑
│   │   ├── quiz-manager.js         # 答题逻辑
│   │   └── app.js                  # 入口文件
│   └── vendor/             # 第三方库
│
├── pages/                  # [页面文件] (建议将子页面移入此处，目前暂存于根目录)
│
├── main-site.html          # 主站点入口
├── quiz.html               # 答题与练习页面
├── index.html              # 场景: 自然交互
├── hhy-line-intro.html     # 场景: 地理认知
├── hhy-line-light-data.html # 场景: 时空演变
├── hhy-line-projects.html  # 场景: 工程建设
├── poam.html               # 场景: 未来愿景
│
├── package.json            # 项目依赖配置
├── webpack.common.js       # Webpack 通用配置
└── README.md               # 项目说明文档
🎨 场景说明
序章：自然交互 (01)
内容: 3D 树 + 手势交互原型
功能: 基础手势识别演示
第一章：地理认知 (02)
内容: 3D 地球 + 胡焕庸线
功能: 中国地理可视化，支持旋转缩放
第二章：时空演变 (03)
内容: 2012-2023 年夜间灯光数据
功能: 时间序列数据展示，自动运镜
第三章：工程建设 (04)
内容: 东数西算工程可视化
功能: ECharts 数据图表展示
终章：未来愿景 (05)
内容: 粒子地形景观
功能: 35 万 GPU 粒子渲染
附加章节：做题练习
内容: 知识点测试
功能: 手势答题、错题本、成绩统计
🔧 技术栈
前端核心: HTML5, CSS3, JavaScript (ES6+)
3D 渲染: Three.js
AI 识别: MediaPipe Hands
可视化: ECharts
构建工具: Webpack
音频处理: Web Audio API
📝 注意事项
摄像头权限: 手势识别功能需要授权摄像头访问。
音频播放: 根据浏览器策略，背景音乐通常需要用户首次点击页面后才能播放。
文件引用: 若手动移动文件，请务必更新 HTML 中的资源引用路径（如 assets/css/...）。
开发者: Group 3-2
版本: 1.1.0 (Refactored)
更新日期: 2026-03-25
