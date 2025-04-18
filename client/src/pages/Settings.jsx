import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

// Joy UI components
import Box from '@mui/joy/Box';
import Typography from '@mui/joy/Typography';
import Card from '@mui/joy/Card';
import CardContent from '@mui/joy/CardContent';
import Divider from '@mui/joy/Divider';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import Input from '@mui/joy/Input';
import Button from '@mui/joy/Button';
import IconButton from '@mui/joy/IconButton';
import Alert from '@mui/joy/Alert';
import Avatar from '@mui/joy/Avatar';
import CircularProgress from '@mui/joy/CircularProgress';
import Sheet from '@mui/joy/Sheet';
import Switch from '@mui/joy/Switch';
import Stack from '@mui/joy/Stack';
import Snackbar from '@mui/joy/Snackbar';
import ModalClose from '@mui/joy/ModalClose';
import { useColorScheme } from '@mui/joy/styles';
import Modal from '@mui/joy/Modal';
import ModalDialog from '@mui/joy/ModalDialog';

// Icons
import SaveIcon from '@mui/icons-material/Save';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonIcon from '@mui/icons-material/Person';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import DeleteIcon from '@mui/icons-material/Delete';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import StorefrontIcon from '@mui/icons-material/Storefront';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import ArchiveIcon from '@mui/icons-material/Archive';
import WarningIcon from '@mui/icons-material/Warning';

const Settings = () => {
  const { user, setUser, logout, refreshUserData } = useAuth();
  const { mode, setMode } = useColorScheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [clearArchiveOpen, setClearArchiveOpen] = useState(false);
  const [clearingArchive, setClearingArchive] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    phone: '',
    address: '',
    current_password: '',
    new_password: '',
    confirm_password: '',
    username: ''
  });
  
  // Initialize form data from user object
  useEffect(() => {
    if (user) {
      console.log('User data:', user);
      setFormData({
        email: user.email || '',
        full_name: user.full_name || '',
        phone: user.phone || '',
        address: user.address || '',
        current_password: '',
        new_password: '',
        confirm_password: '',
        username: user.username || ''
      });
      
      // Force refresh imagePreview with user's profile picture
      if (user.profile_picture_url) {
        console.log('Setting profile picture from user:', user.profile_picture_url);
        setImagePreview(user.profile_picture_url);
      }
    }
  }, [user]);
  
  // Handle text input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle dark mode toggle
  const handleDarkModeToggle = () => {
    const newMode = mode === 'dark' ? 'light' : 'dark';
    setMode(newMode);
    localStorage.setItem('joy-mode', newMode);
  };
  
  // Handle profile image change
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file type
    if (!file.type.match('image.*')) {
      setError('Please select an image file');
      return;
    }
    
    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }
    
    setImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };
  
  // Remove profile image
  const removeImage = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      setImageFile(null);
      setImagePreview('');
      
      console.log('Removing profile picture for user ID:', user.id);
      
      // Notify user
      setSuccess('Removing profile picture...');
      
      // Make a direct API call to update only the profile_picture_url to null
      const response = await axios.put(`/api/users/${user.id}`, {
        profile_picture_url: null
      });
      
      console.log('Profile picture removal response:', response.data);
      
      // Update user context with new data
      setUser({
        ...user,
        profile_picture_url: null
      });
      
      // Refresh user data to ensure all parts of the app have the latest data
      await refreshUserData(false);
      
      setSuccess('Profile picture removed successfully');
    } catch (err) {
      console.error('Error removing profile picture:', err);
      const errorMsg = err.response?.data?.error || 'Failed to remove profile picture';
      console.error('Error details:', errorMsg);
      setError(errorMsg);
      
      // Restore preview if removal failed
      if (user?.profile_picture_url) {
        setImagePreview(user.profile_picture_url);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Upload image to Cloudinary
  const uploadImage = async () => {
    if (!imageFile) return null;
    
    try {
      setUploadLoading(true);
      
      // Create a FormData object to send the image to Cloudinary
      const data = new FormData();
      data.append('file', imageFile);
      data.append('upload_preset', 'sbncorp_users'); // Your Cloudinary upload preset
      data.append('cloud_name', 'dzhr9zpe2'); // Your Cloudinary cloud name
      
      // Upload to Cloudinary
      const response = await fetch('https://api.cloudinary.com/v1_1/dzhr9zpe2/image/upload', {
        method: 'POST',
        body: data
      });
      
      const imageData = await response.json();
      
      if (imageData.secure_url) {
        return imageData.secure_url;
      }
      throw new Error(imageData.error?.message || 'Failed to upload image');
    } catch (error) {
      console.error('Error uploading image:', error);
      setError('Failed to upload profile picture');
      return null;
    } finally {
      setUploadLoading(false);
    }
  };
  
  // Save profile changes
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Validate password fields if provided
      if (formData.new_password) {
        if (!formData.current_password) {
          setError('Current password is required to set a new password');
          setLoading(false);
          return;
        }
        
        if (formData.new_password.length < 6) {
          setError('New password must be at least 6 characters');
          setLoading(false);
          return;
        }
        
        if (formData.new_password !== formData.confirm_password) {
          setError('New passwords do not match');
          setLoading(false);
          return;
        }
      }
      
      // Upload image if changed
      let profileUrl = user?.profile_picture_url || null;
      if (imageFile) {
        profileUrl = await uploadImage();
        if (!profileUrl && imageFile) {
          setError('Failed to upload profile picture');
          setLoading(false);
          return;
        }
      }
      
      // Prepare data for update
      const updateData = {
        email: formData.email,
        full_name: formData.full_name,
        phone: formData.phone,
        address: formData.address,
        profile_picture_url: profileUrl,
        username: formData.username
      };
      
      // Add password fields if provided
      if (formData.new_password && formData.current_password) {
        updateData.password = formData.new_password;
        updateData.current_password = formData.current_password;
      }
      
      // Log the final update data
      console.log('Sending user update request with data:', updateData);
      
      // Update profile
      const response = await axios.put(`/api/users/${user.id}`, updateData);
      
      // Log the response data
      console.log('Server response data:', response.data);
      
      // Update user context with new data
      setUser({
        ...user,
        ...response.data
      });
      
      // Refresh user data to ensure all parts of the app have the latest data
      await refreshUserData(false);
      
      setSuccess('Profile updated successfully');
      
      // Reset password fields
      setFormData(prev => ({
        ...prev,
        current_password: '',
        new_password: '',
        confirm_password: ''
      }));
      
      // Reset image file state
      setImageFile(null);
      
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };
  
  // Get role icon and color
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
    if (formData.full_name) {
      return formData.full_name
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
    
    return user?.username?.substring(0, 2).toUpperCase() || 'U';
  };
  
  // Initialize state for admin password input
  const [adminPassword, setAdminPassword] = useState('');
  const [passwordError, setPasswordError] = useState(null);

  // Modified clear archive handler
  const handleClearArchive = async () => {
    try {
      setClearingArchive(true);
      setError(null);
      setSuccess(null);
      
      const response = await axios.delete('/api/admin/clear-archive');
      
      console.log('Archive cleared:', response.data);
      setSuccess(`Archive cleared successfully. ${response.data.deletedItems.total} items removed.`);
      setClearArchiveOpen(false);
    } catch (err) {
      console.error('Error clearing archive:', err);
      setError(err.response?.data?.error || 'Failed to clear archive');
      setClearArchiveOpen(false);
    } finally {
      setClearingArchive(false);
    }
  };
  
  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ py: 2, maxWidth: 800, mx: 'auto' }}>
      {/* Debug info for development */}
      <Box sx={{ display: 'none' }}>
        <pre>
          {JSON.stringify({
            user: user ? { ...user, profile_picture_url: user.profile_picture_url || 'none' } : null,
            imagePreview: imagePreview || 'none'
          }, null, 2)}
        </pre>
      </Box>
      
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
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
          <SettingsIcon fontSize="large" />
        </Sheet>
        <Typography level="h4">Settings</Typography>
      </Box>
      
      {/* Profile Settings Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography level="title-lg" startDecorator={<PersonIcon />} sx={{ mb: 2 }}>
            Profile Settings
          </Typography>
          
          <Divider sx={{ mb: 3 }} />
          
          {/* Profile Picture */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            {console.log('Rendering avatar, imagePreview:', imagePreview, 'user?.profile_picture_url:', user?.profile_picture_url)}
            {Boolean(imagePreview || user?.profile_picture_url) ? (
              <Box sx={{ position: 'relative', mb: 2 }}>
                <Avatar
                  src={imagePreview || user?.profile_picture_url}
                  sx={{ width: 120, height: 120 }}
                  imgProps={{
                    crossOrigin: "anonymous",
                    referrerPolicy: "no-referrer",
                    loading: "eager",
                    onError: (e) => { 
                      console.error('Image load error:', e);
                      e.target.src = ''; // Clear source on error
                    }
                  }}
                />
                <IconButton
                  size="sm"
                  variant="soft"
                  color="danger"
                  sx={{ 
                    position: 'absolute', 
                    top: -8, 
                    right: -8,
                    boxShadow: 'sm'
                  }}
                  onClick={() => {
                    if (!loading) {
                      removeImage();
                    }
                  }}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size="sm" /> : <DeleteIcon />}
                </IconButton>
              </Box>
            ) : (
              <Avatar
                color={getRoleColor(user.role)}
                sx={{ width: 120, height: 120, mb: 2, fontSize: '3rem' }}
              >
                {getUserInitials()}
              </Avatar>
            )}
            
            <Button
              component="label"
              variant="outlined"
              color="neutral"
              startDecorator={<CloudUploadIcon />}
              size="sm"
            >
              Upload Picture
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={handleImageChange}
              />
            </Button>
            <Typography level="body-xs" sx={{ mt: 1 }}>
              Max size: 5MB. Recommended: 200x200px
            </Typography>
          </Box>
          
          {/* Profile Form */}
          <form onSubmit={handleSaveProfile}>
            <Stack spacing={2}>
              <FormControl>
                <FormLabel>Username</FormLabel>
                <Input
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  startDecorator={<PersonIcon />}
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Role</FormLabel>
                <Input
                  value={user.role}
                  disabled
                  readOnly
                  startDecorator={getRoleIcon(user.role)}
                  sx={{ textTransform: 'capitalize' }}
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Email</FormLabel>
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your.email@example.com"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Full Name</FormLabel>
                <Input
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Your Name"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Phone</FormLabel>
                <Input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1234567890"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Address</FormLabel>
                <Input
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="123 Main St, City, Country"
                />
              </FormControl>
              
              <Divider>Change Password</Divider>
              
              <FormControl>
                <FormLabel>Current Password</FormLabel>
                <Input
                  name="current_password"
                  type="password"
                  value={formData.current_password}
                  onChange={handleChange}
                  placeholder="Enter current password"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>New Password</FormLabel>
                <Input
                  name="new_password"
                  type="password"
                  value={formData.new_password}
                  onChange={handleChange}
                  placeholder="Enter new password"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Confirm New Password</FormLabel>
                <Input
                  name="confirm_password"
                  type="password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  placeholder="Confirm new password"
                />
              </FormControl>
              
              {error && (
                <Alert color="danger" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  type="submit"
                  loading={loading || uploadLoading}
                  startDecorator={<SaveIcon />}
                >
                  Save Changes
                </Button>
              </Box>
            </Stack>
          </form>
        </CardContent>
      </Card>
      
      {/* Appearance Settings Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography level="title-lg" startDecorator={
            mode === 'dark' ? <DarkModeIcon /> : <LightModeIcon />
          } sx={{ mb: 2 }}>
            Appearance
          </Typography>
          
          <Divider sx={{ mb: 3 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography level="title-sm">Dark Mode</Typography>
              <Typography level="body-sm" color="neutral">
                Switch between light and dark theme
              </Typography>
            </Box>
            <Switch
              checked={mode === 'dark'}
              onChange={handleDarkModeToggle}
              startDecorator={<LightModeIcon />}
              endDecorator={<DarkModeIcon />}
            />
          </Box>
        </CardContent>
      </Card>
      
      {/* Add vertical spacing here */}
      <Box sx={{ mb: 3 }}></Box>
      
      {/* Admin Settings Card - only visible to admins */}
      {user?.role === 'admin' && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography level="title-lg" startDecorator={<AdminPanelSettingsIcon />} sx={{ mb: 2 }}>
              Admin Settings
            </Typography>
            
            <Divider sx={{ mb: 3 }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography level="title-sm">Clear Archive</Typography>
                <Typography level="body-sm" color="neutral">
                  Remove all archived deliveries and requests to free up space
                </Typography>
              </Box>
              <Button
                color="danger"
                startDecorator={<ArchiveIcon />}
                onClick={() => setClearArchiveOpen(true)}
              >
                Clear Archive
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}
      
      {/* Success message snackbar */}
      <Snackbar
        open={!!success}
        onClose={() => setSuccess(null)}
        color="success"
        autoHideDuration={5000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        startDecorator={<CheckCircleIcon />}
        endDecorator={
          <IconButton
            onClick={() => setSuccess(null)}
            size="sm"
            variant="plain"
            color="neutral"
          >
            <CloseIcon />
          </IconButton>
        }
      >
        {success}
      </Snackbar>
      
      {/* Clear Archive Confirmation Modal */}
      <Modal open={clearArchiveOpen} onClose={() => setClearArchiveOpen(false)}>
        <ModalDialog variant="outlined" role="alertdialog">
          <Typography component="h2" level="title-lg" startDecorator={<WarningIcon color="warning" />}>
            Confirm Clear Archive
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Typography level="body-md" mb={2}>
            Are you sure you want to clear all archived data? This action cannot be undone and will permanently delete all archived deliveries and requests.
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              color="neutral"
              onClick={() => setClearArchiveOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="solid"
              color="danger"
              onClick={handleClearArchive}
              loading={clearingArchive}
            >
              Clear Archive
            </Button>
          </Box>
        </ModalDialog>
      </Modal>
    </Box>
  );
};

export default Settings; 