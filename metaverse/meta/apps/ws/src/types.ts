// OutgoingMessage is typed as `any` to allow the flexible message shapes
// the WS server sends (space-joined, movement, chat-message, etc.).
// If you want strict typing in future, replace this with a discriminated union.
export type OutgoingMessage = any;
