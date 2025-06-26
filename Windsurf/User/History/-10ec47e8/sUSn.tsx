import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn, Users, Calendar, Clock, Search, Download, Edit, History, Trash2, UserPlus } from "lucide-react";
import { insertEntrySchema, type InsertEntry } from "@shared/schema";
import { useRecentEntries, useCreateEntry, useDashboardStats, useDeleteEntry } from "@/hooks/use-entries";
import type { EntryWithMember, DashboardStats } from "@/types";
import { useMembers } from "@/hooks/use-members";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import AddMemberModal from "@/components/modals/add-member-modal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { EntryWithMember } from "@/types";

export default function Dashboard() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const deleteEntry = useDeleteEntry();

  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: recentEntries, isLoading: entriesLoading } = useRecentEntries(20);
  const { data: members, isLoading: membersLoading } = useMembers();
  
  // Type assertions for the data
  const dashboardStats = stats as DashboardStats | undefined;
  const entries = (recentEntries || []) as EntryWithMember[];
  const createEntry = useCreateEntry();

  const form = useForm<InsertEntry>({
    resolver: zodResolver(insertEntrySchema),
    defaultValues: {
      memberId: 0,
      action: "entry",
      purpose: "",
      notes: "",
    },
  });

  const onSubmit = async (data: InsertEntry) => {
    try {
      await createEntry.mutateAsync(data);
      toast({
        title: "Success",
        description: "Entry recorded successfully!",
      });
      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record entry. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatTime = (timestamp: string | Date) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const filteredEntries = entries.filter((entry) =>
    entry.member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.member.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleDeleteClick = (entryId: number) => {
    setEntryToDelete(entryId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!entryToDelete) return;
    
    try {
      await deleteEntry.mutateAsync(entryToDelete);
      toast({
        title: "Success",
        description: "Entry deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete entry. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setEntryToDelete(null);
    }
  };

  const cancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setEntryToDelete(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Dashboard Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Facility Dashboard</h1>
          <p className="text-gray-600">Monitor real-time facility usage and member activity</p>
        </div>
        <Button 
          onClick={() => setAddMemberModalOpen(true)}
          className="bg-green-600 hover:bg-green-700"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Register New Member
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <LogIn className="text-green-600 h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Current Entries</p>
                {statsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold text-gray-900">{dashboardStats?.currentEntries || 0}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="text-blue-600 h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Members</p>
                {statsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold text-gray-900">{dashboardStats?.totalMembers || 0}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-lime-100 rounded-lg">
                <Calendar className="text-lime-600 h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Today's Visits</p>
                {statsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold text-gray-900">{stats?.todayVisits || 0}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="text-orange-600 h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg. Duration</p>
                {statsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold text-gray-900">{stats?.averageDuration || "N/A"}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Entry Tracking Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Quick Entry/Exit</CardTitle>
        </CardHeader>
        <CardContent>
          {!membersData?.members?.length ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <UserPlus className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Members Registered</h3>
              <p className="text-gray-600 mb-4">Register your first member to start tracking entries and exits</p>
              <Button 
                onClick={() => setAddMemberModalOpen(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Register First Member
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid md:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="memberId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Member</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Member" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {membersData?.members?.map((member: any) => (
                            <SelectItem key={member.id} value={member.id.toString()}>
                              {member.name} ({member.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="action"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Action</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="entry">Entry</SelectItem>
                          <SelectItem value="exit">Exit</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="purpose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purpose</FormLabel>
                      <Select onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Purpose" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Training Session">Training Session</SelectItem>
                          <SelectItem value="Match/Game">Match/Game</SelectItem>
                          <SelectItem value="Maintenance">Maintenance</SelectItem>
                          <SelectItem value="Event">Event</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-end">
                  <Button 
                    type="submit" 
                    disabled={createEntry.isPending}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {createEntry.isPending ? "Recording..." : "Record Entry"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <CardTitle>Recent Activities</CardTitle>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search entries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" className="bg-blue-50 hover:bg-blue-100">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {entriesLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-sm font-semibold mr-3">
                          {entry.member.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="font-medium">{entry.member.name}</div>
                          <div className="text-sm text-gray-500">{entry.member.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600">{entry.member.phone}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={entry.action === 'entry' ? 'default' : 'destructive'}
                        className={entry.action === 'entry' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                      >
                        {entry.action === 'entry' ? '↓ Entry' : '↑ Exit'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-600">{formatTime(entry.timestamp)}</TableCell>
                    <TableCell className="text-gray-600">{entry.purpose || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit entry"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-gray-600 hover:text-gray-800"
                          title="View history"
                        >
                          <History className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-red-600 hover:text-red-800"
                          onClick={() => handleDeleteClick(entry.id)}
                          disabled={deleteEntry.isPending}
                          title="Delete entry"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AddMemberModal
        open={addMemberModalOpen}
        onOpenChange={setAddMemberModalOpen}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the entry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete} disabled={deleteEntry.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteEntry.isPending}
            >
              {deleteEntry.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the entry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete} disabled={deleteEntry.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteEntry.isPending}
            >
              {deleteEntry.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
