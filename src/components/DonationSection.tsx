import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart } from "lucide-react";
import upiQr from "@/assets/upi-qr.jpeg";

export function DonationSection() {
  return (
    <Card className="shadow-card border-0 bg-gradient-card">
      <CardHeader className="bg-gradient-primary/10 rounded-t-lg text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Heart className="h-5 w-5 text-destructive fill-destructive" />
          Support FinMG
        </CardTitle>
        <CardDescription>
          If you find this app helpful, consider supporting its development
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 flex flex-col items-center space-y-4">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <img 
            src={upiQr} 
            alt="UPI Payment QR Code" 
            className="w-64 h-64 object-contain"
          />
        </div>
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Scan the QR code to donate via UPI
          </p>
          <p className="text-xs text-muted-foreground">
            Your support helps keep FinMG free and updated
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
