import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Mail, MessageCircle, FileQuestion, Loader2, Clock, CheckCircle, AlertCircle, Send, MessageSquare, RotateCw } from "lucide-react";
import { supportApi } from "@/lib/api-support";
import { useAuthStore } from "@/store/authStore";

export const Route = createFileRoute("/dashboard/support")({ component: SupportPage });

function SupportPage() {
  const queryClient = useQueryClient();
  const { user: authUser } = useAuthStore();
  const isAdmin = authUser?.roles?.includes("ADMIN") || authUser?.roles?.includes("SUPER_ADMIN");

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  
  // Detailed view modal state
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [replyMessage, setReplyMessage] = useState("");

  const { data: ticketsData, isLoading: loadingTickets, refetch: refetchTickets, isFetching } = useQuery({
    queryKey: ["supportTickets"],
    queryFn: () => supportApi.getTickets(),
    refetchOnWindowFocus: false,
    refetchInterval: 5000, // Poll every 5 seconds for a real-time live support experience!
  });

  const submitMutation = useMutation({
    mutationFn: (data: { subject: string; message: string }) => supportApi.submitTicket(data),
    onSuccess: () => {
      toast.success("Support ticket submitted! We'll reply shortly.");
      setSubject("");
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["supportTickets"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to submit support ticket");
    }
  });

  const replyMutation = useMutation({
    mutationFn: (vars: { ticketId: string; message: string }) => 
      supportApi.replyTicket(vars.ticketId, { message: vars.message }),
    onSuccess: (res) => {
      toast.success("Reply sent successfully.");
      setReplyMessage("");
      // Update selected ticket so thread updates immediately in detail modal
      setSelectedTicket(res.ticket);
      queryClient.invalidateQueries({ queryKey: ["supportTickets"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to submit reply");
    }
  });

  const statusMutation = useMutation({
    mutationFn: (vars: { ticketId: string; status: string }) => 
      supportApi.updateTicketStatus(vars.ticketId, { status: vars.status }),
    onSuccess: (res) => {
      toast.success(`Ticket marked as ${res.ticket.status}.`);
      setSelectedTicket(res.ticket);
      queryClient.invalidateQueries({ queryKey: ["supportTickets"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update status");
    }
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error("Subject and message are required.");
      return;
    }
    submitMutation.mutate({ subject, message });
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedTicket) return;
    replyMutation.mutate({
      ticketId: selectedTicket._id,
      message: replyMessage
    });
  };

  const tickets = ticketsData?.tickets || [];

  // Sync selected ticket replies automatically when query polls in the background
  useEffect(() => {
    if (selectedTicket) {
      const freshTicket = tickets.find((t: any) => t._id === selectedTicket._id);
      if (freshTicket && JSON.stringify(freshTicket.replies) !== JSON.stringify(selectedTicket.replies)) {
        setSelectedTicket(freshTicket);
      }
    }
  }, [tickets, selectedTicket]);

  return (
    <DashboardLayout title={isAdmin ? "Support Ticket Center (Admin)" : "Support"}>
      <div className="grid gap-6 lg:grid-cols-3">
        {/* User Submission Form - Hidden for Admin unless they want to submit a ticket */}
        <Card className="border-soft shadow-card lg:col-span-2">
          <CardHeader>
            <CardTitle>{isAdmin ? "Submit Internal Support Ticket" : "Contact Support"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Subject</Label>
                <Input 
                  placeholder="How can we help?" 
                  value={subject} 
                  onChange={(e) => setSubject(e.target.value)} 
                  disabled={submitMutation.isPending}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Message</Label>
                <Textarea 
                  rows={6} 
                  placeholder="Describe your issue in detail…" 
                  value={message} 
                  onChange={(e) => setMessage(e.target.value)} 
                  disabled={submitMutation.isPending}
                />
              </div>
              <Button 
                type="submit" 
                className="bg-primary-gradient text-primary-foreground"
                disabled={submitMutation.isPending || !subject.trim() || !message.trim()}
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Send Message"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {[
            { icon: Mail, t: "Email Us", d: "support@skyrisefuture.com" },
            { icon: MessageCircle, t: "Live Chat", d: "Available 24 / 7" },
            { icon: FileQuestion, t: "Help Center", d: "Browse our FAQ" },
          ].map((c) => (
            <Card key={c.t} className="border-soft shadow-card">
              <CardContent className="p-5 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <c.icon size={18} />
                </div>
                <div>
                  <div className="font-semibold text-sm">{c.t}</div>
                  <div className="text-xs text-muted-foreground">{c.d}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card className="mt-6 border-soft shadow-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            {isAdmin ? "Global Support Tickets Queue" : "Your Past Support Tickets"}
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetchTickets()} 
            disabled={isFetching}
            className="gap-1.5 h-8 text-xs font-semibold"
          >
            <RotateCw className={`h-3 w-3 ${isFetching ? "animate-spin" : ""}`} />
            Refresh Queue
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loadingTickets ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Created</TableHead>
                  {isAdmin && <TableHead>Sender</TableHead>}
                  <TableHead>Subject</TableHead>
                  <TableHead>Message Preview</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 6 : 5} className="text-center py-6 text-muted-foreground text-sm">
                      No support tickets found in queue.
                    </TableCell>
                  </TableRow>
                ) : (
                  tickets.map((t: any) => {
                    const senderName = typeof t.user === "object" ? t.user?.name : "User";
                    const senderEmail = typeof t.user === "object" ? t.user?.email : "";
                    return (
                      <TableRow key={t._id}>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(t.createdAt).toLocaleDateString()}<br />
                          {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </TableCell>
                        {isAdmin && (
                          <TableCell className="text-xs">
                            <span className="font-medium text-foreground">{senderName}</span>
                            {senderEmail && <div className="text-[10px] text-muted-foreground">{senderEmail}</div>}
                          </TableCell>
                        )}
                        <TableCell className="font-semibold text-foreground text-sm">
                          {t.subject}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-sm truncate">
                          {t.message}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={
                              t.status === "open" 
                                ? "bg-gold/15 text-gold border-0" 
                                : t.status === "answered" 
                                  ? "bg-profit/10 text-profit border-0" 
                                  : "bg-muted text-muted-foreground border-0"
                            }
                          >
                            {t.status === "open" && <Clock className="h-3 w-3 mr-1" />}
                            {t.status === "answered" && <CheckCircle className="h-3 w-3 mr-1" />}
                            {t.status === "closed" && <AlertCircle className="h-3 w-3 mr-1" />}
                            <span className="capitalize">{t.status}</span>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setSelectedTicket(t)}
                            className="gap-1.5"
                          >
                            <MessageSquare size={13} />
                            View Chat
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Support Chat / Ticket Detail Modal */}
      {selectedTicket && (
        <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-6">
            <DialogHeader className="border-b border-soft pb-3 flex-shrink-0">
              <div className="flex items-center justify-between gap-4">
                <DialogTitle className="text-lg font-bold truncate flex-1">
                  {selectedTicket.subject}
                </DialogTitle>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-full flex items-center justify-center" 
                    onClick={() => refetchTickets()}
                    disabled={isFetching}
                    title="Sync Replies"
                  >
                    <RotateCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
                  </Button>
                  <Badge 
                    className={
                      selectedTicket.status === "open" 
                        ? "bg-gold/15 text-gold border-0 capitalize" 
                        : selectedTicket.status === "answered" 
                          ? "bg-profit/10 text-profit border-0 capitalize" 
                          : "bg-muted text-muted-foreground border-0 capitalize"
                    }
                  >
                    {selectedTicket.status}
                  </Badge>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1 flex items-center justify-between">
                <span>Ticket ID: {selectedTicket._id} • Created {new Date(selectedTicket.createdAt).toLocaleString()}</span>
                {isFetching && <span className="text-[10px] text-primary animate-pulse font-medium">Syncing...</span>}
              </p>
            </DialogHeader>

            {/* Scrollable Chat Area */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 min-h-[250px]">
              {/* Original User Message */}
              <div className="flex items-start gap-2.5 max-w-[85%]">
                <div className="rounded-2xl bg-secondary p-4 text-sm text-foreground">
                  <div className="font-semibold text-xs text-muted-foreground mb-1">
                    {typeof selectedTicket.user === "object" ? selectedTicket.user?.name : "User Description"} (Original Message)
                  </div>
                  <p className="whitespace-pre-wrap">{selectedTicket.message}</p>
                </div>
              </div>

              {/* Replies Thread */}
              {selectedTicket.replies?.map((reply: any, idx: number) => {
                const isReplyFromMe = reply.sender === authUser?.id;
                // If it is sent by admin and logged in user is admin, or vice-versa
                const isAdminReply = reply.sender !== selectedTicket.user?._id && reply.sender !== selectedTicket.user;

                return (
                  <div 
                    key={idx} 
                    className={`flex items-start gap-2.5 max-w-[85%] ${
                      isReplyFromMe ? "ml-auto justify-end" : ""
                    }`}
                  >
                    <div 
                      className={`rounded-2xl p-4 text-sm ${
                        isReplyFromMe 
                          ? "bg-primary text-white" 
                          : isAdminReply
                            ? "bg-amber-500/10 text-foreground border border-amber-500/20"
                            : "bg-secondary text-foreground"
                      }`}
                    >
                      <div 
                        className={`font-semibold text-[10px] mb-1 ${
                          isReplyFromMe 
                            ? "text-white/80" 
                            : "text-muted-foreground"
                        }`}
                      >
                        {isAdminReply ? "🛡️ Support Representative" : "Customer Reply"} • {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <p className="whitespace-pre-wrap">{reply.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action Bar (Send reply, Toggle Status) */}
            <div className="border-t border-soft pt-4 flex-shrink-0">
              <form onSubmit={handleSendReply} className="flex gap-2">
                <Input 
                  placeholder="Type your support message..." 
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  disabled={replyMutation.isPending || selectedTicket.status === "closed"}
                />
                <Button 
                  type="submit" 
                  size="icon"
                  className="bg-primary-gradient text-primary-foreground flex-shrink-0"
                  disabled={replyMutation.isPending || !replyMessage.trim() || selectedTicket.status === "closed"}
                >
                  {replyMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send size={15} />
                  )}
                </Button>
              </form>
              
              <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
                <span>
                  {selectedTicket.status === "closed" 
                    ? "This support ticket is closed and read-only."
                    : "Need to change ticket status?"}
                </span>
                
                {selectedTicket.status !== "closed" && (
                  <div className="flex gap-2">
                    {isAdmin && selectedTicket.status !== "answered" && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => statusMutation.mutate({ ticketId: selectedTicket._id, status: "answered" })}
                        disabled={statusMutation.isPending}
                        className="text-[10px] px-2 py-1 h-auto"
                      >
                        Mark Answered
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => statusMutation.mutate({ ticketId: selectedTicket._id, status: "closed" })}
                      disabled={statusMutation.isPending}
                      className="text-[10px] border-destructive/25 text-destructive hover:bg-destructive/10 px-2 py-1 h-auto"
                    >
                      Close Ticket
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
}
