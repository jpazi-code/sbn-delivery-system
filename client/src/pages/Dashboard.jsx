import { useState, useEffect } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'

// Joy UI components
import Grid from '@mui/joy/Grid'
import Card from '@mui/joy/Card'
import CardContent from '@mui/joy/CardContent'
import Typography from '@mui/joy/Typography'
import AspectRatio from '@mui/joy/AspectRatio'
import Box from '@mui/joy/Box'
import Button from '@mui/joy/Button'
import Divider from '@mui/joy/Divider'
import LinearProgress from '@mui/joy/LinearProgress'
import List from '@mui/joy/List'
import ListItem from '@mui/joy/ListItem'
import ListItemContent from '@mui/joy/ListItemContent'
import Sheet from '@mui/joy/Sheet'
import Link from '@mui/joy/Link'
import CircularProgress from '@mui/joy/CircularProgress'
import Alert from '@mui/joy/Alert'
import Chip from '@mui/joy/Chip'
import Select from '@mui/joy/Select'
import Option from '@mui/joy/Option'

// Icons
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PendingIcon from '@mui/icons-material/Pending'
import AddIcon from '@mui/icons-material/Add'
import FactCheckIcon from '@mui/icons-material/FactCheck'
import InventoryIcon from '@mui/icons-material/Inventory'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import InfoIcon from '@mui/icons-material/Info'
import RequestPageIcon from '@mui/icons-material/RequestPage'
import BusinessIcon from '@mui/icons-material/Business'
import TimelineIcon from '@mui/icons-material/Timeline'
import BarChartIcon from '@mui/icons-material/BarChart'
import SpeedIcon from '@mui/icons-material/Speed'
import ScheduleIcon from '@mui/icons-material/Schedule'
import AssessmentIcon from '@mui/icons-material/Assessment'

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth()
  const [deliveries, setDeliveries] = useState([])
  const [requests, setRequests] = useState([])
  const [stats, setStats] = useState(null)
  const [ongoingStats, setOngoingStats] = useState({
    total: 0,
    inTransit: 0,
    loading: 0,
    preparing: 0
  })
  
  // Analytics data
  const [branchAnalytics, setBranchAnalytics] = useState(null)
  const [warehouseAnalytics, setWarehouseAnalytics] = useState(null)
  const [branchPerformance, setBranchPerformance] = useState([])
  const [timeframe, setTimeframe] = useState('month')
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Role check variables
  const isAdmin = user?.role === 'admin'
  const isWarehouse = user?.role === 'warehouse'  
  const isBranch = user?.role === 'branch'

  const navigate = useNavigate()

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        
        // Basic data fetching for all users
        let deliveriesResponse
        
        if (isBranch) {
          // Branch users only see their branch's data
          deliveriesResponse = await axios.get('/api/deliveries/branch')
        } else {
          // Admin and warehouse users see all deliveries
          deliveriesResponse = await axios.get('/api/deliveries')
        }
        
        const deliveriesData = deliveriesResponse.data
        setDeliveries(deliveriesData)
        
        // Fetch delivery requests
        const requestsResponse = await axios.get('/api/delivery-requests')
        setRequests(requestsResponse.data)
        
        // Calculate base stats for all users
        const total = deliveriesData.length
        const pending = deliveriesData.filter(d => d.status === 'pending').length
        const inTransit = deliveriesData.filter(d => d.status === 'in_transit').length
        const delivered = deliveriesData.filter(d => d.status === 'delivered').length
        
        setStats({
          total,
          pending,
          inTransit,
          delivered
        })
        
        // Calculate ongoing stats
        const ongoingTotal = deliveriesData.filter(d => ['preparing', 'loading', 'in_transit'].includes(d.status)).length
        const ongoingInTransit = deliveriesData.filter(d => d.status === 'in_transit').length
        const ongoingLoading = deliveriesData.filter(d => d.status === 'loading').length
        const ongoingPreparing = deliveriesData.filter(d => d.status === 'preparing').length
        
        setOngoingStats({
          total: ongoingTotal,
          inTransit: ongoingInTransit,
          loading: ongoingLoading,
          preparing: ongoingPreparing
        })
        
        // Role-specific analytics
        if (isBranch && user.branch_id) {
          // Branch users get their branch summary
          const branchResponse = await axios.get(`/api/analytics/branch-summary/${user.branch_id}?timeframe=${timeframe}`)
          setBranchAnalytics(branchResponse.data)
        } else if (isWarehouse || isAdmin) {
          // Warehouse users get warehouse analytics
          const warehouseResponse = await axios.get(`/api/analytics/warehouse?timeframe=${timeframe}`)
          setWarehouseAnalytics(warehouseResponse.data)
          
          // Admin also gets branch performance metrics
          if (isAdmin) {
            const performanceResponse = await axios.get(`/api/analytics/branch-performance?timeframe=${timeframe}`)
            setBranchPerformance(performanceResponse.data)
          }
        }
        
        setError(null)
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
        setError('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }
    
    if (!authLoading && user) {
      fetchDashboardData()
    }
  }, [user, authLoading, timeframe])

  const handleTimeframeChange = (event, newValue) => {
    if (newValue) {
      setTimeframe(newValue)
    }
  }

  // Calculate metrics
  const calculateCompletionRate = () => {
    if (!stats || stats.total === 0) return 0
    return Math.round((stats.delivered / stats.total) * 100)
  }

  const formatNumber = (num) => {
    return num ? num.toLocaleString() : '0'
  }

  // Format amount to display safely as currency
  const formatCurrency = (amount) => {
    // Handle null, undefined, and non-numeric values
    if (amount === null || amount === undefined) {
      return '0.00'
    }
    
    // Convert to number if it's a string
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    
    // Check if it's a valid number after conversion
    if (isNaN(numericAmount)) {
      return '0.00'
    }
    
    // Format with 2 decimal places
    return numericAmount.toFixed(2)
  }

  // Handle navigation to delivery details
  const handleViewDeliveryDetails = (id) => {
    navigate(`/delivery-details/${id}`)
  }
  
  // Handle navigation to delivery request details
  const handleViewRequestDetails = (id) => {
    // Open the request details in a modal or navigate to a specific page
    navigate(`/delivery-requests`)
    // You might want to add query params or state to show details modal
  }

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress size="lg" />
      </Box>
    )
  }

  // Show error message if there's an error
  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert 
          variant="soft" 
          color="warning" 
          startDecorator={<InfoIcon />} 
          sx={{ mb: 2 }}
        >
          {error}
        </Alert>
      </Box>
    )
  }

  // Show loading state
  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '30vh' }}>
          <CircularProgress size="md" />
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ py: 2 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography level="h2" sx={{ mb: 1 }}>
            Welcome, {user?.full_name || user?.username || 'User'}!
          </Typography>
          <Typography level="h3">Dashboard</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Select
            value={timeframe}
            onChange={handleTimeframeChange}
            sx={{ minWidth: 150 }}
          >
            <Option value="month">Last Month</Option>
            <Option value="3months">Last 3 Months</Option>
            <Option value="year">Last Year</Option>
          </Select>
          
          {(isAdmin || isWarehouse) && (
            <Button
              component={RouterLink}
              to="/deliveries/new"
              startDecorator={<AddIcon />}
            >
              New Delivery
            </Button>
          )}
          
          {isBranch && (
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

      {/* Branch User Dashboard */}
      {isBranch && branchAnalytics && (
        <>
          {/* Branch Stats Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid xs={12} sm={6} md={3}>
              <Card variant="soft" color="primary">
                <CardContent orientation="horizontal" sx={{ gap: 1 }}>
                  <RequestPageIcon sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography level="h4">{branchAnalytics.summary?.ongoing_requests || 0}</Typography>
                    <Typography level="body-sm">Current Requests</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid xs={12} sm={6} md={3}>
              <Card variant="soft" color="success">
                <CardContent orientation="horizontal" sx={{ gap: 1 }}>
                  <LocalShippingIcon sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography level="h4">{branchAnalytics.summary?.ongoing_deliveries || 0}</Typography>
                    <Typography level="body-sm">Ongoing Deliveries</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid xs={12} sm={6} md={3}>
              <Card variant="soft" color="neutral">
                <CardContent orientation="horizontal" sx={{ gap: 1 }}>
                  <CheckCircleIcon sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography level="h4">{branchAnalytics.summary?.completed_deliveries || 0}</Typography>
                    <Typography level="body-sm">Completed Deliveries</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid xs={12} sm={6} md={3}>
              <Card variant="soft" color="warning">
                <CardContent orientation="horizontal" sx={{ gap: 1 }}>
                  <InventoryIcon sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography level="h4">₱{formatNumber(branchAnalytics.summary?.total_imported || 0)}</Typography>
                    <Typography level="body-sm">Total Imported</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Current Requests and Recent Deliveries */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography level="title-lg">Recent Requests</Typography>
                    <Link component={RouterLink} to="/delivery-requests">View All</Link>
                  </Box>
                  
                  {branchAnalytics.recent_requests?.length > 0 ? (
                    <List sx={{ '--List-gap': '8px' }}>
                      {branchAnalytics.recent_requests.map(request => (
                        <ListItem
                          key={request.id}
                          sx={{
                            borderRadius: 'sm',
                            p: 2,
                            bgcolor: 'background.surface',
                            boxShadow: 'sm',
                          }}
                        >
                          <ListItemContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography level="title-sm">Request #{request.id}</Typography>
                              <Chip 
                                size="sm" 
                                color={request.request_status === 'pending' ? 'warning' : 
                                       request.request_status === 'approved' ? 'success' : 
                                       request.request_status === 'rejected' ? 'danger' : 'primary'}
                                sx={{ textTransform: 'capitalize' }}
                              >
                                {request.request_status}
                              </Chip>
                            </Box>
                            <Typography level="body-xs">
                              Created: {new Date(request.created_at).toLocaleDateString()}
                            </Typography>
                            <Typography level="body-sm" sx={{ mt: 1 }}>
                              ₱{formatCurrency(request.total_amount)}
                            </Typography>
                          </ListItemContent>
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography level="body-sm" sx={{ py: 2 }}>No recent requests found.</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            <Grid xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography level="title-lg">Recent Deliveries</Typography>
                    <Link component={RouterLink} to="/deliveries">View All</Link>
                  </Box>
                  
                  {branchAnalytics.recent_deliveries?.length > 0 ? (
                    <List sx={{ '--List-gap': '8px' }}>
                      {branchAnalytics.recent_deliveries.map(delivery => (
                        <ListItem
                          key={delivery.id}
                          sx={{
                            borderRadius: 'sm',
                            p: 2,
                            bgcolor: 'background.surface',
                            boxShadow: 'sm',
                          }}
                        >
                          <ListItemContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography level="title-sm">{delivery.recipient_name}</Typography>
                              <Chip
                                size="sm"
                                color="success"
                                startDecorator={<CheckCircleIcon />}
                              >
                                Delivered
                              </Chip>
                            </Box>
                            <Typography level="body-xs" noWrap>
                              Tracking: {delivery.tracking_number}
                            </Typography>
                            <Typography level="body-xs" sx={{ mt: 0.5 }}>
                              Delivered: {new Date(delivery.updated_at).toLocaleDateString()}
                            </Typography>
                          </ListItemContent>
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography level="body-sm" sx={{ py: 2 }}>No recent deliveries found.</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}

      {/* Warehouse User Dashboard */}
      {isWarehouse && warehouseAnalytics && (
        <>
          {/* Warehouse Stats Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid xs={12} sm={6} md={3}>
              <Card variant="soft" color="primary">
                <CardContent orientation="horizontal" sx={{ gap: 1 }}>
                  <BarChartIcon sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography level="h4">₱{formatNumber(warehouseAnalytics.total_exported?.total_exported || 0)}</Typography>
                    <Typography level="body-sm">Total Exported</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid xs={12} sm={6} md={3}>
              <Card variant="soft" color="success">
                <CardContent orientation="horizontal" sx={{ gap: 1 }}>
                  <BusinessIcon sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography level="h4">{warehouseAnalytics.most_requests?.name || 'N/A'}</Typography>
                    <Typography level="body-sm">Most Active Branch</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid xs={12} sm={6} md={3}>
              <Card variant="soft" color="warning">
                <CardContent orientation="horizontal" sx={{ gap: 1 }}>
                  <CheckCircleIcon sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography level="h4">{stats?.delivered || 0}</Typography>
                    <Typography level="body-sm">Completed Deliveries</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid xs={12} sm={6} md={3}>
              <Card variant="soft" color="danger">
                <CardContent orientation="horizontal" sx={{ gap: 1 }}>
                  <PendingIcon sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography level="h4">{stats?.inTransit || 0}</Typography>
                    <Typography level="body-sm">In Transit</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Additional Performance Metrics */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <AccessTimeIcon color="primary" />
                    <Typography level="title-md">Avg. Delivery Time</Typography>
                  </Box>
                  <Typography level="h2" sx={{ mb: 1 }}>
                    {warehouseAnalytics.avg_delivery_time?.avg_delivery_time_hours 
                      ? `${Number(warehouseAnalytics.avg_delivery_time.avg_delivery_time_hours).toFixed(1)} hrs` 
                      : 'N/A'}
                  </Typography>
                  <Typography level="body-sm" color="neutral">
                    Average time from creation to delivery
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Delivery Stats */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography level="title-lg">Delivery Completion</Typography>
                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography level="body-sm">Progress</Typography>
                      <Typography level="body-sm">
                        {calculateCompletionRate()}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      determinate
                      value={calculateCompletionRate()}
                      sx={{ my: 1 }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography level="h4">{stats?.pending || 0}</Typography>
                        <Typography level="body-sm">Pending</Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography level="h4">{stats?.inTransit || 0}</Typography>
                        <Typography level="body-sm">In Transit</Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography level="h4">{stats?.delivered || 0}</Typography>
                        <Typography level="body-sm">Delivered</Typography>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography level="title-lg">Recent Requests</Typography>
                  
                  {requests.length > 0 ? (
                    <List sx={{ '--List-gap': '8px', mt: 2 }}>
                      {requests.slice(0, 5).map(request => (
                        <ListItem
                          key={request.id}
                          sx={{
                            borderRadius: 'sm',
                            p: 2,
                            bgcolor: 'background.surface',
                            boxShadow: 'sm',
                          }}
                        >
                          <ListItemContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography level="title-sm">Request #{request.id}</Typography>
                              <Chip 
                                size="sm" 
                                color={request.request_status === 'pending' ? 'warning' : 
                                       request.request_status === 'approved' ? 'success' : 
                                       request.request_status === 'rejected' ? 'danger' : 'primary'}
                                sx={{ textTransform: 'capitalize' }}
                              >
                                {request.request_status}
                              </Chip>
                            </Box>
                            <Typography level="body-sm">
                              {request.branch_name || 'Unknown Branch'}
                            </Typography>
                            <Typography level="body-xs" sx={{ mt: 0.5 }}>
                              ₱{formatCurrency(request.total_amount)} • {new Date(request.created_at).toLocaleDateString()}
                            </Typography>
                          </ListItemContent>
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography level="body-sm" sx={{ py: 2 }}>No requests found.</Typography>
                  )}
                  
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button
                      component={RouterLink}
                      to="/delivery-requests"
                      endDecorator="→"
                      size="sm"
                    >
                      View All Requests
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}

      {/* Admin User Dashboard */}
      {isAdmin && (
        <>
          {/* Admin Overview Stats */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid xs={12} sm={6} md={3}>
              <Card variant="soft" color="primary">
                <CardContent orientation="horizontal" sx={{ gap: 1 }}>
                  <BarChartIcon sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography level="h4">₱{formatNumber(warehouseAnalytics?.total_exported?.total_exported || 0)}</Typography>
                    <Typography level="body-sm">Total Exported</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid xs={12} sm={6} md={3}>
              <Card variant="soft" color="success">
                <CardContent orientation="horizontal" sx={{ gap: 1 }}>
                  <LocalShippingIcon sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography level="h4">{stats?.total || 0}</Typography>
                    <Typography level="body-sm">Total Deliveries</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid xs={12} sm={6} md={3}>
              <Card variant="soft" color="warning">
                <CardContent orientation="horizontal" sx={{ gap: 1 }}>
                  <BusinessIcon sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography level="h4">{warehouseAnalytics?.most_requests?.name || 'N/A'}</Typography>
                    <Typography level="body-sm">Most Active Branch</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid xs={12} sm={6} md={3}>
              <Card variant="soft" color="neutral">
                <CardContent orientation="horizontal" sx={{ gap: 1 }}>
                  <SpeedIcon sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography level="h4">{calculateCompletionRate()}%</Typography>
                    <Typography level="body-sm">Completion Rate</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Additional Performance Metrics */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <AccessTimeIcon color="primary" />
                    <Typography level="title-md">Avg. Delivery Time</Typography>
                  </Box>
                  <Typography level="h2" sx={{ mb: 1 }}>
                    {warehouseAnalytics?.avg_delivery_time?.avg_delivery_time_hours 
                      ? `${Number(warehouseAnalytics.avg_delivery_time.avg_delivery_time_hours).toFixed(1)} hrs` 
                      : 'N/A'}
                  </Typography>
                  <Typography level="body-sm" color="neutral">
                    Average time from creation to delivery
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Branch Performance */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography level="title-lg" sx={{ mb: 2 }}>Branch Performance</Typography>
              
              <Grid container spacing={2}>
                {branchPerformance.map(branch => (
                  <Grid key={branch.branch_id} xs={12} md={6} lg={4}>
                    <Sheet
                      variant="outlined"
                      sx={{ borderRadius: 'md', p: 2, height: '100%' }}
                    >
                      <Typography level="title-md" sx={{ mb: 1 }}>{branch.branch_name}</Typography>
                      
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography level="body-sm">Total Deliveries:</Typography>
                          <Typography level="body-sm">{branch.total_deliveries}</Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography level="body-sm">Completed:</Typography>
                          <Typography level="body-sm">{branch.completed_deliveries}</Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography level="body-sm">In Transit:</Typography>
                          <Typography level="body-sm">{branch.in_transit_deliveries}</Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography level="body-sm">Avg. Delivery Time:</Typography>
                          <Typography level="body-sm">{branch.avg_delivery_time_hours || 'N/A'} hours</Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography level="body-sm">Total Amount:</Typography>
                          <Typography level="body-sm">₱{formatNumber(branch.total_amount || 0)}</Typography>
                        </Box>
                      </Box>
                    </Sheet>
                  </Grid>
                ))}
              </Grid>
              
              {branchPerformance.length === 0 && (
                <Typography level="body-sm" sx={{ py: 2 }}>No branch performance data available.</Typography>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Grid container spacing={2}>
            <Grid xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography level="title-lg">Recent Deliveries</Typography>
                    <Link component={RouterLink} to="/deliveries">View All</Link>
                  </Box>
                  
                  {deliveries.length > 0 ? (
                    <List sx={{ '--List-gap': '8px' }}>
                      {deliveries.slice(0, 5).map(delivery => (
                        <ListItem
                          key={delivery.id}
                          sx={{
                            borderRadius: 'sm',
                            p: 2,
                            bgcolor: 'background.surface',
                            boxShadow: 'sm',
                          }}
                        >
                          <ListItemContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography level="title-sm">{delivery.recipient_name}</Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {delivery.status === 'delivered' && (
                                  <CheckCircleIcon color="success" fontSize="small" />
                                )}
                                {delivery.status === 'pending' && (
                                  <PendingIcon color="warning" fontSize="small" />
                                )}
                                {delivery.status === 'in_transit' && (
                                  <LocalShippingIcon color="info" fontSize="small" />
                                )}
                                <Typography level="body-xs" sx={{ textTransform: 'capitalize' }}>
                                  {delivery.status.replace('_', ' ')}
                                </Typography>
                              </Box>
                            </Box>
                            <Typography level="body-sm" noWrap>
                              {delivery.branch_name || 'No Branch'}
                            </Typography>
                            <Typography level="body-xs" sx={{ mt: 0.5 }}>
                              {new Date(delivery.created_at).toLocaleDateString()}
                            </Typography>
                          </ListItemContent>
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography level="body-sm" sx={{ py: 2 }}>No deliveries found.</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            <Grid xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography level="title-lg">Recent Requests</Typography>
                    <Link component={RouterLink} to="/delivery-requests">View All</Link>
                  </Box>
                  
                  {requests.length > 0 ? (
                    <List sx={{ '--List-gap': '8px' }}>
                      {requests.slice(0, 5).map(request => (
                        <ListItem
                          key={request.id}
                          sx={{
                            borderRadius: 'sm',
                            p: 2,
                            bgcolor: 'background.surface',
                            boxShadow: 'sm',
                          }}
                        >
                          <ListItemContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography level="title-sm">Request #{request.id}</Typography>
                              <Chip 
                                size="sm" 
                                color={request.request_status === 'pending' ? 'warning' : 
                                       request.request_status === 'approved' ? 'success' : 
                                       request.request_status === 'rejected' ? 'danger' : 'primary'}
                                sx={{ textTransform: 'capitalize' }}
                              >
                                {request.request_status}
                              </Chip>
                            </Box>
                            <Typography level="body-sm">
                              {request.branch_name || 'Unknown Branch'}
                            </Typography>
                            <Typography level="body-xs" sx={{ mt: 0.5 }}>
                              ₱{formatCurrency(request.total_amount)} • {new Date(request.created_at).toLocaleDateString()}
                            </Typography>
                          </ListItemContent>
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography level="body-sm" sx={{ py: 2 }}>No requests found.</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  )
}

export default Dashboard 