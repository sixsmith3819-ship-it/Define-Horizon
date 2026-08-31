// lib/hooks/useUserRole.ts - Custom hook to get user role from localStorage
import { useEffect, useState } from "react";

interface UserProfile {
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  role_id: string;
  branch_id: string;
  is_active: boolean;
}

export function useUserRole() {
  const [userRole, setUserRole] = useState<string>("employee");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserRole() {
      try {
        // PRIMARY: Get role from localStorage (set during login)
        const storedRole = localStorage.getItem("user_role");
        if (storedRole) {
          setUserRole(storedRole);
          setLoading(false);
          return;
        }

        // FALLBACK: Try fetching from API if not in localStorage
        const token = localStorage.getItem("access_token");
        if (!token) {
          setUserRole("employee");
          setLoading(false);
          return;
        }

        // Fetch user profile with role from database
        const response = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const profile = await response.json();
          setUserProfile(profile);
          setUserRole(profile.role || "employee");
          // Store for next time
          localStorage.setItem("user_role", profile.role || "employee");
          setError(null);
        } else {
          // If API fails, default to employee
          setUserRole("employee");
        }
      } catch (err) {
        console.error("Failed to fetch user role:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch role");
        setUserRole("employee"); // Default to employee on error
      } finally {
        setLoading(false);
      }
    }

    fetchUserRole();
  }, []);

  return {
    userRole,
    userProfile,
    loading,
    error,
    isSuperAdmin: userRole === "super_admin",
    isEmployee: userRole === "employee",
    isBranchManager: userRole === "branch_manager",
    isAuditor: userRole === "auditor",
  };
}
