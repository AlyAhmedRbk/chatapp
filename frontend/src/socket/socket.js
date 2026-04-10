import { io } from "socket.io-client";

let socket;

export const connectSocket = (userId) => {
  socket = io(import.meta.env.VITE_SOCKET_URL, {
    withCredentials: true,
    query: { userId },
  });

  return socket;
};

export const getSocket = () => socket;