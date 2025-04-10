import { useState } from 'react'
import { Outlet, useNavigate, NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

// Joy UI components
import { CssVarsProvider } from '@mui/joy/styles'
import CssBaseline from '@mui/joy/CssBaseline'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import IconButton from '@mui/joy/IconButton'
import List from '@mui/joy/List'
import ListItem from '@mui/joy/ListItem'
import ListItemButton from '@mui/joy/ListItemButton'
import ListItemContent from '@mui/joy/ListItemContent'
import Sheet from '@mui/joy/Sheet'
import Divider from '@mui/joy/Divider'
import Avatar from '@mui/joy/Avatar'
import Button from '@mui/joy/Button'

// Icons
import MenuIcon from '@mui/icons-material/Menu'
import DashboardIcon from '@mui/icons-material/Dashboard'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import LogoutIcon from '@mui/icons-material/Logout'
import BuildIcon from '@mui/icons-material/Build'
import RequestPageIcon from '@mui/icons-material/RequestPage'
import FactCheckIcon from '@mui/icons-material/FactCheck'
import EqualizerIcon from '@mui/icons-material/Equalizer'
import GroupsIcon from '@mui/icons-material/Groups'
import SettingsIcon from '@mui/icons-material/Settings'
import SummarizeIcon from '@mui/icons-material/Summarize'
import InventoryIcon from '@mui/icons-material/Inventory'
import HistoryIcon from '@mui/icons-material/History'
import WarehouseIcon from '@mui/icons-material/Warehouse'
import PeopleIcon from '@mui/icons-material/People'

const Layout = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen)
  }

  // Define navigation items based on user role
  const navigationItems = [
    {
      label: 'Dashboard',
      path: '/',
      icon: <DashboardIcon />,
      roles: ['admin', 'warehouse', 'branch']
    },
    {
      label: 'Summary',
      path: '/summary',
      icon: <SummarizeIcon />,
      roles: ['admin', 'warehouse', 'branch']
    },
    {
      label: 'Delivery Requests',
      path: '/delivery-requests',
      icon: <InventoryIcon />,
      roles: ['admin', 'warehouse', 'branch']
    },
    {
      label: 'Archive',
      path: '/archive',
      icon: <HistoryIcon />,
      roles: ['admin', 'warehouse', 'branch']
    },
    {
      label: 'Ongoing Deliveries',
      path: '/ongoing-deliveries',
      icon: <LocalShippingIcon />,
      roles: ['admin', 'branch']
    },
    {
      label: 'Deliveries',
      path: '/deliveries',
      icon: <LocalShippingIcon />,
      roles: ['admin', 'warehouse']
    },
    {
      label: 'Company Directory',
      path: '/company-directory',
      icon: <PeopleIcon />,
      roles: ['admin', 'warehouse', 'branch']
    },
    {
      label: 'Settings',
      path: '/settings',
      icon: <SettingsIcon />,
      roles: ['admin', 'warehouse', 'branch']
    }
  ]

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Mobile overlay */}
      {drawerOpen && (
        <Box
          onClick={() => setDrawerOpen(false)}
          sx={{
            position: 'fixed',
            zIndex: 999,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0, 0, 0, 0.5)',
            display: { xs: 'block', md: 'none' }
          }}
        />
      )}
      
      {/* Sidebar - hidden on mobile, visible on desktop */}
      <Sheet
        className="Sidebar"
        sx={{
          position: {
            xs: 'fixed',
            md: 'sticky',
          },
          transform: {
            xs: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
            md: 'none',
          },
          transition: 'transform 0.3s, opacity 0.3s',
          zIndex: 1000,
          height: '100vh',
          width: 256,
          top: 0,
          p: 2,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          borderRight: '1px solid',
          borderColor: 'divider',
          boxShadow: { xs: drawerOpen ? 'md' : 'none', md: 'none' },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            mb: 2
          }}
        >
          <img 
            src="/images/486806265_973935431491542_5201819430505773790_n (1).png" 
            alt="SBNC Logo" 
            style={{ 
              height: 80,
              objectFit: 'contain'
            }} 
          />
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {user?.profile_picture_url ? (
            <Avatar 
              size="sm" 
              src={user.profile_picture_url} 
              sx={{ width: 40, height: 40 }}
            />
          ) : (
            <Avatar 
              size="sm" 
              color={user?.role === 'admin' ? 'danger' : (user?.role === 'warehouse' ? 'primary' : 'success')}
              sx={{ width: 40, height: 40 }}
            >
              {user?.full_name 
                ? user.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() 
                : user?.username 
                  ? user.username.substring(0, 2).toUpperCase() 
                  : 'U'
              }
            </Avatar>
          )}
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography level="title-sm">{user?.full_name || user?.username || 'User'}</Typography>
            <Typography level="body-xs" sx={{ textTransform: 'capitalize' }}>{user?.role || 'Role'}</Typography>
          </Box>
        </Box>
        
        <Divider />
        
        <List
          size="sm"
          sx={{
            gap: 1,
            '--List-nestedInsetStart': '30px',
            '--ListItem-radius': '6px',
            display: 'flex',
            flexDirection: 'column',
            p: 0,
            mt: 1
          }}
        >
          {navigationItems.map((item, index) => (
            item.roles.includes(user?.role) && (
              <ListItem key={index} sx={{ py: 0.5 }}>
                <ListItemButton 
                  component={NavLink} 
                  to={item.path}
                  sx={{
                    p: 1.5,
                    gap: 1.5,
                    '&.active': {
                      bgcolor: 'primary.softBg',
                      color: 'primary.plainColor',
                      fontWeight: 'bold',
                    }
                  }}
                >
                  {item.icon}
                  <ListItemContent sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</ListItemContent>
                </ListItemButton>
              </ListItem>
            )
          ))}
        </List>
        
        <Box sx={{ mt: 'auto' }}>
          <Button
            variant="outlined"
            color="danger"
            startDecorator={<LogoutIcon />}
            onClick={handleLogout}
            fullWidth
            sx={{ gap: 1, p: 1 }}
          >
            Logout
          </Button>
        </Box>
      </Sheet>

      {/* Main content area */}
      <Box
        component="main"
        className="Main"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          height: '100vh',
          overflow: 'auto',
        }}
      >
        <Box
          component="header"
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <IconButton
            variant="outlined"
            color="neutral"
            size="md"
            onClick={toggleDrawer}
            sx={{ 
              display: { xs: 'inline-flex', md: 'none' },
              border: '1px solid',
              borderColor: 'neutral.300',
              borderRadius: '50%',
              '&:hover': {
                bgcolor: 'action.hover',
              }
            }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
            <a 
              href="https://www.stronghold.ph/" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                textDecoration: 'none', 
                color: 'inherit' 
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <img 
                  src="/images/486806265_973935431491542_5201819430505773790_n (1).png" 
                  alt="SBNC Logo" 
                  style={{ 
                    height: 60,
                    marginRight: '12px',
                    objectFit: 'contain'
                  }} 
                />
                <Box>
                  <Typography level="title-lg" sx={{ color: 'primary.600', fontWeight: 'bold', lineHeight: 1.2 }}>
                    STRONGHOLD
                  </Typography>
                  <Typography level="body-sm" sx={{ color: 'primary.500', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    BOLTS AND NUTS CORPORATION
                  </Typography>
                </Box>
              </Box>
            </a>
          </Box>
        </Box>
        
        <Box sx={{ flex: 1, p: 2 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}

export default Layout 