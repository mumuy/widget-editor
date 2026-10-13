# widget-editor

一个基于 Web Component 的简易富文本编辑器，用于文章、公告、笔记等内容的编辑。通过 `<widget-editor>` 标签即可使用，无需依赖其他 JavaScript 框架，样式和图标已包含在组件文件中。

[在线演示](https://passer-by.com/widget-editor/) · [下载组件](https://github.com/mumuy/widget-editor/raw/refs/heads/main/dist/widget-editor.min.js)

## 支持的功能

- 文字格式：加粗、斜体、下划线、删除线、上标、下标、字体、字号、文字颜色、清除格式和格式刷。
- 段落排版：正文、H1～H6 标题、对齐方式、首行缩进、块引用、有序列表和无序列表。
- 内容插入：超链接、表格、图片、视频、音频、附件和常见 emoji。
- 表格编辑：增加或删除行列、合并和拆分单元格。
- 源代码查看与编辑、撤销和重做。
- 简体中文、繁体中文和英语界面，可随时切换语言。

## 快速使用

下载 `widget-editor.min.js` 并放入你的项目，然后在页面中引入：

```html
<script src="./widget-editor.min.js" defer></script>

<widget-editor id="editor" insert="table,image,emoji" placeholder="请输入内容…" height="420">
    <h2>开始编辑</h2>
    <p>选中文字后，可以使用工具栏调整格式。</p>
</widget-editor>
```

标签内的 HTML 会作为初始内容，也可以使用空标签创建空白编辑器。多个编辑器可以在同一页面中独立使用。

### 属性配置

| 属性 | 说明 | 默认值 |
| --- | --- | --- |
| `placeholder` | 空白编辑器中的提示文字 | `在这里开始写作…` |
| `height` | 编辑区域高度，单位为 px，有效范围为 160～2000 | `420` |
| `insert` | 插入菜单中的功能，以英文逗号分隔 | 不显示插入菜单 |
| `custom` | 工具栏功能及显示顺序，以英文逗号分隔 | 使用默认工具栏 |
| `language` | 界面语言：`zh-CN`、`zh-HK` 或 `en-US` | `zh-CN` |

`insert` 支持以下字段，字段顺序就是插入菜单中的顺序：

| 字段 | 功能 |
| --- | --- |
| `table` | 表格 |
| `image` | 图片 |
| `video` | 视频 |
| `audio` | 音频 |
| `attachment` | 附件 |
| `emoji` | 表情 |
| `divider` | 分割线 |
| `code` | 代码块 |

例如，`insert="table,image"` 只提供表格和图片。启用全部插入功能：

```html
<widget-editor insert="table,image,video,attachment,audio,emoji,divider,code"></widget-editor>
```

重复字段只显示一次，未知字段会被忽略。不设置 `insert` 或设置为空时，工具栏不显示插入菜单；通过 `custom` 配置的独立插入按钮仍可使用。已有内容始终可以显示和编辑。

也可以在使用过程中调整配置：

```javascript
let editor = document.querySelector('#editor');
editor.setAttribute('insert','emoji,image');
editor.removeAttribute('insert');
```

### 自定义工具栏

设置 `custom` 后，撤销和重做固定显示在最左侧，其他功能只显示配置的字段，并按字段顺序排列。例如，把图片和视频直接放在工具栏：

```html
<widget-editor custom="heading,fontFamily,fontSize,bold,italic,color,image,video"></widget-editor>
```

| 字段 | 功能 |
| --- | --- |
| `heading` | 标题与正文 |
| `fontFamily` | 字体 |
| `fontSize` | 文字大小 |
| `alignment` | 对齐方式 |
| `indentation` | 首行缩进 |
| `bold` | 加粗 |
| `italic` | 斜体 |
| `underline` | 下划线 |
| `strikethrough` | 删除线 |
| `superscript` | 上标 |
| `subscript` | 下标 |
| `color` | 文字颜色 |
| `blockquote` | 块引用 |
| `orderedList` | 有序列表 |
| `unorderedList` | 无序列表 |
| `link` | 超链接 |
| `format` | 清除格式 |
| `formatPainter` | 格式刷 |
| `insert` | 插入菜单，菜单内容由 `insert` 属性配置 |
| `table` | 独立插入表格按钮 |
| `image` | 独立插入图片按钮 |
| `video` | 独立插入视频按钮 |
| `audio` | 独立插入音频按钮 |
| `attachment` | 独立插入附件按钮 |
| `emoji` | 独立插入表情按钮 |
| `divider` | 独立插入分割线按钮 |
| `code` | 独立插入代码块按钮 |
| `source` | 源代码 |
| `fullscreen` | 全屏 |

独立插入按钮无需设置 `insert` 属性，仍使用相同的弹窗和 `upload` 事件。两种配置可以一起使用：

```html
<widget-editor custom="bold,italic,image,insert" insert="table,video,emoji"></widget-editor>
```

字段不区分大小写，重复字段只显示一次，未知字段会被忽略。`custom=""` 只显示撤销和重做；不设置或移除 `custom` 则恢复默认工具栏。底部的全屏、源码按钮及字数统计保留，配置 `source` 或 `fullscreen` 时，也会在工具栏中提供对应按钮。

支持运行时修改，不会清空内容、选区或撤销记录：

```javascript
editor.setAttribute('custom','heading,bold,link,image');
editor.removeAttribute('custom');
```

### 界面语言

默认使用简体中文，通过 `language` 属性选择繁体中文或英语。`zh-HK` 使用香港常用的界面用语：

```html
<widget-editor language="zh-CN"></widget-editor>
<widget-editor language="zh-HK" insert="table,image"></widget-editor>
<widget-editor language="en-US" insert="table,image"></widget-editor>
```

工具栏、Tooltip、下拉选项、弹窗、上传状态、表格操作和字数统计均使用所选语言。未设置 `placeholder` 时，默认提示也随语言变化；自定义提示、编辑内容、文件名和外部传入的上传错误不会自动翻译。语言切换使用原生 JavaScript，不需要第三方插件。

可以运行时切换，已编辑的内容、选区、撤销记录以及弹窗中填写的信息都会保留：

```javascript
editor.setAttribute('language','en-US');
editor.setAttribute('language','zh-HK');
editor.removeAttribute('language'); // 恢复简体中文
```

语言值不区分大小写，也支持 `zh-Hans`、`zh-Hant`、`zh-TW` 和 `en` 等兼容别名；繁体中文统一使用 `zh-HK`，英语统一使用 `en-US`。未知值使用简体中文。

### 读取与设置内容

在组件加载完成后，通过 `value` 读写 HTML，通过 `text` 获取纯文本：

```javascript
customElements.whenDefined('widget-editor').then(function(){
    let editor = document.querySelector('#editor');

    editor.value = '<p>新的内容</p>';
    let html = editor.value;
    let text = editor.text;

    editor.addEventListener('change',function(event){
        let {value,text} = event.detail;
        console.log(value,text);
    });
});
```

| 属性或方法 | 说明 |
| --- | --- |
| `value` | 读取或设置 HTML，赋值为空字符串可清空内容 |
| `text` | 读取纯文本 |
| `getHTML()` | 读取 HTML，与读取 `value` 相同 |
| `setHTML(html)` | 设置 HTML，与设置 `value` 相同 |

通过 `value` 或 `setHTML()` 设置内容不会触发 `change` 事件。

### 事件

| 事件 | 触发时机 | `detail` |
| --- | --- | --- |
| `ready` | 组件首次初始化完成 | 无 |
| `change` | 用户编辑内容或执行编辑操作 | `{value,text}` |
| `upload` | 用户选择文件并确认上传 | 文件及上传回调，见下方说明 |

这些事件会冒泡，也可以在编辑器所在的父元素上监听。若需要监听 `ready`，请先准备一个容器，例如 `<div id="editor-container"></div>`，再在组件加入页面之前绑定：

```javascript
customElements.whenDefined('widget-editor').then(function(){
    let editor = document.createElement('widget-editor');
    editor.value = '<p>初始内容</p>';
    editor.addEventListener('ready',function(){
        console.log(editor.value);
    });
    document.querySelector('#editor-container').appendChild(editor);
});
```

## 图片、视频、音频和附件

启用对应的 `insert` 字段后，点击工具栏的加号按钮，选择要插入的内容。弹窗提供两种方式：

- **URL**：填写文件地址，点击插入即可使用，支持 HTTP、HTTPS 或相对地址。
- **上传文件**：选择本地文件并点击插入，组件触发 `upload` 事件，由你的页面负责上传。

组件不会自行向服务器上传文件。上传成功后，调用 `onUploadComplete(url)`，组件将返回的地址插入到打开弹窗前的光标或选区位置。

`upload` 事件的 `detail` 包含：

| 字段 | 说明 |
| --- | --- |
| `file` | 用户选择的原始 `File` |
| `type` | `image`、`video`、`audio` 或 `attachment` |
| `onUploadComplete(url)` | 上传成功后传入文件地址 |
| `onUploadError(err)` | 上传失败时传入 `Error` 或错误消息，允许用户重试 |
| `onProgress(percent)` | 更新上传进度，范围为 0～100 |

下面的示例假设上传接口为 `/api/upload`，成功响应为 `{ "url": "https://example.com/uploads/file.png" }`：

```javascript
customElements.whenDefined('widget-editor').then(function(){
    let editor = document.querySelector('#editor');
    editor.addEventListener('upload',function(event){
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
});
```

| 文件类型 | 支持的格式 | 大小上限 |
| --- | --- | --- |
| 图片 | PNG、JPEG、GIF、WebP | 5 MB |
| 视频 | MP4、WebM、Ogg | 50 MB |
| 音频 | MP3、WAV、Ogg、M4A、AAC、FLAC、WebM | 20 MB |
| 附件 | 任意文件 | 20 MB |

上传过程中弹窗会显示进度；失败后可以重试。取消弹窗、切换源码、替换内容、移除组件或禁用对应插入功能后，该次上传回调不再插入内容。

在线演示仅在本地读取文件，不会将文件上传到服务器。视频和音频的播放能力取决于浏览器支持的文件编码。

## 编辑操作

主工具栏和底部按钮在鼠标悬停或键盘聚焦时显示功能提示。表格和超链接的浮动按钮直接显示功能文字，不再额外提示。提示不会占用编辑区域，也不会写入 HTML 内容。

**全屏**：点击左下角源码按钮左侧的全屏图标，让编辑器铺满浏览器可视区域。页面停止滚动，编辑内容在组件内滚动，工具栏和底部栏保持可见；源代码模式也支持。再次点击或按 Escape 退出，恢复页面原来的滚动位置。

**缩进**：点击缩进图标，为当前段落设置两个字宽的首行缩进；再次点击取消。有缩进时图标高亮。选中多个段落时，可以统一设置或取消缩进。

**上标与下标**：选中文字后点击对应按钮，例如 `x²`、`H₂O`；再次点击取消，两个格式互斥。也可以先设置格式再输入文字，HTML 使用 `sup` 或 `sub` 标签。

**删除线**：选中文字后点击删除线按钮，再次点击取消。可以与加粗、斜体和下划线叠加，也可以先开启删除线再输入文字。

**超链接与下划线**：超链接以颜色和淡虚线区分，虚线是编辑器中的视觉提示，不会写入 HTML；文字下划线由下划线按钮独立控制，可以添加或取消，不影响链接地址。

鼠标停留在链接上、光标进入链接或选中链接文字时，附近会显示「取消超链接」浮动按钮，点击后将该链接转换为纯文本，支持撤销；附件下载链接不显示此操作。

**清除格式**：将选中内容转换为纯文本段落，使用不带属性的 `p` 标签，移除标题、列表、引用、表格、链接及文字样式，保留文字和分段；选区中的图片、视频等非文本内容会移除。没有选中文字时处理当前段落。未选中文字的行内格式保留，所涉及段落的标签和段落样式一并清除，支持撤销。

**格式刷**：在已有格式的文字处点击格式刷，再选中目标文字即可应用。每次只应用一次，再次点击格式刷或按 Escape 可取消。

**表格**：在 8×8 选择区域中移动鼠标预览行列数，点击格子确认范围，再点击「插入表格」。确认后范围保持固定，鼠标重新进入已选范围才恢复预览。可勾选「第一行作为表头」。点击表格内的单元格，会浮动显示行列操作；拖动或按住 Shift 选择连续单元格后，可合并或拆分。

底部左侧显示全屏和源代码按钮，右侧显示字数统计。链接校验、文件类型或大小限制、上传失败等信息直接显示在对应弹窗内。

HTML 输出中，纯文本单元格保持在一行，例如 `<td>文字</td>`；空白单元格使用 `<td>&nbsp;</td>`，不输出占位的 `<br>`。表头单元格使用相同规则，单元格内实际输入的换行、图片和段落会保留。

**表情**：点击 emoji 仅选中并高亮，点击弹窗中的「插入表情」按钮后才插入。

**分割线与代码块**：通过 `insert="divider,code"` 放入插入菜单，也可以通过 `custom="bold,divider,code"` 直接放入工具栏。分割线输出为 `hr`；代码块使用 `pre` 和 `code`，选中的文字可直接转换为代码块。

光标进入代码块时，右上方会显示固定在代码块上的自定义语言下拉框，支持 HTML、JavaScript、CSS、Java、TypeScript、PHP、Python、Go、JSON、SQL、Bash、C++、C、C#、JSX、Visual Basic、Ruby、Swift、Lua、Markdown 和纯文本。切换语言会重新高亮，保留文字和选区，支持撤销。HTML 中的 `script`、`style` 内容分别按 JavaScript、CSS 高亮；JSX 的标签与表达式分别识别，Markdown 围栏代码按指定语言高亮。

初始内容通过 `code` 的 `data-language` 指定语言。新增语言的代码依次为 `cpp`、`c`、`csharp`、`jsx`、`visual-basic`、`ruby`、`swift`、`lua`、`markdown`；也兼容 `c++`、`c#`、`cs`、`vb`、`vbnet`、`rb`、`md` 等常见别名。语言下拉框可以通过 `::part(code-language-trigger)`、`::part(code-language-menu)` 和 `::part(dropdown-option)` 调整样式。

代码块内 Enter 换行，Tab 插入四个空格，选中多行时可用 Tab / Shift + Tab 增加或减少缩进；Ctrl / Command + Enter 返回代码块后的正文。粘贴保留纯文本与缩进，代码文本不会作为 HTML 执行。在代码块中暂时禁用文字格式按钮，使用「清除格式」可以转换回普通段落。

高亮用原生 JavaScript 实现。配色变量全部写在 `code` 的 `style` 属性里，标记使用内联 `color: var(--code-keyword)` 等样式；字体、空白处理和背景同样使用内联样式，导出的 HTML 不需要组件样式表就能显示高亮。可以在初始代码块中指定配色：

```html
<widget-editor insert="divider,code">
    <pre><code data-language="javascript" style="--code-keyword:#8250df;--code-comment:#6a737d;">const message = "Hello";
console.log(message);</code></pre>
</widget-editor>
```

可配置的颜色变量包括 `--code-text`、`--code-background`、`--code-border`、`--code-comment`、`--code-keyword`、`--code-string`、`--code-number`、`--code-function`、`--code-property`、`--code-tag`、`--code-attribute`、`--code-operator`、`--code-punctuation` 和 `--code-regexp`。未指定的颜色会自动补齐，配色在源码切换和 HTML 导入导出后保留。HTML 代码在初始内容中需要转义，例如 `&lt;div&gt;`。

**源代码**：点击左下角的源码按钮查看或修改 HTML，再次点击返回可视化编辑。内容会按组件支持的标签和样式整理，并自动排版。普通文本段落使用 `p`，空白行输出为独立的 `br`。

### 快捷键

| 快捷键 | 功能 |
| --- | --- |
| Ctrl / Command + B | 加粗 |
| Ctrl / Command + I | 斜体 |
| Ctrl / Command + U | 下划线 |
| Ctrl / Command + Z | 撤销 |
| Ctrl / Command + Shift + Z，或 Ctrl / Command + Y | 重做 |
| Enter | 新建段落 |
| Shift + Enter | 段内换行 |
| Escape | 关闭弹窗、下拉菜单或取消格式刷 |

字体使用用户设备上已安装的字体，未安装时会使用备选字体。建议使用最新版的 Chrome、Edge、Firefox 或 Safari。

## 自定义样式

可以通过 CSS 变量调整编辑器外观，通过 `::part` 调整下拉菜单和图标，例如：

```css
widget-editor{
    --panel-border-color: #dce2e9;
    --button-active-color: #2876df;
    --focus-color: #8a95a4;
    --tooltip-background-color: #343b48;
    --tooltip-text-color: #fff;
    --editor-padding-x: 20px;
    --editor-padding-y: 20px;
}
widget-editor::part(dropdown-menu){
    border-radius: 6px;
}
widget-editor::part(dropdown-option){
    padding: 8px 12px;
}
widget-editor::part(toolbar-icon){
    width: 18px;
    height: 18px;
}
```

## 许可协议

[MIT](LICENSE)
