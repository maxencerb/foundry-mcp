import type { CommandResult } from "./types.ts";

export async function exec(
  command: string,
  args: string[] = [],
  cwd?: string
): Promise<CommandResult> {
  const fullCommand = [command, ...args];

  try {
    const proc = Bun.spawn(fullCommand, {
      cwd: cwd || process.cwd(),
      stdout: "pipe",
      stderr: "pipe",
      env: {
        ...process.env,
        // Ensure colors are disabled for clean output
        NO_COLOR: "1",
        FORCE_COLOR: "0",
      },
    });

    const [stdout, stderr] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
    ]);

    const exitCode = await proc.exited;

    return {
      success: exitCode === 0,
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      exitCode,
    };
  } catch (error) {
    return {
      success: false,
      stdout: "",
      stderr: error instanceof Error ? error.message : String(error),
      exitCode: 1,
    };
  }
}

export function buildArgs(
  options: Record<string, string | number | boolean | undefined>
): string[] {
  const args: string[] = [];

  for (const [key, value] of Object.entries(options)) {
    if (value === undefined || value === false) continue;

    const flag = key.length === 1 ? `-${key}` : `--${key}`;

    if (value === true) {
      args.push(flag);
    } else {
      args.push(flag, String(value));
    }
  }

  return args;
}

export function formatOutput(result: CommandResult): string {
  if (result.success) {
    return result.stdout || "Command completed successfully.";
  }

  const parts: string[] = [];
  if (result.stderr) {
    parts.push(`Error: ${result.stderr}`);
  }
  if (result.stdout) {
    parts.push(`Output: ${result.stdout}`);
  }
  parts.push(`Exit code: ${result.exitCode}`);

  return parts.join("\n");
}

export function textContent(text: string) {
  return { content: [{ type: "text" as const, text }] };
}
