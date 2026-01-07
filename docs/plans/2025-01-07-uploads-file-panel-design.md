# Uploads 文件管理面板设计

## 概述

在前端左侧新增文件管理面板，展示 `public/uploads` 目录的文件，支持上传、下载、删除功能。

## 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                      页面布局                            │
├──────────────┬─────────────────────┬───────────────────┤
│  FilePanel   │     AgentChat       │    ConfigPanel    │
│   (新增)      │      (现有)          │      (现有)        │
└──────────────┴─────────────────────┴───────────────────┘
```

### 新增文件

- `app/components/FilePanel/index.tsx` - 主组件
- `app/api/uploads/route.ts` - API 路由（GET/POST/DELETE）

### 数据流

- 前端组件调用 API 获取文件列表
- 上传通过 FormData POST 到 API
- 下载直接访问 `/uploads/filename`（静态文件）
- 删除通过 DELETE 请求到 API

## API 接口设计

**路由**：`/api/uploads/route.ts`

### GET - 获取文件列表

```typescript
// 响应
{
  files: [
    {
      name: "example.pdf",
      size: 1024000,        // 字节
      uploadedAt: "2025-01-07T10:30:00Z"
    }
  ]
}
```

### POST - 上传文件

```typescript
// 请求：FormData，字段名 "file"
// 响应
{ success: true, file: { name, size, uploadedAt } }
```

### DELETE - 删除文件

```typescript
// 请求
{ filename: "example.pdf" }
// 响应
{ success: true }
```

### 下载

不经过 API，直接访问 `/uploads/filename`（Next.js 自动服务 public 目录）

### 错误处理

- 文件不存在：404
- 上传失败：500
- 文件名冲突：覆盖原文件

## 前端组件设计

### FilePanel 组件结构

```tsx
<FilePanel>
  {/* 上传区域 - 支持拖拽和点击 */}
  <UploadZone
    onDrop={handleUpload}
    onClick={triggerFileInput}
  />

  {/* 文件列表 */}
  <FileList>
    {files.map(file => (
      <FileItem
        name={file.name}
        size={formatSize(file.size)}    // "1.2 MB"
        time={formatTime(file.uploadedAt)} // "2分钟前"
        onDownload={() => window.open(`/uploads/${file.name}`)}
        onDelete={() => handleDelete(file.name)}
      />
    ))}
  </FileList>
</FilePanel>
```

### 交互细节

- 拖拽文件到上传区域时显示高亮边框
- 上传中显示进度/loading 状态
- 删除前弹出确认对话框
- 操作成功/失败显示 toast 提示

### 样式

- 左侧边栏宽度约 280px
- 与现有 ConfigPanel 风格保持一致（深色主题适配）
