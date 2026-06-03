import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

import { investmentsApi } from "@/lib/api-investments";
import { getFirebaseErrorMessage } from "@/lib/firebase-errors";

export const Route = createFileRoute("/dashboard/investments")({ component: Investments });

function Investments() {
  const queryClient = useQueryClient();

  const { data: investments = [], isLoading } = useQuery({
    queryKey: ["myInvestments"],
    queryFn: async () => {
      const res = await investmentsApi.getMyInvestments();
      return res.investments || [];
    }
  });

  const withdrawCapitalMutation = useMutation({
    mutationFn: (id: string) => investmentsApi.withdrawCapital({ investmentId: id }),
    onSuccess: () => {
      toast.success("Capital withdrawal submitted successfully. Funds moved to withdrawal wallet.");
      queryClient.invalidateQueries({ queryKey: ["myInvestments"] });
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
    },
    onError: (err) => toast.error(getFirebaseErrorMessage(err))
  });

  return (
    <DashboardLayout title="My Investments">
      <Card className="border-soft shadow-card">
        <CardHeader><CardTitle>Active & Past Investments</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Package</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Current ROI</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Total Earned</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {investments.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">No active investments found.</TableCell></TableRow>
                ) : investments.map((inv: any) => (
                  <TableRow key={inv._id}>
                    <TableCell className="font-medium">{inv.package?.name || "Unknown Package"}</TableCell>
                    <TableCell>${inv.amount}</TableCell>
                    <TableCell className="text-profit font-semibold">{inv.currentRoi}%</TableCell>
                    <TableCell>{new Date(inv.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-profit font-semibold">${inv.totalRoiEarned || 0}</TableCell>
                    <TableCell>
                      <Badge className={inv.status === "active" ? "bg-profit/10 text-profit border-0" : "bg-muted text-muted-foreground border-0 capitalize"}>
                        {inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {inv.status === "active" ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline" disabled={withdrawCapitalMutation.isPending}>
                              Withdraw Capital
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Withdraw Capital Early?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Withdrawing your capital early may incur a 15% penalty fee and pause all future ROI earnings. 
                                Are you sure you wish to proceed?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => withdrawCapitalMutation.mutate(inv._id)}
                              >
                                Confirm Withdrawal
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : (
                        <span className="text-xs text-muted-foreground">None</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
