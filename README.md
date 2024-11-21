# EleTools - Electron 翻译工具

## 功能介绍

### 文本翻译

快捷键 `Alt + 1` 翻译选中内容

![翻译功能](/images/image.png)

### AI 搜索

快捷键 `Alt + 2` 对选中内容进行 AI 搜索

![AI搜索](/images/image2.png)

### OpenAI 问答

快捷键 `Alt + .` 打开 OpenAI 镜像站点（需要申请账号） 或将配置文件中的 `LoadURL` 修改为 你的镜像站点地址

## 配置方法

创建 `config.json` 文件，可放置于：

- 项目根目录
- 打包后路径：`包的根/resources/app.asar.unpacked/resources/config.json`

配置文件内容如下：

```json
{
  "LoadURL": "OpenAI镜像站点地址",
  "requestUrl": "AI接口地址",
  "requestToken": "AI接口Token",
  "requestModel": "AI模型名称"
}
```

:::tip

`requestUrl` 和 `requestToken` 为必填项
修改后需要重启应用

:::
