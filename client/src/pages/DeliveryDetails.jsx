import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'

// Joy UI components
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import Sheet from '@mui/joy/Sheet'
import Card from '@mui/joy/Card'
import CardContent from '@mui/joy/CardContent'
import Divider from '@mui/joy/Divider'
import Button from '@mui/joy/Button'
import Grid from '@mui/joy/Grid'
import CircularProgress from '@mui/joy/CircularProgress'
import Alert from '@mui/joy/Alert'
import AspectRatio from '@mui/joy/AspectRatio'
import List from '@mui/joy/List'
import ListItem from '@mui/joy/ListItem'
import ListItemContent from '@mui/joy/ListItemContent'
import ListDivider from '@mui/joy/ListDivider'
import Stack from '@mui/joy/Stack'
import Chip from '@mui/joy/Chip'
import Tooltip from '@mui/joy/Tooltip'
import Avatar from '@mui/joy/Avatar'

// Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import InfoIcon from '@mui/icons-material/Info'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PendingIcon from '@mui/icons-material/Pending'
import WarehouseIcon from '@mui/icons-material/Warehouse'
import PersonIcon from '@mui/icons-material/Person'
import PhoneIcon from '@mui/icons-material/Phone'
import EmailIcon from '@mui/icons-material/Email'
import InventoryIcon from '@mui/icons-material/Inventory'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import ScaleIcon from '@mui/icons-material/Scale'
import PriorityHighIcon from '@mui/icons-material/PriorityHigh'
import BusinessIcon from '@mui/icons-material/Business'
import ReceiptIcon from '@mui/icons-material/Receipt'

const DeliveryDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [delivery, setDelivery] = useState(null)
  const [requestItems, setRequestItems] = useState([])
  const [branch, setBranch] = useState(null)
  const [driver, setDriver] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  
  // Check if the user has sufficient access to view this delivery
  const checkAccess = (deliveryData) => {
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
    const fetchDeliveryData = async () => {
      try {
        setLoading(true)
        
        // Get delivery details
        const deliveryResponse = await axios.get(`/api/deliveries/${id}`)
        const deliveryData = deliveryResponse.data
        
        // Check if user has access to this delivery
        if (!checkAccess(deliveryData)) {
          setError('You do not have permission to view this delivery')
          setLoading(false)
          return
        }
        
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
          const itemsResponse = await axios.get(`/api/requests/${deliveryData.request_id}/items`)
          setRequestItems(itemsResponse.data)
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
  }, [id, user])
  
  // Go back to previous page
  const handleBack = () => {
    navigate(-1)
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
  
  // Format priority
  const formatPriority = (priority) => {
    if (!priority) return 'Normal'
    
    return priority.charAt(0).toUpperCase() + priority.slice(1)
  }
  
  // Render priority chip
  const renderPriorityChip = (priority) => {
    let color
    
    switch (priority?.toLowerCase()) {
      case 'high':
        color = 'danger'
        break
      case 'medium':
        color = 'warning'
        break
      case 'low':
        color = 'success'
        break
      default:
        color = 'neutral'
    }
    
    return (
      <Chip
        color={color}
        variant="soft"
        size="sm"
        startDecorator={<PriorityHighIcon />}
      >
        {formatPriority(priority)}
      </Chip>
    )
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
  
  // Generate delivery timeline
  const getDeliveryTimeline = () => {
    const timeline = []
    
    if (!delivery) return timeline
    
    // Created
    timeline.push({
      status: 'Created',
      date: delivery.created_at,
      description: 'Delivery was created in the system',
      color: 'grey'
    })
    
    // Status progression based on current status
    if (['preparing', 'loading', 'in_transit', 'delivered'].includes(delivery.status)) {
      timeline.push({
        status: 'Preparing',
        date: delivery.preparing_at || null,
        description: 'Items being prepared for delivery',
        color: 'primary'
      })
    }
    
    if (['loading', 'in_transit', 'delivered'].includes(delivery.status)) {
      timeline.push({
        status: 'Loading',
        date: delivery.loading_at || null,
        description: 'Items loaded onto delivery vehicle',
        color: 'primary'
      })
    }
    
    if (['in_transit', 'delivered'].includes(delivery.status)) {
      timeline.push({
        status: 'In Transit',
        date: delivery.in_transit_at || null,
        description: 'Delivery en route to destination',
        color: 'primary'
      })
    }
    
    if (delivery.status === 'delivered') {
      timeline.push({
        status: 'Delivered',
        date: delivery.received_at || null,
        description: 'Delivery successfully completed',
        color: 'success'
      })
    }
    
    if (delivery.status === 'cancelled') {
      timeline.push({
        status: 'Cancelled',
        date: delivery.cancelled_at || null,
        description: 'Delivery was cancelled',
        color: 'error'
      })
    }
    
    return timeline
  }
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress />
      </Box>
    )
  }
  
  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Button
          startDecorator={<ArrowBackIcon />}
          variant="outlined"
          color="neutral"
          onClick={handleBack}
          sx={{ mb: 2 }}
        >
          Back
        </Button>
        <Alert color="danger">{error}</Alert>
      </Box>
    )
  }
  
  if (!delivery) {
    return (
      <Box sx={{ p: 2 }}>
        <Button
          startDecorator={<ArrowBackIcon />}
          variant="outlined"
          color="neutral"
          onClick={handleBack}
          sx={{ mb: 2 }}
        >
          Back
        </Button>
        <Alert color="warning">Delivery not found</Alert>
      </Box>
    )
  }
  
  return (
    <Box sx={{ py: 2 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            startDecorator={<ArrowBackIcon />}
            variant="outlined"
            color="neutral"
            onClick={handleBack}
          >
            Back
          </Button>
          <Sheet
            variant="soft"
            color="primary"
            sx={{ 
              p: 1.5, 
              borderRadius: 'sm', 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'center',
              ml: 2
            }}
          >
            <LocalShippingIcon fontSize="large" />
          </Sheet>
          <Box>
            <Typography level="h4">Delivery Details</Typography>
            <Typography level="body-sm" color="neutral">
              Tracking Number: {delivery.tracking_number}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {renderStatusChip(delivery.status)}
          {renderPriorityChip(delivery.priority)}
        </Box>
      </Box>
      
      <Grid container spacing={2}>
        {/* Main Details */}
        <Grid xs={12} md={8}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Typography level="title-lg">Delivery Information</Typography>
                <Box>
                  <Typography level="body-sm" startDecorator={<CalendarTodayIcon />}>
                    Created: {formatDate(delivery.created_at)}
                  </Typography>
                  {delivery.delivery_date && (
                    <Typography level="body-sm" startDecorator={<CalendarTodayIcon />}>
                      Delivery Date: {formatDate(delivery.delivery_date)}
                    </Typography>
                  )}
                </Box>
              </Box>
              
              <Grid container spacing={2}>
                <Grid xs={12} md={6}>
                  <Typography level="title-sm" startDecorator={<PersonIcon />} sx={{ mb: 1 }}>
                    Recipient Information
                  </Typography>
                  <Card variant="soft" color="primary" sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography level="body-md" fontWeight="md">{delivery.recipient_name}</Typography>
                      <Typography level="body-sm" startDecorator={<LocationOnIcon fontSize="small" />}>
                        {delivery.recipient_address}
                      </Typography>
                      <Typography level="body-sm" startDecorator={<PhoneIcon fontSize="small" />}>
                        {delivery.recipient_phone}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid xs={12} md={6}>
                  <Typography level="title-sm" startDecorator={<BusinessIcon />} sx={{ mb: 1 }}>
                    Branch Information
                  </Typography>
                  <Card variant="soft" color="neutral" sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography level="body-md" fontWeight="md">
                        {branch ? branch.name : 'Unknown Branch'}
                      </Typography>
                      <Typography level="body-sm" startDecorator={<LocationOnIcon fontSize="small" />}>
                        {branch ? branch.address : 'Address not available'}
                      </Typography>
                      <Typography level="body-sm" startDecorator={<PhoneIcon fontSize="small" />}>
                        {branch ? branch.phone : 'Phone not available'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography level="title-sm" startDecorator={<InventoryIcon />} sx={{ mb: 1 }}>
                Package Information
              </Typography>
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid xs={12} md={8}>
                      <Typography level="body-md" fontWeight="md">Description</Typography>
                      <Typography level="body-sm">
                        {delivery.package_description || 'No description provided'}
                      </Typography>
                    </Grid>
                    <Grid xs={12} md={4}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Typography level="body-sm" startDecorator={<ScaleIcon fontSize="small" />}>
                          Weight: {delivery.weight} kg
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
              
              {/* Driver Information (if assigned) */}
              {driver && (
                <>
                  <Typography level="title-sm" startDecorator={<PersonIcon />} sx={{ mb: 1 }}>
                    Driver Information
                  </Typography>
                  <Card variant="soft" color="success" sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography level="body-md" fontWeight="md">{driver.name}</Typography>
                      <Typography level="body-sm" startDecorator={<PhoneIcon fontSize="small" />}>
                        {driver.phone || 'Phone not available'}
                      </Typography>
                      <Typography level="body-sm" startDecorator={<EmailIcon fontSize="small" />}>
                        {driver.email || 'Email not available'}
                      </Typography>
                    </CardContent>
                  </Card>
                </>
              )}
              
              {/* Request Information and Items (if linked to a request) */}
              {delivery.request_id && (
                <>
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography level="title-sm" startDecorator={<ReceiptIcon />} sx={{ mb: 1 }}>
                    Associated Request Items
                  </Typography>
                  
                  {requestItems.length > 0 ? (
                    <Sheet variant="outlined" sx={{ borderRadius: 'sm', overflow: 'hidden' }}>
                      <List size="sm">
                        <ListItem sx={{ fontWeight: 'md' }}>
                          <ListItemContent sx={{ flex: '1 0 120px' }}>Item Code</ListItemContent>
                          <ListItemContent sx={{ flex: '3 0 200px' }}>Description</ListItemContent>
                          <ListItemContent sx={{ flex: '1 0 80px', justifyContent: 'center' }}>Quantity</ListItemContent>
                          <ListItemContent sx={{ flex: '1 0 100px', justifyContent: 'flex-end' }}>Unit Price</ListItemContent>
                          <ListItemContent sx={{ flex: '1 0 100px', justifyContent: 'flex-end' }}>Subtotal</ListItemContent>
                        </ListItem>
                        
                        <ListDivider component="li" />
                        
                        {requestItems.map((item, index) => (
                          <React.Fragment key={item.id || index}>
                            <ListItem>
                              <ListItemContent sx={{ flex: '1 0 120px' }}>{item.item_code}</ListItemContent>
                              <ListItemContent sx={{ flex: '3 0 200px' }}>{item.description}</ListItemContent>
                              <ListItemContent sx={{ flex: '1 0 80px', justifyContent: 'center' }}>{item.quantity}</ListItemContent>
                              <ListItemContent sx={{ flex: '1 0 100px', justifyContent: 'flex-end' }}>
                                {formatCurrency(item.unit_price)}
                              </ListItemContent>
                              <ListItemContent sx={{ flex: '1 0 100px', justifyContent: 'flex-end' }}>
                                {formatCurrency(item.unit_price * item.quantity)}
                              </ListItemContent>
                            </ListItem>
                            {index < requestItems.length - 1 && <ListDivider component="li" />}
                          </React.Fragment>
                        ))}
                        
                        <ListDivider component="li" />
                        
                        <ListItem>
                          <ListItemContent sx={{ flex: '5 0 400px', justifyContent: 'flex-end', fontWeight: 'md' }}>
                            Total Amount:
                          </ListItemContent>
                          <ListItemContent sx={{ flex: '1 0 100px', justifyContent: 'flex-end', fontWeight: 'md' }}>
                            {formatCurrency(requestItems.reduce((total, item) => total + (item.unit_price * item.quantity), 0))}
                          </ListItemContent>
                        </ListItem>
                      </List>
                    </Sheet>
                  ) : (
                    <Typography level="body-sm">No items available for this request</Typography>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Timeline and Status - Custom Implementation */}
        <Grid xs={12} md={4}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography level="title-lg" sx={{ mb: 2 }}>Delivery Status</Typography>
              
              {/* Custom timeline implementation using Joy UI */}
              <Stack spacing={1}>
                {getDeliveryTimeline().map((event, index) => (
                  <Box 
                    key={index} 
                    sx={{ 
                      display: 'flex', 
                      gap: 2,
                      position: 'relative'
                    }}
                  >
                    {/* Timeline connector line */}
                    {index < getDeliveryTimeline().length - 1 && (
                      <Box 
                        sx={{ 
                          position: 'absolute',
                          left: '20px',
                          top: '20px',
                          bottom: '-20px',
                          width: '2px',
                          bgcolor: 'divider',
                          zIndex: 0 
                        }}
                      />
                    )}
                    
                    {/* Timeline dot */}
                    <Avatar 
                      size="sm" 
                      color={event.color === 'grey' ? 'neutral' : 
                             event.color === 'error' ? 'danger' : 
                             event.color}
                      variant="solid"
                      sx={{ 
                        zIndex: 1,
                        width: 28,
                        height: 28
                      }}
                    >
                      {event.status === 'Created' ? <InfoIcon fontSize="small" /> :
                       event.status === 'Preparing' ? <WarehouseIcon fontSize="small" /> :
                       event.status === 'Loading' ? <InventoryIcon fontSize="small" /> :
                       event.status === 'In Transit' ? <LocalShippingIcon fontSize="small" /> :
                       event.status === 'Delivered' ? <CheckCircleIcon fontSize="small" /> :
                       <InfoIcon fontSize="small" />}
                    </Avatar>
                    
                    {/* Timeline content */}
                    <Box sx={{ pb: 2 }}>
                      <Typography level="title-sm">{event.status}</Typography>
                      <Typography level="body-xs">{event.description}</Typography>
                      <Typography level="body-xs" color="neutral">
                        {event.date ? formatDate(event.date) : 'Pending'}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
          
          {/* Notes Section */}
          <Card>
            <CardContent>
              <Typography level="title-lg" sx={{ mb: 2 }}>Delivery Notes</Typography>
              <Typography level="body-md">
                {delivery.notes || 'No additional notes for this delivery'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default DeliveryDetails 