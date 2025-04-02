import { Link as RouterLink } from 'react-router-dom'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import Button from '@mui/joy/Button'

const NotFound = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        textAlign: 'center',
        p: 2,
      }}
    >
      <Typography level="h1" sx={{ mb: 2 }}>
        404
      </Typography>
      <Typography level="h4" sx={{ mb: 4 }}>
        Page Not Found
      </Typography>
      <Typography sx={{ mb: 4 }}>
        The page you are looking for does not exist or has been moved.
      </Typography>
      <Button component={RouterLink} to="/" size="lg">
        Go to Dashboard
      </Button>
    </Box>
  )
}

export default NotFound 