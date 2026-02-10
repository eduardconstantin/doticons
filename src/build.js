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

  const filterOne = `<filter id="pulse">
      <feTurbulence baseFrequency="0.15" numOctaves="2" result="noise"/>
      <feColorMatrix in="noise" type="hueRotate" values="0" result="animatedNoise">
        <animate attributeName="values" values="0;360" dur="SPEED" repeatCount="indefinite" />
      </feColorMatrix>
      <feColorMatrix in="animatedNoise" type="matrix" values="
                0 0 0 0 0
                0 0 0 0 0
                0 0 0 0 0
                30 2 2 -5 -20" result="maskAlpha" />
      <feMorphology operator="dilate" radius="8" in="maskAlpha" result="blockyMask" />
      <feGaussianBlur in="blockyMask" stdDeviation="2" result="blur" />
      <feComposite operator="in" in="SourceGraphic" in2="blur" />
    </filter>`;

  const filterTwo = `<filter id="shimmer" width="2">
      <feTurbulence width="600" baseFrequency="0.006" numOctaves="0.5" result="noise" stitchTiles="stitch" type="fractalNoise"/>
      <feColorMatrix in="noise" result="animatedNoise" type="hueRotate" values="0">
        <animate attributeName="values" dur="5s" repeatCount="indefinite" values="0;360"/>
      </feColorMatrix>
      <feColorMatrix
        type="matrix"
        values="0 0 0 0 0
                0 0 0 0 0
                0 0 0 0 0
                4 0 0 1 -2"
      />
      <feTile width="1200" height="1200"/> 
      <feOffset result="offset" dx="0" dy="0">
        <animate attributeName="DIR" from="-600" to="0" begin="0s" dur="SPEED" repeatCount="indefinite" />
      </feOffset>
      <feComposite operator="in" in="SourceGraphic" in2="offset" />
    </filter>`;

  const filterThree = `<filter id="sparkling">
    <feTurbulence width="600" baseFrequency="0.015" numOctaves="2" result="noise" stitchTiles="stitch" type="turbulence">
      <animate attributeName="seed" dur="5s" repeatCount="indefinite" values="0;30"/>
    </feTurbulence>
    <feComponentTransfer in="mat" result="alphaMask">
      <feFuncA type="table" tableValues="0.4 0.4 2 2 1" />
    </feComponentTransfer>
    <feTile width="1200" height="1200"/>
    <feOffset result="offset">
      <animate attributeName="DIR" begin="0s" dur="SPEED" from="-600" repeatCount="indefinite" to="0"/>
    </feOffset>
    <feComposite in="SourceGraphic" in2="offset" operator="in"/>
  </filter>`;

  const pattern = `<pattern id="dots" x="0" y="0" width="${patternConfig.width}" height="${patternConfig.height}" patternUnits="userSpaceOnUse">
      <circle cx="${patternConfig.cx}" cy="${patternConfig.cy}" r="${patternConfig.r}" fill="black" />
    </pattern>`;

  await Promise.all(
    icons.flatMap(async ({ componentName, svg }) => {
      const svgWithInjected = svg.replace(
        /<svg[^>]*>/,
        (match) =>
          `${match} <defs>${filterOne}${filterTwo}${filterThree}${pattern}</defs><g filter="ANIM"><rect width="100%" height="100%" fill="url(#dots)" opacity="DOTS_OPACITY" />`,
      );
      const finalSvg = svgWithInjected.replace(/<\/svg>/, "</g></svg>");

      let content = await transform(
        finalSvg,
        {
          ref: true,
          prettier: true,
          svgProps: {
            width: "inherit",
            height: "inherit",
          },
          template: (variables, { tpl }) => {
            return tpl`
              ${variables.imports};
              const ${variables.componentName} = ({ dotsOpacity, anim, animSpeed, animDir, ...props }, ref) => (
                  ${variables.jsx})
              ${variables.exports};
            `;
          },
          svgoConfig: {
            plugins: [
              {
                name: "preset-default",
                params: {
                  overrides: {
                    removeUselessDefs: false,
                    cleanupIds: false,
                  },
                },
              },
            ],
          },
          replaceAttrValues: {
            DOTS_OPACITY: "{dotsOpacity??0}",
            ANIM: "{anim ? `url(#${anim})` : undefined}",
            SPEED: "{(animSpeed ?? 5) + 's'}",
            DIR: "{'d'+(animDir ?? 'x')}",
          },
          jsxRuntimeImport: { source: "react", specifiers: ["createElement"] },
          plugins: ["@svgr/plugin-svgo", "@svgr/plugin-jsx", "@svgr/plugin-prettier"],
        },
        { componentName },
      );
      let { code } = await transformAsync(content, {
        comments: false,
        minified: false,
        plugins: [["@babel/plugin-transform-react-jsx", { useBuiltIns: true, pragma: "createElement" }]],
      });

      let type = `import type { SVGProps, ForwardRefExoticComponent, RefAttributes } from 'react';\ndeclare const ${componentName}: ForwardRefExoticComponent<SVGProps<SVGSVGElement> & { width?: string, height?: string, fill?: string, dotsOpacity?: number, anim?: shimmer | pulse | sparkling, animSpeed?: number, animDir?: x | y } & RefAttributes<SVGSVGElement>>;\nexport default ${componentName};\n`;

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
