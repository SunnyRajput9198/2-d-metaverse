declare module "@google/generative-ai" {
  export const text: {
    generate: (options: { model: string; prompt: string }) => Promise<any>;
  };
}
