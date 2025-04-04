import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import DeliveryDetailsModal from '../components/DeliveryDetailsModal'

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
import Chip from '@mui/joy/Chip'
import IconButton from '@mui/joy/IconButton'
import Tooltip from '@mui/joy/Tooltip'
import Grid from '@mui/joy/Grid'

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

const WarehouseHistory = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  
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
  
  // Fetch data based on timeframe changes
  useEffect(() => {
    fetchDeliveries()
  }, [deliveryTimeframe])
  
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
  
  // Handle delivery timeframe change
  const handleDeliveryTimeframeChange = (event, newValue) => {
    setDeliveryTimeframe(newValue)
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
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography level="h3" sx={{ mb: 3 }}>
        <HistoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Warehouse History
      </Typography>
      
      <Box sx={{ mb: 4 }}>
        <Typography level="title-lg" sx={{ mb: 2 }}>
          <LocalShippingIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Deliveries History
        </Typography>
        
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
              <Grid xs={12} md={4}>
                <FormControl>
                  <FormLabel>Search</FormLabel>
                  <Input
                    placeholder="Search by tracking #, recipient..."
                    value={deliverySearchTerm}
                    onChange={(e) => setDeliverySearchTerm(e.target.value)}
                    startDecorator={<SearchIcon />}
                  />
                </FormControl>
              </Grid>
              
              <Grid xs={12} md={3}>
                <FormControl>
                  <FormLabel>Status Filter</FormLabel>
                  <Select
                    value={deliveryStatusFilter}
                    onChange={(e, val) => setDeliveryStatusFilter(val)}
                    startDecorator={<FilterAltIcon />}
                  >
                    <Option value="all">All Statuses</Option>
                    <Option value="pending">Pending</Option>
                    <Option value="preparing">Preparing</Option>
                    <Option value="loading">Loading</Option>
                    <Option value="in_transit">In Transit</Option>
                    <Option value="delivered">Delivered</Option>
                    <Option value="cancelled">Cancelled</Option>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid xs={12} md={3}>
                <FormControl>
                  <FormLabel>Timeframe</FormLabel>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant={deliveryTimeframe === 'week' ? 'solid' : 'outlined'}
                      color={deliveryTimeframe === 'week' ? 'primary' : 'neutral'}
                      startDecorator={<CalendarViewWeekIcon />}
                      onClick={() => setDeliveryTimeframe('week')}
                    >
                      Week
                    </Button>
                    <Button
                      variant={deliveryTimeframe === 'month' ? 'solid' : 'outlined'}
                      color={deliveryTimeframe === 'month' ? 'primary' : 'neutral'}
                      startDecorator={<CalendarViewMonthIcon />}
                      onClick={() => setDeliveryTimeframe('month')}
                    >
                      Month
                    </Button>
                    <Button
                      variant={deliveryTimeframe === 'all' ? 'solid' : 'outlined'}
                      color={deliveryTimeframe === 'all' ? 'primary' : 'neutral'}
                      startDecorator={<CalendarTodayIcon />}
                      onClick={() => setDeliveryTimeframe('all')}
                    >
                      All
                    </Button>
                  </Box>
                </FormControl>
              </Grid>
              
              <Grid xs={12} md={2} display="flex" justifyContent="flex-end">
                <Button 
                  variant="outlined" 
                  color="neutral"
                  startDecorator={<RefreshIcon />}
                  onClick={fetchDeliveries}
                >
                  Refresh
                </Button>
              </Grid>
              
              <Grid xs={12} display="flex" justifyContent="flex-end">
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
                      <th style={{ width: 160 }}>Tracking #</th>
                      <th style={{ width: 140 }}>Recipient</th>
                      <th>Address</th>
                      <th style={{ width: 120 }}>Status</th>
                      <th style={{ width: 180 }}>Created</th>
                      <th style={{ width: 100 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDeliveries.map(delivery => (
                      <tr key={delivery.id}>
                        <td>{delivery.id}</td>
                        <td>{delivery.tracking_number}</td>
                        <td>{delivery.recipient_name}</td>
                        <td>
                          <Typography level="body-sm">
                            {delivery.recipient_address?.substring(0, 50)}
                            {delivery.recipient_address?.length > 50 ? '...' : ''}
                          </Typography>
                        </td>
                        <td>{renderDeliveryStatusChip(delivery.status)}</td>
                        <td>{formatDate(delivery.created_at)}</td>
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
      </Box>
      
      {/* Delivery Details Modal */}
      <DeliveryDetailsModal 
        deliveryId={selectedDelivery?.id}
        open={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
      />
    </Box>
  )
}

export default WarehouseHistory 