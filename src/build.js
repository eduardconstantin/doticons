import { promises as fs } from "fs";
import { join, dirname } from "path";
import { transform } from "@svgr/core";
import { transformAsync } from "@babel/core";

const getIcons = async (size) => {
  let files = await fs.readdir(join(process.cwd(), `./icons/${size}`));
  return Promise.all(
    files
      .filter((filename) => filename.endsWith(".svg"))
      .map(async (file) => ({
        svg: await fs.readFile(join(process.cwd(), `./icons/${size}/${file}`), "utf8"),
        componentName: `${file.replace(/\.svg$/, "")}Doticon`.replace(/(?:^|-)(\w)/g, (_, c) => c.toUpperCase()),
      })),
  );
};

const buildIcons = async (size, icons) => {
  const patternConfig = {
    16: { width: "32", height: "32", cx: "16", cy: "16", r: "11.5" },
    32: { width: "16", height: "16", cx: "8", cy: "8", r: "6" },
  }[size];

  const dotsPattern = `<defs>
    <pattern id="dots" x="0" y="0" width="${patternConfig.width}" height="${patternConfig.height}" patternUnits="userSpaceOnUse">
      <circle cx="${patternConfig.cx}" cy="${patternConfig.cy}" r="${patternConfig.r}" fill="black" />
    </pattern>
  </defs>
  <rect width="100%" height="100%" style="fill: url(#dots);" opacity="DOTS_OPACITY" />`;

  await Promise.all(
    icons.flatMap(async ({ componentName, svg }) => {
      const svgWithPattern = svg.replace(/<svg[^>]*>/, `$&\n${dotsPattern}\n`);

      let content = await transform(
        svgWithPattern,
        {
          ref: true,
          prettier: true,
          svgProps: {
            width: "inherit",
            height: "inherit",
          },
          replaceAttrValues: {
            DOTS_OPACITY: "{props.dotsOpacity??0}",
          },
          jsxRuntimeImport: { source: "react", specifiers: ["createElement"] },
          plugins: ["@svgr/plugin-svgo", "@svgr/plugin-jsx", "@svgr/plugin-prettier"],
        },
        { componentName },
      );
      let { code } = await transformAsync(content, {
        comments: false,
        minified: true,
        plugins: [["@babel/plugin-transform-react-jsx", { useBuiltIns: true, pragma: "createElement" }]],
      });

      let type = `import type { SVGProps, ForwardRefExoticComponent, RefAttributes } from 'react';\ndeclare const ${componentName}: ForwardRefExoticComponent<SVGProps<SVGSVGElement> & { width?: string, height?: string, fill?: string, dotsOpacity?: number } & RefAttributes<SVGSVGElement>>;\nexport default ${componentName};\n`;

      await writeFiles(`build/${size}/${componentName}.js`, code);
      await writeFiles(`build/${size}/${componentName}.d.ts`, type);
    }),
  );
  await writeFiles(`build/${size}/index.js`, exportIcons(icons));
  await writeFiles(`build/${size}/index.d.ts`, exportIcons(icons, false));
};

async function writeFiles(file, text) {
  await fs.mkdir(dirname(file), { recursive: true });
  await fs.writeFile(file, text, "utf8");
}

function exportIcons(icons, includeExtension = true) {
  return icons
    .map(({ componentName }) => {
      let extension = includeExtension ? ".js" : "";
      return `export { default as ${componentName} } from './${componentName}${extension}'`;
    })
    .join("\n");
}

const iconSize = process.argv[2];

if (!iconSize) {
  throw new Error("Please specify a size");
}

const main = async (size) => {
  const packageJson = { type: "module", sideEffects: false };

  const icons = await getIcons(size);
  await buildIcons(size, icons);
  await writeFiles(`build/${size}/package.json`, JSON.stringify(packageJson, null, 2) + "\n");
  return console.log(`Finished building ${size}x${size} grid icons package.`);
};

main(iconSize);
