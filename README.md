# 基于Web component的富文本编辑器组件

基于 Web Component 的简易富文本编辑器。支持文字格式化、格式刷、标题、列表、链接、图片、视频、音频、附件及表格，各项编辑功能位于独立模块，组件运行时无需第三方依赖。

## 本地开发

使用 Node.js 20 或更新版本，npm 8 或更新版本。在项目目录执行：

```bash
npm ci
npm run build
npm start
```

`npm ci` 安装构建依赖，编辑器运行时无需第三方库。

打开 `http://localhost:3000` 查看演示页面。构建结果为 `dist/widget-editor.min.js`，组件样式包含在构建文件中。修改组件源码时，在另一个终端运行 `npm run watch`，保存后自动重新构建；演示页修改后刷新浏览器即可。

构建沿用 [widget-code](https://github.com/mumuy/widget-code) 的 Rollup 配置，使用 `resolve → css → babel → terser` 流程。SVG 图标直接声明为 JS 字符串，组件 CSS 通过导入属性作为 CSSStyleSheet 打包，输出带版权头的 UMD 文件。Babel 使用 `preset-env` 与 runtime、类属性、导入属性语法及私有方法插件；为兼容插件声明的版本要求，使用 Babel 7 系列依赖。

开发服务器默认监听 `0.0.0.0:3000`，可使用 `PORT` 环境变量调整端口。

## 组件使用

```html
<script src="./dist/widget-editor.min.js" defer></script>

<widget-editor insert="table,image,video,attachment,audio,emoji" placeholder="请输入内容…" height="420">
    <h2>开始编辑</h2>
    <p>选中文字后，可以使用工具栏调整格式。</p>
</widget-editor>
```

组件标签内的 HTML 作为初始内容；`placeholder` 设置空内容时的提示，`height` 设置编辑区域高度，单位为像素。

插入功能默认关闭。设置 `insert="table,image"` 后，工具栏显示加号 SVG 按钮，菜单依次提供表格、图片。可用字段为 `table`、`image`、`video`、`attachment`、`audio`、`emoji`，按属性中的顺序排列；重复字段只显示一次，未知字段忽略。空属性或移除属性会隐藏插入菜单，也可在运行时通过 `setAttribute('insert','emoji,image')` 调整。该属性控制插入操作，已存在的内容仍可显示和编辑。

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
| 格式刷 | `formatPainter.js` | 复制当前位置的字体、粗细、斜体、字号、颜色及文字装饰，再选择文字应用一次；按 Escape 取消 |
| 标题 | `heading.js` | 正文及 H1～H6，下拉预览对应大小与粗细；H1～H6 默认字号依次为 32、28、24、20、18、16 px，与字号选项一致 |
| 字体 | `fontFamily.js` | 微软雅黑、宋体、黑体、楷体、仿宋、苹方、等线、华文及思源字体，选项预览对应字体 |
| 文本缩进 | `indentation.js` | 单个图标按钮切换首行缩进两个字宽；已缩进时图标选中，再次点击取消缩进 |
| 插入菜单 | `insert.js` | 按 `insert` 属性启用和排列各项插入功能，工具栏统一显示加号 SVG |
| 插入表情 | `emoji.js` | 点击表情仅选中，点击「插入表情」按钮后插入到原来的光标或选区，支持键盘选择 |
| 块引用 | `blockquote.js` | 将选中段落设为引用，再次点击取消引用 |
| 有序列表 | `orderedList.js` | 添加或取消有序列表 |
| 无序列表 | `unorderedList.js` | 添加或取消无序列表 |
| 超链接 | `link.js` | 插入超链接；光标位于链接内时可修改地址和文字 |
| 插入图片 | `image.js` | 通过 URL 或上传文件插入图片 |
| 插入视频 | `video.js` | 通过 URL 或上传文件插入带播放控件的视频 |
| 插入音频 | `audio.js` | 通过 URL 或上传文件插入带播放控件的音频 |
| 插入附件 | `attachment.js` | 通过 URL 或上传文件插入下载链接 |
| 加粗 | `bold.js` | 切换加粗 |
| 斜体 | `italic.js` | 切换斜体 |
| 下划线 | `underline.js` | 切换下划线，支持 Ctrl / Command + U |
| 源代码 | `source.js` | 查看和编辑自动排版的 HTML，返回可视编辑时清理内容 |
| 对齐方式 | `alignment.js` | 左对齐、居中、右对齐及两端对齐 |
| 文字大小 | `fontSize.js` | 12、14、16、18、20、24、28、32、36、48 px |
| 文字颜色 | `color.js` | 预设色块及自定义 HEX 色值，确认后应用到原选区 |
| 表格 | `table.js` | 8×8 选格弹窗，横向矩形格子，支持表头、行列增删、合并与拆分单元格 |

清除格式用于移除所选文字的行内样式。普通文本段落统一使用 `p`，回车新建段落，Shift + Enter 在段内换行；用户主动输入的空行会保留，在 HTML 输出、源码及 `change` 事件中统一使用独立的 `br`，不会输出 `<p><br></p>`。输入、粘贴、工具栏命令及源码返回可视化时，会将裸文本和浏览器生成的 `div` 整理为段落，并保留选区、标题、列表及表格结构。每次工具栏操作或内容更新后，HTML 输出及源码自动完成内容清理，并用 4 个空格整理块级容器的缩进与换行，保留行内文字间的空白。`value`、`getHTML()` 与 `change` 事件使用统一的排版结果；点击「源代码」即可查看，无需手动格式化。缩进排版在序列化输出时完成；源码输入时保留光标，返回可视编辑时更新编辑区域。

格式刷为单次操作，再次点击按钮也可取消。源码模式中直接编辑 HTML，退出时会统一执行内容清理，再更新可视编辑区域。

表格弹窗中移动鼠标预览行列数，点击格子仅确认范围，点击弹框中的「插入表格」按钮才插入。确认后鼠标在范围外移动或点击不会改变选择，重新移入已选范围才恢复悬停预览；也可使用方向键选择、回车确认范围，触屏点击格子确认范围。勾选「第一行作为表头」时生成 `thead`，其余行放入 `tbody`。点击编辑区内的单元格，或拖选结束后，在鼠标附近浮动显示表格工具栏；窗口边缘自动调整位置，浮层不占用编辑框空间。可在上方或下方插行、左侧或右侧插列，也可删除选中区域占据的行列。拖动或按住 Shift 点击选择连续区域；同一表头、表体或表尾内的完整矩形可合并，单元格内容按行保留，拆分时内容保留在左上角。合并后的跨行、跨列结构也支持行列增删，操作可撤销、重做。点击外部、滚动、调整窗口或按 Escape 关闭工具栏；使用方向键移动光标到单元格时，工具栏定位到该单元格附近。选格标记不会写入 HTML 输出或历史记录。

四个插入弹窗均提供「URL」和「上传文件」标签页，默认使用 URL，支持方向键、Home、End 切换。URL 页可以填写 HTTP/HTTPS 地址或相对地址；上传文件页选择文件后点击插入，触发 `upload` 事件。描述或显示文字在两个页之间保留。文件上传前检查类型和大小：图片支持 PNG、JPEG、GIF、WebP，最大 5 MB；视频支持 MP4、WebM、Ogg，最大 50 MB；音频支持 MP3、WAV、Ogg、M4A、AAC、FLAC、WebM，最大 20 MB；附件支持任意文件，最大 20 MB。大小限制在各自功能模块的 `size` 中调整。

上传由调用方处理，组件保存 `onUploadComplete(url)` 返回的地址，并插入打开弹窗前的选区。上传过程中弹窗保持打开、显示进度，输入及重复提交暂时禁用；失败后显示错误并允许重试。取消、关闭、切换源码、替换内容或移除组件后，本次回调失效；重复的完成、错误回调也会忽略。

`upload` 事件会冒泡并可跨越 Shadow DOM，`detail` 包含：

| 字段 | 说明 |
| --- | --- |
| `file` | 用户选择的原始 `File` |
| `type` | `image`、`video`、`audio` 或 `attachment` |
| `onUploadComplete(url)` | 上传成功后传入地址，组件校验并插入内容 |
| `onUploadError(err)` | 传入 `Error`、错误消息或包含 `message` 的对象，显示错误并允许重试 |
| `onProgress(percent)` | 更新 0～100 的进度，超出范围会限制到边界 |

例如对接自己的上传接口，假设响应 JSON 为 `{ "url": "https://example.com/uploads/file.png" }`：

```javascript
let $editor = document.querySelector('widget-editor');
$editor.addEventListener('upload',function(event){
    let {file,onUploadComplete,onUploadError,onProgress} = event.detail;
    let request = new XMLHttpRequest();
    request.open('POST','/api/upload');
    request.responseType = 'json';
    request.upload.onprogress = function(event){
        if(event.lengthComputable){
            onProgress(event.loaded/event.total*100);
        }
    };
    request.onload = function(){
        if(request.status>=200&&request.status<300&&request.response?.url){
            onUploadComplete(request.response.url);
        }else{
            onUploadError(request.response?.message||'上传失败，请重试');
        }
    };
    request.onerror = ()=>onUploadError('网络错误，请重试');
    request.onabort = ()=>onUploadError('上传已取消');
    let data = new FormData();
    data.append('file',file);
    request.send(data);
});
```

演示页在组件外监听 `upload`，用 FileReader 读取本地文件并调用回调，文件不会发送到服务器。正式使用时替换为自己的上传接口；组件运行时只管理弹窗、事件和插入结果。

视频和音频使用原生播放控件，默认仅加载元数据，不自动播放；能否播放取决于浏览器对文件编码的支持。附件文件页保留原文件名，URL 页从地址末尾提取文件名；显示文字可另行设置。跨域附件的下载行为和文件名由浏览器及文件服务的下载响应头决定。HTML 输出、源码往返和撤销重做会保留媒体及下载链接。

字体使用系统安装的字体，未安装时按字体列表回退。字体样式会保留在输出 HTML、源码编辑和格式刷中。颜色面板提供 50 个预设色块，第一行灰阶由白到黑均匀变化，后四行每列固定色系，逐行由浅到深，后两行保持高饱和度，去除过浅及过深的彩色，也支持输入六位 HEX 色值（如 `#336699`），输入过程中保持焦点和编辑器原选区；Escape 关闭面板而不修改内容。选中的文字颜色在 `value`、`getHTML()`、源码和 `change` 事件中统一输出六位 HEX（如 `#000000`），带透明度的输入颜色会保留透明度。可通过 `::part(color-menu)` 和 `::part(color-swatch)` 调整颜色面板。

## 目录结构

```text
widget-editor/
├── src/
│   ├── widget-editor.js       # Web Component、工具栏、选区及编辑器生命周期
│   ├── module/
│   │   ├── feature/           # 独立功能模块及统一注册列表
│   │   ├── dialog.js          # 通用弹窗、字段与提交状态
│   │   ├── dropdown.js        # 可样式化下拉菜单
│   │   ├── history.js         # 内容历史
│   │   ├── icon.js            # SVG 字符串与渲染
│   │   ├── table/             # 表格选格、单元格交互与行列模型
│   │   └── method/
│   │       ├── color.js       # RGB 转 HEX
│   │       ├── file.js        # 文件类型、文件名及 data URL 验证
│   │       ├── formatHTML.js  # 安全的 HTML 源码排版
│   │       ├── sanitize.js    # HTML、链接及图片地址清理
│   │       ├── selection.js   # 选区处理
│   │       └── upload.js      # URL/文件标签页、上传事件及回调
│   └── style/
│       └── default.css        # 组件样式
├── static/                    # 演示页面资源
├── dist/                      # 构建产物
├── scripts/server.mjs         # 静态开发服务器
├── index.html                 # 演示页面
├── babel.config.js            # ECMAScript 兼容配置
├── rollup.config.mjs           # Rollup 构建配置
└── package.json
```

新增功能时在 `src/module/feature/` 中创建模块；格式功能在 `index.js` 注册，插入功能在 `insert.js` 注册并通过 `insert` 属性启用。模块声明名称、标签、控件类型及执行函数，通过编辑器统一的选区与操作接口处理内容，避免将多个功能堆积在组件入口中。

## 下拉菜单与图标

标题、字体、文字大小、对齐方式和插入功能使用普通按钮组成下拉菜单。标题、字体和字号的工具栏按钮仅显示文字与下拉箭头，标题菜单的正文和 H1～H6 选项分别显示对应 SVG 图标。插入按钮仅显示 SVG 图标与下拉箭头，下拉选项仍显示文字。缩进使用单个 SVG 按钮，随光标所在段落的缩进状态高亮，点击切换缩进或取消；选中多个段落时，全部缩进则高亮，否则点击统一设置缩进。按钮名称通过悬停提示及无障碍标签提供。可在 `src/style/default.css` 中修改 `.tool-dropdown-button`、`.tool-menu`、`.tool-option` 的样式，也可从页面通过 `::part` 调整：

```css
widget-editor::part(dropdown-trigger){
    border-radius: 6px;
}
widget-editor::part(dropdown-menu){
    background: #fffdf5;
}
widget-editor::part(dropdown-option){
    font-size: 14px;
    padding: 8px 12px;
}
widget-editor::part(dropdown-option-selected){
    background: #e9f1fe;
}
```

四个下拉菜单分别暴露 `heading-menu`、`fontFamily-menu`、`fontSize-menu` 和 `alignment-menu`，可以单独设置样式。菜单支持方向键、Home、End、Enter 和 Escape 操作。

所有图标直接以 SVG 字符串声明在 `src/module/icon.js` 中，例如 `bold`、`image`、`source`。修改字符串后执行 `npm run build` 即可；使用组件时无需单独部署图标目录。工具栏图标还暴露 `toolbar-icon`，可通过 `::part(toolbar-icon)` 修改尺寸。

## 验证

```bash
npm run build
```

构建完成后运行 `npm start`，打开演示页面，选中文字检查格式、标题、列表、链接及对齐操作；再检查格式刷、四种文件的 URL 插入及上传回调、表格插入和源码编辑，并通过 `value` 或 `getHTML()` 读取编辑后的 HTML。

## 浏览器与内容清理

实现面向支持 Web Component、Shadow DOM、原生 dialog 及 contenteditable 的现代浏览器。使用 Chrome、Edge、Safari、Firefox 时，应实际验证编辑命令、光标及撤销行为。

部分格式操作使用浏览器原生 `document.execCommand`。该接口已被标记为废弃，但仍用于这一简易实现；复杂文档协作、严格一致的跨浏览器编辑行为和高级表格编辑需要更完整的编辑模型。

初始内容、粘贴、源码及 HTML API 使用统一的清理逻辑，导出的 HTML 和 `change` 事件中的 HTML 也会经过清理。组件限制可用标签、属性、行内样式及链接协议，移除脚本与事件属性。若内容需要保存并公开展示，仍应在服务端执行适合业务规则的 HTML 清理。

标签白名单按工具栏能力设置：`p`、`div`、`span`、`br`，加粗及斜体的 `strong` / `b`、`em` / `i`，下划线的 `u`，`h1`～`h6`，`ul`、`ol`、`li`，`a`、`img`、`video`、`audio`，`table`、`thead`、`tbody`、`tfoot`、`tr`、`th`、`td`，以及 `blockquote`。媒体保留匹配类型的 data URL 或 HTTP/HTTPS 地址、描述及播放控件；下载链接保留文件名和二进制 data URL。`div` 接收后会转换为段落或展开为内部块结构；`span` 和 `br` 用于文字样式和段内换行。其他普通标签（如 `pre`、`code`、`hr`、`s`、`sub`、`sup`、`font`）去掉外层，保留文字及已清理的支持节点；脚本、表单、iframe 等整个节点及其内容移除。源码返回可视化时应用过滤，读取 HTML 时也使用相同规则。

## License

MIT
