# SmartMatting (智能抠图)

SmartMatting 是一个基于 AI 技术的在线图像处理工具，专注于提供简单、高效的图片背景去除服务。无需注册登录，无需安装任何软件，通过浏览器即可轻松实现专业级的抠图效果。

## ✨ 产品特色

- **零门槛使用**：无需注册登录，打开网页即可使用。
- **智能 AI 抠图**：利用先进的 AI 模型自动识别主体并去除背景。
- **完全免费**：所有功能免费提供，无需付费订阅。
- **隐私安全**：纯前端实现，图片处理在本地浏览器完成，无需上传至服务器，保障用户隐私。
- **功能丰富**：
  - 支持拖拽上传和点击选择图片。
  - 提供原图与处理结果的实时对比。
  - 内置强大的编辑器，支持画笔修补、边缘羽化。
  - 支持背景替换（纯色、渐变、自定义图片）。
  - 提供基础图片调整功能（亮度、对比度、饱和度、裁剪、旋转）。

## 🛠️ 技术栈

本项目完全基于原生 Web 技术构建，无后端依赖：

- **前端核心**: HTML5, CSS3, JavaScript (ES6+)
- **AI 模型**: [TensorFlow.js](https://www.tensorflow.org/js) + [MediaPipe Selfie Segmentation](https://google.github.io/mediapipe/solutions/selfie_segmentation)
- **图像处理**: Canvas API
- **样式设计**: CSS3 (Flexbox/Grid), 响应式设计

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/your-username/smart-matting.git
cd smart-matting
```

### 2. 安装依赖

虽然本项目主要为静态页面，但使用了 `package.json` 管理部分开发依赖。

```bash
npm install
# 或
pnpm install
```

### 3. 运行项目

你可以使用任何静态文件服务器来运行本项目，例如 `Live Server` 或 `http-server`。

如果已安装依赖，可以直接使用开发工具打开 `index.html`。

## 📂 项目结构

```
smart-matting/
├── css/                # 样式文件
│   ├── animations.css  # 动画样式
│   ├── editor.css      # 编辑器样式
│   └── style.css       # 全局及首页样式
├── js/                 # 脚本文件
│   ├── editor.js       # 编辑器逻辑
│   ├── image-processor.js # 图像处理核心逻辑
│   ├── main.js         # 首页逻辑
│   └── utils.js        # 工具函数
├── .trae/              # 项目文档
├── edit.html           # 图片编辑页面
├── index.html          # 首页
└── package.json        # 项目配置
```

## 📝 待办事项

- [ ] 优化 AI 模型加载速度
- [ ] 增加更多预设背景模板
- [ ] 支持批量图片处理
- [ ] 增加 PWA 支持，支持离线使用

## 📄 许可证

本项目采用 [ISC](LICENSE) 许可证。
