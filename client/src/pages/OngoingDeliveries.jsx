import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'

// Joy UI components
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import IconButton from '@mui/joy/IconButton'
import Chip from '@mui/joy/Chip'
import CircularProgress from '@mui/joy/CircularProgress'
import Input from '@mui/joy/Input'
import Select from '@mui/joy/Select'
import Option from '@mui/joy/Option'
import Alert from '@mui/joy/Alert'
import Sheet from '@mui/joy/Sheet'
import Table from '@mui/joy/Table'
import Button from '@mui/joy/Button'
import FormControl from '@mui/joy/FormControl'
import FormLabel from '@mui/joy/FormLabel'
import Tooltip from '@mui/joy/Tooltip'
import Modal from '@mui/joy/Modal'
import ModalDialog from '@mui/joy/ModalDialog'
import ModalClose from '@mui/joy/ModalClose'
import Grid from '@mui/joy/Grid'
import Divider from '@mui/joy/Divider'
import Card from '@mui/joy/Card'
import CardContent from '@mui/joy/CardContent'

// Icons
import SearchIcon from '@mui/icons-material/Search'
import RefreshIcon from '@mui/icons-material/Refresh'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PendingIcon from '@mui/icons-material/Pending'
import WarehouseIcon from '@mui/icons-material/Warehouse'
import VisibilityIcon from '@mui/icons-material/Visibility'
import FilterAltIcon from '@mui/icons-material/FilterAlt'
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff'

const OngoingDeliveries = () => {
  const { user } = useAuth()
  const [deliveries, setDeliveries] = useState([])
  const [filteredDeliveries, setFilteredDeliveries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedDelivery, setSelectedDelivery] = useState(null)
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
      const params = { 
        ongoing: true // Add a flag to indicate we only want ongoing deliveries
      }
      
      const response = await axios.get(endpoint, { params })
      
      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Invalid data received from server')
      }
      
      // Filter to only show active deliveries (not delivered or cancelled)
      const ongoingDeliveries = response.data
        .filter(delivery => 
          delivery && typeof delivery === 'object' &&
          delivery.status && 
          ['preparing', 'loading', 'in_transit'].includes(delivery.status)
        )
      
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
      let errorMessage = 'Failed to load ongoing deliveries'
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

  // Filter deliveries based on search term and status
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
          (delivery.tracking_number && delivery.tracking_number.toLowerCase().includes(lowerSearchTerm)) ||
          (delivery.recipient_name && delivery.recipient_name.toLowerCase().includes(lowerSearchTerm)) ||
          (delivery.id && delivery.id.toString().includes(lowerSearchTerm)) ||
          (delivery.branch_name && delivery.branch_name.toLowerCase().includes(lowerSearchTerm)) ||
          (delivery.created_by_user && delivery.created_by_user.toLowerCase().includes(lowerSearchTerm))
      )
    }

    setFilteredDeliveries(result)
  }, [deliveries, searchTerm, statusFilter])

  // Open details modal
  const openDetailsModal = (delivery) => {
    setSelectedDelivery(delivery)
    setDetailsModalOpen(true)
  }

  // Render status chip
  const renderStatusChip = (status) => {
    let color, icon
    
    switch (status) {
      case 'in_transit':
        color = 'primary'
        icon = <LocalShippingIcon />
        break
      case 'preparing':
        color = 'neutral'
        icon = <WarehouseIcon />
        break
      case 'loading':
        color = 'warning'
        icon = <PendingIcon />
        break
      default:
        color = 'neutral'
        icon = <PendingIcon />
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

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
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
            <LocalShippingIcon fontSize="large" />
          </Sheet>
          <Typography level="h4">Ongoing Deliveries</Typography>
        </Box>
        <Button
          startDecorator={<RefreshIcon />}
          onClick={fetchDeliveries}
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

      {/* Stats Cards */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Card sx={{ flex: 1, minWidth: 200 }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography level="h3">{stats.total}</Typography>
            <Typography level="body-md">Total Ongoing</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, minWidth: 200 }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography level="h3" color="primary">{stats.inTransit}</Typography>
            <Typography level="body-md">In Transit</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, minWidth: 200 }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography level="h3" color="warning">{stats.loading}</Typography>
            <Typography level="body-md">Loading</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, minWidth: 200 }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography level="h3" color="neutral">{stats.preparing}</Typography>
            <Typography level="body-md">Preparing</Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <FormControl sx={{ minWidth: 200 }}>
              <FormLabel>Search</FormLabel>
              <Input
                placeholder="Search by tracking #, recipient..."
                startDecorator={<SearchIcon />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </FormControl>
            <FormControl sx={{ minWidth: 150 }}>
              <FormLabel>Status</FormLabel>
              <Select
                value={statusFilter}
                onChange={(e, value) => setStatusFilter(value)}
                startDecorator={<FilterAltIcon />}
              >
                <Option value="all">All Status</Option>
                <Option value="in_transit">In Transit</Option>
                <Option value="loading">Loading</Option>
                <Option value="preparing">Preparing</Option>
              </Select>
            </FormControl>
            <Button
              variant="soft"
              color="neutral"
              startDecorator={<FilterAltOffIcon />}
              onClick={resetFilters}
            >
              Reset
            </Button>
          </Box>
        </CardContent>
      </Card>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredDeliveries.length === 0 ? (
        <Alert color="neutral" sx={{ mt: 2 }}>
          No ongoing deliveries found.
        </Alert>
      ) : (
        <Sheet sx={{ borderRadius: 'md', overflow: 'auto' }}>
          <Table sx={{ '& th': { textAlign: 'left', py: 1.5 } }}>
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
                        onClick={() => openDetailsModal(delivery)}
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

      {/* Delivery Details Modal */}
      {selectedDelivery && (
        <Modal open={detailsModalOpen} onClose={() => setDetailsModalOpen(false)}>
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
              {selectedDelivery.delivery_date && (
                <Grid xs={12} sm={6}>
                  <Typography level="title-md">Expected Delivery Date</Typography>
                  <Typography>{formatDate(selectedDelivery.delivery_date)}</Typography>
                </Grid>
              )}
              {selectedDelivery.request_id && (
                <Grid xs={12} sm={6}>
                  <Typography level="title-md">Request ID</Typography>
                  <Typography>#{selectedDelivery.request_id}</Typography>
                </Grid>
              )}
            </Grid>
          </ModalDialog>
        </Modal>
      )}
    </Box>
  )
}

export default OngoingDeliveries 