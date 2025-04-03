import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

// Joy UI components
import Box from '@mui/joy/Box';
import Typography from '@mui/joy/Typography';
import Table from '@mui/joy/Table';
import Sheet from '@mui/joy/Sheet';
import Button from '@mui/joy/Button';
import IconButton from '@mui/joy/IconButton';
import Input from '@mui/joy/Input';
import Select from '@mui/joy/Select';
import Option from '@mui/joy/Option';
import CircularProgress from '@mui/joy/CircularProgress';
import Alert from '@mui/joy/Alert';
import Chip from '@mui/joy/Chip';
import Tabs from '@mui/joy/Tabs';
import TabList from '@mui/joy/TabList';
import Tab from '@mui/joy/Tab';
import Modal from '@mui/joy/Modal';
import ModalDialog from '@mui/joy/ModalDialog';
import ModalClose from '@mui/joy/ModalClose';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import Stack from '@mui/joy/Stack';
import Avatar from '@mui/joy/Avatar';
import Card from '@mui/joy/Card';
import CardContent from '@mui/joy/CardContent';
import CardOverflow from '@mui/joy/CardOverflow';
import CardActions from '@mui/joy/CardActions';
import Divider from '@mui/joy/Divider';
import Grid from '@mui/joy/Grid';

// Icons
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import StorefrontIcon from '@mui/icons-material/Storefront';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import GroupsIcon from '@mui/icons-material/Groups';
import GridViewIcon from '@mui/icons-material/GridView';
import TableRowsIcon from '@mui/icons-material/TableRows';

// Components
import UserForm from './UserForm';
import UserDetails from './UserDetails';

const CompanyDirectory = () => {
  const { user, refreshUserData } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [branches, setBranches] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  
  // Selected user and modals
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create'); // 'create' or 'edit'
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  const isAdmin = user?.role === 'admin';
  
  // Fetch users and branches
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/users/directory/all');
      setUsers(response.data);
      setFilteredUsers(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      const errorMessage = err.response?.data?.error || 'Failed to load company directory';
      setError(errorMessage);
      // If the users array is already populated, keep it to avoid empty screen on refresh error
      if (users.length === 0) {
        setUsers([]);
        setFilteredUsers([]);
      }
    } finally {
      setLoading(false);
    }
  };
  
  const fetchBranches = async () => {
    try {
      const response = await axios.get('/api/branches');
      setBranches(response.data);
    } catch (err) {
      console.error('Error fetching branches:', err);
      // Not setting error state here to prioritize user data
    }
  };
  
  useEffect(() => {
    fetchUsers();
    fetchBranches();
  }, []);
  
  // Filter users based on search, role, and branch
  useEffect(() => {
    let result = users;
    
    // Apply role filter
    if (roleFilter !== 'all') {
      result = result.filter(user => user.role === roleFilter);
    }
    
    // Apply branch filter
    if (branchFilter !== 'all') {
      const branchId = parseInt(branchFilter, 10);
      result = result.filter(user => user.branch_id === branchId);
    }
    
    // Apply search filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter(
        user =>
          user.username.toLowerCase().includes(lowerSearchTerm) ||
          (user.full_name && user.full_name.toLowerCase().includes(lowerSearchTerm)) ||
          (user.email && user.email.toLowerCase().includes(lowerSearchTerm)) ||
          (user.branch_name && user.branch_name.toLowerCase().includes(lowerSearchTerm))
      );
    }
    
    setFilteredUsers(result);
  }, [users, searchTerm, roleFilter, branchFilter]);
  
  // Handle user creation/update
  const handleSaveUser = async (userData) => {
    try {
      setActionLoading(true);
      
      if (formMode === 'create') {
        // Create new user
        const response = await axios.post('/api/users', userData);
        setUsers(prevUsers => [...prevUsers, response.data]);
      } else {
        // Update existing user
        const response = await axios.put(`/api/users/${selectedUser.id}`, userData);
        setUsers(prevUsers => 
          prevUsers.map(u => u.id === selectedUser.id ? response.data : u)
        );
      }
      
      // Refresh user data in AuthContext to ensure latest data is available app-wide
      await refreshUserData(false);
      
      setFormOpen(false);
      fetchUsers(); // Refresh to get complete data with branch names etc.
    } catch (err) {
      console.error('Error saving user:', err);
      alert(err.response?.data?.error || 'Failed to save user');
    } finally {
      setActionLoading(false);
    }
  };
  
  // Handle user deletion
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      setActionLoading(true);
      await axios.delete(`/api/users/${selectedUser.id}`);
      
      setUsers(prevUsers => prevUsers.filter(u => u.id !== selectedUser.id));
      
      // Refresh user data in AuthContext to ensure latest data is available app-wide
      await refreshUserData(false);
      
      setDeleteConfirmOpen(false);
    } catch (err) {
      console.error('Error deleting user:', err);
      alert(err.response?.data?.error || 'Failed to delete user');
    } finally {
      setActionLoading(false);
    }
  };
  
  // Open forms in different modes
  const openCreateForm = () => {
    setSelectedUser(null);
    setFormMode('create');
    setFormOpen(true);
  };
  
  const openEditForm = (user) => {
    setSelectedUser(user);
    setFormMode('edit');
    setFormOpen(true);
  };
  
  const openDetailsView = (user) => {
    setSelectedUser(user);
    setDetailsOpen(true);
  };
  
  const openDeleteConfirm = (user) => {
    setSelectedUser(user);
    setDeleteConfirmOpen(true);
  };
  
  // Role to icon mapping
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
  
  // Role to color mapping
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
  
  // Render role chip
  const renderRoleChip = (role) => {
    return (
      <Chip
        size="sm"
        variant="soft"
        color={getRoleColor(role)}
        startDecorator={getRoleIcon(role)}
        sx={{ 
          fontSize: '0.75rem', 
          height: '24px',
          '--Chip-paddingInline': '0.5rem',
          '--Chip-gap': '0.25rem'
        }}
      >
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Chip>
    );
  };
  
  // Get user initials for avatar
  const getUserInitials = (user) => {
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
  
  // Count users by role
  const getUserCountByRole = (role) => {
    return role === 'all' 
      ? users.length 
      : users.filter(user => user.role === role).length;
  };
  
  // This function will create an avatar with profile picture if available
  const renderUserAvatar = (user, size = { width: 80, height: 80, fontSize: '2rem' }) => {
    if (user) {
      return user.profile_picture_url ? (
        <Avatar
          src={user.profile_picture_url}
          variant="soft"
          color={getRoleColor(user.role)} 
          sx={{ 
            width: size.width,
            height: size.height,
            fontSize: size.fontSize,
            mx: 'auto', 
            mb: 2
          }}
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
      ) : (
        <Avatar
          variant="soft"
          color={getRoleColor(user.role)} 
          sx={{ 
            width: size.width,
            height: size.height,
            fontSize: size.fontSize,
            mx: 'auto', 
            mb: 2
          }}
        >
          {getUserInitials(user)}
        </Avatar>
      );
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert color="danger">{error}</Alert>
        <Button
          onClick={fetchUsers}
          startDecorator={<RefreshIcon />}
          sx={{ mt: 2 }}
        >
          Retry
        </Button>
      </Box>
    );
  }
  
  return (
    <Box sx={{ py: 2 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
            <GroupsIcon fontSize="large" />
          </Sheet>
          <Typography level="h4">Company Directory</Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startDecorator={<RefreshIcon />}
            onClick={fetchUsers}
          >
            Refresh
          </Button>
          
          {isAdmin && (
            <Button
              color="primary"
              startDecorator={<AddIcon />}
              onClick={openCreateForm}
            >
              Add User
            </Button>
          )}
        </Box>
      </Box>

      {/* Search and Filters */}
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          alignItems: { sm: 'center' },
          justifyContent: 'space-between',
          p: 2,
          borderRadius: 'sm',
          bgcolor: 'background.level1',
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Input
            placeholder="Search by name, email, or branch..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            startDecorator={<SearchIcon />}
            sx={{ width: '100%' }}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Select
            value={roleFilter}
            onChange={(_, value) => setRoleFilter(value)}
            placeholder="All Roles"
            sx={{ minWidth: 150 }}
          >
            <Option value="all">All Roles</Option>
            <Option value="admin">Admin</Option>
            <Option value="warehouse">Warehouse</Option>
            <Option value="branch">Branch</Option>
          </Select>
          
          <Select
            value={branchFilter}
            onChange={(_, value) => setBranchFilter(value)}
            placeholder="All Branches"
            sx={{ minWidth: 180 }}
          >
            <Option value="all">All Branches</Option>
            {branches.map(branch => (
              <Option key={branch.id} value={branch.id}>{branch.name}</Option>
            ))}
          </Select>
          
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton
              variant={viewMode === 'grid' ? 'solid' : 'plain'}
              color={viewMode === 'grid' ? 'primary' : 'neutral'}
              onClick={() => setViewMode('grid')}
            >
              <GridViewIcon />
            </IconButton>
            <IconButton
              variant={viewMode === 'table' ? 'solid' : 'plain'}
              color={viewMode === 'table' ? 'primary' : 'neutral'}
              onClick={() => setViewMode('table')}
            >
              <TableRowsIcon />
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* Role Tabs */}
      <Tabs 
        value={roleFilter} 
        onChange={(_, value) => setRoleFilter(value)}
        sx={{ mb: 3 }}
      >
        <TabList>
          <Tab value="all">
            All Users
            <Chip size="sm" variant="soft" sx={{ ml: 1 }}>{getUserCountByRole('all')}</Chip>
          </Tab>
          <Tab value="admin">
            Admins
            <Chip size="sm" variant="soft" color="danger" sx={{ ml: 1 }}>{getUserCountByRole('admin')}</Chip>
          </Tab>
          <Tab value="warehouse">
            Warehouse
            <Chip size="sm" variant="soft" color="primary" sx={{ ml: 1 }}>{getUserCountByRole('warehouse')}</Chip>
          </Tab>
          <Tab value="branch">
            Branch
            <Chip size="sm" variant="soft" color="success" sx={{ ml: 1 }}>{getUserCountByRole('branch')}</Chip>
          </Tab>
        </TabList>
      </Tabs>

      {/* User List */}
      {filteredUsers.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center', bgcolor: 'background.level1', borderRadius: 'sm' }}>
          <Typography level="body-lg">No users found</Typography>
        </Box>
      ) : viewMode === 'grid' ? (
        <Grid container spacing={2}>
          {filteredUsers.map(user => (
            <Grid key={user.id} xs={12} sm={6} md={4} lg={3}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center' }}>
                  {renderUserAvatar(user)}
                  
                  <Typography level="title-md" sx={{ mb: 0.5 }}>
                    {user.full_name || user.username}
                  </Typography>
                  
                  {renderRoleChip(user.role)}
                  
                  <Typography level="body-sm" sx={{ mt: 1 }}>
                    {user.email}
                  </Typography>
                  
                  {user.branch_name && (
                    <Typography level="body-sm" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mt: 0.5 }}>
                      <StorefrontIcon fontSize="small" />
                      {user.branch_name}
                    </Typography>
                  )}
                </CardContent>
                
                <CardOverflow sx={{ bgcolor: 'background.level1' }}>
                  <CardActions buttonFlex="1">
                    <Button 
                      size="sm" 
                      variant="outlined" 
                      color="neutral"
                      startDecorator={<VisibilityIcon />}
                      onClick={() => openDetailsView(user)}
                    >
                      Details
                    </Button>
                    
                    {isAdmin && (
                      <Button 
                        size="sm" 
                        variant="outlined" 
                        color="primary"
                        startDecorator={<EditIcon />}
                        onClick={() => openEditForm(user)}
                      >
                        Edit
                      </Button>
                    )}
                    
                    {isAdmin && (
                      <Button 
                        size="sm" 
                        variant="outlined" 
                        color="danger"
                        startDecorator={<DeleteIcon />}
                        onClick={() => openDeleteConfirm(user)}
                      >
                        Delete
                      </Button>
                    )}
                  </CardActions>
                </CardOverflow>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Sheet
          variant="outlined"
          sx={{
            borderRadius: 'sm',
            overflow: 'auto',
            mb: 3,
          }}
        >
          <Table stickyHeader sx={{ '& td': { padding: '12px 16px' } }}>
            <thead>
              <tr>
                <th style={{ width: 240, padding: '12px 16px' }}>User</th>
                <th style={{ padding: '12px 16px' }}>Email</th>
                <th style={{ padding: '12px 16px' }}>Branch</th>
                <th style={{ padding: '12px 16px' }}>Contact</th>
                <th style={{ width: 120, textAlign: 'center', padding: '12px 16px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id}>
                  <td>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      {renderUserAvatar(user, { width: 40, height: 40, fontSize: '1rem' })}
                      <Box>
                        <Typography level="body-sm" sx={{ fontWeight: 'md' }}>
                          {user.full_name || user.username}
                        </Typography>
                        {renderRoleChip(user.role)}
                      </Box>
                    </Box>
                  </td>
                  <td>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EmailIcon fontSize="small" color="action" />
                      <Typography level="body-sm">{user.email}</Typography>
                    </Box>
                  </td>
                  <td>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <StorefrontIcon fontSize="small" color="action" />
                      <Typography level="body-sm">{user.branch_name || 'N/A'}</Typography>
                    </Box>
                  </td>
                  <td>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PhoneIcon fontSize="small" color="action" />
                      <Typography level="body-sm">{user.phone || 'No phone'}</Typography>
                    </Box>
                  </td>
                  <td>
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                      <IconButton
                        variant="soft"
                        color="neutral"
                        size="sm"
                        onClick={() => openDetailsView(user)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                      
                      {isAdmin && (
                        <>
                          <IconButton
                            variant="soft"
                            color="primary"
                            size="sm"
                            onClick={() => openEditForm(user)}
                          >
                            <EditIcon />
                          </IconButton>
                          
                          <IconButton
                            variant="soft"
                            color="danger"
                            size="sm"
                            onClick={() => openDeleteConfirm(user)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </>
                      )}
                    </Box>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Sheet>
      )}
      
      {/* User Details Modal */}
      {selectedUser && (
        <UserDetails 
          open={detailsOpen} 
          onClose={() => setDetailsOpen(false)} 
          user={selectedUser}
          onEdit={isAdmin ? () => {
            setDetailsOpen(false);
            openEditForm(selectedUser);
          } : undefined}
        />
      )}
      
      {/* User Form Modal */}
      <UserForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSaveUser}
        user={formMode === 'edit' ? selectedUser : null}
        mode={formMode}
        loading={actionLoading}
        branches={branches}
      />
      
      {/* Delete Confirmation Modal */}
      <Modal open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <ModalDialog variant="outlined" role="alertdialog">
          <ModalClose />
          <Typography component="h2" level="title-lg">
            Confirm Deletion
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Typography level="body-md" mb={2}>
            Are you sure you want to delete user <strong>{selectedUser?.full_name || selectedUser?.username}</strong>?
            This action cannot be undone.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              color="neutral"
              onClick={() => setDeleteConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="solid"
              color="danger"
              onClick={handleDeleteUser}
              loading={actionLoading}
            >
              Delete User
            </Button>
          </Box>
        </ModalDialog>
      </Modal>
    </Box>
  );
};

export default CompanyDirectory; 