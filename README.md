# 基于Web component的富文本编辑器组件

基于 Web Component 的简易富文本编辑器。支持文字格式化、格式刷、标题、列表、链接、图片及表格，15 个工具栏功能各自位于独立模块，组件运行时无需第三方依赖。

## 本地开发

使用 Node.js 20 或更新版本，npm 8 或更新版本。在项目目录执行：

```bash
npm ci
npm run build
npm start
```

`npm ci` 安装构建依赖，编辑器运行时无需第三方库。

打开 `http://localhost:3000` 查看演示页面。构建结果为 `dist/widget-editor.min.js`，组件样式包含在构建文件中。修改组件源码时，在另一个终端运行 `npm run watch`，保存后自动重新构建；演示页修改后刷新浏览器即可。

构建使用与 [widget-code](https://github.com/mumuy/widget-code) 相同的 Rollup 插件顺序：`resolve → css → babel → terser`。组件 CSS 通过导入属性作为 CSSStyleSheet 打包，输出带版权头的 UMD 文件。Babel 使用 `preset-env` 与 runtime、类属性、导入属性语法及私有方法插件；为兼容插件声明的版本要求，使用 Babel 7 系列依赖。

开发服务器默认监听 `0.0.0.0:3000`，可使用 `PORT` 环境变量调整端口。

## 组件使用

```html
<script src="./dist/widget-editor.min.js" defer></script>

<widget-editor theme="light" placeholder="请输入内容…" height="420">
    <h2>开始编辑</h2>
    <p>选中文字后，可以使用工具栏调整格式。</p>
</widget-editor>
```

组件标签内的 HTML 作为初始内容；`placeholder` 设置空内容时的提示，`height` 设置编辑区域高度，单位为像素。`theme` 支持 `light` 与 `dark`。

```javascript
customElements.whenDefined('widget-editor').then(function(){
    let $editor = document.querySelector('widget-editor');

    // 读取或设置 HTML；赋值可以清空内容或恢复指定内容。
    let initialHTML = $editor.value;
    $editor.value = '<p>新的内容</p>';
    $editor.value = '';
    $editor.value = initialHTML;

    // 方法形式与 value 属性作用相同。
    let html = $editor.getHTML();
    $editor.setHTML(html);

    // 获取纯文本。
    let text = $editor.text;

    $editor.addEventListener('change',function(event){
        console.log(event.detail.value,event.detail.text);
    });
});
```

`change` 事件的 `detail` 包含 `{value, text}`，分别为 HTML 与纯文本。`change` 和 `ready` 事件均会冒泡并可跨越 Shadow DOM 边界。`ready` 事件在组件初始化完成后触发；若需要处理首次初始化，请在组件连接到页面前添加监听：

```javascript
customElements.whenDefined('widget-editor').then(function(){
    let $editor = document.createElement('widget-editor');
    $editor.innerHTML = '<p>初始内容</p>';
    $editor.addEventListener('ready',function(){
        console.log($editor.value);
    });
    document.querySelector('#editor-container').appendChild($editor);
});
```

## 功能模块

| 功能 | 模块 | 行为 |
| --- | --- | --- |
| 清除格式 | `format.js` | 清除所选文字的行内格式，保留段落结构 |
| 格式刷 | `formatPainter.js` | 复制当前位置的字体粗细、斜体、字号、颜色及文字装饰，再选择文字应用一次；按 Escape 取消 |
| 标题 | `heading.js` | 正文及 H1～H6 |
| 有序列表 | `orderedList.js` | 添加或取消有序列表 |
| 无序列表 | `unorderedList.js` | 添加或取消无序列表 |
| 链接 | `link.js` | 插入链接；光标位于链接内时可修改地址和文字 |
| 图片上传 | `image.js` | 从本地选择图片并插入 |
| 加粗 | `bold.js` | 切换加粗 |
| 斜体 | `italic.js` | 切换斜体 |
| 源代码 | `source.js` | 查看和编辑 HTML，返回可视编辑时清理内容 |
| 对齐方式 | `alignment.js` | 左对齐、居中、右对齐及两端对齐 |
| 文字大小 | `fontSize.js` | 12、14、16、18、20、24、28、32、48 px |
| 文字颜色 | `color.js` | 使用颜色选择器设置文字颜色 |
| 表格 | `table.js` | 插入 1～10 行、1～10 列的表格，可将第一行设为表头 |
| 格式化 HTML | `formatHTML.js` | 进入源码模式，用 4 个空格整理块级容器的缩进及换行 |

清除格式用于移除所选文字的行内样式；格式化 HTML 用于整理源码结构。格式化会进入并保持源码模式，先清理 HTML，再为只包含块级元素的容器加入缩进与换行，保留行内文字间的空白及 pre / code 内容。直接修改源码后，返回可视编辑时才更新编辑区域。

格式刷为单次操作，再次点击按钮也可取消。源码模式中直接编辑 HTML，退出时会统一执行内容清理，再更新可视编辑区域。

图片上传支持 PNG、JPEG、GIF、WebP，单张最大 5 MB。图片通过 FileReader 转为 data URL 并存入 HTML，不需要远程上传服务；保存内容时也会包含图片数据。项目未包含文件存储、鉴权或服务端接口。

## 目录结构

```text
widget-editor/
├── src/
│   ├── widget-editor.js       # Web Component、工具栏、选区及编辑器生命周期
│   ├── module/
│   │   ├── feature/           # 独立功能模块及统一注册列表
│   │   ├── dialog.js          # 通用弹窗、字段与提交状态
│   │   ├── history.js         # 内容历史
│   │   └── method/
│   │       ├── formatHTML.js  # 安全的 HTML 源码排版
│   │       ├── sanitize.js    # HTML、链接及图片地址清理
│   │       └── selection.js   # 选区处理
│   └── style/
│       ├── default.css        # 组件基础样式与默认 light 主题
│       └── theme/dark.css     # dark 主题
├── static/                    # 演示页面资源
├── dist/                      # 构建产物
├── scripts/server.mjs         # 静态开发服务器
├── index.html                 # 演示页面
├── babel.config.js            # ECMAScript 兼容配置
├── rollup.config.mjs           # Rollup 构建配置
└── package.json
```

新增功能时在 `src/module/feature/` 中创建模块，并在 `index.js` 中注册。模块声明名称、标签、控件类型及执行函数，通过编辑器统一的选区与操作接口处理内容，避免将多个功能堆积在组件入口中。

## 验证

```bash
npm run build
```

构建完成后运行 `npm start`，打开演示页面，选中文字检查格式、标题、列表、链接及对齐操作；再检查格式刷、图片上传、表格插入和源码编辑，并确认导出的 HTML 与编辑内容一致。

## 浏览器与内容清理

实现面向支持 Web Component、Shadow DOM、原生 dialog 及 contenteditable 的现代浏览器。使用 Chrome、Edge、Safari、Firefox 时，应实际验证编辑命令、光标及撤销行为。

部分格式操作使用浏览器原生 `document.execCommand`。该接口已被标记为废弃，但仍用于这一简易实现；复杂文档协作、严格一致的跨浏览器编辑行为和高级表格编辑需要更完整的编辑模型。

初始内容、粘贴、源码及 HTML API 使用统一的清理逻辑，导出的 HTML 和 `change` 事件中的 HTML 也会经过清理。组件限制可用标签、属性、行内样式及链接协议，移除脚本与事件属性。若内容需要保存并公开展示，仍应在服务端执行适合业务规则的 HTML 清理。

## License

MIT
