import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

// Joy UI components
import Sheet from '@mui/joy/Sheet'
import Typography from '@mui/joy/Typography'
import FormControl from '@mui/joy/FormControl'
import FormLabel from '@mui/joy/FormLabel'
import Input from '@mui/joy/Input'
import Button from '@mui/joy/Button'
import Link from '@mui/joy/Link'
import Box from '@mui/joy/Box'
import Alert from '@mui/joy/Alert'
import IconButton from '@mui/joy/IconButton'
import Modal from '@mui/joy/Modal'
import ModalDialog from '@mui/joy/ModalDialog'
import ModalClose from '@mui/joy/ModalClose'
import Divider from '@mui/joy/Divider'

// Icons
import KeyIcon from '@mui/icons-material/Key'
import PersonIcon from '@mui/icons-material/Person'
import EmailIcon from '@mui/icons-material/Email'
import PhoneIcon from '@mui/icons-material/Phone'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import LockIcon from '@mui/icons-material/Lock'

const Login = () => {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false)
  
  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Basic validation
    if (!username || !password) {
      setError('Username and password are required')
      return
    }
    
    setLoading(true)
    setError('')
    
    // Call login from auth context
    const result = await login(username, password)
    
    if (result.success) {
      navigate('/')
    } else {
      setError(result.message)
      setLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }
  
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        bgcolor: 'background.body',
      }}
    >
      <Sheet
        sx={{
          width: 400,
          mx: 'auto',
          my: 4,
          py: 3,
          px: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          borderRadius: 'sm',
          boxShadow: 'md',
        }}
        variant="outlined"
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <img 
            src="/images/486806265_973935431491542_5201819430505773790_n (1).png" 
            alt="SBNC Logo" 
            style={{ height: 80 }}
          />
        </Box>
        
        <div>
          <Typography level="h4" component="h1" sx={{ textAlign: 'center' }}>
            <b>Stronghold Bolts and Nuts Delivery Management System</b>
          </Typography>
          <Typography level="body-sm" sx={{ textAlign: 'center', mb: 3 }}>
            Sign in to continue
          </Typography>
        </div>
        
        {error && (
          <Alert color="danger" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <FormControl sx={{ mb: 2 }}>
            <FormLabel>Username</FormLabel>
            <Input
              placeholder="Enter your username"
              startDecorator={<PersonIcon />}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              required
            />
          </FormControl>
          
          <FormControl sx={{ mb: 2 }}>
            <FormLabel>Password</FormLabel>
            <Input
              placeholder="Enter your password"
              type={showPassword ? "text" : "password"}
              startDecorator={<KeyIcon />}
              endDecorator={
                <IconButton 
                  onClick={togglePasswordVisibility} 
                  size="sm"
                  variant="plain"
                  color="neutral"
                >
                  {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </FormControl>
          
          <Button
            loading={loading}
            type="submit"
            fullWidth
            sx={{ mt: 2 }}
          >
            Sign In
          </Button>
        </form>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Link 
            component="button"
            level="body-sm" 
            onClick={() => setForgotPasswordOpen(true)}
            startDecorator={<LockIcon fontSize="small" />}
          >
            Forgot password?
          </Link>
        </Box>
      </Sheet>

      {/* Forgot Password Modal */}
      <Modal open={forgotPasswordOpen} onClose={() => setForgotPasswordOpen(false)}>
        <ModalDialog 
          variant="outlined" 
          sx={{ maxWidth: 400 }}
        >
          <ModalClose />
          <Typography component="h2" level="title-lg">
            Forgot Password
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Typography level="body-md" sx={{ mb: 2 }}>
            Please contact the system administrator to reset your password.
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EmailIcon color="primary" />
              <Typography level="body-md">admin@example.com</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PhoneIcon color="primary" />
              <Typography level="body-md">+63-917-123-4567</Typography>
            </Box>
          </Box>
          
          <Button 
            onClick={() => setForgotPasswordOpen(false)} 
            sx={{ mt: 3 }}
          >
            Close
          </Button>
        </ModalDialog>
      </Modal>
    </Box>
  )
}

export default Login 