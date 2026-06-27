import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { io } from "socket.io-client";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:8080" : `${import.meta.env.VITE_API_URL}`;

export const useAuthStore = create((set, get) => ({
    authUser: null,
    isCheckingAuth: true,
    onlineUsers: [],
    socket: null,

    checkAuth: async () => {
        set({ isCheckingAuth: true });

        try {
            const res = await axiosInstance.get("/auth/check");

            console.log("CHECK AUTH RESPONSE:", res.data);

            set({ authUser: res.data });

            console.log("Calling connectSocket");
            console.log(get());
            get().connectSocket(res.data);
            console.log("Returned from connectSocket");
        } catch (error) {
            console.error("Error in checkAuth:", error);
            set({ authUser: null });
        } finally {
            set({ isCheckingAuth: false });
        }
    },

    clearAuth: () => {
        set({ authUser: null, isCheckingAuth: false, onlineUsers: [] });
        get().disconnectSocket();
    },

    connectSocket: (user) => {
        console.log("User:", user);

        if (!user || get().socket?.connected) return;

        console.log("User ID:", user._id);

        const socket = io(BASE_URL, {
            query: {
                userId: user._id,
            },
        });

        socket.on("connect", () => {
            console.log("✅ Connected", socket.id);
        });

        socket.on("disconnect", (reason) => {
            console.log("❌ Disconnected", reason);
        });

        socket.on("connect_error", (err) => {
            console.log("🚨", err.message);
        });

        socket.on("getOnlineUsers", (users) => {
            console.log("ONLINE USERS", users);

            set({
                onlineUsers: users,
            });
        });

        set({ socket });
    },

    disconnectSocket: () => {
        const socket = get().socket;
        if (socket?.connected) socket.disconnect();
        set({ socket: null });
    },

}));