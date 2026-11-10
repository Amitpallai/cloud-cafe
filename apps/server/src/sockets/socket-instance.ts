import type { Server } from "socket.io";

let socketServer: Server | null = null;

export function setSocketServer(server: Server) {
  socketServer = server;
}

export function emitKitchenEvent(
  event: string,
  payload: unknown,
) {
  if (!socketServer) return;

  socketServer.to("kitchen").emit(event, payload);
  socketServer.to("pos").emit(event, payload);
}