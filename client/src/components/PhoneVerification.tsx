import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface PhoneVerificationProps {
  phoneNumber: string;
  onVerified: () => void;
  onCancel: () => void;
}

export default function PhoneVerification({ 
  phoneNumber, 
  onVerified, 
  onCancel 
}: PhoneVerificationProps) {
  const { toast } = useToast();
  const [otpCode, setOtpCode] = useState("");
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [devModeOTP, setDevModeOTP] = useState<string | null>(null);

  const handleSendOTP = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast({
        title: "Invalid phone number",
        description: "Please enter a valid phone number",
        variant: "destructive"
      });
      return;
    }

    setIsSendingOTP(true);
    try {
      const response = await apiRequest("POST", "/api/verify-phone/send-otp", { phoneNumber });
      const data = await response.json();
      
      // In development mode, the API might return the OTP for testing
      if (data.code) {
        setDevModeOTP(data.code);
      }
      
      setOtpSent(true);
      toast({
        title: "OTP sent",
        description: "A verification code has been sent to your WhatsApp"
      });
    } catch (error) {
      toast({
        title: "Failed to send OTP",
        description: "An error occurred while sending the verification code",
        variant: "destructive"
      });
    } finally {
      setIsSendingOTP(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a valid 6-digit verification code",
        variant: "destructive"
      });
      return;
    }

    setIsVerifyingOTP(true);
    try {
      const response = await apiRequest("POST", "/api/verify-phone/verify-otp", { 
        phoneNumber, 
        otpCode 
      });
      
      if (response.ok) {
        toast({
          title: "Phone verified",
          description: "Your phone number has been verified successfully"
        });
        onVerified();
      } else {
        const error = await response.json();
        toast({
          title: "Verification failed",
          description: error.message || "Invalid verification code",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Verification failed",
        description: "An error occurred during verification",
        variant: "destructive"
      });
    } finally {
      setIsVerifyingOTP(false);
    }
  };

  return (
    <div className="px-4 py-6 bg-white rounded-lg shadow-sm">
      <h3 className="text-lg font-medium mb-4">Verify Your Phone Number</h3>
      
      {!otpSent ? (
        <div className="space-y-4">
          <p className="text-neutral-600 text-sm">
            We'll send a verification code to your WhatsApp number.
          </p>
          
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input 
              id="phoneNumber"
              value={phoneNumber}
              disabled
            />
          </div>
          
          <div className="flex space-x-2 justify-end">
            <Button 
              variant="outline" 
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSendOTP}
              disabled={isSendingOTP}
              className="bg-[#FF5722] hover:bg-[#E64A19]"
            >
              {isSendingOTP ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : "Send Code"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-neutral-600 text-sm">
            Enter the 6-digit verification code sent to your WhatsApp.
          </p>
          
          {devModeOTP && (
            <div className="p-2 bg-gray-100 rounded border border-gray-200 text-sm text-gray-700">
              <p>Development mode: Use code <strong>{devModeOTP}</strong></p>
            </div>
          )}
          
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="otpCode">Verification Code</Label>
            <Input 
              id="otpCode"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              placeholder="Enter 6-digit code"
              maxLength={6}
            />
          </div>
          
          <div className="flex space-x-2 justify-end">
            <Button 
              variant="outline" 
              onClick={() => setOtpSent(false)}
            >
              Back
            </Button>
            <Button 
              onClick={handleVerifyOTP}
              disabled={isVerifyingOTP}
              className="bg-[#FF5722] hover:bg-[#E64A19]"
            >
              {isVerifyingOTP ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : "Verify"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}