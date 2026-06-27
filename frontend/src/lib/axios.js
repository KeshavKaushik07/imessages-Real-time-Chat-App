import axios from "axios";

export const axiosInstance = axios.create({
    baseURL:
        import.meta.env.MODE === "development"
            ? "http://localhost:8080/api"
            : `${import.meta.env.VITE_API_URL}/api`,
    withCredentials: true,
});

let getTokenFn = null;

export const setTokenGetter = (fn) => {
    getTokenFn = fn;
};

axiosInstance.interceptors.request.use(async (config) => {
//   console.log("Interceptor running");
console.log("Interceptor:", !!getTokenFn);

  if (getTokenFn) {
    const token = await getTokenFn();

    // console.log("Token:", token);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } else {
    console.log("Token getter not set");
  }

  return config;
});