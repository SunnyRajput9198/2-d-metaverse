import client, { type Prisma } from "@repo/db";

const PERSIST_DELAY_MS = 400;
const pending = new Map<string, { elements: Prisma.InputJsonValue; timer: ReturnType<typeof setTimeout> }>();
const writes = new Map<string, Promise<void>>();

export function scheduleCanvasPersistence(spaceId: string, elements: Prisma.InputJsonValue): void {
  const prior = pending.get(spaceId);
  if (prior) clearTimeout(prior.timer);

  const timer = setTimeout(() => {
    const latest = pending.get(spaceId);
    if (!latest) return;
    pending.delete(spaceId);

    const write = (writes.get(spaceId) ?? Promise.resolve())
      .catch(() => undefined)
      .then(() => client.canvasState.upsert({
        where: { spaceId },
        update: { elements: latest.elements },
        create: { spaceId, elements: latest.elements },
      }))
      .then(() => undefined)
      .catch((error: unknown) => {
        console.error("Canvas persistence failed:", error instanceof Error ? error.message : "unknown error");
      });
    writes.set(spaceId, write);
    void write.finally(() => {
      if (writes.get(spaceId) === write) writes.delete(spaceId);
    });
  }, PERSIST_DELAY_MS);

  pending.set(spaceId, { elements, timer });
}
