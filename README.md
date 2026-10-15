# widget-editor

一个基于 Web Component 的简易富文本编辑器，用于文章、公告、笔记等内容的编辑。通过 `<widget-editor>` 标签即可使用，无需依赖其他 JavaScript 框架，样式和图标已包含在组件文件中。

[在线演示](https://passer-by.com/widget-editor/) · [下载组件](https://github.com/mumuy/widget-editor/raw/refs/heads/main/dist/widget-editor.min.js)

## 支持的功能

- 文字格式：加粗、斜体、下划线、删除线、上标、下标、字体、字号、文字颜色、文字背景、清除格式和格式刷。
- 段落排版：正文、H1～H6 标题、对齐方式、首行缩进、块引用、有序列表和无序列表。
- 内容插入：超链接、表格、图片、视频、音频、附件和常见 emoji。
- 表格编辑：增加或删除行列、合并和拆分单元格。
- 源代码查看与编辑、撤销和重做。
- 简体中文、繁体中文和英语界面，可随时切换语言。

## 快速使用

下载 `widget-editor.min.js` 并放入你的项目，然后在页面中引入：

```html
<script src="./widget-editor.min.js" defer></script>

<widget-editor id="editor" insert="table,image,emoji" placeholder="请输入内容…" height="480">
    <h2>开始编辑</h2>
    <p>选中文字后，可以使用工具栏调整格式。</p>
</widget-editor>
```

标签内的 HTML 会作为初始内容，也可以使用空标签创建空白编辑器。多个编辑器可以在同一页面中独立使用。

### 属性配置

| 属性 | 说明 | 默认值 |
| --- | --- | --- |
| `name` | 原生表单提交时的字段名，不设置时不提交 | 空字符串 |
| `form` | 关联表单的 `id`，可用于表单外的编辑器 | 最近的父级表单 |
| `disabled` | 布尔属性，禁用编辑和操作，不参与提交及校验 | 不设置 |
| `required` | 布尔属性，要求填写文字或插入图片等内容 | 不设置 |
| `placeholder` | 空白编辑器中的提示文字 | `在这里开始写作…` |
| `height` | 编辑区域高度，单位为 px，有效范围为 160～2000 | `480` |
| `insert` | 插入菜单中的功能，以英文逗号分隔 | `divider,table,image,video,attachment,audio,emoji,code` |
| `custom` | 工具栏功能及显示顺序，以英文逗号分隔 | 使用默认工具栏 |
| `view` | 底部源码、全屏和手机预览按钮及显示顺序 | `source,fullscreen,mobile` |
| `language` | 界面语言：`zh-CN`、`zh-HK` 或 `en-US` | `zh-CN` |
| `heading` | 标题下拉菜单的选项及顺序 | `p,h1,h2,h3,h4,h5,h6` |
| `fontfamily` | 字体下拉菜单的选项及顺序 | 下方列出的全部字体 |
| `fontsize` | 字号下拉菜单的选项及顺序，单位为 px | `12,14,16,18,20,24,28,32,36,48` |
| `alignment` | 对齐下拉菜单的选项及顺序 | `left,center,right,justify` |
| `image` | 图片允许的插入方式 | `upload,url,resource` |
| `video` | 视频允许的插入方式 | `upload,url,iframe,resource` |
| `audio` | 音频允许的插入方式 | `upload,url,resource` |
| `attachment` | 附件允许的插入方式 | `upload,url,resource` |
| `image-batch` | 每次上传或选择图片数量上限；空值表示不限数量 | `1` |
| `video-batch` | 每次上传或选择视频数量上限；空值表示不限数量 | `1` |
| `attachment-batch` | 每次上传或选择附件数量上限；空值表示不限数量 | `1` |
| `audio-batch` | 每次上传或选择音频数量上限；空值表示不限数量 | `1` |

`insert` 支持以下字段，字段顺序就是插入菜单中的顺序：

| 字段 | 功能 |
| --- | --- |
| `divider` | 分割线 |
| `table` | 表格 |
| `image` | 图片 |
| `video` | 视频 |
| `attachment` | 附件 |
| `audio` | 音频 |
| `emoji` | 表情 |
| `code` | 代码块 |

不设置 `insert` 时，默认按上述顺序提供全部插入功能：

```html
<widget-editor></widget-editor>
```

例如，`insert="table,image"` 只提供表格和图片。重复字段只显示一次，未知字段会被忽略。显式设置 `insert=""` 可隐藏插入菜单；通过 `custom` 配置的独立插入按钮仍可使用。已有内容始终可以显示和编辑。

也可以在使用过程中调整配置：

```javascript
let editor = document.querySelector('#editor');
editor.setAttribute('insert','emoji,image');
editor.removeAttribute('insert'); // 恢复默认插入菜单
```

### 下拉菜单选项

通过组件属性，可以分别控制标题、字体、字号和对齐菜单开放的选项及顺序：

```html
<widget-editor
    heading="p,h2,h3"
    fontfamily="yahei,simsun,kaiti"
    fontsize="14,16,20,24"
    alignment="left,center">
</widget-editor>
```

属性使用英文逗号分隔，忽略大小写、重复值和不支持的值。字号填写数字，不加 `px`。设置为空（例如 `heading=""`）会隐藏对应下拉框；不设置或移除属性则使用全局默认值。`custom` 控制工具栏是否显示该功能，这四个属性控制菜单中的选项。

字体支持以下字段：

| 字段 | 字体 |
| --- | --- |
| `default` | 默认字体 |
| `yahei` | 微软雅黑 |
| `simsun` | 宋体 |
| `simhei` | 黑体 |
| `kaiti` | 楷体 |
| `fangsong` | 仿宋 |
| `pingfang` | 苹方 |
| `dengxian` | 等线 |
| `stsong` | 华文宋体 |
| `stkaiti` | 华文楷体 |
| `stxihei` | 华文细黑 |
| `sourceSans` | 思源黑体 |
| `sourceSerif` | 思源宋体 |

运行时修改属性会立即更新菜单，已有内容保持不变：

```javascript
editor.setAttribute('fontsize','16,24,36');
editor.setAttribute('alignment','left,right');
editor.removeAttribute('fontsize'); // 恢复全局默认字号选项
```

所有属性的默认值统一在 `src/module/config.js` 的 `attributes` 中配置，例如 `attributes.fontsize.default`；组件实例上的属性优先。

### 自定义工具栏

未设置 `custom` 时，默认顺序为：标题、字体、字号、对齐、缩进、加粗、斜体、下划线、删除线、上标、下标、文字颜色、文字背景、块引用、有序列表、无序列表、超链接、清除格式、格式刷、插入菜单。

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
| `backgroundColor` | 文字背景 |
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
| `mobile` | 手机预览 |

独立插入按钮无需设置 `insert` 属性，仍使用相同的弹窗和 `upload` 事件。两种配置可以一起使用：

```html
<widget-editor custom="bold,italic,image,insert" insert="table,video,emoji"></widget-editor>
```

字段不区分大小写，重复字段只显示一次，未知字段会被忽略。`custom=""` 只显示撤销和重做；不设置或移除 `custom` 则恢复默认工具栏。底部的源码、全屏和手机预览按钮由 `view` 控制，字数统计保留；配置 `source`、`fullscreen` 或 `mobile` 时，也会在工具栏中提供对应按钮。

支持运行时修改，不会清空内容、选区或撤销记录：

```javascript
editor.setAttribute('custom','heading,bold,link,image');
editor.removeAttribute('custom');
```

### 底部操作配置

`view` 使用英文逗号分隔，支持 `source`（源码）、`fullscreen`（全屏）、`mobile`（手机预览），字段顺序就是按钮顺序：

```html
<widget-editor view="fullscreen,source"></widget-editor>
<widget-editor view="mobile"></widget-editor>
<widget-editor view=""></widget-editor>
```

不设置或移除 `view` 时，使用配置文件中的默认值 `source,fullscreen,mobile`。忽略大小写、重复项及无效字段；设为空隐藏底部操作按钮，字数统计保留。通过 `custom` 配置的同名工具栏按钮仍可使用，例如 `custom="bold,source" view=""` 只在工具栏提供源码功能。

运行时修改立即生效；如果正在使用的模式在底部和工具栏中均不再开放，会自动退出，源码中的修改会整理并保留。

```javascript
editor.setAttribute('view','mobile,fullscreen');
editor.removeAttribute('view'); // 恢复默认底部按钮及顺序
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

### 原生表单

组件通过 `formAssociated` 和 `attachInternals()` 关联原生表单，无需隐藏输入框。设置 `name` 后，提交值为与 `editor.value` 相同的 HTML；可通过 `FormData` 读取，也可直接提交表单。

```html
<form id="article-form">
    <widget-editor name="content" required>
        <p>初始内容</p>
    </widget-editor>
    <button type="submit">保存</button>
    <button type="reset">重置</button>
</form>
```

```javascript
let form = document.querySelector('#article-form');
form.addEventListener('submit',function(event){
    event.preventDefault();
    let content = new FormData(form).get('content');
    console.log(content);
});
```

`required` 会检查实际内容：空白文字、空段落和占位换行不算填写，图片、视频、音频、表格和分割线可以单独作为内容。表单的 `checkValidity()`、`reportValidity()` 和提交前校验均有效；编辑器也提供 `validity`、`validationMessage`、`willValidate`、`checkValidity()`、`reportValidity()`、`setCustomValidity(message)`，例如：

```javascript
let editor = form.querySelector('widget-editor');
editor.setCustomValidity('请检查文章内容');
editor.reportValidity();
editor.setCustomValidity(''); // 清除自定义错误
```

`form.reset()` 或重置按钮会恢复组件首次初始化时的内容，并清空撤销记录，不触发 `change`。通过 `value` 设置内容也会立即同步表单值，但不会改变重置时的初始内容。浏览器恢复表单状态时会恢复 HTML 内容。

可以通过 `editor.name`、`editor.required`、`editor.disabled` 读写对应属性，通过 `editor.form` 获取关联表单，`editor.labels` 获取关联标签。`disabled` 和 `required` 是布尔属性，存在即生效，`disabled="false"` 也会禁用；取消时移除属性或设置 `editor.disabled = false`。父级 `<fieldset disabled>` 同样会禁用编辑器。

编辑器在表单外时，用 `form` 指定要关联的表单：

```html
<form id="article-form"></form>
<widget-editor name="content" form="article-form"></widget-editor>
```

### 事件

| 事件 | 触发时机 | `detail` |
| --- | --- | --- |
| `ready` | 组件首次初始化完成 | 无 |
| `change` | 用户编辑内容或执行编辑操作 | `{value,text}` |
| `request` | 切换到素材库标签，或弹框默认打开素材库 | 素材类型、插入数量限制及列表加载回调，见下方说明 |
| `add` | 点击「上传素材」选择文件且通过校验后立即触发 | 素材类型、插入数量限制及新增完成/失败回调，见下方说明 |
| `remove` | 用户点击素材右上角的移除按钮 | 素材类型、URL 及删除完成/失败回调，见下方说明 |
| `upload` | 用户选择文件且通过校验后立即触发 | 文件及上传回调，见下方说明 |

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

默认插入菜单已包含图片、视频、音频和附件，点击对应选项即可插入。未配置插入方式属性时，开放该类型的全部方式，默认打开「上传文件」：

- **上传文件**：选择本地文件即触发 `upload` 事件，由你的页面负责上传，成功后点击插入。
- **素材库**：切换标签时触发 `request` 事件，返回素材列表后在弹框内选择，点击插入。默认每行四个，每个至少 120px，窄屏自动减少列数，超出列表高度时滚动显示。
- **网络地址**：填写文件地址，点击插入即可使用，支持 HTTP、HTTPS 或相对地址。
- **嵌入 iframe**（仅视频）：仅需粘贴第三方视频网站提供的 iframe 代码，再点击「插入视频」，保留代码中原有的 `title`。组件自动写入 `width: 100%`、`height: auto`、`max-width: 100%` 和 `aspect-ratio: 16 / 9`，高度随容器宽度按比例变化；嵌入地址须使用 HTTP、HTTPS 或相对地址。插入的 iframe 支持源码往返、删除及撤销。

分别设置 `image`、`video`、`audio`、`attachment` 属性，可以限制插入方式。使用 `upload` 表示上传文件，`url` 表示填写地址，`resource` 表示素材库，`iframe` 仅适用于视频；tabs 按配置顺序显示，默认打开第一项：

```html
<widget-editor
    insert="image,video,audio,attachment"
    image="upload,url"
    video="upload,url,iframe"
    audio="url"
    attachment="upload">
</widget-editor>
```

不设置属性时全开放；设置为空（例如 `video=""`）则禁用该类型的插入功能。无效字段会忽略，重复字段仅保留一次。这些属性只配置插入方式；自定义工具栏时，通过 `custom` 加入插入菜单或对应的独立按钮，也可调用下面的组件方法。运行时修改属性会立即生效，并关闭该类型已打开的弹框；未完成的旧上传回调也会失效。

### 通过方法打开插入弹框

使用 `editor.openInsertDialog(type,mode)`，可自行绑定外部按钮，无需配置节点 ID：

```html
<button type="button" id="insertImage">插入图片</button>
<widget-editor id="editor" image="upload,url,resource"></widget-editor>
<script>
    let editor = document.querySelector('#editor');
    document.querySelector('#insertImage').addEventListener('click',function(){
        editor.openInsertDialog('image','upload');
    });
</script>
```

`type` 支持 `image`、`video`、`audio`、`attachment`；`mode` 支持 `upload`、`url`、`iframe`、`resource`，其中 `iframe` 仅适用于视频。省略 `mode` 时打开该类型配置的第一项；指定方式须已在对应属性中开放。例如 `video="url,resource"` 时，不能通过方法打开视频上传或 iframe。

```javascript
editor.openInsertDialog('image','resource'); // 素材库，触发 request 事件
editor.openInsertDialog('video','iframe');
editor.openInsertDialog('audio','url');      // 网络地址
editor.openInsertDialog('attachment');       // 配置中的第一项
```

方法返回打开的弹框，参数无效、组件未连接或尚未初始化、组件被禁用、正在编辑源码或代码块时返回 `null`，不打开弹框。此入口不依赖工具栏是否显示对应功能，即使设置 `custom="" insert=""` 也可调用，但仍遵守媒体类型的方式权限。插入沿用原来的光标或选区，无选区时插入文档末尾。

`image-bind`、`video-bind`、`audio-bind`、`attachment-bind` 已移除，外部按钮请改为自行调用此方法。素材库的配置值现为 `resource`，加载素材的事件名仍为 `request`。

### 处理上传

通过 `image-batch`、`video-batch`、`attachment-batch`、`audio-batch` 设置每次选择文件的数量上限：

```html
<widget-editor image-batch="9" video-batch="3" attachment-batch="" audio-batch="5"></widget-editor>
```

未设置时使用配置文件中的默认值（默认单文件）；空值表示不限数量，正整数表示上限，`1` 表示单文件，其他无效值回退到默认值。数量限制同时适用于文件上传和素材库选择，不影响 URL 和 iframe。选择的全部文件均需通过数量、类型和单个文件大小校验，才会触发一次 `upload` 或 `add` 事件，两种上传使用相同限制。运行时修改数量限制会关闭对应弹框，未完成的旧上传回调随即失效。

组件不会自行向服务器上传文件。`files` 始终为 `File[]`，单文件上传也传数组。全部上传成功后调用 `onComplete(urls)`，地址数组须与 `files` 数量相同、顺序对应；单文件也使用 `[url]`。组件校验全部地址后保留上传结果；用户点击「插入」才一次性写入原来的光标或选区位置，支持整批撤销。批量上传图片时，每张图片独立使用一个 `p` 包裹。描述字段应用于本批全部文件；未填写视频、音频描述或附件文字时，分别使用每个文件的名称。

这是上传接口调整：原来的 `detail.file` 改为 `detail.files`，完成回调 `onUploadComplete` 改为 `onComplete`，失败回调 `onUploadError` 改为 `onError`；完成时统一传入地址数组（单文件也使用 `[url]`）。失败、数量不匹配或地址无效时不会插入任何文件，弹框保留，允许整批重试。

选择文件后立即触发 `upload`，无需点击「插入」。上传期间及失败时不能插入；失败后重新选择文件重试，重新选文件会清除旧上传结果。成功后点击「插入」只使用已有结果，不重复触发上传。

`upload` 和 `add` 事件的 `detail` 完全相同：

| 字段 | 说明 |
| --- | --- |
| `files` | 按选择顺序排列的原始 `File[]`，单文件也使用数组 |
| `type` | `image`、`video`、`audio` 或 `attachment` |
| `limit` | 本次允许的最大资源数量，未限制时为 `Infinity` |
| `onComplete(urls)` | 传入与 `files` 一一对应的数组，元素为 URL 字符串或 `{original,thumbnail}`，插入使用原地址 |
| `onError(err)` | 上传失败时传入 `Error` 或错误消息，允许用户重试 |
| `onProgress(percent)` | 更新整批上传进度，范围为 0～100 |

下面的示例假设上传接口为 `/api/upload`，接收多个同名 `files` 字段，成功响应为 `{ "urls": ["https://example.com/uploads/file.png"] }`，返回顺序与上传顺序一致：

```javascript
customElements.whenDefined('widget-editor').then(function(){
    let editor = document.querySelector('#editor');
    editor.addEventListener('upload',function(event){
        let {files,type,onComplete,onError,onProgress} = event.detail;
        let request = new XMLHttpRequest();
        request.open('POST','/api/upload');
        request.responseType = 'json';
        request.upload.onprogress = function(event){
            if(event.lengthComputable){
                onProgress(event.loaded/event.total*100);
            }
        };
        request.onload = function(){
            if(request.status>=200&&request.status<300&&Array.isArray(request.response?.urls)){
                onComplete(request.response.urls);
            }else{
                onError(request.response?.message||'上传失败，请重试');
            }
        };
        request.onerror = ()=>onError('网络错误，请重试');
        request.onabort = ()=>onError('上传已取消');

        let data = new FormData();
        files.forEach(file=>data.append('files',file));
        data.append('type',type);
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

### 接入素材库

四种媒体都支持 `resource`，例如 `image="upload,url,resource"` 或 `video="resource"`。切换到「素材库」时触发 `request` 事件；若素材库是配置的第一项，打开弹框就会请求。再次点击该标签也可重新加载。

`request` 的 `event.detail` 包含：

| 字段 | 说明 |
| --- | --- |
| `type` | `image`、`video`、`audio` 或 `attachment` |
| `limit` | 本次最多可插入的素材数量，沿用对应 `*-batch` 配置，不限制返回的列表长度 |
| `onComplete(materials)` | 数组元素支持 URL 字符串或 `{original,thumbnail}` 对象，允许混用；空数组表示暂无素材，按原图地址去重 |
| `onError(err)` | 加载失败时传入 `Error` 或错误消息 |

```javascript
editor.addEventListener('request',async function(event){
    let {type,onComplete,onError} = event.detail;
    try{
        // 示例接口返回 {urls: ['https://example.com/image.png', ...]}。
        let response = await fetch('/api/materials?type='+encodeURIComponent(type));
        if(!response.ok){throw new Error('素材加载失败');}
        let data = await response.json();
        onComplete(data.urls);
    }catch(error){
        onError(error);
    }
});
```

字符串使用同一个地址预览和插入；对象的 `thumbnail` 用于预览，`original` 用于插入，省略 `thumbnail` 时使用原地址。两种格式可以混用：

```javascript
onComplete([
    'https://example.com/photo.jpg',
    {
        original:'https://example.com/original.jpg',
        thumbnail:'https://example.com/thumbnail.jpg'
    }
]);
```

视频、音频、附件也可以通过 `thumbnail` 指定预览图片。原地址和缩略图地址都会校验，任何一项无效则整批拒绝。`upload` 的 `onComplete` 也接受这两种格式，仍须按文件顺序返回相同数量的元素，插入时使用原地址。

返回列表只负责展示，不会直接插入。素材默认每行四个，每个至少 120px，窄屏自动减少列数，列表沿用其他标签页的高度，超出时内部滚动。默认单选，再选其他素材会切换选中项；设置 `*-batch` 后可多选，最多选中对应数量；空值不限数量。弹框左下角共用一个状态节点：正常时显示已选数量，超出限制或操作失败时显示提示；继续有效选择后恢复计数。用户点击「插入」才将选中素材按列表顺序插入原来的光标或选区，支持整批撤销，批量图片各自使用 `p` 包裹。

素材库底部「插入」左侧的「上传素材」会打开组件的文件选择器，选好文件并通过校验后触发 `add`。它与 `upload` 共用选择、数量/类型/大小校验和进度处理，`detail` 完全相同：`files`、`type`、`limit`、`onComplete(materials)`、`onError(err)`、`onProgress(percent)`。无需外部再打开文件选择器。

完成时按文件顺序返回相同数量的元素，支持 URL 字符串和 `{original,thumbnail}` 对象混用。新增素材放到列表最前面，按原地址去重并更新缩略图，保留已有选中状态，不会直接插入文档。上传进度显示在「上传素材」按钮上。

可以复用同一个处理函数：

```javascript
async function uploadResources(event){
    let {files,type,onComplete,onError,onProgress} = event.detail;
    try{
        // 自行实现上传服务，按 files 顺序返回素材数组，并调用 onProgress 更新进度。
        let materials = await uploadFiles(files,{type,onProgress});
        onComplete(materials);
    }catch(error){
        onError(error);
    }
}
editor.addEventListener('upload',uploadResources);
editor.addEventListener('add',uploadResources);
```

每个素材右上角的移除按钮触发 `remove` 事件，其 `event.detail` 包含 `type`、`url`、`limit`、`onComplete()`、`onError(err)`。外部删除成功后调用 `onComplete()`，组件才从当前列表移除该素材；失败调用 `onError(err)`，保留素材及选中状态。`url` 始终是原地址（对象的 `original`），不使用缩略图地址。此操作不修改文档中已插入的内容。

```javascript
editor.addEventListener('remove',async function(event){
    let {type,url,onComplete,onError} = event.detail;
    try{
        let response = await fetch('/api/materials',{
            method:'DELETE',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify({type,url})
        });
        if(!response.ok){throw new Error('素材删除失败');}
        onComplete();
    }catch(error){
        onError(error);
    }
});
```

`upload`、`request`、`add`、`remove` 都由外部处理数据，组件不会自行调用接口。回调仅生效一次；切换标签、关闭弹框、修改对应权限或数量限制、替换内容、禁用或移除组件后，未完成的素材加载、新增与移除回调失效。加载失败可重新点击「素材库」重试，新增和移除失败可再次点击对应按钮。媒体弹框底部不显示「取消」，可通过右上角关闭或 Escape 退出。仅「上传文件」标签保留进度反馈区，其他标签在有错误时直接显示提示，不预留反馈区。

## 编辑操作

主工具栏和底部按钮在鼠标悬停或键盘聚焦时显示功能提示。表格和超链接的浮动按钮直接显示功能文字，不再额外提示。提示不会占用编辑区域，也不会写入 HTML 内容。

**全屏**：点击左下角源码按钮右侧的全屏图标，让编辑器铺满浏览器可视区域。页面停止滚动，编辑内容在组件内滚动，工具栏和底部栏保持可见；源代码模式也支持。再次点击或按 Escape 退出，恢复页面原来的滚动位置。

**手机预览**：点击全屏按钮右侧的手机图标，以 375×667 的视口查看并编辑当前内容，文字输入、格式、插入和浮动编辑工具均可使用。标题、正文、列表、引用和表格的默认字号或间距会适配手机，已有的内联样式继续生效，这些预览样式不会写入输出 HTML。再次点击或按 Escape 恢复原来的尺寸，保留当前内容与光标，并使光标保持可见。切换视口不会改变 HTML 或新增撤销记录，实际编辑支持撤销重做。源代码模式下开启预览，会先将当前源码整理为可视化内容；预览时点击源码按钮则返回源码编辑。支持与全屏一起使用，空间不足时等比例缩小显示，内容仍按 375px 的宽度排版。

**缩进**：点击缩进图标，为当前段落设置两个字宽的首行缩进；再次点击取消。有缩进时图标高亮。选中多个段落时，可以统一设置或取消缩进。

**上标与下标**：选中文字后点击对应按钮，例如 `x²`、`H₂O`；再次点击取消，两个格式互斥。也可以先设置格式再输入文字，HTML 使用 `sup` 或 `sub` 标签。

**删除线**：选中文字后点击删除线按钮，再次点击取消。可以与加粗、斜体和下划线叠加，也可以先开启删除线再输入文字。

**文字颜色与背景**：文字背景按钮位于文字颜色之后，两者共用颜色面板，支持预设颜色和 `#RRGGBB` 自定义色值。背景色板使用更浅的颜色，选择「无背景色」可取消着色，保留文字颜色等其他格式；也可以先选择颜色再输入文字。格式刷会复制背景色，修改支持撤销重做及源码往返。自定义工具栏通过 `custom="color,backgroundColor"` 显示这两个功能。

**超链接与下划线**：超链接以颜色和淡虚线区分，虚线是编辑器中的视觉提示，不会写入 HTML；文字下划线由下划线按钮独立控制，可以添加或取消，不影响链接地址。

插入超链接时，可勾选「在新窗口打开」，默认勾选；取消勾选后在当前窗口打开。编辑已有链接时会保留原来的打开方式，新窗口链接输出 `target="_blank"` 和 `rel="noopener noreferrer"`，当前窗口链接输出 `target="_self"`，源码切换、导入和撤销重做会保留设置。

鼠标停留在链接上、光标进入链接或选中链接文字时，附近会显示浮动编辑框，可以直接修改链接地址、显示文字和打开方式，点击「保存」生效；点击「取消超链接」将链接转换为纯文本。按 Escape 可关闭，修改和取消均支持撤销；附件下载链接不显示此操作。只修改地址或打开方式时，链接文字已有的加粗等格式会保留。

**块引用**：再次点击块引用按钮可以取消引用。在引用开头按退格可将当前段落移出引用；空引用段落按退格、Delete 或回车也可退出引用，前后引用内容保留，支持撤销和重做。

**段落边界删除**：两个相邻的 `p` 在边界按退格或 Delete 时合并，保留图片、文字和行内格式，光标停在原来的连接处。回车将图片拆到两个段落后，可通过边界删除恢复为同一段落。右侧为标题、表格、代码块等其他块时，保留该块并删除前面的 `p`，不进行合并。组件自动补出的光标停留点不计作真实段落，操作支持撤销和重做。

**清除格式**：将选中内容转换为纯文本段落，使用不带属性的 `p` 标签，移除标题、列表、引用、表格、链接及文字样式，保留文字和分段；选区中的图片、视频等非文本内容会移除。没有选中文字时处理当前段落。未选中文字的行内格式保留，所涉及段落的标签和段落样式一并清除，支持撤销。

**格式刷**：在已有格式的文字处点击格式刷，再选中目标文字即可应用。每次只应用一次，再次点击格式刷或按 Escape 可取消。

**表格**：在 8×8 选择区域中移动鼠标预览行列数，点击格子确认范围，再点击「插入表格」。确认后范围保持固定，鼠标重新进入已选范围才恢复预览。可勾选「第一行作为表头」。点击表格内的单元格，会浮动显示行列操作；拖动或按住 Shift 选择连续单元格后，可合并或拆分。

底部左侧依次显示源代码、全屏和手机预览按钮，右侧显示字数统计。链接校验、文件类型或大小限制、上传失败等信息直接显示在对应弹窗内。

HTML 输出中，纯文本单元格保持在一行，例如 `<td>文字</td>`；空白单元格使用 `<td>&nbsp;</td>`，不输出占位的 `<br>`。表头单元格使用相同规则，单元格内实际输入的换行、图片和段落会保留。

**表情**：通过单色图标切换笑脸情绪、人物手势、动物自然、食物饮品、旅行地点、活动庆祝、生活物品和符号爱心分类，不包含国旗。切换分类不会改变已选表情；点击 emoji 仅选中并高亮，点击弹窗中的「插入表情」按钮后才插入。支持方向键切换分类和选择表情，Home、End 跳转到当前分类的首尾。

**分割线与代码块**：通过 `insert="divider,code"` 放入插入菜单，也可以通过 `custom="bold,divider,code"` 直接放入工具栏。分割线输出为 `hr`；代码块使用 `pre` 和 `code`，选中的文字可直接转换为代码块。

光标进入代码块时，右上方会显示固定在代码块上的自定义语言下拉框，支持 HTML、JavaScript、CSS、Java、TypeScript、PHP、Python、Go、JSON、SQL、Bash、C++、C、C#、JSX、Visual Basic、Ruby、Swift、Lua、Markdown、Kotlin、XML、Rust 和纯文本。切换语言会重新高亮，保留文字和选区，支持撤销。HTML 中的 `script`、`style` 内容分别按 JavaScript、CSS 高亮；XML 支持声明、标签、属性、注释和 CDATA；JSX 的标签与表达式分别识别，Markdown 围栏代码按指定语言高亮。Kotlin 支持三引号字符串，Rust 支持原始字符串、字符和生命周期标注，两者均支持嵌套块注释。

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
