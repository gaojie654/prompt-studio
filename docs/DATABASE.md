# Prompt Studio 数据库设计文档

## 概述

本文档描述 Prompt Studio 系统的数据库架构设计，采用 PostgreSQL 数据库。

---

## 2.1 数据库表设计

### 2.1.1 users - 用户表

存储用户基本信息。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | UUID | PK, DEFAULT gen_random_uuid() | 用户唯一标识符 |
| phone | VARCHAR(20) | UNIQUE, NOT NULL | 手机号，登录账号 |
| password | VARCHAR(255) | NOT NULL | 密码（bcrypt 加密存储） |
| nickname | VARCHAR(50) | | 用户昵称 |
| avatar | VARCHAR(500) | | 头像 URL |
| balance | DECIMAL(10,2) | DEFAULT 0.00 | 账户余额，单位元 |
| member_type | VARCHAR(20) | DEFAULT 'free' | 会员类型：free/monthly/yearly/vip |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

### 2.1.2 prompts - 提示词表

存储 AI 图像生成提示词模板。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | UUID | PK, DEFAULT gen_random_uuid() | 提示词唯一标识符 |
| title | VARCHAR(200) | NOT NULL | 提示词标题 |
| content | TEXT | NOT NULL | 提示词完整内容 |
| category | VARCHAR(50) | NOT NULL | 分类：ecommerce/social/media |
| tags | TEXT[] | | 标签数组，如 {电商,主图,服装} |
| usage_count | INTEGER | DEFAULT 0 | 使用次数统计 |
| is_featured | BOOLEAN | DEFAULT FALSE | 是否精选推荐 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

### 2.1.3 images - 生成图片记录表

记录用户生成的图片历史。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | UUID | PK, DEFAULT gen_random_uuid() | 记录唯一标识符 |
| user_id | UUID | FK → users.id, NOT NULL | 关联用户 |
| prompt_id | UUID | FK → prompts.id | 关联使用的提示词 |
| platform | VARCHAR(50) | NOT NULL | 目标平台：taobao/pinduoduo/jingdong/xiaohongshu/douyin/wechat |
| size | VARCHAR(20) | NOT NULL | 图片尺寸，如 800x800, 1080x1440 |
| image_url | VARCHAR(500) | | 生成的图片 URL |
| thumbnail_url | VARCHAR(500) | | 缩略图 URL |
| status | VARCHAR(20) | DEFAULT 'pending' | 状态：pending/processing/completed/failed |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

### 2.1.4 orders - 订单表

存储用户充值和购买会员订单。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | UUID | PK, DEFAULT gen_random_uuid() | 订单唯一标识符 |
| user_id | UUID | FK → users.id, NOT NULL | 关联用户 |
| type | VARCHAR(20) | NOT NULL | 订单类型：recharge/membership |
| amount | DECIMAL(10,2) | NOT NULL | 订单金额 |
| status | VARCHAR(20) | DEFAULT 'pending' | 状态：pending/paid/refunded |
| paid_at | TIMESTAMP | | 支付时间 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

### 2.1.5 memberships - 会员表

存储用户会员权益信息。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | UUID | PK, DEFAULT gen_random_uuid() | 记录唯一标识符 |
| user_id | UUID | FK → users.id, NOT NULL | 关联用户 |
| level | VARCHAR(20) | NOT NULL | 会员等级：monthly/yearly/vip |
| expires_at | TIMESTAMP | NOT NULL | 过期时间 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

### 2.1.6 prompt_favorites - 收藏表

存储用户收藏的提示词。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | UUID | PK, DEFAULT gen_random_uuid() | 记录唯一标识符 |
| user_id | UUID | FK → users.id, NOT NULL | 关联用户 |
| prompt_id | UUID | FK → prompts.id, NOT NULL | 关联提示词 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 收藏时间 |

---

## 2.2 索引设计

### 常规索引

| 表名 | 索引名 | 字段 | 类型 | 说明 |
|------|--------|------|------|------|
| users | idx_users_phone | phone | B-Tree | 手机号查询加速 |
| users | idx_users_member_type | member_type | B-Tree | 会员类型筛选 |
| prompts | idx_prompts_category | category | B-Tree | 分类浏览 |
| prompts | idx_prompts_is_featured | is_featured | B-Tree | 精选推荐查询 |
| images | idx_images_user_id | user_id | B-Tree | 用户图片历史查询 |
| images | idx_images_status | status | B-Tree | 状态筛选（任务队列） |
| images | idx_images_created_at | created_at | B-Tree | 时间排序 |
| orders | idx_orders_user_id | user_id | B-Tree | 用户订单查询 |
| orders | idx_orders_status | status | B-Tree | 订单状态筛选 |
| memberships | idx_memberships_user_id | user_id | B-Tree | 用户会员查询 |
| memberships | idx_memberships_expires_at | expires_at | B-Tree | 过期会员清理 |
| prompt_favorites | idx_favorites_user_id | user_id | B-Tree | 用户收藏查询 |

### 唯一索引

| 表名 | 索引名 | 字段 | 说明 |
|------|--------|------|------|
| users | uk_users_phone | phone | 手机号唯一约束 |
| prompt_favorites | uk_favorites_user_prompt | user_id, prompt_id | 防止重复收藏 |

### 部分索引

| 表名 | 索引名 | 字段 | 条件 | 说明 |
|------|--------|------|------|------|
| images | idx_images_pending | id | status = 'pending' | 待处理任务快速查询 |
| prompts | idx_prompts_featured | id | is_featured = TRUE | 精选提示词查询 |

---

## 2.3 关系图

```
┌─────────────────┐     ┌─────────────────┐
│      users      │     │     prompts     │
├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)         │
│ phone           │     │ title           │
│ password        │     │ content         │
│ nickname        │     │ category        │
│ avatar          │     │ tags            │
│ balance         │     │ usage_count     │
│ member_type     │     │ is_featured     │
│ created_at      │     │ created_at      │
│ updated_at      │     │ updated_at      │
└────────┬────────┘     └───────┬─────────┘
         │                       │
         │ 1:N                   │ 1:N
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│     orders      │     │     images      │
├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)         │
│ user_id (FK)    │     │ user_id (FK)    │◄───┐
│ type            │     │ prompt_id (FK)  │───┐│
│ amount          │     │ platform        │  ││
│ status          │     │ size            │  ││
│ paid_at         │     │ image_url       │  ││
│ created_at      │     │ thumbnail_url   │  ││
└─────────────────┘     │ status          │  ││
                        │ created_at      │  ││
                        └─────────────────┘  ││
                         ┌───────────────────┘│
┌─────────────────┐     │                    │
│   memberships   │     │                    │
├─────────────────┤     │                    │
│ id (PK)         │     │                    │
│ user_id (FK)    │◄────┘                    │
│ level           │                          │
│ expires_at      │                          │
│ created_at      │                          │
└─────────────────┘                          │
                                              
┌─────────────────┐     ┌───────────────────┐
│prompt_favorites │     │                   │
├─────────────────┤     │                   │
│ id (PK)         │     │                   │
│ user_id (FK)    │◄────┼───────────────────┘
│ prompt_id (FK)  │◄────┘
│ created_at      │
└─────────────────┘
```

### 关系说明

| 关系 | 说明 |
|------|------|
| users → orders | 一对多，一个用户可以有多个订单 |
| users → images | 一对多，一个用户可以生成多张图片 |
| users → memberships | 一对多，一个用户可以有多个会员记录（历史） |
| users → prompt_favorites | 一对多，一个用户可以收藏多个提示词 |
| prompts → images | 一对多，一个提示词可以被多次使用 |
| prompts → prompt_favorites | 一对多，一个提示词可以被多个用户收藏 |

---

## 2.4 备份策略

### 备份方式

| 备份类型 | 频率 | 保留时间 | 说明 |
|----------|------|----------|------|
| 全量备份 | 每日 02:00 | 30 天 | 每日凌晨2点执行完整数据库备份 |
| 增量备份 | 每6小时 | 7 天 | 基于 WAL 的增量数据备份 |
| 实时归档 | 持续 | - | WAL 归档至云存储 |

### 备份存储

- **本地存储**: 备份文件保留在 `/backup/local/`
- **远程存储**: 同步至阿里云 OSS/腾讯云 COS，跨区域异地存储
- **加密**: 备份文件使用 AES-256 加密后存储

### 恢复策略

| 场景 | RTO 目标 | RPO 目标 | 说明 |
|------|---------|---------|------|
| 误删数据 | < 1 小时 | < 6 小时 | 基于最近增量备份恢复 |
| 数据库崩溃 | < 2 小时 | < 6 小时 | 基于全量+增量恢复 |
| 区域灾难 | < 4 小时 | < 24 小时 | 异地恢复 |

### 备份验证

- 每周执行一次备份恢复测试
- 每月生成备份完整性报告
- 监控备份任务执行状态，失败时告警

### 备份命令示例

```bash
# 全量备份
pg_dump -Fc -f /backup/local/full_backup_$(date +%Y%m%d).dump prompt_studio

# 增量备份（需配置 WAL归档）
pg_basebackup -D /backup/local/incremental_$(date +%Y%m%d) -Ft -z -P

# 恢复
pg_restore -d prompt_studio /backup/local/full_backup_20260325.dump
```

---

## 版本信息

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0.0 | 2026-03-25 | 初始版本 |
