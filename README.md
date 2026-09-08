# 小鹿 Lu · 个人博客（iPortfolio 复刻版）

程序媛小鹿的单页博客，视觉与结构复刻 [iPortfolio](https://bootstrapmade.com/iportfolio-bootstrap-portfolio-websites-template/) 模板，
内容本地化为中文；所有外部依赖均使用公共 CDN（jsDelivr / Google Fonts），无构建、无 npm。

## 目录结构

```
.
├── index.html            # 单页博客（Hero / 关于 / 技能 / 经历 / 文章 / 服务 / 评价 / 联系）
├── posts.json            # 博客文章数据（驱动「博客文章」区块）
├── download
│   ├── index.html        # 下载页（/download）
│   └── files/            # 安装包，如 printer-connection-1.3.5.apk
├── downloads.json        # 下载列表数据
└── assets
    ├── css/main.css      # iPortfolio 风格样式
    └── js
        ├── main.js       # 侧边栏 / AOS / 打字机 / Swiper / 文章加载
        └── download.js   # 下载列表渲染
```

## 本地预览

必须通过 http 访问（页面用 `fetch()` 读取 JSON，直接双击打开会被浏览器拦截）：

```bash
python -m http.server 8080
# 或
npx serve .
```

打开 http://localhost:8080 ，下载页 http://localhost:8080/download/

## 公共 CDN 依赖

| 资源 | CDN |
| --- | --- |
| Bootstrap 5.3.3 (CSS/JS) | `cdn.jsdelivr.net/npm/bootstrap@5.3.3` |
| Bootstrap Icons 1.11.3 | `cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3` |
| AOS 2.3.4 | `cdn.jsdelivr.net/npm/aos@2.3.4` |
| Swiper 11 | `cdn.jsdelivr.net/npm/swiper@11.1.14` |
| Typed.js 2.1.0 | `cdn.jsdelivr.net/npm/typed.js@2.1.0` |
| PureCounter 1.5.0 | `cdn.jsdelivr.net/npm/@srexi/purecounterjs@1.5.0` |
| Google Fonts | Roboto / Poppins / Raleway |
| 头像 | `api.dicebear.com` |
| 配图 | `picsum.photos`（可替换为自己的图片） |

## 写新文章

在 `posts.json` 的 `posts` 数组里加一条，刷新页面即出现在「博客文章」区块，
标签会自动生成筛选按钮，点击卡片弹出全文（正文支持简易 Markdown）。

| 字段 | 说明 |
| --- | --- |
| `id` | 唯一标识，同时用于生成封面随机图 |
| `title` / `excerpt` | 标题与摘要 |
| `date` | `YYYY-MM-DD`，用于排序 |
| `tags` | 标签数组（第一个标签作为筛选归类） |
| `pinned` | `true` 置顶 |
| `content` | 正文，支持标题、粗斜体、代码、列表、引用、链接、图片 |

## 添加下载包

把安装包放进 `download/files/`，然后在 `downloads.json` 增加条目：
`name / icon / platform / channel / description / currentVersion / latestVersion / size / updatedAt / changelog / available / file`。
`available` 为 `true` 且 `file` 存在时，按钮变为可点击下载。

## 发布到 GitHub Pages

推送到 GitHub 仓库 → Settings → Pages → `Deploy from a branch` → `main` / `/(root)`，
稍等一分钟访问 `https://<用户名>.github.io/<仓库名>/`。改动 JSON 后 push 即生效。
