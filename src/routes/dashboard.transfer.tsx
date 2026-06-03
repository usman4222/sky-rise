import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

import { financeApi } from "@/lib/api-finance";
import { getFirebaseErrorMessage } from "@/lib/firebase-errors";

export const Route = createFileRoute("/dashboard/transfer")({ component: TransferPage });

function TransferPage() {
  const queryClient = useQueryClient();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");

  const { data: history = [] } = useQuery({
    queryKey: ["ledgerHistory", "transfer"],
    queryFn: async () => {
      const res = await financeApi.getLedgerHistory();
      return (res.history || []).filter((h: any) => h.category === "transfer_sent" || h.category === "transfer_received");
    }
  });

  const transferMutation = useMutation({
    mutationFn: () => financeApi.transferTeamBonus({ recipientIdOrCode: recipient, amount: Number(amount) }),
    onSuccess: () => {
      toast.success("Bonus transferred successfully!");
      setRecipient("");
      setAmount("");
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      queryClient.invalidateQueries({ queryKey: ["ledgerHistory"] });
    },
    onError: (err) => toast.error(getFirebaseErrorMessage(err))
  });

  return (
    <DashboardLayout title="Transfer Bonus">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-soft shadow-card">
          <CardHeader><CardTitle>Transfer Bonus</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Receiver Referral Code or User ID</Label>
                <Input placeholder="SKY-XXXXX" value={recipient} onChange={(e) => setRecipient(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Amount (USD)</Label>
                <Input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <Button 
                className="w-full bg-primary-gradient text-primary-foreground"
                onClick={() => transferMutation.mutate()}
                disabled={transferMutation.isPending || !recipient || !amount}
              >
                {transferMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Send Transfer"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-soft shadow-card bg-gold/10 border-gold/30">
          <CardHeader><CardTitle>Transfer Rules</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Transfer allowed only within 5-level downline team.</p>
            <p>• Bonus balance cannot be withdrawn directly.</p>
            <p>• Received transfer balance can cover up to 10% of investment costs.</p>
            <p>• Sent from your "Bonus Transferable" wallet.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 border-soft shadow-card">
        <CardHeader><CardTitle>Transfer History</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Description</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {history.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No transfer history found.</TableCell></TableRow>
              ) : history.map((h: any) => (
                <TableRow key={h._id}>
                  <TableCell>{new Date(h.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={h.type === "credit" ? "bg-emerald-500/10 text-emerald-500 border-0" : "bg-gold/15 text-gold border-0"}>
                      {h.type === "credit" ? "Received" : "Sent"}
                    </Badge>
                  </TableCell>
                  <TableCell className={`font-semibold ${h.type === "credit" ? "text-emerald-500" : "text-destructive"}`}>
                    {h.type === "credit" ? "+" : "-"}${h.amount}
                  </TableCell>
                  <TableCell className="text-xs">{h.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
