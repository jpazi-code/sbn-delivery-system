import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'

// Joy UI components
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import Modal from '@mui/joy/Modal'
import ModalDialog from '@mui/joy/ModalDialog'
import ModalClose from '@mui/joy/ModalClose'
import Card from '@mui/joy/Card'
import CardContent from '@mui/joy/CardContent'
import Divider from '@mui/joy/Divider'
import Grid from '@mui/joy/Grid'
import CircularProgress from '@mui/joy/CircularProgress'
import Stack from '@mui/joy/Stack'
import Chip from '@mui/joy/Chip'
import Alert from '@mui/joy/Alert'
import AspectRatio from '@mui/joy/AspectRatio'
import List from '@mui/joy/List'
import ListItem from '@mui/joy/ListItem'
import ListItemContent from '@mui/joy/ListItemContent'
import ListDivider from '@mui/joy/ListDivider'

// Icons
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import InfoIcon from '@mui/icons-material/Info'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PendingIcon from '@mui/icons-material/Pending'
import WarehouseIcon from '@mui/icons-material/Warehouse'
import InventoryIcon from '@mui/icons-material/Inventory'
import ScaleIcon from '@mui/icons-material/Scale'
import PriorityHighIcon from '@mui/icons-material/PriorityHigh'
import BusinessIcon from '@mui/icons-material/Business'
import ReceiptIcon from '@mui/icons-material/Receipt'
import EngineeringIcon from '@mui/icons-material/Engineering'

// Delivery progress timeline component
const DeliveryProgressTimeline = ({ status }) => {
  // Define the delivery process steps
  const steps = [
    { id: 'pending', label: 'Pending', icon: <PendingIcon /> },
    { id: 'preparing', label: 'Preparing', icon: <EngineeringIcon /> },
    { id: 'loading', label: 'Loading', icon: <InventoryIcon /> },
    { id: 'in_transit', label: 'In Transit', icon: <LocalShippingIcon /> },
    { id: 'delivered', label: 'Delivered', icon: <CheckCircleIcon /> }
  ]
  
  // Determine current step index
  const getCurrentStepIndex = () => {
    const index = steps.findIndex(step => step.id === status)
    return index >= 0 ? index : 0 // Default to first step if status not found
  }
  
  const currentStepIndex = getCurrentStepIndex()
  
  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ 
          width: '100%', 
          display: 'flex',
          justifyContent: 'center'
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            maxWidth: '700px',
            py: 3
          }}>
            {steps.map((step, index) => (
              <Box key={step.id} sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                position: 'relative',
                flex: 1,
                textAlign: 'center'
              }}>
                {/* Step circle with icon */}
                <Box sx={{ 
                  width: 60, 
                  height: 60, 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  bgcolor: index <= currentStepIndex ? 
                    (index === currentStepIndex ? 'primary.500' : 'success.500') : 
                    'neutral.200',
                  color: index <= currentStepIndex ? 'white' : 'text.secondary',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                  border: '3px solid',
                  borderColor: index <= currentStepIndex ? 
                    (index === currentStepIndex ? 'primary.500' : 'success.500') : 
                    'neutral.200',
                  zIndex: 2
                }}>
                  {React.cloneElement(step.icon, { 
                    fontSize: 'large',
                    style: { fontSize: '1.8rem' } 
                  })}
                </Box>
                
                {/* Step label */}
                <Typography 
                  level="body-md" 
                  fontWeight={index === currentStepIndex ? 'bold' : 'normal'}
                  sx={{ 
                    mt: 1.5,
                    color: index <= currentStepIndex ? 
                      (index === currentStepIndex ? 'primary.600' : 'success.600') : 
                      'text.secondary'
                  }}
                >
                  {step.label}
                </Typography>
                
                {/* Connecting line */}
                {index < steps.length - 1 && (
                  <Box sx={{ 
                    position: 'absolute',
                    top: 30,
                    left: '50%',
                    width: '100%',
                    height: 4,
                    bgcolor: index < currentStepIndex ? 'success.500' : 'neutral.200',
                    zIndex: 1
                  }} />
                )}
              </Box>
            ))}
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

const DeliveryDetailsModal = ({ deliveryId, open, onClose }) => {
  const { user } = useAuth()
  
  const [delivery, setDelivery] = useState(null)
  const [requestItems, setRequestItems] = useState([])
  const [branch, setBranch] = useState(null)
  const [driver, setDriver] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Check if the user has sufficient access to view this delivery
  const checkAccess = (deliveryData) => {
    if (!user) return false
    if (user.role === 'admin') return true
    if (user.role === 'warehouse') return true
    
    // Branch users can only view deliveries for their branch
    if (user.role === 'branch') {
      return deliveryData.branch_id === user.branch_id
    }
    
    return false
  }
  
  // Fetch delivery data
  useEffect(() => {
    if (!open || !deliveryId) return
    
    const fetchDeliveryData = async () => {
      try {
        setLoading(true)
        
        // Get delivery details
        const deliveryResponse = await axios.get(`/api/deliveries/${deliveryId}`)
        const deliveryData = deliveryResponse.data
        
        // Check if user has access to this delivery
        if (!checkAccess(deliveryData)) {
          setError('You do not have permission to view this delivery')
          setLoading(false)
          return
        }
        
        console.log('Delivery data:', deliveryData)
        setDelivery(deliveryData)
        
        // Get branch information
        if (deliveryData.branch_id) {
          const branchResponse = await axios.get(`/api/branches/${deliveryData.branch_id}`)
          setBranch(branchResponse.data)
        }
        
        // Get driver information if assigned
        if (deliveryData.driver_id) {
          const driverResponse = await axios.get(`/api/users/${deliveryData.driver_id}`)
          setDriver(driverResponse.data)
        }
        
        // Get request items if this delivery is linked to a request
        if (deliveryData.request_id) {
          // Get the full request with items included
          const requestResponse = await axios.get(`/api/delivery-requests/${deliveryData.request_id}`)
          // Extract the items from the request response
          setRequestItems(requestResponse.data.items || [])
        }
        
        setError(null)
      } catch (err) {
        console.error('Error fetching delivery details:', err)
        setError('Error loading delivery details. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    
    fetchDeliveryData()
  }, [deliveryId, open, user])
  
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
  
  return (
    <Modal open={open} onClose={onClose}>
      <ModalDialog size="lg">
        <ModalClose />
        <Typography level="title-lg">Delivery Details</Typography>
        <Divider sx={{ my: 2 }} />
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress size="md" />
          </Box>
        ) : error ? (
          <Alert color="danger">{error}</Alert>
        ) : delivery ? (
          <Box sx={{ mt: 1 }}>
            {/* Delivery Progress Timeline */}
            <DeliveryProgressTimeline status={delivery.status} />
            
            <Grid container spacing={2}>
              <Grid xs={12} md={6}>
                <Typography level="title-sm" sx={{ mb: 1 }}>General Information</Typography>
                <Card variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Stack spacing={1}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography level="body-sm">ID:</Typography>
                        <Typography level="body-sm" fontWeight="bold">#{delivery.id}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography level="body-sm">Tracking Number:</Typography>
                        <Typography level="body-sm" fontWeight="bold">{delivery.tracking_number}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography level="body-sm">Status:</Typography>
                        <Box>{renderStatusChip(delivery.status)}</Box>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography level="body-sm">Branch:</Typography>
                        <Typography level="body-sm" fontWeight="bold">{branch?.name || 'Unknown Branch'}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography level="body-sm">Created:</Typography>
                        <Typography level="body-sm" fontWeight="bold">
                          {formatDate(delivery.created_at)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography level="body-sm">Created By:</Typography>
                        <Typography level="body-sm" fontWeight="bold">
                          {delivery.created_by_user || 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography level="body-sm">Delivered:</Typography>
                        <Typography level="body-sm" fontWeight="bold">
                          {delivery.received_at ? formatDate(delivery.received_at) : 'Not delivered'}
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
                        <Typography level="body-sm" fontWeight="bold">{delivery.recipient_name || 'N/A'}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography level="body-sm">Address:</Typography>
                        <Typography level="body-sm" fontWeight="bold">{delivery.recipient_address || 'N/A'}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography level="body-sm">Phone:</Typography>
                        <Typography level="body-sm" fontWeight="bold">{delivery.recipient_phone || 'N/A'}</Typography>
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
                        <Typography level="body-sm" fontWeight="bold">{delivery.package_description || 'N/A'}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography level="body-sm">Weight:</Typography>
                        <Typography level="body-sm" fontWeight="bold">{delivery.weight ? `${delivery.weight} kg` : 'N/A'}</Typography>
                      </Box>
                      {delivery.request_id && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography level="body-sm">Request ID:</Typography>
                          <Typography level="body-sm" fontWeight="bold">#{delivery.request_id}</Typography>
                        </Box>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              
              {requestItems.length > 0 && (
                <Grid xs={12}>
                  <Typography level="title-sm" sx={{ mb: 1, mt: 2 }}>Request Items</Typography>
                  <Card variant="outlined">
                    <List>
                      {requestItems.map((item, index) => (
                        <Box key={index}>
                          <ListItem>
                            <ListItemContent>
                              <Grid container spacing={1}>
                                <Grid xs={6}>
                                  <Typography level="body-sm" fontWeight="bold">{item.item_name}</Typography>
                                  <Typography level="body-xs">{item.item_description || 'No description'}</Typography>
                                </Grid>
                                <Grid xs={2}>
                                  <Typography level="body-sm">Quantity: {item.quantity}</Typography>
                                </Grid>
                                <Grid xs={2}>
                                  <Typography level="body-sm">Unit: {item.unit || 'pcs'}</Typography>
                                </Grid>
                                <Grid xs={2}>
                                  <Typography level="body-sm">
                                    {item.estimated_cost ? formatCurrency(item.estimated_cost) : 'N/A'}
                                  </Typography>
                                </Grid>
                              </Grid>
                            </ListItemContent>
                          </ListItem>
                          {index < requestItems.length - 1 && <ListDivider />}
                        </Box>
                      ))}
                    </List>
                  </Card>
                </Grid>
              )}
            </Grid>
          </Box>
        ) : (
          <Alert color="warning">Delivery information not found</Alert>
        )}
      </ModalDialog>
    </Modal>
  )
}

export default DeliveryDetailsModal 