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
import Modal from '@mui/joy/Modal'
import ModalDialog from '@mui/joy/ModalDialog'
import ModalClose from '@mui/joy/ModalClose'
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

const BranchHistory = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [deliveries, setDeliveries] = useState([])
  const [filteredDeliveries, setFilteredDeliveries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [timeframe, setTimeframe] = useState('month')
  const [branches, setBranches] = useState([])
  const [selectedBranch, setSelectedBranch] = useState(user?.role === 'branch' ? user?.branch_id : 'all')
  const [selectedDelivery, setSelectedDelivery] = useState(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  
  const isAdmin = user?.role === 'admin'
  const isBranch = user?.role === 'branch'
  
  // Redirect if not authorized
  useEffect(() => {
    if (!isAdmin && !isBranch) {
      navigate('/')
    }
    
    // If branch user, set their branch as selected
    if (isBranch && user?.branch_id) {
      setSelectedBranch(user.branch_id)
    }
  }, [user, isAdmin, isBranch, navigate])
  
  // Load branches (for admin to select)
  useEffect(() => {
    const fetchBranches = async () => {
      if (!isAdmin) return // Only admin needs to fetch branches
      
      try {
        const response = await axios.get('/api/branches')
        setBranches(response.data)
      } catch (err) {
        console.error('Error fetching branches:', err)
        setError('Failed to load branches')
      }
    }
    
    fetchBranches()
  }, [isAdmin])
  
  // Fetch deliveries based on branch and filters
  const fetchDeliveries = async () => {
    try {
      setLoading(true)
      
      // For branch users, always use their branch_id
      // For admin, use the selected branch or fetch all if "all" is selected
      const branchId = isBranch ? user.branch_id : selectedBranch
      
      // For admin with "all" selected, fetch all deliveries
      if (isAdmin && selectedBranch === 'all') {
        const response = await axios.get('/api/deliveries')
        setDeliveries(response.data)
        setFilteredDeliveries(response.data)
        setError(null)
        setLoading(false)
        return
      }
      
      // For specific branch or branch user
      if (!branchId) {
        setDeliveries([])
        setFilteredDeliveries([])
        setLoading(false)
        return
      }
      
      const response = await axios.get('/api/deliveries', {
        params: {
          branch_id: branchId
        }
      })
      
      setDeliveries(response.data)
      setFilteredDeliveries(response.data)
      setError(null)
    } catch (err) {
      console.error('Error fetching delivery history:', err)
      setError('Failed to load delivery history')
    } finally {
      setLoading(false)
    }
  }
  
  // Fetch data when selectedBranch or timeframe changes
  useEffect(() => {
    fetchDeliveries()
  }, [selectedBranch, timeframe])
  
  // Filter deliveries when search term or status filter changes
  useEffect(() => {
    let result = deliveries
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(delivery => delivery.status === statusFilter)
    }
    
    // Apply search filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase()
      result = result.filter(
        delivery =>
          delivery.tracking_number?.toLowerCase().includes(lowerSearchTerm) ||
          delivery.recipient_name?.toLowerCase().includes(lowerSearchTerm) ||
          delivery.recipient_address?.toLowerCase().includes(lowerSearchTerm) ||
          delivery.package_description?.toLowerCase().includes(lowerSearchTerm)
      )
    }
    
    setFilteredDeliveries(result)
  }, [searchTerm, statusFilter, deliveries])
  
  // Handle branch change (admin only)
  const handleBranchChange = (event, newValue) => {
    setSelectedBranch(newValue)
  }
  
  // Handle timeframe change
  const handleTimeframeChange = (event, newValue) => {
    setTimeframe(newValue)
  }
  
  // View delivery details
  const handleViewDetails = (id) => {
    const delivery = deliveries.find(d => d.id === id);
    if (delivery) {
      setSelectedDelivery(delivery);
      setDetailsModalOpen(true);
    }
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
        color = 'danger'
        icon = <InfoIcon />
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
          <Typography level="h4">Branch Delivery History</Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          {/* Branch selection (admin only) */}
          {isAdmin && (
            <FormControl size="sm" sx={{ minWidth: 200 }}>
              <FormLabel>Branch</FormLabel>
              <Select
                placeholder="Select Branch"
                value={selectedBranch}
                onChange={handleBranchChange}
              >
                <Option value="all">All Branches</Option>
                {branches.map(branch => (
                  <Option key={branch.id} value={branch.id}>{branch.name}</Option>
                ))}
              </Select>
            </FormControl>
          )}
          
          {/* Time period selection */}
          <FormControl size="sm" sx={{ minWidth: 150 }}>
            <FormLabel>Time Period</FormLabel>
            <Select
              value={timeframe}
              onChange={handleTimeframeChange}
              startDecorator={
                timeframe === 'month' ? <CalendarTodayIcon /> :
                timeframe === '3months' ? <CalendarViewWeekIcon /> :
                <CalendarViewMonthIcon />
              }
            >
              <Option value="month">Past Month</Option>
              <Option value="3months">Past 3 Months</Option>
              <Option value="year">Past Year</Option>
            </Select>
          </FormControl>
          
          <Button
            variant="outlined"
            color="neutral"
            startDecorator={<RefreshIcon />}
            onClick={fetchDeliveries}
            sx={{ alignSelf: 'flex-end' }}
          >
            Refresh
          </Button>
        </Box>
      </Box>
      
      {/* Error message */}
      {error && (
        <Alert color="danger" sx={{ mb: 3 }}>
          {error}
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
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  startDecorator={<SearchIcon />}
                />
              </FormControl>
            </Grid>
            
            <Grid xs={12} md={4}>
              <FormControl>
                <FormLabel>Status Filter</FormLabel>
                <Select
                  value={statusFilter}
                  onChange={(e, val) => setStatusFilter(val)}
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
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '30vh' }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* No branch selected (admin only) */}
          {isAdmin && !selectedBranch && (
            <Alert
              color="primary"
              sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '30vh' }}
            >
              Please select a branch to view its delivery history
            </Alert>
          )}
          
          {/* No deliveries found */}
          {(selectedBranch || selectedBranch === 'all') && filteredDeliveries.length === 0 && (
            <Alert
              color="neutral"
              sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '30vh' }}
            >
              No deliveries found for the selected criteria
            </Alert>
          )}
          
          {/* Deliveries table */}
          {(selectedBranch || selectedBranch === 'all') && filteredDeliveries.length > 0 && (
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
                            {delivery.recipient_address?.substring(0, 30)}{delivery.recipient_address?.length > 30 ? '...' : ''}
                          </Typography>
                        </Box>
                      </td>
                      <td>{renderStatusChip(delivery.status)}</td>
                      <td>{formatDate(delivery.created_at)}</td>
                      <td>{delivery.received_at ? formatDate(delivery.received_at) : 'Not delivered'}</td>
                      <td>
                        <Tooltip title="View Details">
                          <IconButton
                            size="sm"
                            variant="plain"
                            color="neutral"
                            onClick={() => handleViewDetails(delivery.id)}
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
      
      {/* Delivery Details Modal */}
      <Modal open={detailsModalOpen} onClose={() => setDetailsModalOpen(false)}>
        <ModalDialog size="lg">
          <ModalClose />
          <Typography level="title-lg">Delivery Details</Typography>
          <Divider sx={{ my: 2 }} />
          
          {selectedDelivery && (
            <Box sx={{ mt: 1 }}>
              <Grid container spacing={2}>
                <Grid xs={12} md={6}>
                  <Typography level="title-sm" sx={{ mb: 1 }}>General Information</Typography>
                  <Card variant="outlined" sx={{ mb: 2 }}>
                    <CardContent>
                      <Stack spacing={1}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography level="body-sm">Tracking Number:</Typography>
                          <Typography level="body-sm" fontWeight="bold">{selectedDelivery.tracking_number}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography level="body-sm">Status:</Typography>
                          <Box>{renderStatusChip(selectedDelivery.status)}</Box>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography level="body-sm">Branch:</Typography>
                          <Typography level="body-sm" fontWeight="bold">{getBranchName(selectedDelivery.branch_id)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography level="body-sm">Created:</Typography>
                          <Typography level="body-sm" fontWeight="bold">
                            {formatDate(selectedDelivery.created_at)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography level="body-sm">Delivered:</Typography>
                          <Typography level="body-sm" fontWeight="bold">
                            {selectedDelivery.received_at ? formatDate(selectedDelivery.received_at) : 'Not delivered'}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid xs={12} md={6}>
                  <Typography level="title-sm" sx={{ mb: 1 }}>Recipient Information</Typography>
                  <Card variant="outlined" sx={{ mb: 2 }}>
                    <CardContent>
                      <Stack spacing={1}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography level="body-sm">Name:</Typography>
                          <Typography level="body-sm" fontWeight="bold">{selectedDelivery.recipient_name || 'N/A'}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography level="body-sm">Address:</Typography>
                          <Typography level="body-sm" fontWeight="bold">{selectedDelivery.recipient_address || 'N/A'}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography level="body-sm">Phone:</Typography>
                          <Typography level="body-sm" fontWeight="bold">{selectedDelivery.recipient_phone || 'N/A'}</Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid xs={12}>
                  <Typography level="title-sm" sx={{ mb: 1 }}>Package Information</Typography>
                  <Card variant="outlined">
                    <CardContent>
                      <Stack spacing={1}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography level="body-sm">Description:</Typography>
                          <Typography level="body-sm" fontWeight="bold">{selectedDelivery.package_description || 'N/A'}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography level="body-sm">Weight:</Typography>
                          <Typography level="body-sm" fontWeight="bold">{selectedDelivery.weight ? `${selectedDelivery.weight} kg` : 'N/A'}</Typography>
                        </Box>
                        {selectedDelivery.request_id && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography level="body-sm">Request ID:</Typography>
                            <Typography level="body-sm" fontWeight="bold">#{selectedDelivery.request_id}</Typography>
                          </Box>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </ModalDialog>
      </Modal>
    </Box>
  )
}

export default BranchHistory 