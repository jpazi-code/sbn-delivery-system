import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link as RouterLink, useLocation } from 'react-router-dom'
import axios from 'axios'

// Joy UI components
import Box from '@mui/joy/Box'
import Button from '@mui/joy/Button'
import Typography from '@mui/joy/Typography'
import Sheet from '@mui/joy/Sheet'
import FormControl from '@mui/joy/FormControl'
import FormLabel from '@mui/joy/FormLabel'
import Input from '@mui/joy/Input'
import Textarea from '@mui/joy/Textarea'
import Select from '@mui/joy/Select'
import Option from '@mui/joy/Option'
import CircularProgress from '@mui/joy/CircularProgress'
import Divider from '@mui/joy/Divider'
import Alert from '@mui/joy/Alert'
import Stack from '@mui/joy/Stack'
import Autocomplete from '@mui/joy/Autocomplete'
import ListItemContent from '@mui/joy/ListItemContent'
import ListItemDecorator from '@mui/joy/ListItemDecorator'
import ListItem from '@mui/joy/ListItem'
import Avatar from '@mui/joy/Avatar'
import Modal from '@mui/joy/Modal'
import ModalDialog from '@mui/joy/ModalDialog'
import ModalClose from '@mui/joy/ModalClose'

// Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SaveIcon from '@mui/icons-material/Save'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import PersonIcon from '@mui/icons-material/Person'
import HomeIcon from '@mui/icons-material/Home'
import PhoneIcon from '@mui/icons-material/Phone'
import InventoryIcon from '@mui/icons-material/Inventory'
import ScaleIcon from '@mui/icons-material/Scale'
import NumbersIcon from '@mui/icons-material/Numbers'
import StorefrontIcon from '@mui/icons-material/Storefront'
import BusinessIcon from '@mui/icons-material/Business'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'

const DeliveryForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const isEditMode = !!id
  
  // Get requestId from query parameters if it exists
  const queryParams = new URLSearchParams(location.search)
  const requestId = queryParams.get('requestId')

  // Form state
  const [formData, setFormData] = useState({
    recipient_name: '',
    recipient_address: '',
    recipient_phone: '',
    package_description: '',
    weight: '',
    delivery_date: '',
    status: 'pending',
    branch_id: null
  })

  // Add state for branches and branch users
  const [branches, setBranches] = useState([])
  const [branchUsers, setBranchUsers] = useState([])
  const [filteredBranchUsers, setFilteredBranchUsers] = useState([])
  const [loadingBranches, setLoadingBranches] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [selectedBranch, setSelectedBranch] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  
  // Processing state
  const [processingModal, setProcessingModal] = useState(false)
  const [processingUser, setProcessingUser] = useState(null)

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(isEditMode)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const [loadingRequest, setLoadingRequest] = useState(false)
  const [requestData, setRequestData] = useState(null)

  // Fetch all branches
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setLoadingBranches(true)
        const response = await axios.get('/api/branches')
        setBranches(response.data)
      } catch (err) {
        console.error('Error fetching branches:', err)
        setError('Failed to load branches')
      } finally {
        setLoadingBranches(false)
      }
    }

    fetchBranches()
  }, [])

  // Fetch all branch users
  useEffect(() => {
    const fetchBranchUsers = async () => {
      try {
        setLoadingUsers(true)
        const response = await axios.get('/api/users/branches')
        setBranchUsers(response.data)
      } catch (err) {
        console.error('Error fetching branch users:', err)
        setError('Failed to load branch users')
      } finally {
        setLoadingUsers(false)
      }
    }

    fetchBranchUsers()
  }, [])

  // Filter branch users when a branch is selected
  useEffect(() => {
    if (selectedBranch && branchUsers.length > 0) {
      const usersForBranch = branchUsers.filter(user => user.branch_id === selectedBranch.id)
      setFilteredBranchUsers(usersForBranch)
    } else {
      setFilteredBranchUsers([])
    }
  }, [selectedBranch, branchUsers])

  // Fetch delivery data if in edit mode
  useEffect(() => {
    if (isEditMode) {
      const fetchDelivery = async () => {
        try {
          setLoadingData(true)
          const response = await axios.get(`/api/deliveries/${id}`)
          
          // Format the delivery date for the input field if it exists
          const delivery = response.data
          if (delivery.delivery_date) {
            const date = new Date(delivery.delivery_date)
            delivery.delivery_date = date.toISOString().split('T')[0]
          }
          
          setFormData(delivery)
          
          // Find and set the matching branch
          if (delivery.branch_id && branches.length > 0) {
            const branch = branches.find(b => b.id === delivery.branch_id)
            if (branch) {
              setSelectedBranch(branch)
            }
          }
          
          // Find and set the matching branch user if available
          if (delivery.branch_id && branchUsers.length > 0) {
            const user = branchUsers.find(u => 
              u.branch_id === delivery.branch_id && 
              (u.full_name === delivery.recipient_name || u.username === delivery.recipient_name)
            )
            if (user) {
              setSelectedUser(user)
            }
          }
          
          setError(null)
        } catch (err) {
          console.error('Error fetching delivery:', err)
          setError('Failed to load delivery data')
        } finally {
          setLoadingData(false)
        }
      }

      fetchDelivery()
    }
  }, [id, isEditMode, branches, branchUsers])

  // Check if a request is being processed and fetch request data if requestId is present
  useEffect(() => {
    if (requestId) {
      const checkAndFetchRequestData = async () => {
        try {
          setLoadingRequest(true)
          
          // First check if someone is already processing this request
          const checkResponse = await axios.get(`/api/delivery-requests/${requestId}/processing-status`)
          
          if (checkResponse.data.isBeingProcessed && !checkResponse.data.isCurrentUser) {
            // Show processing modal
            setProcessingUser(checkResponse.data.processingUser)
            setProcessingModal(true)
            return
          }
          
          // Mark this request as being processed by current user
          await axios.post(`/api/delivery-requests/${requestId}/mark-processing`)
          
          // Fetch the request data
          const response = await axios.get(`/api/delivery-requests/${requestId}`)
          setRequestData(response.data)
          
          // Set delivery date from request 
          let deliveryDate = null
          if (response.data.delivery_date) {
            const date = new Date(response.data.delivery_date)
            deliveryDate = date.toISOString().split('T')[0]
          } else {
            // If no delivery date in request, set to today + 2 days
            const today = new Date()
            today.setDate(today.getDate() + 2)
            deliveryDate = today.toISOString().split('T')[0]
          }
          
          // Find the branch associated with the request
          if (response.data.branch_id && branches.length > 0) {
            const branch = branches.find(b => b.id === response.data.branch_id)
            if (branch) {
              setSelectedBranch(branch)
              
              // Find a branch user if available
              if (branchUsers.length > 0) {
                // Look for a user who matches the request's created_by_id or recipient info
                const requestCreatorId = response.data.created_by_id;
                const requestedByName = response.data.requested_by || '';
                const requestUsername = response.data.username || '';
                
                // First try to find the exact user who created the request
                let user = branchUsers.find(u => u.id === requestCreatorId);
                
                // If not found, try to match by name or username
                if (!user) {
                  user = branchUsers.find(u => 
                    u.branch_id === branch.id && 
                    (u.full_name === requestedByName || u.username === requestUsername)
                  );
                }
                
                // If still not found, then fall back to the first user from that branch
                if (!user) {
                  user = branchUsers.find(u => u.branch_id === branch.id);
                }
                
                if (user) {
                  setSelectedUser(user);
                }
              }
              
              // Pre-fill form with request data
              setFormData(prev => ({
                ...prev,
                recipient_name: response.data.requested_by || selectedUser?.full_name || selectedUser?.username || '',
                recipient_address: branch.address || '',
                recipient_phone: branch.phone || '',
                branch_id: branch.id,
                package_description: formatRequestItems(response.data.items),
                delivery_date: deliveryDate,
                // Set default status to 'preparing'
                status: 'preparing'
              }))
            }
          }
          
          setError(null)
        } catch (err) {
          console.error('Error fetching request data:', err)
          setError('Failed to load request data')
        } finally {
          setLoadingRequest(false)
        }
      }
      
      checkAndFetchRequestData()
      
      // Cleanup function to unmark the request when user leaves the page
      return () => {
        if (requestId) {
          axios.post(`/api/delivery-requests/${requestId}/unmark-processing`)
            .catch(err => console.error('Error unmarking request:', err))
        }
      }
    }
  }, [requestId, branches, branchUsers, selectedUser])

  // Format request items into a package description
  const formatRequestItems = (items) => {
    if (!items || !items.length) return ''
    
    return items.map(item => 
      `${item.quantity}x ${item.description} (${item.unit_price ? `₱${parseFloat(item.unit_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'No price'} each)`
    ).join('\n')
  }

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Handle status selection change
  const handleStatusChange = (_, value) => {
    setFormData((prev) => ({ ...prev, status: value }))
  }

  // Handle branch selection
  const handleBranchSelect = (_, branch) => {
    setSelectedBranch(branch)
    setSelectedUser(null) // Clear the selected user when branch changes
    
    if (branch) {
      // Update form with branch data, keeping the recipient name if it exists
      setFormData(prev => ({
        ...prev,
        recipient_address: branch.address || '',
        recipient_phone: branch.phone || '',
        branch_id: branch.id
      }))
    }
  }

  // Handle branch user selection
  const handleUserSelect = (_, user) => {
    setSelectedUser(user)
    if (user) {
      setFormData(prev => ({
        ...prev,
        recipient_name: user.full_name || user.username,
        // We keep the branch address and phone from the selected branch
      }))
    }
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Basic validation
    if (!formData.recipient_name || !formData.recipient_address || !formData.branch_id) {
      setError('Branch, recipient name and address are required')
      return
    }
    
    setLoading(true)
    setError(null)
    setSuccess(false)
    
    try {
      const deliveryData = {
        ...formData,
        // Include branch_id for backend to associate with a branch
        branch_id: formData.branch_id,
        // Include request_id if this delivery is created from a request
        request_id: requestId,
        // Always set status to pending for new deliveries
        status: isEditMode ? formData.status : 'pending'
      }
      
      if (isEditMode) {
        // Update existing delivery
        await axios.put(`/api/deliveries/${id}`, deliveryData)
        setSuccess('Delivery updated successfully')
      } else {
        // Create new delivery
        const response = await axios.post('/api/deliveries', deliveryData)
        setSuccess(`Delivery created successfully with tracking number: ${response.data.tracking_number}`)
        
        // Clear form after successful creation
        if (!isEditMode) {
          setFormData({
            recipient_name: '',
            recipient_address: '',
            recipient_phone: '',
            package_description: '',
            weight: '',
            delivery_date: '',
            status: 'pending',
            branch_id: null
          })
          setSelectedBranch(null)
          setSelectedUser(null)
        }
      }
      
      // Unmark the request as being processed
      if (requestId) {
        try {
          await axios.post(`/api/delivery-requests/${requestId}/unmark-processing`)
        } catch (err) {
          console.error('Error unmarking request:', err)
        }
      }
      
      // Navigate back to list after a brief delay
      setTimeout(() => {
        navigate('/deliveries')
      }, 1500)
      
    } catch (err) {
      console.error('Error saving delivery:', err)
      setError(err.response?.data?.error || 'Failed to save delivery')
    } finally {
      setLoading(false)
    }
  }
  
  // Handle cancellation of processing
  const handleCancelProcessing = () => {
    navigate('/delivery-requests')
  }

  if (loading || loadingData || loadingRequest) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ py: 2 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography level="h3">
          {isEditMode ? 'Edit Delivery' : requestId ? 'Process Request as Delivery' : 'New Delivery'}
        </Typography>
        <Button
          component={RouterLink}
          to="/deliveries"
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

      {requestData && (
        <Alert color="info" sx={{ mb: 3 }}>
          <Typography level="body-sm">
            Creating delivery from approved request #{requestId} • {requestData.items?.length || 0} item(s) • Total: ₱{requestData.total_price ? parseFloat(requestData.total_price).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
          </Typography>
        </Alert>
      )}

      <Sheet
        component="form"
        onSubmit={handleSubmit}
        sx={{
          p: 3,
          borderRadius: 'sm',
          boxShadow: 'sm',
        }}
      >
        <Stack spacing={2}>
          <Typography level="title-md">Delivery Information</Typography>

          <Divider>Recipient</Divider>

          {/* Step 1: Select Branch */}
          <FormControl required>
            <FormLabel>Select Branch</FormLabel>
            <Autocomplete
              placeholder="Select a branch first"
              options={branches}
              loading={loadingBranches}
              value={selectedBranch}
              onChange={handleBranchSelect}
              disabled={loading || isEditMode || !!requestId}
              getOptionLabel={(option) => option.name || ''}
              renderOption={(props, option) => (
                <ListItem {...props}>
                  <ListItemDecorator>
                    <Avatar size="sm">
                      <BusinessIcon />
                    </Avatar>
                  </ListItemDecorator>
                  <ListItemContent>
                    <Typography>
                      {option.name}
                    </Typography>
                    <Typography level="body-xs">
                      {option.address}
                    </Typography>
                  </ListItemContent>
                </ListItem>
              )}
            />
            <Typography level="body-sm" color="neutral" sx={{ mt: 0.5 }}>
              First select a branch to deliver to
            </Typography>
          </FormControl>

          {/* Step 2: Select Branch User (only enabled if branch is selected) */}
          <FormControl>
            <FormLabel>Branch Recipient</FormLabel>
            <Autocomplete
              placeholder={selectedBranch ? "Select a recipient from this branch" : "Select a branch first"}
              options={filteredBranchUsers}
              loading={loadingUsers}
              value={selectedUser}
              onChange={handleUserSelect}
              disabled={loading || !selectedBranch}
              getOptionLabel={(option) => option.full_name || option.username || ''}
              renderOption={(props, option) => (
                <ListItem {...props}>
                  <ListItemDecorator>
                    <Avatar size="sm">
                      <PersonIcon />
                    </Avatar>
                  </ListItemDecorator>
                  <ListItemContent>
                    <Typography>
                      {option.full_name || option.username}
                    </Typography>
                    <Typography level="body-xs">
                      {option.email}
                    </Typography>
                  </ListItemContent>
                </ListItem>
              )}
            />
            <Typography level="body-sm" color="neutral" sx={{ mt: 0.5 }}>
              Select a recipient from this branch or enter recipient details manually below
            </Typography>
          </FormControl>

          {/* Recipient Name (manually editable) */}
          <FormControl required>
            <FormLabel>Recipient Name</FormLabel>
            <Input
              name="recipient_name"
              placeholder="Enter recipient name"
              value={formData.recipient_name}
              onChange={handleChange}
              startDecorator={<PersonIcon />}
              disabled={loading}
            />
          </FormControl>

          {/* Branch Address (read-only if branch is selected) */}
          <FormControl required>
            <FormLabel>Branch Address</FormLabel>
            <Textarea
              name="recipient_address"
              placeholder="Enter delivery address"
              value={formData.recipient_address}
              onChange={handleChange}
              startDecorator={<HomeIcon />}
              minRows={2}
              disabled={loading}
              readOnly={!!selectedBranch}
            />
            {selectedBranch && (
              <Typography level="body-sm" color="neutral" sx={{ mt: 0.5 }}>
                Using branch address - cannot be edited
              </Typography>
            )}
          </FormControl>

          {/* Branch Phone (read-only if branch is selected) */}
          <FormControl>
            <FormLabel>Branch Phone</FormLabel>
            <Input
              name="recipient_phone"
              placeholder="Enter recipient phone"
              value={formData.recipient_phone}
              onChange={handleChange}
              startDecorator={<PhoneIcon />}
              disabled={loading}
              readOnly={!!selectedBranch}
            />
            {selectedBranch && (
              <Typography level="body-sm" color="neutral" sx={{ mt: 0.5 }}>
                Using branch phone - cannot be edited
              </Typography>
            )}
          </FormControl>

          <Divider>Package Details</Divider>

          <FormControl>
            <FormLabel>Package Description</FormLabel>
            <Textarea
              name="package_description"
              placeholder="Enter package description"
              value={formData.package_description}
              onChange={handleChange}
              startDecorator={<InventoryIcon />}
              minRows={2}
              disabled={loading}
            />
          </FormControl>

          <FormControl>
            <FormLabel>Weight (kg)</FormLabel>
            <Input
              name="weight"
              type="number"
              placeholder="Enter weight in kg"
              value={formData.weight}
              onChange={handleChange}
              startDecorator={<ScaleIcon />}
              disabled={loading}
              slotProps={{ input: { min: 0, step: 0.1 } }}
            />
          </FormControl>

          <FormControl>
            <FormLabel>Delivery Date</FormLabel>
            <Input
              name="delivery_date"
              type="date"
              value={formData.delivery_date}
              onChange={handleChange}
              disabled={loading}
            />
          </FormControl>

          {isEditMode && (
            <FormControl required>
              <FormLabel>Status</FormLabel>
              <Select
                value={formData.status}
                onChange={handleStatusChange}
                disabled={loading}
              >
                <Option value="pending">Pending</Option>
                <Option value="preparing">Preparing</Option>
                <Option value="loading">Loading</Option>
                <Option value="in_transit">In Transit</Option>
                <Option value="delivered">Delivered</Option>
                <Option value="cancelled">Cancelled</Option>
              </Select>
            </FormControl>
          )}

          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
            <Button
              component={RouterLink}
              to="/deliveries"
              color="neutral"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={loading}
              startDecorator={<SaveIcon />}
            >
              {isEditMode ? 'Update Delivery' : 'Create Delivery'}
            </Button>
          </Box>
        </Stack>
      </Sheet>
      
      {/* Modal for request being processed by another user */}
      <Modal open={processingModal} onClose={() => setProcessingModal(false)}>
        <ModalDialog variant="outlined" role="alertdialog">
          <ModalClose onClick={handleCancelProcessing} />
          <Typography
            component="h2"
            level="title-lg"
            startDecorator={<ErrorOutlineIcon />}
          >
            Request Already Being Processed
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Typography level="body-md" mb={2}>
            This request is currently being processed by <b>{processingUser?.username || 'another user'}</b>.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button variant="solid" color="primary" onClick={handleCancelProcessing}>
              Go Back
            </Button>
          </Box>
        </ModalDialog>
      </Modal>
    </Box>
  )
}

export default DeliveryForm 