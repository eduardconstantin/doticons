import { promises as fs } from "fs"
import { join, dirname } from "path"
import { transform } from "@svgr/core"
import { transformAsync } from "@babel/core"

const getIcons = async (size) => {
  let files = await fs.readdir(join(process.cwd(), `./icons/${size}`))
  return Promise.all(
    files
      .filter((filename) => filename.endsWith(".svg"))
      .map(async (file) => ({
        svg: await fs.readFile(join(process.cwd(), `./icons/${size}/${file}`), "utf8"),
        componentName: `${file.replace(/\.svg$/, "")}Doticon`.replace(/(?:^|-)(\w)/g, (_, c) =>
          c.toUpperCase()
        ),
      }))
  )
}

const buildIcons = async (size, icons) => {
  await Promise.all(
    icons.flatMap(async ({ componentName, svg }) => {
      let content = await transform(
        svg,
        {
          ref: true,
          svgProps: {
            width: "inherit",
            height: "inherit",
          },
          plugins: ["@svgr/plugin-svgo", "@svgr/plugin-jsx", "@svgr/plugin-prettier"],
        },
        { componentName }
      )
      let { code } = await transformAsync(content, {
        plugins: [[("@babel/plugin-transform-react-jsx"), { useBuiltIns: true }]],
      })

      let type = `import * as React from 'react';\ndeclare const ${componentName}: React.ForwardRefExoticComponent<React.PropsWithoutRef<React.SVGProps<SVGSVGElement>> & { width?: string, height?: string, fill?: string } & React.RefAttributes<SVGSVGElement>>;\nexport default ${componentName};\n`
      
      await writeFiles(`build/${size}/${componentName}.js`, code)
      await writeFiles(`build/${size}/${componentName}.d.ts`, type)
    })
  )
  await writeFiles(`build/${size}/index.js`, exportIcons(icons))
  await writeFiles(`build/${size}/index.d.ts`, exportIcons(icons, false))

}

async function writeFiles(file, text) {
    await fs.mkdir(dirname(file), { recursive: true })
    await fs.writeFile(file, text, 'utf8')
}

function exportIcons(icons, includeExtension = true) {
  return icons
    .map(({ componentName }) => {
      let extension = includeExtension ? '.js' : ''
      return `export { default as ${componentName} } from './${componentName}${extension}'`
    })
    .join("\n")
}

const iconSize = process.argv[2]

if (!iconSize) {
  throw new Error("Please specify a size")
}

const main = async (size) => {
  const packageJson = { type: "module", sideEffects: false }

  const icons = await getIcons(size)
  await buildIcons(size, icons)
  await writeFiles(`build/${size}/package.json`, JSON.stringify(packageJson, null, 2) + "\n")
  return console.log(`Finished building ${size}x${size} grid icons package.`)
}

main(iconSize)
