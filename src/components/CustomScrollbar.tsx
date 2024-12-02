import React, { ReactNode, CSSProperties } from 'react';
import { Box, SxProps, Theme } from '@mui/material';

interface CustomScrollbarProps {
  children: ReactNode;
  sx?: SxProps<Theme>;
  style?: CSSProperties;
  height?: string | number;
  width?: string | number;
}

export const CustomScrollbar: React.FC<CustomScrollbarProps> = ({
  children,
  sx,
  style,
  height = '100%',
  width = '100%'
}) => {
  return (
    <Box
      sx={{
        height,
        width,
        overflowY: 'auto',
        '&::-webkit-scrollbar': {
          width: '8px',
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius: '4px'
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'var(--accent-blue, #2c7be5)',
          borderRadius: '4px',
          '&:hover': {
            backgroundColor: 'var(--accent-purple, #6b5ecd)'
          }
        },
        scrollbarWidth: 'thin',
        scrollbarColor: 'var(--accent-blue, #2c7be5) rgba(255,255,255,0.1)',
        ...sx
      }}
      style={style}
    >
      {children}
    </Box>
  );
};

export default CustomScrollbar;
