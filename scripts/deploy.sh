#!/bin/bash
# ============================================
# Prompt Studio - 一键部署脚本
# ============================================
# 用途: 在服务器上一键部署 Prompt Studio
# 支持: 初始化部署 / 滚动更新 / 回滚

set -e

# ============================================
# 配置
# ============================================
APP_NAME="prompt-studio"
DEPLOY_DIR="${DEPLOY_DIR:-/opt/prompt-studio}"
BACKUP_DIR="${DEPLOY_DIR}/backups"
LOG_FILE="${DEPLOY_DIR}/deploy.log"
COMPOSE_FILE="${DEPLOY_DIR}/docker-compose.yml"
ENV_FILE="${DEPLOY_DIR}/.env"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================
# 函数定义
# ============================================

log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] ✅${NC} $1" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ❌${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        error "命令 $1 未安装，请先安装"
    fi
}

# 检查环境变量文件
check_env() {
    if [ ! -f "$ENV_FILE" ]; then
        warn ".env 文件不存在，尝试从 .env.production.example 创建"
        if [ -f "${DEPLOY_DIR}/backend/.env.production.example" ]; then
            cp "${DEPLOY_DIR}/backend/.env.production.example" "$ENV_FILE"
            warn "已创建 .env 文件，请编辑 $ENV_FILE 填写实际配置"
            error "请先配置 .env 文件后再执行部署"
        else
            error ".env 文件不存在且找不到模板文件"
        fi
    fi
    
    # 检查关键配置
    source "$ENV_FILE"
    if [ -z "$DATABASE_URL" ] || [ "$DATABASE_URL" = "postgresql://username:password@host:5432/promptstudio" ]; then
        error "DATABASE_URL 未正确配置，请编辑 $ENV_FILE"
    fi
    if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "YOUR_SUPER_SECRET_JWT_KEY_MIN_64_CHARS_HERE" ]; then
        error "JWT_SECRET 未正确配置，请编辑 $ENV_FILE"
    fi
}

# 创建备份
backup() {
    local backup_name="backup_$(date +%Y%m%d_%H%M%S)"
    local backup_path="${BACKUP_DIR}/${backup_name}"
    
    mkdir -p "$backup_path"
    
    log "创建备份: $backup_name"
    
    # 备份数据库数据
    if [ -d "${DEPLOY_DIR}/postgres_data" ]; then
        cp -r "${DEPLOY_DIR}/postgres_data" "$backup_path/" 2>/dev/null || true
    fi
    
    # 备份 docker-compose.yml
    if [ -f "$COMPOSE_FILE" ]; then
        cp "$COMPOSE_FILE" "$backup_path/"
    fi
    
    # 备份环境变量
    if [ -f "$ENV_FILE" ]; then
        cp "$ENV_FILE" "$backup_path/"
    fi
    
    # 保存当前镜像版本
    if command -v docker &> /dev/null; then
        docker-compose -f "$COMPOSE_FILE" ps -q 2>/dev/null | while read cid; do
            docker inspect "$cid" --format='{{.Config.Image}}' >> "$backup_path/images.txt" 2>/dev/null || true
        done
    fi
    
    # 清理旧备份（保留最近10个）
    ls -1t "$BACKUP_DIR" | tail -n +11 | xargs -r rm -rf
    
    success "备份完成: $backup_path"
    echo "$backup_path"
}

# 回滚
rollback() {
    local backup_path=$1
    if [ -z "$backup_path" ]; then
        echo "用法: $0 rollback <backup_path>"
        exit 1
    fi
    
    if [ ! -d "$backup_path" ]; then
        error "备份不存在: $backup_path"
    fi
    
    log "开始回滚到: $backup_path"
    
    # 停止服务
    cd "$DEPLOY_DIR"
    docker-compose down || true
    
    # 恢复数据
    if [ -d "${backup_path}/postgres_data" ]; then
        rm -rf "${DEPLOY_DIR}/postgres_data"
        cp -r "${backup_path}/postgres_data" "${DEPLOY_DIR}/"
    fi
    
    # 恢复配置
    [ -f "${backup_path}/docker-compose.yml" ] && cp "${backup_path}/docker-compose.yml" "$COMPOSE_FILE"
    
    # 启动服务
    docker-compose up -d
    
    success "回滚完成"
}

# 初始化部署
init_deploy() {
    log "开始初始化部署..."
    
    check_command docker
    check_command docker-compose
    
    # 创建部署目录
    mkdir -p "$DEPLOY_DIR"
    mkdir -p "$BACKUP_DIR"
    mkdir -p "${DEPLOY_DIR}/ssl"  # SSL证书目录
    mkdir -p "${DEPLOY_DIR}/backups"
    
    # 复制文件
    log "复制项目文件..."
    if [ -d /tmp/prompt-studio ]; then
        cp -r /tmp/prompt-studio/* "$DEPLOY_DIR/"
    fi
    
    # 检查并创建 .env
    check_env
    
    # 拉取镜像
    log "拉取 Docker 镜像..."
    docker-compose -f "$COMPOSE_FILE" pull
    
    # 启动基础设施服务
    log "启动数据库和Redis..."
    docker-compose -f "$COMPOSE_FILE" up -d postgres redis
    
    # 等待数据库就绪
    log "等待数据库就绪..."
    for i in {1..30}; do
        if docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_isready &> /dev/null; then
            success "数据库就绪"
            break
        fi
        echo -n "."
        sleep 2
    done
    
    # 运行数据库迁移
    log "运行数据库迁移..."
    docker-compose -f "$COMPOSE_FILE" exec -T backend npx prisma migrate deploy || true
    
    # 启动所有服务
    log "启动所有服务..."
    docker-compose -f "$COMPOSE_FILE" up -d
    
    # 等待健康检查
    log "等待服务就绪..."
    sleep 10
    
    # 创建初始管理员（如果需要）
    # docker-compose -f "$COMPOSE_FILE" exec backend npm run prisma:seed || true
    
    success "初始化部署完成!"
    show_status
}

# 滚动更新
rolling_update() {
    log "开始滚动更新..."
    
    check_command docker
    check_command docker-compose
    
    cd "$DEPLOY_DIR"
    
    # 创建备份
    backup
    
    # 拉取最新镜像
    log "拉取最新镜像..."
    docker-compose -f "$COMPOSE_FILE" pull
    
    # 滚动更新后端
    log "更新后端服务..."
    docker-compose -f "$COMPOSE_FILE" up -d --no-deps backend
    sleep 5
    
    # 检查后端健康
    for i in {1..10}; do
        if curl -sf http://localhost:3000/health > /dev/null; then
            success "后端服务健康"
            break
        fi
        echo -n "."
        sleep 3
    done
    
    # 滚动更新前端
    log "更新前端服务..."
    docker-compose -f "$COMPOSE_FILE" up -d --no-deps frontend
    
    # 运行数据库迁移（如果有）
    log "检查数据库迁移..."
    docker-compose -f "$COMPOSE_FILE" exec -T backend npx prisma migrate deploy || echo "无需迁移"
    
    success "滚动更新完成!"
    show_status
}

# 停止服务
stop() {
    log "停止服务..."
    cd "$DEPLOY_DIR"
    docker-compose down
    success "服务已停止"
}

# 显示状态
show_status() {
    echo ""
    echo "=========================================="
    echo "           Prompt Studio 状态            "
    echo "=========================================="
    cd "$DEPLOY_DIR"
    docker-compose ps
    echo ""
    echo "访问地址: http://$(hostname -I | awk '{print $1}'):80"
    echo "API地址:  http://$(hostname -I | awk '{print $1}'):3000"
    echo "健康检查: http://$(hostname -I | awk '{print $1}'):80/health"
    echo "=========================================="
}

# 查看日志
logs() {
    local service=${1:-}
    cd "$DEPLOY_DIR"
    if [ -z "$service" ]; then
        docker-compose logs -f
    else
        docker-compose logs -f "$service"
    fi
}

# 清理
cleanup() {
    warn "清理未使用的 Docker 资源..."
    cd "$DEPLOY_DIR"
    docker-compose down --rmi local || true
    docker image prune -f
    docker volume prune -f
    success "清理完成"
}

# ============================================
# 主流程
# ============================================

show_usage() {
    echo ""
    echo "Prompt Studio 部署脚本"
    echo ""
    echo "用法: $0 <command> [options]"
    echo ""
    echo "命令:"
    echo "  init          初始化部署（首次部署）"
    echo "  update        滚动更新（保留数据）"
    echo "  stop          停止所有服务"
    echo "  start         启动所有服务"
    echo "  restart       重启所有服务"
    echo "  status        显示服务状态"
    echo "  logs [svc]    查看日志（可选指定服务）"
    echo "  backup        创建备份"
    echo "  rollback <p>  回滚到指定备份路径"
    echo "  cleanup       清理未使用的 Docker 资源"
    echo "  help          显示帮助"
    echo ""
    echo "示例:"
    echo "  $0 init                   # 首次部署"
    echo "  $0 update                # 滚动更新"
    echo "  $0 logs backend          # 查看后端日志"
    echo "  $0 rollback backups/xxx  # 回滚"
    echo ""
}

case "${1:-}" in
    init)
        init_deploy
        ;;
    update|upgrade)
        rolling_update
        ;;
    stop)
        stop
        ;;
    start)
        cd "$DEPLOY_DIR" && docker-compose up -d
        success "服务已启动"
        ;;
    restart)
        cd "$DEPLOY_DIR" && docker-compose restart
        success "服务已重启"
        ;;
    status)
        show_status
        ;;
    logs)
        logs "$2"
        ;;
    backup)
        backup
        ;;
    rollback)
        rollback "$2"
        ;;
    cleanup)
        cleanup
        ;;
    help|--help|-h)
        show_usage
        ;;
    *)
        if [ -z "$1" ]; then
            show_usage
        else
            error "未知命令: $1"
        fi
        ;;
esac
