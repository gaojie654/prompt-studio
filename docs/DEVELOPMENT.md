# 📖 Prompt Studio 开发指南

> 文档版本: v1.1 | 更新日期: 2026-03-25 | 负责人: 虾宝1号

---

## 一、项目概述

### 1.1 项目信息

| 项目 | 内容 |
|------|------|
| **项目名称** | Prompt Studio |
| **项目类型** | AI提示词生成工具 |
| **目标用户** | 电商卖家、自媒体创作者 |
| **核心功能** | 上传产品图 + AI生成营销图片 |
| **技术架构** | B/S (Browser-Server) |
| **开发模式** | 敏捷开发 + GitHub Issues |

### 1.2 团队成员

| 角色 | 职责 | Agent |
|------|------|-------|
| 产品经理 | 需求分析、产品设计 | 陛下 |
| 项目管理 | 任务分配、进度追踪 | 虾宝1号 |
| 前端开发 | React页面开发 | Claude Code |
| 后端开发 | API接口开发 | Claude Code |
| UI设计 | 界面设计 | ui-ux-pro-max |
| 测试 | 功能测试 | TBD |

### 1.3 GitHub仓库

```
https://github.com/gaojie654/prompt-studio
```

---

## 一、本地开发指南

### 1.1 环境要求

| 软件 | 版本要求 | 备注 |
|------|----------|------|
| Node.js | 20.x+ | 后端运行时 |
| pnpm / npm | 最新版 | 包管理器 |
| PostgreSQL | 15.x | 主数据库 |
| Redis | 7.x | 缓存（可选） |
| Git | 最新版 | 版本控制 |

### 1.2 快速启动

#### 1. 克隆代码
```bash
git clone https://github.com/gaojie654/prompt-studio.git
cd prompt-studio
```

#### 2. 后端启动

```bash
cd backend

# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env
# 编辑 .env，填写必要的配置（见 1.3 环境变量说明）

# 数据库迁移
pnpm db:migrate

# 数据库种子（可选）
pnpm db:seed

# 启动开发服务器
pnpm dev
```

后端服务将运行在 `http://localhost:3000`

#### 3. 前端启动

```bash
cd frontend

# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local

# 启动开发服务器
pnpm dev
```

前端服务将运行在 `http://localhost:5173`

#### 4. Docker 启动（推荐）

```bash
# 一键启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止
docker-compose down
```

### 1.3 环境变量说明

#### backend/.env

```env
# 应用配置（必须）
NODE_ENV=development
PORT=3000
BASE_URL=http://localhost:3000

# 数据库（必须）
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/prompt_studio

# JWT（必须）
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# 通义万相图片生成（备选，当SiliconFlow未配置时使用）
WANX_API_KEY=your-wanx-api-key
WANX_BASE_URL=https://dashscope.aliyuncs.com/api/v1
WANX_MODEL=wanx2.1
WANX_TIMEOUT=60000
WANX_RETRY_ATTEMPTS=3

# SiliconFlow图片生成（推荐，性价比更高）
# 获取API Key: https://docs.siliconflow.cn/
# Kolors模型支持: 1024x1024, 768x1344, 1344x768, 720x1440, 1440x720, 1920x720
# 支持文生图和图生图模式
SILICONFLOW_API_KEY=your-siliconflow-api-key
SILICONFLOW_API_URL=https://api.siliconflow.cn/v1
SILICONFLOW_MODEL=Kolors
SILICONFLOW_TIMEOUT=120000
SILICONFLOW_RETRY_ATTEMPTS=2

# 阿里云OSS（可选，用于存储生成的图片）
OSS_ACCESS_KEY_ID=your-access-key
OSS_ACCESS_KEY_SECRET=your-secret-key
OSS_BUCKET=prompt-studio
OSS_REGION=oss-cn-hangzhou

# 微信支付（可选，接入支付功能时需要）
WECHAT_APP_ID=your-app-id
WECHAT_MCH_ID=your-mch-id
WECHAT_API_KEY=your-api-key
WECHAT_CERT_PATH=/path/to/cert.pem

# 支付宝（可选，接入支付功能时需要）
ALIPAY_APP_ID=your-app-id
ALIPAY_PRIVATE_KEY=your-private-key
ALIPAY_PUBLIC_KEY=alipay-public-key
```

#### frontend/.env.local

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_APP_NAME=Prompt Studio
```

### 1.4 创建管理员账号

通过数据库直接创建：

```sql
-- 创建一个管理员用户
INSERT INTO users (email, password, role, "isActive", "createdAt", "updatedAt")
VALUES (
  'admin@promptstudio.com',
  -- bcrypt hash of 'admin123' (使用 bcryptjs 生成)
  '$2a$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  'ADMIN',
  true,
  NOW(),
  NOW()
);
```

或通过 seed 文件：
```bash
cd backend && pnpm db:seed
```

### 1.5 常用命令

```bash
# 后端
cd backend
pnpm dev          # 开发模式启动
pnpm build        # 生产构建
pnpm db:migrate   # 运行数据库迁移
pnpm db:studio    # Prisma 数据库可视化
pnpm lint         # 代码检查
pnpm test         # 运行测试

# 前端
cd frontend
pnpm dev          # 开发模式启动
pnpm build        # 生产构建
pnpm preview      # 预览生产构建
pnpm lint         # 代码检查
```

### 1.6 项目结构

```
prompt-studio/
├── backend/
│   ├── src/
│   │   ├── controllers/    # 路由控制器
│   │   ├── middleware/      # 中间件（认证、权限、错误处理）
│   │   ├── routes/          # 路由定义
│   │   ├── services/         # 业务逻辑
│   │   ├── utils/            # 工具函数
│   │   └── config/           # 配置文件
│   ├── prisma/
│   │   ├── schema.prisma     # 数据库Schema
│   │   └── seed.ts           # 种子数据
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/              # API 请求封装
│   │   ├── components/       # 通用组件
│   │   ├── hooks/             # 自定义 Hooks
│   │   ├── pages/             # 页面组件
│   │   │   └── admin/         # 管理后台页面
│   │   ├── stores/            # 状态管理
│   │   └── utils/             # 工具函数
│   └── package.json
├── docs/                     # 文档
└── docker-compose.yml        # Docker 配置
```

---

## 二、技术架构

### 2.1 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        用户端                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │   首页   │  │  工作台   │  │ 提示词库  │  │ 个人中心  │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
└───────┼──────────────┼──────────────┼──────────────┼───────┘
        │              │              │              │
        └──────────────┴──────────────┴──────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       API 网关                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ 用户模块  │  │ 提示词模块 │  │ 生成模块  │  │ 支付模块  │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
└───────┼──────────────┼──────────────┼──────────────┼───────┘
        │              │              │              │
        ▼              ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   PostgreSQL  │ │     Redis    │ │  通义万相API │ │  微信/支付宝  │
│    数据库     │ │    缓存      │ │   生图模型   │ │    支付      │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

### 2.2 技术栈

#### 前端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.x | UI框架 |
| Vite | 5.x | 构建工具 |
| Tailwind CSS | 3.x | CSS框架 |
| React Router | 6.x | 路由 |
| Zustand | 4.x | 状态管理 |
| Axios | 1.x | HTTP请求 |
| shadcn/ui | latest | UI组件库 |

#### 后端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | 20.x | 运行时 |
| Express | 4.x | Web框架 |
| Prisma | 5.x | ORM |
| PostgreSQL | 15.x | 主数据库 |
| Redis | 7.x | 缓存 |
| JWT | - | 认证 |
| Bull | - | 任务队列 |

#### AI模型

| 模块 | 模型 | 状态 |
|------|------|------|
| 提示词搜索 | 待配置 | 🔴 |
| 图片生成 | SiliconFlow Kolors (快手) | 🟢 |
| 图片生成 | 通义万相 Wanx2.1 (备选) | 🟡 |

### 2.3 数据库设计

#### ER图

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   users     │     │  prompts    │     │   images    │
├─────────────┤     ├─────────────┤     ├─────────────┤
│ id          │     │ id          │     │ id          │
│ phone       │     │ title       │     │ user_id     │
│ password    │     │ content     │     │ prompt_id   │
│ nickname    │     │ category    │     │ platform    │
│ avatar      │     │ tags        │     │ size        │
│ balance     │     │ usage_count │     │ url         │
│ member_type │     │ created_at  │     │ status      │
│ created_at  │     │ updated_at  │     │ created_at  │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │    ┌──────────────┘                   │
       │    │                                  │
       ▼    ▼                                  ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   orders    │     │ memberships │     │  downloads  │
├─────────────┤     ├─────────────┤     ├─────────────┤
│ id          │     │ id          │     │ id          │
│ user_id     │     │ user_id     │     │ user_id     │
│ type        │     │ level       │     │ image_id    │
│ amount      │     │ expires_at  │     │ created_at  │
│ status      │     │ created_at  │     └─────────────┘
│ created_at  │     └─────────────┘
└─────────────┘
```

#### 表结构

**users 用户表**
```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone         VARCHAR(20) UNIQUE NOT NULL,
  password      VARCHAR(255) NOT NULL,
  nickname      VARCHAR(50),
  avatar        VARCHAR(500),
  balance       DECIMAL(10,2) DEFAULT 0.00,
  member_type   VARCHAR(20) DEFAULT 'free',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**prompts 提示词表**
```sql
CREATE TABLE prompts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         VARCHAR(200) NOT NULL,
  content       TEXT NOT NULL,
  category      VARCHAR(50) NOT NULL,  -- ecommerce/social/media
  tags          TEXT[],                -- 数组类型
  usage_count   INTEGER DEFAULT 0,
  is_featured   BOOLEAN DEFAULT false,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**images 生成记录表**
```sql
CREATE TABLE images (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id),
  prompt_id     UUID REFERENCES prompts(id),
  platform      VARCHAR(50) NOT NULL,
  size          VARCHAR(50) NOT NULL,
  image_url     VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  status        VARCHAR(20) DEFAULT 'pending',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**orders 订单表**
```sql
CREATE TABLE orders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id),
  type          VARCHAR(20) NOT NULL,  -- recharge/membership
  amount        DECIMAL(10,2) NOT NULL,
  status        VARCHAR(20) DEFAULT 'pending',
  paid_at       TIMESTAMP,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**memberships 会员表**
```sql
CREATE TABLE memberships (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id),
  level         VARCHAR(20) NOT NULL,  -- monthly/yearly/vip
  expires_at    TIMESTAMP NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 三、页面功能详细设计

### 3.1 首页

| 模块 | 功能 | 描述 |
|------|------|------|
| Hero | 产品介绍 | 核心价值主张 |
| Features | 功能展示 | 三大核心功能 |
| Pricing | 定价 | 免费额度 + 会员价格 |
| CTA | 注册按钮 | 引导用户注册 |

### 3.2 工作台

| 模块 | 功能 | 描述 |
|------|------|------|
| 平台选择 | 下拉选择 | 淘宝/抖音/小红书等 |
| 图片上传 | 拖拽/点击 | 支持JPG/PNG，最大10MB |
| 需求输入 | 文本框 | 输入想要的风格/场景 |
| 提示词模板 | 快捷选项 | 预设场景一键选择 |
| 生成按钮 | 点击触发 | 调用AI生成 |
| 结果展示 | 网格/列表 | 显示生成的图片 |
| 下载按钮 | 单张/批量 | 支持多尺寸导出 |

### 3.3 提示词库

| 模块 | 功能 | 描述 |
|------|------|------|
| 分类导航 | 侧边栏 | 按行业/场景分类 |
| 搜索框 | 关键词搜索 | 搜索提示词 |
| 提示词卡片 | 列表展示 | 显示标题/预览/使用量 |
| 详情弹窗 | 查看完整 | 显示完整提示词 |
| 收藏按钮 | 收藏到个人 | 方便下次使用 |

### 3.4 个人中心

| 模块 | 功能 | 描述 |
|------|------|------|
| 用户信息 | 头像/昵称 | 显示/修改 |
| 余额显示 | 数字 | 当前余额 |
| 会员状态 | 标签 | 是否为会员 |
| 消费记录 | 列表 | 每次消费明细 |
| 生成历史 | 图库 | 之前生成的图片 |
| 充值入口 | 按钮 | 跳转充值 |

---

## 四、接口设计

### 4.1 API基础信息

| 项目 | 内容 |
|------|------|
| 基础URL | /api/v1 |
| 认证方式 | JWT Bearer Token |
| 数据格式 | JSON |
| 字符编码 | UTF-8 |

### 4.2 接口列表

#### 用户模块

| 方法 | 路径 | 描述 | 状态 |
|------|------|------|------|
| POST | /auth/register | 注册 | 🔴 |
| POST | /auth/login | 登录 | 🔴 |
| POST | /auth/logout | 登出 | 🔴 |
| GET | /user/info | 获取用户信息 | 🔴 |
| PUT | /user/info | 更新用户信息 | 🔴 |
| GET | /user/balance | 获取余额 | 🔴 |

#### 提示词模块

| 方法 | 路径 | 描述 | 状态 |
|------|------|------|------|
| GET | /prompts | 获取提示词列表 | 🔴 |
| GET | /prompts/:id | 获取提示词详情 | 🔴 |
| GET | /prompts/search | 搜索提示词 | 🔴 |
| GET | /prompts/categories | 获取分类 | 🔴 |

#### 图片生成模块

| 方法 | 路径 | 描述 | 状态 |
|------|------|------|------|
| POST | /generate | 生成图片 | 🔴 |
| GET | /images | 获取生成记录 | 🔴 |
| GET | /images/:id | 获取图片详情 | 🔴 |
| DELETE | /images/:id | 删除图片 | 🔴 |

#### 支付模块

| 方法 | 路径 | 描述 | 状态 |
|------|------|------|------|
| POST | /pay/create-order | 创建订单 | 🔴 |
| POST | /pay/wechat/callback | 微信支付回调 | 🔴 |
| POST | /pay/alipay/callback | 支付宝回调 | 🔴 |

### 4.3 接口详情示例

**POST /api/v1/generate**

请求:
```json
{
  "platform": "xiaohongshu",
  "size_type": "cover",
  "image_url": "https://example.com/product.jpg",
  "prompt": "放在海边场景，突出清凉感",
  "negative_prompt": "不要文字，不要水印"
}
```

响应:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "task_id": "uuid",
    "status": "pending",
    "estimated_time": 10
  }
}
```

---

## 五、平台尺寸规格表

### 5.1 社交媒体平台

| 平台 | 类型 | 宽度(px) | 高度(px) | 比例 | 文件大小 |
|------|------|----------|----------|------|----------|
| 小红书 | 封面(竖) | 1080 | 1440 | 3:4 | ≤10MB |
| 小红书 | 封面(方) | 1080 | 1080 | 1:1 | ≤10MB |
| 抖音 | 封面(竖) | 1080 | 1920 | 9:16 | ≤10MB |
| 抖音 | 贴文(横) | 1200 | 627 | 1.91:1 | ≤10MB |
| 公众号 | 头条封面 | 900 | 383 | 2.35:1 | ≤5MB |
| 公众号 | 次条封面 | 200 | 200 | 1:1 | ≤2MB |

### 5.2 电商平台

| 平台 | 类型 | 宽度(px) | 高度(px) | 文件大小 |
|------|------|----------|----------|----------|
| 淘宝 | 主图 | 800 | 800 | ≤500KB |
| 淘宝 | 详情页 | 750 | - | ≤3MB |
| 拼多多 | 主图 | 750 | 352 | ≤100KB |
| 拼多多 | 轮播图 | 800 | 800 | ≤500KB |
| 拼多多 | 详情页 | 790 | - | ≤3MB |
| 京东 | 主图 | 800 | 800 | ≤2MB |
| 京东 | 详情(PC) | 750 | - | ≤3MB |
| 京东 | 详情(移动) | 640 | - | ≤3MB |

### 5.3 通用营销素材

| 类型 | 宽度(px) | 高度(px) | 比例 | 适用场景 |
|------|----------|----------|------|----------|
| 营销海报(PC) | 1920 | 1080 | 16:9 | PC端大图 |
| 营销海报(移动) | 750 | 350 | 2.14:1 | 移动端 |
| Banner(横) | 1920 | 400 | 4.8:1 | 网站横幅 |
| Banner(竖) | 750 | 300 | 2.5:1 | 移动端 |

---

## 六、开发进度表

### 6.1 总体里程碑

| 阶段 | 名称 | 开始日期 | 结束日期 | 状态 |
|------|------|----------|----------|------|
| M1 | 需求确认 + 架构设计 | 2026-03-25 | 2026-03-25 | ✅ |
| M2 | MVP核心功能开发 | TBD | TBD | 🔴 |
| M3 | 内测 + 反馈优化 | TBD | TBD | 🔴 |
| M4 | 正式上线 | TBD | TBD | 🔴 |

### 6.2 Sprint计划

#### Sprint 1: 基础设施建设 (TBD)

| 任务 | 类型 | 负责人 | 预计工时 | 状态 |
|------|------|--------|----------|------|
| 项目初始化 | setup | Agent | 2h | 🔴 |
| 数据库设计 | architecture | Agent | 4h | 🔴 |
| 后端框架搭建 | backend | Agent | 4h | 🔴 |
| 前端框架搭建 | frontend | Agent | 4h | 🔴 |
| GitHub Actions CI/CD | DevOps | Agent | 4h | 🔴 |

#### Sprint 2: 核心功能开发 (TBD)

| 任务 | 类型 | 负责人 | 预计工时 | 状态 |
|------|------|--------|----------|------|
| 用户注册登录 | backend | Agent | 8h | 🔴 |
| JWT认证中间件 | backend | Agent | 4h | 🔴 |
| 首页开发 | frontend | Agent | 8h | 🔴 |
| 工作台UI开发 | frontend | Agent | 16h | 🔴 |
| 提示词搜索接口 | backend | Agent | 8h | 🔴 |
| 图片生成接口 | backend | Agent | 16h | 🔴 |

#### Sprint 3: 平台适配 + 支付 (TBD)

| 任务 | 类型 | 负责人 | 预计工时 | 状态 |
|------|------|--------|----------|------|
| 多尺寸适配 | frontend | Agent | 8h | 🔴 |
| 微信支付接入 | backend | Agent | 16h | 🔴 |
| 支付宝接入 | backend | Agent | 16h | 🔴 |
| 会员系统 | backend | Agent | 8h | 🔴 |
| 余额系统 | backend | Agent | 8h | 🔴 |

#### Sprint 4: 后台管理 (TBD)

| 任务 | 类型 | 负责人 | 预计工时 | 状态 |
|------|------|--------|----------|------|
| 管理后台UI | frontend | Agent | 16h | 🔴 |
| 用户管理 | backend | Agent | 8h | 🔴 |
| 订单管理 | backend | Agent | 8h | 🔴 |
| 数据统计 | backend | Agent | 16h | 🔴 |
| 内容审核 | backend | Agent | 8h | 🔴 |

### 6.3 看板视图

```
📋 Prompt Studio 开发看板
═══════════════════════════════════════════════════════════════

🔴 待办 (Todo)
───────────────────────────────────────────────────────────────
  • Sprint 1: 基础设施建设
  • Sprint 2: 核心功能开发
  • Sprint 3: 平台适配+支付
  • Sprint 4: 后台管理
  • 测试 + 上线

🟡 进行中 (In Progress)
───────────────────────────────────────────────────────────────
  • M1: 需求确认 + 架构设计
     └─ [Issue #1] 前端界面设计
     └─ [Issue #2] 后端API开发
     └─ [Issue #3] 数据库设计
     └─ [Issue #4] UI/UX设计

🟢 已完成 (Done)
───────────────────────────────────────────────────────────────
  ✅ 项目立项
  ✅ 需求分析
  ✅ SPEC.md 编写
  ✅ GitHub 仓库创建
  ✅ Issues 创建

🔵 阻塞 (Blocked)
───────────────────────────────────────────────────────────────
  (暂无)
```

---

## 七、代码规范

### 7.1 Git分支规范

| 分支 | 命名 | 描述 |
|------|------|------|
| main | main | 主分支，稳定代码 |
| develop | develop | 开发分支 |
| feature | feature/xxx | 功能分支 |
| bugfix | bugfix/xxx | Bug修复分支 |
| hotfix | hotfix/xxx | 紧急修复分支 |

### 7.2 Commit规范

```
<type>(<scope>): <subject>

类型:
  feat: 新功能
  fix: Bug修复
  docs: 文档更新
  style: 代码格式
  refactor: 重构
  test: 测试
  chore: 构建/工具
```

示例:
```
feat(user): 添加手机号注册功能
fix(auth): 修复token过期问题
docs(readme): 更新使用文档
```

### 7.3 代码审查

| 检查项 | 要求 |
|--------|------|
| ESLint | 无错误 |
| TypeScript | 严格模式 |
| 测试覆盖 | 核心功能 ≥ 80% |
| PR描述 | 必须包含测试说明 |
| Review | 至少1人审核通过 |

---

## 八、部署架构

### 8.1 环境划分

| 环境 | 用途 | 域名 |
|------|------|------|
| 开发 | 开发测试 | dev.prompt-studio.com |
| 测试 | 内测 | test.prompt-studio.com |
| 生产 | 正式环境 | prompt-studio.com |

### 8.2 部署方案

```
                    ┌─────────────────┐
                    │   CDN (OSS)     │
                    │   静态资源      │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  负载均衡 SLB   │
                    └────────┬────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
    ┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐
    │   Server 1  │   │   Server 2  │   │   Server 3  │
    │   (Node.js) │   │   (Node.js) │   │   (Node.js) │
    └──────┬──────┘   └──────┬──────┘   └──────┬──────┘
           │                 │                 │
           └─────────────────┼─────────────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
       ┌──────▼──────┐ ┌────▼────┐ ┌──────▼──────┐
       │ PostgreSQL   │ │  Redis  │ │   OSS/COS   │
       │  主数据库    │ │  缓存   │ │  对象存储   │
       └─────────────┘ └─────────┘ └─────────────┘
```

---

## 九、配置管理

### 9.1 环境变量

#### 后端 (.env)

```env
# 应用配置
NODE_ENV=development
PORT=3000
BASE_URL=http://localhost:3000

# 数据库
DATABASE_URL=postgresql://user:password@localhost:5432/prompt_studio

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# AI模型 (待填写)
EMBEDDING_PROVIDER=
EMBEDDING_API_KEY=
IMAGE_PROVIDER=
IMAGE_API_KEY=

# 支付 (待填写)
WECHAT_APP_ID=
WECHAT_MCH_ID=
WECHAT_API_KEY=
ALIPAY_APP_ID=
ALIPAY_PRIVATE_KEY=

# 阿里云OSS (待填写)
OSS_ACCESS_KEY_ID=
OSS_ACCESS_KEY_SECRET=
OSS_BUCKET=
OSS_REGION=
```

#### 前端 (.env)

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_APP_NAME=Prompt Studio
```

---

## 十、附录

### 10.1 参考资料

- [React官方文档](https://react.dev)
- [Tailwind CSS文档](https://tailwindcss.com)
- [Express中文文档](https://expressjs.com)
- [Prisma文档](https://prisma.io)
- [通义万相API](待定)
- [微信支付文档](待定)
- [支付宝文档](待定)

### 10.2 术语表

| 术语 | 说明 |
|------|------|
| Prompt | 提示词，AI生成的指令文本 |
| Embedding | 文本向量化，用于相似度搜索 |
| CDN | 内容分发网络 |
| OSS | 对象存储服务 |
| SLA | 服务等级协议 |

---

## 📝 文档更新记录

| 版本 | 日期 | 更新内容 | 修改人 |
|------|------|----------|--------|
| v1.0 | 2026-03-25 | 初始版本 | 虾宝1号 |
