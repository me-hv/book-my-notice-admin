"use client";

import { useMutation } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export function LogoutButton() {
  const router = useRouter();
  const { logout } = useAuth();
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSettled: () => {
      router.replace("/login");
      router.refresh();
    },
  });

  return (
    <Button
      aria-label="Sign out"
      disabled={logoutMutation.isPending}
      onClick={() => logoutMutation.mutate()}
      size="icon"
      variant="ghost"
    >
      <LogOut className="size-4" />
    </Button>
  );
}
