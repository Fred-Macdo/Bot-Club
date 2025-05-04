import React from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  IconButton, 
  Typography, 
  Box,
  useTheme
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import Button from './Button';

const Modal = ({ 
  open, 
  onClose, 
  title, 
  actions,
  maxWidth = 'sm',
  fullWidth = true,
  children, 
  ...props 
}) => {
  const theme = useTheme();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      PaperProps={{
        sx: {
          borderRadius: 2,
          bgcolor: theme.palette.background.paper,
        }
      }}
      {...props}
    >
      <DialogTitle sx={{ 
        m: 0, 
        p: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            color: theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers sx={{ p: 3 }}>
        <Box>
          {children}
        </Box>
      </DialogContent>
      
      {actions && (
        <DialogActions sx={{ p: 2 }}>
          {actions}
        </DialogActions>
      )}
    </Dialog>
  );
};

// Usage example
export const ModalExample = () => {
  const [open, setOpen] = React.useState(false);
  
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  
  const modalActions = (
    <>
      <Button variant="outlined" color="primary" onClick={handleClose}>
        Cancel
      </Button>
      <Button variant="contained" color="accent" onClick={handleClose}>
        Confirm
      </Button>
    </>
  );
  
  return (
    <>
      <Button variant="contained" color="primary" onClick={handleOpen}>
        Open Modal
      </Button>
      
      <Modal
        open={open}
        onClose={handleClose}
        title="Confirmation"
        actions={modalActions}
      >
        <Typography>
          Are you sure you want to perform this action?
        </Typography>
      </Modal>
    </>
  );
};

export default Modal;