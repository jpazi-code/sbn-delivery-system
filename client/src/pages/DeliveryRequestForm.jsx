import { useState, useEffect } from 'react'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'

// Joy UI components
import Box from '@mui/joy/Box'
import Button from '@mui/joy/Button'
import Typography from '@mui/joy/Typography'
import Sheet from '@mui/joy/Sheet'
import FormControl from '@mui/joy/FormControl'
import FormLabel from '@mui/joy/FormLabel'
import Input from '@mui/joy/Input'
import Textarea from '@mui/joy/Textarea'
import Alert from '@mui/joy/Alert'
import Stack from '@mui/joy/Stack'
import Select from '@mui/joy/Select'
import Option from '@mui/joy/Option'
import Table from '@mui/joy/Table'
import IconButton from '@mui/joy/IconButton'
import Card from '@mui/joy/Card'
import CardContent from '@mui/joy/CardContent'
import Divider from '@mui/joy/Divider'
import Chip from '@mui/joy/Chip'

// Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SaveIcon from '@mui/icons-material/Save'
import BuildIcon from '@mui/icons-material/Build'
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered'
import NoteIcon from '@mui/icons-material/Note'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import StorefrontIcon from '@mui/icons-material/Storefront'
import FlagIcon from '@mui/icons-material/Flag'
import LockIcon from '@mui/icons-material/Lock'

const DeliveryRequestForm = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  // Only branch users can create requests
  if (user?.role !== 'branch') {
    return (
      <Box sx={{ p: 2 }}>
        <Alert color="danger">Only branch users can create delivery requests</Alert>
        <Button
          component={RouterLink}
          to="/delivery-requests"
          sx={{ mt: 2 }}
          startDecorator={<ArrowBackIcon />}
        >
          Back to Requests
        </Button>
      </Box>
    )
  }
  
  // Form state
  const [formData, setFormData] = useState({
    branch: user?.branch_id || '',
    deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default to 1 week from now
    priority: 'medium',
    notes: ''
  })

  // Branches state
  const [branches, setBranches] = useState([])
  const [branchesLoading, setBranchesLoading] = useState(true)
  const [userBranch, setUserBranch] = useState(null)

  // Items state
  const [items, setItems] = useState([
    {
      id: 1,
      itemCode: '',
      description: '',
      quantity: '',
      unit: '',
      unitPrice: ''
    }
  ])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  // Fetch branches
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setBranchesLoading(true)
        const response = await axios.get('/api/branches')
        setBranches(response.data)
        
        // If user has a branch_id, set it as the default and find the branch details
        if (user?.branch_id && response.data.length > 0) {
          setFormData(prev => ({
            ...prev,
            branch: user.branch_id
          }))
          
          // Find the user's branch from the branches list
          const branch = response.data.find(b => b.id === user.branch_id)
          if (branch) {
            setUserBranch(branch)
          }
        }
      } catch (err) {
        console.error('Error fetching branches:', err)
        setError('Failed to load branches')
      } finally {
        setBranchesLoading(false)
      }
    }
    
    fetchBranches()
  }, [user])

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Handle item changes
  const handleItemChange = (id, field, value) => {
    setItems(prevItems => 
      prevItems.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    )
  }

  // Add a new item row
  const addItem = () => {
    const newId = Math.max(...items.map(item => item.id), 0) + 1
    setItems([...items, {
      id: newId,
      itemCode: '',
      description: '',
      quantity: '',
      unit: '',
      unitPrice: ''
    }])
  }

  // Remove an item row
  const removeItem = (id) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id))
    }
  }

  // Calculate subtotal for an item
  const calculateSubtotal = (item) => {
    const quantity = parseFloat(item.quantity) || 0
    const unitPrice = parseFloat(item.unitPrice) || 0
    return (quantity * unitPrice).toFixed(2)
  }

  // Calculate total for all items
  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      return sum + parseFloat(calculateSubtotal(item) || 0)
    }, 0).toFixed(2)
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Basic validation
    if (!formData.branch) {
      setError('Please select a branch')
      return
    }
    
    // Validate items
    const invalidItems = items.filter(item => 
      !item.itemCode || !item.description || !item.quantity || !item.unit || !item.unitPrice
    )
    
    if (invalidItems.length > 0) {
      setError('Please fill in all item details')
      return
    }
    
    setLoading(true)
    setError(null)
    setSuccess(false)
    
    try {
      // Format the request data
      const requestData = {
        ...formData,
        items: items.map(item => ({
          item_code: item.itemCode,
          description: item.description,
          quantity: parseFloat(item.quantity),
          unit: item.unit,
          unit_price: parseFloat(item.unitPrice),
          subtotal: parseFloat(calculateSubtotal(item))
        })),
        total_amount: parseFloat(calculateTotal())
      }
      
      await axios.post('/api/delivery-requests', requestData)
      
      setSuccess('Request submitted successfully')
      
      // Navigate back to list after a brief delay
      setTimeout(() => {
        navigate('/delivery-requests')
      }, 1500)
      
    } catch (err) {
      console.error('Error submitting request:', err)
      setError(err.response?.data?.error || 'Failed to submit request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ py: 2 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography level="h4">Create Delivery Request</Typography>
        <Button
          component={RouterLink}
          to="/delivery-requests"
          startDecorator={<ArrowBackIcon />}
          variant="outlined"
        >
          Back to List
        </Button>
      </Box>

      {error && (
        <Alert color="danger" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert color="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        {/* Request Information */}
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent sx={{ pb: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
              <FormControl required>
                <FormLabel>Branch</FormLabel>
                {user?.branch_id && userBranch ? (
                  <Box 
                    sx={{ 
                      p: 1, 
                      border: '1px solid', 
                      borderColor: 'neutral.outlinedBorder',
                      borderRadius: 'sm',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      bgcolor: 'background.level1'
                    }}
                  >
                    <StorefrontIcon color="primary" />
                    <Box sx={{ flex: 1 }}>
                      <Typography level="body-md">{userBranch.name}</Typography>
                      <Typography level="body-xs" color="neutral">
                        {userBranch.address}
                      </Typography>
                    </Box>
                    <Chip size="sm" startDecorator={<LockIcon fontSize="small" />} variant="soft">
                      Your branch
                    </Chip>
                  </Box>
                ) : (
                  <Select
                    name="branch"
                    value={formData.branch}
                    onChange={(e, value) => setFormData(prev => ({ ...prev, branch: value }))}
                    placeholder="Select a branch"
                    startDecorator={<StorefrontIcon />}
                    loading={branchesLoading}
                    disabled={branchesLoading || !!user?.branch_id}
                  >
                    {branches.map(branch => (
                      <Option key={branch.id} value={branch.id}>
                        {branch.name}
                      </Option>
                    ))}
                  </Select>
                )}
                {user?.branch_id && (
                  <Typography level="body-xs" color="neutral" sx={{ mt: 0.5 }}>
                    Requests are automatically created for your assigned branch
                  </Typography>
                )}
              </FormControl>

              <FormControl required>
                <FormLabel>Delivery Date</FormLabel>
                <Input
                  name="deliveryDate"
                  type="date"
                  value={formData.deliveryDate}
                  onChange={handleChange}
                  startDecorator={<CalendarTodayIcon />}
                />
              </FormControl>

              <FormControl required>
                <FormLabel>Priority</FormLabel>
                <Select
                  name="priority"
                  value={formData.priority}
                  onChange={(e, value) => setFormData(prev => ({ ...prev, priority: value }))}
                  startDecorator={<FlagIcon />}
                >
                  <Option value="low">Low</Option>
                  <Option value="medium">Medium</Option>
                  <Option value="high">High</Option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Notes</FormLabel>
                <Textarea
                  name="notes"
                  placeholder="Additional information about this delivery request..."
                  value={formData.notes}
                  onChange={handleChange}
                  startDecorator={<NoteIcon />}
                  minRows={2}
                />
              </FormControl>
            </Box>
          </CardContent>
        </Card>

        {/* Items */}
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography level="title-lg" sx={{ mb: 2 }}>Items</Typography>
            
            <Box sx={{ overflowX: 'auto' }}>
              {items.map((item, index) => (
                <Box key={item.id} sx={{ mb: 3, p: 2, borderRadius: '8px', bgcolor: 'background.level1' }}>
                  <Typography level="title-md">Item {index + 1}</Typography>
                  
                  <Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                    <FormControl required>
                      <FormLabel>Item Code</FormLabel>
                      <Input
                        placeholder="e.g., ITM-001"
                        value={item.itemCode}
                        onChange={(e) => handleItemChange(item.id, 'itemCode', e.target.value)}
                      />
                    </FormControl>
                    
                    <FormControl required>
                      <FormLabel>Description</FormLabel>
                      <Input
                        placeholder="e.g., Steel Bolts 10mm"
                        value={item.description}
                        onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                      />
                    </FormControl>
                    
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                      <FormControl required>
                        <FormLabel>Quantity</FormLabel>
                        <Input
                          type="number"
                          placeholder="e.g., 100"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                          slotProps={{ input: { min: 1 } }}
                        />
                      </FormControl>
                      
                      <FormControl required>
                        <FormLabel>Unit</FormLabel>
                        <Input
                          placeholder="e.g., Box"
                          value={item.unit}
                          onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)}
                        />
                      </FormControl>
                      
                      <FormControl required>
                        <FormLabel>Unit Price</FormLabel>
                        <Input
                          type="number"
                          placeholder="e.g., 99.99"
                          startDecorator="₱"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(item.id, 'unitPrice', e.target.value)}
                          slotProps={{ input: { min: 0, step: "0.01" } }}
                        />
                      </FormControl>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                    {items.length > 1 && (
                      <Button 
                        variant="soft" 
                        color="danger" 
                        startDecorator={<DeleteIcon />} 
                        onClick={() => removeItem(item.id)}
                      >
                        Remove
                      </Button>
                    )}
                    <Typography level="body-md" sx={{ ml: 'auto' }}>
                      Subtotal: ₱{calculateSubtotal(item)}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
            
            <Button
              startDecorator={<AddIcon />}
              onClick={addItem}
              variant="outlined"
              color="primary"
              sx={{ width: '100%' }}
            >
              Add Another Item
            </Button>
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Typography level="title-lg">
                Total: ₱{calculateTotal()}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            type="button"
            variant="outlined"
            color="neutral"
            onClick={() => navigate('/delivery-requests')}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
            startDecorator={<SaveIcon />}
          >
            Submit Request
          </Button>
        </Box>
      </form>
    </Box>
  )
}

export default DeliveryRequestForm 