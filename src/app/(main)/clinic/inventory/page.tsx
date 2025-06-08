"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  BarChart3,
  ShoppingCart,
  Edit,
} from "lucide-react"
import { toast } from "sonner"
import { Topbar, TopbarAction, TopbarContent, TopbarDescription, TopbarTitle } from "@/components/global/Topbar"
import { Wrapper } from "@/components/global/Wrapper"

interface InventoryItem {
  id: string
  name: string
  category: string
  currentStock: number
  minStock: number
  maxStock: number
  unit: string
  costPerUnit: number
  supplier: string
  expiryDate?: string
  lastRestocked: string
  status: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "EXPIRED"
}

interface StockMovement {
  id: string
  itemId: string
  itemName: string
  type: "IN" | "OUT" | "ADJUSTMENT"
  quantity: number
  reason: string
  performedBy: string
  createdAt: string
}

export default function InventoryManagementPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("ALL")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [addItemDialogOpen, setAddItemDialogOpen] = useState(false)
  const [stockDialogOpen, setStockDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    category: "CONSUMABLES",
    sku: "",
    currentStock: 0,
    minimumStock: 0,
    maximumStock: 100,
    unit: "pieces",
    unitCost: 0,
    unitPrice: 0,
    expiryDate: "",
    supplierId: "",
  })

  const [stockAdjustment, setStockAdjustment] = useState({
    type: "IN" as "IN" | "OUT" | "ADJUSTMENT",
    quantity: 0,
    reason: "",
  })

  useEffect(() => {
    fetchInventory()
    fetchStockMovements()
  }, [])

  const fetchInventory = async () => {
    try {
      const response = await fetch("/api/clinic/inventory")
      const data = await response.json()
      if (data.error) throw new Error(data.error)
      setInventory(data.items || [])
    } catch (error) {
      console.error("Error fetching inventory:", error)
      toast.error("Failed to fetch inventory")
    } finally {
      setLoading(false)
    }
  }

  const fetchStockMovements = async () => {
    try {
      const response = await fetch("/api/clinic/inventory/movements")
      const data = await response.json()
      if (data.error) throw new Error(data.error)
      setMovements(data.movements || [])
    } catch (error) {
      console.error("Error fetching stock movements:", error)
    }
  }

  const validateForm = () => {
    if (!newItem.name.trim()) {
      toast.error("Item name is required")
      return false
    }
    if (!newItem.unit.trim()) {
      toast.error("Unit is required")
      return false
    }
    if (newItem.currentStock < 0) {
      toast.error("Current stock cannot be negative")
      return false
    }
    if (newItem.minimumStock < 0) {
      toast.error("Minimum stock cannot be negative")
      return false
    }
    if (newItem.maximumStock < 0) {
      toast.error("Maximum stock cannot be negative")
      return false
    }
    if (newItem.maximumStock < newItem.minimumStock) {
      toast.error("Maximum stock must be greater than minimum stock")
      return false
    }
    return true
  }

  const addInventoryItem = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      // Prepare the data to match the API schema exactly
      const itemData = {
        name: newItem.name.trim(),
        description: newItem.description.trim() || undefined,
        category: newItem.category,
        sku: newItem.sku.trim() || undefined,
        currentStock: Number(newItem.currentStock),
        minimumStock: Number(newItem.minimumStock),
        maximumStock: Number(newItem.maximumStock),
        unit: newItem.unit.trim(),
        unitCost: newItem.unitCost > 0 ? Number(newItem.unitCost) : undefined,
        unitPrice: newItem.unitPrice > 0 ? Number(newItem.unitPrice) : undefined,
        expiryDate: newItem.expiryDate || undefined,
        supplierId: newItem.supplierId.trim() || undefined,
      }

      console.log("Sending item data:", itemData)

      const response = await fetch("/api/clinic/inventory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(itemData),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error("API Error:", data)
        throw new Error(data.error || data.details || "Failed to add item")
      }

      toast.success("Inventory item added successfully")
      setAddItemDialogOpen(false)

      // Reset form
      setNewItem({
        name: "",
        description: "",
        category: "CONSUMABLES",
        sku: "",
        currentStock: 0,
        minimumStock: 0,
        maximumStock: 100,
        unit: "pieces",
        unitCost: 0,
        unitPrice: 0,
        expiryDate: "",
        supplierId: "",
      })

      fetchInventory()
    } catch (error) {
      console.error("Error adding inventory item:", error)
      toast.error(error instanceof Error ? error.message : "Failed to add inventory item")
    } finally {
      setIsSubmitting(false)
    }
  }

  const adjustStock = async () => {
    if (!selectedItem) return

    try {
      const response = await fetch(`/api/clinic/inventory/${selectedItem.id}/adjust`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stockAdjustment),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      toast.success("Stock adjusted successfully")
      setStockDialogOpen(false)
      setStockAdjustment({ type: "IN", quantity: 0, reason: "" })
      setSelectedItem(null)
      fetchInventory()
      fetchStockMovements()
    } catch (error) {
      console.error("Error adjusting stock:", error)
      toast.error("Failed to adjust stock")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "IN_STOCK":
        return "bg-green-100 text-green-800"
      case "LOW_STOCK":
        return "bg-yellow-100 text-yellow-800"
      case "OUT_OF_STOCK":
        return "bg-red-100 text-red-800"
      case "EXPIRED":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStockLevel = (item: InventoryItem) => {
    if (item.currentStock <= 0) return "OUT_OF_STOCK"
    if (item.currentStock <= item.minStock) return "LOW_STOCK"
    return "IN_STOCK"
  }

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "ALL" || item.category === categoryFilter
    const matchesStatus = statusFilter === "ALL" || getStockLevel(item) === statusFilter
    return matchesSearch && matchesCategory && matchesStatus
  })

  const categories = Array.from(new Set(inventory.map((item) => item.category)))
  const lowStockItems = inventory.filter((item) => getStockLevel(item) === "LOW_STOCK")
  const outOfStockItems = inventory.filter((item) => getStockLevel(item) === "OUT_OF_STOCK")

  return (
    <div>
      {/* Header */}
      <Topbar>
        <TopbarContent>
          <TopbarTitle>Inventory Management</TopbarTitle>
          <TopbarDescription>Track and manage your clinic's supplies and equipment</TopbarDescription>
        </TopbarContent>
        <TopbarAction>
          <Dialog open={addItemDialogOpen} onOpenChange={setAddItemDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Inventory Item</DialogTitle>
                <DialogDescription>Add a new item to your clinic's inventory</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-red-500">Item Name *</label>
                    <Input
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                      placeholder="e.g., Dental Gloves"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Category *</label>
                    <Select
                      value={newItem.category}
                      onValueChange={(value) => setNewItem({ ...newItem, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CONSUMABLES">Consumables</SelectItem>
                        <SelectItem value="EQUIPMENT">Equipment</SelectItem>
                        <SelectItem value="MEDICATION">Medication</SelectItem>
                        <SelectItem value="MATERIALS">Materials</SelectItem>
                        <SelectItem value="INSTRUMENTS">Instruments</SelectItem>
                        <SelectItem value="SUPPLIES">Supplies</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    placeholder="Optional description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">SKU</label>
                    <Input
                      value={newItem.sku}
                      onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })}
                      placeholder="Stock Keeping Unit"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-red-500">Unit *</label>
                    <Input
                      value={newItem.unit}
                      onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                      placeholder="e.g., pieces, boxes, ml"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">Current Stock *</label>
                    <Input
                      type="number"
                      min="0"
                      value={newItem.currentStock}
                      onChange={(e) => setNewItem({ ...newItem, currentStock: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Min Stock *</label>
                    <Input
                      type="number"
                      min="0"
                      value={newItem.minimumStock}
                      onChange={(e) => setNewItem({ ...newItem, minimumStock: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Max Stock *</label>
                    <Input
                      type="number"
                      min="0"
                      value={newItem.maximumStock}
                      onChange={(e) => setNewItem({ ...newItem, maximumStock: Number(e.target.value) || 100 })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Unit Cost (RM)</label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newItem.unitCost}
                      onChange={(e) => setNewItem({ ...newItem, unitCost: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Unit Price (RM)</label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newItem.unitPrice}
                      onChange={(e) => setNewItem({ ...newItem, unitPrice: Number(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Supplier ID</label>
                    <Input
                      value={newItem.supplierId}
                      onChange={(e) => setNewItem({ ...newItem, supplierId: e.target.value })}
                      placeholder="Optional supplier ID"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Expiry Date</label>
                    <Input
                      type="date"
                      value={newItem.expiryDate}
                      onChange={(e) => setNewItem({ ...newItem, expiryDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setAddItemDialogOpen(false)} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button onClick={addInventoryItem} disabled={isSubmitting}>
                    {isSubmitting ? "Adding..." : "Add Item"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TopbarAction>
      </Topbar>

      <Wrapper className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inventory.length}</div>
              <p className="text-xs text-muted-foreground">across {categories.length} categories</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{lowStockItems.length}</div>
              <p className="text-xs text-muted-foreground">need restocking</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{outOfStockItems.length}</div>
              <p className="text-xs text-muted-foreground">urgent restocking</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                RM {inventory.reduce((sum, item) => sum + item.currentStock * item.costPerUnit, 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">current inventory value</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search inventory items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="IN_STOCK">In Stock</SelectItem>
              <SelectItem value="LOW_STOCK">Low Stock</SelectItem>
              <SelectItem value="OUT_OF_STOCK">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="inventory" className="space-y-4">
          <TabsList>
            <TabsTrigger value="inventory">Inventory Items</TabsTrigger>
            <TabsTrigger value="movements">Stock Movements</TabsTrigger>
            <TabsTrigger value="alerts">Alerts & Notifications</TabsTrigger>
          </TabsList>

          {/* Inventory Items Tab */}
          <TabsContent value="inventory">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredInventory.map((item) => (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{item.name}</CardTitle>
                        <CardDescription>{item.category}</CardDescription>
                      </div>
                      <Badge className={getStatusColor(getStockLevel(item))}>{getStockLevel(item)}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Current Stock:</span>
                        <span className="font-medium">
                          {item.currentStock} {item.unit}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Min Stock:</span>
                        <span className="text-sm">
                          {item.minStock} {item.unit}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Cost per Unit:</span>
                        <span className="text-sm">RM {item.costPerUnit}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Supplier:</span>
                        <span className="text-sm">{item.supplier}</span>
                      </div>
                      {item.expiryDate && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Expires:</span>
                          <span className="text-sm">{new Date(item.expiryDate).toLocaleDateString()}</span>
                        </div>
                      )}

                      {/* Stock Level Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Stock Level</span>
                          <span>{Math.round((item.currentStock / item.maxStock) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${getStockLevel(item) === "OUT_OF_STOCK"
                              ? "bg-red-500"
                              : getStockLevel(item) === "LOW_STOCK"
                                ? "bg-yellow-500"
                                : "bg-green-500"
                              }`}
                            style={{ width: `${Math.min((item.currentStock / item.maxStock) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedItem(item)
                            setStockDialogOpen(true)
                          }}
                          className="flex-1"
                        >
                          <Package className="h-3 w-3 mr-1" />
                          Adjust Stock
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredInventory.length === 0 && (
                <div className="col-span-full text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No inventory items found</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Stock Movements Tab */}
          <TabsContent value="movements">
            <Card>
              <CardHeader>
                <CardTitle>Recent Stock Movements</CardTitle>
                <CardDescription>Track all inventory changes and adjustments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {movements.map((movement) => (
                    <div key={movement.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${movement.type === "IN"
                            ? "bg-green-100"
                            : movement.type === "OUT"
                              ? "bg-red-100"
                              : "bg-blue-100"
                            }`}
                        >
                          {movement.type === "IN" ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : movement.type === "OUT" ? (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          ) : (
                            <Edit className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold">{movement.itemName}</h3>
                          <p className="text-sm text-muted-foreground">{movement.reason}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(movement.createdAt).toLocaleDateString()} by {movement.performedBy}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`font-semibold ${movement.type === "IN"
                            ? "text-green-600"
                            : movement.type === "OUT"
                              ? "text-red-600"
                              : "text-blue-600"
                            }`}
                        >
                          {movement.type === "IN" ? "+" : movement.type === "OUT" ? "-" : "±"}
                          {movement.quantity}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {movement.type}
                        </Badge>
                      </div>
                    </div>
                  ))}

                  {movements.length === 0 && (
                    <div className="text-center py-8">
                      <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No stock movements recorded</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts">
            <div className="space-y-4">
              {/* Low Stock Alerts */}
              {lowStockItems.length > 0 && (
                <Card className="border-yellow-200">
                  <CardHeader>
                    <CardTitle className="text-yellow-800 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Low Stock Alerts ({lowStockItems.length})
                    </CardTitle>
                    <CardDescription>Items that need restocking soon</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {lowStockItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                          <div>
                            <h4 className="font-medium">{item.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              Current: {item.currentStock} {item.unit} | Min: {item.minStock} {item.unit}
                            </p>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => {
                            setSelectedItem(item)
                            setStockDialogOpen(true)
                          }}>
                            <ShoppingCart className="h-3 w-3 mr-1" />
                            Reorder
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Out of Stock Alerts */}
              {outOfStockItems.length > 0 && (
                <Card className="border-red-200">
                  <CardHeader>
                    <CardTitle className="text-red-800 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Out of Stock Alerts ({outOfStockItems.length})
                    </CardTitle>
                    <CardDescription>Items that need immediate restocking</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {outOfStockItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                          <div>
                            <h4 className="font-medium">{item.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              Stock depleted - Last restocked: {new Date(item.lastRestocked).toLocaleDateString()}
                            </p>
                          </div>
                          <Button size="sm" className="bg-red-600 hover:bg-red-700">
                            <ShoppingCart className="h-3 w-3 mr-1" />
                            Urgent Reorder
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {lowStockItems.length === 0 && outOfStockItems.length === 0 && (
                <Card>
                  <CardContent className="text-center py-8">
                    <Package className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="font-semibold text-green-800 mb-2">All Good!</h3>
                    <p className="text-muted-foreground">No inventory alerts at this time</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Stock Adjustment Dialog */}
        <Dialog open={stockDialogOpen} onOpenChange={setStockDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adjust Stock - {selectedItem?.name}</DialogTitle>
              <DialogDescription>Update the stock level for this item</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Current Stock</label>
                <div className="text-lg font-semibold">
                  {selectedItem?.currentStock} {selectedItem?.unit}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Adjustment Type</label>
                <Select
                  value={stockAdjustment.type}
                  onValueChange={(value) =>
                    setStockAdjustment({ ...stockAdjustment, type: value as "IN" | "OUT" | "ADJUSTMENT" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IN">Stock In (Add)</SelectItem>
                    <SelectItem value="OUT">Stock Out (Remove)</SelectItem>
                    <SelectItem value="ADJUSTMENT">Adjustment (Correct)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Quantity</label>
                <Input
                  type="number"
                  value={stockAdjustment.quantity}
                  onChange={(e) => setStockAdjustment({ ...stockAdjustment, quantity: Number(e.target.value) })}
                  placeholder="Enter quantity"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Reason</label>
                <Input
                  value={stockAdjustment.reason}
                  onChange={(e) => setStockAdjustment({ ...stockAdjustment, reason: e.target.value })}
                  placeholder="e.g., New delivery, Used in treatment, Damaged items"
                />
              </div>

              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm font-medium">New Stock Level:</div>
                <div className="text-lg font-semibold">
                  {selectedItem && stockAdjustment.type === "IN"
                    ? selectedItem.currentStock + stockAdjustment.quantity
                    : selectedItem && stockAdjustment.type === "OUT"
                      ? Math.max(0, selectedItem.currentStock - stockAdjustment.quantity)
                      : stockAdjustment.quantity}{" "}
                  {selectedItem?.unit}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setStockDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={adjustStock}>Apply Adjustment</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </Wrapper>
    </div>
  )
}
