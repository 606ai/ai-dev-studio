import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Grid,
  Button,
  useTheme,
  alpha,
} from '@mui/material';
import { motion } from 'framer-motion';
import StorageIcon from '@mui/icons-material/Storage';
import WarningIcon from '@mui/icons-material/Warning';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';

const MotionCard = motion(Card);

interface StorageStats {
  used: number;
  total: number;
  largeFiles: number;
  oldFiles: number;
}

interface StorageDashboardProps {
  stats: StorageStats;
}

const StorageDashboard: React.FC<StorageDashboardProps> = ({ stats }) => {
  const theme = useTheme();
  const usedPercentage = (stats.used / stats.total) * 100;

  const storageCards = [
    {
      title: 'Large Files',
      value: stats.largeFiles,
      icon: WarningIcon,
      color: theme.palette.warning.main,
      action: 'Review',
    },
    {
      title: 'Old Files',
      value: stats.oldFiles,
      icon: AutorenewIcon,
      color: theme.palette.info.main,
      action: 'Clean Up',
    },
  ];

  return (
    <Box sx={{ py: 4 }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          background: 'linear-gradient(45deg, #2D9CDB 30%, #56CCF2 90%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          mb: 4,
        }}
      >
        Storage Management
      </Typography>

      {/* Main Storage Card */}
      <MotionCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        sx={{
          mb: 4,
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.background.paper,
            0.8
          )} 0%, ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <StorageIcon
              sx={{
                fontSize: 40,
                mr: 2,
                color: theme.palette.primary.main,
              }}
            />
            <Box>
              <Typography variant="h6">OneDrive Storage</Typography>
              <Typography variant="body2" color="text.secondary">
                {stats.used}GB / {stats.total}GB Used
              </Typography>
            </Box>
          </Box>

          <Box sx={{ position: 'relative', mt: 2 }}>
            <LinearProgress
              variant="determinate"
              value={usedPercentage}
              sx={{
                height: 10,
                borderRadius: 5,
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                '& .MuiLinearProgress-bar': {
                  background: 'linear-gradient(45deg, #2D9CDB 30%, #56CCF2 90%)',
                  borderRadius: 5,
                },
              }}
            />
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 1 }}
            >
              {usedPercentage.toFixed(1)}% Used
            </Typography>
          </Box>
        </CardContent>
      </MotionCard>

      {/* Storage Info Cards */}
      <Grid container spacing={3}>
        {storageCards.map((card, index) => (
          <Grid item xs={12} sm={6} key={card.title}>
            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * (index + 1) }}
              sx={{
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.background.paper,
                  0.8
                )} 0%, ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
                backdropFilter: 'blur(10px)',
                border: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
                transition: 'transform 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                },
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <card.icon
                      sx={{
                        fontSize: 30,
                        mr: 2,
                        color: card.color,
                      }}
                    />
                    <Box>
                      <Typography variant="h6">{card.title}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {card.value} files detected
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    variant="outlined"
                    size="small"
                    sx={{
                      borderColor: card.color,
                      color: card.color,
                      '&:hover': {
                        borderColor: card.color,
                        backgroundColor: alpha(card.color, 0.1),
                      },
                    }}
                  >
                    {card.action}
                  </Button>
                </Box>
              </CardContent>
            </MotionCard>
          </Grid>
        ))}
      </Grid>

      {/* Cleanup Action */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Button
          variant="contained"
          startIcon={<DeleteSweepIcon />}
          sx={{
            background: 'linear-gradient(45deg, #2D9CDB 30%, #56CCF2 90%)',
            px: 4,
            py: 1.5,
          }}
        >
          Start Cleanup
        </Button>
      </Box>
    </Box>
  );
};

export default StorageDashboard;
