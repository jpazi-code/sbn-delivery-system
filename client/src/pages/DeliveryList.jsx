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
import AccessTimeFilledIcon from '@mui/icons-material/AccessTimeFilled'

const DeliveryList = () => {
  const [deliveries, setDeliveries] = useState([])
  const [filteredDeliveries, setFilteredDeliveries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  
  // State for status update modal
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [selectedDelivery, setSelectedDelivery] = useState(null)
  const [newStatus, setNewStatus] = useState('')
  const [updateLoading, setUpdateLoading] = useState(false)

  // Add this near the other state declarations
  const [deliveryToConfirm, setDeliveryToConfirm] = useState(null)

  const { user } = useAuth();
  const isBranchUser = user?.role === 'branch';
  const isWarehouseUser = user?.role === 'warehouse';
  const isAdmin = user?.role === 'admin';

  // Fetch deliveries on component mount
  useEffect(() => {
    const fetchDeliveries = async () => {
      try {
        setLoading(true)
        const response = await axios.get('/api/deliveries')
        setDeliveries(response.data)
        setFilteredDeliveries(response.data)
        setError(null)
      } catch (err) {
        console.error('Error fetching deliveries:', err)
        setError('Failed to load deliveries')
      } finally {
        setLoading(false)
      }
    }

    fetchDeliveries()
  }, [])

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
          delivery.tracking_number.toLowerCase().includes(lowerSearchTerm) ||
          delivery.recipient_name.toLowerCase().includes(lowerSearchTerm) ||
          delivery.recipient_address.toLowerCase().includes(lowerSearchTerm)
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
    } catch (err) {
      console.error('Error updating delivery status:', err)
      alert('Failed to update status: ' + (err.response?.data?.error || 'Unknown error'))
    } finally {
      setUpdateLoading(false)
    }
  }

  // Handle delivery deletion
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this delivery?')) {
      try {
        await axios.delete(`/api/deliveries/${id}`)
        // Update state to remove deleted delivery
        setDeliveries(deliveries.filter(delivery => delivery.id !== id))
      } catch (err) {
        console.error('Error deleting delivery:', err)
        alert('Failed to delete delivery')
      }
    }
  }

  // Get next logical status
  const getNextStatus = (currentStatus) => {
    switch (currentStatus) {
      case 'pending': return 'preparing';
      case 'preparing': return 'loading';
      case 'loading': return 'in_transit';
      case 'in_transit': return 'pending_confirmation';
      default: return currentStatus;
    }
  };

  // Handle marking a delivery as pending confirmation
  const handleMarkPendingConfirmation = async (delivery) => {
    try {
      const response = await axios.put(`/api/deliveries/${delivery.id}/mark-pending-confirmation`);
      
      // Update delivery in state
      setDeliveries(deliveries.map(d => 
        d.id === delivery.id ? response.data : d
      ));
      
    } catch (err) {
      console.error('Error marking delivery as pending confirmation:', err);
      alert('Failed to update status: ' + (err.response?.data?.error || 'Unknown error'));
    }
  };

  // Handle confirming receipt of a delivery
  const handleConfirmReceipt = async (delivery) => {
    try {
      const response = await axios.put(`/api/deliveries/${delivery.id}/confirm-receipt`);
      
      // Update delivery in state
      setDeliveries(deliveries.map(d => 
        d.id === delivery.id ? response.data : d
      ));
      
    } catch (err) {
      console.error('Error confirming delivery receipt:', err);
      
      // Improved error message handling
      let errorMessage = 'Failed to confirm receipt';
      
      if (err.response) {
        errorMessage += `: ${err.response.data.message || 'Unknown error'}`;
        if (err.response.data.currentStatus) {
          errorMessage += ` (Current status: ${err.response.data.currentStatus})`;
        }
      }
      
      // Show error message
      alert(errorMessage);
    }
  };

  // Quick update status
  const handleQuickStatusUpdate = async (delivery) => {
    const nextStatus = getNextStatus(delivery.status);
    
    if (nextStatus === delivery.status) {
      return; // No change needed
    }
    
    // For in_transit -> pending_confirmation transition, use the specific endpoint
    if (delivery.status === 'in_transit' && nextStatus === 'pending_confirmation') {
      return handleMarkPendingConfirmation(delivery);
    }
    
    try {
      const response = await axios.put(`/api/deliveries/${delivery.id}/status`, {
        status: nextStatus
      });
      
      // Update delivery in state
      setDeliveries(deliveries.map(d => 
        d.id === delivery.id ? response.data : d
      ));
      
    } catch (err) {
      console.error('Error updating delivery status:', err);
      alert('Failed to update status: ' + (err.response?.data?.error || 'Unknown error'));
    }
  };

  // Render status chip with appropriate color
  const renderStatusChip = (status) => {
    let color = 'neutral'
    if (status === 'delivered') color = 'success'
    if (status === 'in_transit') color = 'primary'
    if (status === 'pending') color = 'warning'
    if (status === 'preparing') color = 'neutral'
    if (status === 'loading') color = 'info'
    if (status === 'cancelled') color = 'danger'
    if (status === 'pending_confirmation') color = 'warning'

    return (
      <Chip
        size="sm"
        variant="soft"
        color={color}
        sx={{ textTransform: 'capitalize' }}
      >
        {status.replace(/_/g, ' ')}
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
      case 'pending_confirmation':
        return <AccessTimeFilledIcon fontSize="small" />;
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
    // For branch users with pending confirmation deliveries
    if (isBranchUser && delivery.status === 'pending_confirmation' && 
        parseInt(user.branch_id) === delivery.branch_id) {
      return (
        <td>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {renderStatusChip(delivery.status)}
            
            <Button
              size="sm"
              variant="soft"
              color="success"
              startDecorator={<CheckCircleIcon fontSize="small" />}
              onClick={(e) => {
                e.stopPropagation();
                setDeliveryToConfirm(delivery);
              }}
              sx={{ mt: 1, fontSize: '0.75rem' }}
            >
              Order Received
            </Button>
          </Box>
        </td>
      );
    }
    
    // For warehouse users with in-transit deliveries
    if ((isWarehouseUser || isAdmin) && delivery.status === 'in_transit') {
      return (
        <td>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {renderStatusChip(delivery.status)}
            
            <Button
              size="sm"
              variant="soft"
              color="warning"
              startDecorator={<LocalShippingIcon fontSize="small" />}
              onClick={(e) => {
                e.stopPropagation();
                handleMarkPendingConfirmation(delivery);
              }}
              sx={{ mt: 1, fontSize: '0.75rem' }}
            >
              Mark Delivered
            </Button>
          </Box>
        </td>
      );
    }
    
    // Standard status progression for other cases
    const nextStatus = getNextStatus(delivery.status);
    const canQuickUpdate = nextStatus !== delivery.status && 
                         delivery.status !== 'pending_confirmation' &&
                         delivery.status !== 'delivered' &&
                         delivery.status !== 'cancelled';
                         
    // Only warehouse/admin can update status for regular progression
    const canUpdateStatus = (isWarehouseUser || isAdmin) && canQuickUpdate;
                           
    let nextStatusLabel = '';
    let nextStatusIcon = null;
    
    if (canUpdateStatus) {
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
        default:
          break;
      }
    }
    
    return (
      <td>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {renderStatusChip(delivery.status)}
          
          {canUpdateStatus && (
            <Button
              size="sm"
              variant="soft"
              color="primary"
              startDecorator={nextStatusIcon}
              onClick={(e) => {
                e.stopPropagation();
                handleQuickStatusUpdate(delivery);
              }}
              sx={{ mt: 1, fontSize: '0.75rem' }}
            >
              {nextStatusLabel}
            </Button>
          )}
        </Box>
      </td>
    );
  };

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
        <Alert color="danger">{error}</Alert>
        <Button
          onClick={() => window.location.reload()}
          sx={{ mt: 2 }}
        >
          Retry
        </Button>
      </Box>
    )
  }

  return (
    <Box sx={{ py: 2 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography level="h3">Deliveries</Typography>
        <Button
          component={RouterLink}
          to="/deliveries/new"
          startDecorator={<AddIcon />}
        >
          New Delivery
        </Button>
      </Box>

      {/* Filters */}
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          alignItems: { sm: 'flex-end' },
        }}
      >
        <FormControl sx={{ flex: 1 }}>
          <FormLabel>Search</FormLabel>
          <Input
            placeholder="Search by name, address, tracking number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            startDecorator={<SearchIcon />}
          />
        </FormControl>

        <FormControl sx={{ minWidth: 120 }}>
          <FormLabel>Status</FormLabel>
          <Select
            value={statusFilter}
            onChange={(e, value) => setStatusFilter(value)}
            sx={{ minWidth: 140 }}
          >
            <Option value="all">All</Option>
            <Option value="pending">Pending</Option>
            <Option value="preparing">Preparing</Option>
            <Option value="loading">Loading</Option>
            <Option value="in_transit">In Transit</Option>
            <Option value="delivered">Delivered</Option>
            <Option value="cancelled">Cancelled</Option>
          </Select>
        </FormControl>
      </Box>

      {/* Deliveries Table */}
      <Sheet
        variant="outlined"
        sx={{
          borderRadius: 'sm',
          overflow: { xs: 'auto', sm: 'initial' },
        }}
      >
        <Table
          sx={{
            '& thead th:nth-child(1)': { width: '40%' },
            '& thead th:nth-child(2)': { width: '20%' },
            '& thead th:nth-child(3)': { width: '20%' },
            '& thead th:nth-child(4)': { width: '20%' },
            '& tbody tr': {
              '&:hover': { bgcolor: 'background.level1' },
              cursor: 'pointer',
            },
          }}
        >
          <thead>
            <tr>
              <th>Recipient Info</th>
              <th>Tracking</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDeliveries.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center' }}>
                  No deliveries found
                </td>
              </tr>
            ) : (
              filteredDeliveries.map((delivery) => (
                <tr key={delivery.id}>
                  <td>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography level="body-sm" sx={{ fontWeight: 'bold' }}>
                        {delivery.recipient_name}
                      </Typography>
                      <Typography level="body-xs" noWrap>
                        {delivery.recipient_address}
                      </Typography>
                    </Box>
                  </td>
                  <td>
                    <Typography level="body-sm">{delivery.tracking_number}</Typography>
                  </td>
                  {renderStatusCell(delivery)}
                  <td>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Update Status" placement="top">
                        <IconButton
                          size="sm"
                          variant="plain"
                          color="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            openStatusModal(delivery);
                          }}
                        >
                          <UpdateIcon />
                        </IconButton>
                      </Tooltip>
                      <IconButton
                        size="sm"
                        variant="plain"
                        color="neutral"
                        component={RouterLink}
                        to={`/deliveries/${delivery.id}`}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="sm"
                        variant="plain"
                        color="danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(delivery.id);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </Sheet>
      
      {/* Status Update Modal */}
      <Modal open={statusModalOpen} onClose={() => setStatusModalOpen(false)}>
        <ModalDialog size="sm">
          <ModalClose />
          <Typography level="title-lg" sx={{ mb: 2 }}>
            Update Delivery Status
          </Typography>
          
          {selectedDelivery && (
            <Box>
              <Typography level="body-sm" sx={{ mb: 2 }}>
                Tracking: {selectedDelivery.tracking_number}
              </Typography>
              
              <FormControl sx={{ mb: 2 }}>
                <FormLabel>Select New Status</FormLabel>
                <Select
                  value={newStatus}
                  onChange={(_, value) => setNewStatus(value)}
                  startDecorator={getStatusIcon(newStatus)}
                >
                  <Option value="pending" startDecorator={<InventoryIcon />}>Pending</Option>
                  <Option value="preparing" startDecorator={<InventoryIcon />}>Preparing</Option>
                  <Option value="loading" startDecorator={<LocalShippingIcon />}>Loading</Option>
                  <Option value="in_transit" startDecorator={<LocalShippingIcon />}>In Transit</Option>
                  <Option value="delivered" startDecorator={<CheckCircleIcon />}>Delivered</Option>
                  <Option value="cancelled" startDecorator={<CancelIcon />}>Cancelled</Option>
                </Select>
              </FormControl>
              
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  variant="outlined"
                  color="neutral"
                  onClick={() => setStatusModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  loading={updateLoading}
                  onClick={handleStatusChange}
                >
                  Update Status
                </Button>
              </Box>
            </Box>
          )}
        </ModalDialog>
      </Modal>

      {/* Confirm Receipt Modal */}
      <Modal
        open={Boolean(deliveryToConfirm)}
        onClose={() => setDeliveryToConfirm(null)}
      >
        <ModalDialog
          size="sm"
          variant="outlined"
          role="alertdialog"
          sx={{ 
            zIndex: 9999,
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          <ModalClose onClick={() => setDeliveryToConfirm(null)} />
          <Typography level="title-lg" startDecorator={<CheckCircleIcon />} sx={{ mb: 2 }}>
            Confirm Delivery Receipt
          </Typography>
          
          {deliveryToConfirm && (
            <>
              <Typography level="body-md" sx={{ mb: 2 }}>
                Are you sure you want to confirm that delivery #{deliveryToConfirm.id} with 
                tracking number {deliveryToConfirm.tracking_number} has been received?
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  variant="plain"
                  color="neutral"
                  onClick={() => setDeliveryToConfirm(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="solid"
                  color="success"
                  startDecorator={<CheckCircleIcon />}
                  onClick={() => {
                    handleConfirmReceipt(deliveryToConfirm);
                    setDeliveryToConfirm(null);
                  }}
                >
                  Confirm Receipt
                </Button>
              </Box>
            </>
          )}
        </ModalDialog>
      </Modal>
    </Box>
  )
}

export default DeliveryList 