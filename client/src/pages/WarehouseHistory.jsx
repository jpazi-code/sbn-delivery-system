import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import DeliveryDetailsModal from '../components/DeliveryDetailsModal'
import RequestDetailsModal from '../components/RequestDetailsModal'

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
import Tabs from '@mui/joy/Tabs'
import TabList from '@mui/joy/TabList'
import Tab from '@mui/joy/Tab'
import TabPanel from '@mui/joy/TabPanel'
import Chip from '@mui/joy/Chip'
import IconButton from '@mui/joy/IconButton'
import Tooltip from '@mui/joy/Tooltip'
import Grid from '@mui/joy/Grid'
import Modal from '@mui/joy/Modal'
import ModalDialog from '@mui/joy/ModalDialog'
import ModalClose from '@mui/joy/ModalClose'
import Divider from '@mui/joy/Divider'
import Stack from '@mui/joy/Stack'

// Icons
import SearchIcon from '@mui/icons-material/Search'
import FilterAltIcon from '@mui/icons-material/FilterAlt'
import RefreshIcon from '@mui/icons-material/Refresh'
import VisibilityIcon from '@mui/icons-material/Visibility'
import HistoryIcon from '@mui/icons-material/History'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PendingIcon from '@mui/icons-material/Pending'
import WarehouseIcon from '@mui/icons-material/Warehouse'
import InfoIcon from '@mui/icons-material/Info'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import CalendarViewMonthIcon from '@mui/icons-material/CalendarViewMonth'
import CalendarViewWeekIcon from '@mui/icons-material/CalendarViewWeek'
import RequestPageIcon from '@mui/icons-material/RequestPage'
import ReceiptIcon from '@mui/icons-material/Receipt'

const WarehouseHistory = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [activeTab, setActiveTab] = useState(0)
  
  // Deliveries tab states
  const [deliveries, setDeliveries] = useState([])
  const [filteredDeliveries, setFilteredDeliveries] = useState([])
  const [deliveriesLoading, setDeliveriesLoading] = useState(true)
  const [deliveriesError, setDeliveriesError] = useState(null)
  const [deliverySearchTerm, setDeliverySearchTerm] = useState('')
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState('all')
  const [deliveryTimeframe, setDeliveryTimeframe] = useState('month')
  const [selectedDelivery, setSelectedDelivery] = useState(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  
  // Requests tab states
  const [requests, setRequests] = useState([])
  const [filteredRequests, setFilteredRequests] = useState([])
  const [requestsLoading, setRequestsLoading] = useState(true)
  const [requestsError, setRequestsError] = useState(null)
  const [requestSearchTerm, setRequestSearchTerm] = useState('')
  const [requestStatusFilter, setRequestStatusFilter] = useState('all')
  const [requestTimeframe, setRequestTimeframe] = useState('month')
  const [branches, setBranches] = useState([])
  const [selectedRequestId, setSelectedRequestId] = useState(null)
  const [requestDetailsModalOpen, setRequestDetailsModalOpen] = useState(false)
  
  const isAdmin = user?.role === 'admin'
  const isWarehouse = user?.role === 'warehouse'
  
  // Redirect if not authorized
  useEffect(() => {
    if (!isAdmin && !isWarehouse) {
      navigate('/')
    }
  }, [user, isAdmin, isWarehouse, navigate])
  
  // Load branches
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await axios.get('/api/branches')
        setBranches(response.data)
      } catch (err) {
        console.error('Error fetching branches:', err)
      }
    }
    
    fetchBranches()
  }, [])
  
  // Fetch warehouse deliveries
  const fetchDeliveries = async () => {
    try {
      setDeliveriesLoading(true)
      
      // Get all deliveries handled by warehouse (created by warehouse user)
      const response = await axios.get('/api/deliveries', {
        params: {
          created_by_role: 'warehouse',
          timeframe: deliveryTimeframe
        }
      })
      
      setDeliveries(response.data)
      setFilteredDeliveries(response.data)
      setDeliveriesError(null)
    } catch (err) {
      console.error('Error fetching warehouse deliveries:', err)
      setDeliveriesError('Failed to load warehouse deliveries')
    } finally {
      setDeliveriesLoading(false)
    }
  }
  
  // Fetch branch requests
  const fetchRequests = async () => {
    try {
      setRequestsLoading(true)
      
      // Get all branch requests
      const response = await axios.get('/api/delivery-requests', {
        params: {
          timeframe: requestTimeframe
        }
      })
      
      setRequests(response.data)
      setFilteredRequests(response.data)
      setRequestsError(null)
    } catch (err) {
      console.error('Error fetching branch requests:', err)
      setRequestsError('Failed to load branch requests')
    } finally {
      setRequestsLoading(false)
    }
  }
  
  // Fetch data based on active tab and timeframe changes
  useEffect(() => {
    if (activeTab === 0) {
      fetchDeliveries()
    } else {
      fetchRequests()
    }
  }, [activeTab, deliveryTimeframe, requestTimeframe])
  
  // Filter deliveries
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
          delivery.tracking_number?.toLowerCase().includes(lowerSearchTerm) ||
          delivery.recipient_name?.toLowerCase().includes(lowerSearchTerm) ||
          delivery.recipient_address?.toLowerCase().includes(lowerSearchTerm) ||
          delivery.package_description?.toLowerCase().includes(lowerSearchTerm)
      )
    }
    
    setFilteredDeliveries(result)
  }, [deliverySearchTerm, deliveryStatusFilter, deliveries])
  
  // Filter requests
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
          request.reference_number?.toLowerCase().includes(lowerSearchTerm) ||
          request.notes?.toLowerCase().includes(lowerSearchTerm)
      )
    }
    
    setFilteredRequests(result)
  }, [requestSearchTerm, requestStatusFilter, requests])
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)
  }
  
  // Handle delivery timeframe change
  const handleDeliveryTimeframeChange = (event, newValue) => {
    setDeliveryTimeframe(newValue)
  }
  
  // Handle request timeframe change
  const handleRequestTimeframeChange = (event, newValue) => {
    setRequestTimeframe(newValue)
  }
  
  // View delivery details
  const handleViewDeliveryDetails = (id) => {
    const delivery = deliveries.find(d => d.id === id);
    if (delivery) {
      console.log('Selected delivery:', delivery);
      setSelectedDelivery(delivery);
      setDetailsModalOpen(true);
    }
  }
  
  // View request details
  const handleViewRequestDetails = (id) => {
    console.log('Selected request ID:', id);
    setSelectedRequestId(id);
    setRequestDetailsModalOpen(true);
  }
  
  // Render delivery status chip
  const renderDeliveryStatusChip = (status) => {
    let color, icon
    
    switch (status) {
      case 'delivered':
        color = 'success'
        icon = <CheckCircleIcon sx={{ color: 'white' }} />
        break
      case 'in_transit':
        color = 'primary'
        icon = <LocalShippingIcon sx={{ color: 'white' }} />
        break
      case 'pending':
        color = 'warning'
        icon = <PendingIcon sx={{ color: 'white' }} />
        break
      case 'preparing':
      case 'loading':
        color = 'neutral'
        icon = <WarehouseIcon sx={{ color: 'white' }} />
        break
      case 'cancelled':
        color = 'danger'
        icon = <InfoIcon sx={{ color: 'white' }} />
        break
      default:
        color = 'neutral'
        icon = <InfoIcon sx={{ color: 'white' }} />
    }
    
    return (
      <Chip
        color={color}
        variant="solid"
        startDecorator={icon}
        size="sm"
        sx={{ textTransform: 'capitalize' }}
      >
        {status?.replace('_', ' ')}
      </Chip>
    )
  }
  
  // Render request status chip
  const renderRequestStatusChip = (status) => {
    let color, icon
    
    switch (status) {
      case 'approved':
        color = 'success'
        icon = <CheckCircleIcon sx={{ color: 'white' }} />
        break
      case 'pending':
        color = 'warning'
        icon = <PendingIcon sx={{ color: 'white' }} />
        break
      case 'processing':
        color = 'primary'
        icon = <WarehouseIcon sx={{ color: 'white' }} />
        break
      case 'delivered':
        color = 'success'
        icon = <LocalShippingIcon sx={{ color: 'white' }} />
        break
      case 'rejected':
        color = 'danger'
        icon = <InfoIcon sx={{ color: 'white' }} />
        break
      default:
        color = 'neutral'
        icon = <InfoIcon sx={{ color: 'white' }} />
    }
    
    return (
      <Chip
        color={color}
        variant="solid"
        startDecorator={icon}
        size="sm"
        sx={{ textTransform: 'capitalize' }}
      >
        {status?.replace('_', ' ') || 'Unknown'}
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
  
  // Get branch name
  const getBranchName = (branchId) => {
    if (!branchId) return 'Unknown Branch'
    
    const branch = branches.find(b => b.id === branchId)
    return branch ? branch.name : 'Unknown Branch'
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
            <HistoryIcon fontSize="large" />
          </Sheet>
          <Typography level="h4">Warehouse History</Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          {/* Time period selection - shown based on active tab */}
          {activeTab === 0 ? (
            <FormControl size="sm" sx={{ minWidth: 150 }}>
              <FormLabel>Time Period</FormLabel>
              <Select
                value={deliveryTimeframe}
                onChange={handleDeliveryTimeframeChange}
                startDecorator={
                  deliveryTimeframe === 'month' ? <CalendarTodayIcon /> :
                  deliveryTimeframe === '3months' ? <CalendarViewWeekIcon /> :
                  <CalendarViewMonthIcon />
                }
              >
                <Option value="month">Past Month</Option>
                <Option value="3months">Past 3 Months</Option>
                <Option value="year">Past Year</Option>
              </Select>
            </FormControl>
          ) : (
            <FormControl size="sm" sx={{ minWidth: 150 }}>
              <FormLabel>Time Period</FormLabel>
              <Select
                value={requestTimeframe}
                onChange={handleRequestTimeframeChange}
                startDecorator={
                  requestTimeframe === 'month' ? <CalendarTodayIcon /> :
                  requestTimeframe === '3months' ? <CalendarViewWeekIcon /> :
                  <CalendarViewMonthIcon />
                }
              >
                <Option value="month">Past Month</Option>
                <Option value="3months">Past 3 Months</Option>
                <Option value="year">Past Year</Option>
              </Select>
            </FormControl>
          )}
          
          <Button
            variant="outlined"
            color="neutral"
            startDecorator={<RefreshIcon />}
            onClick={activeTab === 0 ? fetchDeliveries : fetchRequests}
            sx={{ alignSelf: 'flex-end' }}
          >
            Refresh
          </Button>
        </Box>
      </Box>
      
      {/* Tabs for different history views */}
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        sx={{ mb: 3 }}
      >
        <TabList>
          <Tab startDecorator={<LocalShippingIcon />}>
            Deliveries History
          </Tab>
          <Tab startDecorator={<RequestPageIcon />}>
            Branch Requests History
          </Tab>
        </TabList>
        
        {/* Deliveries Tab */}
        <TabPanel value={0}>
          {/* Error message */}
          {deliveriesError && (
            <Alert color="danger" sx={{ mb: 3 }}>
              {deliveriesError}
            </Alert>
          )}
          
          {/* Filter controls */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="flex-end">
                <Grid xs={12} md={6}>
                  <FormControl>
                    <FormLabel>Search</FormLabel>
                    <Input
                      placeholder="Search by tracking number, recipient..."
                      value={deliverySearchTerm}
                      onChange={(e) => setDeliverySearchTerm(e.target.value)}
                      startDecorator={<SearchIcon />}
                    />
                  </FormControl>
                </Grid>
                
                <Grid xs={12} md={4}>
                  <FormControl>
                    <FormLabel>Status Filter</FormLabel>
                    <Select
                      value={deliveryStatusFilter}
                      onChange={(e, val) => setDeliveryStatusFilter(val)}
                      startDecorator={<FilterAltIcon />}
                    >
                      <Option value="all">All Statuses</Option>
                      <Option value="delivered">Delivered</Option>
                      <Option value="in_transit">In Transit</Option>
                      <Option value="pending">Pending</Option>
                      <Option value="preparing">Preparing</Option>
                      <Option value="loading">Loading</Option>
                      <Option value="cancelled">Cancelled</Option>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid xs={12} md={2} display="flex" justifyContent="flex-end">
                  <Typography level="body-sm">
                    Showing {filteredDeliveries.length} of {deliveries.length} deliveries
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
          
          {/* Loading state */}
          {deliveriesLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '30vh' }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* No deliveries found */}
              {filteredDeliveries.length === 0 && (
                <Alert
                  color="neutral"
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '30vh' }}
                >
                  No deliveries found for the selected criteria
                </Alert>
              )}
              
              {/* Deliveries table */}
              {filteredDeliveries.length > 0 && (
                <Sheet
                  variant="outlined"
                  sx={{ borderRadius: 'sm', overflow: 'auto', maxHeight: '60vh' }}
                >
                  <Table stickyHeader hoverRow>
                    <thead>
                      <tr>
                        <th style={{ width: 80 }}>ID</th>
                        <th style={{ width: 160 }}>Tracking</th>
                        <th>Recipient</th>
                        <th style={{ width: 140 }}>Branch</th>
                        <th style={{ width: 120 }}>Status</th>
                        <th style={{ width: 180 }}>Created</th>
                        <th style={{ width: 180 }}>Delivered</th>
                        <th style={{ width: 100 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDeliveries.map(delivery => (
                        <tr key={delivery.id}>
                          <td>{delivery.id}</td>
                          <td>{delivery.tracking_number}</td>
                          <td>
                            <Box>
                              <Typography level="body-sm" fontWeight="md">
                                {delivery.recipient_name}
                              </Typography>
                              <Typography level="body-xs">
                                {delivery.recipient_address?.substring(0, 30)}
                                {delivery.recipient_address?.length > 30 ? '...' : ''}
                              </Typography>
                            </Box>
                          </td>
                          <td>{getBranchName(delivery.branch_id)}</td>
                          <td>{renderDeliveryStatusChip(delivery.status)}</td>
                          <td>{formatDate(delivery.created_at)}</td>
                          <td>{delivery.received_at ? formatDate(delivery.received_at) : 'Not delivered'}</td>
                          <td>
                            <Tooltip title="View Details">
                              <IconButton
                                size="sm"
                                variant="plain"
                                color="neutral"
                                onClick={() => handleViewDeliveryDetails(delivery.id)}
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
            </>
          )}
        </TabPanel>
        
        {/* Requests Tab */}
        <TabPanel value={1}>
          {/* Error message */}
          {requestsError && (
            <Alert color="danger" sx={{ mb: 3 }}>
              {requestsError}
            </Alert>
          )}
          
          {/* Filter controls */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="flex-end">
                <Grid xs={12} md={6}>
                  <FormControl>
                    <FormLabel>Search</FormLabel>
                    <Input
                      placeholder="Search by reference number, notes..."
                      value={requestSearchTerm}
                      onChange={(e) => setRequestSearchTerm(e.target.value)}
                      startDecorator={<SearchIcon />}
                    />
                  </FormControl>
                </Grid>
                
                <Grid xs={12} md={4}>
                  <FormControl>
                    <FormLabel>Status Filter</FormLabel>
                    <Select
                      value={requestStatusFilter}
                      onChange={(e, val) => setRequestStatusFilter(val)}
                      startDecorator={<FilterAltIcon />}
                    >
                      <Option value="all">All Statuses</Option>
                      <Option value="pending">Pending</Option>
                      <Option value="approved">Approved</Option>
                      <Option value="processing">Processing</Option>
                      <Option value="delivered">Delivered</Option>
                      <Option value="rejected">Rejected</Option>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid xs={12} md={2} display="flex" justifyContent="flex-end">
                  <Typography level="body-sm">
                    Showing {filteredRequests.length} of {requests.length} requests
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
          
          {/* Loading state */}
          {requestsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '30vh' }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* No requests found */}
              {filteredRequests.length === 0 && (
                <Alert
                  color="neutral"
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '30vh' }}
                >
                  No requests found for the selected criteria
                </Alert>
              )}
              
              {/* Requests table */}
              {filteredRequests.length > 0 && (
                <Sheet
                  variant="outlined"
                  sx={{ borderRadius: 'sm', overflow: 'auto', maxHeight: '60vh' }}
                >
                  <Table stickyHeader hoverRow>
                    <thead>
                      <tr>
                        <th style={{ width: 80 }}>ID</th>
                        <th style={{ width: 140 }}>Branch</th>
                        <th>Notes</th>
                        <th style={{ width: 120 }}>Status</th>
                        <th style={{ width: 120 }}>Total</th>
                        <th style={{ width: 180 }}>Created</th>
                        <th style={{ width: 100 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRequests.map(request => {
                        console.log('Request in table row:', request);
                        return (
                        <tr key={request.id}>
                          <td>{request.id}</td>
                          <td>{getBranchName(request.branch_id)}</td>
                          <td>
                            <Typography level="body-sm">
                              {request.notes?.substring(0, 50)}
                              {request.notes?.length > 50 ? '...' : ''}
                            </Typography>
                          </td>
                          <td>{renderRequestStatusChip(request.request_status)}</td>
                          <td>{formatCurrency(request.total_amount)}</td>
                          <td>{formatDate(request.created_at)}</td>
                          <td>
                            <Tooltip title="View Details">
                              <IconButton
                                size="sm"
                                variant="plain"
                                color="neutral"
                                onClick={() => handleViewRequestDetails(request.id)}
                              >
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>
                          </td>
                        </tr>
                        )
                      })}
                    </tbody>
                  </Table>
                </Sheet>
              )}
            </>
          )}
        </TabPanel>
      </Tabs>
      
      {/* Delivery Details Modal */}
      <DeliveryDetailsModal 
        deliveryId={selectedDelivery?.id}
        open={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
      />
      
      {/* Request Details Modal */}
      <RequestDetailsModal
        requestId={selectedRequestId}
        open={requestDetailsModalOpen}
        onClose={() => setRequestDetailsModalOpen(false)}
      />
    </Box>
  )
}

export default WarehouseHistory 