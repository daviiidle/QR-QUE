const { spawn } = require("child_process");
const path = require("path");

const tasks = [
  { name: "NEXT", cmd: "node", args: ["node_modules/next/dist/bin/next", "dev", "-p", "3001"] },
  { name: "STRIPE", cmd: "stripe", args: ["listen", "--forward-to", "localhost:3001/api/webhooks/stripe"] },
];

const children = tasks.map(({ name, cmd, args }) => {
  const child = spawn(cmd, args, {
    stdio: "inherit",
    shell: true,
    cwd: path.resolve(__dirname),
  });
  child.on("exit", (code) => {
    if (code !== 0) console.error(`${name} exited with code ${code}`);
  });
  console.log(`[${name}] started`);
  return child;
});

process.on("SIGINT", () => {
  children.forEach((c) => c.kill("SIGINT"));
  process.exit(0);
});