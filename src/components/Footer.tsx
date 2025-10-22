import { Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-gradient-card mt-12">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <span>Made with</span>
          <Heart className="h-4 w-4 text-destructive fill-destructive animate-pulse" />
          <span>by</span>
          <span className="font-semibold text-foreground">Arnav Sinha</span>
        </div>
      </div>
    </footer>
  );
}
