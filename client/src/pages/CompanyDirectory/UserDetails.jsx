import React from 'react';
import Box from '@mui/joy/Box';
import Modal from '@mui/joy/Modal';
import ModalDialog from '@mui/joy/ModalDialog';
import ModalClose from '@mui/joy/ModalClose';
import Typography from '@mui/joy/Typography';
import Button from '@mui/joy/Button';
import Divider from '@mui/joy/Divider';
import Stack from '@mui/joy/Stack';
import Avatar from '@mui/joy/Avatar';
import Chip from '@mui/joy/Chip';
import Sheet from '@mui/joy/Sheet';

// Icons
import EditIcon from '@mui/icons-material/Edit';
import EmailIcon from '@mui/icons-material/Email';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import StorefrontIcon from '@mui/icons-material/Storefront';
import BusinessIcon from '@mui/icons-material/Business';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

const UserDetails = ({ open, onClose, user, onEdit }) => {
  if (!user) return null;
  
  // Get appropriate role icon and color
  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <AdminPanelSettingsIcon />;
      case 'warehouse':
        return <WarehouseIcon />;
      case 'branch':
        return <StorefrontIcon />;
      default:
        return <PersonIcon />;
    }
  };
  
  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'danger';
      case 'warehouse':
        return 'primary';
      case 'branch':
        return 'success';
      default:
        return 'neutral';
    }
  };
  
  // Get user initials for avatar
  const getUserInitials = () => {
    if (user.full_name) {
      return user.full_name
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
    
    return user.username.substring(0, 2).toUpperCase();
  };
  
  // Format creation date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };
  
  return (
    <Modal open={open} onClose={onClose}>
      <ModalDialog
        variant="outlined"
        layout="center"
        size="md"
        sx={{
          minWidth: { sm: 500 },
          maxWidth: 600,
        }}
      >
        <ModalClose />
        
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          {user.profile_picture_url ? (
            <Avatar
              src={user.profile_picture_url}
              color={getRoleColor(user.role)}
              sx={{
                width: 100,
                height: 100,
                mx: 'auto',
                mb: 2,
                fontSize: '2.5rem',
              }}
            />
          ) : (
            <Avatar
              color={getRoleColor(user.role)}
              sx={{
                width: 100,
                height: 100,
                mx: 'auto',
                mb: 2,
                fontSize: '2.5rem',
              }}
            >
              {getUserInitials()}
            </Avatar>
          )}
          
          <Typography level="h4" sx={{ mb: 0.5 }}>
            {user.full_name || user.username}
          </Typography>
          
          <Chip
            size="md"
            variant="soft"
            color={getRoleColor(user.role)}
            startDecorator={getRoleIcon(user.role)}
            sx={{ textTransform: 'capitalize' }}
          >
            {user.role}
          </Chip>
          
          {user.branch_name && (
            <Typography level="body-md" sx={{ mt: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
              <BusinessIcon fontSize="small" />
              {user.branch_name}
            </Typography>
          )}
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ mb: 3 }}>
          <Stack spacing={2}>
            <InfoItem 
              icon={<PersonIcon />} 
              label="Username" 
              value={user.username} 
            />
            
            <InfoItem 
              icon={<EmailIcon />} 
              label="Email" 
              value={user.email} 
            />
            
            <InfoItem 
              icon={<PhoneIcon />} 
              label="Phone" 
              value={user.phone} 
            />
            
            <InfoItem 
              icon={<LocationOnIcon />} 
              label="Address" 
              value={user.address} 
            />
            
            {user.branch_address && (
              <InfoItem 
                icon={<LocationOnIcon />} 
                label="Branch Address" 
                value={user.branch_address} 
              />
            )}
            
            <InfoItem 
              icon={<CalendarTodayIcon />} 
              label="Joined" 
              value={user.created_at ? formatDate(user.created_at) : 'N/A'} 
            />
          </Stack>
        </Box>
        
        {onEdit && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                color="primary"
                startDecorator={<EditIcon />}
                onClick={onEdit}
              >
                Edit User
              </Button>
            </Box>
          </>
        )}
      </ModalDialog>
    </Modal>
  );
};

// Helper component for displaying info items
const InfoItem = ({ icon, label, value }) => {
  return (
    <Sheet
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 'sm',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ color: 'primary.500' }}>{icon}</Box>
        <Box>
          <Typography level="body-xs" color="neutral">{label}</Typography>
          <Typography level="body-md">{value || 'Not provided'}</Typography>
        </Box>
      </Box>
    </Sheet>
  );
};

export default UserDetails; 