# ss

> cz adaptor for baidu BEFExs

在项目根 `package.json` 中配置

```text
...
  "config": {
    "commitizen": {
      "path": "cz-conventional-changelog-befe"
    }
  }
```

在项目中执行 `git cz`

- `git cz --retry`：跳过问答式交互，直接以上一次的提交 message 进行提交
- `git cz --read`: 使用 `git cz --read` 来使得上一次交互输入值成为默认值

## 文档

- [配置说明](./docs/configuration.md)
- [github 接入](./docs/github-usage.md)
- [gitlab 接入](./docs/gitlab-usage.md)
- [icafe 接入](./docs/icafe-usage.md)

## Debugger

```bash
# 只调试 cz
DEBUG=cz-conventional-changelog-befe git cz

# icafe-api 调试也开启
DEBUG=cz-conventional-changelog-befe,icafe-api* git cz
```

## Examples

```bash
git clone https://github.com/be-fe/cz-conventional-changelog-befe.git
cd cz-conventional-changelog-befe

npm i
npm run example
npm run example [type] # type 对应 examples 下的例子，如 github
```

## 样例项目

[icode commit-demo](http://icode.baidu.com/repos/baidu/personal-code/commit-demo)
