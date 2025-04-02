import { useState, useEffect } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'

// Joy UI components
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import Grid from '@mui/joy/Grid'
import Card from '@mui/joy/Card'
import CardContent from '@mui/joy/CardContent'
import CardOverflow from '@mui/joy/CardOverflow'
import Divider from '@mui/joy/Divider'
import AspectRatio from '@mui/joy/AspectRatio'
import Chip from '@mui/joy/Chip'
import Button from '@mui/joy/Button'
import FormControl from '@mui/joy/FormControl'
import FormLabel from '@mui/joy/FormLabel'
import Select from '@mui/joy/Select'
import Option from '@mui/joy/Option'
import Tabs from '@mui/joy/Tabs'
import TabList from '@mui/joy/TabList'
import Tab from '@mui/joy/Tab'
import TabPanel from '@mui/joy/TabPanel'
import Sheet from '@mui/joy/Sheet'
import Table from '@mui/joy/Table'
import Alert from '@mui/joy/Alert'
import CircularProgress from '@mui/joy/CircularProgress'
import List from '@mui/joy/List'
import ListItem from '@mui/joy/ListItem'
import ListItemContent from '@mui/joy/ListItemContent'
import ListDivider from '@mui/joy/ListDivider'

// Icons
import EqualizerIcon from '@mui/icons-material/Equalizer'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import StorefrontIcon from '@mui/icons-material/Storefront'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import InventoryIcon from '@mui/icons-material/Inventory'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import CalendarViewMonthIcon from '@mui/icons-material/CalendarViewMonth'
import CalendarViewWeekIcon from '@mui/icons-material/CalendarViewWeek'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import WarehouseIcon from '@mui/icons-material/Warehouse'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import RefreshIcon from '@mui/icons-material/Refresh'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

const Summary = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [timeframe, setTimeframe] = useState('month')
  const [branchId, setBranchId] = useState(null)
  const [branches, setBranches] = useState([])
  const [viewingBranchDetails, setViewingBranchDetails] = useState(false)
  const [activeTab, setActiveTab] = useState(
    user?.role === 'admin' ? 'branch' : 
    user?.role === 'branch' ? 'branch' : 'warehouse'
  )
  
  // Data states
  const [branchPerformance, setBranchPerformance] = useState([])
  const [branchSummary, setBranchSummary] = useState(null)
  const [warehouseData, setWarehouseData] = useState(null)
  
  const isAdmin = user?.role === 'admin'
  const isWarehouse = user?.role === 'warehouse'
  const isBranch = user?.role === 'branch'
  
  // Fetch branches for filtering (admin only)
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await axios.get('/api/branches')
        setBranches(response.data)
        
        // Set default branch if needed
        if (isBranch && user.branch_id) {
          setBranchId(user.branch_id)
          setViewingBranchDetails(true)
        }
      } catch (err) {
        console.error('Error fetching branches:', err)
        setError('Failed to load branches')
      }
    }
    
    fetchBranches()
  }, [user, isBranch])
  
  // Fetch branch performance data
  const fetchBranchPerformance = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/analytics/branch-performance', {
        params: {
          timeframe,
          branch_id: branchId
        }
      })
      setBranchPerformance(response.data)
      setError(null)
    } catch (err) {
      console.error('Error fetching branch performance:', err)
      setError('Failed to load performance metrics')
    } finally {
      setLoading(false)
    }
  }
  
  // Fetch branch summary
  const fetchBranchSummary = async (id = branchId) => {
    try {
      setLoading(true)
      
      if (id) {
        setViewingBranchDetails(true)
        setBranchId(id)
      }
      
      const response = await axios.get(`/api/analytics/branch-summary/${id || ''}`, {
        params: { timeframe }
      })
      setBranchSummary(response.data)
      setError(null)
    } catch (err) {
      console.error('Error fetching branch summary:', err)
      setError('Failed to load branch summary')
    } finally {
      setLoading(false)
    }
  }
  
  // Fetch warehouse data
  const fetchWarehouseData = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/analytics/warehouse', {
        params: { timeframe }
      })
      setWarehouseData(response.data)
      setError(null)
    } catch (err) {
      console.error('Error fetching warehouse data:', err)
      setError('Failed to load warehouse analytics')
    } finally {
      setLoading(false)
    }
  }
  
  // Back to branch overview
  const handleBackToBranchOverview = () => {
    setViewingBranchDetails(false)
    setBranchId(null)
    fetchBranchPerformance()
  }
  
  // Fetch data based on user role
  useEffect(() => {
    if (!user) return
    
    if (isAdmin && !viewingBranchDetails) {
      fetchBranchPerformance()
    }
    
    if ((isBranch || (isAdmin && viewingBranchDetails)) && branchId) {
      fetchBranchSummary(branchId)
    }
    
    if (isWarehouse || isAdmin) {
      fetchWarehouseData()
    }
  }, [user, timeframe, branchId, isAdmin, isWarehouse, isBranch, viewingBranchDetails])
  
  // Handle time period change
  const handleTimeframeChange = (_, value) => {
    setTimeframe(value)
  }
  
  // Handle branch change (for admin)
  const handleBranchChange = (_, value) => {
    setBranchId(value)
    setViewingBranchDetails(true)
    fetchBranchSummary(value)
  }
  
  // Handle tab change
  const handleTabChange = (_, value) => {
    setActiveTab(value)
    
    if (value === 'branch' && isAdmin) {
      setViewingBranchDetails(false)
      setBranchId(null)
      fetchBranchPerformance()
    }
  }
  
  // Format currency
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '₱0.00'
    return `₱${parseFloat(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`
  }
  
  // Format time
  const formatTime = (hours) => {
    if (hours === null || hours === undefined) return 'N/A'
    
    // Convert to human-readable format
    if (hours < 1) {
      return `${Math.round(hours * 60)} minutes`
    } else if (hours < 24) {
      return `${Math.round(hours)} hours`
    } else {
      return `${Math.round(hours / 24)} days`
    }
  }
  
  if (loading && !branchPerformance.length && !branchSummary && !warehouseData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    )
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
            <EqualizerIcon fontSize="large" />
          </Sheet>
          <Typography level="h4">Performance Summary</Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
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
            onClick={() => {
              if (isAdmin && !viewingBranchDetails) fetchBranchPerformance()
              if ((isBranch || (isAdmin && viewingBranchDetails)) && branchId) fetchBranchSummary(branchId)
              if (isWarehouse || isAdmin) fetchWarehouseData()
            }}
            sx={{ alignSelf: 'flex-end' }}
          >
            Refresh
          </Button>
        </Box>
      </Box>
      
      {error && (
        <Alert color="danger" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Tabs for different views */}
      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <TabList>
          {(isBranch || isAdmin) && <Tab value="branch">Branch Analytics</Tab>}
          {(isWarehouse || isAdmin) && <Tab value="warehouse">Supply Analytics</Tab>}
        </TabList>
        
        {/* Branch Analytics Tab Panel */}
        {(isBranch || isAdmin) && (
          <TabPanel value="branch">
            {isAdmin && viewingBranchDetails && (
              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Button
                  startDecorator={<ArrowBackIcon />}
                  variant="outlined"
                  onClick={handleBackToBranchOverview}
                >
                  Back to Overview
                </Button>
                
                {isAdmin && (
                  <FormControl size="sm" sx={{ minWidth: 180 }}>
                    <FormLabel>Select Branch</FormLabel>
                    <Select
                      placeholder="Select Branch"
                      value={branchId}
                      onChange={handleBranchChange}
                      startDecorator={<StorefrontIcon />}
                      slotProps={{
                        button: { sx: { whiteSpace: 'nowrap' } }
                      }}
                    >
                      {branches.map((branch) => (
                        <Option key={branch.id} value={branch.id}>
                          {branch.name}
                        </Option>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </Box>
            )}
            
            {/* Branch Overview (for admin when not viewing a specific branch) */}
            {isAdmin && !viewingBranchDetails ? (
              <>
                <Typography level="title-lg" sx={{ mb: 2 }}>Branch Performance Overview</Typography>
                
                {branchPerformance.length === 0 ? (
                  <Alert color="warning">No performance data available for the selected time period.</Alert>
                ) : (
                  <Grid container spacing={2}>
                    {branchPerformance.map((branch) => (
                      <Grid key={branch.branch_id} xs={12} md={6} lg={4}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography level="title-md" sx={{ mb: 1 }}>
                              {branch.branch_name}
                            </Typography>
                            
                            <Divider sx={{ my: 1.5 }} />
                            
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                              <Box sx={{ minWidth: '45%' }}>
                                <Typography level="body-xs">Total Deliveries</Typography>
                                <Typography level="h4">{branch.total_deliveries}</Typography>
                              </Box>
                              
                              <Box sx={{ minWidth: '45%' }}>
                                <Typography level="body-xs">Completed</Typography>
                                <Typography level="h4">
                                  {branch.completed_deliveries}
                                  <Typography level="body-xs" sx={{ ml: 0.5 }}>
                                    ({Math.round((branch.completed_deliveries / branch.total_deliveries) * 100) || 0}%)
                                  </Typography>
                                </Typography>
                              </Box>
                              
                              <Box sx={{ minWidth: '45%' }}>
                                <Typography level="body-xs">Avg. Delivery Time</Typography>
                                <Typography level="h5">{formatTime(branch.avg_delivery_time_hours)}</Typography>
                              </Box>
                              
                              <Box sx={{ minWidth: '45%' }}>
                                <Typography level="body-xs">In Transit</Typography>
                                <Typography level="h5">{branch.in_transit_deliveries}</Typography>
                              </Box>
                              
                              <Box sx={{ width: '100%' }}>
                                <Typography level="body-xs">Total Amount</Typography>
                                <Typography level="h4">{formatCurrency(branch.total_amount)}</Typography>
                              </Box>
                              
                              <Box sx={{ width: '100%' }}>
                                <Typography level="body-xs">Request to Delivery Time</Typography>
                                <Typography level="h5">
                                  {formatTime(branch.avg_request_to_delivery_hours)}
                                </Typography>
                              </Box>
                            </Box>
                          </CardContent>
                          <CardOverflow variant="soft" sx={{ bgcolor: 'background.level1' }}>
                            <Box sx={{ p: 1.5, display: 'flex', gap: 1 }}>
                              <Button
                                size="sm"
                                variant="solid"
                                color="primary"
                                onClick={() => fetchBranchSummary(branch.branch_id)}
                              >
                                View Details
                              </Button>
                            </Box>
                          </CardOverflow>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </>
            ) : (
              /* Branch Details View */
              branchSummary ? (
                <>
                  <Typography level="title-lg" sx={{ mb: 2 }}>
                    {branchSummary.branch?.name || 'Branch'} Summary
                  </Typography>
                  
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid xs={12} md={6} lg={3}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography level="body-xs">Total Imported Amount</Typography>
                          <Typography level="h3">{formatCurrency(branchSummary.summary?.total_imported)}</Typography>
                          <Typography level="body-sm" sx={{ mt: 1 }}>
                            <ArrowDownwardIcon fontSize="small" sx={{ color: 'success.500', verticalAlign: 'middle' }} />
                            {' '}Total approved request value
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    
                    <Grid xs={12} md={6} lg={3}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography level="body-xs">Completed Deliveries</Typography>
                          <Typography level="h3">{branchSummary.summary?.completed_deliveries || 0}</Typography>
                          <Typography level="body-sm" sx={{ mt: 1 }}>
                            <LocalShippingIcon fontSize="small" sx={{ color: 'success.500', verticalAlign: 'middle' }} />
                            {' '}Successfully delivered
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    
                    <Grid xs={12} md={6} lg={3}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography level="body-xs">Ongoing Deliveries</Typography>
                          <Typography level="h3">{branchSummary.summary?.ongoing_deliveries || 0}</Typography>
                          <Typography level="body-sm" sx={{ mt: 1 }}>
                            <LocalShippingIcon fontSize="small" sx={{ color: 'primary.500', verticalAlign: 'middle' }} />
                            {' '}In progress
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    
                    <Grid xs={12} md={6} lg={3}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography level="body-xs">Pending Requests</Typography>
                          <Typography level="h3">{branchSummary.summary?.ongoing_requests || 0}</Typography>
                          <Typography level="body-sm" sx={{ mt: 1 }}>
                            <AccessTimeIcon fontSize="small" sx={{ color: 'warning.500', verticalAlign: 'middle' }} />
                            {' '}Awaiting action
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                  
                  <Grid container spacing={2}>
                    <Grid xs={12} md={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography level="title-md" sx={{ mb: 2 }}>Recent Completed Deliveries</Typography>
                          
                          {branchSummary.recent_deliveries?.length > 0 ? (
                            <List>
                              {branchSummary.recent_deliveries.map((delivery, index) => (
                                <>
                                  <ListItem key={delivery.id}>
                                    <ListItemContent sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                      <Box>
                                        <Typography level="title-sm">{delivery.tracking_number}</Typography>
                                        <Typography level="body-xs">{delivery.recipient_name}</Typography>
                                      </Box>
                                      <Box sx={{ textAlign: 'right' }}>
                                        <Typography level="body-xs">
                                          {new Date(delivery.updated_at).toLocaleDateString()}
                                        </Typography>
                                        <Chip
                                          size="sm"
                                          variant="soft"
                                          color="success"
                                          sx={{ textTransform: 'capitalize' }}
                                        >
                                          {delivery.status.replace('_', ' ')}
                                        </Chip>
                                      </Box>
                                    </ListItemContent>
                                  </ListItem>
                                  {index < branchSummary.recent_deliveries.length - 1 && <ListDivider />}
                                </>
                              ))}
                            </List>
                          ) : (
                            <Typography level="body-sm" sx={{ textAlign: 'center', py: 2 }}>
                              No completed deliveries in this time period
                            </Typography>
                          )}
                        </CardContent>
                        <CardOverflow variant="soft" sx={{ bgcolor: 'background.level1' }}>
                          <Box sx={{ p: 1.5, display: 'flex', gap: 1 }}>
                            <Button
                              size="sm"
                              variant="solid"
                              color="primary"
                              component={RouterLink}
                              to="/ongoing-deliveries"
                            >
                              View All Deliveries
                            </Button>
                          </Box>
                        </CardOverflow>
                      </Card>
                    </Grid>
                    
                    <Grid xs={12} md={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography level="title-md" sx={{ mb: 2 }}>Recent Requests</Typography>
                          
                          {branchSummary.recent_requests?.length > 0 ? (
                            <List>
                              {branchSummary.recent_requests.map((request, index) => (
                                <>
                                  <ListItem key={request.id}>
                                    <ListItemContent sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                      <Box>
                                        <Typography level="title-sm">Request #{request.id}</Typography>
                                        <Typography level="body-xs">
                                          {formatCurrency(request.total_amount)}
                                        </Typography>
                                      </Box>
                                      <Box sx={{ textAlign: 'right' }}>
                                        <Typography level="body-xs">
                                          {new Date(request.created_at).toLocaleDateString()}
                                        </Typography>
                                        <Chip
                                          size="sm"
                                          variant="soft"
                                          color={
                                            request.request_status === 'approved' ? 'success' :
                                            request.request_status === 'rejected' ? 'danger' :
                                            request.request_status === 'processing' ? 'primary' :
                                            'warning'
                                          }
                                          sx={{ textTransform: 'capitalize' }}
                                        >
                                          {request.request_status}
                                        </Chip>
                                      </Box>
                                    </ListItemContent>
                                  </ListItem>
                                  {index < branchSummary.recent_requests.length - 1 && <ListDivider />}
                                </>
                              ))}
                            </List>
                          ) : (
                            <Typography level="body-sm" sx={{ textAlign: 'center', py: 2 }}>
                              No requests in this time period
                            </Typography>
                          )}
                        </CardContent>
                        <CardOverflow variant="soft" sx={{ bgcolor: 'background.level1' }}>
                          <Box sx={{ p: 1.5, display: 'flex', gap: 1 }}>
                            <Button
                              size="sm"
                              variant="solid"
                              color="primary"
                              component={RouterLink}
                              to="/delivery-requests"
                            >
                              View All Requests
                            </Button>
                          </Box>
                        </CardOverflow>
                      </Card>
                    </Grid>
                  </Grid>
                </>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              )
            )}
          </TabPanel>
        )}
        
        {/* Supply Analytics Tab Panel (Warehouse) */}
        {(isWarehouse || isAdmin) && (
          <TabPanel value="warehouse">
            {warehouseData ? (
              <>
                <Typography level="title-lg" sx={{ mb: 2 }}>Warehouse Export Analytics</Typography>
                
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid xs={12} md={6} lg={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography level="body-xs">Total Exported Amount</Typography>
                        <Typography level="h3">{formatCurrency(warehouseData.total_exported?.total_exported)}</Typography>
                        <Typography level="body-sm" sx={{ mt: 1 }}>
                          <ArrowUpwardIcon fontSize="small" sx={{ color: 'success.500', verticalAlign: 'middle' }} />
                          {' '}Total hardware supplies exported
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid xs={12} md={6} lg={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography level="body-xs">Branch with Most Requests</Typography>
                        <Typography level="h4">{warehouseData.most_requests?.name || 'N/A'}</Typography>
                        <Typography level="body-sm" sx={{ mt: 1 }}>
                          <ReceiptLongIcon fontSize="small" sx={{ color: 'primary.500', verticalAlign: 'middle' }} />
                          {' '}{warehouseData.most_requests?.request_count || 0} requests
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid xs={12} md={6} lg={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography level="body-xs">Branch with Highest Value</Typography>
                        <Typography level="h4">{warehouseData.most_expensive?.name || 'N/A'}</Typography>
                        <Typography level="body-sm" sx={{ mt: 1 }}>
                          <TrendingUpIcon fontSize="small" sx={{ color: 'success.500', verticalAlign: 'middle' }} />
                          {' '}{formatCurrency(warehouseData.most_expensive?.total_value)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
                
                <Card variant="outlined" sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography level="title-md" sx={{ mb: 2 }}>Monthly Export Values</Typography>
                    
                    {warehouseData.monthly_totals?.length > 0 ? (
                      <Table>
                        <thead>
                          <tr>
                            <th>Month</th>
                            <th>Total Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {warehouseData.monthly_totals.map((month) => (
                            <tr key={month.month}>
                              <td>{month.month}</td>
                              <td>{formatCurrency(month.monthly_amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    ) : (
                      <Typography level="body-sm" sx={{ textAlign: 'center', py: 2 }}>
                        No monthly data available
                      </Typography>
                    )}
                  </CardContent>
                </Card>
                
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
                  <Button
                    variant="outlined"
                    color="primary"
                    component={RouterLink}
                    to="/delivery-requests"
                  >
                    View All Requests
                  </Button>
                  <Button
                    variant="solid"
                    color="primary"
                    component={RouterLink}
                    to="/deliveries"
                  >
                    Manage Deliveries
                  </Button>
                </Box>
              </>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            )}
          </TabPanel>
        )}
      </Tabs>
    </Box>
  )
}

export default Summary 