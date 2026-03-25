# 🎨 Prompt Studio - AI提示词生成工具

> 为电商和自媒体平台生成营销图片提示词

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

### 技术栈
- **前端**: React + Tailwind CSS + Vite
- **后端**: Node.js + Express + TypeScript + Prisma
- **数据库**: PostgreSQL + Redis
- **反向代理**: Nginx
- **支付**: 微信支付 V3 / 支付宝电脑网站支付
- **图片生成**: SiliconFlow Kolors / 通义万相 Wanx

### 容器架构
```
┌─────────────────────────────────────────────────────┐
│                     Nginx (80/443)                   │
│               反向代理 + SSL + 静态文件                │
└──────────────────┬──────────────────┬───────────────┘
                   │                  │
                   ▼                  ▼
          ┌──────────────┐   ┌──────────────┐
          │   Backend    │   │   Frontend   │
          │   (:3000)    │   │    (:80)     │
          └──────┬───────┘   └──────────────┘
                 │
       ┌─────────┴─────────┐
       ▼                   ▼
┌──────────────┐   ┌──────────────┐
│  PostgreSQL  │   │    Redis     │
│   (:5432)    │   │   (:6379)    │
└──────────────┘   └──────────────┘
```

---

## 🚀 快速开始

### 环境要求
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 16+ (或使用 Docker)
- Redis 7+ (或使用 Docker)

### 本地开发

```bash
# 克隆项目
git clone https://github.com/gaojie654/prompt-studio.git
cd prompt-studio

# 启动基础设施 (PostgreSQL + Redis)
docker-compose up -d postgres redis

# 安装后端依赖
cd backend
npm install
cp .env.example .env  # 编辑 .env 填写配置
npx prisma migrate dev
npm run dev

# 安装前端依赖 (新终端)
cd frontend
npm install
npm run dev
```

访问 http://localhost:5173

---

## 🐳 Docker 部署

### 一键部署 (推荐)

```bash
# SSH 到服务器
ssh user@your-server

# 下载并运行部署脚本
curl -fsSL https://raw.githubusercontent.com/gaojie654/prompt-studio/main/scripts/deploy.sh | bash -s -- init
```

### 手动部署

```bash
# 1. 复制项目到服务器
git clone https://github.com/gaojie654/prompt-studio.git
cd prompt-studio

# 2. 配置环境变量
cp backend/.env.production.example .env
nano .env  # 填写实际配置

# 3. 启动所有服务
docker-compose up -d

# 4. 查看状态
docker-compose ps
```

### 部署命令

```bash
./scripts/deploy.sh init      # 首次部署
./scripts/deploy.sh update     # 滚动更新
./scripts/deploy.sh backup     # 创建备份
./scripts/deploy.sh rollback   # 回滚
./scripts/deploy.sh status     # 查看状态
./scripts/deploy.sh logs       # 查看日志
```

---

## 🔧 环境变量配置

### 生产环境必填项

| 变量 | 说明 | 示例 |
|------|------|------|
| `DATABASE_URL` | PostgreSQL 连接串 | `postgresql://user:pass@host:5432/db` |
| `REDIS_URL` | Redis 连接串 | `redis://user:pass@host:6379` |
| `JWT_SECRET` | JWT 密钥（64位+） | `openssl rand -base64 64` |
| `CORS_ORIGIN` | 前端域名 | `https://your-domain.com` |
| `SILICONFLOW_API_KEY` | SiliconFlow API密钥 | `sk-xxx` |

### 支付配置（可选）

**微信支付 V3:**
```env
WECHAT_MCHID=商户号
WECHAT_SERIAL_NO=证书序列号
WECHAT_PRIVATE_KEY_PATH=/app/config/apiclient_key.pem
WECHAT_APIV3_KEY=APIv3密钥
WECHAT_APPID=AppID
```

**支付宝:**
```env
ALIPAY_APPID=应用ID
ALIPAY_PRIVATE_KEY=应用私钥
ALIPAY_ALIPUBLIC_KEY=支付宝公钥
ALIPAY_SANDBOX=false
```

---

## 🌐 域名与 SSL 配置

### 1. DNS 解析
将域名 A 记录指向服务器 IP

### 2. SSL 证书（Let's Encrypt）
```bash
# 安装 certbot
sudo apt install certbot python3-certbot-nginx

# 申请证书
sudo certbot certonly -d your-domain.com -d api.your-domain.com

# 证书位置
# /etc/letsencrypt/live/your-domain.com/fullchain.pem
# /etc/letsencrypt/live/your-domain.com/privkey.pem
```

### 3. 配置 Nginx SSL
取消 `nginx/nginx.conf` 中 HTTPS server 块的注释，并配置证书路径

### 4. 强制 HTTPS
取消 `nginx.conf` 中 `return 301 https://$host$request_uri;` 的注释

---

## 📊 CI/CD 配置

GitHub Actions 自动部署：

| 分支 | 环境 | 触发条件 |
|------|------|---------|
| `develop` | Staging | push to develop |
| `main` | Production | push to main |

### 需配置的 Secrets

**Staging:**
- `STAGING_HOST` - 服务器地址
- `STAGING_USER` - SSH 用户名
- `STAGING_SSH_KEY` - SSH 私钥
- `STAGING_DEPLOY_PATH` - 部署路径
- `STAGING_ENV` - 环境变量内容

**Production:**
- `PROD_HOST` / `PROD_USER` / `PROD_SSH_KEY` / `PROD_DEPLOY_PATH` / `PROD_ENV`

---

## 🆘 常见问题

### Q: 数据库连接失败
```bash
# 检查 PostgreSQL 是否就绪
docker-compose exec postgres pg_isready

# 检查连接串是否正确
docker-compose exec backend env | grep DATABASE_URL
```

### Q: 图片上传失败
```bash
# 检查 uploads 目录权限
ls -la backend/uploads/

# 修复权限
docker-compose exec backend chown -R nodejs:nodejs /app/uploads
```

### Q: 支付回调失败
- 确保微信/支付宝后台配置的回调地址为 `https://your-domain.com/api/v1/payment/callback/wechat` 或 `/alipay`
- 检查防火墙是否开放 80/443 端口

### Q: 如何更新到最新版本？
```bash
cd /opt/prompt-studio
git pull origin main
./scripts/deploy.sh update
```

### Q: 如何回滚？
```bash
# 查看可用备份
ls backups/

# 回滚到指定备份
./scripts/deploy.sh rollback backups/backup_20260326_120000
```

---

## 📁 项目结构

```
prompt-studio/
├── backend/                    # 后端服务
│   ├── src/                    # TypeScript 源码
│   ├── prisma/                 # 数据库 schema
│   ├── Dockerfile              # 生产镜像
│   └── .env.production.example # 生产环境变量模板
├── frontend/                   # 前端服务
│   ├── src/                   # React 源码
│   ├── Dockerfile             # 生产镜像
│   └── nginx.conf            # 前端 Nginx 配置
├── nginx/                     # Nginx 反向代理
│   └── nginx.conf            # 主配置
├── scripts/                   # 部署脚本
│   └── deploy.sh             # 一键部署脚本
├── docs/                      # 项目文档
├── docker-compose.yml         # 容器编排
└── README.md
```

---

## 👥 团队协作

- 使用 GitHub Issues 管理任务
- 使用 GitHub Projects 看板
- 代码通过 Pull Request 审核
- CI/CD 自动测试和部署

## 📄 License

MIT
