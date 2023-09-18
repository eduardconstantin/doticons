<img src="https://dev-to-uploads.s3.amazonaws.com/uploads/articles/5mmb7gnclrx8vi34sr8u.png"/>
<br />

Doticons is a comprehensive and carefully curated collection of SVG dot icons.
Each icon within this repository is meticulously crafted to ensure a consistent and visually pleasing experience. 
With a focus on simplicity and versatility, these dot icons can be seamlessly integrated into various applications, websites, presentations, or any other visual project.

<br /> 

<div align="center">
<br />

[![Project license](https://img.shields.io/github/license/eduardconstantin/doticons?style=flat-square)](LICENSE)
[![Contributors](https://img.shields.io/github/contributors/eduardconstantin/doticons?style=flat-square)](https://github.com/eduardconstantin/doticons/graphs/contributors)
[![Issue](https://img.shields.io/github/issues/eduardconstantin/doticons?style=flat-square)](https://github.com/eduardconstantin/doticons/issues)
[![PRs](https://img.shields.io/github/issues-pr/eduardconstantin/doticons?style=flat-square)](https://github.com/eduardconstantin/doticons/pulls)
[![Stars](https://img.shields.io/github/stars/eduardconstantin/doticons?style=flat-square)](https://github.com/eduardconstantin/doticons/stargazers)

</div>

## 🌟 Features

- Small size SVGs
<table>
    <tr>
      <th>32x32 dot matrix</th>
      <th>16x16 dot matrix</th>
    </tr>
    <tr>
      <td valign="center" align="center" >
        <img width="25px" src="https://github.com/eduardconstantin/doticons/blob/main/icons/32/github.svg"/>
        <img width="75px" src="https://github.com/eduardconstantin/doticons/blob/main/icons/32/github.svg"/>
        <img width="150px" src="https://github.com/eduardconstantin/doticons/blob/main/icons/32/github.svg"/>
      </td>
      <td valign="center" align="center">
        <img width="25px" src="https://github.com/eduardconstantin/doticons/blob/main/icons/16/github.svg"/>
        <img width="75px" src="https://github.com/eduardconstantin/doticons/blob/main/icons/16/github.svg"/>
        <img width="150px" src="https://github.com/eduardconstantin/doticons/blob/main/icons/16/github.svg"/>
      </td>
    </tr>
</table>

## 🌱 Usage

Install the Doticons package from npm.

```sh
npm i doticons
```

Each icon can be imported individually as a React component:

```js
import { GitDoticon } from 'doticons/16'

function MyComponent() {
  return (
    <div>
      <GitDoticon />
      <p>...</p>
    </div>
  )
}
```

The 16x16 icons can be imported from `doticons/16` and the 32x32 icons can be imported from `doticons/32`.
Icons use an upper camel case naming convention and are always suffixed with the word `Doticon`.

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
