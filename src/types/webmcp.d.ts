interface WebMcpAnnotations {
  readOnlyHint?: boolean;
  untrustedContentHint?: boolean;
}

interface WebMcpExecutionOptions {
  signal: AbortSignal;
}

interface WebMcpTool {
  name: string;
  title?: string;
  description: string;
  inputSchema?: Record<string, unknown>;
  annotations?: WebMcpAnnotations;
  execute: (
    input: unknown,
    options: WebMcpExecutionOptions,
  ) => unknown | Promise<unknown>;
}

interface ModelContext {
  registerTool(
    tool: WebMcpTool,
    options?: { signal?: AbortSignal; exposedTo?: string[] },
  ): Promise<undefined>;
  getTools?(): Promise<unknown[]>;
}

interface Document {
  readonly modelContext?: ModelContext;
}
