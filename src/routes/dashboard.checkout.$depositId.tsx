import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Shield, Clock, Copy, Check, AlertTriangle, 
  ArrowLeft, RefreshCw, CheckCircle, HelpCircle 
} from "lucide-react";
import { GearSectionLoader } from "@/components/gear-loader";
import { financeApi } from "@/lib/api-finance";
import { playSound } from "@/lib/sounds";

export const Route = createFileRoute("/dashboard/checkout/$depositId")({
  component: CheckoutPage,
});

function CheckoutPage() {
  const { depositId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const [isInvoiceExpired, setIsInvoiceExpired] = useState(false);

  // 1. Poll deposit status every 10 seconds until completed/approved or expired/rejected
  const { data: deposit, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["depositStatus", depositId],
    queryFn: async () => {
      const res = await financeApi.getUsdtDepositStatus(depositId);
      return res.deposit;
    },
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "completed" || status === "approved" || status === "rejected") {
        return false;
      }
      return 10000; // Poll every 10 seconds
    }
  });

  // 2. Countdown timer for invoice expiration
  useEffect(() => {
    if (!deposit || !deposit.expiresAt) return;

    const interval = setInterval(() => {
      const difference = new Date(deposit.expiresAt).getTime() - new Date().getTime();
      if (difference <= 0) {
        setTimeLeft("Expired");
        setIsInvoiceExpired(true);
        clearInterval(interval);
      } else {
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        
        const hStr = hours.toString().padStart(2, "0");
        const mStr = minutes.toString().padStart(2, "0");
        const sStr = seconds.toString().padStart(2, "0");
        
        setTimeLeft(`${hStr}:${mStr}:${sStr}`);
        setIsInvoiceExpired(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [deposit]);

  // 3. Auto-redirect user once payment completed/approved
  useEffect(() => {
    if (deposit?.status === "completed" || deposit?.status === "approved") {
      toast.success("Payment verified! Wallet credited successfully.");
      playSound.playSuccess();
      
      const timeout = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["wallets"] });
        navigate({ to: "/dashboard/wallet" });
      }, 4000);

      return () => clearTimeout(timeout);
    }
  }, [deposit?.status, navigate, queryClient]);

  const handleCopyAddress = () => {
    if (!deposit?.cryptoAddress) return;
    navigator.clipboard.writeText(deposit.cryptoAddress);
    setCopiedAddress(true);
    playSound.playClick();
    toast.success("Address copied to clipboard!");
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleCopyAmount = () => {
    if (!deposit?.cryptoAmount) return;
    navigator.clipboard.writeText(deposit.cryptoAmount.toString());
    setCopiedAmount(true);
    playSound.playClick();
    toast.success("Amount copied to clipboard!");
    setTimeout(() => setCopiedAmount(false), 2000);
  };

  const handleManualCheck = () => {
    playSound.playClick();
    refetch();
    toast.info("Checking transaction status on blockchain...");
  };

  if (isLoading) {
    return (
      <DashboardLayout title="USDT Secure Checkout">
        <div className="flex items-center justify-center min-h-[400px]">
          <GearSectionLoader text="Loading secure checkout details..." />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !deposit) {
    return (
      <DashboardLayout title="USDT Secure Checkout">
        <Card className="border-glass-border shadow-soft bg-white/90 dark:bg-card/90 max-w-md mx-auto text-center p-8 rounded-[32px] space-y-4">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto animate-bounce" />
          <h2 className="text-lg font-black text-foreground">Checkout Not Found</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The requested deposit invoice was not found or has expired. Please go back and initiate a new deposit.
          </p>
          <Link to="/dashboard/wallet">
            <Button className="w-full bg-primary-gradient text-primary-foreground h-11 rounded-xl shadow-soft cursor-pointer">
              <ArrowLeft size={14} className="mr-1.5" /> Back to Wallet
            </Button>
          </Link>
        </Card>
      </DashboardLayout>
    );
  }

  // Check if payment is already credited
  const isPaid = deposit.status === "completed" || deposit.status === "approved";

  return (
    <DashboardLayout title="USDT Secure Checkout">
      <div className="space-y-6">

        {isPaid ? (
          /* Payout Success Screen */
          <Card className="border-glass-border shadow-soft bg-[#001e14]/95 border-emerald-500/20 text-white max-w-md mx-auto p-8 rounded-[32px] text-center space-y-6 animate-in zoom-in-95 duration-500">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle size={36} className="animate-pulse" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tight text-white">Payment Received!</h2>
              <p className="text-xs text-emerald-200/60 leading-relaxed max-w-xs mx-auto">
                Your deposit of **${deposit.amountUSDT.toFixed(2)} USDT** has been verified on the blockchain. Your wallet is credited.
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-500/10 bg-white/5 p-4 font-mono text-[11px] space-y-1.5 text-left">
              <div className="flex justify-between"><span>Transaction ID:</span><span className="text-white font-bold">{deposit.transactionId}</span></div>
              <div className="flex justify-between"><span>Amount Credited:</span><span className="text-emerald-400 font-bold">${deposit.amountUSDT.toFixed(2)} USDT</span></div>
              <div className="flex justify-between"><span>Status:</span><span className="text-emerald-400 font-bold uppercase">{deposit.status}</span></div>
            </div>
            <p className="text-[10px] text-emerald-200/40 animate-pulse">Redirecting back to wallet in 3 seconds...</p>
            <Link to="/dashboard/wallet">
              <Button className="w-full bg-[#10b981] hover:bg-emerald-600 text-white font-extrabold h-11 rounded-xl cursor-pointer">
                Go to Wallet
              </Button>
            </Link>
          </Card>
        ) : (
          /* Main Checkout Screen (Payment & Rules side by side on desktop) */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left Payment details card */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-glass-border shadow-soft bg-[#00140e] border-emerald-500/20 text-white rounded-[32px] p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#00693e]/10 via-transparent to-[#f3ba2f]/10 opacity-30 pointer-events-none" />
                
                <CardHeader className="pb-3 border-b border-emerald-500/10 px-0 pt-0">
                  <CardTitle className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                    <Shield className="h-5 w-5 text-[#10b981]" />
                    USDT Secure Checkout
                  </CardTitle>
                  <CardDescription className="text-[11px] text-emerald-200/60 leading-normal">
                    Send the exact crypto amount to the address below to credit your SkyRise wallet.
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-0 space-y-6 mt-6">

                  {/* QR Container */}
                  <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-5 p-5 bg-white/5 border border-emerald-500/15 rounded-2xl">
                    <div className="bg-white p-3 rounded-2xl shadow-inner flex items-center justify-center flex-shrink-0">
                      {deposit.cryptoQrCodeUrl ? (
                        <img src={deposit.cryptoQrCodeUrl} alt="USDT QR" className="h-28 w-28 object-contain" />
                      ) : (
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${deposit.cryptoAddress}`} alt="USDT QR" className="h-28 w-28 object-contain" />
                      )}
                    </div>
                    <div className="space-y-2 text-center sm:text-left">
                      <span className="text-[10px] text-emerald-300 font-extrabold uppercase tracking-widest leading-none block">Scan to Pay</span>
                      <p className="text-[11px] text-emerald-200/60 leading-relaxed">
                        Scan this QR code using your crypto wallet app (e.g. Binance, Trust Wallet, MetaMask) to retrieve deposit details instantly.
                      </p>
                    </div>
                  </div>

                  {/* Time Remaining Bar */}
                  <div className={`flex items-center justify-between px-4 py-3 rounded-2xl border ${
                    isInvoiceExpired 
                      ? "bg-rose-500/10 border-rose-500/25 text-rose-400 font-bold" 
                      : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                  } font-mono text-xs`}>
                    <span className="flex items-center gap-1.5 font-bold"><Clock size={14} className={isInvoiceExpired ? "" : "animate-pulse"} /> Time Remaining:</span>
                    <span className="font-extrabold text-sm sm:text-base">{timeLeft || "03:00:00"}</span>
                  </div>

                  {/* Amount Field */}
                  <div className="space-y-1.5">
                    <Label className="text-emerald-200/70 font-semibold text-xs">Amount to Send (USDT)</Label>
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <Input 
                          readOnly 
                          value={deposit.cryptoAmount} 
                          className="h-11 pl-4 pr-16 bg-white/5 border border-emerald-500/20 text-white font-mono font-bold rounded-xl focus-visible:ring-emerald-500/30 text-sm focus:border-emerald-500/40 w-full"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-400/70 font-mono">USDT</span>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={handleCopyAmount}
                        className="h-11 bg-[#10b981] hover:bg-emerald-600 text-white font-bold text-[10px] rounded-xl px-4 cursor-pointer shadow flex-shrink-0"
                      >
                        {copiedAmount ? <Check size={12} className="mr-1" /> : <Copy size={12} className="mr-1" />}
                        {copiedAmount ? "Copied" : "Copy"}
                      </Button>
                    </div>
                  </div>

                  {/* Deposit Address Field */}
                  <div className="space-y-1.5">
                    <Label className="text-emerald-200/70 font-semibold text-xs">USDT Deposit Address</Label>
                    <div className="flex items-center gap-3">
                      <Input 
                        readOnly 
                        value={deposit.cryptoAddress} 
                        className="h-11 pl-4 bg-white/5 border border-emerald-500/20 text-white font-mono text-[10.5px] sm:text-xs font-semibold rounded-xl focus-visible:ring-emerald-500/30 focus:border-emerald-500/40 flex-1 min-w-0"
                      />
                      <Button 
                        size="sm" 
                        onClick={handleCopyAddress}
                        className="h-11 bg-[#10b981] hover:bg-emerald-600 text-white font-bold text-[10px] rounded-xl px-4 cursor-pointer shadow flex-shrink-0"
                      >
                        {copiedAddress ? <Check size={12} className="mr-1" /> : <Copy size={12} className="mr-1" />}
                        {copiedAddress ? "Copied" : "Copy"}
                      </Button>
                    </div>
                  </div>

                  {/* Warning Box */}
                  <div className="rounded-2xl border border-rose-500/25 bg-rose-500/5 p-4 text-[10.5px] text-rose-300 flex items-start gap-3 leading-relaxed">
                    <AlertTriangle size={18} className="text-rose-400 mt-0.5 flex-shrink-0 animate-pulse" />
                    <div>
                      <strong className="text-white block mb-0.5">Important Network Warning:</strong> Only send this token over the <strong className="text-white">Binance Smart Chain (BSC / BEP20)</strong> network. Sending via other block chains (e.g. TRC20, ERC20) or smart contracts will result in permanent loss!
                    </div>
                  </div>

                  {/* Refresh / Verification Action */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Button 
                      onClick={handleManualCheck}
                      disabled={isRefetching || isInvoiceExpired}
                      className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold h-11 rounded-xl cursor-pointer border border-emerald-500/20 text-xs shadow"
                    >
                      <RefreshCw size={14} className={`mr-1.5 ${isRefetching ? "animate-spin" : ""}`} />
                      Check Payment Status
                    </Button>
                    <Link to="/dashboard/wallet" className="flex-1">
                      <Button 
                        className="w-full bg-gradient-to-r from-[#004d33] to-[#0e9f6e] hover:from-[#0c6a46] hover:to-[#10b981] text-white font-black h-11 rounded-xl shadow-md transition-all cursor-pointer text-xs"
                      >
                        I have sent the payment
                      </Button>
                    </Link>
                  </div>

                </CardContent>
              </Card>
            </div>

            {/* Right Instructions / Guidelines Panel */}
            <div className="space-y-6">
              
              {/* Stepper Guide */}
              <Card className="border-glass-border shadow-soft bg-white/95 dark:bg-card/95 rounded-[32px]">
                <CardHeader className="pb-3 border-b border-glass-border/30">
                  <CardTitle className="text-xs font-black uppercase tracking-wider flex items-center gap-2.5 text-foreground">
                    <div className="h-7 w-7 rounded-full bg-[#0e9f6e]/10 text-[#0e9f6e] flex items-center justify-center">
                      <HelpCircle size={14} className="stroke-[2.5]" />
                    </div>
                    <span>How it works</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-5 text-xs text-muted-foreground leading-relaxed">
                  
                  <div className="flex gap-3">
                    <div className="h-5 w-5 rounded-full bg-emerald-500/10 text-[#0e9f6e] font-bold flex items-center justify-center flex-shrink-0 text-[10px]">
                      1
                    </div>
                    <div>
                      <h5 className="font-bold text-foreground">Initiate & Copy</h5>
                      <p className="mt-0.5 text-[11px]">Copy the exact USDT amount and deposit address shown, or scan the QR code.</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="h-5 w-5 rounded-full bg-emerald-500/10 text-[#0e9f6e] font-bold flex items-center justify-center flex-shrink-0 text-[10px]">
                      2
                    </div>
                    <div>
                      <h5 className="font-bold text-foreground">Send Crypto</h5>
                      <p className="mt-0.5 text-[11px]">Pay from your crypto wallet app. Make sure to choose **BSC / BEP20** as the transaction network.</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="h-5 w-5 rounded-full bg-emerald-500/10 text-[#0e9f6e] font-bold flex items-center justify-center flex-shrink-0 text-[10px]">
                      3
                    </div>
                    <div>
                      <h5 className="font-bold text-foreground">Confirmations</h5>
                      <p className="mt-0.5 text-[11px]">The blockchain requires 3 network confirmations to authorize. This usually takes 1 to 5 minutes.</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="h-5 w-5 rounded-full bg-emerald-500/10 text-[#0e9f6e] font-bold flex items-center justify-center flex-shrink-0 text-[10px]">
                      4
                    </div>
                    <div>
                      <h5 className="font-bold text-foreground">Auto-Credit</h5>
                      <p className="mt-0.5 text-[11px]">The checkout page polls the blockchain. Once verified, your wallet credits automatically.</p>
                    </div>
                  </div>

                </CardContent>
              </Card>

              {/* Security Policy */}
              <Card className="border-glass-border shadow-soft bg-glass-surface rounded-[24px]">
                <CardContent className="p-4 text-[10.5px] text-muted-foreground leading-relaxed space-y-2">
                  <p className="font-bold text-foreground flex items-center gap-1.5">
                    <Shield size={12} className="text-[#10b981]" />
                    Secure Checkout Guarantee
                  </p>
                  <p>
                    SkyRise checkout operates directly with decentralized smart contract APIs to hide payment processor tags and avoid account lockouts. Your transaction is 100% encrypted, private, and automatic.
                  </p>
                </CardContent>
              </Card>

            </div>

          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
