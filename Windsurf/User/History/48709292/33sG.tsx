//@ts-nocheck
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { VoiceSearch } from "@/components/ui/voice-search";
import { SearchInput } from "@/components/ui/search-input";
import { useAuth } from "@/hooks/use-auth";
import { 
  useInventory, 
  useInventorySearch, 
  useCreateInventoryItem, 
  useUpdateInventoryItem, 
  useDeleteInventoryItem,
  useTransactions,
  useAnalyticsStats,
  useExportInventory
} from "@/hooks/use-inventory";
import { api } from "@/lib/api";
import { InventoryItem } from "@shared/schema";
import { 
  Search, 
  Plus, 
  Edit, 
  BarChart3, 
  Trash2, 
  Package, 
  Download, 
  Users, 
  LogOut, 
  Menu,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

type SectionType = "search" | "add" | "update" | "quantity" | "delete" | "inventory" | "analytics" | "users";

export default function InventoryApp() {
  const { user, isAdmin, logout } = useAuth();
  const { toast } = useToast();
  
  const [currentSection, setCurrentSection] = useState<SectionType>("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [voiceStatus, setVoiceStatus] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Queries
  const { data: inventory = [], isLoading: inventoryLoading, refetch: refetchInventory } = useInventory();
  const { data: searchResults = [] } = useInventorySearch(searchQuery);
  const { data: transactions = [] } = useTransactions({ limit: 50 });
  const { data: stats } = useAnalyticsStats();

  // Mutations
  const createItem = useCreateInventoryItem();
  const updateItem = useUpdateInventoryItem();
  const deleteItem = useDeleteInventoryItem();
  const exportInventory = useExportInventory();

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Results are automatically updated via useInventorySearch
      const results = (searchResults as InventoryItem[]) || [];
      toast({
        title: "Search completed",
        description: `Found ${results.length} items`,
      });
    }
  };

  const handleVoiceResult = (transcript: string) => {
    setSearchQuery(transcript);
    // Trigger search automatically
    setTimeout(handleSearch, 100);
  };

  const handleExport = async () => {
    try {
      await exportInventory.mutateAsync();
      toast({
        title: "Export successful",
        description: "Inventory has been exported to CSV",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export inventory",
        variant: "destructive",
      });
    }
  };

  const showSection = (section: SectionType) => {
    setCurrentSection(section);
    setIsMenuOpen(false);
  };

  const MenuButton = ({ 
    section, 
    icon: Icon, 
    children, 
    adminOnly = false 
  }: { 
    section: SectionType; 
    icon: any; 
    children: React.ReactNode; 
    adminOnly?: boolean;
  }) => {
    if (adminOnly && !isAdmin) return null;
    
    return (
      <Button
        variant="ghost"
        className="w-full justify-start text-white hover:bg-gray-700"
        onClick={() => showSection(section)}
      >
        <Icon className="mr-3 h-4 w-4" />
        {children}
      </Button>
    );
  };

  if (!user) {
    return null; // This should be handled by the auth system
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="primary-green text-white shadow-lg">
        <div className="flex justify-between items-center px-4 py-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold flex items-center">
              <Package className="mr-2 h-6 w-6" />
              Inventory Manager
            </h1>
            <div className="text-sm opacity-90">
              {user.username} ({user.role})
            </div>
          </div>
          
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="text-white hover:bg-primary-600">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-gray-800 text-white border-gray-700">
              <div className="flex flex-col space-y-2 mt-6">
                <MenuButton section="search" icon={Search}>Search Items</MenuButton>
                <MenuButton section="add" icon={Plus} adminOnly>Add Item</MenuButton>
                <MenuButton section="update" icon={Edit}>Update Item</MenuButton>
                <MenuButton section="quantity" icon={BarChart3} adminOnly>Manage Quantity</MenuButton>
                <MenuButton section="delete" icon={Trash2} adminOnly>Delete Item</MenuButton>
                <MenuButton section="inventory" icon={Package}>View Inventory</MenuButton>
                <MenuButton section="analytics" icon={BarChart3} adminOnly>Analytics</MenuButton>
                <MenuButton section="users" icon={Users} adminOnly>User Management</MenuButton>
                
                <Button
                  variant="ghost"
                  className="w-full justify-start text-white hover:bg-gray-700"
                  onClick={handleExport}
                  disabled={exportInventory.isPending}
                >
                  <Download className="mr-3 h-4 w-4" />
                  Export CSV
                </Button>
                
                <div className="border-t border-gray-700 mt-4 pt-4">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-white hover:bg-red-700 bg-red-600"
                    onClick={logout}
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    Logout
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 lg:p-6">
        {/* Search Section */}
        {currentSection === "search" && (
          <SearchSection 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchResults={searchResults}
            onSearch={handleSearch}
            onVoiceResult={handleVoiceResult}
            voiceStatus={voiceStatus}
            setVoiceStatus={setVoiceStatus}
          />
        )}

        {/* Add Item Section */}
        {currentSection === "add" && isAdmin && (
          <AddItemSection 
            createItem={createItem}
            onBack={() => showSection("search")}
          />
        )}

        {/* Update Item Section */}
        {currentSection === "update" && (
          <UpdateItemSection 
            inventory={inventory}
            updateItem={updateItem}
            isAdmin={isAdmin}
            onBack={() => showSection("search")}
          />
        )}

        {/* Quantity Management Section */}
        {currentSection === "quantity" && isAdmin && (
          <QuantitySection 
            inventory={inventory}
            updateItem={updateItem}
            onBack={() => showSection("search")}
          />
        )}

        {/* Delete Item Section */}
        {currentSection === "delete" && isAdmin && (
          <DeleteItemSection 
            inventory={inventory}
            deleteItem={deleteItem}
            onBack={() => showSection("search")}
          />
        )}

        {/* Inventory List Section */}
        {currentSection === "inventory" && (
          <InventorySection 
            inventory={inventory} 
            inventoryLoading={inventoryLoading} 
            refetchInventory={refetchInventory} 
            isAdmin={isAdmin} 
            onBack={() => showSection('search')}
            onEditItem={(item: InventoryItem) => {
              // Navigate to update section with the item's data
              showSection('update');
              // In a real implementation, you would pass the item data to the update form
              toast({
                title: "Edit Item",
                description: `Editing item: ${item.name}`,
              });
            }}
          />
        )}

        {/* Analytics Section */}
        {currentSection === "analytics" && isAdmin && (
          <AnalyticsSection 
            stats={stats}
            transactions={transactions}
            onBack={() => showSection("search")}
          />
        )}

        {/* User Management Section */}
        {currentSection === "users" && isAdmin && (
          <UserManagementSection 
            onBack={() => showSection("search")}
          />
        )}
      </main>
    </div>
  );
}

// Section Components
function SearchSection({ 
  searchQuery, 
  setSearchQuery, 
  searchResults, 
  onSearch, 
  onVoiceResult, 
  voiceStatus, 
  setVoiceStatus 
}: any) {
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  
  const handleItemSelect = (item: InventoryItem) => {
    setSelectedItem(item);
    setSearchQuery(item.name);
  };

  const displayResults = selectedItem ? [selectedItem] : (searchResults || []) as InventoryItem[];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Search className="mr-3 h-6 w-6" />
          Search Inventory
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <SearchInput
          value={searchQuery}
          onChange={(value) => {
            setSearchQuery(value);
            if (!value) setSelectedItem(null);
          }}
          onSelect={handleItemSelect}
          placeholder="Search for items... (type any letter to see suggestions)"
          minSearchLength={1}
        />
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={onSearch} className="flex-1 primary-green">
            Search All Items
          </Button>
          <VoiceSearch 
            onResult={onVoiceResult}
            onStatusChange={setVoiceStatus}
            className="flex-1"
          />
        </div>
        
        {voiceStatus && (
          <div className="text-center text-sm text-gray-600">
            {voiceStatus}
          </div>
        )}
        
        <div className="space-y-4">
          {displayResults.map((item: InventoryItem) => (
            <Card key={item._id || item.id} className="bg-gray-50">
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg text-gray-800">{item.name}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-sm text-gray-600">
                  <div><span className="font-medium">Make:</span> {item.make || 'N/A'}</div>
                  <div><span className="font-medium">Model:</span> {item.model || 'N/A'}</div>
                  <div><span className="font-medium">Available:</span> {item.quantity}</div>
                  <div><span className="font-medium">Location:</span> {item.rack || 'N/A'} / {item.bin || 'N/A'}</div>
                </div>
                {item.specification && (
                  <div className="mt-2 text-sm text-gray-600">
                    <span className="font-medium">Specification:</span> {item.specification}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          
          {searchQuery && displayResults.length === 0 && !selectedItem && (
            <p className="text-gray-500 text-center py-4">No items found</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function AddItemSection({ createItem, onBack }: any) {
  const [formData, setFormData] = useState({
    name: "",
    make: "",
    model: "",
    specification: "",
    rack: "",
    bin: "",
    quantity: ""
  });
  const { toast } = useToast();

  const handleItemSelect = (item: InventoryItem) => {
    setFormData(prev => ({
      ...prev,
      name: item.name,
      make: item.make || "",
      model: item.model || "",
      specification: item.specification || "",
      rack: item.rack || "",
      bin: item.bin || ""
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.quantity) {
      toast({
        title: "Validation Error",
        description: "Name and quantity are required",
        variant: "destructive",
      });
      return;
    }

    try {
      await createItem.mutateAsync({
        ...formData,
        quantity: parseInt(formData.quantity)
      });
      
      toast({
        title: "Success",
        description: "Item added successfully",
      });
      
      setFormData({
        name: "",
        make: "",
        model: "",
        specification: "",
        rack: "",
        bin: "",
        quantity: ""
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add item",
        variant: "destructive",
      });
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Plus className="mr-3 h-6 w-6" />
          Add New Item
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Item Name * (type to see suggestions)</Label>
              <SearchInput
                value={formData.name}
                onChange={(value) => handleChange("name", value)}
                onSelect={handleItemSelect}
                placeholder="Enter item name (suggestions will appear as you type)"
                minSearchLength={1}
              />
            </div>
            <div>
              <Label htmlFor="make">Make</Label>
              <Input
                id="make"
                value={formData.make}
                onChange={(e) => handleChange("make", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => handleChange("model", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="specification">Specification</Label>
              <Input
                id="specification"
                value={formData.specification}
                onChange={(e) => handleChange("specification", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="rack">Rack</Label>
              <Input
                id="rack"
                value={formData.rack}
                onChange={(e) => handleChange("rack", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="bin">Bin</Label>
              <Input
                id="bin"
                value={formData.bin}
                onChange={(e) => handleChange("bin", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) => handleChange("quantity", e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <Button type="submit" disabled={createItem.isPending} className="primary-green">
              {createItem.isPending ? <LoadingSpinner className="mr-2" /> : null}
              Add Item
            </Button>
            <Button type="button" variant="outline" onClick={onBack}>
              Back
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function UpdateItemSection({ inventory, updateItem, isAdmin, onBack }: any) {
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [quantityTaken, setQuantityTaken] = useState("");
  const [availableQuantity, setAvailableQuantity] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const handleItemSelect = (item: InventoryItem) => {
    setSelectedItem(item);
    setSearchTerm(item.name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedItem) {
      toast({
        title: "Validation Error",
        description: "Please select an item",
        variant: "destructive",
      });
      return;
    }

    const updateData: any = {};
    
    if (quantityTaken) {
      const taken = parseInt(quantityTaken);
      if (taken > selectedItem.quantity) {
        toast({
          title: "Validation Error",
          description: "Not enough items in stock",
          variant: "destructive",
        });
        return;
      }
      updateData.quantityTaken = taken;
    }
    
    if (availableQuantity && isAdmin) {
      updateData.availableQuantity = parseInt(availableQuantity);
    }

    if (!updateData.quantityTaken && !updateData.availableQuantity) {
      toast({
        title: "Validation Error",
        description: "Please specify quantity to take or available quantity",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateItem.mutateAsync({
        itemId: selectedItem.id,
        updateData
      });
      
      toast({
        title: "Success",
        description: "Item updated successfully",
      });
      
      setSelectedItem(null);
      setQuantityTaken("");
      setAvailableQuantity("");
      setSearchTerm("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update item",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Edit className="mr-3 h-6 w-6" />
          Update Item
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="itemSearch">Select Item (type to see suggestions)</Label>
            <SearchInput
              value={searchTerm}
              onChange={(value) => {
                setSearchTerm(value);
                if (!value) setSelectedItem(null);
              }}
              onSelect={handleItemSelect}
              placeholder="Search and select item to update..."
              minSearchLength={1}
            />
          </div>
          
          {selectedItem && (
            <>
              <Card className="bg-gray-50">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-700 mb-2">Current Item Information</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div><span className="font-medium">Available:</span> {selectedItem.quantity}</div>
                    <div><span className="font-medium">Rack:</span> {selectedItem.rack || 'N/A'}</div>
                    <div><span className="font-medium">Bin:</span> {selectedItem.bin || 'N/A'}</div>
                    <div><span className="font-medium">Make:</span> {selectedItem.make || 'N/A'}</div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-blue-50">
                  <CardContent className="p-4">
                    <Label htmlFor="quantityTaken" className="text-blue-700 font-medium">
                      Quantity Taken
                    </Label>
                    <Input
                      id="quantityTaken"
                      type="number"
                      min="0"
                      max={selectedItem.quantity}
                      value={quantityTaken}
                      onChange={(e) => setQuantityTaken(e.target.value)}
                      className="mt-2 border-blue-300 focus:ring-blue-500"
                    />
                    <p className="text-xs text-blue-600 mt-1">Amount removed from inventory</p>
                  </CardContent>
                </Card>
                
                {isAdmin && (
                  <Card className="bg-red-50">
                    <CardContent className="p-4">
                      <Label htmlFor="availableQuantity" className="text-red-700 font-medium">
                        Set Available Quantity (Admin)
                      </Label>
                      <Input
                        id="availableQuantity"
                        type="number"
                        min="0"
                        value={availableQuantity}
                        onChange={(e) => setAvailableQuantity(e.target.value)}
                        className="mt-2 border-red-300 focus:ring-red-500"
                      />
                      <p className="text-xs text-red-600 mt-1">Override current available quantity</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}
          
          <div className="flex gap-4">
            <Button type="submit" disabled={updateItem.isPending} className="primary-green">
              {updateItem.isPending ? <LoadingSpinner className="mr-2" /> : null}
              Update Item
            </Button>
            <Button type="button" variant="outline" onClick={onBack}>
              Back
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function QuantitySection({ inventory, updateItem, onBack }: any) {
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [addQuantity, setAddQuantity] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const handleItemSelect = (item: InventoryItem) => {
    setSelectedItem(item);
    setSearchTerm(item.name);
  };

  const newTotal = selectedItem && addQuantity 
    ? selectedItem.quantity + parseInt(addQuantity || "0")
    : selectedItem?.quantity || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedItem || !addQuantity) {
      toast({
        title: "Validation Error",
        description: "Please select an item and enter quantity to add",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateItem.mutateAsync({
        itemId: selectedItem.id,
        updateData: {
          availableQuantity: newTotal
        }
      });
      
      toast({
        title: "Success",
        description: "Quantity updated successfully",
      });
      
      setSelectedItem(null);
      setAddQuantity("");
      setSearchTerm("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update quantity",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BarChart3 className="mr-3 h-6 w-6" />
          Quantity Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="itemSearch">Select Item (type to see suggestions)</Label>
            <SearchInput
              value={searchTerm}
              onChange={(value) => {
                setSearchTerm(value);
                if (!value) setSelectedItem(null);
              }}
              onSelect={handleItemSelect}
              placeholder="Search and select item to update quantity..."
              minSearchLength={1}
            />
          </div>
          
          {selectedItem && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-blue-50 text-center">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-blue-700 mb-2">Current Quantity</h3>
                  <p className="text-2xl font-bold text-blue-600">{selectedItem.quantity}</p>
                </CardContent>
              </Card>
              
              <Card className="bg-green-50 text-center">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-green-700 mb-2">Add Quantity</h3>
                  <Input
                    type="number"
                    min="0"
                    value={addQuantity}
                    onChange={(e) => setAddQuantity(e.target.value)}
                    className="border-green-300 focus:ring-green-500 text-center text-lg font-bold"
                  />
                </CardContent>
              </Card>
              
              <Card className="bg-purple-50 text-center">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-purple-700 mb-2">New Total</h3>
                  <p className="text-2xl font-bold text-purple-600">{newTotal}</p>
                </CardContent>
              </Card>
            </div>
          )}
          
          <div className="flex gap-4">
            <Button type="submit" disabled={updateItem.isPending} className="primary-green">
              {updateItem.isPending ? <LoadingSpinner className="mr-2" /> : null}
              Update Quantity
            </Button>
            <Button type="button" variant="outline" onClick={onBack}>
              Back
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function DeleteItemSection({ inventory, deleteItem, onBack }: any) {
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const handleItemSelect = (item: InventoryItem) => {
    setSelectedItem(item);
    setSearchTerm(item.name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedItem) {
      toast({
        title: "Validation Error",
        description: "Please select an item to delete",
        variant: "destructive",
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete "${selectedItem.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteItem.mutateAsync(selectedItem.id);
      
      toast({
        title: "Success",
        description: "Item deleted successfully",
      });
      
      setSelectedItem(null);
      setSearchTerm("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete item",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Trash2 className="mr-3 h-6 w-6" />
          Delete Item
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Card className="bg-red-50 border-red-200 mb-6">
          <CardContent className="p-4">
            <p className="text-red-700 font-medium">⚠️ Warning: This action cannot be undone!</p>
          </CardContent>
        </Card>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="itemSearch">Select Item to Delete (type to see suggestions)</Label>
            <SearchInput
              value={searchTerm}
              onChange={(value) => {
                setSearchTerm(value);
                if (!value) setSelectedItem(null);
              }}
              onSelect={handleItemSelect}
              placeholder="Search and select item to delete..."
              minSearchLength={1}
              className="focus:ring-red-500"
            />
          </div>
          
          {selectedItem && (
            <Card className="bg-gray-50">
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-700 mb-3">Item to be deleted:</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div><span className="font-medium">Name:</span> {selectedItem.name}</div>
                  <div><span className="font-medium">Available:</span> {selectedItem.quantity}</div>
                  <div><span className="font-medium">Make:</span> {selectedItem.make || 'N/A'}</div>
                  <div><span className="font-medium">Location:</span> {selectedItem.rack || 'N/A'}/{selectedItem.bin || 'N/A'}</div>
                </div>
              </CardContent>
            </Card>
          )}
          
          <div className="flex gap-4">
            <Button type="submit" variant="destructive" disabled={deleteItem.isPending}>
              {deleteItem.isPending ? <LoadingSpinner className="mr-2" /> : null}
              Delete Item
            </Button>
            <Button type="button" variant="outline" onClick={onBack}>
              Back
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function InventorySection({ inventory, inventoryLoading, refetchInventory, isAdmin, onBack, showSection }: any) {
  const [filterTerm, setFilterTerm] = useState("");
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const exportInventory = useExportInventory();
  const deleteItem = useDeleteInventoryItem();
  const { toast } = useToast();
  
  const handleEdit = (item: InventoryItem) => {
    // Navigate to update section with the item's data
    showSection('update');
    // In a real implementation, you would pass the item data to the update form
    toast({
      title: "Edit Item",
      description: `Editing item: ${item.name}`,
    });
  };
  
  const handleDelete = (item: InventoryItem) => {
    setItemToDelete(item);
  };
  
  const confirmDelete = async () => {
    if (!itemToDelete) return;
    
    // Use either _id (MongoDB) or id (PostgreSQL)
    const itemId = (itemToDelete as any)._id || itemToDelete.id;
    
    if (!itemId) {
      toast({
        title: "Error",
        description: "Cannot delete item: Missing item ID",
        variant: "destructive",
      });
      setItemToDelete(null);
      return;
    }
    
    try {
      await deleteItem.mutateAsync(Number(itemId));
      toast({
        title: "Success",
        description: `${itemToDelete.name} has been deleted.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setItemToDelete(null);
    }
  };

  const filteredInventory = inventory.filter((item: InventoryItem) =>
    item.name.toLowerCase().includes(filterTerm.toLowerCase()) ||
    item.make?.toLowerCase().includes(filterTerm.toLowerCase()) ||
    item.model?.toLowerCase().includes(filterTerm.toLowerCase())
  );

  const handleExport = async () => {
    try {
      await exportInventory.mutateAsync();
      toast({
        title: "Export successful",
        description: "Inventory has been exported to CSV",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export inventory",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center">
            <Package className="mr-3 h-6 w-6" />
            Inventory List
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchInventory()}
              disabled={inventoryLoading}
            >
              <RefreshCw className={cn("h-4 w-4 mr-1", inventoryLoading && "animate-spin")} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={exportInventory.isPending}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <SearchInput
            value={filterTerm}
            onChange={(value) => setFilterTerm(value)}
            placeholder="Filter inventory (type to see suggestions)..."
            minSearchLength={0}
            showSuggestions={true}
          />
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="primary-green">
                <TableHead className="text-white">Item Name</TableHead>
                <TableHead className="text-white">Make</TableHead>
                <TableHead className="text-white">Model</TableHead>
                <TableHead className="text-white">Available</TableHead>
                <TableHead className="text-white">Location</TableHead>
                {isAdmin && <TableHead className="text-white">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInventory.map((item: InventoryItem) => (
                <TableRow key={item.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.make || '-'}</TableCell>
                  <TableCell>{item.model || '-'}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{item.rack || '-'} / {item.bin || '-'}</TableCell>
                  {isAdmin && (
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-blue-600 hover:text-blue-800"
                          onClick={() => handleEdit(item)}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 hover:text-red-800"
                          onClick={() => handleDelete(item)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Showing {filteredInventory.length} items
          </p>
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AnalyticsSection({ stats, transactions, onBack }: any) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="mr-3 h-6 w-6" />
            Analytics & Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-blue-50 text-center">
              <CardContent className="p-4">
                <h3 className="font-semibold text-blue-700">Total Items</h3>
                <p className="text-2xl font-bold text-blue-600">{stats?.totalItems || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-green-50 text-center">
              <CardContent className="p-4">
                <h3 className="font-semibold text-green-700">Total Transactions</h3>
                <p className="text-2xl font-bold text-green-600">{stats?.totalTransactions || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-purple-50 text-center">
              <CardContent className="p-4">
                <h3 className="font-semibold text-purple-700">Active Users</h3>
                <p className="text-2xl font-bold text-purple-600">{stats?.activeUsers || 0}</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Quantity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction: any) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{transaction.username}</TableCell>
                    <TableCell>
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        transaction.type === "add" && "bg-green-100 text-green-800",
                        transaction.type === "take" && "bg-orange-100 text-orange-800",
                        transaction.type === "update" && "bg-blue-100 text-blue-800",
                        transaction.type === "delete" && "bg-red-100 text-red-800"
                      )}>
                        {transaction.type}
                      </span>
                    </TableCell>
                    <TableCell>{transaction.itemName}</TableCell>
                    <TableCell>{transaction.quantity}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <Button variant="outline" onClick={onBack} className="mt-4">
            Back
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function UserManagementSection({ onBack }: any) {
  const [activeTab, setActiveTab] = useState("addUser");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Add User Form
  const [addUserForm, setAddUserForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    role: "user"
  });

  // Change Password Form
  const [changePasswordForm, setChangePasswordForm] = useState({
    userId: "",
    newPassword: "",
    confirmPassword: ""
  });

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersData = await api.users.getAll();
      setUsers(usersData as any);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "manageUsers") {
      loadUsers();
    }
  }, [activeTab]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (addUserForm.password !== addUserForm.confirmPassword) {
      toast({
        title: "Validation Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    try {
      await api.users.create({
        username: addUserForm.username,
        password: addUserForm.password,
        role: addUserForm.role
      });
      
      toast({
        title: "Success",
        description: "User added successfully",
      });
      
      setAddUserForm({
        username: "",
        password: "",
        confirmPassword: "",
        role: "user"
      });
      
      if (activeTab === "manageUsers") {
        loadUsers();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add user",
        variant: "destructive",
      });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (changePasswordForm.newPassword !== changePasswordForm.confirmPassword) {
      toast({
        title: "Validation Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    try {
      await api.users.changePassword(
        parseInt(changePasswordForm.userId),
        changePasswordForm.newPassword
      );
      
      toast({
        title: "Success",
        description: "Password changed successfully",
      });
      
      setChangePasswordForm({
        userId: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      await api.users.delete(userId);
      
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      
      loadUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="mr-3 h-6 w-6" />
          User Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="addUser">Add User</TabsTrigger>
            <TabsTrigger value="manageUsers">Manage Users</TabsTrigger>
            <TabsTrigger value="changePassword">Change Password</TabsTrigger>
          </TabsList>
          
          <TabsContent value="addUser" className="mt-6">
            <form onSubmit={handleAddUser} className="space-y-4 max-w-md">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={addUserForm.username}
                  onChange={(e) => setAddUserForm(prev => ({ ...prev, username: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={addUserForm.password}
                  onChange={(e) => setAddUserForm(prev => ({ ...prev, password: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={addUserForm.confirmPassword}
                  onChange={(e) => setAddUserForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select
                  value={addUserForm.role}
                  onValueChange={(value) => setAddUserForm(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="primary-green">
                Add User
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="manageUsers" className="mt-6">
            {loading ? (
              <div className="flex justify-center py-4">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user: any) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            user.role === "admin" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"
                          )}>
                            {user.role}
                          </span>
                        </TableCell>
                        <TableCell>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={user.username === 'admin'}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="changePassword" className="mt-6">
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              <div>
                <Label htmlFor="selectUser">Select User</Label>
                <Select
                  value={changePasswordForm.userId}
                  onValueChange={(value) => setChangePasswordForm(prev => ({ ...prev, userId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose user..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user: any) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={changePasswordForm.newPassword}
                  onChange={(e) => setChangePasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                <Input
                  id="confirmNewPassword"
                  type="password"
                  value={changePasswordForm.confirmPassword}
                  onChange={(e) => setChangePasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  required
                />
              </div>
              <Button type="submit" className="primary-green">
                Change Password
              </Button>
            </form>
          </TabsContent>
        </Tabs>
        
        <Button variant="outline" onClick={onBack} className="mt-6">
          Back
        </Button>
      </CardContent>
    </Card>
  );
}
