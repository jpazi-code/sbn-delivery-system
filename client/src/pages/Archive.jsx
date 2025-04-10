import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'

// Joy UI components
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import Sheet from '@mui/joy/Sheet'
import Table from '@mui/joy/Table'
import Button from '@mui/joy/Button'
import CircularProgress from '@mui/joy/CircularProgress'
import Alert from '@mui/joy/Alert'
import Select from '@mui/joy/Select'
import Option from '@mui/joy/Option'
import Input from '@mui/joy/Input'
import FormControl from '@mui/joy/FormControl'
import FormLabel from '@mui/joy/FormLabel'
import Card from '@mui/joy/Card'
import CardContent from '@mui/joy/CardContent'
import Divider from '@mui/joy/Divider'
import Chip from '@mui/joy/Chip'
import IconButton from '@mui/joy/IconButton'
import Tooltip from '@mui/joy/Tooltip'
import Grid from '@mui/joy/Grid'
import Tab from '@mui/joy/Tab'
import TabList from '@mui/joy/TabList'
import Tabs from '@mui/joy/Tabs'
import TabPanel from '@mui/joy/TabPanel'
import Modal from '@mui/joy/Modal'
import ModalDialog from '@mui/joy/ModalDialog'
import ModalClose from '@mui/joy/ModalClose'

// Icons
import SearchIcon from '@mui/icons-material/Search'
import FilterAltIcon from '@mui/icons-material/FilterAlt'
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff'
import RefreshIcon from '@mui/icons-material/Refresh'
import VisibilityIcon from '@mui/icons-material/Visibility'
import ArchiveIcon from '@mui/icons-material/Archive'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PendingIcon from '@mui/icons-material/Pending'
import WarehouseIcon from '@mui/icons-material/Warehouse'
import InfoIcon from '@mui/icons-material/Info'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import ArticleIcon from '@mui/icons-material/Article'

const Archive = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [activeTab, setActiveTab] = useState(0)
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Deliveries state
  const [deliveries, setDeliveries] = useState([])
  const [filteredDeliveries, setFilteredDeliveries] = useState([])
  const [deliverySearchTerm, setDeliverySearchTerm] = useState('')
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState('all')
  const [selectedDelivery, setSelectedDelivery] = useState(null)
  const [deliveryDetailsOpen, setDeliveryDetailsOpen] = useState(false)
  
  // Requests state
  const [requests, setRequests] = useState([])
  const [filteredRequests, setFilteredRequests] = useState([])
  const [requestSearchTerm, setRequestSearchTerm] = useState('')
  const [requestStatusFilter, setRequestStatusFilter] = useState('all')
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [requestDetailsOpen, setRequestDetailsOpen] = useState(false)
  
  const [selectedBranch, setSelectedBranch] = useState(user?.role === 'branch' ? user?.branch_id : 'all')
  const [dateRangeFilter, setDateRangeFilter] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  
  const isAdmin = user?.role === 'admin'
  const isBranch = user?.role === 'branch'
  const isWarehouse = user?.role === 'warehouse'
  
  // Redirect if not authorized
  useEffect(() => {
    if (!user || (!isAdmin && !isBranch && !isWarehouse)) {
      navigate('/')
    }
    
    // If branch user, set their branch as selected
    if (isBranch && user?.branch_id) {
      setSelectedBranch(user.branch_id)
    }
  }, [user, isAdmin, isBranch, isWarehouse, navigate])
  
  // Load branches (for admin to select)
  useEffect(() => {
    const fetchBranches = async () => {
      if (!isAdmin && !isWarehouse) return // Only admin and warehouse need to fetch branches
      
      try {
        const response = await axios.get('/api/branches')
        setBranches(response.data)
      } catch (err) {
        console.error('Error fetching branches:', err)
        setError('Failed to load branches')
      }
    }
    
    fetchBranches()
  }, [isAdmin, isWarehouse])
  
  // Fetch archive data when selectedBranch changes
  useEffect(() => {
    fetchArchiveData()
  }, [selectedBranch, dateRangeFilter, startDate, endDate])
  
  // Fetch all archive data
  const fetchArchiveData = async () => {
    setLoading(true)
    
    try {
      await Promise.all([
        fetchArchivedDeliveries(),
        fetchArchivedRequests()
      ])
    } catch (err) {
      console.error('Error fetching archive data:', err)
      setError('Failed to load archive data')
    } finally {
      setLoading(false)
    }
  }
  
  // Fetch archived deliveries
  const fetchArchivedDeliveries = async () => {
    try {
      let params = {
        archived: true
      }
      
      // For branch users, always use their branch_id
      if (isBranch) {
        params.branch_id = user.branch_id
      } else if ((isAdmin || isWarehouse) && selectedBranch !== 'all') {
        params.branch_id = selectedBranch
      }
      
      // Apply date range filter if selected
      if (dateRangeFilter === 'custom' && startDate && endDate) {
        params.start_date = startDate
        params.end_date = endDate
      } else if (dateRangeFilter !== 'all') {
        params.date_range = dateRangeFilter
      }
      
      const response = await axios.get('/api/deliveries/archive', { params })
      
      setDeliveries(response.data)
      setFilteredDeliveries(response.data)
    } catch (err) {
      console.error('Error fetching archived deliveries:', err)
      setError('Failed to load archived deliveries')
    }
  }
  
  // Fetch archived requests
  const fetchArchivedRequests = async () => {
    try {
      let params = {
        archived: true
      }
      
      // For branch users, always use their branch_id
      if (isBranch) {
        params.branch_id = user.branch_id
      } else if ((isAdmin || isWarehouse) && selectedBranch !== 'all') {
        params.branch_id = selectedBranch
      }
      
      // Apply date range filter if selected
      if (dateRangeFilter === 'custom' && startDate && endDate) {
        params.start_date = startDate
        params.end_date = endDate
      } else if (dateRangeFilter !== 'all') {
        params.date_range = dateRangeFilter
      }
      
      const response = await axios.get('/api/delivery-requests/archive', { params })
      
      setRequests(response.data)
      setFilteredRequests(response.data)
    } catch (err) {
      console.error('Error fetching archived requests:', err)
      setError('Failed to load archived requests')
    }
  }
  
  // Filter deliveries when search term or status filter changes
  useEffect(() => {
    let result = deliveries
    
    // Apply status filter
    if (deliveryStatusFilter !== 'all') {
      result = result.filter(delivery => delivery.status === deliveryStatusFilter)
    }
    
    // Apply search filter
    if (deliverySearchTerm) {
      const lowerSearchTerm = deliverySearchTerm.toLowerCase()
      result = result.filter(
        delivery =>
          (delivery.tracking_number && delivery.tracking_number.toLowerCase().includes(lowerSearchTerm)) ||
          (delivery.recipient_name && delivery.recipient_name.toLowerCase().includes(lowerSearchTerm)) ||
          (delivery.recipient_address && delivery.recipient_address.toLowerCase().includes(lowerSearchTerm)) ||
          (delivery.branch_name && delivery.branch_name.toLowerCase().includes(lowerSearchTerm)) ||
          (delivery.package_description && delivery.package_description.toLowerCase().includes(lowerSearchTerm))
      )
    }
    
    setFilteredDeliveries(result)
  }, [deliverySearchTerm, deliveryStatusFilter, deliveries])
  
  // Filter requests when search term or status filter changes
  useEffect(() => {
    let result = requests
    
    // Apply status filter
    if (requestStatusFilter !== 'all') {
      result = result.filter(request => request.request_status === requestStatusFilter)
    }
    
    // Apply search filter
    if (requestSearchTerm) {
      const lowerSearchTerm = requestSearchTerm.toLowerCase()
      result = result.filter(
        request =>
          (request.id && request.id.toString().includes(lowerSearchTerm)) ||
          (request.branch_name && request.branch_name.toLowerCase().includes(lowerSearchTerm)) ||
          (request.requested_by && request.requested_by.toLowerCase().includes(lowerSearchTerm)) ||
          (request.notes && request.notes.toLowerCase().includes(lowerSearchTerm))
      )
    }
    
    setFilteredRequests(result)
  }, [requestSearchTerm, requestStatusFilter, requests])
  
  // Handle branch change (admin only)
  const handleBranchChange = (event, newValue) => {
    setSelectedBranch(newValue)
  }
  
  // Handle date range filter change
  const handleDateRangeChange = (event, newValue) => {
    setDateRangeFilter(newValue)
  }
  
  // View delivery details
  const handleViewDeliveryDetails = (delivery) => {
    setSelectedDelivery(delivery)
    setDeliveryDetailsOpen(true)
  }
  
  // View request details
  const handleViewRequestDetails = (request) => {
    setSelectedRequest(request)
    setRequestDetailsOpen(true)
  }
  
  // Reset all filters
  const resetFilters = () => {
    setDeliverySearchTerm('')
    setDeliveryStatusFilter('all')
    setRequestSearchTerm('')
    setRequestStatusFilter('all')
    setDateRangeFilter('all')
    setStartDate('')
    setEndDate('')
  }
  
  // Render status chip
  const renderStatusChip = (status) => {
    let color, icon
    
    switch (status) {
      case 'delivered':
        color = 'success'
        icon = <CheckCircleIcon />
        break
      case 'in_transit':
        color = 'primary'
        icon = <LocalShippingIcon />
        break
      case 'pending':
        color = 'warning'
        icon = <PendingIcon />
        break
      case 'preparing':
      case 'loading':
        color = 'neutral'
        icon = <WarehouseIcon />
        break
      case 'cancelled':
      case 'rejected':
        color = 'danger'
        icon = <InfoIcon />
        break
      case 'completed':
      case 'approved':
        color = 'success'
        icon = <CheckCircleIcon />
        break
      case 'processing':
        color = 'primary'
        icon = <WarehouseIcon />
        break
      default:
        color = 'neutral'
        icon = <InfoIcon />
    }
    
    return (
      <Chip
        color={color}
        variant="soft"
        startDecorator={icon}
        size="sm"
        sx={{ textTransform: 'capitalize' }}
      >
        {status?.replace('_', ' ')}
      </Chip>
    )
  }
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified'
    
    return new Date(dateString).toLocaleString()
  }
  
  // Format currency
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '₱0.00'
    return `₱${Number(amount).toFixed(2)}`
  }
  
  // Format priority chip
  const renderPriorityChip = (priority) => {
    let color = 'neutral'
    
    switch (priority) {
      case 'high':
        color = 'danger'
        break
      case 'medium':
        color = 'warning'
        break
      case 'low':
        color = 'neutral'
        break
      default:
        color = 'neutral'
    }
    
    return (
      <Chip
        color={color}
        variant="soft"
        size="sm"
        sx={{ textTransform: 'capitalize' }}
      >
        {priority}
      </Chip>
    )
  }
  
  return (
    <Box sx={{ py: 2 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Sheet
            variant="soft"
            color="primary"
            sx={{ 
              p: 1.5, 
              borderRadius: 'sm', 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ArchiveIcon fontSize="large" />
          </Sheet>
          <Typography level="h4">Archive</Typography>
        </Box>
        <Button
          startDecorator={<RefreshIcon />}
          onClick={fetchArchiveData}
          variant="outlined"
        >
          Refresh
        </Button>
      </Box>
      
      {error && (
        <Alert color="danger" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography level="title-md" sx={{ mb: 2 }}>Filters</Typography>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            {(isAdmin || isWarehouse) && (
              <Grid xs={12} sm={4} md={3}>
                <FormControl>
                  <FormLabel>Branch</FormLabel>
                  <Select
                    value={selectedBranch}
                    onChange={handleBranchChange}
                    placeholder="Select branch"
                  >
                    <Option value="all">All Branches</Option>
                    {branches.map((branch) => (
                      <Option key={branch.id} value={branch.id}>
                        {branch.name}
                      </Option>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            <Grid xs={12} sm={4} md={3}>
              <FormControl>
                <FormLabel>Date Range</FormLabel>
                <Select
                  value={dateRangeFilter}
                  onChange={handleDateRangeChange}
                >
                  <Option value="all">All Time</Option>
                  <Option value="today">Today</Option>
                  <Option value="last_7_days">Last 7 Days</Option>
                  <Option value="last_30_days">Last 30 Days</Option>
                  <Option value="last_90_days">Last 90 Days</Option>
                  <Option value="custom">Custom Range</Option>
                </Select>
              </FormControl>
            </Grid>
            {dateRangeFilter === 'custom' && (
              <>
                <Grid xs={12} sm={6} md={3}>
                  <FormControl>
                    <FormLabel>Start Date</FormLabel>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </FormControl>
                </Grid>
                <Grid xs={12} sm={6} md={3}>
                  <FormControl>
                    <FormLabel>End Date</FormLabel>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </FormControl>
                </Grid>
              </>
            )}
          </Grid>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              startDecorator={<FilterAltOffIcon />}
              variant="soft"
              color="neutral"
              onClick={resetFilters}
            >
              Reset Filters
            </Button>
          </Box>
        </CardContent>
      </Card>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Tabs
          aria-label="Archive tabs"
          value={activeTab}
          onChange={(event, value) => setActiveTab(value)}
          sx={{ bgcolor: 'background.body' }}
        >
          <TabList sx={{ mb: 2 }}>
            <Tab startDecorator={<LocalShippingIcon />}>Deliveries</Tab>
            <Tab startDecorator={<ArticleIcon />}>Delivery Requests</Tab>
          </TabList>
          
          <TabPanel value={0}>
            <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <FormControl sx={{ minWidth: 200 }}>
                <FormLabel>Search Deliveries</FormLabel>
                <Input
                  placeholder="Search by tracking #, recipient..."
                  startDecorator={<SearchIcon />}
                  value={deliverySearchTerm}
                  onChange={(e) => setDeliverySearchTerm(e.target.value)}
                />
              </FormControl>
              <FormControl sx={{ minWidth: 120 }}>
                <FormLabel>Status Filter</FormLabel>
                <Select
                  value={deliveryStatusFilter}
                  onChange={(e, newValue) => setDeliveryStatusFilter(newValue)}
                  startDecorator={<FilterAltIcon />}
                >
                  <Option value="all">All Statuses</Option>
                  <Option value="delivered">Delivered</Option>
                  <Option value="cancelled">Cancelled</Option>
                </Select>
              </FormControl>
            </Box>
            
            {filteredDeliveries.length === 0 ? (
              <Alert color="neutral" sx={{ my: 2 }}>
                No archived deliveries found.
              </Alert>
            ) : (
              <Sheet sx={{ borderRadius: 'md', overflow: 'auto' }}>
                <Table sx={{ '& th': { textAlign: 'left', py: 1 } }}>
                  <thead>
                    <tr>
                      <th>Tracking #</th>
                      <th>Recipient</th>
                      <th>Branch</th>
                      <th>Status</th>
                      <th>Created At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDeliveries.map((delivery) => (
                      <tr key={delivery.id}>
                        <td>{delivery.tracking_number || 'N/A'}</td>
                        <td>{delivery.recipient_name || 'N/A'}</td>
                        <td>{delivery.branch_name || 'N/A'}</td>
                        <td>{renderStatusChip(delivery.status)}</td>
                        <td>{formatDate(delivery.created_at)}</td>
                        <td>
                          <Tooltip title="View Details">
                            <IconButton
                              size="sm"
                              variant="plain"
                              color="primary"
                              onClick={() => handleViewDeliveryDetails(delivery)}
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Sheet>
            )}
          </TabPanel>
          
          <TabPanel value={1}>
            <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <FormControl sx={{ minWidth: 200 }}>
                <FormLabel>Search Requests</FormLabel>
                <Input
                  placeholder="Search by ID, branch name..."
                  startDecorator={<SearchIcon />}
                  value={requestSearchTerm}
                  onChange={(e) => setRequestSearchTerm(e.target.value)}
                />
              </FormControl>
              <FormControl sx={{ minWidth: 120 }}>
                <FormLabel>Status Filter</FormLabel>
                <Select
                  value={requestStatusFilter}
                  onChange={(e, newValue) => setRequestStatusFilter(newValue)}
                  startDecorator={<FilterAltIcon />}
                >
                  <Option value="all">All Statuses</Option>
                  <Option value="delivered">Delivered</Option>
                  <Option value="rejected">Rejected</Option>
                  <Option value="cancelled">Cancelled</Option>
                </Select>
              </FormControl>
            </Box>
            
            {filteredRequests.length === 0 ? (
              <Alert color="neutral" sx={{ my: 2 }}>
                No archived requests found.
              </Alert>
            ) : (
              <Sheet sx={{ borderRadius: 'md', overflow: 'auto' }}>
                <Table sx={{ '& th': { textAlign: 'left', py: 1 } }}>
                  <thead>
                    <tr>
                      <th>Request ID</th>
                      <th>Branch</th>
                      <th>Status</th>
                      <th>Priority</th>
                      <th>Total Amount</th>
                      <th>Created At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((request) => (
                      <tr key={request.id}>
                        <td>#{request.id}</td>
                        <td>{request.branch_name || 'N/A'}</td>
                        <td>{renderStatusChip(request.request_status)}</td>
                        <td>{renderPriorityChip(request.priority)}</td>
                        <td>{formatCurrency(request.total_amount)}</td>
                        <td>{formatDate(request.created_at)}</td>
                        <td>
                          <Tooltip title="View Details">
                            <IconButton
                              size="sm"
                              variant="plain"
                              color="primary"
                              onClick={() => handleViewRequestDetails(request)}
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Sheet>
            )}
          </TabPanel>
        </Tabs>
      )}
      
      {/* Delivery Details Modal */}
      {selectedDelivery && (
        <Modal open={deliveryDetailsOpen} onClose={() => setDeliveryDetailsOpen(false)}>
          <ModalDialog size="lg">
            <ModalClose />
            <Typography level="h5" sx={{ mb: 2 }}>
              Delivery Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid xs={12} sm={6}>
                <Typography level="title-md">Tracking Number</Typography>
                <Typography>{selectedDelivery.tracking_number || 'N/A'}</Typography>
              </Grid>
              <Grid xs={12} sm={6}>
                <Typography level="title-md">Status</Typography>
                <Box>{renderStatusChip(selectedDelivery.status)}</Box>
              </Grid>
              <Grid xs={12} sm={6}>
                <Typography level="title-md">Recipient</Typography>
                <Typography>{selectedDelivery.recipient_name || 'N/A'}</Typography>
              </Grid>
              <Grid xs={12} sm={6}>
                <Typography level="title-md">Branch</Typography>
                <Typography>{selectedDelivery.branch_name || 'N/A'}</Typography>
              </Grid>
              <Grid xs={12}>
                <Typography level="title-md">Address</Typography>
                <Typography>{selectedDelivery.recipient_address || 'N/A'}</Typography>
              </Grid>
              <Grid xs={12} sm={6}>
                <Typography level="title-md">Phone</Typography>
                <Typography>{selectedDelivery.recipient_phone || 'N/A'}</Typography>
              </Grid>
              <Grid xs={12} sm={6}>
                <Typography level="title-md">Weight</Typography>
                <Typography>{selectedDelivery.weight ? `${selectedDelivery.weight} kg` : 'N/A'}</Typography>
              </Grid>
              <Grid xs={12}>
                <Typography level="title-md">Package Description</Typography>
                <Typography>{selectedDelivery.package_description || 'No description provided'}</Typography>
              </Grid>
              <Grid xs={12} sm={6}>
                <Typography level="title-md">Created At</Typography>
                <Typography>{formatDate(selectedDelivery.created_at)}</Typography>
              </Grid>
              <Grid xs={12} sm={6}>
                <Typography level="title-md">Created By</Typography>
                <Typography>{selectedDelivery.created_by_user || 'N/A'}</Typography>
              </Grid>
              {selectedDelivery.received_at && (
                <>
                  <Grid xs={12} sm={6}>
                    <Typography level="title-md">Received At</Typography>
                    <Typography>{formatDate(selectedDelivery.received_at)}</Typography>
                  </Grid>
                </>
              )}
              {selectedDelivery.status === 'cancelled' && selectedDelivery.cancel_reason && (
                <Grid xs={12}>
                  <Typography level="title-md">Cancellation Reason</Typography>
                  <Typography>{selectedDelivery.cancel_reason}</Typography>
                </Grid>
              )}
            </Grid>
          </ModalDialog>
        </Modal>
      )}
      
      {/* Request Details Modal */}
      {selectedRequest && (
        <Modal open={requestDetailsOpen} onClose={() => setRequestDetailsOpen(false)}>
          <ModalDialog size="lg">
            <ModalClose />
            <Typography level="h5" sx={{ mb: 2 }}>
              Request Details #{selectedRequest.id}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid xs={12} sm={6}>
                <Typography level="title-md">Branch</Typography>
                <Typography>{selectedRequest.branch_name || 'N/A'}</Typography>
              </Grid>
              <Grid xs={12} sm={6}>
                <Typography level="title-md">Status</Typography>
                <Box>{renderStatusChip(selectedRequest.request_status)}</Box>
              </Grid>
              <Grid xs={12} sm={6}>
                <Typography level="title-md">Priority</Typography>
                <Box>{renderPriorityChip(selectedRequest.priority)}</Box>
              </Grid>
              <Grid xs={12} sm={6}>
                <Typography level="title-md">Requested By</Typography>
                <Typography>{selectedRequest.requested_by || 'N/A'}</Typography>
              </Grid>
              <Grid xs={12} sm={6}>
                <Typography level="title-md">Created At</Typography>
                <Typography>{formatDate(selectedRequest.created_at)}</Typography>
              </Grid>
              <Grid xs={12} sm={6}>
                <Typography level="title-md">Total Amount</Typography>
                <Typography>{formatCurrency(selectedRequest.total_amount)}</Typography>
              </Grid>
              {selectedRequest.notes && (
                <Grid xs={12}>
                  <Typography level="title-md">Notes</Typography>
                  <Typography>{selectedRequest.notes}</Typography>
                </Grid>
              )}
              {selectedRequest.reason && (
                <Grid xs={12}>
                  <Typography level="title-md">Reason</Typography>
                  <Typography>{selectedRequest.reason}</Typography>
                </Grid>
              )}
              
              {/* Request Items */}
              {selectedRequest.items && selectedRequest.items.length > 0 && (
                <Grid xs={12} sx={{ mt: 2 }}>
                  <Typography level="title-md" sx={{ mb: 1 }}>Items</Typography>
                  <Sheet sx={{ borderRadius: 'md', overflow: 'auto' }}>
                    <Table size="sm">
                      <thead>
                        <tr>
                          <th>Item Code</th>
                          <th>Description</th>
                          <th>Quantity</th>
                          <th>Unit</th>
                          <th>Unit Price</th>
                          <th>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedRequest.items.map((item) => (
                          <tr key={item.id}>
                            <td>{item.item_code || 'N/A'}</td>
                            <td>{item.description}</td>
                            <td>{item.quantity}</td>
                            <td>{item.unit}</td>
                            <td>{formatCurrency(item.unit_price)}</td>
                            <td>{formatCurrency(item.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Sheet>
                </Grid>
              )}
            </Grid>
          </ModalDialog>
        </Modal>
      )}
    </Box>
  )
}

export default Archive 