import React, { useState, useEffect } from 'react';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import Input from '@mui/joy/Input';
import Modal from '@mui/joy/Modal';
import ModalDialog from '@mui/joy/ModalDialog';
import ModalClose from '@mui/joy/ModalClose';
import Select from '@mui/joy/Select';
import Option from '@mui/joy/Option';
import Typography from '@mui/joy/Typography';
import Divider from '@mui/joy/Divider';
import Stack from '@mui/joy/Stack';
import Checkbox from '@mui/joy/Checkbox';
import Alert from '@mui/joy/Alert';
import IconButton from '@mui/joy/IconButton';
import Avatar from '@mui/joy/Avatar';
import { useAuth } from '../../contexts/AuthContext';

// Icons
import SaveIcon from '@mui/icons-material/Save';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import StorefrontIcon from '@mui/icons-material/Storefront';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';

const UserForm = ({ open, onClose, onSave, user, mode, loading, branches }) => {
  const { refreshUserData } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    full_name: '',
    phone: '',
    address: '',
    profile_picture_url: '',
    role: 'branch',
    branch_id: '',
    requirePasswordChange: mode === 'create', // Default to true for new users
  });
  
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  
  // Initial form data setup
  useEffect(() => {
    if (mode === 'edit' && user) {
      setFormData({
        username: user.username || '',
        password: '', // Don't fill password field for security
        email: user.email || '',
        full_name: user.full_name || '',
        phone: user.phone || '',
        address: user.address || '',
        profile_picture_url: user.profile_picture_url || '',
        role: user.role || 'branch',
        branch_id: user.branch_id || '',
        requirePasswordChange: false,
      });
      
      if (user.profile_picture_url) {
        setImagePreview(user.profile_picture_url);
      }
    } else {
      // Reset for create mode
      setFormData({
        username: '',
        password: '',
        email: '',
        full_name: '',
        phone: '',
        address: '',
        profile_picture_url: '',
        role: 'branch',
        branch_id: branches.length > 0 ? branches[0].id : '',
        requirePasswordChange: true,
      });
      setImagePreview('');
      setImageFile(null);
    }
    // Reset errors when form is opened
    setErrors({});
  }, [user, mode, open, branches]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
    
    // Clear error when field is changed
    if (errors[name]) {
      setErrors(prevErrors => ({
        ...prevErrors,
        [name]: undefined
      }));
    }
  };
  
  const handleSelectChange = (name, value) => {
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
    
    // Clear error when field is changed
    if (errors[name]) {
      setErrors(prevErrors => ({
        ...prevErrors,
        [name]: undefined
      }));
    }
  };
  
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: checked
    }));
  };
  
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file type
    if (!file.type.match('image.*')) {
      alert('Please select an image file');
      return;
    }
    
    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
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
  
  const handleImageUpload = async () => {
    if (!imageFile) return null;
    
    try {
      setUploadLoading(true);
      
      // Create a FormData object to send the image to Cloudinary
      const data = new FormData();
      data.append('file', imageFile);
      data.append('upload_preset', 'sbncorp_users'); // Replace with your Cloudinary upload preset
      data.append('cloud_name', 'dzhr9zpe2'); // Replace with your Cloudinary cloud name
      
      // Upload to Cloudinary
      const response = await fetch('https://api.cloudinary.com/v1_1/dzhr9zpe2/image/upload', {
        method: 'POST',
        body: data
      });
      
      const imageData = await response.json();
      
      if (imageData.secure_url) {
        return imageData.secure_url;
      }
      return null;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    } finally {
      setUploadLoading(false);
    }
  };
  
  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    setFormData(prevData => ({
      ...prevData,
      profile_picture_url: ''
    }));
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    // Required fields
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }
    
    // Password validation for new users or when changing password
    if (mode === 'create' && !formData.password) {
      newErrors.password = 'Password is required for new users';
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    // Email validation
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email address is invalid';
    }
    
    // Role validation
    if (!formData.role) {
      newErrors.role = 'Role is required';
    }
    
    // Branch validation - only required for branch users
    if (formData.role === 'branch' && !formData.branch_id) {
      newErrors.branch_id = 'Branch is required for branch users';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    // Prepare form data for submission
    const userData = {
      username: formData.username,
      role: formData.role,
      full_name: formData.full_name || '',
      email: formData.email || '',
      phone: formData.phone || '',
      address: formData.address || '',
    };
    
    // Add password if provided or required
    if (formData.password) {
      userData.password = formData.password;
    }
    
    // Add branch ID if branch role is selected
    if (formData.role === 'branch' && formData.branch_id) {
      userData.branch_id = formData.branch_id;
    } else {
      userData.branch_id = null; // Explicitly set to null for non-branch roles
    }
    
    // Upload image if provided
    if (imageFile) {
      const imageUrl = await handleImageUpload();
      if (imageUrl) {
        userData.profile_picture_url = imageUrl;
      }
    }
    
    // Call the onSave handler provided by parent component
    await onSave(userData);
    
    // Refresh user data in AuthContext to propagate changes
    await refreshUserData(false);
    
    // Close the form
    onClose();
  };
  
  // Generate initials for avatar from full name or username
  const getUserInitials = () => {
    if (formData.full_name) {
      return formData.full_name
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
    
    return formData.username.substring(0, 2).toUpperCase();
  };
  
  // Select role color for avatar
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
  
  return (
    <Modal open={open} onClose={onClose}>
      <ModalDialog
        variant="outlined"
        size="lg"
        sx={{
          minWidth: { sm: 500 },
          maxWidth: 600,
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <ModalClose />
        <Typography component="h2" level="title-lg">
          {mode === 'create' ? 'Add New User' : 'Edit User'}
        </Typography>
        
        <Divider sx={{ my: 2 }} />
        
        {/* Profile Picture */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
          {imagePreview ? (
            <Box sx={{ position: 'relative', mb: 2 }}>
              <Avatar
                src={imagePreview}
                sx={{ width: 100, height: 100 }}
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
                onClick={removeImage}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          ) : (
            <Avatar
              color={getRoleColor(formData.role)}
              sx={{ width: 100, height: 100, mb: 2, fontSize: '2.5rem' }}
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
        
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControl sx={{ flexGrow: 1 }} error={!!errors.full_name}>
              <FormLabel>Full Name</FormLabel>
              <Input
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="John Doe"
              />
            </FormControl>
            
            <FormControl sx={{ flexGrow: 1 }} error={!!errors.username} required>
              <FormLabel>Username</FormLabel>
              <Input
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="johndoe"
                disabled={mode === 'edit' && user?.role !== 'admin'}
              />
              {errors.username && (
                <Typography level="body-xs" color="danger">
                  {errors.username}
                </Typography>
              )}
            </FormControl>
          </Box>
          
          <FormControl error={!!errors.password} required={mode === 'create'}>
            <FormLabel>{mode === 'create' ? 'Password' : 'New Password (leave blank to keep current)'}</FormLabel>
            <Input
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              placeholder={mode === 'create' ? 'Create password' : 'Enter new password'}
              endDecorator={
                <IconButton
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              }
            />
            {errors.password && (
              <Typography level="body-xs" color="danger">
                {errors.password}
              </Typography>
            )}
          </FormControl>
          
          {mode === 'create' && (
            <FormControl>
              <Checkbox
                name="requirePasswordChange"
                checked={formData.requirePasswordChange}
                onChange={handleCheckboxChange}
                label="User must change password on first login"
              />
            </FormControl>
          )}
          
          <FormControl error={!!errors.email}>
            <FormLabel>Email</FormLabel>
            <Input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="john.doe@example.com"
            />
            {errors.email && (
              <Typography level="body-xs" color="danger">
                {errors.email}
              </Typography>
            )}
          </FormControl>
          
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControl sx={{ flexGrow: 1 }}>
              <FormLabel>Phone</FormLabel>
              <Input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1234567890"
              />
            </FormControl>
            
            <FormControl sx={{ flexGrow: 1 }} error={!!errors.role} required>
              <FormLabel>Role</FormLabel>
              <Select
                name="role"
                value={formData.role}
                onChange={(_, value) => handleSelectChange('role', value)}
                placeholder="Select role"
                startDecorator={
                  formData.role === 'admin' ? <AdminPanelSettingsIcon /> : 
                  formData.role === 'warehouse' ? <WarehouseIcon /> : 
                  <StorefrontIcon />
                }
              >
                <Option value="admin">Admin</Option>
                <Option value="warehouse">Warehouse</Option>
                <Option value="branch">Branch</Option>
              </Select>
              {errors.role && (
                <Typography level="body-xs" color="danger">
                  {errors.role}
                </Typography>
              )}
            </FormControl>
          </Box>
          
          {formData.role === 'branch' && (
            <FormControl error={!!errors.branch_id} required>
              <FormLabel>Branch</FormLabel>
              <Select
                name="branch_id"
                value={formData.branch_id}
                onChange={(_, value) => handleSelectChange('branch_id', value)}
                placeholder="Select branch"
              >
                {branches.map(branch => (
                  <Option key={branch.id} value={branch.id}>{branch.name}</Option>
                ))}
              </Select>
              {errors.branch_id && (
                <Typography level="body-xs" color="danger">
                  {errors.branch_id}
                </Typography>
              )}
            </FormControl>
          )}
          
          <FormControl>
            <FormLabel>Address</FormLabel>
            <Input
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="123 Main St, City, Country"
            />
          </FormControl>
          
          {mode === 'edit' && (
            <Alert color="warning" sx={{ mt: 2 }}>
              Note: Leave password field empty to keep the current password.
            </Alert>
          )}
        </Stack>
        
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 3 }}>
          <Button
            variant="outlined"
            color="neutral"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="solid"
            color="primary"
            onClick={handleSubmit}
            loading={loading || uploadLoading}
            startDecorator={<SaveIcon />}
          >
            {mode === 'create' ? 'Create User' : 'Save Changes'}
          </Button>
        </Box>
      </ModalDialog>
    </Modal>
  );
};

export default UserForm; 