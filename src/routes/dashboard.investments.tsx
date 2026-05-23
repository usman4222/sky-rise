import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/dashboard/investments")({ component: Investments });

const rows = [
  { pkg: "Premium Share Investment", amt: 1250, roi: "1.2%", start: "2025-04-15", next: "In 4 days", auto: true, earned: 285.4, status: "Active" },
  { pkg: "Growth Share Investment", amt: 250, roi: "1.6%", start: "2025-02-02", next: "Maxed", auto: false, earned: 142.8, status: "Active" },
  { pkg: "Starter Share Investment", amt: 50, roi: "1.5%", start: "2024-11-10", next: "Maxed", auto: false, earned: 28.5, status: "Closed" },
];

function Investments() {
  return (
    <DashboardLayout title="My Investments">
      <Card className="border-soft shadow-card">
        <CardHeader><CardTitle>Active & Past Investments</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Package</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Current ROI</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>Next ROI Increase</TableHead>
                <TableHead>Auto Reinvest</TableHead>
                <TableHead>Total Earned</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{r.pkg}</TableCell>
                  <TableCell>${r.amt}</TableCell>
                  <TableCell className="text-profit font-semibold">{r.roi}</TableCell>
                  <TableCell>{r.start}</TableCell>
                  <TableCell>{r.next}</TableCell>
                  <TableCell><Switch defaultChecked={r.auto} /></TableCell>
                  <TableCell className="text-profit font-semibold">${r.earned}</TableCell>
                  <TableCell>
                    <Badge className={r.status === "Active" ? "bg-profit/10 text-profit border-0" : "bg-muted text-muted-foreground border-0"}>{r.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline">Withdraw Capital</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Withdraw Capital?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Early capital withdrawal may deduct 15% from capital and remove previous ROI profits. Please review conditions before confirming.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction className="bg-destructive text-destructive-foreground">Confirm Withdraw</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
