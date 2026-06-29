const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const standaloneDir = path.join(root, ".next", "standalone");

const copyDirectory = (source, destination) => {
  if (!fs.existsSync(source)) {
    console.warn(`[standalone] Skipped missing source: ${path.relative(root, source)}`);
    return;
  }

  fs.rmSync(destination, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.cpSync(source, destination, { recursive: true });
  console.log(
    `[standalone] Copied ${path.relative(root, source)} -> ${path.relative(
      root,
      destination,
    )}`,
  );
};

if (!fs.existsSync(path.join(standaloneDir, "server.js"))) {
  throw new Error(
    "Standalone server was not generated. Ensure next.config.js has output: 'standalone' and next build completed successfully.",
  );
}

copyDirectory(path.join(root, "public"), path.join(standaloneDir, "public"));
copyDirectory(
  path.join(root, ".next", "static"),
  path.join(standaloneDir, ".next", "static"),
);
