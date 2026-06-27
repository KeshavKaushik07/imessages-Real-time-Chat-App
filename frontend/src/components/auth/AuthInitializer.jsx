import { useEffect } from "react";
import { useAuth } from "@clerk/react";
import { setTokenGetter } from "../../lib/axios";

export default function AuthInitializer() {
  const { getToken } = useAuth();
console.log("AuthInitializer rendered");
    setTokenGetter(getToken);

  return null;
}