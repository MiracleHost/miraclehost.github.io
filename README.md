# 个人博客 · 静态站点

一个零依赖、零构建的静态博客：所有文章存放在 `posts.json`，页面用原生 JavaScript 动态加载并渲染，可直接部署到 GitHub Pages。

## 目录结构

```
.
├── index.html            # 页面骨架
├── posts.json            # 全部内容（站点信息 + 文章）
└── assets
    ├── css/style.css     # 样式
    └── js/app.js         # 加载 / 渲染 / 路由 / 搜索
```

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

## 其他

- 支持亮色 / 暗色主题切换（跟随系统，也可手动切换并记忆）
- 支持标签筛选、关键词搜索、阅读进度条、上下篇导航
- 所有样式和脚本均为原生实现，无第三方依赖
