import { useState, useEffect } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'

// Joy UI components
import Box from '@mui/joy/Box'
import Button from '@mui/joy/Button'
import Typography from '@mui/joy/Typography'
import Table from '@mui/joy/Table'
import Sheet from '@mui/joy/Sheet'
import IconButton from '@mui/joy/IconButton'
import Chip from '@mui/joy/Chip'
import CircularProgress from '@mui/joy/CircularProgress'
import FormControl from '@mui/joy/FormControl'
import FormLabel from '@mui/joy/FormLabel'
import Input from '@mui/joy/Input'
import Select from '@mui/joy/Select'
import Option from '@mui/joy/Option'
import Alert from '@mui/joy/Alert'
import Tooltip from '@mui/joy/Tooltip'
import Modal from '@mui/joy/Modal'
import ModalDialog from '@mui/joy/ModalDialog'
import ModalClose from '@mui/joy/ModalClose'
import Card from '@mui/joy/Card'
import CardContent from '@mui/joy/CardContent'
import Divider from '@mui/joy/Divider'
import Grid from '@mui/joy/Grid'
import Tab from '@mui/joy/Tab'
import TabList from '@mui/joy/TabList'
import Tabs from '@mui/joy/Tabs'
import TabPanel from '@mui/joy/TabPanel'

// Icons
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import SearchIcon from '@mui/icons-material/Search'
import UpdateIcon from '@mui/icons-material/Update'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import InventoryIcon from '@mui/icons-material/Inventory'
import CancelIcon from '@mui/icons-material/Cancel'
import RefreshIcon from '@mui/icons-material/Refresh'
import WarehouseIcon from '@mui/icons-material/Warehouse'
import PendingIcon from '@mui/icons-material/Pending'
import VisibilityIcon from '@mui/icons-material/Visibility'
import FilterAltIcon from '@mui/icons-material/FilterAlt'
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff'

const DeliveryList = () => {
  const { user } = useAuth()
  const [deliveries, setDeliveries] = useState([])
  const [filteredDeliveries, setFilteredDeliveries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewTab, setViewTab] = useState(0) // 0 = All Deliveries, 1 = Ongoing Only
  
  // State for status update modal
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [selectedDelivery, setSelectedDelivery] = useState(null)
  const [newStatus, setNewStatus] = useState('')
  const [updateLoading, setUpdateLoading] = useState(false)

  // State for delivery details modal
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  
  // State for delete confirmation modal
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deliveryToDelete, setDeliveryToDelete] = useState(null)

  // Stats for ongoing deliveries
  const [stats, setStats] = useState({
    total: 0,
    inTransit: 0,
    loading: 0,
    preparing: 0
  })

  const isAdmin = user?.role === 'admin'
  const isBranchUser = user?.role === 'branch'
  const isWarehouseUser = user?.role === 'warehouse'

  // Combine fetchAllDeliveries and fetchOngoingDeliveries into a single function
  const fetchDeliveries = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Choose endpoint based on user role
      let endpoint = '/api/deliveries'
      let params = {}
      
      // For branch users, always fetch from branch endpoint
      if (isBranchUser) {
        endpoint = '/api/deliveries/branch'
      }
      
      // If viewing only ongoing deliveries, add the ongoing flag
      if (viewTab === 1) {
        params.ongoing = true
      }
      
      const response = await axios.get(endpoint, { params })
      
      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Invalid data received from server')
      }
      
      // When in ongoing view, filter to only show active deliveries
      let filteredData = response.data
      if (viewTab === 1) {
        filteredData = response.data.filter(delivery => 
          delivery && typeof delivery === 'object' &&
          delivery.status && 
          ['preparing', 'loading', 'in_transit'].includes(delivery.status)
        )
      }
      
      setDeliveries(filteredData)
      setFilteredDeliveries(filteredData)
      
      // Calculate stats for ongoing deliveries
      const ongoingDeliveries = response.data.filter(d => 
        ['preparing', 'loading', 'in_transit'].includes(d.status)
      )
      
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
      console.error('Error fetching deliveries:', err)
      setError('Failed to load deliveries')
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

  // Fetch deliveries on component mount and when view tab changes
  useEffect(() => {
    fetchDeliveries()
  }, [user, viewTab])

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
          (delivery.tracking_number && delivery.tracking_number.toLowerCase().includes(lowerSearchTerm)) ||
          (delivery.recipient_name && delivery.recipient_name.toLowerCase().includes(lowerSearchTerm)) ||
          (delivery.id && delivery.id.toString().includes(lowerSearchTerm)) ||
          (delivery.branch_name && delivery.branch_name.toLowerCase().includes(lowerSearchTerm)) ||
          (delivery.created_by_user && delivery.created_by_user.toLowerCase().includes(lowerSearchTerm)) ||
          (delivery.recipient_address && delivery.recipient_address.toLowerCase().includes(lowerSearchTerm))
      )
    }

    setFilteredDeliveries(result)
  }, [searchTerm, statusFilter, deliveries])

  // Open status update modal
  const openStatusModal = (delivery) => {
    setSelectedDelivery(delivery)
    setNewStatus(delivery.status)
    setStatusModalOpen(true)
  }

  // Open details modal
  const openDetailsModal = (delivery) => {
    setSelectedDelivery(delivery)
    setDetailsModalOpen(true)
  }

  // Handle status change
  const handleStatusChange = async () => {
    if (!selectedDelivery || !newStatus) return
    
    try {
      setUpdateLoading(true)
      const response = await axios.put(`/api/deliveries/${selectedDelivery.id}/status`, {
        status: newStatus
      })
      
      // Update delivery in state
      setDeliveries(deliveries.map(d => 
        d.id === selectedDelivery.id ? response.data : d
      ))
      
      setStatusModalOpen(false)
      
      // Refresh deliveries to update stats
      fetchDeliveries()
    } catch (err) {
      console.error('Error updating delivery status:', err)
      // Use in-app alert instead of browser alert
      setError({ type: 'error', message: 'Failed to update status: ' + (err.response?.data?.error || 'Unknown error') })
      setTimeout(() => setError(null), 5000) // Clear error after 5 seconds
    } finally {
      setUpdateLoading(false)
    }
  }

  // Handle confirming receipt (for branch users)
  const handleConfirmReceipt = async (delivery) => {
    try {
      const response = await axios.put(`/api/deliveries/${delivery.id}/confirm-receipt`);
      
      // Update delivery in state
      setDeliveries(deliveries.map(d => 
        d.id === delivery.id ? response.data : d
      ));
      
      // Show success message
      setError({ type: 'success', message: 'Delivery confirmed successfully!' });
      setTimeout(() => setError(null), 5000); // Clear message after 5 seconds
      
      // Refresh deliveries to update stats
      fetchDeliveries();
    } catch (err) {
      console.error('Error confirming delivery receipt:', err);
      // Use in-app alert instead of browser alert
      setError({ type: 'error', message: 'Failed to confirm receipt: ' + (err.response?.data?.message || 'Unknown error') });
      setTimeout(() => setError(null), 5000); // Clear error after 5 seconds
    }
  };

  // Handle delete button click
  const openDeleteConfirm = (delivery) => {
    // Don't allow deleting already delivered items
    if (delivery.status === 'delivered') {
      setError({ type: 'warning', message: 'Delivered items cannot be archived' });
      setTimeout(() => setError(null), 5000);
      return;
    }
    
    setDeliveryToDelete(delivery);
    setDeleteConfirmOpen(true);
  };

  // Handle delivery deletion (archiving)
  const handleDelete = async () => {
    if (!deliveryToDelete) return;
    
    // Double check to prevent deleting delivered items
    if (deliveryToDelete.status === 'delivered') {
      setError({ type: 'warning', message: 'Delivered items cannot be archived' });
      setTimeout(() => setError(null), 5000);
      setDeleteConfirmOpen(false);
      return;
    }
    
    try {
      await axios.delete(`/api/deliveries/${deliveryToDelete.id}`);
      // Update state to remove deleted delivery
      setDeliveries(deliveries.filter(delivery => delivery.id !== deliveryToDelete.id));
      // Show success message
      setError({ type: 'success', message: 'Delivery archived successfully!' });
      setTimeout(() => setError(null), 5000); // Clear message after 5 seconds
      // Refresh the data
      fetchDeliveries();
      // Close the modal
      setDeleteConfirmOpen(false);
    } catch (err) {
      console.error('Error archiving delivery:', err);
      // Use in-app alert instead of browser alert
      setError({ type: 'error', message: 'Failed to archive delivery' });
      setTimeout(() => setError(null), 5000); // Clear error after 5 seconds
      // Close the modal
      setDeleteConfirmOpen(false);
    }
  };

  // Get next logical status
  const getNextStatus = (currentStatus) => {
    switch (currentStatus) {
      case 'pending': return 'preparing';
      case 'preparing': return 'loading';
      case 'loading': return 'in_transit';
      case 'in_transit': return 'delivered';
      default: return currentStatus;
    }
  };

  // Quick update status
  const handleQuickStatusUpdate = async (delivery) => {
    const nextStatus = getNextStatus(delivery.status);
    
    if (nextStatus === delivery.status) {
      return; // No change needed
    }
    
    try {
      const response = await axios.put(`/api/deliveries/${delivery.id}/status`, {
        status: nextStatus
      });
      
      // Update delivery in state
      setDeliveries(deliveries.map(d => 
        d.id === delivery.id ? response.data : d
      ));
      
      // Show success message
      setError({ type: 'success', message: `Delivery status updated to ${nextStatus}` });
      setTimeout(() => setError(null), 5000); // Clear message after 5 seconds
      
      // Refresh deliveries to update stats
      fetchDeliveries();
    } catch (err) {
      console.error('Error updating delivery status:', err);
      // Use in-app alert instead of browser alert
      setError({ type: 'error', message: 'Failed to update status: ' + (err.response?.data?.error || 'Unknown error') });
      setTimeout(() => setError(null), 5000); // Clear error after 5 seconds
    }
  };

  // Render status chip with appropriate color
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
        color = 'neutral'
        icon = <WarehouseIcon />
        break
      case 'loading':
        color = 'info'
        icon = <WarehouseIcon />
        break
      case 'cancelled':
        color = 'danger'
        icon = <CancelIcon />
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
  
  // Get status icon based on status
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <InventoryIcon fontSize="small" />;
      case 'preparing':
        return <InventoryIcon fontSize="small" />;
      case 'loading':
        return <LocalShippingIcon fontSize="small" />;
      case 'in_transit':
        return <LocalShippingIcon fontSize="small" />;
      case 'delivered':
        return <CheckCircleIcon fontSize="small" />;
      case 'cancelled':
        return <CancelIcon fontSize="small" />;
      default:
        return <UpdateIcon fontSize="small" />;
    }
  };

  // Render the TD cell for status with quick update button
  const renderStatusCell = (delivery) => {
    const nextStatus = getNextStatus(delivery.status);
    const canQuickUpdate = nextStatus !== delivery.status && 
                           delivery.status !== 'delivered' &&
                           delivery.status !== 'cancelled' &&
                           !isBranchUser; // Branch users can't update status
                           
    let nextStatusLabel = '';
    let nextStatusIcon = null;
    
    if (canQuickUpdate) {
      switch (nextStatus) {
        case 'preparing':
          nextStatusLabel = 'Start Preparing';
          nextStatusIcon = <InventoryIcon fontSize="small" />;
          break;
        case 'loading':
          nextStatusLabel = 'Load';
          nextStatusIcon = <LocalShippingIcon fontSize="small" />;
          break;
        case 'in_transit':
          nextStatusLabel = 'Send Out';
          nextStatusIcon = <LocalShippingIcon fontSize="small" />;
          break;
        case 'delivered':
          nextStatusLabel = 'Mark Delivered';
          nextStatusIcon = <CheckCircleIcon fontSize="small" />;
          break;
        default:
          break;
      }
    }
    
    return (
      <td>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {renderStatusChip(delivery.status)}
          
          {canQuickUpdate && (
            <Tooltip title={`Update to: ${nextStatusLabel}`}>
              <Button
                size="sm"
                variant="soft"
                startDecorator={nextStatusIcon}
                onClick={() => handleQuickStatusUpdate(delivery)}
                sx={{ mt: 0.5 }}
              >
                {nextStatusLabel}
              </Button>
            </Tooltip>
          )}
        </Box>
      </td>
    );
  };

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

  // Render correct filter options based on the active tab
  const renderFilterOptions = () => {
    // Common filter options for both views
    const commonOptions = [
      { value: 'all', label: 'All Statuses' },
      { value: 'in_transit', label: 'In Transit' },
      { value: 'loading', label: 'Loading' },
      { value: 'preparing', label: 'Preparing' }
    ]

    // Options for All Deliveries view
    const allDeliveriesOptions = [
      ...commonOptions,
      { value: 'pending', label: 'Pending' },
      { value: 'delivered', label: 'Delivered' },
      { value: 'cancelled', label: 'Cancelled' }
    ]

    // For Ongoing view, we only need the common options
    return viewTab === 0 ? allDeliveriesOptions : commonOptions
  }

  return (
    <Box sx={{ py: 2 }}>
      {/* Header with title and action buttons */}
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
          <Typography level="h4">Deliveries</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            startDecorator={<RefreshIcon />}
            onClick={fetchDeliveries}
            variant="outlined"
          >
            Refresh
          </Button>
          {(isAdmin || isWarehouseUser) && (
            <Button
              component={RouterLink}
              to="/deliveries/new"
              startDecorator={<AddIcon />}
              color="primary"
            >
              New Delivery
            </Button>
          )}
        </Box>
      </Box>

      {error && (
        <Alert 
          color={error.type === 'success' ? 'success' : 'danger'} 
          sx={{ mb: 2 }}
          endDecorator={
            <Button size="sm" variant="soft" color="neutral" onClick={() => setError(null)}>
              Dismiss
            </Button>
          }
        >
          {error.message || error}
        </Alert>
      )}

      {/* View selector tabs */}
      <Tabs 
        value={viewTab} 
        onChange={(e, newValue) => setViewTab(newValue)} 
        sx={{ mb: 2 }}
      >
        <TabList>
          <Tab>All Deliveries</Tab>
          <Tab>Ongoing Deliveries</Tab>
        </TabList>
      </Tabs>

      {/* Stats cards for Ongoing Deliveries view */}
      {viewTab === 1 && (
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
      )}

      {/* Search and filter controls */}
      <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <FormControl sx={{ minWidth: 200 }}>
          <FormLabel>Search Deliveries</FormLabel>
          <Input
            placeholder="Search by tracking #, recipient..."
            startDecorator={<SearchIcon />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </FormControl>
        <FormControl sx={{ minWidth: 120 }}>
          <FormLabel>Status Filter</FormLabel>
          <Select
            value={statusFilter}
            onChange={(e, newValue) => setStatusFilter(newValue)}
            startDecorator={<FilterAltIcon />}
          >
            {renderFilterOptions().map((option) => (
              <Option key={option.value} value={option.value}>{option.label}</Option>
            ))}
          </Select>
        </FormControl>
        <Button
          sx={{ alignSelf: 'flex-end' }}
          startDecorator={<FilterAltOffIcon />}
          variant="soft"
          color="neutral"
          onClick={resetFilters}
        >
          Reset Filters
        </Button>
      </Box>

      {/* Deliveries table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredDeliveries.length === 0 ? (
        <Alert color="primary">
          No deliveries found matching the current filters.
        </Alert>
      ) : (
        <Sheet sx={{ borderRadius: 'md', overflow: 'auto' }}>
          <Table sx={{ '& th': { textAlign: 'left' } }}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Tracking #</th>
                <th>Recipient</th>
                <th>Branch</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeliveries.map(delivery => (
                <tr key={delivery.id}>
                  <td>{delivery.id}</td>
                  <td>{delivery.tracking_number}</td>
                  <td>{delivery.recipient_name}</td>
                  <td>{delivery.branch_name || 'N/A'}</td>
                  {renderStatusCell(delivery)}
                  <td>{formatDate(delivery.created_at)}</td>
                  <td>
                    <Box sx={{ display: 'flex', gap: 1 }}>
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

                      {(isAdmin || isWarehouseUser) && (
                        <>
                          <Tooltip title="Update Status">
                            <IconButton
                              size="sm"
                              variant="plain"
                              color="primary"
                              onClick={() => openStatusModal(delivery)}
                            >
                              <UpdateIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton
                              size="sm"
                              variant="plain"
                              color="neutral"
                              component={RouterLink}
                              to={`/deliveries/${delivery.id}`}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          
                          {/* Only show archive button for non-delivered items */}
                          {delivery.status !== 'delivered' && (
                            <Tooltip title="Archive">
                              <IconButton
                                size="sm"
                                variant="plain"
                                color="danger"
                                onClick={() => openDeleteConfirm(delivery)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </>
                      )}

                      {isBranchUser && delivery.status === 'in_transit' && (
                        <Tooltip title="Confirm Receipt">
                          <Button
                            size="sm"
                            color="success"
                            variant="soft"
                            startDecorator={<CheckCircleIcon />}
                            onClick={() => handleConfirmReceipt(delivery)}
                          >
                            Confirm Receipt
                          </Button>
                        </Tooltip>
                      )}
                    </Box>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Sheet>
      )}

      {/* Status Update Modal */}
      <Modal open={statusModalOpen} onClose={() => setStatusModalOpen(false)}>
        <ModalDialog>
          <ModalClose />
          <Typography level="h5">Update Delivery Status</Typography>
          <Divider sx={{ my: 2 }} />
          
          <FormControl sx={{ mb: 2 }}>
            <FormLabel>Status</FormLabel>
            <Select
              value={newStatus}
              onChange={(e, value) => setNewStatus(value)}
            >
              <Option value="pending">Pending</Option>
              <Option value="preparing">Preparing</Option>
              <Option value="loading">Loading</Option>
              <Option value="in_transit">In Transit</Option>
              <Option value="delivered">Delivered</Option>
              <Option value="cancelled">Cancelled</Option>
            </Select>
          </FormControl>
          
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
            <Button
              variant="plain"
              color="neutral"
              onClick={() => setStatusModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              loading={updateLoading}
              onClick={handleStatusChange}
            >
              Update
            </Button>
          </Box>
        </ModalDialog>
      </Modal>

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
              {selectedDelivery.received_at && (
                <>
                  <Grid xs={12} sm={6}>
                    <Typography level="title-md">Received At</Typography>
                    <Typography>{formatDate(selectedDelivery.received_at)}</Typography>
                  </Grid>
                </>
              )}
            </Grid>
          </ModalDialog>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      <Modal open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <ModalDialog variant="outlined" role="alertdialog">
          <ModalClose />
          <Typography level="h2">
            Archive Delivery
          </Typography>
          <Typography level="body-md" sx={{ mt: 1, mb: 2 }}>
            Are you sure you want to archive this delivery? 
            {deliveryToDelete && (
              <Typography level="body-sm" sx={{ mt: 1 }}>
                <strong>Tracking #:</strong> {deliveryToDelete.tracking_number}<br />
                <strong>Recipient:</strong> {deliveryToDelete.recipient_name}
              </Typography>
            )}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', pt: 2 }}>
            <Button variant="plain" color="neutral" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="solid" color="danger" onClick={handleDelete}>
              Archive
            </Button>
          </Box>
        </ModalDialog>
      </Modal>
    </Box>
  )
}

export default DeliveryList 