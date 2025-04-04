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
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff'

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
  const [isLoadingDeliveries, setIsLoadingDeliveries] = useState(true)
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [dateRangeFilter, setDateRangeFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [branchNames, setBranchNames] = useState({})
  
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
        setBranchNames(response.data.reduce((acc, branch) => ({ ...acc, [branch.id]: branch.name }), {}))
      } catch (err) {
        console.error('Error fetching branches:', err)
      }
    }
    
    fetchBranches()
  }, [])
  
  // Fetch warehouse deliveries
  const fetchDeliveries = async () => {
    try {
      setIsLoadingDeliveries(true)
      
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
      setIsLoadingDeliveries(false)
    }
  }
  
  // Fetch data based on timeframe changes
  useEffect(() => {
    fetchDeliveries()
  }, [deliveryTimeframe])
  
  // Filter deliveries based on search term, status, and timeframe
  useEffect(() => {
    if (!deliveries.length) return;

    let result = [...deliveries];

    // Apply search filter
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase().trim();
      result = result.filter(delivery => 
        delivery.tracking_number?.toLowerCase().includes(searchLower) ||
        delivery.recipient_name?.toLowerCase().includes(searchLower) ||
        delivery.recipient_address?.toLowerCase().includes(searchLower) ||
        branchNames[delivery.branch_id]?.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (deliveryStatusFilter !== 'all') {
      result = result.filter(delivery => delivery.status === deliveryStatusFilter);
    }

    // Apply date range filter
    if (dateRangeFilter !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (dateRangeFilter === 'today') {
        result = result.filter(delivery => {
          const deliveryDate = new Date(delivery.created_at);
          deliveryDate.setHours(0, 0, 0, 0);
          return deliveryDate.getTime() === today.getTime();
        });
      } else if (dateRangeFilter === 'last_7_days') {
        const last7Days = new Date(today);
        last7Days.setDate(last7Days.getDate() - 7);
        
        result = result.filter(delivery => {
          const deliveryDate = new Date(delivery.created_at);
          return deliveryDate >= last7Days;
        });
      } else if (dateRangeFilter === 'last_30_days') {
        const last30Days = new Date(today);
        last30Days.setDate(last30Days.getDate() - 30);
        
        result = result.filter(delivery => {
          const deliveryDate = new Date(delivery.created_at);
          return deliveryDate >= last30Days;
        });
      } else if (dateRangeFilter === 'custom' && startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // End of the selected day
        
        result = result.filter(delivery => {
          const deliveryDate = new Date(delivery.created_at);
          return deliveryDate >= start && deliveryDate <= end;
        });
      }
    }

    setFilteredDeliveries(result);
  }, [deliveries, searchQuery, deliveryStatusFilter, dateRangeFilter, startDate, endDate, branchNames]);
  
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
      setIsDeliveryModalOpen(true);
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
  
  const handleOpenDeliveryModal = (delivery) => {
    setSelectedDelivery(delivery)
    setIsDeliveryModalOpen(true)
  }
  
  const handleCloseDeliveryModal = () => {
    setSelectedDelivery(null)
    setIsDeliveryModalOpen(false)
  }
  
  const resetFilters = () => {
    setSearchQuery('');
    setDeliveryStatusFilter('all');
    setDateRangeFilter('all');
    setStartDate('');
    setEndDate('');
  }
  
  return (
    <Box sx={{ py: 2 }}>
      {/* Header */}
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
        
        <Button
          variant="outlined"
          color="neutral"
          startDecorator={<RefreshIcon />}
          onClick={() => fetchDeliveries()}
        >
          Refresh
        </Button>
      </Box>

      {/* Search and filter controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="flex-end">
            <Grid xs={12} md={6}>
              <FormControl>
                <FormLabel>Search</FormLabel>
                <Input
                  placeholder="Search by tracking number, recipient..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
                  <Option value="loading">Loading</Option>
                  <Option value="in_transit">In Transit</Option>
                  <Option value="delivered">Delivered</Option>
                  <Option value="cancelled">Cancelled</Option>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid xs={12} md={3}>
              <FormControl>
                <FormLabel>Date Range</FormLabel>
                <Select
                  value={dateRangeFilter}
                  onChange={(e, val) => setDateRangeFilter(val)}
                  startDecorator={<CalendarTodayIcon />}
                >
                  <Option value="all">All Time</Option>
                  <Option value="today">Today</Option>
                  <Option value="last_7_days">Last 7 Days</Option>
                  <Option value="last_30_days">Last 30 Days</Option>
                  <Option value="custom">Custom Range</Option>
                </Select>
              </FormControl>
            </Grid>
            
            {dateRangeFilter === 'custom' && (
              <>
                <Grid xs={12} md={6}>
                  <FormControl>
                    <FormLabel>Start Date</FormLabel>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </FormControl>
                </Grid>
                <Grid xs={12} md={6}>
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
            
            <Grid xs={12} display="flex" justifyContent="space-between" alignItems="center">
              <Typography level="body-sm">
                Showing {filteredDeliveries.length} of {deliveries.length} deliveries
              </Typography>
              
              <Button
                startDecorator={<FilterAltOffIcon />}
                onClick={resetFilters}
                variant="outlined"
                color="neutral"
                size="sm"
              >
                Reset Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Deliveries Table */}
      {isLoadingDeliveries ? (
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
                    <th>Branch</th>
                    <th style={{ width: 120 }}>Status</th>
                    <th style={{ width: 180 }}>Scheduled Date</th>
                    <th style={{ width: 180 }}>Created Date</th>
                    <th style={{ width: 100 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDeliveries.map((delivery) => (
                    <tr key={delivery.id}>
                      <td>{delivery.id}</td>
                      <td>{delivery.tracking_number}</td>
                      <td>{branchNames[delivery.branch_id] || 'Unknown'}</td>
                      <td>{renderDeliveryStatusChip(delivery.status)}</td>
                      <td>{formatDate(delivery.scheduled_date)}</td>
                      <td>{formatDate(delivery.created_at)}</td>
                      <td>
                        <Tooltip title="View Details">
                          <IconButton 
                            size="sm" 
                            variant="plain" 
                            color="neutral" 
                            onClick={() => handleOpenDeliveryModal(delivery)}
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
      {selectedDelivery && (
        <DeliveryDetailsModal
          open={isDeliveryModalOpen}
          onClose={handleCloseDeliveryModal}
          deliveryId={selectedDelivery.id}
          userRole={user?.role}
          userId={user?.id}
        />
      )}
    </Box>
  )
}

export default WarehouseHistory 