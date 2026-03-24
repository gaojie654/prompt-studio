# 🎨 Prompt Studio - AI提示词生成工具

> 为电商和自媒体平台生成营销图片提示词

## 📋 开发看板

### 🔴 待办 (Todo)
- [ ] Sprint 1: 基础设施建设
- [ ] Sprint 2: 核心功能开发
- [ ] Sprint 3: 平台适配+支付
- [ ] Sprint 4: 后台管理

### 🟡 进行中 (In Progress)
- [ ] M1: 需求确认 + 架构设计
     └─ [Issue #1] 前端界面设计
     └─ [Issue #2] 后端API开发
     └─ [Issue #3] 数据库设计
     └─ [Issue #4] UI/UX设计

### 🟢 完成 (Done)
- [x] 项目立项
- [x] 需求分析
- [x] GitHub仓库创建
- [x] 开发文档编写 (docs/DEVELOPMENT.md)
- [x] 进度表编写 (docs/PROGRESS.md)

## 📚 项目文档

- [📖 开发指南](docs/DEVELOPMENT.md) - 完整技术文档
- [📊 进度表](docs/PROGRESS.md) - 开发进度追踪
- [📐 产品规格](docs/SPEC.md) - 产品功能详细规格

---

## 🎯 产品功能

### 核心功能
1. **提示词搜索** - 输入需求，AI搜索匹配提示词
2. **参考图上传** - 用户上传产品图
3. **图片生成** - AI生成营销图片
4. **多平台适配** - 支持淘宝/抖音/小红书/京东/拼多多/公众号

### 平台规格
| 平台 | 主图尺寸 | 详情页 |
|------|---------|--------|
| 淘宝 | 800×800px | 宽度750px |
| 拼多多 | 750×352px | 宽度790px |
| 京东 | 800×800px | 宽度750px |
| 小红书 | 1080×1440px (3:4) | - |
| 抖音 | 1080×1920px (9:16) | - |
| 公众号 | 900×383px | - |

## 🛠️ 技术架构

### 模型配置
| 模块 | 模型 | 状态 |
|------|------|------|
| 提示词搜索 | 待配置 | 🔴 |
| 图片生成 | 待配置 | 🔴 |

### 技术栈
- **前端**: React + Tailwind CSS
- **后端**: Node.js / Python FastAPI
- **数据库**: PostgreSQL + Redis
- **支付**: 微信支付 / 支付宝

## 🚀 快速开始

（开发中...）

## 📁 项目结构

```
prompt-studio/
├── README.md
├── docs/
│   └── SPEC.md          # 产品规格文档
├── src/                 # 源代码
├── backend/             # 后端代码
├── frontend/            # 前端代码
└── SPEC.md
```

## 👥 团队协作

- 使用 GitHub Issues 管理任务
- 使用 GitHub Projects 看板（开发中）
- 代码通过 Pull Request 审核

## 📄 License

MIT
