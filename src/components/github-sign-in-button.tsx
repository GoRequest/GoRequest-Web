import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GITHUB_SIGN_IN_URL } from "@/lib/api/client";

export function GitHubSignInButton() {
  return (
    <Button
      asChild
      size="sm"
    >
      <a href={GITHUB_SIGN_IN_URL}>
        <LogIn />
        Sign in with GitHub
      </a>
    </Button>
  );
}
