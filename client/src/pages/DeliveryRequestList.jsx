import { useState, useEffect } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'

// Joy UI components
import Box from '@mui/joy/Box'
import Button from '@mui/joy/Button'
import Typography from '@mui/joy/Typography'
import IconButton from '@mui/joy/IconButton'
import Chip from '@mui/joy/Chip'
import CircularProgress from '@mui/joy/CircularProgress'
import FormControl from '@mui/joy/FormControl'
import Input from '@mui/joy/Input'
import Select from '@mui/joy/Select'
import Option from '@mui/joy/Option'
import Alert from '@mui/joy/Alert'
import Tooltip from '@mui/joy/Tooltip'
import Modal from '@mui/joy/Modal'
import ModalDialog from '@mui/joy/ModalDialog'
import ModalClose from '@mui/joy/ModalClose'
import Textarea from '@mui/joy/Textarea'
import Tabs from '@mui/joy/Tabs'
import TabList from '@mui/joy/TabList'
import Tab from '@mui/joy/Tab'
import Card from '@mui/joy/Card'
import CardContent from '@mui/joy/CardContent'
import Divider from '@mui/joy/Divider'
import Table from '@mui/joy/Table'
import Sheet from '@mui/joy/Sheet'
import ButtonGroup from '@mui/joy/ButtonGroup'
import Stack from '@mui/joy/Stack'
import FormLabel from '@mui/joy/FormLabel'

// Icons
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import SearchIcon from '@mui/icons-material/Search'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import InfoIcon from '@mui/icons-material/Info'
import RefreshIcon from '@mui/icons-material/Refresh'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import VisibilityIcon from '@mui/icons-material/Visibility'
import SortIcon from '@mui/icons-material/Sort'
import PersonIcon from '@mui/icons-material/Person'
import StoreIcon from '@mui/icons-material/Store'
import ShoppingCartCheckoutIcon from '@mui/icons-material/ShoppingCartCheckout'
import FilterListIcon from '@mui/icons-material/FilterList'
import NoteIcon from '@mui/icons-material/Note'

const DeliveryRequestList = () => {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [filteredRequests, setFilteredRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [newStatus, setNewStatus] = useState('approved')
  const [rejectionReason, setRejectionReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [branches, setBranches] = useState([])
  const [branchFilter, setBranchFilter] = useState(user?.role === 'branch' ? user?.branch_id : 'all')
  const [loadingBranches, setLoadingBranches] = useState(false)
  const navigate = useNavigate()

  const isBranchUser = user?.role === 'branch'
  const isWarehouseUser = user?.role === 'warehouse'
  const isAdmin = user?.role === 'admin'
  const canApproveRequests = isWarehouseUser || isAdmin

  // Fetch branches
  const fetchBranches = async () => {
    try {
      setLoadingBranches(true)
      const response = await axios.get('/api/branches')
      setBranches(response.data)
      setLoadingBranches(false)
    } catch (err) {
      console.error('Error fetching branches:', err)
    }
  }
  
  // Fetch delivery requests
  const fetchRequests = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/delivery-requests')
      setRequests(response.data)
      setFilteredRequests(response.data)
      setError(null)
    } catch (err) {
      console.error('Error fetching delivery requests:', err)
      setError('Failed to load delivery requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
    fetchBranches()
  }, [])

  // Filter requests by search term, status, priority, and branch
  useEffect(() => {
    let result = requests

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(request => request.request_status === statusFilter)
    }

    // Apply priority filter
    if (priorityFilter !== 'all') {
      result = result.filter(request => request.priority === priorityFilter)
    }
    
    // Apply branch filter
    if (branchFilter !== 'all') {
      const branchId = parseInt(branchFilter)
      result = result.filter(request => request.branch_id === branchId)
    }

    // Apply search filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase()
      result = result.filter(
        request =>
          (request.items?.some(item => 
            item.description?.toLowerCase().includes(lowerSearchTerm) ||
            item.item_code?.toLowerCase().includes(lowerSearchTerm)
          )) ||
          request.branch_name?.toLowerCase().includes(lowerSearchTerm) ||
          String(request.id).includes(lowerSearchTerm)
      )
    }

    setFilteredRequests(result)
  }, [requests, searchTerm, statusFilter, priorityFilter, branchFilter])

  // Handle request deletion
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this request?')) {
      try {
        await axios.delete(`/api/delivery-requests/${id}`)
        // Update state to remove deleted request
        setRequests(requests.filter(request => request.id !== id))
      } catch (err) {
        console.error('Error deleting request:', err)
        alert('Failed to delete request: ' + err.response?.data?.error || 'Unknown error')
      }
    }
  }

  // Open status modal for approval
  const openApproveModal = (request) => {
    setSelectedRequest(request)
    setNewStatus('approved')
    setRejectionReason('')
    setStatusModalOpen(true)
  }
  
  // Open status modal for rejection
  const openRejectModal = (request) => {
    setSelectedRequest(request)
    setNewStatus('rejected')
    setRejectionReason('')
    setStatusModalOpen(true)
  }

  // Open details modal
  const openDetailsModal = (request) => {
    setSelectedRequest(request)
    setDetailsModalOpen(true)
  }

  // Update request status
  const updateRequestStatus = async () => {
    if (!selectedRequest) return

    try {
      setActionLoading(true)
      
      // Validation for rejected status
      if (newStatus === 'rejected' && !rejectionReason.trim()) {
        alert('Please provide a reason for rejection')
        return
      }

      const response = await axios.put(`/api/delivery-requests/${selectedRequest.id}/status`, {
        request_status: newStatus,
        reason: newStatus === 'rejected' ? rejectionReason : null
      })

      // Update the request in the state
      setRequests(requests.map(req => 
        req.id === selectedRequest.id ? response.data : req
      ))

      setStatusModalOpen(false)
    } catch (err) {
      console.error('Error updating request status:', err)
      
      // Handle the case where request was already processed
      if (err.response?.status === 409) {
        alert(err.response.data.error || 'This request has already been processed by another user')
      } else {
        alert('Failed to update status: ' + err.response?.data?.error || 'Unknown error')
      }
    } finally {
      setActionLoading(false)
    }
  }

  // Render status chip with appropriate color
  const renderStatusChip = (status) => {
    let color = 'neutral'
    if (status === 'approved') color = 'success'
    if (status === 'pending') color = 'warning'
    if (status === 'rejected') color = 'danger'
    if (status === 'processing') color = 'primary'
    if (status === 'delivered') color = 'success'

    return (
      <Chip
        size="sm"
        variant="soft"
        color={color}
        sx={{ textTransform: 'capitalize' }}
      >
        {status}
      </Chip>
    )
  }

  const renderPriorityChip = (priority) => {
    let color = 'neutral'
    if (priority === 'high') color = 'danger'
    if (priority === 'medium') color = 'warning'
    if (priority === 'low') color = 'success'

    return (
      <Chip
        size="sm"
        variant="soft"
        color={color}
        sx={{ textTransform: 'capitalize' }}
      >
        {priority}
      </Chip>
    )
  }

  // Get count of requests by status
  const getCountByStatus = (status) => {
    if (status === 'all') return requests.length
    return requests.filter(req => req.request_status === status).length
  }
  
  // Get the first item description for a request
  const getFirstItemDescription = (request) => {
    if (!request.items || request.items.length === 0) {
      return 'No items';
    }
    return request.items[0].description;
  }

  // Add function to process delivery
  const handleProcessDelivery = (request) => {
    navigate(`/deliveries/new?requestId=${request.id}`)
  }
  
  // Get branch name by id
  const getBranchName = (branchId) => {
    if (branchId === 'all') return 'All Branches'
    const branch = branches.find(b => b.id === parseInt(branchId))
    return branch ? branch.name : 'Unknown Branch'
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert color="danger">{error}</Alert>
        <Button
          onClick={() => window.location.reload()}
          sx={{ mt: 2 }}
        >
          Retry
        </Button>
      </Box>
    )
  }

  return (
    <Box sx={{ py: 2 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Sheet
            variant="soft"
            color="neutral"
            sx={{ 
              p: 1.5, 
              borderRadius: 'sm', 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <InfoIcon fontSize="large" />
          </Sheet>
          <Typography level="h4">Delivery Requests</Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startDecorator={<RefreshIcon />}
            onClick={fetchRequests}
          >
            Refresh
          </Button>
          
          {isBranchUser && (
            <Button
              component={RouterLink}
              to="/delivery-requests/new"
              startDecorator={<AddIcon />}
            >
              New Request
            </Button>
          )}
        </Box>
      </Box>

      {/* Filters */}
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          alignItems: { sm: 'center' },
          justifyContent: 'space-between',
          p: 2,
          borderRadius: 'sm',
          bgcolor: 'background.level1',
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Input
            placeholder="Search by ID, branch, or requester..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            startDecorator={<SearchIcon />}
            sx={{ width: '100%' }}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Branch Filter */}
          {(isWarehouseUser || isAdmin) && (
            <FormControl size="sm">
              <FormLabel>Branch</FormLabel>
              <Select
                value={branchFilter}
                onChange={(e, value) => setBranchFilter(value)}
                startDecorator={<StoreIcon />}
                placeholder="All Branches"
                sx={{ minWidth: 150 }}
              >
                <Option value="all">All Branches</Option>
                {branches.map(branch => (
                  <Option key={branch.id} value={branch.id}>{branch.name}</Option>
                ))}
              </Select>
            </FormControl>
          )}
          
          <FormControl size="sm">
            <FormLabel>Priority</FormLabel>
            <Select
              value={priorityFilter}
              onChange={(e, value) => setPriorityFilter(value)}
              startDecorator={<SortIcon />}
              placeholder="All Priorities"
              sx={{ minWidth: 150 }}
            >
              <Option value="all">All Priorities</Option>
              <Option value="low">Low</Option>
              <Option value="medium">Medium</Option>
              <Option value="high">High</Option>
            </Select>
          </FormControl>
          
          <Typography level="body-sm">
            {filteredRequests.length} request{filteredRequests.length !== 1 ? 's' : ''} found
          </Typography>
        </Box>
      </Box>

      {/* Status Tabs */}
      <Tabs 
        value={statusFilter} 
        onChange={(e, value) => setStatusFilter(value)}
        sx={{ mb: 3 }}
      >
        <TabList>
          <Tab value="all">
            All Requests
            <Chip size="sm" variant="soft" sx={{ ml: 1 }}>{getCountByStatus('all')}</Chip>
          </Tab>
          <Tab value="pending">
            Pending
          </Tab>
          <Tab value="processing">
            Processing
            <Chip size="sm" variant="soft" color="primary" sx={{ ml: 1 }}>{getCountByStatus('processing')}</Chip>
          </Tab>
          <Tab value="delivered">
            Delivered
          </Tab>
          <Tab value="rejected">
            Rejected
          </Tab>
        </TabList>
      </Tabs>

      {/* Requests Cards */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {filteredRequests.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center', bgcolor: 'background.level1', borderRadius: 'sm' }}>
            <Typography level="body-lg">No delivery requests found</Typography>
          </Box>
        ) : (
          <Stack spacing={2}>
            {filteredRequests.map((request) => (
              <Card key={request.id} variant="outlined" sx={{ position: 'relative' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography level="title-md">
                        #{request.id}
                      </Typography>
                      {renderStatusChip(request.request_status)}
                      {renderPriorityChip(request.priority)}
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {/* Add Process Delivery button for warehouse users on approved requests */}
                      {canApproveRequests && request.request_status === 'approved' && (
                        <Button
                          size="sm"
                          color="primary"
                          variant="soft"
                          startDecorator={<ShoppingCartCheckoutIcon />}
                          onClick={() => handleProcessDelivery(request)}
                        >
                          Process Delivery
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="outlined"
                        startDecorator={<VisibilityIcon />}
                        onClick={() => openDetailsModal(request)}
                      >
                        View Details
                      </Button>
                      
                      {canApproveRequests && request.request_status === 'pending' && (
                        <ButtonGroup size="sm">
                          <Button
                            color="success"
                            startDecorator={<CheckCircleIcon />}
                            onClick={() => openApproveModal(request)}
                          >
                            Approve
                          </Button>
                          <Button
                            color="danger"
                            startDecorator={<CancelIcon />}
                            onClick={() => openRejectModal(request)}
                          >
                            Reject
                          </Button>
                        </ButtonGroup>
                      )}
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <StoreIcon fontSize="small" />
                      <Typography level="body-sm">Branch: {request.branch_name || 'STRONGFIX BOLTS AND NUTS CENTER'}</Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon fontSize="small" />
                      <Typography level="body-sm">Requested by: {request.requested_by || request.username || 'Branch User'}</Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccessTimeIcon fontSize="small" />
                      <Typography level="body-sm">Created: {new Date(request.created_at).toLocaleString()}</Typography>
                      <CalendarTodayIcon fontSize="small" sx={{ ml: 1 }} />
                      <Typography level="body-sm">
                        Delivery: {request.delivery_date ? new Date(request.delivery_date).toLocaleString() : 'Not specified'}
                      </Typography>
                    </Box>
                    
                    <Typography level="body-sm" sx={{ mt: 1 }}>
                      {request.items?.length || 0} item{request.items?.length !== 1 ? 's' : ''} • 
                      Total: ₱{parseFloat(request.total_amount || 0).toFixed(2)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </Box>

      {/* Status Update Modal */}
      <Modal open={statusModalOpen} onClose={() => setStatusModalOpen(false)}>
        <ModalDialog>
          <ModalClose />
          <Typography level="title-lg">
            {newStatus === 'approved' ? 'Approve Request' : 'Reject Request'}
          </Typography>
          
          <Typography level="body-sm" sx={{ mb: 2 }}>
            {newStatus === 'approved' 
              ? `Approve request #${selectedRequest?.id} from ${selectedRequest?.branch_name}?`
              : `Reject request #${selectedRequest?.id} from ${selectedRequest?.branch_name}?`
            }
          </Typography>
          
          {newStatus === 'rejected' && (
            <FormControl sx={{ mb: 2 }}>
              <Typography level="body-sm" color="danger">
                Please provide a reason for rejection
              </Typography>
              <Textarea
                placeholder="Please provide a reason for rejection"
                minRows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                required
                color="danger"
              />
            </FormControl>
          )}
          
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
            <Button
              variant="outlined"
              color="neutral"
              onClick={() => setStatusModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={updateRequestStatus}
              loading={actionLoading}
              startDecorator={newStatus === 'approved' ? <CheckCircleIcon /> : <CancelIcon />}
              color={newStatus === 'approved' ? 'success' : 'danger'}
            >
              {newStatus === 'approved' ? 'Approve' : 'Reject'}
            </Button>
          </Box>
        </ModalDialog>
      </Modal>

      {/* Request Details Modal */}
      <Modal open={detailsModalOpen} onClose={() => setDetailsModalOpen(false)}>
        <ModalDialog size="lg">
          <ModalClose />
          <Typography level="title-lg">
            Request Details
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, my: 2 }}>
            <Box>
              <Typography level="body-sm" color="neutral">Request ID</Typography>
              <Typography level="body-md">{selectedRequest?.id}</Typography>
            </Box>
            <Box>
              <Typography level="body-sm" color="neutral">Status</Typography>
              {selectedRequest && renderStatusChip(selectedRequest.request_status)}
            </Box>
            
            <Box>
              <Typography level="body-sm" color="neutral">Branch</Typography>
              <Typography level="body-md">{selectedRequest?.branch_name || 'STRONGFIX BOLTS AND NUTS CENTER'}</Typography>
            </Box>
            <Box>
              <Typography level="body-sm" color="neutral">Priority</Typography>
              {selectedRequest && renderPriorityChip(selectedRequest.priority || 'medium')}
            </Box>
            
            <Box>
              <Typography level="body-sm" color="neutral">Requested By</Typography>
              <Typography level="body-md">{selectedRequest?.requested_by || selectedRequest?.username || 'Branch User'}</Typography>
            </Box>
            <Box>
              <Typography level="body-sm" color="neutral">Delivery Date</Typography>
              <Typography level="body-md">
                {selectedRequest?.delivery_date ? new Date(selectedRequest.delivery_date).toLocaleString() : 'Not specified'}
              </Typography>
            </Box>
            
            <Box>
              <Typography level="body-sm" color="neutral">Created At</Typography>
              <Typography level="body-md">{selectedRequest ? new Date(selectedRequest.created_at).toLocaleString() : ''}</Typography>
            </Box>
            <Box>
              <Typography level="body-sm" color="neutral">Total Amount</Typography>
              <Typography level="body-md">₱{selectedRequest ? parseFloat(selectedRequest.total_amount || 0).toFixed(2) : '0.00'}</Typography>
            </Box>
          </Box>
          
          {selectedRequest && selectedRequest.notes && (
            <Box sx={{ my: 2, p: 2, bgcolor: 'background.level1', borderRadius: 'sm' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <NoteIcon fontSize="small" />
                <Typography level="body-sm" fontWeight="bold">Notes</Typography>
              </Box>
              <Typography level="body-md">{selectedRequest.notes}</Typography>
            </Box>
          )}
          
          {selectedRequest && selectedRequest.request_status === 'approved' && (
            <Box sx={{ my: 2, p: 2, bgcolor: 'success.softBg', borderRadius: 'sm' }}>
              <Typography level="body-sm">
                Approved by {selectedRequest.processor_username || 'Admin'} on {new Date(selectedRequest.updated_at).toLocaleString()}
              </Typography>
            </Box>
          )}
          
          {selectedRequest && selectedRequest.request_status === 'rejected' && (
            <Box sx={{ my: 2, p: 2, bgcolor: 'danger.softBg', borderRadius: 'sm' }}>
              {selectedRequest.processor_username && (
                <Typography level="body-sm" color="danger" fontWeight="medium" sx={{ mb: 1 }}>
                  Rejected by {selectedRequest.processor_username} on {new Date(selectedRequest.updated_at).toLocaleString()}
                </Typography>
              )}
              {selectedRequest.reason && (
                <Typography level="body-sm" color="danger">
                  Reason: {selectedRequest.reason}
                </Typography>
              )}
            </Box>
          )}
          
          <Typography level="title-md" sx={{ mt: 3, mb: 2 }}>
            Items
          </Typography>
          
          <Table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Unit</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {selectedRequest?.items?.map(item => (
                <tr key={item.id}>
                  <td>{item.description || ''}</td>
                  <td>{item.quantity || 0}</td>
                  <td>{item.unit || 'pcs'}</td>
                  <td>₱{parseFloat(item.unit_price || 0).toFixed(2)}</td>
                  <td>₱{parseFloat(item.subtotal || 0).toFixed(2)}</td>
                </tr>
              ))}
              {(!selectedRequest?.items || selectedRequest.items.length === 0) && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center' }}>No items found</td>
                </tr>
              )}
            </tbody>
          </Table>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
            {canApproveRequests && selectedRequest?.request_status === 'pending' && (
              <Box sx={{ display: 'flex', gap: 1, mr: 'auto' }}>
                <Button
                  color="success"
                  startDecorator={<CheckCircleIcon />}
                  onClick={() => {
                    setDetailsModalOpen(false);
                    setNewStatus('approved');
                    setStatusModalOpen(true);
                  }}
                >
                  Approve
                </Button>
                <Button
                  color="danger"
                  startDecorator={<CancelIcon />}
                  onClick={() => {
                    setDetailsModalOpen(false);
                    setNewStatus('rejected');
                    setStatusModalOpen(true);
                  }}
                >
                  Reject
                </Button>
              </Box>
            )}
            <Button
              variant="outlined"
              color="neutral"
              onClick={() => setDetailsModalOpen(false)}
            >
              Close
            </Button>
          </Box>
        </ModalDialog>
      </Modal>
    </Box>
  )
}

export default DeliveryRequestList 