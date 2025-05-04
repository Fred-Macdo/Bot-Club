import React from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  Avatar, 
  useTheme
} from '@mui/material';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';

const Testimonials = () => {
  const theme = useTheme();

  const testimonials = [
    {
      text: "Bot Club has completely transformed my trading. I don't trade any more because I lost all my money and my wife filed for divorce.",
      author: "Michael T.",
      role: "Bus Driver",
      avatar: "/assets/images/avatars/avatar1.jpg"
    },
    {
      text: "The strategy builder is intuitive yet powerful. I've created custom bots that perfectly match my trading style.",
      author: "Sarah J.",
      role: "Investment Advisor",
      avatar: "/assets/images/avatars/avatar2.jpg"
    },
    {
      text: "As a financial institution, we needed reliable automation. This ain't it chief.",
      author: "Robert L.",
      role: "Financial Director",
      avatar: "/assets/images/avatars/avatar3.jpg"
    }
  ];

  return (
    <Box 
      sx={{ 
        py: { xs: 6, md: 10 }, 
        bgcolor: theme.palette.primary.main,
        color: theme.palette.secondary.main
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography 
            variant="h3" 
            component="h2" 
            sx={{ 
              mb: 2, 
              fontWeight: 700
            }}
          >
            What Our Traders Say
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 2, 
              color: theme.palette.accent.main,
              maxWidth: 700,
              mx: 'auto',
              fontWeight: 400
            }}
          >
            Join thousands of successful traders who have transformed their trading with Bot Club
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {testimonials.map((testimonial, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Box 
                sx={{ 
                  p: 4, 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  borderRadius: 2,
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${theme.palette.accent.main}`,
                  boxShadow: 2,
                  position: 'relative'
                }}
              >
                <FormatQuoteIcon 
                  sx={{ 
                    color: theme.palette.accent.main,
                    fontSize: 40,
                    opacity: 0.5,
                    position: 'absolute',
                    top: 16,
                    left: 16
                  }} 
                />
                
                <Typography 
                  variant="body1" 
                  sx={{ 
                    mb: 3, 
                    mt: 3,
                    pl: 4,
                    flexGrow: 1,
                    fontStyle: 'italic',
                    lineHeight: 1.6
                  }}
                >
                  "{testimonial.text}"
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                  <Avatar 
                    src={testimonial.avatar} 
                    alt={testimonial.author}
                    sx={{ 
                      width: 50, 
                      height: 50,
                      bgcolor: theme.palette.accent.main,
                      color: theme.palette.primary.main,
                      border: `2px solid ${theme.palette.accent.main}`,
                      mr: 2
                    }}
                  />
                  <Box>
                    <Typography 
                      variant="subtitle1"
                      sx={{ 
                        fontWeight: 600,
                        color: theme.palette.accent.main
                      }}
                    >
                      {testimonial.author}
                    </Typography>
                    <Typography 
                      variant="body2"
                      sx={{ 
                        color: theme.palette.secondary.main,
                        opacity: 0.7
                      }}
                    >
                      {testimonial.role}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default Testimonials;