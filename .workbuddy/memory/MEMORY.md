# 长期记忆

## 代码修改规范

**教训记录（2026-04-23）**：
- **事件**：修改 `renderOverview()` 函数时，用 sed 删除多行代码，误删了 `return` 语句
- **后果**：页面一直显示"加载中"，反复测试失败，浪费用户时间
- **教训**：
  1. 复杂文件修改时，避免用 `sed` 批量删行，容易误删
  2. 每次代码修改后，**必须先用 `node -e "new Function(code)"` 验证语法**
  3. 确认语法正确后再推送到 GitHub
  4. 字符串拼接的函数，检查是否有 `return` 语句

**操作规范**：
- 修改函数时，确保查看完整的函数边界（开头和结尾）
- 用 node 验证 JS 语法：`node -e "new Function(fs.readFileSync('file').match(/<script>([\s\S]*?)<\/script>/)[1])"`
- 如果不确定，先在本地测试再推送

## 项目信息

### 摄影师管理系统
- **GitHub**: `wzsqwe/studio`（公开仓库）
- **线上**: https://wzsqwe.github.io/studio/（已从 Netlify 迁移，Netlify 带宽耗尽）
- **技术栈**: 纯 HTML + Supabase（云数据库）
- **主要功能**: 项目管理、客户管理、收支记录、财务总览

### 导演创作手册生成器
- **GitHub**: `wzsqwe/director-package`
- **功能**: 根据拍摄脚本生成专业导演全流程创作手册

## 用户偏好
- 偏好动手执行，希望AI直接操作文件或执行命令
- 使用 macOS 系统
- 期望代码一次性改好，不要反复出低级错误
