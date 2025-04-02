import { useState, useEffect } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'

// Joy UI components
import Box from '@mui/joy/Box'
import Button from '@mui/joy/Button'
import Typography from '@mui/joy/Typography'
import IconButton from '@mui/joy/IconButton'
import Chip from '@mui/joy/Chip'
import CircularProgress from '@mui/joy/CircularProgress'
import Input from '@mui/joy/Input'
import Select from '@mui/joy/Select'
import Option from '@mui/joy/Option'
import Alert from '@mui/joy/Alert'
import Card from '@mui/joy/Card'
import CardContent from '@mui/joy/CardContent'
import Tab from '@mui/joy/Tab'
import TabList from '@mui/joy/TabList'
import Tabs from '@mui/joy/Tabs'
import Modal from '@mui/joy/Modal'
import ModalDialog from '@mui/joy/ModalDialog'
import ModalClose from '@mui/joy/ModalClose'
import Stack from '@mui/joy/Stack'
import Sheet from '@mui/joy/Sheet'
import Grid from '@mui/joy/Grid'
import Divider from '@mui/joy/Divider'
import Table from '@mui/joy/Table'

// Icons
import SearchIcon from '@mui/icons-material/Search'
import RefreshIcon from '@mui/icons-material/Refresh'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import FilterAltIcon from '@mui/icons-material/FilterAlt'
import InventoryIcon from '@mui/icons-material/Inventory'
import PendingActionsIcon from '@mui/icons-material/PendingActions'
import FactCheckIcon from '@mui/icons-material/FactCheck'
import VisibilityIcon from '@mui/icons-material/Visibility'

const OngoingDeliveries = () => {
  const { user } = useAuth()
  const [deliveries, setDeliveries] = useState([])
  const [filteredDeliveries, setFilteredDeliveries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [selectedDelivery, setSelectedDelivery] = useState(null)
  const [confirmationOpen, setConfirmationOpen] = useState(false)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    inTransit: 0,
    loading: 0,
    preparing: 0
  })

  const isAdmin = user?.role === 'admin'
  const isBranchUser = user?.role === 'branch'

  // Fetch ongoing deliveries
  const fetchDeliveries = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // For branch users, fetch only deliveries for their branch
      // For admin, fetch all deliveries
      const endpoint = isBranchUser ? '/api/deliveries/branch' : '/api/deliveries'
      console.log(`Fetching deliveries from: ${endpoint}`)
      
      const response = await axios.get(endpoint)
      
      // Ensure we have a valid response with data
      if (!response.data || !Array.isArray(response.data)) {
        console.error('Invalid data format received:', response.data)
        throw new Error('Invalid data received from server')
      }
      
      console.log(`Received ${response.data.length} deliveries`)
      
      // Filter to only show active deliveries (not delivered or cancelled)
      // Only include valid delivery objects
      const ongoingDeliveries = response.data
        .filter(delivery => delivery && typeof delivery === 'object')
        .filter(delivery => 
          delivery.status && 
          ['preparing', 'loading', 'in_transit'].includes(delivery.status)
        )
      
      console.log(`Filtered to ${ongoingDeliveries.length} ongoing deliveries`)
      
      setDeliveries(ongoingDeliveries)
      setFilteredDeliveries(ongoingDeliveries)
      
      // Calculate stats
      const total = ongoingDeliveries.length
      const inTransit = ongoingDeliveries.filter(d => d.status === 'in_transit').length
      const loading = ongoingDeliveries.filter(d => d.status === 'loading').length
      const preparing = ongoingDeliveries.filter(d => d.status === 'preparing').length
      
      setStats({
        total,
        inTransit,
        loading,
        preparing
      })
    } catch (err) {
      console.error('Error fetching ongoing deliveries:', err)
      let errorMessage = 'Failed to load ongoing deliveries. '
      
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Server response error:', err.response.data)
        errorMessage += `Server responded with status ${err.response.status}.`
        
        if (err.response.data && err.response.data.message) {
          errorMessage += ` ${err.response.data.message}`
        }
      } else if (err.request) {
        // The request was made but no response was received
        errorMessage += 'Server did not respond. Please check if the server is running.'
      } else {
        // Something happened in setting up the request that triggered an Error
        errorMessage += err.message || ''
      }
      
      setError(errorMessage)
      setDeliveries([])
      setFilteredDeliveries([])
      setStats({
        total: 0,
        inTransit: 0,
        loading: 0,
        preparing: 0
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDeliveries()
  }, [user])

  // Filter deliveries based on search term, status and priority
  useEffect(() => {
    let result = deliveries

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(delivery => delivery.status === statusFilter)
    }

    // Apply priority filter
    if (priorityFilter !== 'all') {
      result = result.filter(delivery => delivery.priority === priorityFilter)
    }

    // Apply search filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase()
      result = result.filter(
        delivery =>
          delivery.tracking_number?.toLowerCase().includes(lowerSearchTerm) ||
          (delivery.recipient_name && delivery.recipient_name.toLowerCase().includes(lowerSearchTerm)) ||
          delivery.id?.toString().includes(lowerSearchTerm) ||
          (delivery.created_by_user && delivery.created_by_user.toLowerCase().includes(lowerSearchTerm))
      )
    }

    setFilteredDeliveries(result)
  }, [deliveries, searchTerm, statusFilter, priorityFilter])

  // Confirm delivery receipt
  const confirmDeliveryReceipt = async () => {
    if (!selectedDelivery) return

    try {
      const response = await axios.put(`/api/deliveries/${selectedDelivery.id}/confirm-receipt`, {
        status: 'delivered'
      })

      // Update local state
      setDeliveries(deliveries.map(delivery => 
        delivery.id === selectedDelivery.id ? response.data : delivery
      ))

      setConfirmationOpen(false)
      fetchDeliveries() // Refresh data
    } catch (err) {
      console.error('Error confirming delivery:', err)
      alert('Failed to confirm delivery receipt')
    }
  }

  // View delivery details in modal
  const openDetailsModal = (delivery) => {
    setSelectedDelivery(delivery);
    setDetailsModalOpen(true);
  };

  // Render status chip
  const renderStatusChip = (status) => {
    let color = 'neutral'
    if (!status) return <Chip size="sm" variant="soft" color={color}>Unknown</Chip>
    
    if (status === 'delivered') color = 'success'
    if (status === 'in_transit') color = 'primary'
    if (status === 'loading') color = 'warning'
    if (status === 'preparing') color = 'neutral'

    return (
      <Chip
        size="sm"
        variant="soft"
        color={color}
        sx={{ textTransform: 'capitalize' }}
      >
        {status.replace('_', ' ')}
      </Chip>
    )
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
        <Alert color="danger" sx={{ mb: 2 }}>
          <Typography fontWeight="bold" mb={1}>Error: {error}</Typography>
          <Typography level="body-sm">
            This may be due to server connectivity issues or database problems.
          </Typography>
        </Alert>
        <Button
          onClick={() => fetchDeliveries()}
          sx={{ mt: 2 }}
          startDecorator={<RefreshIcon />}
        >
          Retry
        </Button>
        <Button
          component={RouterLink}
          to="/"
          sx={{ mt: 2, ml: 2 }}
          variant="outlined"
          startDecorator={<ArrowBackIcon />}
        >
          Back to Dashboard
        </Button>
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
            <LocalShippingIcon fontSize="large" />
          </Sheet>
          <Typography level="h4">Branch Ongoing Deliveries</Typography>
        </Box>
        
        <Button
          variant="outlined"
          startDecorator={<RefreshIcon />}
          onClick={fetchDeliveries}
        >
          Refresh
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid xs={12} sm={6} md={3}>
          <Card variant="outlined" sx={{ bgcolor: 'background.level1' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <LocalShippingIcon fontSize="xl" color="primary" />
              <Box>
                <Typography level="body-xs">Total Active</Typography>
                <Typography level="h1">{stats.total}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid xs={12} sm={6} md={3}>
          <Card variant="outlined" sx={{ bgcolor: 'background.level1' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <LocalShippingIcon fontSize="xl" color="primary" />
              <Box>
                <Typography level="body-xs">In Transit</Typography>
                <Typography level="h1">{stats.inTransit}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid xs={12} sm={6} md={3}>
          <Card variant="outlined" sx={{ bgcolor: 'background.level1' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <InventoryIcon fontSize="xl" color="warning" />
              <Box>
                <Typography level="body-xs">Loading</Typography>
                <Typography level="h1">{stats.loading}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid xs={12} sm={6} md={3}>
          <Card variant="outlined" sx={{ bgcolor: 'background.level1' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <AccessTimeIcon fontSize="xl" color="neutral" />
              <Box>
                <Typography level="body-xs">Preparing</Typography>
                <Typography level="h1">{stats.preparing}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <Typography level="body-sm" sx={{ alignSelf: 'center', minWidth: '60px' }}>Search</Typography>
        <Input
          placeholder="Search by ID, order reference..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          startDecorator={<SearchIcon />}
          sx={{ flex: 1, minWidth: '200px' }}
        />
        
        <Typography level="body-sm" sx={{ alignSelf: 'center', ml: 2 }}>Status</Typography>
        <Select
          value={statusFilter}
          onChange={(e, value) => setStatusFilter(value)}
          placeholder="All Statuses"
          sx={{ minWidth: 150 }}
        >
          <Option value="all">All Statuses</Option>
          <Option value="preparing">Preparing</Option>
          <Option value="loading">Loading</Option>
          <Option value="in_transit">In Transit</Option>
        </Select>

        <Typography level="body-sm" sx={{ alignSelf: 'center', ml: 2 }}>Priority</Typography>
        <Select
          value={priorityFilter}
          onChange={(e, value) => setPriorityFilter(value)}
          placeholder="All Priorities"
          sx={{ minWidth: 150 }}
        >
          <Option value="all">All Priorities</Option>
          <Option value="low">Low</Option>
          <Option value="medium">Medium</Option>
          <Option value="high">High</Option>
        </Select>
      </Box>

      {/* Status Tabs */}
      <Tabs 
        value={statusFilter} 
        onChange={(e, value) => setStatusFilter(value)}
        sx={{ mb: 3 }}
      >
        <TabList>
          <Tab value="all">All Deliveries ({stats.total})</Tab>
          <Tab value="in_transit">In Transit ({stats.inTransit})</Tab>
          <Tab value="loading">Loading ({stats.loading})</Tab>
          <Tab value="preparing">Preparing ({stats.preparing})</Tab>
        </TabList>
      </Tabs>

      {/* Deliveries List */}
      {filteredDeliveries.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center', bgcolor: 'background.level1', borderRadius: 'sm' }}>
          <Typography level="body-lg">No ongoing deliveries found</Typography>
        </Box>
      ) : (
        <Box sx={{ mt: 2 }}>
          <Table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Tracking Number</th>
                <th>Recipient</th>
                <th>Status</th>
                <th>Est. Delivery Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeliveries.map((delivery) => (
                <tr key={delivery.id}>
                  <td>{delivery.id}</td>
                  <td>{delivery.tracking_number || 'N/A'}</td>
                  <td>{delivery.recipient_name || 'N/A'}</td>
                  <td>{renderStatusChip(delivery.status)}</td>
                  <td>{delivery.delivery_date ? new Date(delivery.delivery_date).toLocaleDateString() : 'Not scheduled'}</td>
                  <td>
                    {delivery.status === 'in_transit' && (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="sm"
                          color="success"
                          startDecorator={<CheckCircleIcon />}
                          onClick={() => {
                            setSelectedDelivery(delivery);
                            setConfirmationOpen(true);
                          }}
                        >
                          Confirm Receipt
                        </Button>
                        <IconButton
                          size="sm"
                          variant="plain"
                          color="neutral"
                          onClick={() => openDetailsModal(delivery)}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Box>
                    )}
                    {delivery.status !== 'in_transit' && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography level="body-sm" color="neutral">
                          Awaiting delivery
                        </Typography>
                        <IconButton
                          size="sm"
                          variant="plain"
                          color="neutral"
                          onClick={() => openDetailsModal(delivery)}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Box>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Box>
      )}

      {/* Confirmation Modal */}
      <Modal open={confirmationOpen} onClose={() => setConfirmationOpen(false)}>
        <ModalDialog>
          <ModalClose />
          <Typography level="title-lg">Confirm Delivery Receipt</Typography>
          <Divider sx={{ my: 2 }} />
          <Typography sx={{ mb: 2 }}>
            Are you sure you want to confirm that delivery #{selectedDelivery?.id} with tracking number {selectedDelivery?.tracking_number} has been received?
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              color="neutral"
              onClick={() => setConfirmationOpen(false)}
            >
              Cancel
            </Button>
            <Button
              color="success"
              startDecorator={<CheckCircleIcon />}
              onClick={confirmDeliveryReceipt}
            >
              Confirm Receipt
            </Button>
          </Box>
        </ModalDialog>
      </Modal>

      {/* Details Modal */}
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
                          <Typography level="body-sm">Priority:</Typography>
                          <Typography level="body-sm" fontWeight="bold" sx={{ textTransform: 'capitalize' }}>{selectedDelivery.priority || 'N/A'}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography level="body-sm">Est. Delivery Date:</Typography>
                          <Typography level="body-sm" fontWeight="bold">
                            {selectedDelivery.delivery_date ? new Date(selectedDelivery.delivery_date).toLocaleDateString() : 'Not scheduled'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography level="body-sm">Created:</Typography>
                          <Typography level="body-sm" fontWeight="bold">
                            {selectedDelivery.created_at ? new Date(selectedDelivery.created_at).toLocaleDateString() : 'Unknown'}
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
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </ModalDialog>
      </Modal>

      {/* Back Button */}
      <Box sx={{ mt: 4 }}>
        <Button
          component={RouterLink}
          to="/"
          startDecorator={<ArrowBackIcon />}
          variant="outlined"
        >
          Back
        </Button>
      </Box>
    </Box>
  )
}

export default OngoingDeliveries 