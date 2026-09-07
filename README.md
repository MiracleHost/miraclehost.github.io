# 个人博客 · 静态站点

一个零依赖、零构建的静态博客：所有文章存放在 `posts.json`，页面用原生 JavaScript 动态加载并渲染，可直接部署到 GitHub Pages。

## 目录结构

```
.
├── index.html            # 博客首页
├── posts.json            # 文章内容（站点信息 + 文章）
├── downloads.json        # 下载页数据（软件包列表）
├── download
│   ├── index.html        # 下载页（对应 /download 路径）
│   └── files/            # 放安装包：APK / DMG / ZIP
└── assets
    ├── css/style.css     # 两个页面共用的样式
    └── js
        ├── theme.js      # 亮/暗主题（共用）
        ├── app.js        # 博客：加载 / 渲染 / 路由 / 搜索
        └── download.js   # 下载页：列表 / 筛选 / 下载按钮
```

访问路径：博客 `https://xxx.github.io/`，下载页 `https://xxx.github.io/download/`。

## 本地预览

因为要用 `fetch()` 读取 JSON，必须通过 http 访问（直接双击 `index.html` 会被浏览器拦截）：

```bash
# 任选一种
python -m http.server 8080
npx serve .
```

然后打开 http://localhost:8080

## 发布到 GitHub Pages

1. 新建仓库（例如 `blog`），把代码推到 `main` 分支
2. 仓库 **Settings → Pages → Build and deployment**
3. Source 选择 `Deploy from a branch`，分支选 `main` / 根目录 `/ (root)`
4. 保存后稍等 1 分钟，访问 `https://<用户名>.github.io/<仓库名>/`

之后每次改动 `posts.json` 并 push，线上内容会自动更新，无需重新构建。

## 写新文章

在 `posts.json` 的 `posts` 数组里新增一条即可，字段说明：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `id` | ✅ | 唯一标识，用于 URL（建议英文短横线） |
| `title` | ✅ | 标题 |
| `excerpt` | ✅ | 列表页摘要 |
| `date` | ✅ | `YYYY-MM-DD`，用于排序 |
| `tags` | | 标签数组，自动生成筛选按钮 |
| `emoji` | | 封面上的大字 emoji |
| `cover` | | 封面 CSS 渐变，省略时自动分配 |
| `pinned` | | `true` 时置顶，且会显示在大图上 |
| `content` | ✅ | 正文，支持简易 Markdown |

`content` 支持的语法：`#`~`###` 标题、`**粗体**`、`*斜体*`、`` `代码` ``、``` 代码块、列表、引用 `>`、链接、图片、分割线 `---`。

## 修改站点信息

`posts.json` 里的 `site` 对象控制头像、昵称、简介、社交链接等，改完刷新即生效。

## 下载页（/download）

数据来自根目录的 `downloads.json`，字段说明：

| 字段 | 说明 |
| --- | --- |
| `id` | 唯一标识 |
| `name` / `icon` | 软件名称与列表图标（emoji） |
| `platform` | 平台，自动生成筛选按钮（Android / Windows / macOS…） |
| `channel` | 稳定版 / 测试版等可选标签 |
| `description` | 一句话说明 |
| `currentVersion` | 当前版本，与 `latestVersion` 不同时显示「有新版本」 |
| `latestVersion` | 最新版本 |
| `size` / `updatedAt` | 安装包体积、更新日期 |
| `changelog` | 更新说明 |
| `available` | `false` 时下载按钮显示为「待上传」 |
| `file` | 安装包路径，放 `download/files/` 下，如 `files/xxx.apk` |

放入 APK 后，把对应条目的 `available` 改成 `true`、填好 `file` / `size` / 版本，按钮即可直接下载。

## 其他

- 支持亮色 / 暗色主题切换（跟随系统，也可手动切换并记忆）
- 支持标签筛选、关键词搜索、阅读进度条、上下篇导航
- 所有样式和脚本均为原生实现，无第三方依赖
