import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:8080";

let socketInstance = null;

export const getTelemedicineSocket = () => {
  const token = localStorage.getItem("token");

  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      autoConnect: false,
      auth: { token },
    });
  } else {
    socketInstance.auth = { token };
  }

  if (!socketInstance.connected) {
    socketInstance.connect();
  }

  return socketInstance;
};

export const disconnectTelemedicineSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};
