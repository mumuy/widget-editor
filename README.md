# widget-editor

一个基于 Web Component 的简易富文本编辑器，用于文章、公告、笔记等内容的编辑。通过 `<widget-editor>` 标签即可使用，无需依赖其他 JavaScript 框架，样式和图标已包含在组件文件中。

[在线演示](https://passer-by.com/widget-editor/) · [下载组件](https://github.com/mumuy/widget-editor/raw/refs/heads/main/dist/widget-editor.min.js)

## 支持的功能

- 文字格式：加粗、斜体、下划线、字体、字号、文字颜色、清除格式和格式刷。
- 段落排版：正文、H1～H6 标题、对齐方式、首行缩进、块引用、有序列表和无序列表。
- 内容插入：超链接、表格、图片、视频、音频、附件和常见 emoji。
- 表格编辑：增加或删除行列、合并和拆分单元格。
- 源代码查看与编辑、撤销和重做。

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
| `insert` | 允许使用的插入功能，以英文逗号分隔 | 不启用插入功能 |

`insert` 支持以下字段，字段顺序就是插入菜单中的顺序：

| 字段 | 功能 |
| --- | --- |
| `table` | 表格 |
| `image` | 图片 |
| `video` | 视频 |
| `audio` | 音频 |
| `attachment` | 附件 |
| `emoji` | 表情 |

例如，`insert="table,image"` 只提供表格和图片。启用全部插入功能：

```html
<widget-editor insert="table,image,video,attachment,audio,emoji"></widget-editor>
```

重复字段只显示一次，未知字段会被忽略。不设置 `insert` 或设置为空时，工具栏不显示插入按钮。该属性控制插入操作，已有内容仍可显示和编辑。

也可以在使用过程中调整配置：

```javascript
let editor = document.querySelector('#editor');
editor.setAttribute('insert','emoji,image');
editor.removeAttribute('insert');
```

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

**缩进**：点击缩进图标，为当前段落设置两个字宽的首行缩进；再次点击取消。有缩进时图标高亮。选中多个段落时，可以统一设置或取消缩进。

**格式刷**：在已有格式的文字处点击格式刷，再选中目标文字即可应用。每次只应用一次，再次点击格式刷或按 Escape 可取消。

**表格**：在 8×8 选择区域中移动鼠标预览行列数，点击格子确认范围，再点击「插入表格」。确认后范围保持固定，鼠标重新进入已选范围才恢复预览。可勾选「第一行作为表头」。点击表格内的单元格，会浮动显示行列操作；拖动或按住 Shift 选择连续单元格后，可合并或拆分。

**表情**：点击 emoji 仅选中并高亮，点击弹窗中的「插入表情」按钮后才插入。

**源代码**：点击最左侧的源码按钮查看或修改 HTML，再次点击返回可视化编辑。内容会按组件支持的标签和样式整理，并自动排版。普通文本段落使用 `p`，空白行输出为独立的 `br`。

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
