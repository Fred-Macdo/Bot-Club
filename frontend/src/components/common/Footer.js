import React from 'react';
import { 
  Box, 
  Container, 
  Grid, 
  Typography, 
  Link, 
  Divider,
  useTheme
} from '@mui/material';
import { 
  Twitter as TwitterIcon, 
  LinkedIn as LinkedInIcon, 
  GitHub as GitHubIcon, 
  Facebook as FacebookIcon 
} from '@mui/icons-material';
import logo from '../../assets/images/bot-logo.png';

const Footer = () => {
  const theme = useTheme();
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: ['Features', 'Pricing', 'Testimonials', 'FAQ'],
    resources: ['Blog', 'Documentation', 'Community', 'Support'],
    company: ['About Us', 'Careers', 'Contact', 'Legal'],
    legal: ['Terms', 'Privacy', 'Cookies', 'Licenses'],
  };

  return (
    <Box 
      component="footer" 
      sx={{ 
        bgcolor: theme.palette.primary.main, 
        color: theme.palette.secondary.main,
        pt: 6,
        pb: 3 
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Logo and Description */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box component="img" src={logo} alt="Bot Club" sx={{ height: 40, mr: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                BOT CLUB
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ mb: 2, opacity: 0.7, maxWidth: 300 }}>
              Empowering traders with cutting-edge automated trading solutions since 2023.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Link href="#" sx={{ color: theme.palette.secondary.main }}>
                <TwitterIcon />
              </Link>
              <Link href="#" sx={{ color: theme.palette.secondary.main }}>
                <LinkedInIcon />
              </Link>
              <Link href="#" sx={{ color: theme.palette.secondary.main }}>
                <GitHubIcon />
              </Link>
              <Link href="#" sx={{ color: theme.palette.secondary.main }}>
                <FacebookIcon />
              </Link>
            </Box>
          </Grid>

          {/* Footer Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <Grid item xs={6} sm={3} md={2} key={category}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Typography>
              <Box component="ul" sx={{ listStyle: 'none', p: 0 }}>
                {links.map((link) => (
                  <Box component="li" key={link} sx={{ mb: 1 }}>
                    <Link 
                      href="#" 
                      underline="hover" 
                      sx={{ 
                        color: theme.palette.secondary.main,
                        opacity: 0.7,
                        '&:hover': { opacity: 1 }
                      }}
                    >
                      {link}
                    </Link>
                  </Box>
                ))}
              </Box>
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: 3, bgcolor: 'rgba(245, 237, 216, 0.2)' }} />

        {/* Footer Bottom */}
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'center', sm: 'center' },
            gap: 2
          }}
        >
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            © {currentYear} Bot Club. All rights reserved.
          </Typography>
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Link 
              href="#" 
              underline="hover" 
              sx={{ 
                color: theme.palette.secondary.main, 
                opacity: 0.7,
                fontSize: '0.875rem',
                '&:hover': { opacity: 1 }
              }}
            >
              Terms
            </Link>
            <Link 
              href="#" 
              underline="hover" 
              sx={{ 
                color: theme.palette.secondary.main, 
                opacity: 0.7,
                fontSize: '0.875rem',
                '&:hover': { opacity: 1 }
              }}
            >
              Privacy
            </Link>
            <Link 
              href="#" 
              underline="hover" 
              sx={{ 
                color: theme.palette.secondary.main, 
                opacity: 0.7,
                fontSize: '0.875rem',
                '&:hover': { opacity: 1 }
              }}
            >
              Cookies
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;