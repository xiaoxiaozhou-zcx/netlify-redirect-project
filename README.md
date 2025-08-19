# 域名重定向处理服务

这是一个基于Netlify Functions的域名重定向处理服务，能够自动处理IPv6地址重定向并映射到对应的域名。

## 功能说明

该服务实现以下功能：
1. 接收用户请求的路径和参数
2. 向指定IPv6地址发起带参数的请求
3. 处理302重定向响应，提取目标IPv6地址中的标识
4. 根据标识自动映射到对应的域名（1-100分别对应1.484947.xyz到100.484947.xyz）
5. 保留原始路径和参数，重定向到最终域名

## 域名映射规则

系统自动生成1-100的域名映射：
- 标识1 → 1.484947.xyz
- 标识2 → 2.484947.xyz
- ...
- 标识100 → 100.484947.xyz

如需添加特殊映射，可修改`netlify/functions/redirect-handler.js`中的`domainMap`对象。

## 部署步骤

### 前提条件
- Netlify账号
- GitHub/GitLab/Bitbucket账号
- Node.js (v14+)

### 部署到Netlify
1. 将本项目Fork或克隆到你的代码仓库
2. 登录Netlify，点击"Add new site" → "Import an existing project"
3. 选择你的代码仓库
4. 构建设置保持默认（无需填写Build command和Publish directory）
5. 点击"Deploy site"完成部署

## 本地开发

1. 克隆项目到本地
2. 安装依赖：`npm install`
3. 启动本地开发服务器：`npx netlify dev`
4. 访问`http://localhost:8888/.netlify/functions/redirect-handler`测试

## 使用方法

部署完成后，通过以下方式访问：
`https://你的域名/.netlify/functions/redirect-handler/需要访问的路径?参数=值`

系统会自动处理并重定向到对应的目标域名。

## 错误处理

- 504错误：请求目标IPv6地址超时
- 503错误：无法连接到目标IPv6地址
- 500错误：处理过程中发生其他错误（如无法解析重定向地址）

## 自定义配置

如需修改目标IPv6地址，可修改`redirect-handler.js`中的`targetIpv6`变量。
如需调整超时时间，可修改代码中的`10000`（毫秒）参数。
