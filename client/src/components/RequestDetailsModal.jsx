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
import BusinessIcon from '@mui/icons-material/Business'
import ThumbUpIcon from '@mui/icons-material/ThumbUp'

// Request progress timeline component
const RequestProgressTimeline = ({ status }) => {
  // Define the request process steps
  const steps = [
    { id: 'pending', label: 'Pending', icon: <PendingIcon sx={{ color: 'white', fontSize: '1.8rem' }} /> },
    { id: 'approved', label: 'Approved', icon: <ThumbUpIcon sx={{ color: 'white', fontSize: '1.8rem' }} /> },
    { id: 'processing', label: 'Processing', icon: <WarehouseIcon sx={{ color: 'white', fontSize: '1.8rem' }} /> },
    { id: 'delivered', label: 'Delivered', icon: <CheckCircleIcon sx={{ color: 'white', fontSize: '1.8rem' }} /> }
  ]
  
  // Determine current step index
  const getCurrentStepIndex = () => {
    const statusMap = {
      'pending': 0,
      'approved': 1,
      'processing': 2,
      'delivered': 3,
      'rejected': 0 // For rejected, we show as pending with different styling
    }
    
    return statusMap[status] !== undefined ? statusMap[status] : 0
  }
  
  const currentStepIndex = getCurrentStepIndex()
  const isRejected = status === 'rejected'
  
  return (
    <Card 
      variant="outlined" 
      sx={{ 
        mb: 3, 
        borderColor: isRejected ? 'danger.300' : undefined,
        borderWidth: isRejected ? 2 : 1
      }}
    >
      <CardContent>
        {isRejected && (
          <Typography 
            level="body-sm" 
            color="danger" 
            fontWeight="bold" 
            sx={{ mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}
          >
            <InfoIcon fontSize="small" /> This request was rejected
          </Typography>
        )}
        
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
                  bgcolor: isRejected ? 
                    (index === 0 ? 'danger.500' : 'neutral.200') :
                    (index <= currentStepIndex ? 
                      (index === currentStepIndex ? 'primary.500' : 'success.500') : 
                      'neutral.200'),
                  color: isRejected ?
                    (index === 0 ? 'white' : 'text.secondary') :
                    (index <= currentStepIndex ? 'white' : 'text.secondary'),
                  boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                  border: '3px solid',
                  borderColor: isRejected ? 
                    (index === 0 ? 'danger.500' : 'neutral.200') :
                    (index <= currentStepIndex ? 
                      (index === currentStepIndex ? 'primary.500' : 'success.500') : 
                      'neutral.200'),
                  zIndex: 2
                }}>
                  {step.icon}
                </Box>
                
                {/* Step label */}
                <Typography 
                  level="body-md" 
                  fontWeight={
                    isRejected ? 
                      (index === 0 ? 'bold' : 'normal') :
                      (index === currentStepIndex ? 'bold' : 'normal')
                  }
                  sx={{ 
                    mt: 1.5,
                    color: isRejected ?
                      (index === 0 ? 'danger.600' : 'text.secondary') :
                      (index <= currentStepIndex ? 
                        (index === currentStepIndex ? 'primary.600' : 'success.600') : 
                        'text.secondary')
                  }}
                >
                  {index === 0 && isRejected ? 'Rejected' : step.label}
                </Typography>
                
                {/* Connecting line */}
                {index < steps.length - 1 && (
                  <Box sx={{ 
                    position: 'absolute',
                    top: 30,
                    left: '50%',
                    width: '100%',
                    height: 4,
                    bgcolor: isRejected ? 
                      'neutral.200' :
                      (index < currentStepIndex ? 'success.500' : 'neutral.200'),
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

const RequestDetailsModal = ({ requestId, open, onClose }) => {
  const { user } = useAuth()
  
  const [request, setRequest] = useState(null)
  const [items, setItems] = useState([])
  const [branch, setBranch] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Check if the user has sufficient access to view this request
  const checkAccess = (requestData) => {
    if (!user) return false
    if (user.role === 'admin') return true
    if (user.role === 'warehouse') return true
    
    // Branch users can only view requests for their branch
    if (user.role === 'branch') {
      return requestData.branch_id === user.branch_id
    }
    
    return false
  }
  
  // Fetch request data
  useEffect(() => {
    if (!open || !requestId) return
    
    const fetchRequestData = async () => {
      try {
        setLoading(true)
        
        // Get request details
        const requestResponse = await axios.get(`/api/delivery-requests/${requestId}`)
        const requestData = requestResponse.data
        
        // Check if user has access to this request
        if (!checkAccess(requestData)) {
          setError('You do not have permission to view this request')
          setLoading(false)
          return
        }
        
        console.log('Request data:', requestData)
        setRequest(requestData)
        setItems(requestData.items || [])
        
        // Get branch information
        if (requestData.branch_id) {
          const branchResponse = await axios.get(`/api/branches/${requestData.branch_id}`)
          setBranch(branchResponse.data)
        }
        
        setError(null)
      } catch (err) {
        console.error('Error fetching request details:', err)
        setError('Error loading request details. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    
    fetchRequestData()
  }, [requestId, open, user])
  
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
      case 'approved':
        color = 'success'
        icon = <CheckCircleIcon sx={{ color: 'white' }} />
        break
      case 'pending':
        color = 'warning'
        icon = <PendingIcon sx={{ color: 'white' }} />
        break
      case 'processing':
        color = 'primary'
        icon = <WarehouseIcon sx={{ color: 'white' }} />
        break
      case 'delivered':
        color = 'success'
        icon = <LocalShippingIcon sx={{ color: 'white' }} />
        break
      case 'rejected':
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
        {status?.replace('_', ' ') || 'Unknown'}
      </Chip>
    )
  }
  
  return (
    <Modal open={open} onClose={onClose}>
      <ModalDialog size="lg">
        <ModalClose />
        <Typography level="title-lg">Request Details</Typography>
        <Divider sx={{ my: 2 }} />
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress size="md" />
          </Box>
        ) : error ? (
          <Alert color="danger">{error}</Alert>
        ) : request ? (
          <Box sx={{ mt: 1 }}>
            {/* Request Progress Timeline */}
            <RequestProgressTimeline status={request.request_status} />
            
            <Grid container spacing={2}>
              <Grid xs={12} md={6}>
                <Typography level="title-sm" sx={{ mb: 1 }}>General Information</Typography>
                <Card variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Stack spacing={1}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography level="body-sm">ID:</Typography>
                        <Typography level="body-sm" fontWeight="bold">#{request.id}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography level="body-sm">Status:</Typography>
                        <Box>{renderStatusChip(request.request_status)}</Box>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography level="body-sm">Branch:</Typography>
                        <Typography level="body-sm" fontWeight="bold">{branch?.name || 'Unknown Branch'}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography level="body-sm">Created:</Typography>
                        <Typography level="body-sm" fontWeight="bold">{formatDate(request.created_at)}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography level="body-sm">Created By:</Typography>
                        <Typography level="body-sm" fontWeight="bold">{request.creator_name || 'N/A'}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography level="body-sm">Total Amount:</Typography>
                        <Typography level="body-sm" fontWeight="bold">{formatCurrency(request.total_amount)}</Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid xs={12} md={6}>
                <Typography level="title-sm" sx={{ mb: 1 }}>Additional Information</Typography>
                <Card variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Stack spacing={1}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography level="body-sm">Notes:</Typography>
                        <Typography level="body-sm" sx={{ maxWidth: '70%', textAlign: 'right' }}>
                          {request.notes || 'No notes provided'}
                        </Typography>
                      </Box>
                      {request.approved_at && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography level="body-sm">Approved:</Typography>
                          <Typography level="body-sm" fontWeight="bold">{formatDate(request.approved_at)}</Typography>
                        </Box>
                      )}
                      {request.rejected_at && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography level="body-sm">Rejected:</Typography>
                          <Typography level="body-sm" fontWeight="bold">{formatDate(request.rejected_at)}</Typography>
                        </Box>
                      )}
                      {request.completed_at && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography level="body-sm">Completed:</Typography>
                          <Typography level="body-sm" fontWeight="bold">{formatDate(request.completed_at)}</Typography>
                        </Box>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              {items.length > 0 && (
                <Grid xs={12}>
                  <Typography level="title-sm" sx={{ mb: 1, mt: 2 }}>Request Items</Typography>
                  <Card variant="outlined">
                    <List>
                      {items.map((item, index) => (
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
                          {index < items.length - 1 && <ListDivider />}
                        </Box>
                      ))}
                    </List>
                  </Card>
                </Grid>
              )}
            </Grid>
          </Box>
        ) : (
          <Alert color="warning">Request information not found</Alert>
        )}
      </ModalDialog>
    </Modal>
  )
}

export default RequestDetailsModal 