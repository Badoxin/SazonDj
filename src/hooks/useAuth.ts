import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

// Custom hook: en lugar de repetir useContext(AuthContext) en cada componente.
export const useAuth = () => useContext(AuthContext);
