import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import NotificationsIcon from '@mui/icons-material/Notifications';
import HelpIcon from '@mui/icons-material/Help';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';
import DeleteIcon from '@mui/icons-material/Delete';
import ArchiveIcon from '@mui/icons-material/Archive';

// Admin Controls Component
const AdminControls = () => {
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  
  const handleClearArchive = async () => {
    try {
      setLoading(true);
      
      // Call the clear archive endpoint
      const response = await axios.delete('/api/admin/clear-archive');
      
      setMessage({
        type: 'success',
        text: `Archive cleared successfully. ${response.data.deletedItems.total} items removed.`
      });
      
      setArchiveDialogOpen(false);
    } catch (error) {
      console.error('Clear archive error:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to clear archive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography level="h4" sx={{ mb: 2 }}>Admin Controls</Typography>

      {message && (
        <Alert 
          color={message.type === 'success' ? 'success' : 'danger'} 
          sx={{ mb: 2 }}
          onClose={() => setMessage(null)}
        >
          {message.text}
        </Alert>
      )}

      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Typography level="title-md" sx={{ mb: 2 }}>Danger Zone</Typography>
          <Stack spacing={2}>
            <Button
              variant="soft"
              color="danger"
              startDecorator={<DeleteIcon />}
              onClick={() => setResetDialogOpen(true)}
            >
              Reset All Passwords
            </Button>
            
            <Button
              variant="soft"
              color="neutral"
              startDecorator={<ArchiveIcon />}
              onClick={() => setArchiveDialogOpen(true)}
            >
              Clear Archive
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Reset Passwords Dialog */}
      <Modal open={resetDialogOpen} onClose={() => setResetDialogOpen(false)}>
        <ModalDialog variant="outlined" role="alertdialog">
          <ModalClose />
          <Typography level="h2">
            Reset All Passwords
          </Typography>
          <Typography level="body-md" sx={{ mt: 1, mb: 2 }}>
            This action will reset all user passwords to the default password. Users will need to change their passwords after logging in.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', pt: 2 }}>
            <Button variant="plain" color="neutral" onClick={() => setResetDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="solid" color="danger" loading={loading}>
              Reset All Passwords
            </Button>
          </Box>
        </ModalDialog>
      </Modal>

      {/* Clear Archive Dialog */}
      <Modal open={archiveDialogOpen} onClose={() => setArchiveDialogOpen(false)}>
        <ModalDialog variant="outlined" role="alertdialog">
          <ModalClose />
          <Typography level="h2">
            Clear Archive
          </Typography>
          <Typography level="body-md" sx={{ mt: 1, mb: 2 }}>
            This action will permanently delete all archived deliveries and requests. This cannot be undone.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', pt: 2 }}>
            <Button variant="plain" color="neutral" onClick={() => setArchiveDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="solid" color="danger" loading={loading} onClick={handleClearArchive}>
              Clear Archive
            </Button>
          </Box>
        </ModalDialog>
      </Modal>
    </Box>
  );
}; 