import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Role = "admin" | "user";

export function useAuthGuard(requiredRole: Role) {
    const router = useRouter();

    const [authChecked, setAuthChecked] = useState(false);
    const [username, setUsername] = useState("");
    const [role, setRole] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("token");
        const storedUsername = localStorage.getItem("username");
        const storedRole = localStorage.getItem("role");

        if (!token || storedRole !== requiredRole) {
            router.push("/login");
            return;
        }

        setUsername(storedUsername || (requiredRole === "admin" ? "Admin" : "User"));
        setRole(storedRole || "");
        setAuthChecked(true);
    }, [requiredRole, router]);

    return {
        authChecked,
        username,
        role,
    };
}