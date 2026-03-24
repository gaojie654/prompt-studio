#!/bin/bash

# 创建前端任务Issue
gh issue create \
  --title "【前端】用户界面设计" \
  --body "## 任务描述
设计并实现 Prompt Studio 用户界面

## 功能点
- [ ] 首页 - 功能介绍 + 免费试用入口
- [ ] 工作台 - 上传产品图 + 输入需求 + 生成图片
- [ ] 提示词库 - 分类浏览 + 搜索
- [ ] 个人中心 - 余额 + 会员 + 历史记录

## 技术栈
- React 18
- Tailwind CSS
- Vite

## 验收标准
- 响应式设计，移动端优先
- 支持暗色模式" \
  --label "frontend"

# 创建后端任务Issue
gh issue create \
  --title "【后端】API接口开发" \
  --body "## 任务描述
实现 Prompt Studio 后端 API

## 功能点
- [ ] 用户认证接口
- [ ] 提示词搜索接口
- [ ] 图片生成接口
- [ ] 支付接口集成

## 技术栈
- Node.js/Express 或 Python FastAPI
- PostgreSQL + Redis

## 验收标准
- RESTful API 设计
- 接口响应时间 < 500ms" \
  --label "backend"

# 创建数据库任务Issue
gh issue create \
  --title "【架构】数据库设计" \
  --body "## 任务描述
设计 Prompt Studio 数据库架构

## 数据库表
- [ ] users - 用户表
- [ ] prompts - 提示词表
- [ ] images - 生成图片记录表
- [ ] orders - 订单表
- [ ] memberships - 会员表

## 验收标准
- 支持高并发
- 数据安全合规" \
  --label "architecture"

# 创建设计任务Issue
gh issue create \
  --title "【设计】UI/UX设计" \
  --body "## 任务描述
使用 ui-ux-pro-max 设计 Prompt Studio UI/UX

## 设计稿
- [ ] 首页设计
- [ ] 工作台设计
- [ ] 提示词库设计
- [ ] 个人中心设计

## 验收标准
- 符合产品定位
- 用户体验流畅" \
  --label "design"
